(function () {
  Vue.component("reports-v3-programs--evaluations--instructor-evaluations", {
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
        const likertBands = this.likertPillBands();

        return [
          { key: "programCode", label: "Program", width: "6rem" },
          { key: "academicYear", label: "Year", width: "4rem", format: "integer", align: "right" },
          { key: "numSubmissions", label: "Submissions", width: "6rem", format: "integer", align: "right" },
          {
            key: "percPositiveFeedback",
            label: "% Had Positive Feedback",
            width: "8rem",
            format: "percent",
            decimals: 1,
            align: "right"
          },
          { key: "likertAvailableSupport", label: "Support", width: "6rem", format: "percent", decimals: 1, align: "right", pillBands: likertBands },
          { key: "likertClearInstruction", label: "Instruction", width: "6rem", format: "percent", decimals: 1, align: "right", pillBands: likertBands },
          { key: "likertCareerPreparation", label: "Career Prep", width: "6rem", format: "percent", decimals: 1, align: "right", pillBands: likertBands },
          { key: "likertRespect", label: "Respect", width: "6rem", format: "percent", decimals: 1, align: "right", pillBands: likertBands },
          { key: "likertRegularProgressReviews", label: "Progress Reviews", width: "7rem", format: "percent", decimals: 1, align: "right", pillBands: likertBands },
          { key: "likertTimelyGrading", label: "Timely Grading", width: "7rem", format: "percent", decimals: 1, align: "right", pillBands: likertBands },
          { key: "likertHelpfulFeedback", label: "Helpful Feedback", width: "7rem", format: "percent", decimals: 1, align: "right", pillBands: likertBands },
          { key: "likertPreparedForClass", label: "Prepared", width: "6rem", format: "percent", decimals: 1, align: "right", pillBands: likertBands }
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

      firstValue(row, field) {
        return row?.[`instructor_evaluations_summary__${field}`] ?? row?.[field];
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

        const numSubmissions = this.firstValue(program, "num_submissions");
        const numPositiveFeedback = this.firstValue(program, "num_has_feedback_positives");

        return {
          programCode: String(this.firstValue(program, "program_code") || program?.program_code || "").trim(),
          academicYear: Number(this.firstValue(program, "academic_year") || program?.academic_year || 0),
          numSubmissions,
          percPositiveFeedback: this.ratio(numPositiveFeedback, numSubmissions),
          likertAvailableSupport: this.firstValue(program, "likert_available_support"),
          likertClearInstruction: this.firstValue(program, "likert_clear_instruction"),
          likertCareerPreparation: this.firstValue(program, "likert_career_preparation"),
          likertRespect: this.firstValue(program, "likert_respect"),
          likertRegularProgressReviews: this.firstValue(program, "likert_regular_progress_reviews"),
          likertTimelyGrading: this.firstValue(program, "likert_timely_grading"),
          likertHelpfulFeedback: this.firstValue(program, "likert_helpful_feedback"),
          likertPreparedForClass: this.firstValue(program, "likert_prepared_for_class")
        };
      },

      rowKey(row) {
        return `${row.programCode}-${row.academicYear}`;
      }
    },
    template: `
      <div style="margin-top:18px;">
        <div v-if="loading" class="btech-card btech-theme" style="padding:16px;">
          <div class="btech-muted">Loading instructor evaluation data...</div>
        </div>

        <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
          <div style="font-weight:600; margin-bottom:4px;">Instructor Evaluations Error</div>
          <div class="btech-muted">{{ error }}</div>
        </div>

        <div v-else-if="!filteredPrograms.length" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Instructor Evaluations</div>
          <div class="btech-muted">No instructor evaluation rows match the current filters.</div>
        </div>

        <reports-v3-table
          v-else
          :rows="filteredPrograms"
          :columns="tableColumns"
          :row-key="rowKey"
          default-sort-key="programCode"
          :default-sort-dir="1"
          empty-message="No instructor evaluation rows match the current filters."
        />
      </div>
    `
  });
})();
