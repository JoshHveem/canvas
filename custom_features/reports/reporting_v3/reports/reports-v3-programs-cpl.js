(function () {
  Vue.component("reports-v3-programs-cpl", {
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
          {
            key: "completion",
            label: "Completion",
            width: "8rem",
            format: "percent",
            decimals: 0,
            align: "right",
            pillBands: {
              good: 0.7,
              warning: 0.6,
              bad: 0.5
            }
          },
          {
            key: "placement",
            label: "Placement",
            width: "8rem",
            format: "percent",
            decimals: 0,
            align: "right",
            pillBands: {
              good: 0.8,
              warning: 0.7,
              bad: 0.6
            }
          },
          {
            key: "licensure",
            label: "Licensure",
            width: "8rem",
            format: "percent",
            decimals: 0,
            align: "right",
            pillBands: {
              good: 0.8,
              warning: 0.7,
              bad: 0.6
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
          campusCode: String(program?.campus_code || "").trim(),
          completion: program?.cpl__completion,
          placement: program?.cpl__placement,
          licensure: program?.cpl__licensure
        };
      },

      rowKey(row) {
        return `${row.programCode}-${row.academicYear}-${row.campusCode || "na"}`;
      }
    },
    template: `
      <div style="margin-top:18px;">
        <div v-if="loading" class="btech-card btech-theme" style="padding:16px;">
          <div class="btech-muted">Loading CPL data...</div>
        </div>

        <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
          <div style="font-weight:600; margin-bottom:4px;">CPL Data Error</div>
          <div class="btech-muted">{{ error }}</div>
        </div>

        <div v-else-if="!filteredPrograms.length" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Programs CPL</div>
          <div class="btech-muted">No CPL rows match the current filters.</div>
        </div>

        <reports-v3-table
          v-else
          :rows="filteredPrograms"
          :columns="tableColumns"
          :row-key="rowKey"
          default-sort-key="programName"
          :default-sort-dir="1"
          empty-message="No CPL rows match the current filters."
        />
      </div>
    `
  });
})();
