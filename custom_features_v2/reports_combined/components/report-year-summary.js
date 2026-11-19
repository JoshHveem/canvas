export function yearSummary(config) {
  return {
    props: {
      reportContext: { type: Object, default: () => ({}) },
      anonymous: { type: Boolean, default: false }
    },

    data() {
      return {
        loading: false,
        loadError: '',
        year: Number(this.reportContext?.sharedFilters?.academic_year ?? this.reportContext?.filters?.academic_year) || new Date().getFullYear(),
        rows: []
      };
    },

    mounted() {
      this.loadData();
    },

    watch: {
      reportContext: {
        deep: true,
        handler() {
          const nextYear = Number(this.getSharedFilterValue('academic_year', this.reportContext?.filters?.academic_year));
          if (Number.isFinite(nextYear) && nextYear !== this.year) {
            this.year = nextYear;
            return;
          }
          this.loadData();
        }
      },
      year() {
        this.setSharedFilterValue('academic_year', Number(this.year));
        this.loadData();
      }
    },

    methods: {
      getDataset() {
        return String(this.reportContext?.dataset || '').trim();
      },

      normalizeRows(rows) {
        return typeof this.mapRows === 'function' ? this.mapRows(rows) : (Array.isArray(rows) ? rows : []);
      },

      getLoadErrorMessage() {
        return config.loadErrorMessage || 'Unable to load summary.';
      },

      async loadData() {
        return this.runReportRequest('data', {
          onError: e => {
            console.warn('Failed to load summary dataset', e);
            this.rows = [];
            this.loadError = this.getLoadErrorMessage();
          }
        }, async request => {
          const rows = await request.wait(this.fetchReportDataset(
            Object.assign({}, this.reportContext?.filters || {}, {
              academic_year: Number(this.year)
            }),
            { dataset: this.getDataset() }
          ));

          this.rows = this.normalizeRows(rows);
        });
      }
    }
  };
}
