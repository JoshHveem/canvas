(function () {
  Vue.component("reports-v3-avps-canvas-course-readiness", {
    props: {
      avps: {
        type: Array,
        default: function () {
          return [];
        }
      },
      selectedFilters: {
        type: Object,
        default: function () {
          return {};
        }
      },
      loading: {
        type: Boolean,
        default: false
      },
      error: {
        type: String,
        default: ""
      }
    },
    computed: {
      filteredAvps() {
        const list = Array.isArray(this.avps) ? this.avps : [];
        console.log("[Reporting V3] AVP course readiness component input", list);

        const rows = list
          .map((avp) => this.normalizeAvpRow(avp))
          .filter(Boolean);

        console.log("[Reporting V3] AVP course readiness normalized rows", rows);
        return rows;
      },

      tableColumns() {
        return [
          { key: "name", label: "AVP", width: "12rem" },
          { key: "avpSisUserId", label: "SIS User ID", width: "7rem" },
          { key: "numDepartments", label: "Departments", width: "6rem", format: "integer", align: "right" },
          { key: "academicYear", label: "Year", width: "4rem", format: "integer", align: "right" },
          { key: "numCourses", label: "Courses", width: "5rem", format: "integer", align: "right" },
          {
            key: "percSyllabiApproved",
            label: "% Syllabi",
            width: "6rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: {
              good: 1.0,
              warning: 0.9,
              bad: 0.75
            }
          },
          {
            key: "percCourseEvaluationPublished",
            label: "% Course Evals",
            width: "6rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: {
              good: 1.0,
              warning: 0.9,
              bad: 0.75
            }
          },
          {
            key: "percInstructorEvaluationPublished",
            label: "% Instr Evals",
            width: "6rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: {
              good: 1.0,
              warning: 0.9,
              bad: 0.75
            }
          },
          {
            key: "percEmploymentSkillsEvaluationPublished",
            label: "% Empl Skill Evals",
            width: "7rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: {
              good: 1.0,
              warning: 0.9,
              bad: 0.75
            }
          },
          {
            key: "percContentPublished",
            label: "% Content",
            width: "6rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: {
              good: 1.0,
              warning: 0.9,
              bad: 0.75
            }
          }
        ];
      }
    },
    methods: {
      normalizeAvpRow(avp) {
        if (!avp || typeof avp !== "object") return null;

        return {
          name: String(avp?.name || avp?.avp_sis_user_id || "AVP").trim(),
          avpSisUserId: String(avp?.avp_sis_user_id || "").trim(),
          numDepartments: avp?.num_departments,
          academicYear: Number(avp?.canvas_course_readiness__academic_year || avp?.academic_year || 0),
          numCourses: avp?.canvas_course_readiness__num_courses,
          percSyllabiApproved: avp?.canvas_course_readiness__perc_syllabi_approved,
          percCourseEvaluationPublished: avp?.canvas_course_readiness__perc_course_evaluation_published,
          percInstructorEvaluationPublished: avp?.canvas_course_readiness__perc_instructor_evaluation_published,
          percEmploymentSkillsEvaluationPublished: avp?.canvas_course_readiness__perc_employment_skills_evaluation_published,
          percContentPublished: avp?.canvas_course_readiness__perc_content_published
        };
      },

      rowKey(row) {
        return `${row.avpSisUserId}-${row.academicYear || "na"}`;
      }
    },
    template: `
      <div style="margin-top:18px;">
        <div v-if="loading" class="btech-card btech-theme" style="padding:16px;">
          <div class="btech-muted">Loading AVP course readiness data...</div>
        </div>

        <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
          <div style="font-weight:600; margin-bottom:4px;">AVP Course Readiness Error</div>
          <div class="btech-muted">{{ error }}</div>
        </div>

        <div v-else-if="!filteredAvps.length" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">AVP Course Readiness</div>
          <div class="btech-muted">No AVP course readiness rows match the current filters.</div>
        </div>

        <reports-v3-table
          v-else
          :rows="filteredAvps"
          :columns="tableColumns"
          :row-key="rowKey"
          default-sort-key="name"
          :default-sort-dir="1"
          empty-message="No AVP course readiness rows match the current filters."
        />
      </div>
    `
  });
})();
