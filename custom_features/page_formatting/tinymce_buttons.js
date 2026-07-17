tableOptions = [
  'btech-tabs-table',
  'btech-dropdown-table'
];

async function getEditor() {
  if (window.tinymce === undefined) {
    await delay(500);
    return getEditor();
  } else {
    return tinymce.activeEditor;
  }
}
async function hideOnHover() {
  let editor = await getEditor();
  let selection = editor.selection;
  editor.execCommand("mceReplaceContent", false, "<span class='btech-hover-show'><i>{$selection}</i></span>");
}

async function hoverDefinition() {
  let editor = await getEditor();
  let selection = editor.selection;
  editor.execCommand("mceReplaceContent", false, "<strong class='tooltip'>{$selection}<span class='tooltiptext'>-DEFINITION-</span></strong>");
}

async function exampleBox() {
  let editor = await getEditor();
  let selection = editor.selection;
  let color = $("#btech-custom-editor-buttons-color").val();
  let fontColor = "#FFFFFF";
  editor.execCommand("mceReplaceContent", false, `<table class="btech-example-table" style="width: 90%; border-collapse: collapse; border-color: gray; margin-left: auto; margin-right: auto; height: 62px;" border="0" cellpadding="10">
<tbody>
<tr style="background-color: ` + color + `;">
<td style="width: 2.5%; height: 32px;"><span style="font-size: 14pt;"><strong><span style="color: #ffffff;">&nbsp;</span></strong></span></td>
<td style="width: 95%; height: 32px;"><span style="font-size: 14pt;"><strong><span style="color: #ffffff;">&nbsp;Title</span></strong></span></td>
<td style="width: 2.5%; height: 32px;"><span style="font-size: 14pt;"><strong><span style="color: #ffffff;">&nbsp;</span></strong></span></td>
</tr>
<tr style="height: 30px; background-color: #fff; color: #000;">
<td style="width: 1.72752%; height: 30px;"><span>&nbsp;</span></td>
<td style="width: 95.1494%; height: 30px;">
{$selection}
</td>
<td style="width: 2.77243%; height: 30px;"><span>&nbsp;</span></td>
</tr>
</tbody>
</table>`);
}

