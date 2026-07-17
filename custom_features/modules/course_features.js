(function () {
  IMPORTED_FEATURE = {};
  if (true) { //check the window location
    //THIS IS A TEMPLATE/TUTORIAL FOR HOW TO ADD A CUSTOM FEATURE
    IMPORTED_FEATURE = {
      initiated: false, //SET TO TRUE WHEN feature() IS RUN FROM THE custom_canvas.js PAGE TO MAKE SURE FEATURE ISN'T INITIATED TWICE
      courseId: '',
      settingsEl: null,
      async getSettings() {
        let feature = this;
        $('body').append("<settings id='btech-custom-settings'></settings>");
        feature.settingsEl = $("#btech-custom-settings");
        feature.settingsEl.hide();
        feature.createSettingsPage();
        try {
          await $.get("/api/v1/courses/" + feature.courseId + "/pages/btech-custom-settings").success(function (data) {
            //if custom settings page exists, look for the appropriate header
            feature.settingsEl.html(data.body);
          });
        } catch (e) {
          console.log(e);
        }
        return;
      },
      async createSettingsPage() {
        let feature = this;
        feature.settingsEl.html(`
          <h2>ABOUT</h2>
          <p>Do not edit/delete this page.</p>
          <p>This page was created to store date for custom course features. All saved features will be lost if this page is deleted.</p>
          <h2>SETTINGS</h2>
        `);
      },
      async getSettingData(settingId) {
        let val = "";
        let settings = this.settingsEl;
        if (settings !== null) {
          let setting = settings.find('#' + settingId);
          if (setting.length > 0) {
            //get the name of the page to append and then grab the page
            val = setting.text();
          }
        }
        return val;
      },
      async updateSetting(settingId, value) {
        let setting = this.settingsEl.find("#" + settingId);
        if (setting.length == 0) {
          setting = $("<div id='" + settingId + "'></div>");
          this.settingsEl.append(setting);
        }
        setting.text(value);
      },
      async _init(params = {}) { //SOME FEATURES NEED CUSTOM PARAMS DEPENDING ON THE USER/DEPARTMENT/COURSE SUCH AS IF DENTAL HAS ONE SET OF RULES GOVERNING FORMATTING WHILE BUSINESS HAS ANOTHER
        let feature = this;
        let rPieces = /^\/courses\/([0-9]+)/;
        let pieces = window.location.pathname.match(rPieces);
        feature.courseId = parseInt(pieces[1]);

        if (!IS_TEACHER) {
          if (window.location.pathname === "/courses/" + feature.courseId + "/pages/btech-custom-settings") {
            window.location.replace("/courses/" + feature.courseId);
          }
        }

        await this.getSettings();
        //get header on modules page and add an empty div
        let moduleModal = $(".header-bar");
        let moduleHeader = $("<div></div>");
        moduleModal.after(moduleHeader);
        let modulesPage = false;

        if (/^\/courses\/[0-9]+\/modules/.test(window.location.pathname)) {
          modulesPage = true;
        } else if (/^\/courses\/[0-9]+/.test(window.location.pathname)) {
          if (ENV.COURSE !== undefined) {
            if (ENV.COURSE.default_view === 'modules') {
              modulesPage = true;
            }
          }
        }
        if (modulesPage) {
          //get course id
          let pageName = await this.getSettingData('modules-page-header')
          //if FRONT-PAGE then just get the front page, otherwise, selec the specific page
          if (pageName === "#NO PAGE#") {
            console.log("No Page Selected");
          } else if (pageName === "#FRONT PAGE#") {
            $.get("/api/v1/courses/" + feature.courseId + "/front_page", function (data) {
              moduleHeader.append(data.body);
            });
          } else {
            $.get("/api/v1/courses/" + feature.courseId + "/pages/" + pageName, function (data) {
              moduleHeader.append(data.body);
            });
          }
          if (IS_TEACHER) {
            let select = $("<select></select>");
            let noPage = $("<option value='#NO PAGE#' selected>-no page-</option>");
            select.append(noPage);
            //This is just a temporary thing. I'm hiding the select dropdown until we officially roll this out
            moduleHeader.append(select);
            $.get("/api/v1/courses/" + feature.courseId + "/pages").done(function (data) {
              select.append("<option value='#FRONT PAGE#'>Front Page</option>");
              //For now, it's either no page or Front Page
              /*
              for (let i = 0; i < data.length; i++) {
                let pageData = data[i];
                if (pageData.url !== 'btech-custom-settings') {
                  let option = $("<option value='" + pageData.url + "'>" + pageData.title + "</option>");
                  select.append(option);
                }
              }
              */
              if (pageName !== '') {
                select.val(pageName).prop('selected', true);
              }
              select.on('change', function () {
                feature.updateSetting('modules-page-header', $(this).val());
                $.put("/api/v1/courses/" + feature.courseId + "/pages/btech-custom-settings", {
                  wiki_page: {
                    title: 'btech-custom-settings',
                    body: feature.settingsEl.html(),
                    published: true
                  }
                }).done(function () {
                  location.reload(true);
                });
              });
            });
          }
        }
      },
    }
  }
})();