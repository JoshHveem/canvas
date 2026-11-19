const path = require('node:path');
const fs = require('node:fs');

// Evaluate the actual URL loaded by legacy jQuery.getScript callers. Compiling
// source here would conceal import/export syntax errors in the deployed script.
module.exports = fs.readFileSync(path.resolve(__dirname, '../components/report-mixins.js'), 'utf8');
