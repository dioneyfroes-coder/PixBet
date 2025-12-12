import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { localeMessages } from '../app/i18n/config';
import type { LocaleCode, TranslationMessages } from '../app/i18n/config';

const OUTPUT_DIR = path.resolve(process.cwd(), 'i18n-json');

async function exportTranslations() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const entries = Object.entries(localeMessages) as Array<[LocaleCode, TranslationMessages]>;

  await Promise.all(
    entries.map(async ([locale, messages]) => {
      const filePath = path.join(OUTPUT_DIR, `${locale}.json`);
      await writeFile(filePath, `${JSON.stringify(messages, null, 2)}\n`, 'utf8');
    })
  );

  // export complete
}

exportTranslations().catch((error) => {
  console.error('Failed to export translations');
  console.error(error);
  process.exit(1);
});
