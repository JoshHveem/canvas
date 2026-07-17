TOOLBAR = {
  selects: {},
  toolbar: null,
  initted: false,

  async getEditor() {
    await this.checkReady(1);
    return tinymce.activeEditor;
  },

  async checkReady(override=0) {
    if (!window?.tinymce?.activeEditor?.initialized || (override === 0 && !TOOLBAR.initted)) {
      await delay(500);
      return this.checkReady(override);
    } else {
      return;
    }
  },

  addBackground(remove) {
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
      </div>
      `);
    $("body").append(bg);
    if (remove) this.addBackgroundClosing(bg);
    return bg;
  },

  //This needs to be called after all children are added to the backround otherwise it'll close on click anywhere.
  addBackgroundClosing(bg) {
    bg.click(function (e) {
      if (e.target !== this)
        return;
      $(this).remove();
    });
  },

  selectNameToId(name) {
    let id = "btech-custom-editor-select-" + name.replace(" ", "-");
    return id;
  },

  async addSelect(name, description) {
    let feature = this;
    feature.selects[name] = {};
    let customButtonsContainer = $("#btech-custom-editor-buttons-container");
    let id = this.selectNameToId(name);
    let select = "<select title='" + description + "' id='" + id + "'><option selected disabled>-" + name + " options-</option></select>";
    customButtonsContainer.append(select);
    $("#" + id).change(function () {
      let value = $(this).val();
      let func = feature.selects[name][value];
      if (func !== undefined) {
        func();
      }
    })
    return select;
  },

  async addSelectOption(name, selectName, description, func, className, data={}) {
    let feature = this;
    let selectId = this.selectNameToId(selectName);
    feature.selects[selectName][name] = func;
    let select = $("#" + selectId);
    let option = $("<option title='" + description + "' class='" + className + "' value='" + name + "'>" + name + "</option>");
    for (let d in data) {
      option.attr("data-" + d, data[d]);
    }
    select.append(option);
    return option;
  },

  async addButton(name, func, className = '') {
    let customButtonsContainer = $("#btech-custom-editor-buttons-container");
    let button = $("<a class='btn " + className + "' style='padding: 5px; background-color: #EEE; color: #000; border: 1px solid #AAA; cursor: pointer;'>" + name + "</a>");
    button.click(func);
    customButtonsContainer.append(button);
    return button;
  },
  async addButtonIcon(icon, ariaLabel, description, func, className = '') {
    let customButtonsContainer = $("#btech-custom-editor-buttons-container");
    let button = $(`<div aria-label="${ariaLabel}" title="${description}" style="padding: 4px 8px; color: #000; cursor: pointer;"><i style="font-size: 1rem;" class="${icon} ${className}"></i></a>`);
    button.click(func);
    customButtonsContainer.append(button);
    return button;
  },

  checkEditorPage() {
    if (window.location.pathname.includes("edit")) return true;
    return false;
  },

  async _init() {
    await TOOLBAR_STYLES.init();
    this.editor = await this.getEditor();
    if ($("#btech-custom-editor-buttons-container").length === 0) {
      // this.editor.addShortcut("ctrl+alt+h", "The highlighted font will be hidden until the reader highlights it.", hideOnHover);
      // this.editor.addShortcut("ctrl+alt+e", "the highlighted font will be put inside of an emphasis box.", exampleBox);
      // this.editor.addShortcut("ctrl+alt+d", "the highlighted font will display a definition on hover.", exampleBox);
      // this.editor.addShortcut("ctrl+alt+g", "Insert a table that is linked to a google sheet.", googleSheetsTable);
      // this.editor.addShortcut("ctrl+alt+q", "Insert a citation.", googleSheetsTable);
      TOOLBAR.toolbar = $("<div id='btech-custom-editor-buttons-container'></div>")
      $(".tox-editor-header").append(TOOLBAR.toolbar);
    }
    TOOLBAR.initted = true;
  }
}
if (TOOLBAR.checkEditorPage()) TOOLBAR._init();