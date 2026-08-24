(async function () {
  'use strict';

  if (window.location.pathname !== '/conversations') return;
  if (window.__btechInboxPrefillInitialized) return;
  window.__btechInboxPrefillInitialized = true;

  const url = new URL(window.location.href);
  const prefill = String(url.searchParams.get('prefill') ?? '').trim();
  if (!prefill) return;

  let applied = false;
  let animationFrameId = 0;
  let observer;

  function isVisible(element) {
    return Boolean(element?.isConnected && element.getClientRects().length);
  }

  function getComposeRoots() {
    const roots = Array.from(document.querySelectorAll('[role="dialog"], .ui-dialog, [data-testid*="compose"]'))
      .filter(isVisible);
    return roots.length ? roots : [document];
  }

  function findMessageField() {
    const fields = getComposeRoots().flatMap(root => Array.from(root.querySelectorAll(
      'textarea, [contenteditable="true"][role="textbox"]'
    ))).filter(isVisible);

    return fields.find(field => field.tagName === 'TEXTAREA')
      || fields.find(field => /message|body|compose/i.test([
        field.getAttribute('aria-label'),
        field.getAttribute('placeholder'),
        field.getAttribute('name'),
        field.getAttribute('data-testid')
      ].join(' ')))
      || null;
  }

  function getFieldValue(field) {
    return field.tagName === 'TEXTAREA' ? field.value : field.textContent;
  }

  function setFieldValue(field, value) {
    if (field.tagName === 'TEXTAREA') {
      const valueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;
      if (valueSetter) valueSetter.call(field, value);
      else field.value = value;
    } else {
      field.textContent = value;
    }

    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function removePrefillParam() {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete('prefill');
    window.history.replaceState(window.history.state, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }

  function applyPrefill() {
    if (applied) return true;

    const field = findMessageField();
    if (!field || String(getFieldValue(field) ?? '').trim()) return false;

    setFieldValue(field, prefill);
    applied = true;
    removePrefillParam();
    observer?.disconnect();
    return true;
  }

  function schedulePrefill() {
    if (applied || animationFrameId) return;
    animationFrameId = window.requestAnimationFrame(() => {
      animationFrameId = 0;
      applyPrefill();
    });
  }

  observer = new MutationObserver(schedulePrefill);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', schedulePrefill, true);
  schedulePrefill();
})();
