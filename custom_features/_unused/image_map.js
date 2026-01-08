(async function () {
  imageOptions = [
    'btech-image-map'
  ];
  //escape if not on the editor page
  if (!TOOLBAR.checkEditorPage()) return;
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

  function resetImageButtons() {
    let node = tinyMCE.activeEditor.selection.getNode();
    let parent = tinyMCE.activeEditor.dom.getParent(node, "img");
    $('.btech-image-edit-button').each(function () {
      $(this).css({
        'background-color': '#eee',
        'color': '#000'
      });
      let className = $(this).attr('id').replace("-button", "");
      if (parent !== null) {
        if ($(parent).hasClass(className)) {
          let bgColor = getComputedStyle(document.documentElement, null).getPropertyValue("--ic-brand-button--secondary-bgd-darkened-5");
          $(this).css({
            'background-color': bgColor,
            'color': '#fff'
          });
        }
      }
    });
  }

  function linkImageMapToTable(imageId) {
    let img = $(tinyMCE.activeEditor.iframeElement.contentDocument.getElementsByClassName("image-id-" + imageId)[0]);
    let table = $(tinyMCE.activeEditor.iframeElement.contentDocument.getElementsByClassName("image-id-" + imageId + "-table")[0]);
    img.click(function (e) {
      var offset = $(this).offset();
      let width = $(this).width();
      let height = $(this).height();
      var relativeX = Math.round((e.pageX - offset.left) / width * 100);
      var relativeY = Math.round((e.pageY - offset.top) / height * 100);
      // let icon = $("<i class='icon-video' style='position: absolute;'></i>")
      let row = $("<tr><td>-INSERT CONTENT HERE-</td><td>" + relativeX + "</td><td>" + relativeY + "</td></tr>");
      table.find("tbody").prepend(row);
    });
  }

  function getImageId(img) {
    let classes = img.attr('class').split(/\s+/);
    for (var c = 0; c < classes.length; c++) {
      try {
        imageId = classes[c].match(/^image-id-(.*)/)[1];
        return imageId;
      } catch (e) {
      }
    }
    return null;
  }

  async function imageMapCreate() {
    let editor = tinymce.activeEditor;
    let originalImage = await addClassToImage("btech-image-map-image");
    if ($(originalImage).hasClass('btech-image-map-image')) {
      let imageId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      tinymce.activeEditor.dom.addClass(originalImage, "image-id-" + imageId);
      editor.execCommand("mceReplaceContent", false, originalImage.outerHTML + "<table class='btech-image-map-table image-id-" + imageId + "-table btech-hidden'><thead><tr><th>Content</th><th>x%</th><th>y%</th></tr></thead><tbody></tbody></table>");
      linkImageMapToTable(imageId);
    } else {
      //get the image id and delete the corresponding table
    }
  }

  await TOOLBAR.checkReady();
  TOOLBAR.addButtonIcon("icon-star", "Convert an image to an Image Map.", imageMapCreate);
  //set up all existing image maps
  let imgs = tinyMCE.activeEditor.iframeElement.contentDocument.getElementsByClassName("btech-image-map-image");
  for (let i = 0; i < imgs.length; i++) {
    let img = $(imgs[i]);
    let imageId = getImageId(img);
    if (imageId !== null) {
      linkImageMapToTable(imageId);
    }
  }

  //whenever you click in the editor, see if it's selected a table with one of the classes
  tinymce.activeEditor.on("click", function () {
    resetImageButtons();
  });
})();
/*  add in once you figure out what to do with this
let img = $(tinyMCE.activeEditor.iframeElement.contentDocument.getElementsByClassName("btech-image-map-image")[0]);
let table = $(tinyMCE.activeEditor.iframeElement.contentDocument.getElementsByClassName("btech-image-map-table")[0]);
let container = $(tinyMCE.activeEditor.iframeElement.contentDocument.getElementsByClassName("btech-image-map-container")[0]);
container.css({
  'position': 'relative'
});
img.click(function (e) {
  var offset = $(this).offset();
  let width = $(this).width();
  let height = $(this).height();
  var relativeX = Math.round((e.pageX - offset.left) / width * 100);
  var relativeY = Math.round((e.pageY - offset.top) / height * 100);
  // let icon = $("<i class='icon-video' style='position: absolute;'></i>")
  let row = $("<tr><td>-INSERT VIDEO-</td><td>" + relativeX + "</td><td>" + relativeY + "</td></tr>");
  table.find("tbody").append(row)
});
*/