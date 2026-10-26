const path = require('node:path');
const { buildSync } = require('../../../feature-manager/node_modules/esbuild');

// Exercise the same module composition and browser target as the feature build.
module.exports = buildSync({
  entryPoints: [path.resolve(__dirname, '../components/report-mixins.js')],
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  target: 'es2018'
}).outputFiles[0].text;
