(function () {
  Vue.component("reports-v3-programs-placements", {
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
          { key: "confirmedPlacements", label: "Confirmed Placements", width: "7rem", format: "integer", align: "right" },
          { key: "placementEligible", label: "Placement Eligible", width: "7rem", format: "integer", align: "right" },
          { key: "unplaced", label: "Unplaced", width: "6rem", format: "integer", align: "right" },
          {
            key: "placementRate",
            label: "Placement Rate",
            width: "6rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: {
              good: 0.8,
              warning: 0.7,
              bad: 0.6
            }
          },
          {
            key: "placementBreakdown",
            label: "Placement Breakdown",
            width: "16rem",
            sortable: true,
            sortValue: function (row) {
              return Number(row?.placementEligible || 0);
            },
            component: "reports-v3-segmented-bar",
            componentProps: function (row) {
              const palette = window.bridgetools?.colors || {};

              return {
                segments: row?.placementBreakdown || [],
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

      toRate(value, numerator, denominator) {
        const direct = Number(value);
        if (Number.isFinite(direct)) {
          return Math.max(0, direct);
        }

        const num = Number(numerator);
        const den = Number(denominator);
        if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) {
          return null;
        }

        return Math.max(0, num / den);
      },

      buildPlacementBreakdown(program) {
        const palette = window.bridgetools?.colors || {};
        const confirmedPlacements = this.toWholeNumber(program?.placements__confirmed_placements);
        const placementEligible = this.toWholeNumber(program?.placements__placement_eligible);
        const unplaced = Math.max(0, placementEligible - confirmedPlacements);

        return [
          {
            name: `Confirmed Placements: ${confirmedPlacements}`,
            count: confirmedPlacements,
            color: palette.fadedGreen || palette.yellowGreen || palette.green
          },
          {
            name: `Unplaced: ${unplaced}`,
            count: unplaced,
            color: palette.gray
          }
        ].filter((segment) => segment.count > 0);
      },

      normalizeProgramRow(program) {
        if (!program || typeof program !== "object") return null;

        const confirmedPlacements = program?.placements__confirmed_placements;
        const placementEligible = program?.placements__placement_eligible;

        return {
          programCode: String(
            program?.program_code ||
            program?.placements__program_code ||
            ""
          ).trim(),
          programName: String(
            program?.program_name ||
            program?.placements__program_name ||
            program?.program_code ||
            program?.placements__program_code ||
            "Program"
          ).trim(),
          academicYear: Number(
            program?.academic_year ||
            program?.placements__academic_year ||
            0
          ),
          campusCode: String(
            program?.campus_code ||
            program?.placements__campus_code ||
            ""
          ).trim(),
          confirmedPlacements,
          placementEligible,
          unplaced: Math.max(0, this.toWholeNumber(placementEligible) - this.toWholeNumber(confirmedPlacements)),
          placementRate: this.toRate(
            program?.placements__placement_rate,
            confirmedPlacements,
            placementEligible
          ),
          placementBreakdown: this.buildPlacementBreakdown(program)
        };
      },

      rowKey(row) {
        return `${row.programCode}-${row.academicYear}-${row.campusCode || "na"}`;
      }
    },
    template: `
      <div style="margin-top:18px;">
        <div v-if="loading" class="btech-card btech-theme" style="padding:16px;">
          <div class="btech-muted">Loading placements data...</div>
        </div>

        <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
          <div style="font-weight:600; margin-bottom:4px;">Placements Data Error</div>
          <div class="btech-muted">{{ error }}</div>
        </div>

        <div v-else-if="!filteredPrograms.length" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Program Placements</div>
          <div class="btech-muted">No placement rows match the current filters.</div>
        </div>

        <reports-v3-table
          v-else
          :rows="filteredPrograms"
          :columns="tableColumns"
          :row-key="rowKey"
          default-sort-key="programName"
          :default-sort-dir="1"
          empty-message="No placement rows match the current filters."
        />
      </div>
    `
  });
})();
