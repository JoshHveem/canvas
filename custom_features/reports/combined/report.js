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
    let vueString = '';
    await $.get(
      (window.btechAssetUrl ? window.btechAssetUrl(SOURCE_URL + `/custom_features/reports/combined/template.vue`) : SOURCE_URL + `/custom_features/reports/combined/template.vue`),
      null,
      function (html) {
        vueString = html.replace("<template>", "").replace("</template>", "");
      },
      'text'
    );

    const canvasbody = $("#application");
    canvasbody.after('<div id="canvas-instructor-report-vue"><div id="canvas-instructor-report-vue-app"></div></div>');
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
      el: '#canvas-instructor-report-vue-app',
      template: vueString,

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
              },
              {
                value: 'cpl-historic',
                label: 'CPL Historic',
                component: 'reports-outcomes-cpl-historic',
                dataset: 'program_cpl',
                filters: {}
              }
            ]
          },
          {
            value: 'employment-skills',
            label: 'Employment Skills',
            title: 'Employment Skills Report',
            subMenus: [
              {
                value: 'employment-skills',
                label: 'Submissions',
                component: 'reports-employment-skills',
                dataset: 'student_employment_skills_current',
                filters: {
                  academic_year: { source: 'current_year' }
                }
              }
            ]
          },
          {
            value: 'students',
            label: 'Students',
            title: 'Students Report',
            subMenus: [
              {
                value: 'probations',
                label: 'Probations',
                component: 'reports-students-probations',
                dataset: 'student_on_probation',
                filters: {}
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
              },
              {
                value: 'course-course-evals-summary',
                label: 'Course Evals by Course',
                component: 'reports-evaluations-course-evals-by-course',
                dataset: 'course_course_evaluations',
                filters: {
                  academic_year: { source: 'current_year' }
                }
              },
              {
                value: 'course-eval-detail',
                label: 'Course Eval Detail',
                component: 'reports-evaluations-course-detail',
                dataset: 'course_evaluations',
                filters: {
                  academic_year: { source: 'current_year' }
                }
              },
              {
                value: 'instructor-evals-summary',
                label: 'Instructor Eval Summary',
                component: 'reports-evaluations-instructor-summary',
                dataset: 'program_instructor_evaluations',
                filters: {
                  academic_year: { source: 'current_year' }
                }
              },
              {
                value: 'course-instructor-evals-summary',
                label: 'Instructor Evals by Course',
                component: 'reports-evaluations-instructor-evals-by-course',
                dataset: 'course_instructor_evaluations',
                filters: {
                  academic_year: { source: 'current_year' }
                }
              },
              {
                value: 'instructor-eval-detail',
                label: 'Instructor Eval Detail',
                component: 'reports-evaluations-instructor-detail',
                dataset: 'instructor_evaluations',
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
              students: 'probations',
              evaluations: 'course-evals-summary'
            }
          },
          sharedFilters: {
            academic_year: new Date().getFullYear()
          },
          selectedDepartmentCode: '',
          selectedDepartmentName: '',
          selectedProgramCode: '',
          selectedProgramName: '',
          selectedCourseCode: '',
          selectedCourseName: ''
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
              sharedFilters: this.sharedFilters,
              setSharedFilter: (key, value) => this.setSharedFilter(key, value),
              routeFilters: {
                departmentCode: this.selectedDepartmentCode,
                departmentName: this.selectedDepartmentName,
                programCode: this.selectedProgramCode,
                programName: this.selectedProgramName,
                courseCode: this.selectedCourseCode,
                courseName: this.selectedCourseName
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
          const programCode = String(payload?.program_code ?? '').trim();
          const programName = String(payload?.program_name ?? '').trim();
          const courseCode = String(payload?.course_code ?? '').trim();
          const courseName = String(payload?.course_name ?? '').trim();

          if (account) this.setSharedFilter('department_code', account);
          if (departmentName) this.setSharedFilter('department_name', departmentName);
          if (programCode) this.setSharedFilter('program_code', programCode);
          if (programName) this.setSharedFilter('program_name', programName);
          if (courseCode) this.setSharedFilter('course_code', courseCode);
          if (courseName) this.setSharedFilter('course_name', courseName);

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

        cloneFilterValue(value) {
          if (Array.isArray(value)) return value.slice();
          if (value && typeof value === 'object') return Object.assign({}, value);
          return value;
        },

        setSharedFilter(key, value) {
          const filterKey = String(key || '').trim();
          if (!filterKey) return;

          const nextValue = this.cloneFilterValue(value);
          this.$set(this.sharedFilters, filterKey, nextValue);

          if (filterKey === 'department_code') this.selectedDepartmentCode = String(value ?? '').trim();
          if (filterKey === 'department_name') this.selectedDepartmentName = String(value ?? '').trim();
          if (filterKey === 'program_code') this.selectedProgramCode = String(value ?? '').trim();
          if (filterKey === 'program_name') this.selectedProgramName = String(value ?? '').trim();
          if (filterKey === 'course_code') this.selectedCourseCode = String(value ?? '').trim();
          if (filterKey === 'course_name') this.selectedCourseName = String(value ?? '').trim();
        },

        resolveFilters(filterDefs) {
          const resolved = {};
          const currentYear = new Date().getFullYear();

          for (const [key, def] of Object.entries(filterDefs || {})) {
            if (Object.prototype.hasOwnProperty.call(this.sharedFilters, key)) {
              resolved[key] = this.cloneFilterValue(this.sharedFilters[key]);
              continue;
            }

            const source = def?.source;
            if (source === 'current_year') resolved[key] = currentYear;
            else if (source === 'selected_department_code') resolved[key] = this.selectedDepartmentCode;
            else if (source === 'selected_department_name') resolved[key] = this.selectedDepartmentName;
            else if (Object.prototype.hasOwnProperty.call(def || {}, 'value')) resolved[key] = def.value;
          }

          return resolved;
        },

        close() {
          $('#canvas-instructor-report-vue').hide();
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

    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/external-libraries/vue.2.6.12.js") : "https://bridgetools.dev/canvas/external-libraries/vue.2.6.12.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/external-libraries/d3.v7.js") : "https://bridgetools.dev/canvas/external-libraries/d3.v7.js");

    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/components/report-mixins.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/components/report-mixins.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/components/report-table-shell.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/components/report-table-shell.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/departments-syllabi.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/departments-syllabi.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/departments-course-readiness.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/departments-course-readiness.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department-instructors.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department-instructors.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department-syllabi.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department-syllabi.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department-course-readiness.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department-course-readiness.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/outcomes-cpl.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/outcomes-cpl.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/outcomes-cpl-historic.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/outcomes-cpl-historic.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/employment-skills.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/employment-skills.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/students-probations.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/students-probations.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/evaluations-course-summary.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/evaluations-course-summary.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/evaluations-course-evals-by-course.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/evaluations-course-evals-by-course.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/evaluations-course-detail.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/evaluations-course-detail.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/evaluations-instructor-summary.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/evaluations-instructor-summary.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/evaluations-instructor-evals-by-course.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/evaluations-instructor-evals-by-course.js");
    await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/evaluations-instructor-detail.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/evaluations-instructor-detail.js");
    if (IS_ISD) await $.getScript(window.btechAssetUrl ? window.btechAssetUrl("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/admissions-overview.js") : "https://bridgetools.dev/canvas/custom_features/reports/combined/reports/admissions-overview.js");

    postLoad();
  }

  _init();
})();
