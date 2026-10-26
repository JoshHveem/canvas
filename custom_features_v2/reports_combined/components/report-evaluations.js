// Aggregate scores are ratios; individual response scores use their ordinal scale.
// Keep their thresholds separate when sharing evaluation rendering and tag helpers.
function sortedTagCounts(rawTags) {
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
}

export const evaluationSummary = {
  methods: {
    normalizeTags(rawTags, numSubmissions) {
      const entries = sortedTagCounts(rawTags)
        .map(tag => ({
          ...tag,
          pct: numSubmissions > 0 ? tag.count / numSubmissions : NaN
        }));

      return entries.slice(0, 3);
    },

    likertPillStyle(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      }

      return {
        backgroundColor: n > 0.9 ? this.colors.green : (n >= 0.8 ? this.colors.yellow : this.colors.red),
        color: this.colors.white
      };
    },

    feedbackRecsPillStyle(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      }

      return {
        backgroundColor: n < 0.5 ? this.colors.green : (n < 0.75 ? this.colors.yellow : this.colors.red),
        color: this.colors.white
      };
    },

    getTopTag(row, index) {
      return Array.isArray(row?.top_tags) ? (row.top_tags[index] || null) : null;
    },

    topTagHtml(row, index) {
      const tag = this.getTopTag(row, index);
      if (!tag) return '<span title="No tag">-</span>';

      const count = Number(tag.count) || 0;
      const label = this.escapeHtml(tag.name);
      return `<span title="${count} mention${count === 1 ? '' : 's'}">${label}</span>`;
    },

    topTagPillStyle(row, index) {
      const tag = this.getTopTag(row, index);
      if (!tag) {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      }

      const pct = Number(tag.pct);
      const count = Number(tag.count) || 0;

      if (Number.isFinite(pct) && pct > 0.1 && count > 3) {
        return { backgroundColor: this.colors.red, color: this.colors.white };
      }
      if (Number.isFinite(pct) && pct > 0.05 && count > 2) {
        return { backgroundColor: this.colors.yellow, color: this.colors.white };
      }
      return { backgroundColor: this.colors.green, color: this.colors.white };
    },

    topTagSortValue(row, index) {
      const tag = this.getTopTag(row, index);
      if (!tag) return -1;
      return Number(tag.count) || -1;
    }
  }
};

// Configure datasets and messages here; each report owns its mapRows hook,
// columns, and template. Keep this mixin after tables so tag filtering wins.
export function evaluationDetail(config = {}) {
  return {
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
        return `${this.escapeHtml(course)} - ${config.titleSuffix}`;
      }
    },

    methods: {
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

      tagSummaryParts(rawTags) {
        return sortedTagCounts(rawTags);
      },

      tagNames(rawTags) {
        return this.tagSummaryParts(rawTags).map(tag => tag.name);
      },

      hasTag(rawTags, targetTag) {
        return this.tagNames(rawTags).includes(String(targetTag || '').trim());
      },

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
        return String(this.reportContext?.dataset || config.dataset).trim();
      },

      async loadOptions() {
        return this.runReportRequest('options', {
          loadingKey: 'loadingOptions',
          invalidate: ['data'],
          onError: e => {
            console.warn(`Failed to load ${config.logLabel} options`, e);
            this.optionRows = [];
            this.rows = [];
            this.loadError = config.optionsLoadErrorMessage || 'Unable to load course list.';
          }
        }, async request => {
          const rows = await request.wait(bridgetools.req3(
            'reports',
            { academic_year: Number(this.year) },
            { dataset: config.optionsDataset }
          ));

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
        });
      },

      async loadData() {
        const programCode = String(this.selectedProgramCode || '').trim();
        const courseCode = String(this.selectedCourseCode || '').trim();
        return this.runReportRequest('data', {
          onError: e => {
            console.warn(`Failed to load ${config.logLabel} dataset`, e);
            this.rows = [];
            this.loadError = config.loadErrorMessage;
          }
        }, async request => {
          if (!programCode) {
            this.rows = [];
            this.loadError = 'Select a program.';
            return;
          }

          const filters = {
            academic_year: Number(this.year),
            program_code: programCode
          };
          if (courseCode) filters.course_code = courseCode;

          const rows = await request.wait(bridgetools.req3(
            'reports',
            filters,
            { dataset: this.getDataset() }
          ));

          this.rows = this.mapRows(rows);
        });
      }
    }
  };
}
