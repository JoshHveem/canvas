/*
  If someone cannot view this report, they needed to be added under the sub-account via:
  Settings->Admins->Add Account Admins
  They only need the View Enrollments level access to be able to see the report.
  Show which tab you're on
*/
(async function () {
  const REPORT_BASE_PATH = '/custom_features/reports/individual_page';
  const deepClone = value => JSON.parse(JSON.stringify(value));

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

  function normalizeLookupValue(value) {
    return String(value).trim().toLowerCase();
  }

  function normalizeTermTimestamp(value) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace('t', ' ')
      .replace('z', '')
      .split('.')[0];
  }

  function buildHsTermKey(term) {
    return [
      normalizeLookupValue(term.sis_user_id),
      normalizeLookupValue(term.course_code),
      normalizeLookupValue(term.campus_code),
      normalizeTermTimestamp(term.entry_at__original || term.entry_at),
    ].join('|');
  }

  function normalizeReportTypeKey(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-');
  }

  function getAutoOpenConfig() {
    const reportType = new URLSearchParams(window.location.search).get('open_btech_report');

    return {
      shouldOpen: reportType != null,
      reportType
    };
  }

  function resolveUrlReportType(reportTypes, rawReportType) {
    if (!rawReportType) return null;

    const normalizedTarget = normalizeReportTypeKey(rawReportType);
    const match = reportTypes.find(report => normalizeReportTypeKey(report.value) === normalizedTarget);
    return match ? match.value : null;
  }

  const hsGradeCourseCache = new Map();

  function parseBoolean(value) {
    return value === true || value === "true";
  }

  function getAssetUrl(path) {
    return window.btechAssetUrl ? window.btechAssetUrl(SOURCE_URL + path) : SOURCE_URL + path;
  }

  async function fetchAllCourseConnection(courseId, connectionField, args = {}, nodeSelection = '') {
    const pageSize = 50;
    let allNodes = [];
    let hasNext = true;
    let after = null;

    while (hasNext) {
      const argsStr = Object.entries({ ...args, first: pageSize, after })
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(", ");

      const query = `{
        course(id: "${courseId}") {
          ${connectionField}(${argsStr}) {
            ${nodeSelection}
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }`;

      const res = await $.post("/api/graphql", { query });
      const conn = res.data.course[connectionField];
      allNodes.push(...conn.nodes);
      hasNext = conn.pageInfo.hasNextPage;
      after = conn.pageInfo.endCursor;
    }

    return allNodes;
  }

  async function getAllAssignmentsByGroup(course) {
    const assignments = await fetchAllCourseConnection(
      course.id,
      "assignmentsConnection",
      {},
      `nodes { _id name published pointsPossible assignmentGroupId }`
    );

    return assignments.reduce((map, assignment) => {
      const groupId = assignment.assignmentGroupId || "__ungrouped";
      if (!map[groupId]) map[groupId] = [];
      map[groupId].push(assignment);
      return map;
    }, {});
  }

  async function getAllSubmissions(course, userId) {
    return fetchAllCourseConnection(
      course.id,
      "submissionsConnection",
      { studentIds: String(userId) },
      `nodes {
        id assignmentId submittedAt grade gradedAt score userId
        assignment { name published pointsPossible }
      }`
    );
  }

  async function getCourseGraphQLData(course, userId) {
    try {
      const groupQuery = `{
        course(id: "${course.id}") {
          assignmentGroupsConnection {
            nodes {
              _id name groupWeight state
            }
          }
        }
      }`;
      const [groupRes, assignmentsByGroup, submissions] = await Promise.all([
        $.post("/api/graphql", { query: groupQuery }),
        getAllAssignmentsByGroup(course),
        getAllSubmissions(course, userId)
      ]);
      const groups = groupRes.data.course.assignmentGroupsConnection.nodes
        .filter(group => group.state === "available");

      groups.forEach(group => {
        group.assignments = assignmentsByGroup[group._id] || [];
      });

      return {
        name: course.name,
        assignment_groups: groups,
        submissions
      };
    } catch (err) {
      console.error(err);
      return {
        name: course.name,
        assignment_groups: [],
        submissions: []
      };
    }
  }

  function buildHSCourseHours(course) {
    const hours = COURSE_HOURS?.[course.course_code]?.hours ?? 0;
    return {
      ...course,
      hours,
      credits: hours / 30
    };
  }

  async function loadHSGradeCoursesInternal(userId, onProgress = () => {}) {
    const studentId = String(userId);
    let enrollments = [];

    try {
      enrollments = await bridgetools.req3(
        'reports',
        { canvas_user_id: studentId, is_deleted: false},
        { dataset: 'canvas_enrollments' }
      );
      console.log(enrollments);
    } catch (err) {
      console.error("Failed fetching course enrollments via req3:", err);
      return [];
    }

    const courses = Array.from(
      enrollments
        .reduce((map, enrollment) => {
          const id = Number(enrollment.canvas_course_id);
          if (!id) return map;

          const key = String(id);
          if (!map.has(key)) {
            const course = {
              id,
              course_id: id,
              name: enrollment.course_name,
              course_code: enrollment.course_code,
              academic_year: enrollment.academic_year,
              section_name: enrollment.section_name,
            };
            map.set(key, buildHSCourseHours(course));
          }
          return map;
        }, new Map())
        .values()
    );

    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      onProgress({
        message: `Loading Assignment Data for Course ${course.id}`,
        progress: courses.length ? ((i / courses.length) * 100) : 100
      });
      course.additionalData = await getCourseGraphQLData(course, studentId);
      course.assignments = course.additionalData.submissions;
    }

    onProgress({ message: "Data loading complete.", progress: 100 });
    return courses;
  }

  window.loadIndividualReportHSGradeCourses = async function(userId, onProgress) {
    const key = String(userId);

    if (!hsGradeCourseCache.has(key)) {
      hsGradeCourseCache.set(key, loadHSGradeCoursesInternal(key, onProgress));
    }

    const courses = await hsGradeCourseCache.get(key);
    return deepClone(courses);
  };

  function emptyUser() {
    return {
      majors: [],
      courses: [],
      canvas_user_id: null,
      name: '',
      academic_probation: null,
      last_update: null,
      last_login: null,
      avatar_url: null,
      sis_user_id: null,
      hs_terms: [],
      contracted_hours: {},
      contracted_hours_total: 0,
      transfer_courses: [],
      distance_approved: false,
      career_goal__current: '',
      employment_skills_current: [],
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
    const cacheBust = Date.now();
    const templateUrl = getAssetUrl(`${REPORT_BASE_PATH}/template.vue`);
    await $.get(templateUrl + '?v=' + cacheBust, null, function (html) {
      vueString = html.replace("<template>", "").replace("</template>", "");
    }, 'text');
    let canvasbody = $("#application");
    canvasbody.after('<div id="canvas-individual-report-vue"><div id="canvas-individual-report-vue-app"></div></div>');
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
    const autoOpenConfig = getAutoOpenConfig();

    APP = new Vue({
      el: '#canvas-individual-report-vue-app',
      template: vueString,
      mounted: async function () {
        if (autoOpenConfig.shouldOpen) {
          modal.show();
        }

        this.setLoadingState("Starting report", 5);
        this.IS_TEACHER = IS_TEACHER;
        // if (!IS_TEACHER) this.menu = 'period';
        if (IS_TEACHER) { //also change this to ref the url and not whether or not is teacher
          let match = window.location.pathname.match(/(users|grades)\/([0-9]+)/);
          this.userId = match[2];
        } else {
          this.userId = ENV.current_user_id;
        }

        window.loadIndividualReportHSGradeCourses(this.userId).catch(err => {
          console.error("Failed preloading HS grade courses:", err);
        });

        this.setLoadingState("Loading saved settings", 15);
        let settings = await this.loadSettings(this.settings);
        const urlReportType = resolveUrlReportType(this.reportTypes, autoOpenConfig.reportType);
        if (urlReportType) settings.reportType = urlReportType;
        this.settings = settings;
        this.setLoadingState("Loading student profile and course records", 30);

        try {
          let user = await this.loadUser(this.userId);
          this.user = user;
        } catch(err) {
          console.error(err);
          this.user = emptyUser();
        }
        this.setLoadingState("Report ready", 100);
        this.loading = false;
      },
      data: function () {
        return {
          currentReportMeta: {
            title: 'Courses'
          },
          reportTypes: [
            { value: 'student-courses',     label: 'Courses',     component: 'student-courses-report',     title: 'Courses Report' },
            { value: 'employment-skills',  label: 'Employment Skills', component: 'employment-skills-report', title: 'Employment Skills Report' },
            { value: 'employment-skills-historic', label: 'Employment Skills (Historic)', component: 'employment-skills-historic-report', title: 'Employment Skills Historic Report' },
            // { value: 'student-grades',    label: 'Grades',    component: 'student-grades-report',    title: 'Course Grades' },
            { value: 'hs-grades',    label: 'HS Grades',    component: 'show-student-grades',    title: 'HS Grades Between Dates' },
            { value: 'hs-grades-old',    label: 'HS Grades (Old)', component: 'show-student-grades',    title: 'HS Grades Between Dates (Old)' },
          ],
          selectedMajorIndex: 0,
          userId: null,
          user: emptyUser(),
          canvasUser: null,
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
          return this.user.majors[this.selectedMajorIndex] || emptyMajor();
        },
      },

      methods: {
        setLoadingState(message, progress) {
          this.loadingMessage = message;
          this.loadingProgress = progress;
        },

        onMajorChange(event) {
          this.selectedMajorIndex = Number(event.target.value);
        },

        onReportChange() {
          this.saveSettings(this.settings);
        },

        async loadSettings(settings) {
          const fallback = deepClone(settings);
          let saved = {};
          try {
            const resp = await $.get(`/api/v1/users/self/custom_data/instructor?ns=edu.btech.canvas`);
            if (resp.data && resp.data.settings) saved = resp.data.settings;
          } catch (err) { /* keep defaults */ }

          const merged = {
            ...fallback,
            ...saved,
            filters: {
              ...fallback.filters,
              ...(saved.filters || {})
            }
          };

          if (!this.reportTypes.some(report => report.value === merged.reportType)) {
            merged.reportType = fallback.reportType;
          }

          merged.anonymous = parseBoolean(merged.anonymous);
          merged.anonymize = merged.anonymous;
          for (const key in merged.filters) {
            if (merged.filters[key] === "true" || merged.filters[key] === "false") {
              merged.filters[key] = parseBoolean(merged.filters[key]);
            }
          }
          merged.filters.section = 'All';
          return merged;
        },

        async saveSettings(settings) {
          await $.put(`/api/v1/users/self/custom_data/instructor?ns=edu.btech.canvas`, {
            data: { settings: settings }
          });
        },

        close() { $('#canvas-individual-report-vue').hide(); },

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
          if (!contractedHours) return 0;
          return Object.values(contractedHours).reduce((sum, value) => {
            return sum + Number(value);
          }, 0);
        },

        async hydrateMajor(major) {
          if (major.courses) return major;

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

        sortMajors(majors) {
          return [...majors].sort((a, b) => {
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

        calculateCreditsRequired(entryAt, exitAt, concurrentCount = 1, numWeeksHolidays = 0) {
          const start = new Date(entryAt);
          const end = new Date(exitAt);
          if (end <= start) return 0;

          const msInFiveWeeks = 60 * 60 * 24 * 7 * 5 * 1000;
          const msInWeek = 60 * 60 * 24 * 7 * 1000;
          const holidayWeeks = Math.max(Number(numWeeksHolidays) || 0, 0);
          const effectiveDurationMs = Math.max(end - start - (holidayWeeks * msInWeek), 0);
          let credits = Math.floor(Number(effectiveDurationMs / msInFiveWeeks) * 4) / 4;
          if (concurrentCount > 1) credits *= concurrentCount;
          return credits;
        },

        mergeHSTerms(baseTerms, overrideTerms) {
          const overridesByKey = new Map(
            overrideTerms.map(term => [buildHsTermKey(term), term])
          );

          return baseTerms.map(baseTerm => {
            const overrideTerm = overridesByKey.get(buildHsTermKey(baseTerm));
            const entryAt = overrideTerm?.entry_at__override || baseTerm.entry_at;
            const exitAt = overrideTerm?.exit_at__override || baseTerm.exit_at;
            const dateCalculatedCredits = this.calculateCreditsRequired(
              entryAt,
              exitAt,
              Number(baseTerm.concurrent_count) || 1,
              Number(baseTerm.num_weeks__holidays) || 0
            );
            const defaultCredits = Number(baseTerm.credits__default) || 0;
            const creditsRequired = overrideTerm?.credits_required__override != null
              ? Number(overrideTerm.credits_required__override)
              : Math.max(dateCalculatedCredits, defaultCredits);

            return {
              ...baseTerm,
              _id: buildHsTermKey(baseTerm),
              entry_at__original: baseTerm.entry_at,
              entry_at: entryAt,
              exit_at: exitAt,
              entry_date: entryAt,
              exit_date: exitAt,
              hours: creditsRequired * 30,
            };
          });
        },

        normalizeUserRecord({ canvasUser, studentHeader, hsTerms, courses, majors, employmentSkills }) {
          studentHeader = studentHeader || {};
          const sortedMajors = this.sortMajors(majors || []);
          const defaultMajor = sortedMajors[0] || emptyMajor();
          employmentSkills = employmentSkills || [];
          const user = {
            majors: sortedMajors,
            courses: courses || [],
            canvas_user_id: canvasUser.id,
            name: studentHeader.name || canvasUser.name || '',
            academic_probation: null,
            academic_standing_code: studentHeader.academic_standing_code || null,
            academic_standing_name: studentHeader.academic_standing_name || null,
            last_update: studentHeader.bridgetools_updated_at
              ? bridgetools.psqlTimestampToDate(studentHeader.bridgetools_updated_at)
              : null,
            last_login: studentHeader.last_login_at
              ? bridgetools.psqlTimestampToDate(studentHeader.last_login_at)
              : null,
            avatar_url: studentHeader.avatar_image_url || canvasUser.avatar_url,
            sis_user_id: studentHeader.sis_user_id || canvasUser.sis_user_id || null,
            hs_terms: hsTerms || [],
            contracted_hours: studentHeader.contracted_hours || {},
            contracted_hours_total: this.sumContractedHours(studentHeader.contracted_hours || {}),
            transfer_courses: [],
            distance_approved: Boolean(defaultMajor.is_distance_approved),
            career_goal__current: studentHeader.career_goal__current || '',
            employment_skills_current: employmentSkills,
          };

          this.selectedMajorIndex = 0;

          return user;
        },

        async loadUser(userId) {
          try {
            this.setLoadingState("Loading student profile and course records", 30);
            const [
              studentHeader,
              studentCourses,
              studentMajors,
              studentHSTerms,
              studentHSTermOverrides,
              canvasUser
            ] = await Promise.all([
              bridgetools.req3('reports', {canvas_user_id: userId}, {dataset: 'student_header'}),
              bridgetools.req3('reports', {canvas_user_id: userId}, {dataset: 'student_courses'}),
              bridgetools.req3('reports', {canvas_user_id: userId}, {dataset: 'student_majors'}),
              bridgetools.req3('reports', {canvas_user_id: userId}, {dataset: 'student_hs_terms'}),
              bridgetools.req3('reports', {canvas_user_id: userId}, {dataset: 'student_hs_terms__override'}),
              $.get(`/api/v1/users/${userId}`)
            ]);

            const primaryStudentHeader = studentHeader?.[0] || {};
            const sisUserId = primaryStudentHeader.sis_user_id || canvasUser.sis_user_id || null;
            let studentEmploymentSkills = [];

            if (sisUserId) {
              try {
                studentEmploymentSkills = await bridgetools.req3(
                  'reports',
                  { sis_user_id: sisUserId },
                  { dataset: 'student_employment_skills_current' }
                );
              } catch (err) {
                console.error("Failed loading employment skills for header:", err);
                studentEmploymentSkills = [];
              }
            }

            this.canvasUser = canvasUser;
            this.setLoadingState("Loading major requirements", 60);
            const majors = await Promise.all((studentMajors || []).map(major => this.hydrateMajor(major)));
            this.setLoadingState("Finalizing course summary", 85);
            return this.normalizeUserRecord({
              canvasUser,
              studentHeader: primaryStudentHeader,
              hsTerms: this.mergeHSTerms(studentHSTerms, studentHSTermOverrides),
              courses: studentCourses,
              majors,
              employmentSkills: Array.isArray(studentEmploymentSkills) ? studentEmploymentSkills : []
            });
          } catch (err) {
            console.error(err);
            return emptyUser();
          }
        },

      }
    })
    gen_report_button.click(function () {
      let modal = $('#canvas-individual-report-vue');
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
    [
      "https://reports.bridgetools.dev/style/main.css",
      "https://reports.bridgetools.dev/department_report/style/main.css"
    ].forEach(loadCSS);
    for (const scriptPath of [
      `${REPORT_BASE_PATH}/components/studentCoursesReport.js`,
      `${REPORT_BASE_PATH}/components/employmentSkillsReport.js`,
      `${REPORT_BASE_PATH}/components/employmentSkillsHistoricReport.js`,
      `${REPORT_BASE_PATH}/components/gradesBetweenDates.js`,
      `${REPORT_BASE_PATH}/components/courseRowInd.js`,
      `${REPORT_BASE_PATH}/components/courseProgressBarInd.js`,
      `${REPORT_BASE_PATH}/components/indHeaderCredits.js`,
      `${REPORT_BASE_PATH}/gradesBetweenDatesOld.js`
    ]) {
      await $.getScript(getAssetUrl(scriptPath));
    }
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
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl(SOURCE_URL + "/custom_features/reports/individual_page/components/showStudentIndCredits.js") : SOURCE_URL + "/custom_features/reports/individual_page/components/showStudentIndCredits.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl(SOURCE_URL + "/custom_features/reports/individual_page/components/showStudentHours.js") : SOURCE_URL + "/custom_features/reports/individual_page/components/showStudentHours.js");
    */
    postLoad();
  } catch (err) {
    console.error(err);
  }
  function loadCSS(url) {
    const style = document.createElement('link');
    const head = document.head || document.getElementsByTagName('head')[0];
    style.href = url;
    style.type = 'text/css';
    style.rel = "stylesheet";
    style.media = "screen,print";
    head.insertBefore(style, head.firstChild);
  }
})();
