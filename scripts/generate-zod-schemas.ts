#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

type OpenAPIDoc = {
  components?: {
    schemas?: Record<string, unknown>;
  };
};

const input = path.resolve(process.cwd(), 'docs da backend/openapi.json');
const outDir = path.resolve(process.cwd(), 'src/lib/schemas');
const outFile = path.join(outDir, 'generated-schemas.ts');

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function schemaToZod(
  name: string,
  schema: unknown,
  components: unknown,
  refs = new Map<string, string>()
): string {
  if (schema == null) return 'z.any()';
  const s = schema as Record<string, any>;

  function resolveRef(ref: string) {
    return safeName(String(ref).replace('#/components/schemas/', ''));
  }

  if ((s as any).$ref) {
    return resolveRef((s as any).$ref);
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
      if (s.enum) {
        return wrapNullable(
          `z.enum([${(s.enum as any[]).map((v) => `"${String(v)}"`).join(', ')}] as const)`
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
      const ss = s;
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
        return wrapNullable('z.record(z.any())');
      }
      const props = Object.entries(ss.properties as Record<string, unknown>).map(
        ([propName, propSchema]) => {
          const required = Array.isArray(ss.required) && ss.required.includes(propName);
          const z = schemaToZod(propName, propSchema, components, refs);
          return `  ${JSON.stringify(propName)}: ${required ? z : `${z}.optional()`}`;
        }
      );
      return wrapNullable(`z.object({\n${props.join(',\n')}\n})`);
    }
    default: {
      if (Array.isArray(s.allOf)) {
        const parts = s.allOf.map((sd: any, i: number) =>
          schemaToZod(name + 'AllOf' + i, sd, components, refs)
        );
        const inter = parts.reduce((acc, p) => `z.intersection(${acc}, ${p})`);
        return wrapNullable(inter);
      }
      if (Array.isArray(s.oneOf) || Array.isArray(s.anyOf)) {
        const arr = (s.oneOf || s.anyOf) as any[];
        const parts = arr.map((sd, i) => schemaToZod(name + 'Union' + i, sd, components, refs));
        return wrapNullable(`z.union([${parts.join(', ')}])`);
      }
      return 'z.any()';
    }
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function generate(doc: OpenAPIDoc) {
  const components = doc.components || {};
  const schemas = components.schemas || {};

  const lines: string[] = [];
  lines.push('// Auto-generated from docs da backend/openapi.json — do not edit manually');
  lines.push("import { z } from 'zod';\n");

  Object.entries(schemas).forEach(([key, value]) => {
    const name = safeName(key);
    try {
      const zodExp = schemaToZod(name, value, components);
      lines.push(`export const ${name} = ${zodExp};\n`);
    } catch {
      lines.push(`// failed to generate schema for ${key} - falling back to z.any()`);
      lines.push(`export const ${name} = z.any();\n`);
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
