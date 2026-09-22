import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'terser';
import { discoverFeatures, expandFeatureSettings } from './feature-discovery.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '..');
const manifest = JSON.parse(await fs.readFile(path.join(directory, 'features.json'), 'utf8'));

const regex = (value) => value && typeof value === 'object' && !Array.isArray(value) && 'source' in value
  ? `/${value.source}/${value.flags || ''}`
  : Array.isArray(value) ? `[${value.map(regex).join(', ')}]` : null;
const value = (feature) => {
  const fields = Object.entries(feature).filter(([key]) => key !== 'routes' && key !== 'enabled');
  if (feature.routes) fields.push(['routes', regex(feature.routes)]);
  return `{ ${fields.map(([key, item]) => `${key}: ${typeof item === 'string' && item.startsWith('/') ? item : JSON.stringify(item)}`).join(', ')} }`;
};
if (!manifest.settings || typeof manifest.settings !== 'object') throw new Error('features.json must contain a settings object. Run npm run migrate:settings once.');
const active = expandFeatureSettings(await discoverFeatures(root), manifest.settings).filter(feature => feature.enabled !== false);
const featureLiteral = `var features = [\n    ${active.map(value).join(',\n    ')}\n  ];`;
const sourcePath = path.join(root, 'scripts_v2.js');
const source = await fs.readFile(sourcePath, 'utf8');
const start = source.indexOf('var features = [');
const end = source.indexOf('\n  ];', start);
if (start < 0 || end < 0) throw new Error('Could not find the v2 feature manifest.');
const generated = source.slice(0, start) + featureLiteral + source.slice(end + 4);
await fs.writeFile(path.join(root, 'scripts_v2.generated.js'), generated);
const minified = await minify(generated, { compress: true, mangle: true, format: { comments: false } });
if (!minified.code) throw new Error('Terser did not produce output.');
await fs.writeFile(path.join(root, 'scripts_v2.min.js'), `${minified.code}\n`);
console.log(`Built ${active.length} enabled features.`);
