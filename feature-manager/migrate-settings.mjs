import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(directory, 'features.json');
const manifest = JSON.parse(await fs.readFile(outputPath, 'utf8'));
if (manifest.settings) {
  console.log('features.json already uses folder settings.');
  process.exit(0);
}
if (!Array.isArray(manifest.features)) throw new Error('Expected a legacy features array.');
const settings = {};
for (const feature of manifest.features) {
  const { name, ...rule } = feature;
  if (!settings[name]) settings[name] = rule;
  else if (settings[name].rules) settings[name].rules.push(rule);
  else settings[name] = { rules: [settings[name], rule] };
}
await fs.writeFile(outputPath, `${JSON.stringify({ schemaVersion: 2, settings }, null, 2)}\n`);
console.log(`Migrated ${manifest.features.length} rules to ${Object.keys(settings).length} feature-folder settings.`);
