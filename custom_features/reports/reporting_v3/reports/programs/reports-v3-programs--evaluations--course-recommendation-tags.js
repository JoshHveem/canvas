(function () {
  Vue.component("reports-v3-programs--evaluations--course-recommendation-tags", {
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
      selectedProgramCode() {
        return String(this.selectedFilters?.programs || "").trim();
      },

      sourceRows() {
        return Array.isArray(this.rows) && this.rows.length ? this.rows : this.programs;
      },

      tagRows() {
        if (!this.selectedProgramCode) return [];

        const list = Array.isArray(this.sourceRows) ? this.sourceRows : [];
        return list
          .map((row) => this.normalizeTagRow(row))
          .filter(Boolean);
      },

      tableColumns() {
        return [
          {
            key: "tagName",
            label: "Tag",
            width: "16rem",
            cellStyle: {
              whiteSpace: "normal"
            }
          },
          { key: "numSubmissions", label: "Responses", width: "6rem", format: "integer", align: "right" },
          {
            key: "freeResponseSummary",
            label: "AI Summary",
            width: "42rem",
            placeholder: "No summary",
            sortable: false,
            cellStyle: {
              whiteSpace: "normal",
              lineHeight: 1.45
            }
          }
        ];
      }
    },
    mounted() {
      this.$emit("filter-controls-change", []);
    },
    methods: {
      firstValue(row, field) {
        const keys = [
          field,
          `programs__course_eval_rec_tags__${field}`,
          `x_ai_summary__${field}`,
          `programs__course_eval_rec_tags__x_ai_summary__${field}`
        ];

        for (const key of keys) {
          if (row?.[key] != null) return row[key];
        }

        return undefined;
      },

      normalizeTagRow(row) {
        if (!row || typeof row !== "object") return null;

        const tagName = String(this.firstValue(row, "tag_name") || "").trim();
        if (!tagName) return null;

        return {
          programCode: String(this.firstValue(row, "program_code") || "").trim(),
          academicYear: Number(this.firstValue(row, "academic_year") || 0),
          tagName,
          numSubmissions: this.firstValue(row, "num_submissions"),
          freeResponseSummary: String(this.firstValue(row, "free_response_summary") || "").trim()
        };
      },

      rowKey(row) {
        return `${row.programCode}-${row.academicYear}-${row.tagName}`;
      }
    },
    template: `
      <div style="margin-top:18px;">
        <div v-if="!selectedProgramCode" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Course Recommendation Tags</div>
          <div class="btech-muted">Select a program in Filters to view its course recommendation tags.</div>
        </div>

        <div v-else-if="loading" class="btech-card btech-theme" style="padding:16px;">
          <div class="btech-muted">Loading course recommendation tags...</div>
        </div>

        <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
          <div style="font-weight:600; margin-bottom:4px;">Course Recommendation Tags Error</div>
          <div class="btech-muted">{{ error }}</div>
        </div>

        <div v-else-if="!tagRows.length" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Course Recommendation Tags</div>
          <div class="btech-muted">No course recommendation tags match the current filters.</div>
        </div>

        <reports-v3-table
          v-else
          :rows="tagRows"
          :columns="tableColumns"
          :row-key="rowKey"
          default-sort-key="numSubmissions"
          :default-sort-dir="-1"
          empty-message="No course recommendation tags match the current filters."
        />
      </div>
    `
  });
})();
