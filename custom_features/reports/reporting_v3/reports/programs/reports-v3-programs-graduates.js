(function () {
  Vue.component("reports-v3-programs-graduates", {
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
          { key: "programName", label: "Program", width: "16rem" },
          { key: "programCode", label: "Code", width: "4rem" },
          { key: "academicYear", label: "Year", width: "4rem", format: "integer", align: "right" },
          { key: "campusCode", label: "Campus", width: "4rem" },
          { key: "graduates", label: "Graduates", width: "6rem", format: "integer", align: "right" },
          { key: "projectedGraduates", label: "Projected Graduates", width: "6rem", format: "integer", align: "right" },
          {
            key: "graduationRate",
            label: "Graduation Rate",
            width: "6rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: {
              good: 0.7,
              warning: 0.6,
              bad: 0.5
            }
          },
          {
            key: "projectedGraduationRate",
            label: "Projected Rate",
            width: "6rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: {
              good: 0.7,
              warning: 0.6,
              bad: 0.5
            }
          },
          {
            key: "graduationBreakdown",
            label: "Graduation Breakdown",
            width: "16rem",
            sortable: true,
            sortValue: function (row) {
              return Number(row?.projectedExiters || 0);
            },
            component: "reports-v3-segmented-bar",
            componentProps: function (row) {
              const palette = window.bridgetools?.colors || {};

              return {
                segments: row?.graduationBreakdown || [],
                height: 16,
                borderRadius: 999,
                separatorColor: palette.white || "white",
                emptyColor: palette.gray || "transparent"
              };
            },
            cellStyle: {
              whiteSpace: "normal"
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

      buildGraduationBreakdown(program) {
        const palette = window.bridgetools?.colors || {};
        const graduates = this.toWholeNumber(program?.graduates_projected__num_students__graduate);
        const projectedGraduates = this.toWholeNumber(program?.graduates_projected__num_students__graduate__projected);
        const exiters = this.toWholeNumber(program?.graduates_projected__num_students__exiter);
        const projectedExiters = this.toWholeNumber(program?.graduates_projected__num_students__exiter__projected);

        const projectedGraduateGain = Math.max(0, projectedGraduates - graduates);
        const nonGraduates = Math.max(0, exiters - graduates);
        const projectedNonGraduates = Math.max(
          0,
          (projectedExiters - projectedGraduates) - nonGraduates
        );

        return [
          {
            name: `Graduates: ${graduates}`,
            count: graduates,
            color: palette.fadedGreen || palette.yellowGreen || palette.green
          },
          {
            name: `Projected Graduates: ${projectedGraduateGain}`,
            count: projectedGraduateGain,
            color: palette.green
          },
          {
            name: `Non Graduates: ${nonGraduates}`,
            count: nonGraduates,
            color: palette.gray
          },
          {
            name: `Projected Non Graduates: ${projectedNonGraduates}`,
            count: projectedNonGraduates,
            color: palette.darkGray
          }
        ].filter((segment) => segment.count > 0);
      },

      normalizeProgramRow(program) {
        if (!program || typeof program !== "object") return null;

        return {
          programCode: String(
            program?.program_code ||
            program?.graduates_projected__program_code ||
            ""
          ).trim(),
          programName: String(
            program?.program_name ||
            program?.graduates_projected__program_name ||
            program?.program_code ||
            program?.graduates_projected__program_code ||
            "Program"
          ).trim(),
          academicYear: Number(
            program?.academic_year ||
            program?.graduates_projected__academic_year ||
            0
          ),
          campusCode: String(
            program?.campus_code ||
            program?.graduates_projected__campus_code ||
            ""
          ).trim(),
          graduates: program?.graduates_projected__num_students__graduate,
          exiters: program?.graduates_projected__num_students__exiter,
          activeStudents: program?.graduates_projected__num_students__active,
          totalStudents: program?.graduates_projected__num_students,
          graduationRate: program?.graduates_projected__perc_students__graduate,
          projectedGraduates: program?.graduates_projected__num_students__graduate__projected,
          projectedExiters: program?.graduates_projected__num_students__exiter__projected,
          projectedGraduationRate: program?.graduates_projected__perc_students__graduate__projected,
          graduationBreakdown: this.buildGraduationBreakdown(program)
        };
      },

      rowKey(row) {
        return `${row.programCode}-${row.academicYear}-${row.campusCode || "na"}`;
      }
    },
    template: `
      <div style="margin-top:18px;">
        <div v-if="loading" class="btech-card btech-theme" style="padding:16px;">
          <div class="btech-muted">Loading graduates data...</div>
        </div>

        <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
          <div style="font-weight:600; margin-bottom:4px;">Graduates Data Error</div>
          <div class="btech-muted">{{ error }}</div>
        </div>

        <div v-else-if="!filteredPrograms.length" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Program Graduates</div>
          <div class="btech-muted">No graduate rows match the current filters.</div>
        </div>

        <reports-v3-table
          v-else
          :rows="filteredPrograms"
          :columns="tableColumns"
          :row-key="rowKey"
          default-sort-key="programName"
          :default-sort-dir="1"
          empty-message="No graduate rows match the current filters."
        />
      </div>
    `
  });
})();
