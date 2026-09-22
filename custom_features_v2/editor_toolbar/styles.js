window.TOOLBAR_STYLES = window.TOOLBAR_STYLES || {
  init: async function () {
    const css = await $.get("https://bridgetools.dev/canvas/style/rce.css");
    const style = tinymce.activeEditor?.iframeElement?.contentDocument?.getElementsByTagName('style')[0];
    if (style && !style.textContent.includes(css)) style.textContent += css;
  }
};
