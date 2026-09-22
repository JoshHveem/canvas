import fs from 'node:fs/promises';
import path from 'node:path';

export async function discoverFeatures(root) {
  const base = path.join(root, 'custom_features_v2');
  const features = [];
  for (const entry of await fs.readdir(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      await fs.access(path.join(base, entry.name, 'main.js'));
      features.push(entry.name);
    } catch {
      // Folders without a root main.js can hold supporting source only.
    }
  }
  return features.sort();
}

export function expandFeatureSettings(names, settings = {}) {
  return names.flatMap(name => {
    const setting = settings[name] || {};
    if (Array.isArray(setting.rules)) {
      const { rules, ...shared } = setting;
      return rules.map(rule => ({ name, ...shared, ...rule }));
    }
    return [{ name, ...setting }];
  });
}
