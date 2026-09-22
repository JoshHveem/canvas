import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(directory, '..', 'scripts_v2.js');
const outputPath = path.join(directory, 'features.json');
const source = await fs.readFile(sourcePath, 'utf8');
const start = source.indexOf('var features = [');
const end = source.indexOf('\n  ];', start);
if (start < 0 || end < 0) throw new Error('Could not find the v2 feature manifest.');

// The manifest contains only local literals and RegExp values.  It is read from
// this trusted repository solely to seed the JSON source of truth.
const literal = source.slice(source.indexOf('[', start), end + 4);
const entries = Function(`"use strict"; return (${literal});`)();
const route = (value) => value instanceof RegExp
  ? { source: value.source, flags: value.flags }
  : Array.isArray(value) ? value.map(route) : value;
const folderName = name => {
  let parts = name.split('/');
  if (parts.length > 1 && (parts.at(-1) === 'report' || parts.at(-1) === parts.at(-2))) parts.pop();
  return parts.map(part => part.replace(/([a-z0-9])([A-Z])/g, (_, first, second) => `${first}_${second}`).replaceAll('-', '_').toLowerCase()).join('_');
};
const features = entries.map(({ routes, ...feature }) => ({ name: folderName(feature.name), ...feature, ...(routes ? { routes: route(routes) } : {}) }));
const settings = {};
for (const feature of features) {
  const { name, ...rule } = feature;
  if (!settings[name]) settings[name] = rule;
  else if (settings[name].rules) settings[name].rules.push(rule);
  else settings[name] = { rules: [settings[name], rule] };
}
await fs.writeFile(outputPath, `${JSON.stringify({ schemaVersion: 2, settings }, null, 2)}\n`);
console.log(`Imported ${features.length} rules for ${Object.keys(settings).length} feature folders into ${outputPath}`);
