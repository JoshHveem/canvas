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
const features = entries.map(({ routes, ...feature }) => ({ ...feature, ...(routes ? { routes: route(routes) } : {}) }));
await fs.writeFile(outputPath, `${JSON.stringify({ schemaVersion: 1, features }, null, 2)}\n`);
console.log(`Imported ${features.length} features into ${outputPath}`);
