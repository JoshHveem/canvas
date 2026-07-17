(async function () {
  if (!TOOLBAR.checkEditorPage()) return;

  imgOptions = [
    'btech-graphic-image',
    'btech-img-align'
  ]

  function resetImgButtons() {
    let bgColor = getComputedStyle(document.documentElement, null).getPropertyValue("--ic-brand-button--secondary-bgd-darkened-5");
    let node = tinyMCE.activeEditor.selection.getNode();
    let parent = tinyMCE.activeEditor.dom.getParent(node, "img");
    console.log(parent);
    for (let c = 0; c < imgOptions.length; c++) {
      let className = imgOptions[c];
      let optionClassName = className + '-option';
      $('.' + optionClassName).css({
        'color': '#000'
      });
      if (parent !== null) {
        if ($(parent).hasClass(className)) {
          $('.' + optionClassName).css({
            'color': bgColor
          });

        }
      }
    }
  }
  async function addClassToImage(className) {
    //get the currently selected node
    let node = tinyMCE.activeEditor.selection.getNode();
    //get the parent
    let parent = tinyMCE.activeEditor.dom.getParent(node, "img");
    if (parent !== null) {
      //see if it's already got the class in question, if so remove it, otherwise remove all other classes and add that one
      if ($(parent).hasClass(className)) {
        tinyMCE.activeEditor.dom.removeClass(parent, className);
      } else {
        for (let i = 0; i < tableOptions.length; i++) {
          let _class = tableOptions[i];
          tinyMCE.activeEditor.dom.removeClass(parent, _class);
        }
        tinyMCE.activeEditor.dom.addClass(parent, className);
      }
    }
    return parent;
  }

  function blurGraphicImage() {
    addClassToImage('btech-graphic-image');
  }

  function setImageAlign() {
    addClassToImage('btech-img-align');
  }
  TOOLBAR.addButtonIcon("icon-image", "Blur image with graphic content.", function() {blurGraphicImage();resetImgButtons();}, 'btech-img-option btech-graphic-image-option');
  // TOOLBAR.addButtonIcon("far fa-arrows-alt-h", "Set image to appear on same row as images adjacent to it.", function() {setImageAlign();resetImgButtons();}, 'btech-img-option btech-img-align-option');
  tinymce.activeEditor.on("click", function () {
    resetImgButtons();
  });
})();