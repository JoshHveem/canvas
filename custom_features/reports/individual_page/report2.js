/*
  If someone cannot view this report, they needed to be added under the sub-account via:
  Settings->Admins->Add Account Admins
  They only need the View Enrollments level access to be able to see the report.
  Show which tab you're on
*/
(async function () {
  function emptyMajor() {
    return {
      major_code: '',
      academic_year__major: 0,
      campus_code: '',
      credits_earned: 0,
      average_score: 0,
      is_distance_approved: false,
      courses: {
        core: [],
        elective: [],
        other: []
      }
    };
  }

  //Confirm with Instructional Team before going live
  async function loadFirstAvailableScript(urls) {
    let lastError;

    for (const url of urls) {
      try {
        await $.getScript(url);
        return url;
      } catch (err) {
        lastError = err;
        console.warn("Failed to load script", url, err);
      }
    }

    throw lastError || new Error("Failed to load script from all sources");
  }

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
    gen_report_button.append('Student Report 2');
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

        this.loadingMessage = "Loading User Data";

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
            // { value: 'student-grades',    label: 'Grades',    component: 'student-grades-report',    title: 'Course Grades' },
            { value: 'hs-grades',    label: 'HS Grades',    component: 'show-student-grades',    title: 'HS Grades Between Dates' },
            { value: 'hs-grades-old',    label: 'HS Grades (Old)', component: 'show-student-grades',    title: 'HS Grades Between Dates (Old)' },
          ],
          selectedMajorIndex: 0,
          userId: null,
          user: {},
          canvasUser: {},
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

        currentMajor() {
          const majors = this.user?.majors || [];
          return majors[this.selectedMajorIndex] || emptyMajor();
        },
      },

      methods: {
        onMajorChange(event) {
          this.selectedMajorIndex = Number(event.target.value);
        },

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
          if (!this.reportTypes.some(report => report.value === merged.reportType)) {
            merged.reportType = fallback.reportType;
          }

          if (saved.filters) merged.filters = Object.assign({}, fallback.filters, saved.filters);
          else merged.filters = JSON.parse(JSON.stringify(fallback.filters));

          if (merged.anonymous === "true") merged.anonymous = true; else merged.anonymous = false;
          merged.anonymize = merged.anonymous;
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

        sumContractedHours(contractedHours) {
          return Object.values(contractedHours || {}).reduce((sum, value) => {
            return sum + (Number(value) || 0);
          }, 0);
        },

        async loadMajorCourses(major) {
          const majorCourses = await bridgetools.req3(
            'reports',
            {
              major_code: major.major_code,
              academic_year__major: major.academic_year__major
            },
            { dataset: 'major_courses' }
          );

          return {
            ...major,
            courses: {
              core: majorCourses.filter(course => course.major_requirement_type_code === 'C'),
              elective: majorCourses.filter(course => course.major_requirement_type_code === 'E'),
              other: majorCourses.filter(course => course.major_requirement_type_code !== 'C' && course.major_requirement_type_code !== 'E'),
            }
          };
        },

        async hydrateMajors(majors) {
          return Promise.all((majors || []).map(async major => {
            if (major.courses) return major;
            return this.loadMajorCourses(major);
          }));
        },

        sortMajors(majors) {
          return [...(majors || [])].sort((a, b) => {
            const aActive = a.is_active_degree ? 1 : 0;
            const bActive = b.is_active_degree ? 1 : 0;
            if (aActive !== bActive) return bActive - aActive;

            const ay = Number(a.academic_year__major);
            const by = Number(b.academic_year__major);
            if (ay !== by) return by - ay;

            const aperc = Number(a.perc_credits_earned);
            const bperc = Number(b.perc_credits_earned);
            if (aperc !== bperc) return bperc - aperc;

            const ad = String(a.major_code || '').toLowerCase();
            const bd = String(b.major_code || '').toLowerCase();
            return ad.localeCompare(bd);
          });
        },

        normalizeUserRecord({ canvasUser, studentHeader, studentRecord, courses, majors }) {
          const sortedMajors = this.sortMajors(majors);
          const defaultMajor = sortedMajors[0];

          const user = {
            majors: sortedMajors,
            courses: courses || [],
            canvas_id: canvasUser?.id,
            canvas_user_id: canvasUser?.id,
            name: canvasUser?.name,
            academic_probation: null,
            last_update: bridgetools.psqlTimestampToDate(studentHeader?.bridgetools_updated_at),
            last_login: bridgetools.psqlTimestampToDate(studentHeader?.last_login_at),
            avatar_url: studentHeader?.avatar_image_url || canvasUser?.avatar_url,
            sis_user_id: studentHeader?.sis_user_id,
            hs_terms: studentRecord?.hs_terms || [],
            contracted_hours: studentHeader?.contracted_hours || {},
            contracted_hours_total: this.sumContractedHours(studentHeader?.contracted_hours),
            transfer_courses: [],
            distance_approved: defaultMajor?.is_distance_approved ?? false,
          };

          const currentMajor = defaultMajor || sortedMajors[0];
          this.selectedMajorIndex = Math.max(0, sortedMajors.findIndex(major => major === currentMajor));

          return user;
        },

        async loadUser(userId) {
          try {
            const [
              studentRecord,
              studentHeader,
              studentCourses,
              studentMajors,
              canvasUser
            ] = await Promise.all([
              bridgetools.req(`https://reports.bridgetools.dev/api/v2/students/${userId}`),
              bridgetools.req3('reports', {canvas_user_id: userId}, {dataset: 'student_header'}),
              bridgetools.req3('reports', {canvas_user_id: userId}, {dataset: 'student_courses'}),
              bridgetools.req3('reports', {canvas_user_id: userId}, {dataset: 'student_majors'}),
              canvasGet(`/api/v1/users/${userId}`)
            ]);

            this.canvasUser = Array.isArray(canvasUser) ? canvasUser[0] : canvasUser;
            const hydratedMajors = await this.hydrateMajors(studentMajors);
            return this.normalizeUserRecord({
              canvasUser: this.canvasUser,
              studentHeader: studentHeader?.[0],
              studentRecord,
              courses: studentCourses,
              majors: hydratedMajors
            });
          } catch (err) {
            console.error(err);
            return {};
          }
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
    await $.getScript(SOURCE_URL + "/custom_features/reports/individual_page/gradesBetweenDates.js");
    await loadFirstAvailableScript([
      "https://d3js.org/d3.v6.min.js",
      "https://cdn.jsdelivr.net/npm/d3@6/dist/d3.min.js"
    ]);
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
