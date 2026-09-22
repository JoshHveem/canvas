import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '..');
const jsonPath = path.join(directory, 'features.json');
const publicPath = path.join(directory, 'public');
const send = (response, code, body, type = 'application/json') => response
  .writeHead(code, { 'content-type': type })
  .end(Buffer.isBuffer(body) || typeof body === 'string' ? body : JSON.stringify(body));
const readBody = request => new Promise((resolve, reject) => { let body = ''; request.on('data', chunk => body += chunk); request.on('end', () => resolve(body)); request.on('error', reject); });
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, shell: process.platform === 'win32' }); let out = '';
  child.stdout.on('data', data => out += data); child.stderr.on('data', data => out += data);
  child.on('close', code => code ? reject(new Error(out)) : resolve(out));
});

http.createServer(async (request, response) => {
  try {
    if (request.url === '/api/features' && request.method === 'GET') return send(response, 200, JSON.parse(await fs.readFile(jsonPath, 'utf8')));
    if (request.url === '/api/features' && request.method === 'PUT') {
      const data = JSON.parse(await readBody(request));
      if (!Array.isArray(data.features) || data.features.some(item => typeof item.name !== 'string' || !item.name)) return send(response, 400, { error: 'Every feature needs a name.' });
      await fs.writeFile(jsonPath, `${JSON.stringify(data, null, 2)}\n`); return send(response, 200, data);
    }
    if (request.url === '/api/build' && request.method === 'POST') return send(response, 200, { output: await run('node', ['package-manager/build.mjs']) });
    if (request.url === '/api/status' && request.method === 'GET') return send(response, 200, { output: await run('git', ['status', '--short']) });
    const file = request.url === '/' ? 'index.html' : request.url.slice(1);
    if (!/^[\w.-]+$/.test(file)) return send(response, 404, 'Not found', 'text/plain');
    return send(response, 200, await fs.readFile(path.join(publicPath, file)), file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
  } catch (error) { return send(response, 500, { error: error.message }); }
}).listen(4173, () => console.log('Feature manager: http://localhost:4173'));
