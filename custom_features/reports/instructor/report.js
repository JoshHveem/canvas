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
    await $.get(SOURCE_URL + '/custom_features/reports/instructor/template.vue', null, function (html) {
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
        this.loadInstructorMetrics();
      },

      data: function () {
        return {
          colors: bridgetools.colors,
          settings: {
            anonymous: false,
            account: 0,
            sort_dir: 1,
            filters: {
              year: '2025'
            }
          },
          accounts: [
            {
              name: 'My Courses',
              id: '' + 0
            }
          ],
          instructor_metrics: {},
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
        grading: function () {
          let list = this.instructor_metrics?.grading ?? [];
          if (list.length == 0) return {};
          console.log(this.settings.filter);
          console.log(list);
          let year = this?.settings?.filter?.year ?? 2025;
          list = list.filter(data => data.academic_year == year);
          console.log(list);
          return list[0];
        }
      },
      methods: {
        async loadSettings(settings) {
          const fallback = JSON.parse(JSON.stringify(settings));
          let saved = {};
          try {
            const resp = await $.get(`/api/v1/users/self/custom_data/instructor?ns=edu.btech.canvas`);
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
          await $.put(`/api/v1/users/self/custom_data/instructor?ns=edu.btech.canvas`, {
            data: {
              settings: settings
            }
          });
        },
        dateToString(date) {
          date = new Date(Date.parse(date));
          return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        },
        async loadInstructorMetrics() {
            this.loading = true;
            this.courses = [];
            let instructorId = ENV.current_user_id;
            instructorId = 1840071;
            let url = `https://reports.bridgetools.dev/api/instructors/${instructorId}?year=${this.settings.filters.year}&account_id=${this.settings.account}`;
            let resp = await bridgetools.req(url);
            this.instructor_metrics = resp;
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