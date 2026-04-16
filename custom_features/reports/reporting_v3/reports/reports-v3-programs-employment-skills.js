(function () {
  Vue.component("reports-v3-programs-employment-skills", {
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

        return list
          .map((program) => this.normalizeProgramRow(program))
          .filter(Boolean);
      },

      tableColumns() {
        return [
          { key: "programName", label: "Program", width: "18rem" },
          { key: "programCode", label: "Code", width: "7rem" },
          { key: "academicYear", label: "Year", width: "6rem", format: "integer", align: "right" },
          { key: "campusCode", label: "Campus", width: "6rem" },
          { key: "numStudents", label: "Students", width: "7rem", format: "integer", align: "right" },
          { key: "totalEvalsSubmitted", label: "Submitted", width: "7rem", format: "integer", align: "right" },
          { key: "totalValidEvals", label: "Valid", width: "6rem", format: "integer", align: "right" },
          { key: "evalsPerStudent", label: "Evals/Student", width: "8rem", format: "number", decimals: 2, align: "right" },
          { key: "evalsPerQuarter", label: "Evals/Qtr", width: "7rem", format: "number", decimals: 2, align: "right" },
          { key: "percSubmittedGraded", label: "% Graded", width: "7rem", format: "percent", decimals: 1, align: "right" }
        ];
      }
    },
    methods: {
      normalizeProgramRow(program) {
        if (!program || typeof program !== "object") return null;

        return {
          programCode: String(program?.program_code || "").trim(),
          programName: String(
            program?.employment_skills_summary__program_name ||
            program?.program_name ||
            program?.program_code ||
            "Program"
          ).trim(),
          academicYear: Number(program?.academic_year || 0),
          campusCode: String(program?.campus_code || "").trim(),
          numStudents: program?.employment_skills_summary__num_students,
          totalEvalsSubmitted: program?.employment_skills_summary__total_evals_submitted,
          totalValidEvals: program?.employment_skills_summary__total_valid_evals,
          evalsPerStudent: program?.employment_skills_summary__evals_per_student,
          evalsPerQuarter: program?.employment_skills_summary__evals_per_quarter,
          percSubmittedGraded: program?.employment_skills_summary__perc_submitted_graded
        };
      },

      rowKey(row) {
        return `${row.programCode}-${row.academicYear}-${row.campusCode || "na"}`;
      }
    },
    template: `
      <div style="margin-top:18px;">
        <div v-if="loading" class="btech-card btech-theme" style="padding:16px;">
          <div class="btech-muted">Loading employment skills data...</div>
        </div>

        <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
          <div style="font-weight:600; margin-bottom:4px;">Employment Skills Error</div>
          <div class="btech-muted">{{ error }}</div>
        </div>

        <div v-else-if="!filteredPrograms.length" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Employment Skills</div>
          <div class="btech-muted">No employment skills rows match the current filters.</div>
        </div>

        <reports-v3-table
          v-else
          :rows="filteredPrograms"
          :columns="tableColumns"
          :row-key="rowKey"
          default-sort-key="programName"
          :default-sort-dir="1"
          empty-message="No employment skills rows match the current filters."
        />
      </div>
    `
  });
})();
