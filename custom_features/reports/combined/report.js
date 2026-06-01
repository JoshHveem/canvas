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
            value: 'syllabi',
            label: 'Syllabi',
            title: 'Syllabi Report',
            subMenus: [
              {
                value: 'summary',
                label: 'Summary',
                component: 'reports-departments-syllabi',
                dataset: 'department_syllabi_summary',
                filters: {
                  academic_year: { source: 'current_year' }
                }
              },
              {
                value: 'course-status',
                label: 'Course Status',
                component: 'reports-department-syllabi',
                dataset: 'syllabi_status',
                filters: {
                  academic_year: { source: 'current_year' },
                  department_code: { source: 'selected_department_code' }
                }
              }
            ]
          },
          {
            value: 'course-readiness',
            label: 'Course Readiness',
            title: 'Course Readiness Report',
            subMenus: [
              {
                value: 'department-summary',
                label: 'Department Summary',
                component: 'reports-departments-course-readiness',
                dataset: 'department_canvas_course_readiness',
                filters: {
                  academic_year: { source: 'current_year' }
                }
              },
              {
                value: 'course-status',
                label: 'Course Status',
                component: 'reports-department-course-readiness',
                dataset: 'canvas_course_readiness',
                filters: {
                  academic_year: { source: 'current_year' },
                  department_code: { source: 'selected_department_code' }
                }
              }
            ]
          },
          {
            value: 'instructors',
            label: 'Instructors',
            title: 'Instructors Report',
            subMenus: [
              {
                value: 'department-summary',
                label: 'Department Summary',
                component: 'reports-department-instructors',
                dataset: 'instructors_department_summary',
                filters: {
                  academic_year: { source: 'current_year' },
                  department_code: { source: 'selected_department_code' }
                }
              }
            ]
          },
          {
            value: 'admissions',
            label: 'Admissions',
            title: 'Admissions Report',
            subMenus: [
              {
                value: 'overview',
                label: 'Overview',
                component: 'reports-admissions-overview',
                dataset: 'candidacies_stage_map',
                filters: {
                  academic_year: { source: 'current_year' }
                }
              }
            ]
          },
          {
            value: 'outcomes',
            label: 'Outcomes',
            title: 'Outcomes Report',
            subMenus: [
              {
                value: 'cpl',
                label: 'CPL',
                component: 'reports-outcomes-cpl',
                dataset: 'program_cpl',
                filters: {
                  academic_year: { source: 'current_year' }
                }
              }
            ]
          },
          {
            value: 'evaluations',
            label: 'Evaluations',
            title: 'Evaluations Report',
            subMenus: [
              {
                value: 'course-evals-summary',
                label: 'Course Evals Summary',
                component: 'reports-evaluations-course-summary',
                dataset: 'program_course_evaluations',
                filters: {
                  academic_year: { source: 'current_year' }
                }
              }
            ]
          }
        ];

        return {
          reportTypes: reports,
          settings: {
            reportType: 'syllabi',
            subMenuByType: {
              syllabi: 'summary',
              'course-readiness': 'department-summary',
              instructors: 'department-summary',
              admissions: 'overview',
              outcomes: 'cpl',
              evaluations: 'course-evals-summary'
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

        currentComponent() {
          return this.currentSubMeta?.component || null;
        },

        currentReportProps() {
          const subMeta = this.currentSubMeta || {};
          return {
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
          const subMenu = String(payload?.subMenu ?? 'summary').trim() || 'summary';
          const account = String(payload?.account ?? payload?.department_code ?? '').trim();
          const departmentName = String(payload?.department_name ?? payload?.name ?? '').trim();

          if (account) this.selectedDepartmentCode = account;
          if (departmentName) this.selectedDepartmentName = departmentName;

          this.settings.reportType = report || 'syllabi';
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

    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/report-mixins.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/components/report-table-shell.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/departments-syllabi.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/departments-course-readiness.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department-instructors.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department-syllabi.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department-course-readiness.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/outcomes-cpl.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/evaluations-course-summary.js");
    if (IS_ISD) await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/admissions-overview.js");

    postLoad();
  }

  _init();
})();
