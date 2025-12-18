(async function () {
  class Column {
    constructor(
      name,
      description,
      width,
      average,
      sort_type,
      getContent = (student) => student.user_name ?? '',
      style_formula = null
    ) {
      this.name = name;
      this.description = description;
      this.width = width;
      this.average = average;
      this.sort_type = sort_type; // result of typeof, mostly string/number
      this.sort_state = 0; // 1 or -1 for asc/desc
      this.visible = true;
      this.getContent = getContent;
      this.style_formula = style_formula;
    }

    get_style(student) {
      if (this.style_formula != null) {
        return this.style_formula(student);
      }
      return {};
    }
  }

  // Create the button element
  function createButton() {
    const btn = $('<a class="Button" id="canvas-grades-report-vue-gen">Student Progress</a>');
    const circle = $('<span id="progress-report-alert-circle"></span>');

    circle.css({
      position: 'absolute',
      top: '-5px',
      right: '-0.75rem',
      color: 'white',
      backgroundColor: '#b20b0f',
      'font-size': '0.75rem',
      padding: '0 0.25rem',
      borderRadius: '50%',
    });
    circle.hide();

    const wrapper = $('<div style="position: relative; display: inline-block;"></div>');
    wrapper.append(btn);
    wrapper.append(circle);

    btn.click(function () {
      $('#canvas-grades-report-vue').show();
      $.post('https://tracking.bridgetools.dev/api/hit', {
        tool: 'reports-grades_page',
        canvasId: ENV.current_user_id,
      });
    });

    return wrapper;
  }

  function ensureButton(container) {
    if ($('#canvas-grades-report-vue-gen').length === 0) {
      container.append(createButton());
    }
  }

  async function postLoad() {
    let vueString = '';
    await $.get(
      SOURCE_URL + '/custom_features/reports/grades_page/template.vue',
      null,
      function (html) {
        vueString = html.replace('<template>', '').replace('</template>', '');
      },
      'text'
    );

    let canvasbody = $('#application');
    canvasbody.after('<div id="canvas-grades-report-vue"></div>');
    $('#canvas-grades-report-vue').append(vueString);
    $('#canvas-grades-report-vue').hide();

    let container = $('div#gradebook-actions');
    if (container.length === 0) container = $('#right-side');
    if (container.length === 0) {
      console.error('No suitable container found for the button.');
      return;
    }

    ensureButton(container);

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') ensureButton(container);
      }
    });

    observer.observe(container[0], {
      childList: true,
      subtree: false,
    });

    new Vue({
      el: '#canvas-grades-report-vue',
      created: function () {},
      mounted: async function () {
        this.loading = true;
        let courseId = ENV?.current_context?.id;
        let settings = await this.loadSettings(this.settings);
        this.settings = settings;

        if (courseId) {
          let enrollments = await this.loadEnrollments(courseId);
          this.enrollments.push(...enrollments);
        } else {
          let accountsData = await canvasGet('/api/v1/accounts');
          let accounts = [];

          // If college-level admin, pull subaccounts
          for (let a = 0; a < accountsData.length; a++) {
            let account = accountsData[a];
            if (account.id == 3) {
              accountsData = await canvasGet('/api/v1/accounts/3/sub_accounts');
              break;
            }
          }

          for (let a = 0; a < accountsData.length; a++) {
            let account = accountsData[a];
            if (account.parent_account_id == 3) {
              accounts.push({
                name: account.name,
                id: '' + account.id,
              });
            }
          }

          accounts.sort((a, b) => a.name.localeCompare(b.name));
          this.accounts.push(...accounts);

          await this.loadCourseEnrollments();
        }
      },

      data: function () {
        return {
          courseId: null,
          colors: bridgetools.colors,
          settings: {
            anonymous: false,
            progress_method: 'points_weighted',
            account: 0,
            filters: {
              section: 'All',
              hide_missing_end_date: true,
              hide_past_end_date: false,
            },
          },
          accounts: [
            {
              name: 'My Courses',
              id: '' + 0,
            },
          ],
          columns: [
            new Column(
              'User Name',
              "The student's name as it appears in Canvas.",
              'auto',
              false,
              'string',
              (student) => (this.settings.anonymous ? 'STUDENT ' + student.user_id : student.user_name ?? '')
            ),
            new Column(
              'Course Name',
              'The course in which the student is enrolled.',
              '10rem',
              false,
              'string',
              (student) => (this.settings.anonymous ? 'COURSE ' + student.course_id : student.course_name ?? '')
            ),
            new Column(
              'Section Name',
              'The section in which the student is enrolled in this course.',
              '10rem',
              false,
              'string',
              (student) => (this.settings.anonymous ? '' : student.section_name)
            ),
            new Column(
              'Score',
              "The student's grade based on assignments submitted to date.",
              '5rem',
              true,
              'number',
              (student) => (student.current_score ? student.current_score + '%' : 'n/a'),
              (student) => {
                if (!student.current_score)
                  return { 'background-color': this.colors.gray, color: this.colors.black };
                return {
                  'background-color': !student.current_score
                    ? this.colors.black
                    : student.current_score < 60
                      ? this.colors.red
                      : student.current_score < 80
                        ? this.colors.yellow
                        : this.colors.green,
                  color: this.colors.white,
                };
              }
            ),
            new Column(
              'Final Score',
              "The student's final grade. All unsubmitted assignments are graded as 0. This is their grade if they were to conclude the course right now.",
              '5.5rem',
              true,
              'number',
              (student) => (student.final_score ? student.final_score + '%' : 'n/a'),
              (student) => {
                if (!student.final_score)
                  return { 'background-color': this.colors.gray, color: this.colors.black };
                return {
                  'background-color':
                    student.final_score < 60 ? this.colors.red : student.final_score < 80 ? this.colors.yellow : this.colors.green,
                  color: this.colors.white,
                };
              }
            ),
            new Column(
              'End At',
              'The course end date.',
              '5rem',
              true,
              'number',
              (student) => (!student.end_at ? 'n/a' : this.dateToString(student.end_at)),
              (student) => {
                if (!student.end_at)
                  return { 'background-color': this.colors.gray, color: this.colors.black };
                return {
                  'background-color':
                    student.days_left < 0
                      ? this.colors.darkRed
                      : student.days_left < 3
                        ? this.colors.red
                        : student.days_left < 7
                          ? this.colors.yellow
                          : this.colors.green,
                  color: this.colors.white,
                };
              }
            ),
            new Column(
              'Ungraded',
              '',
              '4.5rem',
              true,
              'number',
              (student) => student.ungraded,
              (student) => ({
                'background-color':
                  student.ungraded > 1 ? this.colors.red : student.ungraded > 0 ? this.colors.yellow : this.colors.green,
                color: this.colors.white,
              })
            ),

            // Student activity: last submission (newest)
            new Column(
              'Last Sub',
              'Days since the student last submitted anything (lookback window).',
              '5rem',
              true,
              'number',
              (student) => {
                const lookback = student.lookback_days ?? 14;

                // No submissions at all (your rule)
                if ((student.progress ?? 0) <= 0) return 'n/a';

                // Have a submission within lookback
                if (student.last_submitted_at) {
                  let days = this.calcDaysBetweenDates(new Date(student.last_submitted_at), new Date());
                  if (days < 0) days = 0;
                  return `${days} Days`;
                }

                // Has submissions, but none within lookback window
                return `>${lookback} Days`;
              },
              (student) => {
                const lookback = student.lookback_days ?? 14;

                if ((student.progress ?? 0) <= 0) {
                  return { 'background-color': this.colors.gray, color: this.colors.black };
                }

                if (!student.last_submitted_at) {
                  return { 'background-color': this.colors.red, color: this.colors.white };
                }

                let days = this.calcDaysBetweenDates(new Date(student.last_submitted_at), new Date());
                if (days < 0) days = 0;

                return {
                  'background-color': days > 3 ? this.colors.red : days > 1 ? this.colors.yellow : this.colors.green,
                  color: this.colors.white,
                };
              }
            ),

            // Grading promptness: oldest ungraded
            new Column(
              'Oldest Ungraded',
              'Age of the oldest ungraded submission (grading backlog).',
              '7rem',
              true,
              'number',
              (student) => {
                if (!student.ungraded || student.ungraded <= 0 || !student.oldest_ungraded_at) return '0 Days';
                let days = this.calcDaysBetweenDates(new Date(student.oldest_ungraded_at), new Date());
                if (days < 0) days = 0;
                return `${days} Days`;
              },
              (student) => {
                if (!student.ungraded || student.ungraded <= 0 || !student.oldest_ungraded_at) {
                  return { 'background-color': this.colors.green, color: this.colors.white };
                }
                let days = this.calcDaysBetweenDates(new Date(student.oldest_ungraded_at), new Date());
                if (days < 0) days = 0;

                return {
                  'background-color': days > 3 ? this.colors.red : days > 1 ? this.colors.yellow : this.colors.green,
                  color: this.colors.white,
                };
              }
            ),

            // Progress ends up with its own special callout because it does the bar graph thing
            new Column(
              'Progress',
              'This is an estimate of the student\'s progress baed on the cirterion selected above.',
              '10rem',
              true,
              'number'
            ),
          ],
          enrollments: [],
          loading: false,
          menu: '',
          section_names: ['All'],
          section_filter: 'All',
          end_date_filter: true,
          hide_missing_end_date: true,
          hide_past_end_date: false,
        };
      },

      computed: {
        visibleColumns: function () {
          return this.columns.filter(function (c) {
            return c.visible;
          });
        },
        visibleRows: function () {
          return this.enrollments.filter((student) => {
            if (this.settings?.filters?.hide_missing_end_date && student.end_at == null) return false;
            if (this.settings?.filters?.hide_past_end_date && student.end_at != null && student.end_at < new Date())
              return false;
            if (this.settings?.filters?.section != 'All' && student.section_name != this.settings?.filters?.section)
              return false;
            return true;
          });
        },
      },

      methods: {
        calcProgress(student) {
          if (this.settings?.progress_method == 'points_weighted') return student.progress;
          if (this.settigns?.progress_method == 'points_raw') return student.final_score;
          return student.progress;
        },

        async loadSettings(settings) {
          const fallback = JSON.parse(JSON.stringify(settings));
          let saved = {};
          try {
            const resp = await $.get(`/api/v1/users/self/custom_data/progress?ns=edu.btech.canvas`);
            if (resp.data && resp.data.settings) saved = resp.data.settings;
            else console.warn('No saved settings found; using defaults.');
          } catch (err) {
            console.warn('Failed to load saved settings; using defaults.', err);
          }

          const merged = JSON.parse(JSON.stringify(fallback));
          merged.progress_method = saved.progress_method || fallback.progress_method;
          merged.account = saved.account ?? fallback.account;

          if (saved.filters) merged.filters = Object.assign({}, fallback.filters, saved.filters);
          else merged.filters = JSON.parse(JSON.stringify(fallback.filters));

          merged.anonymous = merged.anonymous === 'true';

          for (const key in merged.filters) {
            const val = merged.filters[key];
            if (val === 'true') merged.filters[key] = true;
            else if (val === 'false') merged.filters[key] = false;
          }

          merged.filters.section = 'All';
          return merged;
        },

        async saveSettings(settings) {
          await $.put(`/api/v1/users/self/custom_data/progress?ns=edu.btech.canvas`, {
            data: { settings: settings },
          });
        },

        getColumnsWidthsString() {
          let str = '';
          for (let c in this.columns) {
            let col = this.columns[c];
            str += col.width + ' ';
          }
          return str;
        },

        dateToString(date) {
          date = new Date(Date.parse(date));
          return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
        },

        // Returns { [userId]: submissionNode } for newest submission since submittedSince
        async graphqlRecentSubmissionsPeriod(
          courseId,
          { lookbackDays = 14, pageSize = 100, maxPages = 5 } = {}
        ) {
          const submittedSince = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

          let after = null;
          const newestByUserId = {};

          for (let page = 0; page < maxPages; page++) {
            const afterPart = after ? `, after: "${after}"` : '';

            const queryString = `{
              course(id: "${courseId}") {
                submissionsConnection(
                  first: ${pageSize}
                  ${afterPart}
                  filter: { submittedSince: "${submittedSince}" }
                ) {
                  nodes {
                    submittedAt
                    user { _id }
                  }
                  pageInfo { endCursor hasNextPage }
                }
              }
            }`;

            const res = await $.post('/api/graphql', { query: queryString });
            const conn = res?.data?.course?.submissionsConnection;
            if (!conn) break;

            for (const sub of conn.nodes || []) {
              const userId = sub?.user?._id;
              const submittedAt = sub?.submittedAt;
              if (!userId || !submittedAt) continue;

              const prev = newestByUserId[userId];
              if (!prev || new Date(submittedAt) > new Date(prev.submittedAt)) {
                newestByUserId[userId] = sub;
              }
            }

            if (!conn.pageInfo?.hasNextPage) break;
            after = conn.pageInfo.endCursor;
          }

          return newestByUserId;
        },

        // Ungraded backlog submissions (not paginated)
        async graphqlUngradedSubmissions(courseId) {
          let queryString = `{
            course(id: "${courseId}"){
              courseCode
              name
              submissionsConnection(filter: {states: [submitted, ungraded, pending_review]}) {
                nodes {
                  enrollmentsConnection { nodes { _id } }
                  submittedAt
                }
              }
              _id
            }
          }`;
          let res = await $.post('/api/graphql', { query: queryString });
          return res.data.course;
        },

        async graphqlEnrollments(courseId) {
          let queryString = `{
            course(id: "${courseId}"){
              enrollmentsConnection(filter: {states: active, types: StudentEnrollment}, first: 100) {
                nodes {
                  _id
                  createdAt
                  startAt
                  endAt
                  grades { currentScore finalScore }
                  user { name _id }
                  section { name }
                }
              }
              courseCode
              name
              _id
            }
          }`;
          let res = await $.post('/api/graphql', { query: queryString });
          return res.data.course;
        },

        calcDaysBetweenDates(date1, date2 = new Date()) {
          let diffTime = date2 - date1;
          let diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          return diffDays;
        },

        async loadEnrollments(courseId) {
          let enrollments = [];
          const lookbackDays = 14;

          let courseData = await this.graphqlEnrollments(courseId);
          let ungradedSubmissionsData = await this.graphqlUngradedSubmissions(courseId);

          // newest submission per user within lookback
          let recentSubmissionsByUser = await this.graphqlRecentSubmissionsPeriod(courseId, { lookbackDays });

          let enrollmentsData = courseData.enrollmentsConnection.nodes;
          let ungradedSubmissions = ungradedSubmissionsData.submissionsConnection.nodes;

          for (let e = 0; e < enrollmentsData.length; e++) {
            let enrollmentData = enrollmentsData[e];

            let endAt = enrollmentData.endAt ? Date.parse(enrollmentData.endAt) : null;
            let startAt = enrollmentData.startAt ?? enrollmentData.createdAt;
            startAt = startAt ? Date.parse(startAt) : null;

            let daysLeft = this.calcDaysBetweenDates(new Date(), endAt);
            let daysInCourse = this.calcDaysBetweenDates(startAt);

            if (!this.section_names.includes(enrollmentData.section.name)) {
              this.section_names.push(enrollmentData.section.name);
            }

            const userId = enrollmentData.user._id;

            const newestSub = recentSubmissionsByUser?.[userId] || null;
            const newestSubmittedAt = newestSub?.submittedAt ? Date.parse(newestSub.submittedAt) : null;

            let enrollment = {
              course_name: courseData.name,
              course_id: courseData._id,
              course_code: courseData.courseCode,
              enrollment_id: enrollmentData._id,
              created_at: startAt,
              end_at: endAt,
              current_score: enrollmentData.grades.currentScore,
              final_score: enrollmentData.grades.finalScore,
              progress: 0,
              section_name: enrollmentData.section.name,
              days_in_course: daysInCourse,
              days_left: daysLeft,
              user_name: enrollmentData.user.name,
              user_id: userId,

              lookback_days: lookbackDays,

              // student activity
              last_submitted_at: newestSubmittedAt, // ms or null

              // grading backlog
              ungraded: 0,
              oldest_ungraded_at: null, // ms or null
            };

            enrollment = this.processEnrollment(enrollment);
            enrollments.push(enrollment);
          }

          // compute ungraded count + oldest ungraded timestamp
          for (let s = 0; s < ungradedSubmissions.length; s++) {
            const submissionData = ungradedSubmissions[s];
            const enrollmentId = submissionData.enrollmentsConnection?.nodes?.[0]?._id;
            const submittedAt = submissionData.submittedAt ? Date.parse(submissionData.submittedAt) : null;
            if (!enrollmentId || !submittedAt) continue;

            for (let e = 0; e < enrollments.length; e++) {
              if (enrollments[e].enrollment_id == enrollmentId) {
                enrollments[e].ungraded += 1;

                if (!enrollments[e].oldest_ungraded_at || submittedAt < enrollments[e].oldest_ungraded_at) {
                  enrollments[e].oldest_ungraded_at = submittedAt;
                }
                break;
              }
            }
          }

          return enrollments;
        },

        processEnrollment(enrollment) {
          if (enrollment.current_score > 0) {
            enrollment.progress = Math.round((enrollment.final_score / enrollment.current_score) * 100);
          }
          let now = Date.now();
          let diffTime = now - enrollment.created_at;
          if (diffTime > 0) {
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            enrollment.days_in_course = diffDays;
          }
          return enrollment;
        },

        async loadCourseEnrollments() {
          this.loading = true;
          let now = new Date();
          let loadingAccount = this.settings.account;
          let courses = [];
          this.enrollments = [];
          let flaggedEnrollments = 0;

          if (this.settings.account == 0) {
            courses = await canvasGet(
              '/api/v1/courses?enrollment_type=teacher&enrollment_state=active&state[]=available&include[]=term'
            );
          } else {
            courses = await canvasGet(`/api/v1/accounts/${this.settings.account}/courses?state[]=available&include[]=term`);
          }

          for (let c in courses) {
            let course = courses[c];
            if (course.term.end_at) {
              let termEndAt = Date.parse(course.term.end_at);
              if (termEndAt < now) continue;
            }

            let enrollments = await this.loadEnrollments(course.id);

            for (let e = 0; e < enrollments.length; e++) {
              let enrollment = enrollments[e];
              if (enrollment.days_left < 3 && enrollment.end_at >= now) {
                flaggedEnrollments += 1;
                $('#progress-report-alert-circle').show();
                $('#progress-report-alert-circle').html(flaggedEnrollments);
              }
            }

            if (loadingAccount == this.settings.account) {
              this.enrollments.push(...enrollments);
            } else {
              return;
            }
          }
          this.loading = false;
        },

        sortColumn(header) {
          let name;
          if (header === 'Progress Estimate') name = this.columnNameToCode(this.progress_method);
          else name = this.columnNameToCode(header);

          let sortState = 1;
          let sortType = '';

          for (let c = 0; c < this.columns.length; c++) {
            if (this.columns[c].name !== header) {
              this.columns[c].sort_state = 0;
            } else {
              if (this.columns[c].sort_state !== 1) this.columns[c].sort_state = 1;
              else this.columns[c].sort_state = -1;
              sortState = this.columns[c].sort_state;
              sortType = this.columns[c].sort_type;
            }
          }

          this.enrollments.sort(function (a, b) {
            let aVal = a[name] ?? -1;
            let bVal = b[name] ?? -1;

            if (typeof aVal === 'string') aVal = aVal.toUpperCase();
            if (typeof bVal === 'string') bVal = bVal.toUpperCase();

            if (typeof aVal !== typeof bVal) {
              if (typeof aVal !== sortType) return -1 * sortState;
              if (typeof bVal !== sortType) return 1 * sortState;
            }

            let comp = 0;
            if (aVal > bVal) comp = 1;
            else if (aVal < bVal) comp = -1;
            comp *= sortState;
            return comp;
          });
        },

        columnNameToCode(name) {
          return name.toLowerCase().replace(/ /g, '_');
        },

        close() {
          $(this.$el).hide();
        },
      },
    });
  }

  function loadCSS(url) {
    var style = document.createElement('link'),
      head = document.head || document.getElementsByTagName('head')[0];
    style.href = url;
    style.type = 'text/css';
    style.rel = 'stylesheet';
    style.media = 'screen,print';
    head.insertBefore(style, head.firstChild);
  }

  async function _init() {
    loadCSS('https://reports.bridgetools.dev/department_report/style/main.css');
    loadCSS('https://reports.bridgetools.dev/style/main.css');
    await $.getScript('https://bridgetools.dev/canvas/external-libraries/vue.2.6.12.js');
    await $.getScript('https://reports.bridgetools.dev/department_report/components/courseProgressBarInd.js');
    postLoad();
  }

  _init();
})();
