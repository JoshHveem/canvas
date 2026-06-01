Vue.component('reports-evaluations-instructor-detail', {
  mixins: [
    window.ReportMixins.formatting
  ],

  props: {
    reportContext: { type: Object, default: () => ({}) },
    anonymous: { type: Boolean, default: false }
  },

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('Submission', colors);

    return {
      colors,
      table,
      loading: false,
      loadingOptions: false,
      loadError: '',
      year: Number(this.reportContext?.filters?.academic_year) || new Date().getFullYear(),
      rows: [],
      optionRows: [],
      selectedProgramCode: '',
      selectedCourseCode: ''
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Submission', 'Evaluation submission id.', '10rem', false, 'string',
        row => this.escapeHtml(String(row?.evaluation_submission_id ?? '')),
        null,
        row => String(row?.evaluation_submission_id ?? '')
      ),
      new window.ReportColumn(
        'Support', 'Available support score.', '6rem', false, 'number',
        row => this.numText(row?.likert_available_support, 0),
        null,
        row => Number(row?.likert_available_support ?? -1)
      ),
      new window.ReportColumn(
        'Instruction', 'Clear instruction score.', '6rem', false, 'number',
        row => this.numText(row?.likert_clear_instruction, 0),
        null,
        row => Number(row?.likert_clear_instruction ?? -1)
      ),
      new window.ReportColumn(
        'Career Prep', 'Career preparation score.', '6rem', false, 'number',
        row => this.numText(row?.likert_career_preparation, 0),
        null,
        row => Number(row?.likert_career_preparation ?? -1)
      ),
      new window.ReportColumn(
        'Respect', 'Respect score.', '6rem', false, 'number',
        row => this.numText(row?.likert_respect, 0),
        null,
        row => Number(row?.likert_respect ?? -1)
      ),
      new window.ReportColumn(
        'Progress', 'Progress review score.', '6rem', false, 'number',
        row => this.numText(row?.likert_regular_progress_reviews, 0),
        null,
        row => Number(row?.likert_regular_progress_reviews ?? -1)
      ),
      new window.ReportColumn(
        'Grading', 'Timely grading score.', '6rem', false, 'number',
        row => this.numText(row?.likert_timely_grading, 0),
        null,
        row => Number(row?.likert_timely_grading ?? -1)
      ),
      new window.ReportColumn(
        'Feedback', 'Helpful feedback score.', '6rem', false, 'number',
        row => this.numText(row?.likert_helpful_feedback, 0),
        null,
        row => Number(row?.likert_helpful_feedback ?? -1)
      ),
      new window.ReportColumn(
        'Prepared', 'Prepared for class score.', '6rem', false, 'number',
        row => this.numText(row?.likert_prepared_for_class, 0),
        null,
        row => Number(row?.likert_prepared_for_class ?? -1)
      ),
      new window.ReportColumn(
        'Positives', 'Positive free response.', '24rem', false, 'string',
        row => this.textOrDash(row?.free_response_positives),
        null,
        row => String(row?.free_response_positives ?? '')
      ),
      new window.ReportColumn(
        'Positive Tags', 'Tags extracted from positives.', '14rem', false, 'string',
        row => this.tagSummaryHtml(row?.free_response_positives__tags),
        null,
        row => this.tagSummarySort(row?.free_response_positives__tags)
      ),
      new window.ReportColumn(
        'Recommendations', 'Recommendation free response.', '24rem', false, 'string',
        row => this.textOrDash(row?.free_response_recommendations),
        null,
        row => String(row?.free_response_recommendations ?? '')
      ),
      new window.ReportColumn(
        'Recommendation Tags', 'Tags extracted from recommendations.', '14rem', false, 'string',
        row => this.tagSummaryHtml(row?.free_response_recommendations__tags),
        null,
        row => this.tagSummarySort(row?.free_response_recommendations__tags)
      )
    ]);
  },

  mounted() {
    this.syncFromReportContext();
    this.loadOptions();
  },

  watch: {
    reportContext: {
      deep: true,
      handler() {
        this.syncFromReportContext();
        this.loadOptions();
      }
    },
    year() {
      this.loadOptions();
    },
    selectedProgramCode() {
      const courseOptions = this.courseOptions;
      if (!courseOptions.some(option => option.value === this.selectedCourseCode)) {
        this.selectedCourseCode = courseOptions[0]?.value || '';
        return;
      }
      this.loadData();
    },
    selectedCourseCode() {
      this.loadData();
    }
  },

  computed: {
    programOptions() {
      return Array.from(
        new Map(
          this.optionRows
            .map(row => ({
              value: String(row?.program_code ?? '').trim(),
              label: this.programName(row)
            }))
            .filter(option => option.value && option.label)
            .map(option => [option.value, option])
        ).values()
      ).sort((a, b) => a.label.localeCompare(b.label));
    },

    courseOptions() {
      const selectedProgramCode = String(this.selectedProgramCode || '').trim();
      return Array.from(
        new Map(
          this.optionRows
            .filter(row => String(row?.program_code ?? '').trim() === selectedProgramCode)
            .map(row => ({
              value: String(row?.course_code ?? '').trim(),
              label: this.courseLabel(row)
            }))
            .filter(option => option.value && option.label)
            .map(option => [option.value, option])
        ).values()
      ).sort((a, b) => a.label.localeCompare(b.label));
    },

    visibleRows() {
      this.table.setRows(this.rows);
      return this.table.getSortedRows();
    },

    titleText() {
      const course = this.courseOptions.find(option => option.value === this.selectedCourseCode)?.label
        || String(this.reportContext?.routeFilters?.courseName ?? '').trim()
        || 'Course';
      return `${this.escapeHtml(course)} - Instructor Eval Detail`;
    }
  },

  methods: {
    syncFromReportContext() {
      const nextYear = Number(this.reportContext?.filters?.academic_year);
      if (Number.isFinite(nextYear) && nextYear !== this.year) {
        this.year = nextYear;
      }

      const routedProgramCode = String(this.reportContext?.routeFilters?.programCode ?? '').trim();
      const routedCourseCode = String(this.reportContext?.routeFilters?.courseCode ?? '').trim();
      if (routedProgramCode) this.selectedProgramCode = routedProgramCode;
      if (routedCourseCode) this.selectedCourseCode = routedCourseCode;
    },

    getDataset() {
      return String(this.reportContext?.dataset || 'instructor_evaluations').trim();
    },

    async loadOptions() {
      try {
        this.loadingOptions = true;
        this.loadError = '';

        const rows = await bridgetools.req3(
          'reports',
          { academic_year: Number(this.year) },
          { dataset: 'course_instructor_evaluations' }
        );

        this.optionRows = (Array.isArray(rows) ? rows : []).map(row => ({
          ...row,
          program_code: String(row?.program_code ?? '').trim(),
          program_name: String(row?.program_name ?? '').trim(),
          course_code: String(row?.course_code ?? '').trim(),
          course_name: String(row?.course_name ?? '').trim()
        }));

        if (!this.programOptions.some(option => option.value === this.selectedProgramCode)) {
          this.selectedProgramCode = this.programOptions[0]?.value || '';
          return;
        }

        if (!this.courseOptions.some(option => option.value === this.selectedCourseCode)) {
          this.selectedCourseCode = this.courseOptions[0]?.value || '';
          return;
        }

        this.loadData();
      } catch (e) {
        console.warn('Failed to load instructor evaluation detail options', e);
        this.optionRows = [];
        this.rows = [];
        this.loadError = 'Unable to load course list.';
      } finally {
        this.loadingOptions = false;
      }
    },

    async loadData() {
      const programCode = String(this.selectedProgramCode || '').trim();
      const courseCode = String(this.selectedCourseCode || '').trim();
      if (!programCode || !courseCode) {
        this.rows = [];
        this.loadError = 'Select a program and course.';
        return;
      }

      try {
        this.loading = true;
        this.loadError = '';

        const rows = await bridgetools.req3(
          'reports',
          {
            academic_year: Number(this.year),
            program_code: programCode,
            course_code: courseCode
          },
          { dataset: this.getDataset() }
        );

        this.rows = (Array.isArray(rows) ? rows : []).map(row => ({
          ...row,
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
      } catch (e) {
        console.warn('Failed to load instructor evaluation detail dataset', e);
        this.rows = [];
        this.loadError = 'Unable to load instructor evaluation details.';
      } finally {
        this.loading = false;
      }
    },

    programName(row) {
      return String(row?.program_name ?? row?.program_code ?? '').trim() || '(no program)';
    },

    courseLabel(row) {
      const code = String(row?.course_code ?? '').trim();
      const name = String(row?.course_name ?? '').trim();
      if (code && name) return `${code} - ${name}`;
      return code || name || '(no course)';
    },

    textOrDash(value) {
      const text = String(value ?? '').trim();
      return this.escapeHtml(text || '-');
    },

    tagSummaryParts(rawTags) {
      return Object.entries(rawTags && typeof rawTags === 'object' ? rawTags : {})
        .map(([name, count]) => ({
          name: String(name ?? '').trim(),
          count: Number(count) || 0
        }))
        .filter(tag => tag.name && tag.count > 0)
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.name.localeCompare(b.name);
        });
    },

    tagSummaryHtml(rawTags) {
      const tags = this.tagSummaryParts(rawTags);
      if (!tags.length) return '-';
      const title = tags.map(tag => `${tag.name}: ${tag.count}`).join(', ');
      const text = this.escapeHtml(tags.map(tag => tag.name).join(', '));
      return `<span title="${this.escapeHtml(title)}">${text}</span>`;
    },

    tagSummarySort(rawTags) {
      return this.tagSummaryParts(rawTags).map(tag => `${tag.name}:${tag.count}`).join('|');
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
        <select v-model.number="year" style="font-size:.75rem; min-width:90px;">
          <option
            v-for="optionYear in Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)"
            :key="optionYear"
            :value="optionYear"
          >{{ optionYear }}</option>
        </select>
      </div>

      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Program</label>
        <select v-model="selectedProgramCode" style="font-size:.75rem; min-width:220px; max-width:320px;">
          <option
            v-for="option in programOptions"
            :key="option.value"
            :value="option.value"
          >{{ option.label }}</option>
        </select>
      </div>

      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Course</label>
        <select v-model="selectedCourseCode" style="font-size:.75rem; min-width:260px; max-width:360px;">
          <option
            v-for="option in courseOptions"
            :key="option.value"
            :value="option.value"
          >{{ option.label }}</option>
        </select>
      </div>
    </template>
  </report-table-shell>
  `
});
