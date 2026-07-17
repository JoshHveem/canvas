TOOLBAR_STYLES = {
  init: async function () {
    let css = await $.get("https://bridgetools.dev/canvas/style/rce.css");
    tinyMCE.activeEditor.iframeElement.contentDocument.getElementsByTagName('style')[0].innerHTML = tinyMCE.activeEditor.iframeElement.contentDocument.getElementsByTagName('style')[0].innerHTML + css;
    return
    //THIS DOESN'T WORK! FOR RANDOM PEOPLE DESTROYING AND RECREATING SETTINGS BREAKS THE CANVAS SAVE BUTTON
    let savedSettings = tinymce.activeEditor.settings;
    //save the setup function
    //create a new setup function that first calls the old one, then adds whatever button you want (or other settings)
    //save current settings so you don't lose anything Canvas has set up
    savedSettings.content_css.push("https://bridgetools.dev/canvas/style/rce.css");
    //get rid of the current editor
    tinymce.activeEditor.destroy();
    //reset up with modified settings
    tinymce.init(savedSettings);
  }
}