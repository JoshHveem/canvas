// Simple Generate Rubric Button (core functionality only)
(function () {
  function addGenerateButtonOnce() {
    const cancelBtn = document.querySelector(
      'button[data-testid="cancel-rubric-save-button"]'
    );
    if (!cancelBtn) return;

    const actionGroup = cancelBtn.closest('.css-1rydrmm-view-flexItem');
    if (!actionGroup) return;

    if (actionGroup.querySelector('#generate-assignment-button')) return;

    const btn = cancelBtn.cloneNode(true);
    btn.id = 'generate-assignment-button';
    btn.dataset.testid = 'generate-assignment-button';
    btn.disabled = false;
    btn.style.marginLeft = '8px';

    const label = btn.querySelector('.css-11xkk0o-baseButton__children');
    if (label) label.textContent = 'Generate';

    const cleanBtn = btn.cloneNode(true);
    cleanBtn.addEventListener('click', () => {
      const el = document.querySelector('[data-resource-type="assignment.body"]');
      if (!el) return console.warn('Assignment body not found');
      // Open modal UI with AI summary and timed checklist
      openAiRubricModal(el.innerText || el.innerHTML);
    });

    const createBtn = actionGroup.querySelector('button[data-testid="save-rubric-button"]');
    actionGroup.insertBefore(cleanBtn, createBtn || null);
  }

  // Single attempt to add the button on script load.
  addGenerateButtonOnce();
})();

