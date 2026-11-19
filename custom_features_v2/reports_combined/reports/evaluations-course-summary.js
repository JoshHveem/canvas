Vue.component('reports-evaluations-course-summary', {
  mixins: [
    window.ReportMixins.anonymization,
    window.ReportMixins.requests,
    window.ReportMixins.formatting,
    window.ReportMixins.tables,
    window.ReportMixins.labels,
    window.ReportMixins.evaluationSummary,
    window.ReportMixins.filters,
    window.ReportMixins.datasets,
    window.ReportMixins.yearSummary({
      loadErrorMessage: 'Unable to load course evaluations summary.'
    })
  ],

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('Program', colors);

    return {
      colors,
      table
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Program', 'Program name.', '18rem', false, 'string',
        row => this.anonymous ? 'PROGRAM' : this.escapeHtml(this.programName(row)),
        null,
        row => this.programName(row).toLowerCase()
      ),
      new window.ReportColumn(
        'Subs', 'Number of course evaluation submissions.', '5rem', false, 'number',
        row => this.intText(row?.num_submissions),
        null,
        row => Number(row?.num_submissions ?? -1)
      ),
      new window.ReportColumn(
        'Feedback Recs', 'Share of submissions with recommendation feedback.', '8rem', false, 'number',
        row => this.pctText(row?.perc_submissions__feedback_recommendations),
        row => this.feedbackRecsPillStyle(row?.perc_submissions__feedback_recommendations),
        row => Number(row?.perc_submissions__feedback_recommendations ?? -1)
      ),
      new window.ReportColumn(
        'Instr Clear', 'Assignment instructions are clear.', '7rem', false, 'number',
        row => this.pctText(row?.likert_assignment_instructions_clear),
        row => this.likertPillStyle(row?.likert_assignment_instructions_clear),
        row => Number(row?.likert_assignment_instructions_clear ?? -1)
      ),
      new window.ReportColumn(
        'Content', 'Course content is relevant.', '7rem', false, 'number',
        row => this.pctText(row?.likert_course_content_relevant),
        row => this.likertPillStyle(row?.likert_course_content_relevant),
        row => Number(row?.likert_course_content_relevant ?? -1)
      ),
      new window.ReportColumn(
        'Objectives', 'Course objectives are clear.', '7rem', false, 'number',
        row => this.pctText(row?.likert_course_objectives_clear),
        row => this.likertPillStyle(row?.likert_course_objectives_clear),
        row => Number(row?.likert_course_objectives_clear ?? -1)
      ),
      new window.ReportColumn(
        'Recommend', 'Would recommend the course.', '7rem', false, 'number',
        row => this.pctText(row?.likert_would_recommend_course),
        row => this.likertPillStyle(row?.likert_would_recommend_course),
        row => Number(row?.likert_would_recommend_course ?? -1)
      ),
      new window.ReportColumn(
        'Top 1 Tag', 'Most frequent recommendation tag.', '12rem', false, 'string',
        row => this.topTagHtml(row, 0),
        row => this.topTagPillStyle(row, 0),
        row => this.topTagSortValue(row, 0)
      ),
      new window.ReportColumn(
        'Top 2 Tag', 'Second most frequent recommendation tag.', '12rem', false, 'string',
        row => this.topTagHtml(row, 1),
        row => this.topTagPillStyle(row, 1),
        row => this.topTagSortValue(row, 1)
      ),
      new window.ReportColumn(
        'Top 3 Tag', 'Third most frequent recommendation tag.', '12rem', false, 'string',
        row => this.topTagHtml(row, 2),
        row => this.topTagPillStyle(row, 2),
        row => this.topTagSortValue(row, 2)
      )
    ]);
  },

  methods: {
    mapRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => {
        const numSubmissions = Number(row?.num_submissions) || 0;
        const tags = this.normalizeTags(row?.free_response_recommendations__tags, numSubmissions);

        return {
          ...row,
          academic_year: Number(row?.academic_year),
          program_code: String(row?.program_code ?? '').trim(),
          program_name: String(row?.program_name ?? '').trim(),
          num_submissions: numSubmissions,
          perc_submissions__feedback_recommendations: Number(row?.perc_submissions__feedback_recommendations),
          likert_assignment_instructions_clear: Number(row?.likert_assignment_instructions_clear),
          likert_course_content_relevant: Number(row?.likert_course_content_relevant),
          likert_course_objectives_clear: Number(row?.likert_course_objectives_clear),
          likert_would_recommend_course: Number(row?.likert_would_recommend_course),
          top_tags: tags
        };
      });
    },

    emitDrill(row) {
      this.$emit('drill-report', {
        report: 'evaluations',
        subMenu: 'course-course-evals-summary',
        program_code: String(row?.program_code ?? '').trim(),
        program_name: String(row?.program_name ?? '').trim()
      });
    }
  },

  template: `
  <report-table-shell
    title-html="Programs - Course Evals Summary"
    :table="table"
    :rows="visibleRows"
    :loading="loading"
    :load-error="loadError"
    loading-text="Loading course evaluations..."
    :row-key-fn="(row, index) => row.program_code || row.program_name || index"
    :row-clickable="true"
    @row-click="emitDrill"
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
    </template>
  </report-table-shell>
  `
});
