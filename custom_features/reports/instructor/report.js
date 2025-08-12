(async function () {
  // Create the button element
  function createButton() {
    // Create the <a> button
    const btn = $('<a class="Button" id="canvas-instructor-report-vue-gen">Instructor Report</a>');

    // Wrap the button in a relatively positioned container so the circle can be positioned correctly
    const wrapper = $('<div style="position: relative; display: inline-block;"></div>');

    wrapper.append(btn);

    // Add the click handler
    btn.click(function () {
      $("#canvas-instructor-report-vue").show();
      $.post("https://tracking.bridgetools.dev/api/hit", {
        "tool": "reports-instructor",
        "canvasId": ENV.current_user_id
      });
    });

    return wrapper;
  }

  // Function to ensure button is present
  function ensureButton(container) {
    if ($('#canvas-instructor-report-vue-gen').length === 0) {
      container.append(createButton());
    }
  }


  async function postLoad() {
    let vueString = '';
    await $.get(SOURCE_URL + '/custom_features/reports/courses/template.vue', null, function (html) {
      vueString = html.replace("<template>", "").replace("</template>", "");
    }, 'text');

    // Add modal container and Vue content
    let canvasbody = $("#application");
    canvasbody.after('<div id="canvas-instructor-report-vue"></div>');
    $("#canvas-instructor-report-vue").append(vueString);
    $("#canvas-instructor-report-vue").hide();

    container = $('#right-side');
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
      el: '#canvas-instructor-report-vue',
      created: function() {
      },
      mounted: async function () {
        this.loading = true;
        let settings = await this.loadSettings(this.settings);
        this.settings = settings;
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
        this.loadCourses();
      },

      data: function () {
        return {
          colors: bridgetools.colors,
          settings: {
            anonymous: false,
            account: 0,
            sort_dir: 1,
            filters: {
              year: '2024',
              hide_zero_credits: true,
              hide_zero_students: true
            }
          },
          accounts: [
            {
              name: 'My Courses',
              id: '' + 0
            }
          ],
          courses: [],
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
      },
      methods: {
        async loadSettings(settings) {
          const fallback = JSON.parse(JSON.stringify(settings));
          let saved = {};
          try {
            const resp = await $.get(`/api/v1/users/self/custom_data/courses?ns=edu.btech.canvas`);
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
          await $.put(`/api/v1/users/self/custom_data/courses?ns=edu.btech.canvas`, {
            data: {
              settings: settings
            }
          });
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
        processCourses(courses) {
          for (let c = 0 ; c < courses.length; c++) {
            let course = courses[c];
            course.students = course.num_students_credits;
            course.grades = course.average_score;
            course.objectives = this.calcLikert(course, 'Objectives');
            course.relevance = this.calcLikert(course, 'Workplace Relevance');
            course.examples = this.calcLikert(course, 'Examples');
            course.recommendable = this.calcLikert(course, 'Recommendable');
            course.recommendations = course.surveys.has_recommendations;
          }
          return courses;
        },

        async getMyCourses() {
          // Fetch 50 course IDs at a time
          let courses = await canvasGet('/api/v1/courses?enrollment_type=teacher&enrollment_state=active&state[]=available&include[]=term');
          let courseIds = courses.map(course => course.id);
          console.log(courseIds);
          let limit = 50;
          for (let i = 0; i < courseIds.length; i += limit) {
            const chunk = courseIds.slice(i, i + limit);
            let url = `https://reports.bridgetools.dev/api/reviews/courses?limit=${limit}`;
            for (let id of chunk) {
              url += '&course_ids[]=' + id;
            }

            let chunkData = await bridgetools.req(url);
            this.courses.push(...this.processCourses(chunkData.courses)) // Append each chunk
          }
        },

        async loadCourses() {
          this.loading = true;
          this.courses = [];
          let limit = 50;
          if (this.settings.account == 0) {
            await this.getMyCourses();
          } else {
            let instructorId = ENV.current_user_id;
            instructorId = 1840071;
            let url = `https://reports.bridgetools.dev/api/instructors/${instructorId}?limit=${limit}&excludes[]=content_items&year=${this.settings.filters.year}&account_id=${this.settings.account}`;
            let resp = {};
            do {
              resp = await bridgetools.req(url + (resp?.next_id ? `&last_id=${resp.next_id}` : ''));
              this.courses.push(...this.processCourses(resp.courses));
            } while (resp?.courses?.length == limit)
          }


          this.loading = false;
        },

        calcDaysBetweenDates(date1, date2=new Date()) {
          let diffTime =  date2 - date1;
          let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays;
        },

        calcLikert(course, name) {
          let score = (course?.surveys?.likerts ?? []).filter(likert => likert.name == name)?.[0]?.score
          return score ?? null
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
    postLoad();
  }
  _init();
})();