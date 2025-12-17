(async function () {
  // courses-table.js

  class ReportColumn {
    constructor(
      name, description, width, average, sort_type,
      getContent = (row) => row?.name ?? '',
      style_formula = null,
      sort_val_func = null
    ) {
      this.name = name;
      this.description = description;
      this.width = width;
      this.average = average;
      this.sort_type = sort_type;     // "string" | "number"
      this.sort_state = 0;            // -1 | 0 | 1
      this.visible = true;

      this.getContent = getContent;
      this.style_formula = style_formula;
      this.sort_val_func = sort_val_func;
    }

    get_style(row) {
      return this.style_formula ? this.style_formula(row) : {};
    }

    getSortValue(row) {
      if (typeof this.sort_val_func === "function") return this.sort_val_func(row);

      const raw = this.getContent(row);
      if (this.sort_type === "number") {
        const n = Number(String(raw ?? "").replace("%", "").trim());
        return Number.isFinite(n) ? n : NaN;
      }
      return ("" + (raw ?? "")).toUpperCase();
    }
  }

  class ReportTable {
    constructor({
      rows = [],
      columns = [],
      sort_column = null,
      sort_dir = 1,
      colors = null
    } = {}) {
      this.rows = rows;
      this.columns = columns;

      this.sort_column = sort_column || (columns[0]?.name ?? "");
      this.sort_dir = sort_dir;

      this.colors = colors || {
        red:'#b20b0f', orange:'#f59e0b', yellow:'#eab308',
        green:'#16a34a', gray:'#e5e7eb', black:'#111827', white:'#fff'
      };
    }

    setRows(rows) {
      this.rows = rows || [];
    }

    setColumns(columns) {
      this.columns = columns || [];
      if (!this.sort_column && this.columns[0]) this.sort_column = this.columns[0].name;
    }

    getVisibleColumns() {
      return (this.columns || []).filter(c => c.visible);
    }

    getColumnsWidthsString() {
      return (this.getVisibleColumns()).map(c => c.width).join(" ");
    }

    setSortColumn(name) {
      if (this.sort_column === name) this.sort_dir *= -1;
      else { this.sort_column = name; this.sort_dir = 1; }

      (this.columns || []).forEach(c => c.sort_state = (c.name === name ? this.sort_dir : 0));
    }

    sortRows(rows) {
      const col = (this.columns || []).find(c => c.name === this.sort_column);
      const sortType = col ? col.sort_type : "string";
      const dir = this.sort_dir || 1;

      const toStringKey = v => ("" + (v ?? "")).toUpperCase();

      return (rows || []).slice().sort((a, b) => {
        let av = col?.getSortValue ? col.getSortValue(a) : undefined;
        let bv = col?.getSortValue ? col.getSortValue(b) : undefined;

        if (sortType === "string") {
          av = toStringKey(av);
          bv = toStringKey(bv);
        } else {
          av = Number(av);
          bv = Number(bv);
        }

        const aNaN = Number.isNaN(av);
        const bNaN = Number.isNaN(bv);

        let comp;
        if (aNaN && bNaN) comp = 0;
        else if (aNaN) comp = 1;
        else if (bNaN) comp = -1;
        else comp = av > bv ? 1 : (av < bv ? -1 : 0);

        return comp * dir;
      });
    }

    // Convenience: if you want the class to “own” sorting
    getSortedRows() {
      return this.sortRows(this.rows);
    }

    // Shared formatting helpers (optional)
    pctText(v) {
      const n = Number(v);
      return Number.isFinite(n) ? (n * 100).toFixed(1) + "%" : "n/a";
    }

    bandBg(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) return { backgroundColor: this.colors.gray, color: this.colors.black };
      return {
        backgroundColor: (n < 0.80) ? this.colors.red : (n < 0.90 ? this.colors.yellow : this.colors.green),
        color: this.colors.white
      };
    }
  }

  // expose globally for non-module usage
  window.ReportColumn = ReportColumn;
  window.CoursesTable = ReportTable;

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
            subMenuByType: {},
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
            {
              value: 'instructor',
              label: 'Instructor',
              component: 'reports-instructor',
              title: 'Instructor Report',
              subMenus: [
                { value: 'overview',     label: 'Overview' },
                { value: 'surveys',      label: 'Surveys' },
              ]
            },
            {
              value: 'department',
              label: 'Department',
              component: 'reports-department',
              title: 'Department Report',
              subMenus: [
                { value: 'instructors', label: 'Instructors' },
                { value: 'courses',     label: 'Courses' },
                { value: 'coe',         label: 'COE' },
              ]
            },
            {
              value: 'occupations',
              label: 'Occupations',
              component: 'occupations-report',
              title: 'Occupations Report',
              subMenus: [
                { value: 'overview', label: 'Overview' },
              ]
            },
            {
              value: 'courses',
              label: 'Courses',
              component: 'reports-courses',
              title: 'Courses Report',
              subMenus: [
                { value: 'overview', label: 'Overview' },
                { value: 'surveys',  label: 'Surveys' },
              ]
            },
          ],
        }
      },

      computed: {
        currentReportMeta() {
          const fallback = this.reportTypes[0];
          return this.reportTypes.find(r => r.value === (this.settings.reportType || 'instructor')) || fallback;
        },

        // All submenus for the current report type (or empty)
        currentSubMenus() {
          const rt = this.currentReportMeta;
          return rt && rt.subMenus ? rt.subMenus : [];
        },

        // Which submenu key is selected for this report type
        currentSubKey() {
          const menus = this.currentSubMenus;
          if (!menus.length) return null;

          const map = this.settings.subMenuByType || {};
          const type = this.settings.reportType;
          const saved = map[type];

          if (saved && menus.some(m => m.value === saved)) {
            return saved;
          }
          // default to first submenu if nothing saved/valid
          return menus[0].value;
        },

        currentReportProps() {
          const base = {
            year: this.settings.filters.year,
            account: this.settings.account,
            instructorId: ENV.current_user_id,
            // NEW: pass selected subMenu down to child component
            subMenu: this.currentSubKey
          };
          return base;
        },
      },


      methods: {
        onReportChange() {
          this.saveSettings(this.settings);
        },

        setSubMenu(value) {
          // ensure object exists (defensive)
          if (!this.settings.subMenuByType) {
            this.$set(this.settings, 'subMenuByType', {});
          }
          // Vue 2: use $set so reactivity works with dynamic keys
          this.$set(this.settings.subMenuByType, this.settings.reportType, value);
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

          // NEW: restore subMenuByType if it exists
          merged.subMenuByType = saved.subMenuByType || fallback.subMenuByType || {};

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
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/instructor.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/instructor-overview.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/instructor-surveys.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/dept-head-instructors-report.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department-instructors.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department-coe.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/occupations-report.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/courses.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/courses-overview.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/courses-surveys.js");
    // await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/course-report.js");

    postLoad();
  }

  _init();
})();
