(async function () {
  class Column {
    constructor(name, description, width, average, sort_type, getContent = (student) => student.user_name ?? '', style_formula= null) {
      this.name = name;
      this.description = description;
      this.width = width;
      this.average = average;
      this.sort_type = sort_type; //needs to be a result of typeof, probably mostly going to be string or number
      this.sort_state = 0; //becomes 1 or -1 depending on asc or desc
      this.visible = true;
      this.getContent = getContent
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
    // Create the <a> button
    const btn = $('<a class="Button" id="canvas-grades-report-vue-gen">Progress Report</a>');

    // Create the red notification circle (hidden by default)
    const circle = $('<span id="progress-report-alert-circle"></span>');

    // Style the circle: tiny red dot, absolute position
    circle.css({
      position: 'absolute',
      top: '-5px',
      right: '-0.75rem',
      color: 'white',
      backgroundColor: '#b20b0f',
      'font-size': '0.75rem',
      'padding': '0 0.25rem',
      borderRadius: '50%'
    });
    circle.hide();

    // Wrap the button in a relatively positioned container so the circle can be positioned correctly
    const wrapper = $('<div style="position: relative; display: inline-block;"></div>');

    wrapper.append(btn);
    wrapper.append(circle);

    // Add the click handler
    btn.click(function () {
      $("#canvas-grades-report-vue").show();
      $.post("https://tracking.bridgetools.dev/api/hit", {
        "tool": "reports-grades_page",
        "canvasId": ENV.current_user_id
      });
    });

    // Return the wrapper (button + circle)
    return wrapper;
  }

  // Function to ensure button is present
  function ensureButton(container) {
    if ($('#canvas-grades-report-vue-gen').length === 0) {
      container.append(createButton());
    }
  }


  async function postLoad() {
    let vueString = '';
    await $.get(SOURCE_URL + '/custom_features/reports/grades_page/template.vue', null, function (html) {
      vueString = html.replace("<template>", "").replace("</template>", "");
    }, 'text');

    // Add modal container and Vue content
    let canvasbody = $("#application");
    canvasbody.after('<div id="canvas-grades-report-vue"></div>');
    $("#canvas-grades-report-vue").append(vueString);
    $("#canvas-grades-report-vue").hide();

    // Determine where to inject the button
    let container = $('div#gradebook-actions');
    if (container.length === 0) {
      container = $('#right-side');
    }
    if (container.length === 0) {
      console.error("No suitable container found for the button.");
      return;
    }
    // Initial insert
    ensureButton(container);

    // Set up MutationObserver
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          ensureButton(container);
        }
      }
    });

    observer.observe(container[0], {
      childList: true,
      subtree: false
    });


    new Vue({
      el: '#canvas-grades-report-vue',
      created: function() {
      },
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
          // check to see if we're dealing with a college level admin. If so, pull all sub_accounts they have access to.
          for (let a = 0; a < accountsData.length; a++) {
              let account = accountsData[a];
              if (account.id == 3) {
                  accountsData = await canvasGet('/api/v1/accounts/3/sub_accounts');
                  break;
              }
          }
          // either way, then go through the accounts pulled
          for (let a = 0; a < accountsData.length; a++) {
              let account = accountsData[a];
              if (account.parent_account_id == 3) {
                accounts.push({
                  name: account.name,
                  id: '' + account.id
                })
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
            progress_method: "points_weighted",
            account: 0,
            filters: {
              section: 'All',
              hide_missing_end_date: true,
              hide_past_end_date: false
            }
          },
          accounts: [
            {
              name: 'My Courses',
              id: '' + 0
            }
          ],
          columns: [
            new Column('User Name', 'The student\'s name as it appears in Canvas.', 'auto', false, 'string',
              (student) => this.settings.anonymous ? 'STUDENT ' + student.user_id : (student.user_name ?? '')
            ),
            new Column('Course Name', 'The course in which the student is enrolled.', '10rem', false, 'string', 
              (student) => this.settings.anonymous ? 'COURSE ' + student.course_id: (student.course_name ?? '')
            ),
            new Column('Section Name', 'The section in which the student is enrolled in this course.', '10rem', false, 'string', 
              student => this.settings.anonymous ? '' : student.section_name
            ),
            new Column('Score', 'The student\'s grade based on assignments submitted to date.', '5rem', true, 'number', 
              student => student.current_score ? student.current_score + '%' : 'n/a',
              student => {
                if (!student.current_score) return {
                  'background-color': this.colors.gray,
                  'color': this.colors.black
                }
                return {
                  'background-color': !student.current_score ? this.colors.black : (student.current_score < 60) ? this.colors.red : (student.current_score < 80 ? this.colors.yellow : this.colors.green),
                  'color': this.colors.white,
                }
              }
            ),
            new Column('Final Score', 'The student\'s final grade. All unsubmitted assignments are graded as 0. This is their grade if they were to conclude the course right now.', '5.5rem', true, 'number', 
              student => student.final_score ? student.final_score + '%' : 'n/a',
              student => {
                if (!student.final_score) return {
                  'background-color': this.colors.gray,
                  'color': this.colors.black
                }
                return {
                  'background-color': (student.final_score < 60) ? this.colors.red : (student.final_score < 80 ? this.colors.yellow : this.colors.green),
                  'color': this.colors.white,
                }
              }
            ),
            new Column('End At', 'The course end date.', '5rem', true, 'number',
              student => {
                return !student.end_at ? 'n/a' : this.dateToString(student.end_at);
              },
              student => {
                if (!student.end_at) return {
                  'background-color': this.colors.gray,
                  'color': this.colors.black
                }
                return {
                  'background-color': (student.days_left < 0) ? this.colors.darkRed : ( (student.days_left < 3) ? this.colors.red : (student.days_left < 7 ? this.colors.yellow : this.colors.green) ),
                  'color': this.colors.white,
                }
              }
            ),
            // new Column('Days Left', 'The number of days until the student will be removed from the course.', true, 3, 'number')
            new Column('Ungraded', '', '4.5rem', true, 'number',
              student => student.ungraded,
              student => {
                return {
                  'background-color': (student.ungraded > 1) ? this.colors.red : (student.ungraded > 0 ? this.colors.yellow : this.colors.green),
                  'color': this.colors.white,
                }
              }
            ),
            new Column('Oldest Sub', '', '5rem', true, 'number',
              student => {
                let days = 0;
                if (student.oldest_sub) {
                  days = this.calcDaysBetweenDates(student.oldest_sub, new Date());
                  if (days < 0) days = 0;
                }
                return days + ' Days';
              },
              student => {
                let days = 0;
                if (student.oldest_sub) {
                  days = this.calcDaysBetweenDates(student.oldest_sub, new Date());
                  if (days < 0) days = 0;
                }
                return {
                  'background-color': (days > 3) ? this.colors.red : (days > 1 ? this.colors.yellow : this.colors.green),
                  'color': this.colors.white,
                }
              }
            ),
            // new Column('Last Submit', 'The number of days since the student\'s last submission.', '4rem', true, 'number'),
            // progress ends up with its own special call out because it does the bar graph thing
            new Column('Progress', 'This is an estimate of the student\'s progress baed on the cirterion selected above.', '10rem', true, 'number'),
            // new Column('Days In Course', 'The number of days since the student began the course.', '4rem', true, 'number'),
          ],
          enrollments: [],
          loading: false, //CHANGE: return this to true if this doesn't work
          menu: '',
          section_names: ['All'],
          section_filter: 'All',
          end_date_filter: true,
          hide_missing_end_date: true,
          hide_past_end_date: false 
        }
      },
      computed: {
        visibleColumns: function () {
          return this.columns.filter(function (c) {
            return c.visible;
          })
        },
        visibleRows: function () {
          return this.enrollments.filter((student) => {
            if (this.settings?.filters?.hide_missing_end_date && student.end_at == null) return false;
            if (this.settings?.filters?.hide_past_end_date && student.end_at != null && student.end_at < new Date()) return false;
            if (this.settings?.filters?.section != 'All' && student.section_name != this.settings?.filters?.section) return false;
            return true;
          })
        }
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
            if (resp.data && resp.data.settings) {
              saved = resp.data.settings;
            } else {
              console.warn('No saved settings found; using defaults.');
            }
          } catch (err) {
            console.warn('Failed to load saved settings; using defaults.', err);
          }

          // Deep merge:
          const merged = JSON.parse(JSON.stringify(fallback)); // start fresh
          merged.progress_method = saved.progress_method || fallback.progress_method;
          merged.account = saved.account ?? fallback.account;

          // Merge filters:
          if (saved.filters) {
            merged.filters = Object.assign({}, fallback.filters, saved.filters);
          } else {
            merged.filters = JSON.parse(JSON.stringify(fallback.filters));
          }
          if (merged.anonymous === "true") merged.anonymous = true;
          else merged.anonymous = false;

          // 🔑 Normalize: convert string "true"/"false" to real booleans
          for (const key in merged.filters) {
            const val = merged.filters[key];
            if (val === "true") merged.filters[key] = true;
            else if (val === "false") merged.filters[key] = false;
          }

          // hard override of whatever was saved. It was too confusing, especially if you select a section in one course that doesn't exist in another.
          merged.filters.section = 'All';
          return merged;
        },
      
        async saveSettings(settings) {
          await $.put(`/api/v1/users/self/custom_data/progress?ns=edu.btech.canvas`, {
            data: {
              settings: settings
            }
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
          return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        },
        // does not currently handle pagination
        async graphqlUngradedSubmissions(courseId) {
          let queryString = 
          `{
            course(id: "${courseId}"){
              courseCode
              name
               submissionsConnection(filter: {states: [submitted, ungraded, pending_review]}) {
                nodes {
                  enrollmentsConnection {
                    nodes {
                      _id
                    }
                  }
                  submittedAt
                }
              }
              _id
            }
          }`
          let res = await $.post("/api/graphql", { query: queryString });
          return res.data.course;
        },
        async graphqlEnrollments(courseId) {
          let queryString = 
          `{
            course(id: "${courseId}"){
              enrollmentsConnection(filter: {states: active, types: StudentEnrollment}, first: 100) {
                nodes {
                  _id
                  createdAt
                  startAt
                  endAt
                  grades {
                    currentScore
                    finalScore
                  }
                  user {
                    name
                    _id
                  }

                  section {
                    name
                  }
                }
              }
              courseCode
              name
              _id
            }
          }`
          let res = await $.post("/api/graphql", { query: queryString });
          return res.data.course;
        },
        calcDaysBetweenDates(date1, date2=new Date()) {
          let diffTime =  date2 - date1;
          let diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          return diffDays;
        },
        async loadEnrollments(courseId) {
          let enrollments = [];
          
          let courseData = await this.graphqlEnrollments(courseId);
          let ungradedSubmissionsData = await this.graphqlUngradedSubmissions(courseId);
          // let recentSubmissionsData = await this.graphqlRecentSubmissions(courseId);
          let enrollmentsData = courseData.enrollmentsConnection.nodes;
          let ungradedSubmissions = ungradedSubmissionsData.submissionsConnection.nodes;
          for (let e = 0; e < enrollmentsData.length; e++) {
            let enrollmentData = enrollmentsData[e];
            let endAt = enrollmentData.endAt ? Date.parse(enrollmentData.endAt) : null;
            let startAt = enrollmentData.startAt ?? enrollmentData.createdAt;
            startAt = startAt ? Date.parse(startAt) : null;
            let daysLeft = this.calcDaysBetweenDates(new Date(), endAt);
            let daysInCourse = this.calcDaysBetweenDates(startAt);
            if (!this.section_names.includes(enrollmentData.section.name)) this.section_names.push(enrollmentData.section.name);
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
              user_id: enrollmentData.user._id,
              ungraded: 0,
              oldest_sub: new Date(),
              oldest_sub_name: ''
            };
            enrollment = this.processEnrollment(enrollment);
            enrollments.push(enrollment);

          }
          for (let s = 0; s < ungradedSubmissions.length; s++) {
            let submissionData = ungradedSubmissions[s];
            for (let e = 0; e < enrollments.length; e++) {
              if (enrollments[e].enrollment_id == submissionData.enrollmentsConnection.nodes[0]._id) {
                enrollments[e].ungraded += 1;
                let submittedAt = Date.parse(submissionData.submittedAt);
                if (submittedAt < enrollments[e].oldest_sub) {
                  enrollments[e].oldest_sub = submittedAt;
                }
              }
            }
          }
          return enrollments;
        },
        processEnrollment(enrollment) {
          if (enrollment.current_score > 0) {
            enrollment.progress = Math.round(enrollment.final_score / enrollment.current_score * 100);
          }
          // let end_date = Date.parse(enrollment.end_at);
          let now = Date.now();
          let diffTime =  now - enrollment.created_at;
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
            courses = await canvasGet('/api/v1/courses?enrollment_type=teacher&enrollment_state=active&state[]=available&include[]=term');
          } else {
            courses = await canvasGet(`/api/v1/accounts/${this.settings.account}/courses?state[]=available&include[]=term`);
          }
          for (let c in courses) {
            let course = courses[c];
            if (course.term.end_at) {
              let termEndAt = Date.parse(course.term.end_at)
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
            // check to make sure should still be loading from this account
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
          if (header === "Progress Estimate") name = this.columnNameToCode(this.progress_method);
          else name = this.columnNameToCode(header);
          let sortState = 1;
          let sortType = '';
          for (let c = 0; c < this.columns.length; c++) {
            if (this.columns[c].name !== header) {
              //reset everything else
              this.columns[c].sort_state = 0;
            } else {
              //if it's the one being sorted, set it to 1 if not 1, or set it to -1 if is already 1
              if (this.columns[c].sort_state !== 1) this.columns[c].sort_state = 1;
              else this.columns[c].sort_state = -1;
              sortState = this.columns[c].sort_state;
              sortType = this.columns[c].sort_type;
            }
          }
          this.enrollments.sort(function (a, b) {
            let aVal = a[name] ?? -1;
            let bVal = b[name] ?? -1;
            //convert strings to upper case to ignore case when sorting
            if (typeof (aVal) === 'string') aVal = aVal.toUpperCase();
            if (typeof (bVal) === 'string') bVal = bVal.toUpperCase();

            //see if not the same type and which one isn't the sort type
            if (typeof (aVal) !== typeof (bVal)) {
              if (typeof (aVal) !== sortType) return -1 * sortState;
              if (typeof (bVal) !== sortType) return 1 * sortState;
            }
            //check if it's a string or int
            let comp = 0;
            if (aVal > bVal) comp = 1;
            else if (aVal < bVal) comp = -1;
            //flip it if reverse sorting;
            comp *= sortState;
            return comp
          });
        },
   
        columnNameToCode(name) {
          return name.toLowerCase().replace(/ /g, "_");
        },

        close() {
          $(this.$el).hide();
        }

      }
    })
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
  async function _init() {
    loadCSS("https://reports.bridgetools.dev/department_report/style/main.css");
    loadCSS("https://reports.bridgetools.dev/style/main.css");
    await $.getScript("https://bridgetools.dev/canvas/external-libraries/vue.2.6.12.js");
    await $.getScript("https://reports.bridgetools.dev/department_report/components/courseProgressBarInd.js");
    postLoad();
  }
  _init();
})();