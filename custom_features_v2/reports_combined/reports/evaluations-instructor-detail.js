Vue.component('reports-evaluations-instructor-detail', {
  mixins: [
    window.ReportMixins.anonymization,
    window.ReportMixins.requests,
    window.ReportMixins.formatting,
    window.ReportMixins.labels,
    window.ReportMixins.filters,
    window.ReportMixins.tables,
    window.ReportMixins.evaluationDetail({
      dataset: 'instructor_evaluations',
      optionsDataset: 'course_instructor_evaluations',
      titleSuffix: 'Instructor Eval Detail',
      logLabel: 'instructor evaluation detail',
      loadErrorMessage: 'Unable to load instructor evaluation details.'
    })
  ],

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Course', 'Course code and name.', '20rem', false, 'string',
        row => this.anonymous ? 'COURSE' : this.escapeHtml(this.courseLabel(row)),
        null,
        row => this.courseLabel(row).toLowerCase()
      ),
      new window.ReportColumn(
        'Instructor', 'Instructor name.', '12rem', false, 'string',
        row => this.anonymous ? 'INSTRUCTOR' : this.escapeHtml(String(row?.full_name__instructor ?? '')),
        null,
        row => String(row?.full_name__instructor ?? '').toLowerCase()
      ),
      new window.ReportColumn(
        'Support', 'Available support score.', '6rem', false, 'number',
        row => this.numText(row?.likert_available_support, 0),
        row => this.responseLikertPillStyle(row?.likert_available_support),
        row => Number(row?.likert_available_support ?? -1)
      ),
      new window.ReportColumn(
        'Instruction', 'Clear instruction score.', '6rem', false, 'number',
        row => this.numText(row?.likert_clear_instruction, 0),
        row => this.responseLikertPillStyle(row?.likert_clear_instruction),
        row => Number(row?.likert_clear_instruction ?? -1)
      ),
      new window.ReportColumn(
        'Career Prep', 'Career preparation score.', '6rem', false, 'number',
        row => this.numText(row?.likert_career_preparation, 0),
        row => this.responseLikertPillStyle(row?.likert_career_preparation),
        row => Number(row?.likert_career_preparation ?? -1)
      ),
      new window.ReportColumn(
        'Respect', 'Respect score.', '6rem', false, 'number',
        row => this.numText(row?.likert_respect, 0),
        row => this.responseLikertPillStyle(row?.likert_respect),
        row => Number(row?.likert_respect ?? -1)
      ),
      new window.ReportColumn(
        'Progress', 'Progress review score.', '6rem', false, 'number',
        row => this.numText(row?.likert_regular_progress_reviews, 0),
        row => this.responseLikertPillStyle(row?.likert_regular_progress_reviews),
        row => Number(row?.likert_regular_progress_reviews ?? -1)
      ),
      new window.ReportColumn(
        'Grading', 'Timely grading score.', '6rem', false, 'number',
        row => this.numText(row?.likert_timely_grading, 0),
        row => this.responseLikertPillStyle(row?.likert_timely_grading),
        row => Number(row?.likert_timely_grading ?? -1)
      ),
      new window.ReportColumn(
        'Feedback', 'Helpful feedback score.', '6rem', false, 'number',
        row => this.numText(row?.likert_helpful_feedback, 0),
        row => this.responseLikertPillStyle(row?.likert_helpful_feedback),
        row => Number(row?.likert_helpful_feedback ?? -1)
      ),
      new window.ReportColumn(
        'Prepared', 'Prepared for class score.', '6rem', false, 'number',
        row => this.numText(row?.likert_prepared_for_class, 0),
        row => this.responseLikertPillStyle(row?.likert_prepared_for_class),
        row => Number(row?.likert_prepared_for_class ?? -1)
      ),
      this.withColumnWrap(new window.ReportColumn(
        'Positives', 'Positive free response.', '24rem', false, 'string',
        row => this.textOrDash(row?.free_response_positives),
        null,
        row => String(row?.free_response_positives ?? '')
      )),
      this.withColumnWrap(new window.ReportColumn(
        'Recommendations', 'Recommendation free response.', '24rem', false, 'string',
        row => this.textOrDash(row?.free_response_recommendations),
        null,
        row => String(row?.free_response_recommendations ?? '')
      ))
    ]);
  },

  methods: {
    mapRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        ...row,
        course_code: String(row?.course_code ?? '').trim(),
        course_name: String(row?.course_name ?? '').trim(),
        full_name__instructor: String(row?.full_name__instructor ?? '').trim(),
        evaluation_submission_id: String(row?.evaluation_submission_id ?? '').trim(),
        likert_available_support: Number(row?.likert_available_support),
        likert_clear_instruction: Number(row?.likert_clear_instruction),
        likert_career_preparation: Number(row?.likert_career_preparation),
        likert_respect: Number(row?.likert_respect),
        likert_regular_progress_reviews: Number(row?.likert_regular_progress_reviews),
        likert_timely_grading: Number(row?.likert_timely_grading),
        likert_helpful_feedback: Number(row?.likert_helpful_feedback),
        likert_prepared_for_class: Number(row?.likert_prepared_for_class),
        free_response_positives: String(row?.free_response_positives ?? '').trim(),
        free_response_recommendations: String(row?.free_response_recommendations ?? '').trim(),
        free_response_positives__tags: row?.free_response_positives__tags,
        free_response_recommendations__tags: row?.free_response_recommendations__tags
      }));
    }
  },

  template: `
  <report-table-shell
    :title-html="titleText"
    :table="table"
    :rows="visibleRows"
    :loading="loading || loadingOptions"
    :load-error="loadError"
    loading-text="Loading instructor evaluation details..."
    :row-key-fn="(row, index) => row.evaluation_submission_id || index"
  >
    <template #filters>
      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Year</label>
        <select v-model.number="year" v-bind="filterAttrs('academic_year')" style="font-size:.75rem; min-width:90px;">
          <option
            v-for="optionYear in Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)"
            :key="optionYear"
            :value="optionYear"
          >{{ optionYear }}</option>
        </select>
      </div>

      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Program</label>
        <select v-model="selectedProgramCode" v-bind="filterAttrs('program_code')" style="font-size:.75rem; min-width:220px; max-width:320px;">
          <option
            v-for="option in programOptions"
            :key="option.value"
            :value="option.value"
          >{{ displayFilterOption(option, 'program_name', 'Program') }}</option>
        </select>
      </div>

      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Course</label>
        <select v-model="selectedCourseCode" v-bind="filterAttrs('course_code')" style="font-size:.75rem; min-width:260px; max-width:360px;">
          <option
            v-for="option in courseOptions"
            :key="option.value"
            :value="option.value"
          >{{ displayFilterOption(option, 'course_name', 'Course') }}</option>
        </select>
      </div>

      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Positive Tag</label>
        <select v-model="selectedPositiveTag" v-bind="filterAttrs('positive_tag')" style="font-size:.75rem; min-width:180px; max-width:260px;">
          <option value="">All</option>
          <option
            v-for="tag in positiveTagOptions"
            :key="tag"
            :value="tag"
          >{{ tag }}</option>
        </select>
      </div>

      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Recommendation Tag</label>
        <select v-model="selectedRecommendationTag" v-bind="filterAttrs('recommendation_tag')" style="font-size:.75rem; min-width:180px; max-width:260px;">
          <option value="">All</option>
          <option
            v-for="tag in recommendationTagOptions"
            :key="tag"
            :value="tag"
          >{{ tag }}</option>
        </select>
      </div>
    </template>
  </report-table-shell>
  `
});
