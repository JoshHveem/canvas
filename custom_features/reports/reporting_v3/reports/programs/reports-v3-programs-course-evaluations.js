(function () {
  Vue.component("reports-v3-programs-course-evaluations", {
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
      },
      view: {
        type: Object,
        default: function () {
          return {};
        }
      }
    },
    computed: {
      filteredPrograms() {
        const list = Array.isArray(this.programs) ? this.programs : [];
        console.log(list);

        return list
          .map((program) => this.normalizeProgramRow(program))
          .filter(Boolean);
      },

      isRecommendationsView() {
        return String(this.view?.value || "") === "recommendations";
      },

      tableColumns() {
        const baseColumns = [
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
              good: 0.75,
              warning: 0.5,
              bad: 0.25
            }
          }
        ];

        if (this.isRecommendationsView) {
          return [
            ...baseColumns,
            {
              key: "recommendationTagsObject",
              label: "Recommendation Tags",
              width: "26rem",
              formatter: (value) => this.formatTagObject(value),
              sortValue: (row) => row.recommendationTagTotal,
              cellStyle: {
                whiteSpace: "normal",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "12px"
              }
            }
          ];
        }

        return [
          ...baseColumns,
          {
            key: "likertCourseObjectivesClear",
            label: "Objectives Clear",
            width: "7rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: this.likertPillBands()
          },
          {
            key: "likertCourseContentRelevant",
            label: "Content Relevant",
            width: "7rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: this.likertPillBands()
          },
          {
            key: "likertAssignmentInstructionsClear",
            label: "Instructions Clear",
            width: "7rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: this.likertPillBands()
          },
          {
            key: "likertWouldRecommendCourse",
            label: "Recommend Course",
            width: "7rem",
            format: "percent",
            decimals: 1,
            align: "right",
            pillBands: this.likertPillBands()
          }
        ];
      }
    },
    methods: {
      likertPillBands() {
        return {
          good: 0.9,
          warning: 0.8,
          bad: 0.7
        };
      },

      parseTagCounts(value) {
        let source = value;

        if (typeof source === "string") {
          const trimmed = source.trim();
          if (!trimmed) return [];

          try {
            source = JSON.parse(trimmed);
          } catch (error) {
            return [];
          }
        }

        if (!source || typeof source !== "object" || Array.isArray(source)) {
          return [];
        }

        return Object.entries(source)
          .map(([name, count]) => ({
            name: String(name || "").trim(),
            count: Math.max(0, Math.round(Number(count) || 0))
          }))
          .filter((tag) => tag.name && tag.count > 0)
          .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.name.localeCompare(b.name, undefined, { numeric: true });
          });
      },

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

      formatTagSummary(tags) {
        const list = Array.isArray(tags) ? tags : [];
        if (!list.length) return "-";

        const topTags = list.slice(0, 4).map((tag) => `${tag.name}: ${tag.count}`);
        const remainingCount = list.length - topTags.length;

        if (remainingCount > 0) {
          topTags.push(`+${remainingCount} more`);
        }

        return topTags.join(", ");
      },

      formatTagObject(tagsObject) {
        if (!tagsObject || typeof tagsObject !== "object" || Array.isArray(tagsObject)) return "-";
        if (!Object.keys(tagsObject).length) return "-";

        return JSON.stringify(tagsObject);
      },

      tagTotal(tags) {
        return (Array.isArray(tags) ? tags : []).reduce((sum, tag) => sum + (Number(tag?.count) || 0), 0);
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
        const positiveTags = this.parseTagCounts(
          program?.course_evaluations_summary__positive_tag_counts ??
          program?.positive_tag_counts
        );
        const recommendationTags = this.parseTagCounts(rawRecommendationTags);
        const recommendationTagsObject = this.parseTagObject(rawRecommendationTags);
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
          likertCourseObjectivesClear: program?.course_evaluations_summary__likert_course_objectives_clear ?? program?.likert_course_objectives_clear,
          likertCourseContentRelevant: program?.course_evaluations_summary__likert_course_content_relevant ?? program?.likert_course_content_relevant,
          likertAssignmentInstructionsClear:
            program?.course_evaluations_summary__likert_assignment_instructions_clear ??
            program?.course_evaluations_summary__likert_assignment_instructions_clea ??
            program?.likert_assignment_instructions_clear,
          likertWouldRecommendCourse: program?.course_evaluations_summary__likert_would_recommend_course ?? program?.likert_would_recommend_course,
          positiveTags,
          recommendationTags,
          recommendationTagsObject,
          positiveTagTotal: this.tagTotal(positiveTags),
          recommendationTagTotal: this.tagTotal(recommendationTags)
        };
      },

      rowKey(row) {
        return `${row.programCode}-${row.academicYear}`;
      }
    },
    template: `
      <div style="margin-top:18px;">
        <div v-if="loading" class="btech-card btech-theme" style="padding:16px;">
          <div class="btech-muted">Loading course evaluation data...</div>
        </div>

        <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
          <div style="font-weight:600; margin-bottom:4px;">Course Evaluations Error</div>
          <div class="btech-muted">{{ error }}</div>
        </div>

        <div v-else-if="!filteredPrograms.length" class="btech-card btech-theme" style="padding:16px;">
          <div style="font-weight:600; margin-bottom:4px;">Course Evaluations</div>
          <div class="btech-muted">No course evaluation rows match the current filters.</div>
        </div>

        <reports-v3-table
          v-else
          :rows="filteredPrograms"
          :columns="tableColumns"
          :row-key="rowKey"
          default-sort-key="programName"
          :default-sort-dir="1"
          empty-message="No course evaluation rows match the current filters."
        />
      </div>
    `
  });
})();
