// reports/combined/report.js
(async function () {
  window.ReportColumn = ReportColumn;
  window.ReportTable = ReportTable;

  function createButton() {
    const btn = $('<a class="Button" id="canvas-instructor-report-vue-gen">Reports</a>');
    const wrapper = $('<div style="position: relative; display: block;"></div>');
    wrapper.append(btn);
    btn.click(function () {
      $("#canvas-instructor-report-vue").show();
      $.post("https://tracking.bridgetools.dev/api/hit", {
        tool: "reports-instructor",
        canvasId: ENV.current_user_id
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
    const todayStr = new Date().toISOString();
    let vueString = '';
    await $.get(
      SOURCE_URL + `/custom_features/reports/combined/template.vue?v=${todayStr}`,
      null,
      function (html) {
        vueString = html.replace("<template>", "").replace("</template>", "");
      },
      'text'
    );

    const canvasbody = $("#application");
    canvasbody.after('<div id="canvas-instructor-report-vue"></div>');
    $("#canvas-instructor-report-vue").append(vueString);
    $("#canvas-instructor-report-vue").hide();

    const container = $('#right-side');
    ensureButton(container);

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') ensureButton(container);
      }
    });
    observer.observe(container[0], { childList: true, subtree: false });

    new Vue({
      el: '#canvas-instructor-report-vue',

      data: function () {
        const reports = [
          {
            value: 'departments',
            label: 'Departments',
            component: 'reports-departments',
            title: 'Departments Report',
            subMenus: [
              {
                value: 'syllabi',
                label: 'Syllabi',
                dataset: 'department_syllabi_summary',
                filters: {
                  academic_year: { source: 'current_year' }
                }
              }
            ]
          },
          {
            value: 'department',
            label: 'Department',
            component: 'reports-department',
            title: 'Department Report',
            subMenus: [
              {
                value: 'syllabi',
                label: 'Syllabi',
                dataset: 'department_syllabi',
                filters: {
                  academic_year: { source: 'current_year' },
                  department_name: { source: 'selected_department_name' }
                }
              }
            ]
          }
        ];

        return {
          reportTypes: reports,
          settings: {
            reportType: 'departments',
            subMenuByType: {
              departments: 'syllabi',
              department: 'syllabi'
            }
          },
          selectedDepartmentCode: '',
          selectedDepartmentName: ''
        };
      },

      computed: {
        currentReportMeta() {
          const fallback = this.reportTypes[0];
          return this.reportTypes.find(r => r.value === this.settings.reportType) || fallback;
        },

        currentSubMenus() {
          return this.currentReportMeta?.subMenus || [];
        },

        currentSubKey() {
          const type = this.settings.reportType;
          const saved = this.settings.subMenuByType?.[type];
          if (saved && this.currentSubMenus.some(menu => menu.value === saved)) return saved;
          return this.currentSubMenus[0]?.value || null;
        },

        currentSubMeta() {
          return this.currentSubMenus.find(menu => menu.value === this.currentSubKey) || null;
        },

        currentReportProps() {
          const subMeta = this.currentSubMeta || {};
          return {
            subMenu: this.currentSubKey,
            reportContext: {
              reportName: this.currentReportMeta?.value || '',
              reportTitle: this.currentReportMeta?.title || '',
              subMenu: this.currentSubKey,
              dataset: subMeta.dataset || '',
              filters: this.resolveFilters(subMeta.filters || {}),
              routeFilters: {
                departmentCode: this.selectedDepartmentCode,
                departmentName: this.selectedDepartmentName
              }
            }
          };
        }
      },

      methods: {
        drillToReport(payload) {
          const report = String(payload?.report ?? '').trim();
          const subMenu = String(payload?.subMenu ?? 'syllabi').trim() || 'syllabi';
          const account = String(payload?.account ?? payload?.department_code ?? '').trim();
          const departmentName = String(payload?.department_name ?? payload?.name ?? '').trim();

          if (account) this.selectedDepartmentCode = account;
          if (departmentName) this.selectedDepartmentName = departmentName;

          this.settings.reportType = report || 'departments';
          if (!this.settings.subMenuByType) this.$set(this.settings, 'subMenuByType', {});
          this.$set(this.settings.subMenuByType, this.settings.reportType, subMenu);
        },

        onReportChange() {
          if (!this.settings.subMenuByType) this.$set(this.settings, 'subMenuByType', {});
          if (!this.settings.subMenuByType[this.settings.reportType]) {
            this.$set(this.settings.subMenuByType, this.settings.reportType, this.currentSubMenus[0]?.value || 'syllabi');
          }
        },

        setSubMenu(value) {
          if (!this.settings.subMenuByType) this.$set(this.settings, 'subMenuByType', {});
          this.$set(this.settings.subMenuByType, this.settings.reportType, value);
        },

        resolveFilters(filterDefs) {
          const resolved = {};
          const currentYear = new Date().getFullYear();

          for (const [key, def] of Object.entries(filterDefs || {})) {
            const source = def?.source;
            if (source === 'current_year') resolved[key] = currentYear;
            else if (source === 'selected_department_code') resolved[key] = this.selectedDepartmentCode;
            else if (source === 'selected_department_name') resolved[key] = this.selectedDepartmentName;
            else if (Object.prototype.hasOwnProperty.call(def || {}, 'value')) resolved[key] = def.value;
          }

          return resolved;
        },

        close() {
          $(this.$el).hide();
        }
      }
    });
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

  async function _init() {
    loadCSS("https://reports.bridgetools.dev/department_report/style/main.css");
    loadCSS("https://reports.bridgetools.dev/style/main.css");

    await $.getScript("https://bridgetools.dev/canvas/external-libraries/vue.2.6.12.js");
    await $.getScript("https://bridgetools.dev/canvas/external-libraries/d3.v7.js");

    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/departments.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/departments-syllabi.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department-syllabi.js");

    postLoad();
  }

  _init();
})();
