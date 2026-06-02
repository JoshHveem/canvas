(function () {
  'use strict';

  var assocRegex = new RegExp('^/(course|account)s/([0-9]+)/rubrics$');
  var promptPath = '/custom_features/rubrics/upload_rubric/ai_rubric_prompt.md';
  var buttonId = 'btech_rubric_json_import_button';
  var panelOverlayId = 'btech_rubric_json_panel_overlay';
  var panelStyleId = 'btech_rubric_json_panel_styles';
  var dialogId = 'btech_rubric_json_dialog';
  var promptButtonId = 'btech_rubric_json_prompt_download';
  var fileInputId = 'btech_rubric_json_file';
  var fileDropZoneId = 'btech_rubric_json_drop_zone';
  var fileDropTitleId = 'btech_rubric_json_drop_title';
  var fileDropHelpId = 'btech_rubric_json_drop_help';
  var fileStatusId = 'btech_rubric_json_file_status';
  var messageId = 'btech_rubric_json_msg';
  var selectedRubricFileName = '';
  var selectedRubricText = '';
  var isReadingRubricFile = false;
  var lastSubmission = null;


  function add_button() {

    var createBtn = document.querySelector('button[data-testid="create-new-rubric-button"]');
    if (!createBtn || !createBtn.parentElement || !createBtn.parentElement.parentElement) {
      return false;
    }

    if (document.getElementById(buttonId)) {
      hideLegacyImportButton();
      return true;
    }

    var createWrapper = createBtn.parentElement;
    var wrapper = createWrapper.cloneNode(true);
    var testBtn = wrapper.querySelector('button');

    if (!testBtn) {
      return false;
    }

    clearClonedIds(wrapper);
    testBtn.id = buttonId;
    testBtn.type = 'button';
    testBtn.removeAttribute('data-testid');
    testBtn.removeAttribute('data-cid');
    testBtn.setAttribute('aria-label', 'Import Rubric');
    setClonedButtonText(testBtn, 'Import Rubric');
    setRobotIcon(testBtn);
    styleImportButton(testBtn);
    testBtn.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      openDialog();
    }, true);

    createWrapper.parentElement.insertBefore(wrapper, createWrapper);
    hideLegacyImportButton();

    return true;
  }

  function clearClonedIds(wrapper) {
    var idEls = wrapper.querySelectorAll('[id]');
    for (var i = 0; i < idEls.length; i++) {
      idEls[i].removeAttribute('id');
    }
  }

  function setClonedButtonText(button, text) {
    var spans = button.querySelectorAll('span');
    var target = null;

    for (var i = 0; i < spans.length; i++) {
      if (normalizeText(spans[i].textContent) === 'Create New Rubric') {
        target = spans[i];
        break;
      }
    }

    if (target) {
      target.textContent = text;
    } else {
      button.textContent = text;
    }
  }

  function setRobotIcon(targetButton) {
    var robotIcon = createRobotIcon();
    var targetIcon = targetButton.querySelector('svg');

    if (targetIcon && targetIcon.parentElement) {
      targetIcon.parentElement.replaceChild(robotIcon, targetIcon);
      return;
    }

    targetButton.insertBefore(robotIcon, targetButton.firstChild);
  }

  function createRobotIcon() {
    var svgNs = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNs, 'svg');
    var antenna = document.createElementNS(svgNs, 'path');
    var head = document.createElementNS(svgNs, 'rect');
    var leftEye = document.createElementNS(svgNs, 'circle');
    var rightEye = document.createElementNS(svgNs, 'circle');
    var mouth = document.createElementNS(svgNs, 'path');

    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.color = '#fff';
    svg.style.fill = 'none';
    svg.style.stroke = 'currentColor';
    svg.style.strokeLinecap = 'round';
    svg.style.strokeLinejoin = 'round';
    svg.style.strokeWidth = '2';
    svg.style.marginRight = '6px';
    svg.style.verticalAlign = 'text-bottom';

    antenna.setAttribute('d', 'M12 6V3m0 0h.01');
    head.setAttribute('x', '5');
    head.setAttribute('y', '7');
    head.setAttribute('width', '14');
    head.setAttribute('height', '12');
    head.setAttribute('rx', '3');
    leftEye.setAttribute('cx', '9');
    leftEye.setAttribute('cy', '12');
    leftEye.setAttribute('r', '1');
    leftEye.style.fill = 'currentColor';
    rightEye.setAttribute('cx', '15');
    rightEye.setAttribute('cy', '12');
    rightEye.setAttribute('r', '1');
    rightEye.style.fill = 'currentColor';
    mouth.setAttribute('d', 'M9 16h6');

    svg.appendChild(antenna);
    svg.appendChild(head);
    svg.appendChild(leftEye);
    svg.appendChild(rightEye);
    svg.appendChild(mouth);

    return svg;
  }

  function styleImportButton(button) {
    var red = '#b20b0f';
    var textEls;
    var iconEls;
    var i;

    button.style.background = red;
    button.style.borderColor = red;
    button.style.borderStyle = 'solid';
    button.style.borderWidth = '1px';
    button.style.color = '#fff';
    button.style.fontWeight = '700';

    textEls = button.querySelectorAll('span');
    for (i = 0; i < textEls.length; i++) {
      textEls[i].style.color = '#fff';
      textEls[i].style.fontWeight = '700';
    }

    iconEls = button.querySelectorAll('svg, path');
    for (i = 0; i < iconEls.length; i++) {
      iconEls[i].style.color = '#fff';
      iconEls[i].style.fill = '#fff';
    }
  }

  function hideLegacyImportButton() {
    var legacyImportBtn = document.querySelector('button[data-testid="import-rubric-button"]');
    if (legacyImportBtn && legacyImportBtn.parentElement) {
      legacyImportBtn.parentElement.style.display = 'none';
      legacyImportBtn.setAttribute('aria-hidden', 'true');
      legacyImportBtn.setAttribute('tabindex', '-1');
    }
  }

  function ensurePanelStyles() {
    if (document.getElementById(panelStyleId)) {
      return;
    }

    var style = document.createElement('style');
    style.id = panelStyleId;
    style.textContent = [
      '#' + panelOverlayId + ' { background: rgba(45, 59, 69, 0.45); display: none; inset: 0; position: fixed; z-index: 10000; }',
      '#' + panelOverlayId + '.is-open { display: block; }',
      '#' + dialogId + ' { background: #fff; box-shadow: -4px 0 20px rgba(0, 0, 0, 0.25); box-sizing: border-box; display: flex; flex-direction: column; height: 100%; max-width: 92vw; position: absolute; right: 0; top: 0; width: 560px; }',
      '#' + dialogId + ' * { box-sizing: border-box; }',
      '#' + dialogId + ' .btech-panel-header { align-items: center; border-bottom: 1px solid #c7cdd1; display: flex; justify-content: space-between; padding: 18px 24px; }',
      '#' + dialogId + ' .btech-panel-title { font-size: 20px; font-weight: 600; line-height: 1.25; margin: 0; }',
      '#' + dialogId + ' .btech-panel-close { background: transparent; border: 0; cursor: pointer; font-size: 26px; line-height: 1; padding: 4px 8px; }',
      '#' + dialogId + ' .btech-panel-body { flex: 1; overflow-y: auto; padding: 24px; }',
      '#' + dialogId + ' .btech-panel-footer { align-items: center; border-top: 1px solid #c7cdd1; display: flex; gap: 8px; justify-content: flex-end; padding: 16px 24px; }',
      '#' + dialogId + ' .btech-panel-button { border: 1px solid #8b969e; border-radius: 4px; cursor: pointer; padding: 8px 14px; }',
      '#' + dialogId + ' .btech-panel-button-primary { background: #0374b5; border-color: #0374b5; color: #fff; }',
      '#' + dialogId + ' .btech-file-drop-zone { align-items: center; border: 2px dashed #8b969e; border-radius: 6px; cursor: pointer; display: flex; flex-direction: column; gap: 8px; justify-content: center; min-height: 170px; padding: 24px; text-align: center; }',
      '#' + dialogId + ' .btech-file-drop-zone.is-dragging { background: #f2f8fc; border-color: #0374b5; }',
      '#' + dialogId + ' .btech-file-drop-zone.has-file { background: #f3fbf6; border-color: #0b874b; }',
      '#' + dialogId + ' .btech-file-drop-zone strong { font-size: 16px; }',
      '#' + dialogId + ' .btech-file-drop-zone p { margin: 0; }',
      '#' + dialogId + ' .btech-file-status { color: #2d3b45; font-size: 13px; margin-top: 12px; }',
      '#' + messageId + ' { margin-top: 16px; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function createDialog() {
    var existingOverlay = document.getElementById(panelOverlayId);
    if (existingOverlay) {
      return existingOverlay;
    }

    ensurePanelStyles();

    var overlay = document.createElement('div');
    overlay.id = panelOverlayId;
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) {
        closeDialog();
      }
    });

    var el = document.createElement('aside');
    el.id = dialogId;
    el.classList.add('ic-Form-control');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', dialogId + '_title');

    var header = document.createElement('div');
    header.className = 'btech-panel-header';

    var heading = document.createElement('h2');
    heading.id = dialogId + '_title';
    heading.className = 'btech-panel-title';
    heading.textContent = 'Import Rubric JSON';
    header.appendChild(heading);

    var closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btech-panel-close';
    closeButton.setAttribute('aria-label', 'Close Import Rubric JSON panel');
    closeButton.textContent = 'x';
    closeButton.addEventListener('click', closeDialog);
    header.appendChild(closeButton);

    el.appendChild(header);

    var body = document.createElement('div');
    body.className = 'btech-panel-body';

    var promptContainer = document.createElement('div');
    promptContainer.style.marginBottom = '16px';

    var promptButton = createPanelButton(' Copy Prompt', 'Button Button--secondary btech-panel-button', copyPrompt);
    promptButton.id = promptButtonId;

    var promptIcon = document.createElement('i');
    promptIcon.classList.add('icon-copy-course');
    promptButton.insertBefore(promptIcon, promptButton.firstChild);
    promptContainer.appendChild(promptButton);

    var promptHelp = document.createElement('p');
    promptHelp.textContent = 'Copy this prompt, paste it into your AI chat, then upload the final .json file below.';
    promptHelp.style.margin = '8px 0 0';
    promptHelp.style.fontSize = '13px';
    promptHelp.style.color = '#4a5568';
    promptContainer.appendChild(promptHelp);

    body.appendChild(promptContainer);

    var fileInput = document.createElement('input');
    fileInput.id = fileInputId;
    fileInput.type = 'file';
    fileInput.accept = 'application/json,.json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', function (event) {
      handleFileSelection(event.target.files);
    });
    body.appendChild(fileInput);

    var dropZone = document.createElement('div');
    dropZone.id = fileDropZoneId;
    dropZone.className = 'btech-file-drop-zone';
    dropZone.setAttribute('role', 'button');
    dropZone.setAttribute('tabindex', '0');
    dropZone.setAttribute('aria-label', 'Upload rubric JSON file');

    var dropTitle = document.createElement('strong');
    dropTitle.id = fileDropTitleId;
    dropTitle.textContent = 'Drag a JSON file here';
    dropZone.appendChild(dropTitle);

    var dropHelp = document.createElement('p');
    dropHelp.id = fileDropHelpId;
    dropHelp.textContent = 'or browse for a .json file';
    dropZone.appendChild(dropHelp);

    var browseButton = createPanelButton('Browse Files', 'Button btech-panel-button', function (event) {
      event.preventDefault();
      event.stopPropagation();
      fileInput.click();
    });
    dropZone.appendChild(browseButton);

    dropZone.addEventListener('click', function () {
      fileInput.click();
    });
    dropZone.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fileInput.click();
      }
    });
    dropZone.addEventListener('dragenter', function (event) {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.add('is-dragging');
    });
    dropZone.addEventListener('dragover', function (event) {
      event.preventDefault();
      event.stopPropagation();
    });
    dropZone.addEventListener('dragleave', function (event) {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.remove('is-dragging');
    });
    dropZone.addEventListener('drop', function (event) {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.remove('is-dragging');
      handleFileSelection(event.dataTransfer && event.dataTransfer.files);
    });
    body.appendChild(dropZone);

    var fileStatus = document.createElement('div');
    fileStatus.id = fileStatusId;
    fileStatus.className = 'btech-file-status';
    fileStatus.textContent = 'No file selected.';
    body.appendChild(fileStatus);

    var msg = document.createElement('div');
    msg.id = messageId;
    msg.style.display = 'none';
    body.appendChild(msg);

    el.appendChild(body);

    var footer = document.createElement('div');
    footer.className = 'btech-panel-footer';

    var cancelButton = createPanelButton('Cancel', 'Button btech-panel-button', function () {
      clearDialog();
      closeDialog();
    });
    footer.appendChild(cancelButton);

    var createButton = createPanelButton('Create', 'Button Button--primary btech-panel-button btech-panel-button-primary', processDialog);
    footer.appendChild(createButton);

    el.appendChild(footer);

    overlay.appendChild(el);
    document.body.appendChild(overlay);

    return overlay;
  }

  function createPanelButton(text, className, clickHandler) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;

    if (clickHandler) {
      button.addEventListener('click', clickHandler);
    }

    return button;
  }

  function openDialog() {
    try {
      var overlay = createDialog();
      overlay.classList.add('is-open');
      document.addEventListener('keydown', handlePanelKeydown);

      window.setTimeout(function () {
        var dropZone = document.getElementById(fileDropZoneId);
        if (dropZone) {
          dropZone.focus();
        }
      }, 0);

    } catch (e) {
      console.error('[Rubric JSON Import] Failed to open side panel.', e);
    }
  }

  function closeDialog() {
    var overlay = document.getElementById(panelOverlayId);
    if (overlay) {
      overlay.classList.remove('is-open');
    }
    document.removeEventListener('keydown', handlePanelKeydown);
  }

  function handlePanelKeydown(event) {
    if (event.key === 'Escape') {
      closeDialog();
    }
  }

  function handleFileSelection(files) {

    if (!files || files.length === 0) {
      return;
    }
    if (files.length > 1) {
      resetRubricFileSelection('Upload one .json file only.');
      showMessages(['Please upload one rubric JSON file at a time.'], 'ic-flash-warning');
      return;
    }

    readRubricFile(files[0]);
  }

  function readRubricFile(file) {

    selectedRubricFileName = '';
    selectedRubricText = '';

    if (!isJsonFile(file)) {
      resetRubricFileSelection('No valid JSON file selected.');
      showMessages(['Please upload a .json file.'], 'ic-flash-warning');
      return;
    }

    isReadingRubricFile = true;
    updateFileStatus('Reading ' + file.name + '...');
    showMessages([], 'ic-flash-warning');

    var reader = new FileReader();
    reader.onload = function (event) {
      selectedRubricFileName = file.name;
      selectedRubricText = String(event.target.result || '');
      isReadingRubricFile = false;
      updateDropZoneContent(true, 'File uploaded', file.name);
      updateFileStatus('Loaded ' + file.name + ' (' + selectedRubricText.length + ' characters).');
    };
    reader.onerror = function () {
      resetRubricFileSelection('Unable to read the selected file.');
      showMessages(['Unable to read the selected file. Please try again.'], 'ic-flash-warning');
    };

    reader.readAsText(file);
  }

  function isJsonFile(file) {
    var name = file && file.name ? file.name.toLowerCase() : '';
    return !!file && name.slice(-5) === '.json';
  }

  function resetRubricFileSelection(statusMessage) {
    selectedRubricFileName = '';
    selectedRubricText = '';
    isReadingRubricFile = false;
    updateDropZoneContent(false, '', '');
    updateFileStatus(statusMessage || 'No file selected.');
  }

  function updateFileStatus(message) {
    var status = document.getElementById(fileStatusId);
    if (status) {
      status.textContent = message;
    }
  }

  function updateDropZoneContent(hasFile, title, help) {
    var dropZone = document.getElementById(fileDropZoneId);
    var titleEl = document.getElementById(fileDropTitleId);
    var helpEl = document.getElementById(fileDropHelpId);

    if (dropZone) {
      if (hasFile) {
        dropZone.classList.add('has-file');
      } else {
        dropZone.classList.remove('has-file');
      }
    }
    if (titleEl) {
      titleEl.textContent = hasFile ? title : 'Drag a JSON file here';
    }
    if (helpEl) {
      helpEl.textContent = hasFile ? help : 'or browse for a .json file';
    }
  }

  function copyPrompt() {
    var url = getSourceUrl() + promptPath;
    showMessages(['Loading prompt...'], 'ic-flash-success');

    $.get(url).done(function (content) {
      copyTextToClipboard(content).then(function () {
        showMessages(['AI rubric prompt copied to your clipboard. Paste it into your AI chat.'], 'ic-flash-success');
      }).catch(function (e) {
        showMessages(['Prompt loaded, but the browser blocked clipboard access. The prompt opened in a new tab so you can copy it manually.'], 'ic-flash-warning');
        window.open(url, '_blank');
      });
    }).fail(function () {
      showMessages(['Unable to load the prompt for copying. The prompt opened in a new tab if it is available.'], 'ic-flash-warning');
      window.open(url, '_blank');
    });
  }

  function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.left = '-9999px';
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        if (document.execCommand('copy')) {
          resolve();
        } else {
          reject(new Error('Clipboard copy command returned false.'));
        }
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(textarea);
      }
    });
  }

  function processDialog() {
    var submission = collectDialogData();
    if (!submission) {
      return;
    }

    lastSubmission = submission;
    dispatchRubricSubmit(submission);
    showMessages(['Rubric JSON parsed. Saving rubric to Canvas...'], 'ic-flash-success');
    saveRubric(submission.canvasPayload).done(function () {
      showMessages(['Rubric saved to Canvas. Reloading page...'], 'ic-flash-success');
      closeDialog();
      window.location.reload(true);
    }).fail(function () {
      showMessages(['All the information was supplied correctly, but there was an error saving rubric to Canvas.'], 'ic-flash-warning');
    });
  }

  function collectDialogData() {
    var errors = [];
    var title = '';
    var text = selectedRubricText ? selectedRubricText.trim() : '';
    var association = getAssociationFromPath();
    var rubric;
    var validationErrors;


    if (isReadingRubricFile) {
      errors.push('The JSON file is still loading. Try Create again in a moment.');
    } else if (text === '') {
      errors.push('You must upload a rubric JSON file.');
    } else {
      rubric = parseRubricJson(text, errors);
    }
    if (rubric && title === '') {
      title = normalizeText(rubric.title);
    }
    if (title === '') {
      errors.push('The rubric JSON needs a title.');
    }
    if (rubric) {
      validationErrors = validateRubricJson(rubric);
      errors = errors.concat(validationErrors);
    }
    if (!association) {
      errors.push('Unable to determine where to place this rubric.');
    }

    if (errors.length > 0) {
      showMessages(errors, 'ic-flash-warning');
      return false;
    }

    rubric.title = title;

    return {
      'title': title,
      'json': rubric,
      'sourceText': text,
      'association': association,
      'canvasPayload': buildRubricPayload(Object.assign({}, rubric, {
        'association': association
      }))
    };
  }

  function clearDialog() {
    var fileInput = document.getElementById(fileInputId);

    if (fileInput) {
      fileInput.value = '';
    }

    resetRubricFileSelection('No file selected.');
    showMessages([], 'ic-flash-warning');
  }

  function showMessages(messages, className) {
    var msg = document.getElementById(messageId);
    if (!msg) {
      return;
    }

    while (msg.firstChild) {
      msg.removeChild(msg.firstChild);
    }

    msg.className = className || 'ic-flash-warning';
    if (!messages || messages.length === 0) {
      msg.style.display = 'none';
      return;
    }

    var ul = document.createElement('ul');
    for (var i = 0; i < messages.length; i++) {
      var li = document.createElement('li');
      li.textContent = messages[i];
      ul.appendChild(li);
    }

    msg.appendChild(ul);
    msg.style.display = 'inline-block';
  }

  function dispatchRubricSubmit(payload) {
    document.dispatchEvent(new CustomEvent('btech:rubric-import-submit', {
      'detail': payload
    }));
  }

  function parseRubricJson(text, errors) {
    errors = errors || [];

    try {
      var rubric = JSON.parse(text);
      if (!rubric || Array.isArray(rubric) || typeof rubric !== 'object') {
        errors.push('Rubric JSON must be one object, not an array or plain value.');
        return false;
      }

      return rubric;
    } catch (e) {
      errors.push('Rubric JSON is not valid: ' + e.message);
      return false;
    }
  }

  function validateRubricJson(rubric) {
    var errors = [];

    if (!Array.isArray(rubric.criteria) || rubric.criteria.length === 0) {
      errors.push('Rubric JSON must include a non-empty criteria array.');
      return errors;
    }

    for (var i = 0; i < rubric.criteria.length; i++) {
      validateCriterionJson(rubric.criteria[i], i, errors);
    }

    return errors;
  }

  function validateCriterionJson(criterion, index, errors) {
    var label = 'Criterion ' + (index + 1);

    if (!criterion || Array.isArray(criterion) || typeof criterion !== 'object') {
      errors.push(label + ' must be an object.');
      return;
    }
    if (normalizeText(criterion.description || criterion.name) === '') {
      errors.push(label + ' needs a description.');
    }
    if (!Array.isArray(criterion.ratings) || criterion.ratings.length < 2) {
      errors.push(label + ' needs at least two ratings.');
      return;
    }
    if (typeof criterion.points !== 'undefined' && !isFiniteNumber(criterion.points)) {
      errors.push(label + ' points must be a number when provided.');
    }

    for (var i = 0; i < criterion.ratings.length; i++) {
      validateRatingJson(criterion.ratings[i], index, i, errors);
    }
  }

  function validateRatingJson(rating, criterionIndex, ratingIndex, errors) {
    var label = 'Criterion ' + (criterionIndex + 1) + ', rating ' + (ratingIndex + 1);

    if (!rating || Array.isArray(rating) || typeof rating !== 'object') {
      errors.push(label + ' must be an object.');
      return;
    }
    if (normalizeText(rating.description) === '') {
      errors.push(label + ' needs a description.');
    }
    if (!isFiniteNumber(rating.points)) {
      errors.push(label + ' needs numeric points.');
    }
  }

  function buildRubricPayload(options) {
    var title = options.title;
    var criteria = buildCriteria(options.criteria || []);
    var association = options.association || getAssociationFromPath();
    var freeFormComments = options.freeFormComments ? 1 : 0;
    var useForGrading = 0;
    var hideScoreTotal = options.hideScoreTotal ? 1 : 0;
    var purpose = 'bookmark';
    var pointsPossible = getPointsPossible(criteria);

    var payload = {
      'rubric': {
        'title': title,
        'points_possible': pointsPossible,
        'free_form_criterion_comments': freeFormComments,
        'criteria': criteria
      },
      'rubric_association': {
        'id': options.rubricAssociationId || '',
        'use_for_grading': useForGrading,
        'hide_score_total': hideScoreTotal,
        'association_type': association.type,
        'association_id': association.id,
        'purpose': purpose
      },
      'title': title,
      'points_possible': pointsPossible,
      'rubric_id': options.rubricId || 'new',
      'rubric_association_id': options.rubricAssociationId || '',
      'skip_updating_points_possible': options.skipUpdatingPointsPossible ? 1 : 0
    };

    return payload;
  }

  function buildCriteria(criteriaInput) {
    var criteria = [];

    for (var i = 0; i < criteriaInput.length; i++) {
      var criterion = buildCriterion(criteriaInput[i]);
      if (criterion) {
        criteria.push(criterion);
      }
    }

    return criteria;
  }

  function buildCriterion(item) {
    if (!item) {
      return false;
    }

    var ratings = buildRatings(item.ratings || []);
    var criterion = {
      'description': normalizeText(item.description || item.name || ''),
      'long_description': normalizeText(item.long_description || item.longDescription || '')
    };

    if (item.id) {
      criterion.id = item.id;
    }
    if (item.criterion_use_range) {
      criterion.criterion_use_range = true;
    }
    if (item.learning_outcome_id) {
      criterion.learning_outcome_id = item.learning_outcome_id;
    }
    if (item.ignore_for_scoring) {
      criterion.ignore_for_scoring = 1;
    }
    if (typeof item.mastery_points !== 'undefined') {
      criterion.mastery_points = item.mastery_points;
    }
    if (ratings.length > 0) {
      criterion.ratings = ratings;
      criterion.points = getCriterionPoints(item, ratings);
    }

    return criterion;
  }

  function buildRatings(ratingsInput) {
    var ratings = [];

    for (var i = 0; i < ratingsInput.length; i++) {
      var item = ratingsInput[i];
      ratings.push({
        'description': normalizeText(item.description || ''),
        'long_description': normalizeText(item.long_description || item.longDescription || ''),
        'points': Number(item.points)
      });
    }

    ratings.sort(function (a, b) {
      return b.points - a.points;
    });

    return ratings;
  }

  function getCriterionPoints(item, ratings) {
    if (typeof item.points !== 'undefined') {
      return Number(item.points);
    }

    return ratings[0].points;
  }

  function getPointsPossible(criteria) {
    var pointsPossible = 0;

    for (var i = 0; i < criteria.length; i++) {
      if (criteria[i].ignore_for_scoring) {
        continue;
      }

      pointsPossible += Number(criteria[i].points || 0);
    }

    return pointsPossible;
  }

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function getSourceUrl() {
    if (typeof SOURCE_URL !== 'undefined') {
      return SOURCE_URL;
    }

    return '';
  }

  function isFiniteNumber(value) {
    return value !== '' && value !== null && isFinite(Number(value));
  }

  function getAssociationFromPath() {
    var assocMatch = assocRegex.exec(window.location.pathname);
    if (!assocMatch) {
      return false;
    }

    var association = {
      'type': assocMatch[1].charAt(0).toUpperCase() + assocMatch[1].slice(1),
      'id': assocMatch[2]
    };

    return association;
  }

  function getCsrfToken() {
    var csrfRegex = new RegExp('^_csrf_token=(.*)$');
    var cookies = document.cookie.split(';');

    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].trim();
      var match = csrfRegex.exec(cookie);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }

    return '';
  }

  function fetchOutcome(outcomeId) {
    return $.ajax({
      'url': '/api/v1/outcomes/' + outcomeId,
      'dataType': 'json',
      'timeout': 3000
    });
  }

  function saveRubric(formData) {
    var data = Object.assign({}, formData, {
      'authenticity_token': getCsrfToken()
    });

    return $.ajax({
      'cache': false,
      'url': window.location.pathname,
      'type': 'POST',
      'data': data
    });
  }

  window.BTECH_RUBRIC_JSON_IMPORT_API = {
    'fetchOutcome': fetchOutcome,
    'buildRubricPayload': buildRubricPayload,
    'parseRubricJson': parseRubricJson,
    'validateRubricJson': validateRubricJson,
    'getAssociationFromPath': getAssociationFromPath,
    'getCsrfToken': getCsrfToken,
    'getLastSubmission': function () {
      return lastSubmission;
    },
    'saveRubric': saveRubric
  };

  var jsonImportFeature = {
    'initiated': false,
    '_init': function () {
      if (this.initiated) {
        return;
      }

      if (assocRegex.test(window.location.pathname)) {
        if (add_button()) {
          this.initiated = true;
        }
      } else {
      }
    }
  };

  window.BTECH_RUBRIC_JSON_IMPORT_FEATURE = jsonImportFeature;
  window.IMPORTED_FEATURE = jsonImportFeature;

  window.BTECH_RUBRIC_JSON_IMPORT_FEATURE._init();
})();

/*
  AI rubric prompt page:
  custom_features/rubrics/upload_rubric/ai_rubric_prompt.md
*/
