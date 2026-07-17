(async function () {
  //escape if not on the editor page
  if (!TOOLBAR.checkEditorPage()) return;
  async function hideOnHover() {
    let editor = TOOLBAR.editor;
    let selection = editor.selection;
    editor.execCommand("mceReplaceContent", false, "<span class='btech-hover-show'><i>{$selection}</i></span>");
  }

  async function hoverDefinition() {
    let editor = TOOLBAR.editor;
    let selection = editor.selection;
    editor.execCommand("mceReplaceContent", false, "<strong class='tooltip'>{$selection}<span class='tooltiptext'>-DEFINITION-</span></strong>");
  }


  async function exampleBox() {
    let editor = TOOLBAR.editor;
    let selection = editor.selection;
    let color = $("#btech-custom-editor-buttons-color").val();
    let fontColor = "#FFFFFF";
    editor.execCommand("mceReplaceContent", false, `<table class="btech-example-table" style="width: 90%; border-collapse: collapse; border-color: gray; margin-left: auto; margin-right: auto; height: 62px;" border="0" cellpadding="10">
      <tbody>
      <tr style="background-color: ` + color + `;">
      <td style="width: 1%; height: 32px;"><span style="font-size: 14pt;"><strong><span style="color: #ffffff;">&nbsp;</span></strong></span></td>
      <td style="width: 98%; height: 32px;"><span style="font-size: 14pt;"><strong><span style="color: #ffffff;">&nbsp;Title</span></strong></span></td>
      <td style="width: 1%; height: 32px;"><span style="font-size: 14pt;"><strong><span style="color: #ffffff;">&nbsp;</span></strong></span></td>
      </tr>
      <tr style="height: 30px; background-color: #fff; color: #000;">
      <td style="height: 30px;"><span>&nbsp;</span></td>
      <td style="height: 30px;">
      {$selection}
      </td>
      <td style="height: 30px;"><span>&nbsp;</span></td>
      </tr>
      </tbody>
      </table>`);
  }

  function citationInsert(bg) {
    let editor = TOOLBAR.editor;
    let name = $("#citation-name").val();
    let authorLast = $("#citation-author-last").val();
    let publisher = $("#citation-publisher").val();
    let date = $("#citation-date-accessed").val();
    let url = $("#citation-url").val();
    if (name != "" && authorLast != "") {
      let citationString = "";
      $(".citation-author").each(function () {
        let authorEl = $(this);
        let last = authorEl.find(".last-name").val();
        let first = authorEl.find(".first-name").val();
        if (last !== "") {
          citationString += (last + ", " + first.charAt(0) + ". ")
        }
      })
      if (date !== "") {
        citationString += ("(" + date.slice(0, 4) + "). ");
      }

      citationString += ("<i>" + name + "</i>. ");
      if (publisher !== "") {
        citationString += (publisher + ". ")
      }
      if (url !== "") {
        citationString += ("Retrieved from " + url);
      }
      citationString = "<p class='btech-citation'>" + citationString + "</p>";
      editor.execCommand("mceReplaceContent", false, `<p>` + citationString + `</p>`);
      bg.remove();
    }
  }
  async function citationKeypress(bg) {
    let editor = TOOLBAR.editor;
    $(".citation-information").keypress(function (event) {
      var keycode = (event.keyCode ? event.keyCode : event.which);
      if (keycode == '13') {
        citationInsert(bg);
      }
      event.stopPropagation();
    });
  }
  async function citation() {
    let bg = TOOLBAR.addBackground();
    bg.find('#background-container').append(`
    <p>Name of Image, Book, Article, Video, etc.*</p>
    <input style='width: 100%; height: 40px; box-sizing: border-box;' type="text" class="citation-information" id="citation-name">
    <p>Author(s)*</p>
    <div id="citation-authors">
      <div class="citation-author">
        <input placeholder="first name" style='width: 49%; height: 40px; box-sizing: border-box;' type="text" class="citation-information first-name" id="citation-author-first">
        <input placeholder="last name" style='width: 49%; height: 40px; box-sizing: border-box;' type="text" class="citation-information last-name" id="citation-author-last">
      </div>
    </div>
    <a class='btn' id="citation-add-author">Add Author</a>
    <p>Date Published</p>
    <input style='width: 100%; height: 40px; box-sizing: border-box;' type="date" class="citation-information" id="citation-date-accessed">
    <p>Publisher</p>
    <input style='width: 100%; height: 40px; box-sizing: border-box;' type="text" class="citation-information" id="citation-publisher">
    <p>URL (If Applicable)</p>
    <input style='width: 100%; height: 40px; box-sizing: border-box;' type="text" class="citation-information" id="citation-url">
    <a class='btn' id="citation-submit">Create</a>
    `);
    let addAuthor = $("#citation-add-author");
    addAuthor.click(function () {
      $("#citation-authors").append(`
    <div class="citation-author">
      <input placeholder="first name" style='width: 49%; height: 40px; box-sizing: border-box;' type="text" class="citation-information first-name">
      <input placeholder="last name" style='width: 49%; height: 40px; box-sizing: border-box;' type="text" class="citation-information last-name">
    </div>
    `);
      citationKeypress(bg);
    });
    let submit = $("#citation-submit");
    submit.click(function () {
      citationInsert(bg);
    });
    citationKeypress(bg);
  }

  function formatPage() {
    let body = tinyMCE.activeEditor.getBody();
    let children = $(body).children();
    let headerNum = -1;
    let headerName = null;
    let alt = true;
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
              bgColor = "#eaeaea";
            }
            alt = !alt;
            let header = $(children[headerNum]);
            header.css({
              'text-align': 'center',
            });
            header.addClass("btech-sections-header");
            header.wrapInner("<span class='btech-sections-header-content'></span>");
            $(arrGroup).wrapAll("<div class='btech-sections' style='border: 1px solid #ddd; background-color: " + bgColor + "; padding: 5px; padding-top: 15px; margin-top: 25px;'></div>");
          }
          headerNum = i;
        }
      }
    }
  }

  function replaceExternalFiles() {
    let body = tinyMCE.activeEditor.getBody();
    let bodyText = $(body).html();
    let externalLinks = [...bodyText.matchAll(/src=\"(.)+?courses\/([0-9]+)\/files\/([0-9]+)/g)];
    let courseId = parseInt(window.location.pathname.match(/courses\/([0-9]+)/)[1]);
    $.get("/api/v1/courses/" + courseId + "/folders").done(function (data) {
      console.log(data);
      for (let d = 0; d < data.length; d++) {
        let folderData = data[d];
        if (folderData.name == "course files") {

          url = "/api/v1/folders/" + data[d].id + "/copy_file?source_file_id=" + 95008571 + "&on_duplicate=rename";
          $.post(url).done(function (data) {
            console.log(data);
          });
          break;
        }
      }
    });
  }

  function addCustomThemeParent() {
    let body = tinyMCE.activeEditor.getBody();
    let existingTheme = $(body).find("#btech-theme-parent");
    if (existingTheme.length === 0) {
      $(body).prepend(`
    <div id="btech-theme-parent" style="border: 1px solid #000; padding: 5px;">
      <span>
        This information will all be hidden on render. Just make sure that when applying changes you have selected the entire element. (triple click or drag select from the starting # to the ending #)
      </span>
      <br />
      <span class="btech-theme-header" style="background-color: #3366ff; color: #ffffff;">
        #HEADER STYLE# 
      </span>
      <br />
      <span class="btech-theme-header-hover" style="background-color: #000080; color: #ffffff;">
        #HEADER HOVER STYLE#
      </span>
    </div>
  `);
    } else {
      existingTheme.remove();
    }
  }
  await TOOLBAR.checkReady();

  //Add in option to change color of exampleBox. IE, you click in it, it figures out he color selected, if you change the color, it changes the box
  TOOLBAR.toolbar.prepend(`<input type="color" id="btech-custom-editor-buttons-color" value="#d22232" style="width: 48px; padding: 4px; padding-right: 0px;" list="default-colors"/>
    <datalist id="default-colors">
      <option>#d22232</option>
      <option>#2232d2</option>
      <option>#1f89e5</option>
      <option>#32A852</option>
      <option>#E2A208</option>
      <option>#000000</option>
      <option>#FFFFFF</option>
    </datalist>
    `);

  TOOLBAR.addButtonIcon("icon-unmuted", "Insert an information box. Can be used for warnings, examples, etc.", exampleBox);
  TOOLBAR.addButtonIcon("icon-compose", "Insert a citation.", citation);
  TOOLBAR.addButtonIcon("icon-off", "Hide text. Reveal on mouse hover.", hideOnHover);
  TOOLBAR.addButtonIcon("icon-student-view", "Insert text which is shown on mouse hover.", hoverDefinition);
  //TOOLBAR.addButtonIcon("far fa-swatchbook", "Create a theme for the page. The template will be inserted at the top of the page. Edit the template to apply changes throughout the page.", addCustomThemeParent);
  TOOLBAR.addButtonIcon("icon-materials-required", "Auto format the page to break the page into sections. Sections are determined by the top level heading.", formatPage);
})();