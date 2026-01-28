/*
*/
(async function () {
  function loadCSS(url) {
    var style = document.createElement('link'),
      head = document.head || document.getElementsByTagName('head')[0];
    style.href = url;
    style.type = 'text/css';
    style.rel = "stylesheet";
    style.media = "screen,print";
    head.insertBefore(style, head.firstChild);
  }
  await $.put("https://reports.bridgetools.dev/gen_uuid?requester_id=" + ENV.current_user_id);
  loadCSS("https://reports.bridgetools.dev/style/main.css");
  let vueString = `
    <div
      v-if="user?.sap"
      style="
        display: grid;
        justify-items: center;
        align-items: center;
        grid-template-columns: 9rem 9rem 9rem auto 10rem;
        padding: .25rem;
      "
    >
      <div
        v-if="lastSAPPeriod.sap"
        style="
          cursor: help;
          display: inline-grid;
          justify-items: center;
          align-items: center;
          grid-template-rows: 1 1;
          row-gap: 0.5rem;
        "
        class="survey-icon-pair"
        :title="'This is your most recent official SAP. An SAP at or below 100% is preferred. Anything above 150% needs immediate attention. Multiple warnings may result in suspension from the program.'"
      >
        <div 
          style="text-align: center; font-size: 1.5rem; border-radius: 2rem; padding: .25rem; color: white;"
          :style="{'background-color': lastSAPPeriod.sap >= 150 ? colors.red : lastSAPPeriod.sap > 100 ? colors.yellow : colors.green}"
        >{{lastSAPPeriod.sap}}%</div>
        <span 
          style="text-align: center; max-width: 8rem;"
        >{{MONTH_NAMES_SHORT[lastSAPPeriod.month]}} SAP (Official)</span>
      </div>

      <div
        style="
        cursor: help;
        display: inline-grid;
        justify-items: center;
        align-items: center;
        grid-template-rows: 1 1;
        row-gap: 0.5rem;
        "
        class="survey-icon-pair"
        
        :title="'This number is a combination of your current SAP and any unrecorded Canvas progress. Keep in mind, progress is only updated for your official SAP at 25% increments, so if you are 20% through a course, that progress is rounded down to 0 for your official SAP. Talk with your instructor for more information.'"
      >
        <div 
          style="text-align: center; font-size: 1.5rem; border-radius: 2rem; padding: .25rem; color: white;"
          :style="{'background-color': colors.red}"
          :style="{'background-color': user.sap >= 150 ? colors.red : user.sap > 100 ? colors.yellow : colors.green}"
        >{{user.sap}}%</div>
        <span 
          style="text-align: center; max-width: 8rem;"
        >Current SAP (Estimate)</span>
      </div>

      <div
        style="
        cursor: help;
        display: inline-grid;
        justify-items: center;
        align-items: center;
        grid-template-rows: 1 1;
        row-gap: 0.5rem;
        "
        class="survey-icon-pair"
        
        title="Current day submissions won't reflect in this number."
      >
        <div 
          style="
            min-width: 2rem;
            text-align: center;
            font-size: 1.5rem;
            border-radius: 2rem;
            padding: .25rem;
            color: white;
          "
          :style="{'background-color': user.days_since_last_submission >= 10 ? colors.red : user.days_since_last_submission >= 7 ? colors.yellow : colors.green}"
        >{{user.days_since_last_submission}}</div>
        <span 
          style="text-align: center; max-width: 8rem;"
        >Days Since Last Submission</span>
      </div>

      <span
        style="
          justify-self: end; 
          align-self: start;
          cursor: help;
          text-align: center;
          font-size: 1rem;
          border-radius: 2rem;
          padding: .25rem;
          color: white;
          background-color: black;
        "
        title="SAP is equal to the number of enrolled hours divided by the number of course hours completed. An SAP of 100% or below is preferred. 150% or above will result in a warning."
      >SAP?</span>

      <a 
        style="justify-self: end; align-self: start;"
        class="btn button-sidebar-wide"
        @click="
          let modal = $('#canvas-individual-report-vue');
          $.post('https://tracking.bridgetools.dev/api/hit', {
            'tool': 'reports-individual_page',
            'canvasId': ENV.current_user_id
          });
          modal.show();
        "
      >Progress Report</a>

    </div>
  `;
  //gen an initial uuid
  let canvasbody = $("#dashboard_header_container");
  canvasbody.after('<div id="canvas-banner-report-vue"></div>');
  $("#canvas-banner-report-vue").append(vueString);

  new Vue({
    el: '#canvas-banner-report-vue',
    mounted: async function () {
      try {
        let user = await this.loadUser(this.userId);
        this.user = user;
      } catch(err) {
        console.error("FAILED TO LOAD USER");
      }
      let today = new Date();
      let year = today.getFullYear();
      let month = today.getMonth();
      month -= 1;
      if (month < 0) {
        month += 12;
        year -= 1;
      }
      this.lastSAPPeriod = {
        sap: Math.round(this?.user?.sap_history?.[year]?.[month]),
        year: year,
        month: month
      }

    },

    data: function () {
      return {
        currentDepartment: null,
        lastSAPPeriod: {},
        userId: ENV.current_user_id,
        user: {
        },
        tree: {
          other: {}
        },
        colors: bridgetools.colors,
      }
    },

    computed: {
      visibleColumns: function () {
        return this.columns.filter(function (c) {
          return c.visible;
        })
      }
    },

    methods: {
      close() {
        let modal = $('#canvas-individual-report-vue');
        modal.hide();
      },
      async loadSettings() {
        let app = this;
        let settings = await app.bridgetoolsReq("https://reports.bridgetools.dev/api/settings/" + ENV.current_user_id);
        if (settings.individualReport == undefined) {
          settings.individualReport = {
          }
        }
        if (settings.individualReport.attendanceCutoffs == undefined) {
          settings.individualReport.attendanceCutoffs = {
            good: 90,
            checkIn: 80,
            critical: 0,
            show: false
          }
          //app.saveSettings("individualReport");
        }
        return settings;
      },

      async refreshHSEnrollmentTerms() {
        let app = this;
        let terms;
        await $.get("https://canvas.bridgetools.dev/api/enroll_hs/" + app.userId, function (data) {
          terms = data;
        });
        app.terms = terms
      },

      async getHSEnrollment() {

      },

      formatDate(date) {
        date = new Date(date);
        date.setDate(date.getDate() + 1);
        let month = '' + (date.getMonth() + 1);
        if (month.length === 1) month = '0' + month;

        let day = '' + date.getDate();
        if (day.length === 1) day = '0' + day;

        let formattedDate = month + "/" + day + "/" + date.getFullYear();
        return formattedDate;
      },
      async deleteHSEnrollmentTerm(term) {
        let app = this;
        await $.delete('https://canvas.bridgetools.dev/api/enroll_hs/' + term._id, {});
        for (let i = 0; i < app.terms.length; i++) {
          if (app.terms[i]._id === term._id) {
            app.terms.splice(i, 1);
            return;
          }
        }
      },

      async enrollHS() {
        let app = this;
        await $.post('https://canvas.bridgetools.dev/api/enroll_hs', {
          'students': JSON.stringify([app.userId]),
          'term_data': JSON.stringify({
            hours: app.enrollment_tab.saveTerm.hours,
            type: app.enrollment_tab.saveTerm.type,
            startDate: app.enrollment_tab.saveTerm.startDate,
            endDate: app.enrollment_tab.saveTerm.endDate,
            school: app.enrollment_tab.saveTerm.school
          }),
        }, function (data) {
          app.refreshHSEnrollmentTerms();
        })
      },

      async bridgetoolsReq(url) {
        let reqUrl = "/api/v1/users/" + ENV.current_user_id + "/custom_data/btech-reports?ns=dev.bridgetools.reports";
        let authCode = '';
        await $.get(reqUrl, data => {
          authCode = data.data.auth_code;
        });
        //figure out if any params exist then add autho code depending on set up.
        if (!url.includes("?")) url += "?auth_code=" + authCode + "&requester_id=" + ENV.current_user_id;
        else url += "&auth_code=" + authCode + "&requester_id=" + ENV.current_user_id;
        let output;
        await $.get(url, function (data) {
          output = data;
        });
        return output;
      },

      async loadTree(deptCode, deptYear) {
        let app = this;
        let url = "https://reports.bridgetools.dev/api/trees?dept_code=" + deptCode + "&year=" + deptYear;
        let data = await app.bridgetoolsReq(url);
        let tree = data[0];
        if (tree?.courses?.core === undefined) tree.courses.core = {};
        if (tree?.courses?.elective === undefined) tree.courses.elective = {};
        if (tree?.courses?.other === undefined) tree.courses.other = {};

        this.tree = tree;
        return tree;
      },

      async loadUser(userId) {
        let app = this;
        let user, tree;
        let reqUrl = "/api/v1/users/" + ENV.current_user_id + "/custom_data/btech-reports?ns=dev.bridgetools.reports";
        let authCode = '';
        await $.get(reqUrl, data => {
          authCode = data.data.auth_code;
        });
        await $.get("https://reports.bridgetools.dev/api/students/" + userId + "?requester_id=" + ENV.current_user_id + "&auth_code=" + authCode, function (data) {
          user = data;
        });
        if (user !== "") {
          user.depts.sort((a, b) => {
            if (a.year == b.year) {
              return (a.dept.toLowerCase() > b.dept.toLowerCase()) ? 1 : ((a.dept.toLowerCase() < b.dept.toLowerCase()) ? -1 : 0)
            }
            return (a.year > b.year) ? -1 : ((a.year < b.year) ? 1 : 0)
          })
          app.currentDepartment = user.depts[0];
          tree = await app.loadTree(user.depts[0].dept, user.depts[0].year);
        }

        user = app.updateUserCourseInfo(user, tree);
        return user;
      },

      async changeTree(user) {
        let app = this;
        let tree = await app.loadTree(app.currentDepartment.dept, app.currentDepartment.year);
        user = app.updateUserCourseInfo(user, tree);
        app.user = user;
      },

      updateUserCourseInfo(user, tree) {
        user = bridgetools.processUserData(user, tree); 
        return user;
      },

    }
  })
})();