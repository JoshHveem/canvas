Vue.component('reports-evaluations-course-detail', {
  mixins: [
    window.ReportMixins.requests,
    window.ReportMixins.formatting,
    window.ReportMixins.labels,
    window.ReportMixins.filters,
    window.ReportMixins.tables,
    window.ReportMixins.evaluationDetail({
      dataset: 'course_evaluations',
      optionsDataset: 'course_course_evaluations',
      titleSuffix: 'Course Eval Detail',
      logLabel: 'course evaluation detail',
      loadErrorMessage: 'Unable to load course evaluation details.'
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
        'Content', 'Course content relevant score.', '6rem', false, 'number',
        row => this.numText(row?.likert_course_content_relevant, 0),
        row => this.responseLikertPillStyle(row?.likert_course_content_relevant),
        row => Number(row?.likert_course_content_relevant ?? -1)
      ),
      new window.ReportColumn(
        'Objectives', 'Course objectives clear score.', '6rem', false, 'number',
        row => this.numText(row?.likert_course_objectives_clear, 0),
        row => this.responseLikertPillStyle(row?.likert_course_objectives_clear),
        row => Number(row?.likert_course_objectives_clear ?? -1)
      ),
      new window.ReportColumn(
        'Instructions', 'Assignment instructions clear score.', '7rem', false, 'number',
        row => this.numText(row?.likert_assignment_instructions_clear, 0),
        row => this.responseLikertPillStyle(row?.likert_assignment_instructions_clear),
        row => Number(row?.likert_assignment_instructions_clear ?? -1)
      ),
      new window.ReportColumn(
        'Recommend', 'Would recommend course score.', '6rem', false, 'number',
        row => this.numText(row?.likert_would_recommend_course, 0),
        row => this.responseLikertPillStyle(row?.likert_would_recommend_course),
        row => Number(row?.likert_would_recommend_course ?? -1)
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
        evaluation_submission_id: String(row?.evaluation_submission_id ?? '').trim(),
        likert_course_content_relevant: Number(row?.likert_course_content_relevant),
        likert_course_objectives_clear: Number(row?.likert_course_objectives_clear),
        likert_assignment_instructions_clear: Number(row?.likert_assignment_instructions_clear),
        likert_would_recommend_course: Number(row?.likert_would_recommend_course),
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
    loading-text="Loading course evaluation details..."
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
          >{{ option.label }}</option>
        </select>
      </div>

      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Course</label>
        <select v-model="selectedCourseCode" v-bind="filterAttrs('course_code')" style="font-size:.75rem; min-width:260px; max-width:360px;">
          <option
            v-for="option in courseOptions"
            :key="option.value"
            :value="option.value"
          >{{ option.label }}</option>
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
