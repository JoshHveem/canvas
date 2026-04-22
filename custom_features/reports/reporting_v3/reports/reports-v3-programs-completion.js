(function () {
  Vue.component("reports-v3-programs-completion", {
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
            key: "completionBreakdown",
            label: "Completion Breakdown",
            width: "16rem",
            sortable: true,
            sortValue: function (row) {
              return Number(row?.projectedExiters || 0);
            },
            component: "reports-v3-segmented-bar",
            componentProps: function (row) {
              const palette = window.bridgetools?.colors || {};

              return {
                segments: row?.completionBreakdown || [],
                height: 16,
                borderRadius: 999,
                separatorColor: palette.white || "white",
                emptyColor: palette.gray || "transparent"
              };
            },
            cellStyle: {
              whiteSpace: "normal"
            }
          },
          { key: "completers", label: "Completers", width: "6rem", format: "integer", align: "right" },
          { key: "exiters", label: "Exiters", width: "6rem", format: "integer", align: "right" },
          { key: "activeStudents", label: "Active", width: "6rem", format: "integer", align: "right" },
          { key: "totalStudents", label: "Total", width: "6rem", format: "integer", align: "right" },
          {
            key: "completionRate",
            label: "Completion Rate",
            width: "8rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: {
              good: 0.7,
              warning: 0.6,
              bad: 0.5
            }
          },
          { key: "projectedCompleters", label: "Projected Completers", width: "9rem", format: "integer", align: "right" },
          {
            key: "projectedCompletionRate",
            label: "Projected Rate",
            width: "8rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: {
              good: 0.7,
              warning: 0.6,
              bad: 0.5
            }
          }
        ];
      }
    },
    methods: {
      toWholeNumber(value) {
        const num = Number(value);
        if (!Number.isFinite(num)) return 0;
        return Math.max(0, Math.round(num));
      },

      buildCompletionBreakdown(program) {
        const palette = window.bridgetools?.colors || {};
        const completers = this.toWholeNumber(program?.completions_projected__completers);
        const projectedCompleters = this.toWholeNumber(program?.completions_projected__projected_completers);
        const exiters = this.toWholeNumber(program?.completions_projected__exiters);
        const projectedExiters = this.toWholeNumber(program?.completions_projected__projected_exiters);

        const projectedCompleterGain = Math.max(0, projectedCompleters - completers);
        const nonCompleters = Math.max(0, exiters - completers);
        const projectedNonCompleters = Math.max(
          0,
          (projectedExiters - projectedCompleters) - nonCompleters
        );

        return [
          {
            name: `Completers: ${completers}`,
            count: completers,
            color: palette.yellowGreen || palette.green
          },
          {
            name: `Projected Completers: ${projectedCompleterGain}`,
            count: projectedCompleterGain,
            color: palette.green
          },
          {
            name: `Non Completers: ${nonCompleters}`,
            count: nonCompleters,
            color: palette.gray
          },
          {
            name: `Projected Non Completers: ${projectedNonCompleters}`,
            count: projectedNonCompleters,
            color: palette.darkGray
          }
        ].filter((segment) => segment.count > 0);
      },

      normalizeProgramRow(program) {
        if (!program || typeof program !== "object") return null;

        return {
          programCode: String(
            program?.program_code ||
            program?.completions_projected__program_code ||
            ""
          ).trim(),
          programName: String(
            program?.program_name ||
            program?.completions_projected__program_name ||
            program?.program_code ||
            program?.completions_projected__program_code ||
            "Program"
          ).trim(),
          academicYear: Number(
            program?.academic_year ||
            program?.completions_projected__academic_year ||
            0
          ),
          campusCode: String(
            program?.campus_code ||
            program?.completions_projected__campus_code ||
            ""
          ).trim(),
          completers: program?.completions_projected__completers,
          exiters: program?.completions_projected__exiters,
          activeStudents: program?.completions_projected__active_students,
          totalStudents: program?.completions_projected__total_students,
          completionRate: program?.completions_projected__completion_rate,
          projectedCompleters: program?.completions_projected__projected_completers,
          projectedExiters: program?.completions_projected__projected_exiters,
          projectedCompletionRate: program?.completions_projected__projected_completion_rate,
          completionBreakdown: this.buildCompletionBreakdown(program)
        };
      },

      rowKey(row) {
        return `${row.programCode}-${row.academicYear}-${row.campusCode || "na"}`;
      }
    },
    template: `
      <div style="margin-top:18px;">
        <div v-if="loading" class="btech-card btech-theme" style="padding:16px;">
          <div class="btech-muted">Loading completion data...</div>
        </div>

        <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
          <div style="font-weight:600; margin-bottom:4px;">Completion Data Error</div>
          <div class="btech-muted">{{ error }}</div>
        </div>

        <div v-else-if="!filteredPrograms.length" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Program Completions</div>
          <div class="btech-muted">No completion rows match the current filters.</div>
        </div>

        <reports-v3-table
          v-else
          :rows="filteredPrograms"
          :columns="tableColumns"
          :row-key="rowKey"
          default-sort-key="programName"
          :default-sort-dir="1"
          empty-message="No completion rows match the current filters."
        />
      </div>
    `
  });
})();
