Vue.component('reports-evaluations-course-detail', {
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
      year: Number(this.reportContext?.sharedFilters?.academic_year ?? this.reportContext?.filters?.academic_year) || new Date().getFullYear(),
      rows: [],
      optionRows: [],
      selectedProgramCode: String(this.reportContext?.sharedFilters?.program_code ?? this.reportContext?.routeFilters?.programCode ?? ''),
      selectedCourseCode: String(this.reportContext?.sharedFilters?.course_code ?? this.reportContext?.routeFilters?.courseCode ?? ''),
      selectedPositiveTag: String(this.reportContext?.sharedFilters?.positive_tag ?? ''),
      selectedRecommendationTag: String(this.reportContext?.sharedFilters?.recommendation_tag ?? '')
    };
  },

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
      new window.ReportColumn(
        'Positives', 'Positive free response.', '24rem', false, 'string',
        row => this.textOrDash(row?.free_response_positives),
        null,
        row => String(row?.free_response_positives ?? '')
      ),
      new window.ReportColumn(
        'Recommendations', 'Recommendation free response.', '24rem', false, 'string',
        row => this.textOrDash(row?.free_response_recommendations),
        null,
        row => String(row?.free_response_recommendations ?? '')
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
      this.setSharedFilterValue('academic_year', Number(this.year));
      this.loadOptions();
    },
    selectedProgramCode() {
      this.setSharedFilterValue('program_code', this.selectedProgramCode);
      const selectedOption = this.programOptions.find(option => option.value === this.selectedProgramCode);
      if (selectedOption?.label) this.setSharedFilterValue('program_name', selectedOption.label);
      const courseOptions = this.courseOptions;
      if (!courseOptions.some(option => option.value === this.selectedCourseCode)) {
        this.selectedCourseCode = '';
        return;
      }
      this.loadData();
    },
    selectedCourseCode() {
      this.setSharedFilterValue('course_code', this.selectedCourseCode);
      const selectedOption = this.courseOptions.find(option => option.value === this.selectedCourseCode);
      if (selectedOption?.label && this.selectedCourseCode) this.setSharedFilterValue('course_name', selectedOption.label);
      this.loadData();
    },
    selectedPositiveTag(value) {
      this.setSharedFilterValue('positive_tag', value);
    },
    selectedRecommendationTag(value) {
      this.setSharedFilterValue('recommendation_tag', value);
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
      const options = Array.from(
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

      return [
        { value: '', label: 'All' },
        ...options
      ];
    },

    positiveTagOptions() {
      return this.uniqueSorted(this.rows.flatMap(row => this.tagNames(row?.free_response_positives__tags)));
    },

    recommendationTagOptions() {
      return this.uniqueSorted(this.rows.flatMap(row => this.tagNames(row?.free_response_recommendations__tags)));
    },

    visibleRows() {
      const positiveTag = String(this.selectedPositiveTag || '').trim();
      const recommendationTag = String(this.selectedRecommendationTag || '').trim();
      const filtered = this.rows.filter(row => {
        if (positiveTag && !this.hasTag(row?.free_response_positives__tags, positiveTag)) return false;
        if (recommendationTag && !this.hasTag(row?.free_response_recommendations__tags, recommendationTag)) return false;
        return true;
      });
      this.table.setRows(filtered);
      return this.table.getSortedRows();
    },

    titleText() {
      const course = this.courseOptions.find(option => option.value === this.selectedCourseCode)?.label
        || (this.selectedCourseCode === '' ? 'All Courses' : '')
        || String(this.reportContext?.routeFilters?.courseName ?? '').trim()
        || 'Course';
      return `${this.escapeHtml(course)} - Course Eval Detail`;
    }
  },

  methods: {
    syncFromReportContext() {
      const nextYear = Number(this.reportContext?.filters?.academic_year);
      if (Number.isFinite(nextYear) && nextYear !== this.year) {
        this.year = nextYear;
      }

      const routedProgramCode = String(this.getSharedFilterValue('program_code', this.reportContext?.routeFilters?.programCode) ?? '').trim();
      const routedCourseCode = String(this.getSharedFilterValue('course_code', this.reportContext?.routeFilters?.courseCode) ?? '').trim();
      if (routedProgramCode) this.selectedProgramCode = routedProgramCode;
      if (routedCourseCode) this.selectedCourseCode = routedCourseCode;
      this.selectedPositiveTag = String(this.getSharedFilterValue('positive_tag', this.selectedPositiveTag) ?? '').trim();
      this.selectedRecommendationTag = String(this.getSharedFilterValue('recommendation_tag', this.selectedRecommendationTag) ?? '').trim();
    },

    getDataset() {
      return String(this.reportContext?.dataset || 'course_evaluations').trim();
    },

    async loadOptions() {
      try {
        this.loadingOptions = true;
        this.loadError = '';

        const rows = await bridgetools.req3(
          'reports',
          { academic_year: Number(this.year) },
          { dataset: 'course_course_evaluations' }
        );

        this.optionRows = (Array.isArray(rows) ? rows : []).map(row => ({
          ...row,
          program_code: String(row?.program_code ?? '').trim(),
          program_name: String(row?.program_name ?? '').trim(),
          course_code: String(row?.course_code ?? '').trim(),
          course_name: String(row?.course_name ?? '').trim()
        }));

        const nextProgramCode = this.resolveDeferredSelection({
          filterKey: 'program_code',
          options: this.programOptions,
          currentValue: this.selectedProgramCode,
          routeValue: this.reportContext?.routeFilters?.programCode
        });
        if (!this.filterValuesEqual(nextProgramCode, this.selectedProgramCode)) {
          this.selectedProgramCode = nextProgramCode;
          return;
        }

        const nextCourseCode = this.resolveDeferredSelection({
          filterKey: 'course_code',
          options: this.courseOptions,
          currentValue: this.selectedCourseCode,
          routeValue: this.reportContext?.routeFilters?.courseCode,
          allowBlank: true,
          fallbackValue: ''
        });
        if (!this.filterValuesEqual(nextCourseCode, this.selectedCourseCode)) {
          this.selectedCourseCode = nextCourseCode;
          return;
        }

        this.loadData();
      } catch (e) {
        console.warn('Failed to load course evaluation detail options', e);
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
      if (!programCode) {
        this.rows = [];
        this.loadError = 'Select a program.';
        return;
      }

      try {
        this.loading = true;
        this.loadError = '';

        const filters = {
          academic_year: Number(this.year),
          program_code: programCode
        };
        if (courseCode) filters.course_code = courseCode;

        const rows = await bridgetools.req3(
          'reports',
          filters,
          { dataset: this.getDataset() }
        );

        this.rows = (Array.isArray(rows) ? rows : []).map(row => ({
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
      } catch (e) {
        console.warn('Failed to load course evaluation detail dataset', e);
        this.rows = [];
        this.loadError = 'Unable to load course evaluation details.';
      } finally {
        this.loading = false;
      }
    },

    programName(row) {
      return String(row?.program_name ?? row?.program_code ?? '').trim() || '(no program)';
    },

    responseLikertPillStyle(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      }
      return {
        backgroundColor: n >= 2 ? this.colors.green : (n >= 1 ? this.colors.yellow : this.colors.red),
        color: this.colors.white
      };
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

    tagNames(rawTags) {
      return this.tagSummaryParts(rawTags).map(tag => tag.name);
    },

    hasTag(rawTags, targetTag) {
      return this.tagNames(rawTags).includes(String(targetTag || '').trim());
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