// --- Modal and checklist UI (proof-of-concept) ---
function openAiRubricModal(assignmentText) {
  if (document.getElementById('ai-rubric-modal-overlay')) return;

  // stand-in summary variable (replace with real AI result later)
  const aiSummary = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

  // inject modal-specific styles to ensure green checkmarks
  if (!document.getElementById('ai-rubric-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'ai-rubric-modal-styles';
    style.textContent = `
      #ai-rubric-modal-overlay input[type="checkbox"] { accent-color: #0a662a; }
      /* fallback: make checked boxes show green background where accent-color not supported */
      #ai-rubric-modal-overlay input[type="checkbox"]:checked { background-color: #0a662a; border-color: #0a662a; }
      #ai-rubric-modal-overlay button { font-family: inherit; }
    `;
    document.head.appendChild(style);
  }

  const overlay = document.createElement('div');
  overlay.id = 'ai-rubric-modal-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999
  });

  const modal = document.createElement('div');
  Object.assign(modal.style, {
    width: '760px', maxWidth: '96%', background: '#fff', borderRadius: '8px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: '20px', position: 'relative',
    fontFamily: 'Arial, Helvetica, sans-serif', color: '#222'
  });

  const header = document.createElement('div');
  Object.assign(header.style, {display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px'});
  const title = document.createElement('h2');
  title.textContent = 'Create Rubric with AI';
  Object.assign(title.style, {margin: 0, fontSize: '20px', fontWeight: 700, color: '#111'});

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  Object.assign(closeBtn.style, {border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer'});

  header.appendChild(title);
  header.appendChild(closeBtn);

  const summary = document.createElement('div');
  summary.style.marginBottom = '12px';
  const summaryLabel = document.createElement('div');
  summaryLabel.textContent = 'Summary';
  Object.assign(summaryLabel.style, {fontWeight: 700, marginBottom: '6px'});
  const summaryText = document.createElement('p');
  summaryText.style.margin = '0 0 12px 0';
  summaryText.style.color = '#333';
  summaryText.textContent = aiSummary;
  summary.appendChild(summaryLabel);
  summary.appendChild(summaryText);

  const checklist = document.createElement('div');
  checklist.style.marginBottom = '12px';

  const checks = [];
  for (let i = 1; i <= 6; i++) {
    const item = document.createElement('label');
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '8px';
    item.style.marginBottom = '6px';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.disabled = true;
    cb.style.width = '16px';
    cb.style.height = '16px';
    // make the checkmark green where supported
    try { cb.style.accentColor = '#0a662a'; } catch (e) {}

    const txt = document.createElement('span');
    txt.textContent = 'Assignment ready criteria #' + i;
    txt.style.color = '#222';

    item.appendChild(cb);
    item.appendChild(txt);
    checklist.appendChild(item);
    checks.push(cb);
  }

  const status = document.createElement('div');
  status.style.minHeight = '20px';
  status.style.fontWeight = '600';
  status.style.color = '#0a662a';
  status.textContent = '';

  modal.appendChild(header);
  modal.appendChild(summary);
  modal.appendChild(checklist);
  modal.appendChild(status);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // timed checking simulation and later rubric generation
  const timers = [];
  let rubricGenerated = false;

  function generateRubricTable() {
    if (rubricGenerated) return;
    rubricGenerated = true;

    const tableWrap = document.createElement('div');
    tableWrap.style.marginTop = '12px';

    // Controls: total points, add/remove criterion, add/remove rating
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.justifyContent = 'flex-end';
    controls.style.marginBottom = '8px';
    // total points input
    const totalWrap = document.createElement('div');
    totalWrap.style.display = 'flex';
    totalWrap.style.alignItems = 'center';
    totalWrap.style.gap = '6px';
    const totalLabel = document.createElement('label');
    totalLabel.textContent = 'Total points';
    const totalInput = document.createElement('input');
    totalInput.type = 'number';
    totalInput.min = '0';
    totalInput.style.width = '80px';
    totalInput.value = '';
    totalWrap.appendChild(totalLabel);
    totalWrap.appendChild(totalInput);

    const addCritBtn = document.createElement('button');
    addCritBtn.textContent = 'Add Criterion';
    Object.assign(addCritBtn.style, {padding: '6px 10px', cursor: 'pointer'});

    const addRatingBtn = document.createElement('button');
    addRatingBtn.textContent = 'Add Rating';
    Object.assign(addRatingBtn.style, {padding: '6px 10px', cursor: 'pointer'});

    const removeRatingBtn = document.createElement('button');
    removeRatingBtn.textContent = 'Remove Rating';
    Object.assign(removeRatingBtn.style, {padding: '6px 10px', cursor: 'pointer'});

    controls.appendChild(totalWrap);
    controls.appendChild(removeRatingBtn);
    controls.appendChild(addRatingBtn);
    controls.appendChild(addCritBtn);
    tableWrap.appendChild(controls);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '13px';

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    table.appendChild(thead);
    table.appendChild(tbody);

    // dynamic state
    let ratingNames = ['No Evidence', 'Below', 'Near', 'Mastery'];
    // default totalPoints: number of criteria * top rating value (numRatings-1)
    function defaultTotalPoints() {
      const numCriteria = Math.max(1, tbody.querySelectorAll('tr').length || 6);
      return numCriteria * (ratingNames.length - 1);
    }
    let totalPoints = defaultTotalPoints();
    totalInput.value = String(totalPoints);

    function computePerCriterionMax() {
      const numCriteria = Math.max(1, tbody.querySelectorAll('tr').length);
      // distribute totalPoints across criteria
      return Math.max(1, Math.round(totalPoints / numCriteria));
    }

    function pointsForRating(index) {
      const numRatings = Math.max(2, ratingNames.length);
      const max = computePerCriterionMax();
      const pts = Math.round((index / (numRatings - 1)) * max);
      return pts;
    }

    function renderHeader() {
      thead.innerHTML = '';
      const headerRow = document.createElement('tr');
      const thEmpty = document.createElement('th');
      thEmpty.textContent = 'Criterion';
      Object.assign(thEmpty.style, {textAlign: 'left', padding: '8px', border: '1px solid #ddd', background: '#f7f7f7'});
      headerRow.appendChild(thEmpty);

      for (let i = 0; i < ratingNames.length; i++) {
        const th = document.createElement('th');
        th.style.padding = '8px';
        th.style.border = '1px solid #ddd';
        th.style.background = '#f7f7f7';
        th.style.textAlign = 'center';
        const pts = document.createElement('div');
        pts.style.fontWeight = '700';
        pts.textContent = String(pointsForRating(i));
        const name = document.createElement('div');
        name.style.fontSize = '11px';
        name.style.color = '#555';
        name.contentEditable = true;
        name.textContent = ratingNames[i];
        // update ratingNames when edited
        name.addEventListener('input', () => { ratingNames[i] = name.textContent; });
        th.appendChild(pts);
        th.appendChild(name);
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);
    }

    function addRow(critText) {
      const tr = document.createElement('tr');
      const tdCrit = document.createElement('td');
      tdCrit.style.padding = '8px';
      tdCrit.style.border = '1px solid #ddd';
      tdCrit.style.width = '18%';
      // criterion header with delete button
      const critWrap = document.createElement('div');
      critWrap.style.display = 'flex';
      critWrap.style.justifyContent = 'space-between';
      critWrap.style.alignItems = 'center';

      const critName = document.createElement('div');
      critName.contentEditable = true;
      critName.textContent = critText || 'New Criterion';
      critName.style.fontWeight = '600';

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      Object.assign(delBtn.style, {marginLeft: '8px', cursor: 'pointer', padding: '4px 6px'});
      delBtn.addEventListener('click', () => { tr.remove(); });

      critWrap.appendChild(critName);
      critWrap.appendChild(delBtn);
      tdCrit.appendChild(critWrap);
      tr.appendChild(tdCrit);

      for (let c = 0; c < ratingNames.length; c++) {
        const td = document.createElement('td');
        td.style.padding = '8px';
        td.style.border = '1px solid #ddd';
        td.style.verticalAlign = 'top';
        // two editable areas: title and description
        const title = document.createElement('div');
        title.contentEditable = true;
        title.style.fontWeight = '600';
        title.textContent = 'Short description';
        const desc = document.createElement('div');
        desc.contentEditable = true;
        desc.style.fontSize = '12px';
        desc.style.color = '#444';
        desc.textContent = 'Lorem ipsum dolor sit amet.';
        td.appendChild(title);
        td.appendChild(desc);
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
      // after adding a row, update total default if user hasn't adjusted
      if (!totalInput._userEdited) {
        totalPoints = defaultTotalPoints();
        totalInput.value = String(totalPoints);
      }
      renderHeader();
      return tr;
    }

    function addRatingColumn(name) {
      ratingNames.push(name || ('Rating ' + ratingNames.length));
      // update header
      renderHeader();
      // add cell to each existing row
      Array.from(tbody.querySelectorAll('tr')).forEach((tr) => {
        const td = document.createElement('td');
        td.style.padding = '8px';
        td.style.border = '1px solid #ddd';
        td.style.verticalAlign = 'top';
        const title = document.createElement('div');
        title.contentEditable = true; title.style.fontWeight = '600'; title.textContent = 'Short description';
        const desc = document.createElement('div'); desc.contentEditable = true; desc.style.fontSize = '12px'; desc.style.color = '#444'; desc.textContent = 'Lorem ipsum dolor sit amet.';
        td.appendChild(title); td.appendChild(desc);
        tr.appendChild(td);
      });
    }

    function removeRatingColumn() {
      if (ratingNames.length <= 2) return; // keep at least 2
      ratingNames.pop();
      renderHeader();
      Array.from(tbody.querySelectorAll('tr')).forEach((tr) => {
        const last = tr.querySelector('td:last-child');
        if (last) last.remove();
      });
    }

    // wire controls
    addCritBtn.addEventListener('click', () => { addRow('New Criterion'); renderHeader(); });
    addRatingBtn.addEventListener('click', () => { addRatingColumn(); renderHeader(); });
    removeRatingBtn.addEventListener('click', () => { removeRatingColumn(); renderHeader(); });

    totalInput.addEventListener('input', () => {
      totalInput._userEdited = true;
      const v = parseInt(totalInput.value, 10);
      if (!isNaN(v) && v >= 0) {
        totalPoints = v;
        renderHeader();
      }
    });

    // initial render and add 6 rows (AI would fill/append as needed)
    renderHeader();
    for (let r = 1; r <= 6; r++) {
      addRow('Criterion ' + r);
    }
    // ensure header reflects computed points after rows are added
    renderHeader();

    tableWrap.appendChild(table);

    // publish button
    const publishWrap = document.createElement('div');
    publishWrap.style.marginTop = '12px';
    publishWrap.style.textAlign = 'right';
    const publishBtn = document.createElement('button');
    publishBtn.textContent = 'Publish';
    Object.assign(publishBtn.style, {background: '#0a662a', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer'});
    publishBtn.addEventListener('click', () => {
      // future: serialize table and send to server or insert into page
      cleanup();
    });
    publishWrap.appendChild(publishBtn);

    modal.appendChild(tableWrap);
    modal.appendChild(publishWrap);
  }

  checks.forEach((cb, idx) => {
    const t = setTimeout(() => {
      cb.checked = true;
      try { cb.style.accentColor = '#0a662a'; } catch (e) {}
      // when all checked, update status and schedule rubric generation
      if (checks.every(c => c.checked)) {
        status.textContent = 'your assignment is ready for rubric generation!';
        const g = setTimeout(() => generateRubricTable(), 500);
        timers.push(g);
      }
    }, (idx + 1) * 500);
    timers.push(t);
  });

  function cleanup() {
    timers.forEach(clearTimeout);
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  closeBtn.addEventListener('click', cleanup);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });
}
