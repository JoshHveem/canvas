// Resolve only once Canvas has populated the requested element. Every wait
// disconnects its observer on success or timeout instead of polling forever.
export function waitForElement(selector, root = document, { timeoutMs = 30000 } = {}) {
  const find = () => {
    const elements = $(selector, root);
    return elements.length && String(elements.html() ?? '').trim() ? elements : null;
  };
  const existing = find();
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    let timer;
    const observer = new MutationObserver(() => {
      const elements = find();
      if (elements) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(elements);
      }
    });
    observer.observe(root.documentElement || root, { childList: true, subtree: true, characterData: true });
    timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Canvas element did not become ready: ${selector}`));
    }, timeoutMs);
  });
}
