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
      firstFiniteNumber() {
        for (const value of arguments) {
          const num = Number(value);
          if (Number.isFinite(num)) {
            return num;
          }
        }

        return null;
      },

      ratio(numerator, denominator) {
        const num = Number(numerator);
        const den = Number(denominator);

        if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) {
          return null;
        }

        return num / den;
      },

      normalizeAvpRow(avp) {
        if (!avp || typeof avp !== "object") return null;

        const numCourses = this.firstFiniteNumber(
          avp?.canvas_course_readiness__num_courses,
          avp?.num_courses
        );
        const numSyllabiApproved = this.firstFiniteNumber(
          avp?.canvas_course_readiness__num_syllabi_approved,
          avp?.num_syllabi_approved
        );
        const numHasCourseEvaluation = this.firstFiniteNumber(
          avp?.canvas_course_readiness__num_has_course_evaluation,
          avp?.num_has_course_evaluation
        );
        const numCourseEvaluationPublished = this.firstFiniteNumber(
          avp?.canvas_course_readiness__num_course_evaluation_published,
          avp?.num_course_evaluation_published
        );
        const numHasInstructorEvaluation = this.firstFiniteNumber(
          avp?.canvas_course_readiness__num_has_instructor_evaluation,
          avp?.num_has_instructor_evaluation
        );
        const numInstructorEvaluationPublished = this.firstFiniteNumber(
          avp?.canvas_course_readiness__num_instructor_evaluation_published,
          avp?.num_instructor_evaluation_published
        );
        const numHasEmploymentSkillsEvaluation = this.firstFiniteNumber(
          avp?.canvas_course_readiness__num_has_employment_skills_evaluation,
          avp?.num_has_employment_skills_evaluation
        );
        const numEmploymentSkillsEvaluationPublished = this.firstFiniteNumber(
          avp?.canvas_course_readiness__num_employment_skills_evaluation_published,
          avp?.canvas_course_readiness__num_employment_skills_evaluation_publi,
          avp?.num_employment_skills_evaluation_published
        );
        const numHasContent = this.firstFiniteNumber(
          avp?.canvas_course_readiness__num_has_content,
          avp?.num_has_content
        );
        const numContentPublished = this.firstFiniteNumber(
          avp?.canvas_course_readiness__num_content_published,
          avp?.num_content_published
        );

        return {
          name: String(avp?.name || avp?.avp_sis_user_id || "AVP").trim(),
          avpSisUserId: String(avp?.avp_sis_user_id || "").trim(),
          numDepartments: avp?.num_departments,
          academicYear: Number(avp?.canvas_course_readiness__academic_year || avp?.academic_year || 0),
          numCourses,
          percSyllabiApproved: this.ratio(numSyllabiApproved, numCourses),
          percCourseEvaluationPublished: this.ratio(numCourseEvaluationPublished, numHasCourseEvaluation),
          percInstructorEvaluationPublished: this.ratio(numInstructorEvaluationPublished, numHasInstructorEvaluation),
          percEmploymentSkillsEvaluationPublished: this.ratio(
            numEmploymentSkillsEvaluationPublished,
            numHasEmploymentSkillsEvaluation
          ),
          percContentPublished: this.ratio(numContentPublished, numHasContent)
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
