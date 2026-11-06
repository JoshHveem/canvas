export function waitForRubric(sourceDocument, timeoutMs = 15000) {
  const find = () => {
    const holder = sourceDocument.querySelector('#rubric_holder');
    return holder?.querySelector('.rubric_table tbody tr, .rubric_table .criterion') ? holder : null;
  };
  const existing = find();
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      const holder = find();
      if (!holder) return;
      observer.disconnect();
      clearTimeout(timer);
      resolve(holder);
    });
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error('Canvas did not render a supported rubric for this submission.'));
    }, timeoutMs);
    observer.observe(sourceDocument.body, { childList: true, subtree: true });
  });
}

// Keep the submission document's loaded stylesheets, inline styles, theme
// classes, and CSS variables. Printing a clone through the parent page loses
// Canvas's rubric-specific styles because they belong to this document.
export function prepareRubricDocument(sourceDocument, holder) {
  const rubric = holder.cloneNode(true);
  const originalFields = holder.querySelectorAll('input, textarea, select');
  rubric.querySelectorAll('input, textarea, select').forEach((field, index) => {
    const original = originalFields[index];
    if (original.type === 'hidden') {
      field.remove();
      return;
    }
    const text = sourceDocument.createElement(original.tagName === 'TEXTAREA' ? 'div' : 'span');
    text.className = original.tagName === 'TEXTAREA' ? 'btech-print-field btech-print-comment' : 'btech-print-field';
    text.textContent = original.tagName === 'SELECT'
      ? Array.from(original.selectedOptions, option => option.textContent).join(', ')
      : original.type === 'checkbox' || original.type === 'radio'
        ? (original.checked ? 'Selected' : 'Not selected')
        : original.value;
    field.replaceWith(text);
  });
  rubric.querySelectorAll('script, button, .screenreader-only, .no-print').forEach(element => element.remove());
  rubric.style.display = 'block';
  rubric.style.maxHeight = 'none';
  rubric.style.overflow = 'visible';

  const exportElement = sourceDocument.createElement('main');
  exportElement.id = 'btech-accreditation-rubric-export';
  exportElement.append(rubric);
  const style = sourceDocument.createElement('style');
  style.textContent = `
    @page { margin: 14mm; }
    html, body { min-width: 0 !important; height: auto !important; overflow: visible !important; }
    body { margin: 0 !important; padding: 0 !important; }
    #btech-accreditation-rubric-export { font: 12px/1.45 Arial, sans-serif; color: #111; overflow-wrap: anywhere; }
    #btech-accreditation-rubric-export > p { margin: 0 0 8px; }
    #btech-accreditation-rubric-export #rubric_holder,
    #btech-accreditation-rubric-export .rubric_container { width: auto !important; min-width: 0 !important; max-width: none !important; max-height: none !important; overflow: visible !important; }
    #btech-accreditation-rubric-export .rubric_table { width: 100% !important; border-collapse: collapse; }
    #btech-accreditation-rubric-export th,
    #btech-accreditation-rubric-export td { padding: 8px; vertical-align: top; }
    #btech-accreditation-rubric-export tr { break-inside: avoid; }
    #btech-accreditation-rubric-export .btech-print-field { font: inherit; overflow-wrap: anywhere; }
    #btech-accreditation-rubric-export .btech-print-comment { white-space: pre-wrap; margin-top: 6px; }
    #btech-accreditation-rubric-export .btech-accreditation-comments { padding-top: 12px; }
    #btech-accreditation-rubric-export a { overflow-wrap: anywhere; }
  `;
  sourceDocument.head.append(style);
  sourceDocument.body.replaceChildren(exportElement);
  return exportElement;
}

export async function waitForPrintAssets(sourceDocument, timeoutMs = 10000) {
  const ready = Promise.all([
    sourceDocument.fonts?.ready,
    ...Array.from(sourceDocument.images, image => image.complete ? Promise.resolve() : image.decode().catch(() => {}))
  ]);
  let timer;
  try {
    await Promise.race([
      ready,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Rubric print assets did not finish loading.')), timeoutMs); })
    ]);
  } finally {
    clearTimeout(timer);
  }
}
