const marker = 'data-btech-print-media-link';
const styleId = 'btech-print-media-links-style';

export function printableMediaUrl(value, baseUrl, directMedia = false) {
  let url;
  try { url = new URL(value, baseUrl); } catch { return null; }
  if (!value || !['https:', 'http:'].includes(url.protocol)) return null;
  const host = url.hostname.toLowerCase();
  if (/(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be)$/.test(host)) {
    const id = host === 'youtu.be' ? url.pathname.split('/')[1]
      : url.pathname.match(/^\/(?:embed|shorts|v)\/([^/]+)/)?.[1] || url.searchParams.get('v');
    if (id && /^[\w-]+$/.test(id)) return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    return null;
  }
  if (host === 'player.vimeo.com') {
    const id = url.pathname.match(/^\/video\/(\d+)/)?.[1];
    if (id) {
      // Unlisted Vimeo videos require the embed's access hash.
      return `https://vimeo.com/${id}${url.searchParams.has('h') ? '/' + encodeURIComponent(url.searchParams.get('h')) : ''}`;
    }
  }
  if (directMedia || /(^|\.)(vimeo\.com|kaltura\.com|instructuremedia\.com)$/.test(host) ||
      host === 'kaltura.bridgetools.dev' ||
      /(^|\.)instructure\.com$/.test(host) && /\/media_(?:objects|attachments)(?:_iframe)?\//.test(url.pathname)) return url.href;
  return null;
}

// Only called for the accreditation tool's export iframe, never the live page.
export function initialisePrintMediaLinks(sourceDocument) {
  const content = sourceDocument.body;
  if (!content || sourceDocument.getElementById(styleId)) return;
  const style = sourceDocument.createElement('style');
  style.id = styleId;
  style.textContent = `
    [${marker}] { display: none !important; }
    @media print {
      [${marker}] { display: block !important; overflow-wrap: anywhere; margin: 8px 0; }
      [${marker}] a { color: #111 !important; text-decoration: underline; }
    }
  `;
  sourceDocument.head.append(style);
  const links = new Map();
  const scan = () => {
    for (const [media, link] of links) {
      if (!content.contains(media)) { link.remove(); links.delete(media); }
    }
    content.querySelectorAll('.user_content iframe, .user_content video, .user_content audio').forEach(media => {
      const value = media.getAttribute('src') || media.querySelector('source[src]')?.getAttribute('src');
      const url = printableMediaUrl(value, sourceDocument.baseURI, media.tagName !== 'IFRAME');
      let link = links.get(media);
      if (!url) { link?.remove(); links.delete(media); return; }
      if (!link) {
        link = sourceDocument.createElement('span');
        link.setAttribute(marker, '');
        const anchor = sourceDocument.createElement('a');
        link.append(anchor);
        links.set(media, link);
      }
      const anchor = link.firstElementChild;
      if (anchor.getAttribute('href') !== url) {
        anchor.href = url;
        anchor.textContent = url;
      }
      // Keep the link outside wrappers Canvas may hide when printing.
      let wrapper = media;
      for (let parent = media.parentElement; parent && !parent.classList.contains('user_content'); parent = parent.parentElement) {
        if (parent.matches('.instructure_resizable, .media_comment, [data-test-id="youtube-migration-container"]')) wrapper = parent;
      }
      // Several players can share a wrapper; do not continually reorder their
      // links in response to our own observer notifications.
      if (link.parentElement !== wrapper.parentElement) wrapper.before(link);
    });
  };
  scan();
  const Observer = sourceDocument.defaultView.MutationObserver;
  const observer = new Observer(scan);
  observer.observe(content, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  sourceDocument.defaultView.addEventListener('beforeprint', scan);
}
