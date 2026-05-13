(function () {
  Vue.component("reports-v3-programs-canvas-course-readiness", {
    props: {
      programs: {
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
      filteredPrograms() {
        const list = Array.isArray(this.programs) ? this.programs : [];
        console.log(list);

        return list
          .map((program) => this.normalizeProgramRow(program))
          .filter(Boolean);
      },

      tableColumns() {
        return [
          { key: "programName", label: "Program", width: "12rem" },
          { key: "programCode", label: "Code", width: "4rem" },
          { key: "academicYear", label: "Year", width: "4rem", format: "integer", align: "right" },
          { key: "numCourses", label: "Courses", width: "4rem", format: "integer", align: "right" },
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
      normalizeProgramRow(program) {
        if (!program || typeof program !== "object") return null;

        return {
          programCode: String(program?.program_code || "").trim(),
          programName: String(program?.program_name || program?.program_code || "Program").trim(),
          academicYear: Number(program?.academic_year || 0),
          numCourses: program?.canvas_course_readiness__num_courses ?? program?.num_courses,
          percSyllabiApproved: program?.canvas_course_readiness__perc_syllabi_approved ?? program?.perc_syllabi_approved,
          percCourseEvaluationPublished: program?.canvas_course_readiness__perc_course_evaluation_published ?? program?.perc_course_evaluation_published,
          percInstructorEvaluationPublished: program?.canvas_course_readiness__perc_instructor_evaluation_published ?? program?.perc_instructor_evaluation_published,
          percEmploymentSkillsEvaluationPublished: program?.canvas_course_readiness__perc_employment_skills_evaluation_published ?? program?.perc_employment_skills_evaluation_published,
          percContentPublished: program?.canvas_course_readiness__perc_content_published ?? program?.perc_content_published
        };
      },

      rowKey(row) {
        return `${row.programCode}-${row.academicYear}`;
      }
    },
    template: `
      <div style="margin-top:18px;">
        <div v-if="loading" class="btech-card btech-theme" style="padding:16px;">
          <div class="btech-muted">Loading course readiness data...</div>
        </div>

        <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
          <div style="font-weight:600; margin-bottom:4px;">Course Readiness Error</div>
          <div class="btech-muted">{{ error }}</div>
        </div>

        <div v-else-if="!filteredPrograms.length" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Course Readiness</div>
          <div class="btech-muted">No course readiness rows match the current filters.</div>
        </div>

        <reports-v3-table
          v-else
          :rows="filteredPrograms"
          :columns="tableColumns"
          :row-key="rowKey"
          default-sort-key="programName"
          :default-sort-dir="1"
          empty-message="No course readiness rows match the current filters."
        />
      </div>
    `
  });
})();
