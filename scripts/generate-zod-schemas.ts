#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

type OpenAPIDoc = {
  components?: {
    schemas?: Record<string, unknown>;
  };
};

const input = path.resolve(process.cwd(), 'docs da backend/openapi.json');
const outDir = path.resolve(process.cwd(), 'app/lib/schemas');
const outFile = path.join(outDir, 'generated-schemas.ts');

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

function schemaToZod(
  name: string,
  schema: unknown,
  components: unknown,
  refs = new Map<string, string>()
): string {
  if (schema == null) return 'z.unknown()';
  const s = schema as Record<string, unknown>;

  function resolveRef(ref: string) {
    return safeName(String(ref).replace('#/components/schemas/', ''));
  }

  if (typeof (s as Record<string, unknown>)['$ref'] === 'string') {
    return resolveRef(String((s as Record<string, unknown>)['$ref']));
  }

  const wrapNullable = (expr: string) => (s.nullable ? `${expr}.nullable()` : expr);

  const stringWithFormat = () => {
    const fmt = s.format;
    if (!fmt) return 'z.string()';
    switch (fmt) {
      case 'uuid':
        return 'z.string().uuid()';
      case 'email':
        return 'z.string().email()';
      case 'uri':
      case 'url':
        return 'z.string().url()';
      case 'date-time':
      case 'date':
        return 'z.string()';
      default:
        return 'z.string()';
    }
  };

  switch (s.type) {
    case 'string':
      if (Array.isArray((s as Record<string, unknown>).enum)) {
        const arrEnum = (s as Record<string, unknown>).enum as unknown[];
        return wrapNullable(
          `z.enum([${arrEnum.map((v) => `"${String(v)}"`).join(', ')}] as const)`
        );
      }
      return wrapNullable(stringWithFormat());
    case 'number':
    case 'integer':
      return wrapNullable('z.number()');
    case 'boolean':
      return wrapNullable('z.boolean()');
    case 'array': {
      const items = schemaToZod(name + 'Item', s.items, components, refs);
      return wrapNullable(`z.array(${items})`);
    }
    case 'object': {
      const ss = s as Record<string, unknown>;
      if (!ss.properties) {
        if (ss.additionalProperties) {
          const val = schemaToZod(
            name + 'Value',
            ss.additionalProperties === true ? null : ss.additionalProperties,
            components,
            refs
          );
          return wrapNullable(`z.record(${val})`);
        }
        return wrapNullable('z.record(z.string(), z.unknown())');
      }
      const props = Object.entries(ss.properties as Record<string, unknown>).map(
        ([propName, propSchema]) => {
          const required =
            Array.isArray(ss.required) && (ss.required as unknown[]).includes(propName);
          const z = schemaToZod(propName, propSchema, components, refs);
          return `  ${JSON.stringify(propName)}: ${required ? z : `${z}.optional()`}`;
        }
      );
      return wrapNullable(`z.object({\n${props.join(',\n')}\n})`);
    }
    default: {
      if (Array.isArray((s as Record<string, unknown>).allOf)) {
        const all = (s as Record<string, unknown>).allOf as unknown[];
        const parts = all.map((sd, i) => schemaToZod(name + 'AllOf' + i, sd, components, refs));
        const inter = parts.reduce((acc, p) => `z.intersection(${acc}, ${p})`);
        return wrapNullable(inter);
      }
      if (
        Array.isArray((s as Record<string, unknown>).oneOf) ||
        Array.isArray((s as Record<string, unknown>).anyOf)
      ) {
        const arr =
          ((s as Record<string, unknown>).oneOf as unknown[]) ||
          ((s as Record<string, unknown>).anyOf as unknown[]);
        const parts = arr.map((sd, i) => schemaToZod(name + 'Union' + i, sd, components, refs));
        return wrapNullable(`z.union([${parts.join(', ')}])`);
      }
      return 'z.unknown()';
    }
  }
}

function generate(doc: OpenAPIDoc) {
  const components = doc.components || {};
  const schemas = components.schemas || {};

  // collect refs for each schema to build a dependency graph
  function collectRefsIn(obj: unknown, acc: Set<string>) {
    if (obj == null) return;
    if (typeof obj === 'object') {
      if (Array.isArray(obj)) return obj.forEach((it) => collectRefsIn(it, acc));
      const o = obj as Record<string, unknown>;
      if (typeof o.$ref === 'string') {
        acc.add(safeName(String(o.$ref).replace('#/components/schemas/', '')));
      }
      Object.values(o).forEach((v) => collectRefsIn(v, acc));
    }
  }

  const deps = new Map<string, Set<string>>();
  Object.entries(schemas).forEach(([k, v]) => {
    const name = safeName(k);
    const s = new Set<string>();
    collectRefsIn(v, s);
    deps.set(name, s);
  });

  // topological sort (Kahn). If cycle detected, return null.
  function topoSort(map: Map<string, Set<string>>): string[] | null {
    const nodes = Array.from(map.keys());
    const inDegree = new Map<string, number>();
    const adj = new Map<string, Set<string>>();
    nodes.forEach((n) => {
      inDegree.set(n, 0);
      adj.set(n, new Set());
    });
    // build inverted edges: for each a -> deps {b,c}, add b -> a and c -> a
    map.forEach((depsSet, a) => {
      depsSet.forEach((b) => {
        if (!adj.has(b)) adj.set(b, new Set());
        adj.get(b)!.add(a);
        inDegree.set(a, (inDegree.get(a) || 0) + 1);
      });
    });

    const queue: string[] = [];
    inDegree.forEach((deg, n) => {
      if (deg === 0) queue.push(n);
    });
    const out: string[] = [];
    while (queue.length) {
      const n = queue.shift()!;
      out.push(n);
      const dependents = adj.get(n) || new Set();
      dependents.forEach((m) => {
        inDegree.set(m, (inDegree.get(m) || 0) - 1);
        if (inDegree.get(m) === 0) queue.push(m);
      });
    }
    if (out.length !== nodes.length) return null;
    return out;
  }

  const sortedNames = topoSort(deps) || Object.keys(schemas).map(safeName);

  const lines: string[] = [];
  lines.push('// Auto-generated from docs da backend/openapi.json — do not edit manually');
  lines.push("import { z } from 'zod';\n");

  // emit schemas in dependency order when possible
  sortedNames.forEach((name) => {
    const originalKey = Object.keys(schemas).find((k) => safeName(k) === name) as
      | string
      | undefined;
    const value = originalKey ? (schemas as Record<string, unknown>)[originalKey] : undefined;
    try {
      const zodExp = schemaToZod(name, value, components);
      lines.push(`export const ${name} = ${zodExp};\n`);
    } catch {
      lines.push(
        `// failed to generate schema for ${originalKey || name} - falling back to z.unknown()`
      );
      lines.push(`export const ${name} = z.unknown();\n`);
    }
  });

  lines.push('\nexport const schemas = {');
  Object.keys(schemas).forEach((k) => {
    lines.push(`  ${safeName(k)},`);
  });
  lines.push('} as const;\n');

  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(input)) {
    console.error('OpenAPI JSON not found at', input);
    process.exit(1);
  }
  const raw = fs.readFileSync(input, 'utf-8');
  const doc = JSON.parse(raw);
  const out = generate(doc);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, out, 'utf-8');
  // generation complete
}

main();
