
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

        return list
          .map((program) => this.normalizeProgramRow(program))
          .filter(Boolean);
      },

      tableColumns() {
        return [
          { key: "programName", label: "Program", width: "18rem" },
          { key: "programCode", label: "Code", width: "4rem" },
          { key: "academicYear", label: "Year", width: "4rem", format: "integer", align: "right" },
          { key: "campusCode", label: "Campus", width: "4rem" },
          { key: "numCourses", label: "Courses", width: "5rem", format: "integer", align: "right" },
          { key: "percSubmitted", label: "% Submitted", width: "7rem", format: "percent", decimals: 1, align: "right",
            pillBands: {
              good: 1.0,
              warning: 0.9,
              bad: 0.75
            }
          },
          { key: "percApproved", label: "% Approved", width: "7rem", format: "percent", decimals: 1, align: "right",
            pillBands: {
              good: 1.0,
              warning: 0.9,
              bad: 0.75
            }
          },
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
          campusCode: String(program?.campus_code || "").trim(),
          numCourses: program?.syllabi__num_courses,
          percSubmitted: program?.syllabi__perc_is_submitted,
          percApproved: program?.syllabi__perc_is_approved
        };
      },

      rowKey(row) {
        return `${row.programCode}-${row.academicYear}-${row.campusCode || "na"}`;
      }
    },
    template: `
      <div style="margin-top:18px;">
        <div v-if="loading" class="btech-card btech-theme" style="padding:16px;">
          <div class="btech-muted">Loading syllabi data...</div>
        </div>

        <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
          <div style="font-weight:600; margin-bottom:4px;">Syllabi Error</div>
          <div class="btech-muted">{{ error }}</div>
        </div>

        <div v-else-if="!filteredPrograms.length" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Syllabi</div>
          <div class="btech-muted">No syllabi rows match the current filters.</div>
        </div>

        <reports-v3-table
          v-else
          :rows="filteredPrograms"
          :columns="tableColumns"
          :row-key="rowKey"
          default-sort-key="programName"
          :default-sort-dir="1"
          empty-message="No syllabi rows match the current filters."
        />
      </div>
    `
  });
})();