function addBackground() {
  let bg = $(`
  <div style="
      overflow: auto; 
      position: fixed; 
      background-color: rgba(0, 0, 0, 0.5); 
      width: 100%; 
      height: 100%; 
      left: 0; 
      top: 0; 
      z-index:1000;
    ">
    <div id='background-container' style='
      width: 500px;
      left: 50%;
      transform: translate(-50%, -50%);
      position:fixed;
      top: 50%;
      z-index:1000;
      transition: 0.5s;
      background-color: #FFF;
      border: 2px solid #888;
      padding: 10px 20px;
      color: #000;
      border-radius: 5px;
    '>
    </div>
  </div>`);
  $("body").append(bg);
  addBackgroundClosing(bg);
  return bg;
}
//This needs to be called after all children are added to the backround otherwise it'll close on click anywhere.
function addBackgroundClosing(bg) {
  bg.click(function (e) {
    if (e.target !== this)
      return; 
    $(this).remove();
  });
}
async function citationKeypress(bg) {
  let editor = await getEditor();
  $(".citation-information").keypress(function (event) {
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if (keycode == '13') {
      let name = $("#citation-name").val();
      let authorLast = $("#citation-author-last").val();
      let publisher = $("#citation-publisher").val();
      let date = $("#citation-date-accessed").val();
      let url = $("#citation-url").val();
      if (name != "" && authorLast != "") {
        let citationString = ""; 
        $(".citation-author").each(function() {
          let authorEl = $(this);
          let last = authorEl.find(".last-name").val();
          let first = authorEl.find(".first-name").val();
          if (last !== "") {
            citationString += (last + ", " + first.charAt(0) + ". ")
          }
        })
        if (date !== "") {
          citationString += ("(" + date.slice(0,4) + "). ");
        }
        
        citationString += ("<i>" +name + "</i>. ");
        if (publisher !== "") {
          citationString += (publisher + ". ")
        }
        if (url !== "") {
          citationString += ("Retrieved from "+url);
        }
        citationString = "<p class='btech-citation'>" + citationString + "</p>";
        editor.execCommand("mceReplaceContent", false, `<p>`+citationString+`</p>`);
        bg.remove();
      }
    }
    event.stopPropagation();
  });
}
async function citation() {
  let bg = addBackground();
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
    `);
  let addAuthor = $("#citation-add-author");
  addAuthor.click(function() {
    $("#citation-authors").append(`
    <div class="citation-author">
      <input placeholder="first name" style='width: 49%; height: 40px; box-sizing: border-box;' type="text" class="citation-information first-name">
      <input placeholder="last name" style='width: 49%; height: 40px; box-sizing: border-box;' type="text" class="citation-information last-name">
    </div>
    `);
    citationKeypress(bg);
  });
  citationKeypress(bg);
}
async function googleSheetsTable() {
  let editor = await getEditor();
  let selection = editor.selection;
  let bg = addBackground();
  bg.append(`
    <div id='google-sheet-id-container' style='
    width: 500px;
    left: 50%;
    transform: translate(-50%, -50%);
    position:fixed;
    top: 50%;
    z-index:1000;
    transition: 0.5s;
    background-color: #FFF;
    border: 2px solid #888;
    padding: 10px 20px;
    color: #000;
    border-radius: 5px;'>
    Enter Google Sheet Id<br><input style='width: 100%;' type="text" id="google-sheet-id">
    </div>
    </div>`);
  bg.click(function () {
    $(this).remove();
  }).children().click(function (e) {
    return false;
  });
  $("#google-sheet-id").keypress(function (event) {
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if (keycode == '13') {
      //*
      editor.execCommand("mceReplaceContent", false, `
<table class="google-sheet-based sheet-` + $(this).val() + `">
<tbody>
<tr>
<td>
{$selection}
</td>
</tr>
</tbody>
</table>`);
      //*/
      bg.remove();
    }
    event.stopPropagation();
  });
}
async function addClassToTable(className) {
  //get the currently selected node
  let node = tinyMCE.activeEditor.selection.getNode();
  //get the parent
  let parent = tinyMCE.activeEditor.dom.getParent(node, "table");
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
}

async function addButton(name, func, className = '') {
  let customButtonsContainer = $("#btech-custom-editor-buttons-container");
  let button = $("<a class='btn " + className + "' style='padding: 5px; background-color: #EEE; color: #000; border: 1px solid #AAA; cursor: pointer;'>" + name + "</a>");
  button.click(func);
  customButtonsContainer.append(button);
  return button;
}
async function addButtonIcon(icon, description, func, className = '') {
  let customButtonsContainer = $("#btech-custom-editor-buttons-container");
  let button = $("<div title='" + description + "' style='padding: 4px 8px; color: #000; cursor: pointer;'><i style='font-size: 1rem;' class='" + icon + " " + className + "'></i></a>");
  button.click(func);
  customButtonsContainer.append(button);
  return button;
}

function resetTableButtons() {
  let node = tinyMCE.activeEditor.selection.getNode();
  let parent = tinyMCE.activeEditor.dom.getParent(node, "table");
  $('.btech-table-edit-button').each(function () {
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
async function _init() {
  let editor = await getEditor();
  let topPart = null;
  if (tinymce.majorVersion === "4") {
    topPart = await getElement(".mce-top-part");
  } else if (tinymce.majorVersion === "5") {
    topPart = await getElement(".edit-header");
  }
  if (topPart !== null && $("#btech-custom-editor-buttons-container").length === 0) {
    editor.addShortcut("ctrl+alt+h", "The highlighted font will be hidden until the reader highlights it.", hideOnHover);
    editor.addShortcut("ctrl+alt+e", "the highlighted font will be put inside of an emphasis box.", exampleBox);
    editor.addShortcut("ctrl+alt+d", "the highlighted font will display a definition on hover.", exampleBox);
    editor.addShortcut("ctrl+alt+g", "Insert a table that is linked to a google sheet.", googleSheetsTable);
    editor.addShortcut("ctrl+alt+q", "Insert a citation.", googleSheetsTable);
    topPart.after("<div id='btech-custom-editor-buttons-container'></div>");
    let customButtonsContainer = $("#btech-custom-editor-buttons-container");
    customButtonsContainer.prepend(`<input type="color" id="btech-custom-editor-buttons-color" value="#d22232" style="width: 48px; padding: 4px; padding-right: 0px;" list="default-colors"/>
    <datalist id="default-colors">
      <option>#d22232</option>
      <option>#2232d2</option>
      <option>#32A852</option>
      <option>#E2A208</option>
      <option>#000000</option>
      <option>#FFFFFF</option>
    </datalist>
    `);
    addButtonIcon("far fa-bullhorn", "Insert an information box. Can be used for warnings, examples, etc.", exampleBox);
    addButtonIcon("far fa-quote-right", "Insert a citation.", citation);
    addButtonIcon("far fa-hand-point-up", "Hide text. Reveal on mouse hover.", hideOnHover);
    addButtonIcon("far fa-comment-alt-lines", "Insert text which is shown on mouse hover.", hoverDefinition);
    // addButton("Google Sheets Table", googleSheetsTable);
    addButtonIcon("far fa-file-spreadsheet", "Insert a table which will be linked to a google sheet. You will need the google sheet id.", googleSheetsTable);
    addButtonIcon("far fa-swatchbook", "Create a theme for the page. The template will be inserted at the top of the page. Edit the template to apply changes throughout the page.", addCustomThemeParent);
    addButtonIcon("far fa-stream", "Auto format the page to break the page into sections. Sections are determined by the top level heading.", formatPage);
    for (let i = 0; i < tableOptions.length; i++) {
      let className = tableOptions[i];
      let optionName = "Table->" + className.replace("btech-", "").replace("-table", "");
      let btn = await addButton(optionName, function () {
        addClassToTable(className);
        resetTableButtons();
      }, 'btech-table-edit-button');
      btn.attr('id', className + '-button');
    }
    //whenever you click in the editor, see if it's selected a table with one of the classes
    tinymce.activeEditor.on("click", function () {
      resetTableButtons();
    });
  }
}
if (window.location.pathname.includes("edit")) _init();