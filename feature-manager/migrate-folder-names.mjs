import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '..');
const base = path.join(root, 'custom_features_v2');
const manifestPath = path.join(directory, 'features.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
if (!manifest.settings || typeof manifest.settings !== 'object') throw new Error('features.json must contain folder settings.');

const folderName = name => {
  let parts = name.split('/');
  if (parts.length > 1 && (parts.at(-1) === 'report' || parts.at(-1) === parts.at(-2))) parts.pop();
  return parts.map(part => part.replace(/([a-z0-9])([A-Z])/g, (_, first, second) => `${first}_${second}`).replaceAll('-', '_').toLowerCase()).join('_');
};
const renamedSettings = {};
for (const [oldName, setting] of Object.entries(manifest.settings)) {
  const newName = folderName(oldName);
  if (renamedSettings[newName]) throw new Error(`Folder-name collision: ${oldName} -> ${newName}`);
  const oldPath = path.join(base, ...oldName.split('/'));
  const newPath = path.join(base, newName);
  if (oldPath !== newPath) {
    try { await fs.access(newPath); throw new Error(`Destination already exists: ${newName}`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await fs.rename(oldPath, newPath);
  }
  renamedSettings[newName] = setting;
}

async function removeEmptyFolders(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(directory, entry.name);
    await removeEmptyFolders(fullPath);
    if (!(await fs.readdir(fullPath)).length) await fs.rmdir(fullPath);
  }
}
await removeEmptyFolders(base);
await fs.writeFile(manifestPath, `${JSON.stringify({ schemaVersion: 2, settings: renamedSettings }, null, 2)}\n`);
console.log(`Flattened ${Object.keys(renamedSettings).length} feature folders.`);
