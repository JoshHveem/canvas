/*
  If someone cannot view this report, they needed to be added under the sub-account via:
  Settings->Admins->Add Account Admins
  They only need the View Enrollments level access to be able to see the report.
  Show which tab you're on
*/
(async function () {
  //Confirm with Instructional Team before going live
  async function postLoad() {
    let vueString = '';
    //gen an initial uuid
    await $.get(SOURCE_URL + '/custom_features/reports/individual_page/template.vue', null, function (html) {
      vueString = html.replace("<template>", "").replace("</template>", "");
    }, 'text');
    let canvasbody = $("#application");
    canvasbody.after('<div id="canvas-individual-report-vue"></div>');
    $("#canvas-individual-report-vue").append(vueString);
    let gen_report_button;
    let menu_bar;
    if (/^\/$/.test(window.location.pathname)) {
      gen_report_button = $('<a class="btn button-sidebar-wide" id="canvas-individual-report-vue-gen"></a>');
      let plannerHeader = $(".PlannerHeader");
      if (plannerHeader.length > 0) {
        menu_bar = plannerHeader;
      } else {
        menu_bar = $("#right-side div").last();
      }
    } else if (/^\/courses\/[0-9]+\/users\/[0-9]+$/.test(window.location.pathname)) {
      gen_report_button = $('<a style="cursor: pointer;" id="canvas-individual-report-vue-gen"></a>');
      menu_bar = $("#right-side div").first();
    } else {
      gen_report_button = $('<a class="btn button-sidebar-wide" id="canvas-individual-report-vue-gen"></a>');
      menu_bar = $("#right-side div").first();
    }
    gen_report_button.append('Student Report');
    gen_report_button.appendTo(menu_bar);
    let modal = $('#canvas-individual-report-vue');
    modal.hide();

    APP = new Vue({
      el: '#canvas-individual-report-vue',
      mounted: async function () {
        this.loadingProgress = 0;
        this.IS_TEACHER = IS_TEACHER;
        // if (!IS_TEACHER) this.menu = 'period';
        if (IS_TEACHER) { //also change this to ref the url and not whether or not is teacher
          let match = window.location.pathname.match(/(users|grades)\/([0-9]+)/);
          this.userId = match[2];
        } else {
          this.userId = ENV.current_user_id;
        }

        this.loadingMessage = "Loading Settings";
        let settings = await this.loadSettings();
        this.settings = settings;
        this.loadingProgress += 10;

        //load data from bridgetools
        this.loadingMessage = "Loading User Data";
        //Pulled enrollment data out of loadUser func because it is ready to use for Grades between dates out of the box and doesn't need to wait on all of the other stuff loadUser does
        let enrollmentData = await bridgetoolsReq("https://reports.bridgetools.dev/api/students/canvas_enrollments/" + this.userId);
        this.enrollmentData = enrollmentData;

        try {
          let user = await this.loadUser(this.userId);
          console.log(user);
          this.user = user;
        } catch(err) {
          console.log(err);
          this.user = {};
        }
        this.loadingProgress += 10;
        this.loading = false;
        
      },

      data: function () {
        return {
          currentDegree: null,
          enrollmentData:  undefined,
          userId: null,
          user: {},
          tree: {
            other: {}
          },
          goal: undefined,
          colors: bridgetools.colors,
          settings: {},
          terms: [],
          sections: [],
          loading: true,
          loadingMessage: "Loading Results...",
          loadingProgress: 0,
          accessDenied: false,
          settingGoal: false,
          menu: 'report',
          IS_TEACHER: false,
          enrollment_tab: {
            managedStudent: {},
            task: 'enroll',
            schools: [
              'Sky View',
              'Cache High',
              'Bear River',
              'Box Elder',
              'Mountain Crest',
              'Green Canyon',
              'Logan High',
              'Ridgeline',
              'Fast Forward',
              'InTech'
            ],
            saveTerm: {},
            studentIdInput: '',
            studentsFound: [],
            studentsNotFound: [],
            dept: '',
          }
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
          let settings = await bridgetoolsReq("https://reports.bridgetools.dev/api/settings/" + ENV.current_user_id);
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
          }
          return settings;
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

        async loadTree(deptCode, deptYear) {
          let url = "https://reports.bridgetools.dev/api/trees?dept_code=" + deptCode + "&year=" + deptYear;
          let data = await bridgetoolsReq(url);
          let tree = data[0] ?? {};
          if (tree?.courses === undefined) tree.courses = {};
          if (tree?.courses?.core === undefined) tree.courses.core = {};
          if (tree?.courses?.elective === undefined) tree.courses.elective = {};
          if (tree?.courses?.other === undefined) tree.courses.other = {};

          this.tree = tree;
          return tree;
        },

        async loadUser(userId) {
          let tree;
          let user = {};
          try {
            let bridgetoolsUser = await bridgetools.req("https://reports.bridgetools.dev/api2/students/" + userId + "?requester_id=" + ENV.current_user_id);
            console.log(bridgetoolsUser);
            let canvasUser = (await canvasGet(`/api/v1/users/${userId}`))?.[0];
            console.log(canvasUser);
            user.degrees = bridgetoolsUser.degrees;
          } catch (err) {
            console.log(err);
            return {};
          }

          let date = new Date();
          let maxyear = date.getFullYear();
          let month = date.getMonth() + 1;
          if (month <= 6) maxyear -= 1;

          user.degrees = user.degrees.filter((degree) => degree.year <= maxyear);
          user.degrees.sort((a, b) => {
            if (a.year == b.year) {
              return (a.dept.toLowerCase() > b.dept.toLowerCase()) ? 1 : ((a.dept.toLowerCase() < b.dept.toLowerCase()) ? -1 : 0)
            }
            return (a.year > b.year) ? -1 : ((a.year < b.year) ? 1 : 0)
          });
          this.currentDegree = user?.degrees?.[0] ?? {dept: '', year: ''};
          if (user?.degrees?.[0]) {
            tree = await this.loadTree(user.degrees[0].dept, user.depts[0].year);
          } else {
            tree = {
              hours: 0,
              name: "",
              courses: {
                core: {},
                elective: {}
              }
            }
          }
          console.log(tree);

          user = this.updateUserCourseInfo(user, tree);
          return user;
        },

        async changeTree(user) {
          let tree = await this.loadTree(this.currentDegree.dept, this.currentDegree.year);
          user = this.updateUserCourseInfo(user, tree);
          this.user = user;
        },

        updateUserCourseInfo(user, tree) {
          user = bridgetools.processUserData(user, tree); 
          return user;
        },

      }
    })
    gen_report_button.click(function () {
      let modal = $('#canvas-individual-report-vue');
      APP.refreshHSEnrollmentTerms();
      $.post("https://tracking.bridgetools.dev/api/hit", {
        "tool": "reports-individual_page",
        "canvasId": ENV.current_user_id
      });
      modal.show();
    });
  }
  
  

  await $.put("https://reports.bridgetools.dev/gen_uuid?requester_id=" + ENV.current_user_id);
  //styling
  loadCSS("https://reports.bridgetools.dev/style/main.css");
  loadCSS("https://reports.bridgetools.dev/department_report/style/main.css");
  //libraries
  await $.getScript("https://reports.bridgetools.dev/components/icons/people.js");
  await $.getScript("https://d3js.org/d3.v6.min.js");
  await $.getScript("https://cdnjs.cloudflare.com/ajax/libs/print-js/1.5.0/print.js");
  //icons
  await $.getScript("https://reports.bridgetools.dev/components/icons/alert.js");
  await $.getScript("https://reports.bridgetools.dev/components/icons/distance-approved.js");
  //components
  await $.getScript("https://reports.bridgetools.dev/department_report/components/menuStatus.js");
  await $.getScript("https://reports.bridgetools.dev/department_report/components/menuInfo.js");
  await $.getScript("https://reports.bridgetools.dev/department_report/components/menuFilters.js");
  await $.getScript("https://reports.bridgetools.dev/department_report/components/menuSettings.js");
  await $.getScript(SOURCE_URL + "/custom_features/reports/individual_report/components/individual_report/courseRowInd.js");
  await $.getScript(SOURCE_URL + "/custom_features/reports/individual_report/components/individual_report/courseProgressBarInd.js");
  await $.getScript(SOURCE_URL + "/custom_features/reports/individual_report/components/individual_report/indHeaderCredits.js");
  await $.getScript(SOURCE_URL + "/custom_features/reports/individual_report/components/individual_report/showStudentIndCredits.js");
  await $.getScript(SOURCE_URL + "/custom_features/reports/individual_report/components/individual_report/showStudentHours.js");
  await $.getScript(SOURCE_URL + '/custom_features/reports/individual_page/showStudentGrades.js');
  await $.getScript("https://reports.bridgetools.dev/department_report/graphs.js");
  await $.getScript(SOURCE_URL + '/custom_features/reports/individual_page/gradesBetweenDates.js');
  postLoad();
  function loadCSS(url) {
    var style = document.createElement('link'),
      head = document.head || document.getElementsByTagName('head')[0];
    style.href = url;
    style.type = 'text/css';
    style.rel = "stylesheet";
    style.media = "screen,print";
    head.insertBefore(style, head.firstChild);
  }
})();