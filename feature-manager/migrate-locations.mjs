import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitRoutePresets } from './location-rules.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(directory, 'features.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
let migrated = 0;
for (const setting of Object.values(manifest.settings || {})) {
  const rules = Array.isArray(setting.rules) ? setting.rules : [setting];
  for (const rule of rules) {
    if (!rule.routes) continue;
    const { locations, custom } = splitRoutePresets(rule.routes);
    if (locations.length) { rule.locations = locations; migrated += locations.length; }
    if (custom) rule.routes = custom; else delete rule.routes;
  }
}
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Migrated ${migrated} route patterns into named locations.`);
