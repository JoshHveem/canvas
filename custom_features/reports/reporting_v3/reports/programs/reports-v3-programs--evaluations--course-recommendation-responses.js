(function () {
  Vue.component("reports-v3-programs--evaluations--course-recommendation-responses", {
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

      selectedTags() {
        const value = this.selectedFilters?.course_recommendation_response_tags;
        return Array.isArray(value) ? value : [];
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

      tagOptions() {
        return this.tagRows
          .map((row) => row.tagName)
          .filter(Boolean)
          .filter((value, index, array) => array.indexOf(value) === index)
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
          .map((value) => ({ value, label: value }));
      },

      reportFilterControls() {
        return [
          {
            type: "multiselect",
            key: "course_recommendation_response_tags",
            label: "Tags",
            placeholder: "Select tags",
            options: this.tagOptions,
            value: this.selectedTags
          }
        ];
      },

      filteredResponses() {
        const allowedTags = new Set(this.selectedTags);
        const seen = new Set();
        const results = [];

        this.tagRows.forEach((row) => {
          if (allowedTags.size && !allowedTags.has(row.tagName)) {
            return;
          }

          row.freeResponses.forEach((response) => {
            const normalized = String(response || "").trim();
            if (!normalized) return;

            const dedupeKey = normalized.toLocaleLowerCase();
            if (seen.has(dedupeKey)) return;

            seen.add(dedupeKey);
            results.push({
              id: `${row.programCode}-${row.academicYear}-${results.length + 1}`,
              freeResponse: normalized
            });
          });
        });

        return results;
      },

      tableColumns() {
        return [
          {
            key: "freeResponse",
            label: "Free Response",
            width: "64rem",
            sortable: false,
            cellStyle: {
              whiteSpace: "normal",
              lineHeight: 1.45
            }
          }
        ];
      }
    },
    watch: {
      reportFilterControls: {
        immediate: true,
        deep: true,
        handler(controls) {
          this.$emit("filter-controls-change", controls);
        }
      }
    },
    methods: {
      firstValue(row, field) {
        const keys = [
          field,
          `programs__course_eval_rec_tags__${field}`,
          `ai_summary__${field}`,
          `programs__course_eval_rec_tags__x_ai_summary__${field}`
        ];

        for (const key of keys) {
          if (row?.[key] != null) return row[key];
        }

        return undefined;
      },

      parsePostgresTextArray(value) {
        if (Array.isArray(value)) {
          return value.map((item) => String(item || "").trim()).filter(Boolean);
        }

        const source = String(value || "").trim();
        if (!source || source === "{}") return [];
        if (!source.startsWith("{") || !source.endsWith("}")) {
          return [source].filter(Boolean);
        }

        const inner = source.slice(1, -1);
        const items = [];
        let current = "";
        let inQuotes = false;

        for (let index = 0; index < inner.length; index += 1) {
          const char = inner[index];
          const next = inner[index + 1];

          if (inQuotes) {
            if (char === '"' && next === '"') {
              current += '"';
              index += 1;
              continue;
            }

            if (char === '"') {
              inQuotes = false;
              continue;
            }

            current += char;
            continue;
          }

          if (char === '"') {
            inQuotes = true;
            continue;
          }

          if (char === ",") {
            const trimmed = current.trim();
            if (trimmed) items.push(trimmed);
            current = "";
            continue;
          }

          current += char;
        }

        const trimmed = current.trim();
        if (trimmed) items.push(trimmed);

        return items.map((item) => String(item || "").trim()).filter(Boolean);
      },

      normalizeTagRow(row) {
        if (!row || typeof row !== "object") return null;

        const tagName = String(this.firstValue(row, "tag_name") || "").trim();
        if (!tagName) return null;

        return {
          programCode: String(this.firstValue(row, "program_code") || "").trim(),
          academicYear: Number(this.firstValue(row, "academic_year") || 0),
          tagName,
          freeResponses: this.parsePostgresTextArray(this.firstValue(row, "free_response__list"))
        };
      },

      rowKey(row) {
        return row.id;
      }
    },
    template: `
      <div style="margin-top:18px;">
        <div v-if="!selectedProgramCode" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Course Recommendation Responses</div>
          <div class="btech-muted">Select a program in Filters to view course recommendation responses.</div>
        </div>

        <div v-else-if="loading" class="btech-card btech-theme" style="padding:16px;">
          <div class="btech-muted">Loading course recommendation responses...</div>
        </div>

        <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
          <div style="font-weight:600; margin-bottom:4px;">Course Recommendation Responses Error</div>
          <div class="btech-muted">{{ error }}</div>
        </div>

        <div v-else-if="!filteredResponses.length" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Course Recommendation Responses</div>
          <div class="btech-muted">No free responses match the current filters.</div>
        </div>

        <reports-v3-table
          v-else
          :rows="filteredResponses"
          :columns="tableColumns"
          :row-key="rowKey"
          default-sort-key=""
          :sticky-columns="[]"
          empty-message="No free responses match the current filters."
        />
      </div>
    `
  });
})();
