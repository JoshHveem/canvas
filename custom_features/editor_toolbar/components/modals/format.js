// AN AUTO FORMATTER FOR THE WHOLE PAGE. BARE BONES, BUT IS QUICK
  function formatPage() {
    let body = tinyMCE.activeEditor.getBody();
    let children = $(body).children();
    let headerNum = -1;
    let headerName = null;
    let alt = true;
    let customColor = $("#btech-custom-editor-buttons-color").val();
    $(body).find('.btech-formatted-content-wrapper').each(function () {
      $(this).contents().unwrap();
    });
    $(body).find('.btech-sections').each(function () {
      $(this).contents().unwrap();
    });
    $(body).find('.btech-sections-header').each(function () {
      $(this).find('.btech-sections-header-content').contents().unwrap();
      $(this).removeClass('.btech-sections-header');
    });
    for (let i = 0; i < children.length; i++) {
      let child = $(children[i])[0];
      //find out the header to check for
      if (headerName === null) {
        if (child.tagName.charAt(0) === "H") {
          headerName = child.tagName;
        }
      }
      if (headerName !== null) {
        if (child.tagName === headerName || (i === children.length - 1)) {
          if (headerNum > -1) {
            let arrGroup = [];
            for (var j = headerNum; j < i; j++) {
              arrGroup.push($(children[j])[0]);
            }
            //make sure to include the last element
            if (i === children.length - 1) {
              arrGroup.push($(children[i])[0]);
            }
            //alternate background color
            let bgColor = "#fff";
            if (alt) {
              bgColor = "#f6f6f6";
            }
            alt = !alt;
            let header = $(children[headerNum]);
            header.css({
              'text-align': 'center',
            });
            header.addClass("btech-sections-header");
            header.wrapInner(`<span class='btech-sections-header-content' style="background-color: ${customColor}; color: #FFFFFF"></span>`);
            $(arrGroup).wrapAll("<div class='btech-sections' style='border: 1px solid #ddd; background-color: " + bgColor + "; padding: 5px; padding-top: 15px; margin-top: 25px;'></div>");
          }
          headerNum = i;
        }
      }
    }
  }