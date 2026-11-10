const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { buildSync } = require('../../../feature-manager/node_modules/esbuild');
const moduleObject = { exports: {} };
const code = buildSync({ entryPoints: [path.join(__dirname, '../print-media-links.js')], bundle: true, write: false, platform: 'node', format: 'cjs' }).outputFiles[0].text;
vm.runInNewContext(code, { module: moduleObject, exports: moduleObject.exports, URL });
const { printableMediaUrl } = moduleObject.exports;

test('YouTube embeds from the sample PDFs become printable watch links', () => {
  assert.equal(printableMediaUrl('https://www.youtube.com/embed/S71mzIZyCc8?rel=0'), 'https://www.youtube.com/watch?v=S71mzIZyCc8');
  assert.equal(printableMediaUrl('https://www.youtube-nocookie.com/embed/BD0U6Df3ReA'), 'https://www.youtube.com/watch?v=BD0U6Df3ReA');
  assert.equal(printableMediaUrl('https://youtu.be/S71mzIZyCc8'), 'https://www.youtube.com/watch?v=S71mzIZyCc8');
});

test('Vimeo access hashes and Canvas/Kaltura media URLs survive conversion', () => {
  assert.equal(printableMediaUrl('https://player.vimeo.com/video/123?h=secret'), 'https://vimeo.com/123/secret');
  const kaltura = 'https://cdnapisec.kaltura.com/p/123/embedIframeJs/uiconf_id/456/entry_id/1_abc';
  assert.equal(printableMediaUrl(kaltura), kaltura);
  assert.equal(printableMediaUrl('/media_objects_iframe/m-123', 'https://btech.instructure.com/courses/1'), 'https://btech.instructure.com/media_objects_iframe/m-123');
  assert.equal(printableMediaUrl('/files/video.mp4', 'https://btech.instructure.com/', true), 'https://btech.instructure.com/files/video.mp4');
});

test('non-media frames and unsafe or temporary URLs do not become printable video links', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'blob:https://example.com/id', 'https://www.youtube.com.evil.test/embed/id', 'https://example.com/map', undefined]) {
    assert.equal(printableMediaUrl(url, 'https://btech.instructure.com/'), null);
  }
});
