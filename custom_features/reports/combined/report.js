(async function () {
  // accounts.mixin.js
  window.BtechAccountsMixin = {
    data() {
      return {
        accounts: [
          { name: 'My Courses', id: '' + 0 }
        ],
        accountsLoading: false
      }
    },
    methods: {
      async loadAccounts() {
        try {
          this.accountsLoading = true;

          // Pull root accounts
          let accountsData = await canvasGet('/api/v1/accounts');

          // If college-level admin, pull sub-accounts of 3
          for (let a = 0; a < accountsData.length; a++) {
            let account = accountsData[a];
            if (account.id == 3) {
              accountsData = await canvasGet('/api/v1/accounts/3/sub_accounts');
              break;
            }
          }

          // Filter to children of 3
          const accounts = [];
          for (let a = 0; a < accountsData.length; a++) {
            const account = accountsData[a];
            if (account.parent_account_id == 3) {
              accounts.push({ name: account.name, id: '' + account.id });
            }
          }

          accounts.sort((a, b) => a.name.localeCompare(b.name));
          // Keep "My Courses" at the front and append the rest
          this.accounts.splice(1, this.accounts.length - 1, ...accounts);
        } finally {
          this.accountsLoading = false;
        }
      }
    }
  };

  function createButton() {
    const btn = $('<a class="Button" id="canvas-instructor-report-vue-gen">Reports</a>');
    const wrapper = $('<div style="position: relative; display: block;"></div>');
    wrapper.append(btn);
    btn.click(function () {
      $("#canvas-instructor-report-vue").show();
      $.post("https://tracking.bridgetools.dev/api/hit", {
        "tool": "reports-instructor",
        "canvasId": ENV.current_user_id
      });
    });
    return wrapper;
  }

  function ensureButton(container) {
    if ($('#canvas-instructor-report-vue-gen').length === 0) {
      container.append(createButton());
    }
  }

  async function postLoad() {
    let vueString = '';
    await $.get(SOURCE_URL + '/custom_features/reports/combined/template.vue', null, function (html) {
      vueString = html.replace("<template>", "").replace("</template>", "");
    }, 'text');

    let canvasbody = $("#application");
    canvasbody.after('<div id="canvas-instructor-report-vue"></div>');
    $("#canvas-instructor-report-vue").append(vueString);
    $("#canvas-instructor-report-vue").hide();

    container = $('#right-side');
    ensureButton(container);

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') ensureButton(container);
      }
    });
    observer.observe(container[0], { childList: true, subtree: false });

    new Vue({
      el: '#canvas-instructor-report-vue',
      mounted: async function () {
        this.loading = true;

        // Load saved settings (generic)
        let settings = await this.loadSettings(this.settings);
        this.settings = settings;

        // Load accounts (generic)
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
            accounts.push({ name: account.name, id: '' + account.id })
          }
        }
        accounts.sort((a, b) => a.name.localeCompare(b.name));
        this.accounts.push(...accounts);

        this.loading = false;
      },

      data: function () {
        return {
          colors: bridgetools.colors,
          settings: {
            anonymous: false,
            account: 0,
            reportType: 'instructor',
            sort_dir: 1,
            filters: { year: '2025' }
          },
          accounts: [{ name: 'My Courses', id: '' + 0 }],
          loading: false,
          menu: '',
          section_names: ['All'],
          section_filter: 'All',
          end_date_filter: true,
          hide_missing_end_date: true,
          hide_past_end_date: false,
          reportTypes: [
            { value: 'instructor', label: 'Instructor', component: 'instructor-report', title: 'Instructor Report' },
            { value: 'department', label: 'Department', component: 'department-report', title: 'Department Report' },
            { value: 'occupations', label: 'Occupations', component: 'occupations-report', title: 'Occupations Report' },
            { value: 'courses',     label: 'Courses',     component: 'courses-report',     title: 'Courses Report' },
            { value: 'coe',    label: 'COE',    component: 'coe-report',    title: 'COE Evidence' },
          ],
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
            instructorId: ENV.current_user_id  // optional; child can use or ignore
          };
          return base; // other reports can use what they need from base
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

        close() { $(this.$el).hide(); }
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

    // Instructor sub-components
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/grading.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/support_hours.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/interactions.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/department-course-surveys.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/department-instructor-surveys.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/department-instructor-metrics.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/department-cpl.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/department-cpl-placement.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/department-coe.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/department-occupations.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/department-statistics.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/surveys.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/menu.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/kpi-tile.js");

    // The instructor report wrapper now owns its data & methods:
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/instructor-report.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/dept-head-instructors-report.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/department-report.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/occupations-report.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/courses-report.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/coe-report.js");

    postLoad();
  }

  _init();
})();
