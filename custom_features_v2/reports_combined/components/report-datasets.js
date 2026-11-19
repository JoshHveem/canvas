export const datasetsUtils = {
  cloneData(value) {
    if (value === undefined) return undefined;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (e) {
      return value;
    }
  },

  stableSerialize(value) {
    if (Array.isArray(value)) {
      return `[${value.map(item => window.ReportUtils.stableSerialize(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      const keys = Object.keys(value).sort();
      return `{${keys.map(key => `${JSON.stringify(key)}:${window.ReportUtils.stableSerialize(value[key])}`).join(',')}}`;
    }
    return JSON.stringify(value);
  }
};

export const datasets = {
  methods: {
    getReportDatasetCache() {
      if (!window.__btechReportDatasetCache || typeof window.__btechReportDatasetCache !== 'object') {
        window.__btechReportDatasetCache = {};
      }
      return window.__btechReportDatasetCache;
    },

    getReportDatasetPendingCache() {
      if (!window.__btechReportDatasetPendingCache || typeof window.__btechReportDatasetPendingCache !== 'object') {
        window.__btechReportDatasetPendingCache = {};
      }
      return window.__btechReportDatasetPendingCache;
    },

    createReportDatasetCacheKey(dataset, filters = {}, options = {}) {
      return window.ReportUtils.stableSerialize({
        report: String(this.reportContext?.reportName ?? '').trim(),
        subMenu: String(this.reportContext?.subMenu ?? '').trim(),
        dataset: String(dataset ?? '').trim(),
        filters: filters && typeof filters === 'object' ? filters : {},
        options: options && typeof options === 'object' ? options : {}
      });
    },

    async fetchReportDataset(filters = {}, options = {}) {
      const requestFilters = filters && typeof filters === 'object' ? filters : {};
      const requestOptions = options && typeof options === 'object' ? options : {};
      const dataset = String(requestOptions?.dataset ?? this.reportContext?.dataset ?? '').trim();
      const cacheKey = this.createReportDatasetCacheKey(dataset, requestFilters, requestOptions);
      const cache = this.getReportDatasetCache();
      const pendingCache = this.getReportDatasetPendingCache();
    
      if (Object.prototype.hasOwnProperty.call(cache, cacheKey)) {
        return window.ReportUtils.cloneData(cache[cacheKey]);
      }
    
      if (!Object.prototype.hasOwnProperty.call(pendingCache, cacheKey)) {
        pendingCache[cacheKey] = bridgetools.req3('reports', requestFilters, requestOptions)
          .then(rows => {
            cache[cacheKey] = window.ReportUtils.cloneData(Array.isArray(rows) ? rows : []);
            return cache[cacheKey];
          })
          .finally(() => {
            delete pendingCache[cacheKey];
          });
      }
    
      const rows = await pendingCache[cacheKey];
      return window.ReportUtils.cloneData(rows);
    }
  }
};
