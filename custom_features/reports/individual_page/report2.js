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
    await $.get(SOURCE_URL + '/custom_features/reports/individual_page/template2.vue', null, function (html) {
      vueString = html.replace("<template>", "").replace("</template>", "");
    }, 'text');
    let canvasbody = $("#application");
    canvasbody.after('<div id="canvas-individual-report-2-vue"></div>');
    $("#canvas-individual-report-2-vue").append(vueString);
    let gen_report_button;
    let menu_bar;
    if (/^\/$/.test(window.location.pathname)) {
      gen_report_button = $('<a class="btn button-sidebar-wide" id="canvas-individual-report-2-vue-gen"></a>');
      let plannerHeader = $(".PlannerHeader");
      if (plannerHeader.length > 0) {
        menu_bar = plannerHeader;
      } else {
        menu_bar = $("#right-side div").last();
      }
    } else if (/^\/courses\/[0-9]+\/users\/[0-9]+$/.test(window.location.pathname)) {
      gen_report_button = $('<a style="cursor: pointer;" id="canvas-individual-report-2-vue-gen"></a>');
      menu_bar = $("#right-side div").first();
    } else {
      gen_report_button = $('<a class="btn button-sidebar-wide" id="canvas-individual-report-2-vue-gen"></a>');
      menu_bar = $("#right-side div").first();
    }
    gen_report_button.append('Student Report 2 (beta)');
    gen_report_button.appendTo(menu_bar);
    let modal = $('#canvas-individual-report-2-vue');
    modal.hide();

    APP = new Vue({
      el: '#canvas-individual-report-2-vue',
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
        let settings = await this.loadSettings(this.settings);
        this.settings = settings;
        this.loadingProgress += 10;

        //load data from bridgetools
        this.loadingMessage = "Loading User Data";
        //Pulled enrollment data out of loadUser func because it is ready to use for Grades between dates out of the box and doesn't need to wait on all of the other stuff loadUser does
        let enrollmentData = await bridgetools.req("https://reports.bridgetools.dev/api/students/canvas_enrollments/" + this.userId);
        this.enrollmentData = enrollmentData;

        try {
          let user = await this.loadUser(this.userId);
          this.user = user;
        } catch(err) {
          console.error(err);
          this.user = {};
        }
        this.loadingProgress += 10;
        this.loading = false;
      },
      data: function () {
        return {
          currentReportMeta: {
            title: 'Courses'
          },
          reportTypes: [
            { value: 'student-courses',     label: 'Courses',     component: 'student-courses-report',     title: 'Courses Report' },
            { value: 'student-grades',    label: 'Grades',    component: 'student-grades-report',    title: 'Grades Between Dates' },
          ],
          currentDegreeId: null,
          enrollmentData:  undefined,
          userId: null,
          user: {},
          canvasUser: {},
          bridgetoolsUser: {},
          tree: {
            other: {}
          },
          goal: undefined,
          colors: bridgetools.colors,
          settings: {
            anonymous: false,
            account: 0,
            reportType: 'student-courses',
            sort_dir: 1,
            filters: { year: '2025' }
          },
          terms: [],
          sections: [],
          loading: true,
          loadingMessage: "Loading Results...",
          loadingProgress: 0,
          accessDenied: false,
          settingGoal: false,
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
            major_code: '',
          }
        }
      },
      watch: {
        async currentDegreeId (newVal, oldVal) {
          const degrees = this.user?.degrees || [];
          if (!degrees.length) return;

          const deg = degrees.find((d, idx) =>
            newVal === (d._id || idx)
          );
          if (!deg) return;

          // Load new tree for the selected program
          const tree = await this.loadTree(deg.major_code, deg.academic_year);
          this.tree = tree;

          // If you eventually process user-course info based on tree:
          this.user = this.updateUserCourseInfo(this.user, tree);
        },

        // you can keep your existing watchers here (if any)
      },
      computed: {
        currentReportMeta() {
          const fallback = this.reportTypes[0];
          return this.reportTypes.find(r => r.value === (this.settings.reportType || 'instructor')) || fallback;
        },
        currentReportProps() {
          const base = {
            year: this.settings.filters.year,
            account: this.settings.account,
            instructorId: ENV.current_user_id
          };
          return base;
        },

        // NEW: derive currentDegree from user.degrees + currentDegreeId
        currentDegree() {
          const degrees = this.user?.degrees || [];
          if (!degrees.length) return {major_code: '', academic_year: 0}; // fallback if you still set it elsewhere

          const id = this.currentDegreeId;
          const match = degrees.find((deg, idx) =>
            id === (deg._id || idx)
          );
          return match || degrees[0];
        },
      },

      methods: {
        onReportChange() {
          this.saveSettings(this.settings);
        },

        async loadSettings(settings) {
          const fallback = JSON.parse(JSON.stringify(settings));
          let saved = {};
          try {
            const resp = await $.get(`/api/v1/users/self/custom_data/instructor?ns=edu.btech.canvas`);
            if (resp.data && resp.data.settings) saved = resp.data.settings;
          } catch (err) { /* keep defaults */ }

          const merged = JSON.parse(JSON.stringify(fallback));
          merged.account = saved.account ?? fallback.account;
          merged.reportType = saved.reportType ?? fallback.reportType;

          if (saved.filters) merged.filters = Object.assign({}, fallback.filters, saved.filters);
          else merged.filters = JSON.parse(JSON.stringify(fallback.filters));

          if (merged.anonymous === "true") merged.anonymous = true; else merged.anonymous = false;
          for (const key in merged.filters) {
            const val = merged.filters[key];
            if (val === "true") merged.filters[key] = true;
            else if (val === "false") merged.filters[key] = false;
          }
          merged.filters.section = 'All';
          return merged;
        },

        async saveSettings(settings) {
          await $.put(`/api/v1/users/self/custom_data/instructor?ns=edu.btech.canvas`, {
            data: { settings: settings }
          });
        },

        close() { $(this.$el).hide(); },

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

        async loadTree(majorCode, majorYear) {
          let url = "https://reports.bridgetools.dev/api/trees?dept_code=" + majorCode + "&year=" + majorYear;
          let data = await bridgetools.req(url);
          let tree = data[0] ?? {};
          if (tree?.courses === undefined) tree.courses = {};
          if (tree?.courses?.core === undefined) tree.courses.core = {};
          if (tree?.courses?.elective === undefined) tree.courses.elective = {};
          if (tree?.courses?.other === undefined) tree.courses.other = {};

          this.tree = tree;
          return tree;
        },

        async loadUser(userId) {
          let user = {};
          try {
            this.bridgetoolsUser = await bridgetools.req(
              `https://reports.bridgetools.dev/api2/students/${userId}?requester_id=${ENV.current_user_id}`
            );
            this.canvasUser = (await canvasGet(`/api/v1/users/${userId}`))?.[0];

          } catch (err) {
            console.error(err);
            return {};
          }
          // Be tolerant of missing degrees
          user.degrees = Array.isArray(this.bridgetoolsUser?.degrees) ? this.bridgetoolsUser.degrees : [];
          user.courses = Array.isArray(this.bridgetoolsUser?.courses) ? this.bridgetoolsUser.courses: [];
          user.canvas_id = this.canvasUser.id;
          user.name = this.canvasUser.name;
          user.academic_probation = this.bridgetoolsUser.academic_probation;
          user.last_update = this.bridgetoolsUser.last_update;
          user.last_login = this.bridgetoolsUser.last_login;
          user.avatar_url = this.canvasUser.avatar_url;
          user.sis_id = this.bridgetoolsUser.sis_id;
          user.hs_terms = this.bridgetoolsUser.hs_terms;
          user.transfer_courses = [];

          // Guard degree ops
          const date = new Date();
          let maxyear = date.getFullYear();
          if ((date.getMonth() + 1) <= 6) maxyear -= 1;

          user.degrees = (user.degrees || []).filter(d => Number(d?.academic_year) <= maxyear);

          user.degrees.sort((a, b) => {
            if (a.academic_year=== b.academic_year) {
              const ad = String(a.major_code || '').toLowerCase();
              const bd = String(b.major_code || '').toLowerCase();
              return ad > bd ? 1 : ad < bd ? -1 : 0;
            }
            return a.academic_year > b.academic_year ? -1 : 1;
          });

          this.currentDegreeId = user?.degrees?.[0]?._id ?? 0;


          let tree;
          if (this.currentDegreeId) {
            // FIX: depts -> degrees
            tree = await this.loadTree(user.degrees[0].major_code, user.degrees[0].academic_year);
          } else {
            tree = { hours: 0, name: "", courses: { core: {}, elective: {}, other: {} } };
          }

          user = this.updateUserCourseInfo(user, tree);
          return user;
        },


        async changeTree(user) {
          let tree = await this.loadTree(this.currentDegree.major_code, this.currentDegree.academic_year);
          user = this.updateUserCourseInfo(user, tree);
          this.user = user;
        },

        updateUserCourseInfo(user, tree) {
          // user = processUserData(user, tree); 
          return user;
        },

      }
    })
    gen_report_button.click(function () {
      let modal = $('#canvas-individual-report-2-vue');
      // APP.refreshHSEnrollmentTerms();
      $.post("https://tracking.bridgetools.dev/api/hit", {
        "tool": "reports-individual_page",
        "canvasId": ENV.current_user_id
      });
      modal.show();
    });
  }
  
  

  try {
    await $.put("https://reports.bridgetools.dev/gen_uuid?requester_id=" + ENV.current_user_id);
    //styling
    loadCSS("https://reports.bridgetools.dev/style/main.css");
    loadCSS("https://reports.bridgetools.dev/department_report/style/main.css");
    await $.getScript(SOURCE_URL + `/custom_features/reports/individual_page/components/studentCoursesReport2.js`);
    await $.getScript(SOURCE_URL + '/custom_features/reports/individual_page/components/gradesBetweenDates2.js');
    await $.getScript(SOURCE_URL + "/custom_features/reports/individual_page/components/courseRowInd2.js");
    await $.getScript(SOURCE_URL + "/custom_features/reports/individual_page/components/courseProgressBarInd2.js");
    await $.getScript(SOURCE_URL + "/custom_features/reports/individual_page/components/indHeaderCredits2.js");
    await $.getScript("https://d3js.org/d3.v6.min.js");
    /*
    //libraries
    await $.getScript("https://reports.bridgetools.dev/components/icons/people.js");
    await $.getScript("https://cdnjs.cloudflare.com/ajax/libs/print-js/1.5.0/print.js");
    //icons
    await $.getScript("https://reports.bridgetools.dev/components/icons/alert.js");
    await $.getScript("https://reports.bridgetools.dev/components/icons/distance-approved.js");
    //components
    await $.getScript("https://reports.bridgetools.dev/department_report/components/menuStatus.js");
    await $.getScript("https://reports.bridgetools.dev/department_report/components/menuInfo.js");
    await $.getScript("https://reports.bridgetools.dev/department_report/components/menuFilters.js");
    await $.getScript("https://reports.bridgetools.dev/department_report/components/menuSettings.js");
    await $.getScript(SOURCE_URL + "/custom_features/reports/individual_page/components/showStudentIndCredits.js");
    await $.getScript(SOURCE_URL + "/custom_features/reports/individual_page/components/showStudentHours.js");
    await $.getScript(SOURCE_URL + '/custom_features/reports/individual_page/showStudentGrades.js');
    */
    postLoad();
  } catch (err) {
    console.error(err);
  }
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