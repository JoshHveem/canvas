(function () {
  Vue.component("reports-v3-programs--course-evaluations--recommendations", {
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
      sourceRows() {
        return Array.isArray(this.rows) && this.rows.length ? this.rows : this.programs;
      },

      filteredPrograms() {
        const list = Array.isArray(this.sourceRows) ? this.sourceRows : [];

        return list
          .map((program) => this.normalizeProgramRow(program))
          .filter(Boolean);
      },

      selectedRecommendationTags() {
        const value = this.selectedFilters?.course_eval_recommendation_tags;
        return Array.isArray(value) ? value : [];
      },

      recommendationTagOptions() {
        const totals = new Map();

        this.filteredPrograms.forEach((program) => {
          Object.entries(program.recommendationTagsObject || {}).forEach(([name, count]) => {
            totals.set(name, (totals.get(name) || 0) + (Number(count) || 0));
          });
        });

        return Array.from(totals.entries())
          .map(([value, count]) => ({ value, label: value, count }))
          .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
      },

      reportFilterControls() {
        return [
          {
            type: "multiselect",
            key: "course_eval_recommendation_tags",
            label: "Recommendation Tags",
            placeholder: "Select tags",
            options: this.recommendationTagOptions,
            value: this.selectedRecommendationTags
          }
        ];
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
            key: "recommendationTagsObject",
            label: "Recommendation Tags",
            format: "tags",
            denominatorKey: "numSubmissions",
            denominatorLabel: "Submissions",
            tagWidth: "8rem",
            decimals: 1,
            tagPillBands: {
              bad: 0.2,
              warning: 0.1,
              good: 0
            },
            selectedTags: this.selectedRecommendationTags,
            showFilter: false
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
      parseTagObject(value) {
        let source = value;

        if (typeof source === "string") {
          const trimmed = source.trim();
          if (!trimmed) return {};

          try {
            source = JSON.parse(trimmed);
          } catch (error) {
            return {};
          }
        }

        if (!source || typeof source !== "object" || Array.isArray(source)) {
          return {};
        }

        return Object.fromEntries(
          Object.entries(source)
            .map(([name, count]) => [String(name || "").trim(), Math.max(0, Math.round(Number(count) || 0))])
            .filter(([name, count]) => name && count > 0)
            .sort((a, b) => {
              if (b[1] !== a[1]) return b[1] - a[1];
              return a[0].localeCompare(b[0], undefined, { numeric: true });
            })
        );
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

        const rawRecommendationTags =
          program?.course_evaluations_summary__recommendation_tag_counts ??
          program?.recommendation_tag_counts;
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
          recommendationTagsObject: this.parseTagObject(rawRecommendationTags)
        };
      },

      rowKey(row) {
        return `${row.programCode}-${row.academicYear}`;
      }
    },
    template: `
      <div style="margin-top:18px;">
        <div v-if="loading" class="btech-card btech-theme" style="padding:16px;">
          <div class="btech-muted">Loading course evaluation recommendations...</div>
        </div>

        <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
          <div style="font-weight:600; margin-bottom:4px;">Course Evaluation Recommendations Error</div>
          <div class="btech-muted">{{ error }}</div>
        </div>

        <div v-else-if="!filteredPrograms.length" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Course Evaluation Recommendations</div>
          <div class="btech-muted">No course evaluation recommendation rows match the current filters.</div>
        </div>

        <reports-v3-table
          v-else
          :rows="filteredPrograms"
          :columns="tableColumns"
          :row-key="rowKey"
          default-sort-key="programName"
          :default-sort-dir="1"
          empty-message="No course evaluation recommendation rows match the current filters."
        />
      </div>
    `
  });
})();
