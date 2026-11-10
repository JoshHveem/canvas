export function waitForRubric(sourceDocument, timeoutMs = 15000) {
  const find = () => {
    // Enhanced rubrics can live in a portalled tray outside #rubric_holder.
    // Require criteria, not just the container that also wraps its loading UI.
    const enhanced = sourceDocument.querySelector('[data-testid="enhanced-rubric-assessment-container"]');
    if (enhanced?.querySelector('[data-criterion-id], [data-criterion-score-id], [data-criterion-comment-id]')) return enhanced;
    const react = sourceDocument.querySelector('.react_rubric_container');
    if (react?.querySelector('tbody tr, [data-criterion-id]')) return react;
    const holder = sourceDocument.querySelector('#rubric_holder');
    return holder?.querySelector('.rubric_table tbody tr, .rubric_table .criterion') ? holder : null;
  };
  const existing = find();
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    let opened = false;
    const openRubric = () => {
      const control = sourceDocument.querySelector('.assess_submission_link');
      if (opened || !control || control.disabled) return;
      opened = true;
      control.click();
    };
    const observer = new MutationObserver(() => {
      const holder = find();
      if (!holder) {
        openRubric();
        return;
      }
      observer.disconnect();
      clearTimeout(timer);
      resolve(holder);
    });
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error('Canvas did not render a supported rubric for this submission.'));
    }, timeoutMs);
    observer.observe(sourceDocument.body, { childList: true, subtree: true, attributes: true });
    // Canvas may not mount an assessment until its Show Rubric control opens.
    // Only open this control in the export iframe; never click rating/save UI.
    openRubric();
  });
}

// Some submission views do not mount the legacy rubric table. Use Canvas's
// assessed rubric data instead of depending on a particular submission UI.
export async function loadAssessedRubric(sourceDocument, { courseId, assignmentId, userId }, request = fetch) {
  const base = `/api/v1/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}`;
  const read = async url => {
    const response = await request(url, { credentials: 'include' });
    if (!response.ok) throw new Error(`Canvas could not load rubric data (HTTP ${response.status}).`);
    return response.json();
  };
  const [assignment, submission] = await Promise.all([
    read(base),
    read(`${base}/submissions/${encodeURIComponent(userId)}?include[]=rubric_assessment`)
  ]);
  const criteria = assignment.rubric;
  const assessment = submission.rubric_assessment;
  if (!Array.isArray(criteria) || !criteria.length || !assessment ||
      !criteria.some(criterion => Object.prototype.hasOwnProperty.call(assessment, criterion.id))) {
    throw new Error('Canvas did not return an assessed rubric for this submission.');
  }

  const element = (tag, text) => {
    const node = sourceDocument.createElement(tag);
    if (text !== undefined) node.textContent = String(text);
    return node;
  };
  const holder = element('section');
  holder.className = 'btech-api-rubric';
  holder.append(element('h2', 'Assessed rubric'));
  const table = element('table');
  table.className = 'rubric_table';
  const header = element('thead');
  const labels = element('tr');
  for (const label of ['Criterion', 'Ratings', 'Score', 'Instructor comments']) labels.append(element('th', label));
  header.append(labels);
  const body = element('tbody');
  for (const criterion of criteria) {
    const rating = assessment[criterion.id];
    const row = element('tr');
    const description = element('td');
    description.append(element('strong', criterion.description || 'Criterion'));
    if (criterion.long_description) description.append(element('p', criterion.long_description));
    const ratings = element('td');
    for (const option of criterion.ratings || []) {
      const selected = rating?.rating_id != null && String(rating.rating_id) === String(option.id);
      const item = element('p', `${selected ? 'Selected: ' : ''}${option.description || ''} (${option.points ?? '—'} pts)`);
      if (selected) item.style.fontWeight = 'bold';
      if (option.long_description) item.append(element('span', ` — ${option.long_description}`));
      ratings.append(item);
    }
    row.append(description, ratings,
      element('td', `${rating?.points ?? 'Not scored'} / ${criterion.points ?? '—'}`),
      element('td', rating?.comments || ''));
    body.append(row);
  }
  table.append(header, body);
  holder.append(table);
  return holder;
}

// Keep the submission document's loaded stylesheets, inline styles, theme
// classes, and CSS variables. Printing a clone through the parent page loses
// Canvas's rubric-specific styles because they belong to this document.
export function prepareRubricDocument(sourceDocument, holder) {
  const rubric = holder.cloneNode(true);
  const originals = holder.querySelectorAll('*');
  rubric.querySelectorAll('*').forEach((element, index) => {
    const style = sourceDocument.defaultView?.getComputedStyle(originals[index]);
    if (style && [style.overflowX, style.overflowY].some(value => value === 'auto' || value === 'scroll')) {
      element.style.overflow = 'visible';
      element.style.maxHeight = 'none';
      element.style.height = 'auto';
    }
  });
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
  rubric.querySelectorAll('button').forEach(button => {
    if (!button.matches('[data-testid^="rubric-rating-button-"], [data-testid^="traditional-criterion-"][data-testid*="-ratings-"]')) {
      button.remove();
      return;
    }
    // Enhanced rubric ratings are buttons. Preserve their labels and selected
    // state as static content instead of stripping the ratings from the clone.
    const selected = button.querySelector('[data-testid$="-selected"]') ||
      button.parentElement?.querySelector('[data-testid="rubric-rating-button-selected"]');
    const rating = sourceDocument.createElement('div');
    rating.className = button.className;
    rating.style.cssText = button.style.cssText;
    rating.append(...Array.from(button.childNodes));
    if (selected) {
      const label = sourceDocument.createElement('strong');
      label.textContent = ' Selected';
      rating.append(label);
    }
    button.replaceWith(rating);
  });
  rubric.querySelectorAll('script, .screenreader-only, .no-print').forEach(element => element.remove());
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
    #btech-accreditation-rubric-export [data-testid="enhanced-rubric-assessment-container"],
    #btech-accreditation-rubric-export #rubric-assessment-view-container,
    #btech-accreditation-rubric-export [data-testid="rubric-assessment-traditional-view"],
    #btech-accreditation-rubric-export .react_rubric_container,
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
