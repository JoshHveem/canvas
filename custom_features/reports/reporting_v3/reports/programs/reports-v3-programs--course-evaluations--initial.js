(function () {
  Vue.component("reports-v3-programs--course-evaluations--initial", {
    props: {
      programs: {
        type: Array,
        default: function () {
          return [];
        }
      },
      rows: {
        type: Array,
        default: function () {
          return [];
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
      sourceRows() {
        return Array.isArray(this.rows) && this.rows.length ? this.rows : this.programs;
      },

      filteredPrograms() {
        const list = Array.isArray(this.sourceRows) ? this.sourceRows : [];

        return list
          .map((program) => this.normalizeProgramRow(program))
          .filter(Boolean);
      },

      tableColumns() {
        return [
          { key: "programName", label: "Program", width: "16rem" },
          { key: "numSubmissions", label: "Submissions", width: "6rem", format: "integer", align: "right" },
          {
            key: "percRecommendationFeedback",
            label: "% Had Feedback",
            width: "7rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: {
              bad: 0.8,
              warning: 0.5,
              good: 0
            }
          },
          {
            key: "likertCourseObjectivesClear",
            label: "Objectives Clear",
            width: "7rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: this.likertPillBands()
          },
          {
            key: "likertCourseContentRelevant",
            label: "Content Relevant",
            width: "7rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: this.likertPillBands()
          },
          {
            key: "likertAssignmentInstructionsClear",
            label: "Instructions Clear",
            width: "7rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: this.likertPillBands()
          },
          {
            key: "likertWouldRecommendCourse",
            label: "Recommend Course",
            width: "7rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: this.likertPillBands()
          }
        ];
      }
    },
    mounted() {
      this.$emit("filter-controls-change", []);
    },
    methods: {
      likertPillBands() {
        return {
          good: 0.9,
          warning: 0.8,
          bad: 0.7
        };
      },

      ratio(numerator, denominator) {
        const num = Number(numerator);
        const den = Number(denominator);

        if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) {
          return null;
        }

        return num / den;
      },

      normalizeProgramRow(program) {
        if (!program || typeof program !== "object") return null;

        const numSubmissions = program?.course_evaluations_summary__num_submissions ?? program?.num_submissions;
        const numRecommendationFeedback =
          program?.course_evaluations_summary__num_submissions_with_feedback_recommendations ??
          program?.course_evaluations_summary__num_submissions_with_feedback_recom ??
          program?.num_submissions_with_feedback_recommendations;

        return {
          programCode: String(
            program?.program_code ||
            program?.course_evaluations_summary__program_code ||
            ""
          ).trim(),
          programName: String(
            program?.program_name ||
            program?.course_evaluations_summary__program_name ||
            program?.program_code ||
            program?.course_evaluations_summary__program_code ||
            "Program"
          ).trim(),
          academicYear: Number(
            program?.academic_year ||
            program?.course_evaluations_summary__academic_year ||
            0
          ),
          numSubmissions,
          percRecommendationFeedback: this.ratio(numRecommendationFeedback, numSubmissions),
          likertCourseObjectivesClear: program?.course_evaluations_summary__likert_course_objectives_clear ?? program?.likert_course_objectives_clear,
          likertCourseContentRelevant: program?.course_evaluations_summary__likert_course_content_relevant ?? program?.likert_course_content_relevant,
          likertAssignmentInstructionsClear:
            program?.course_evaluations_summary__likert_assignment_instructions_clear ??
            program?.course_evaluations_summary__likert_assignment_instructions_clea ??
            program?.likert_assignment_instructions_clear,
          likertWouldRecommendCourse: program?.course_evaluations_summary__likert_would_recommend_course ?? program?.likert_would_recommend_course
        };
      },

      rowKey(row) {
        return `${row.programCode}-${row.academicYear}`;
      }
    },
    template: `
      <div style="margin-top:18px;">
        <div v-if="loading" class="btech-card btech-theme" style="padding:16px;">
          <div class="btech-muted">Loading course evaluation data...</div>
        </div>

        <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
          <div style="font-weight:600; margin-bottom:4px;">Course Evaluations Error</div>
          <div class="btech-muted">{{ error }}</div>
        </div>

        <div v-else-if="!filteredPrograms.length" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Course Evaluations</div>
          <div class="btech-muted">No course evaluation rows match the current filters.</div>
        </div>

        <reports-v3-table
          v-else
          :rows="filteredPrograms"
          :columns="tableColumns"
          :row-key="rowKey"
          default-sort-key="programName"
          :default-sort-dir="1"
          empty-message="No course evaluation rows match the current filters."
        />
      </div>
    `
  });
})();
