export const filters = {
  methods: {
    syncSelectedProgram() {
      const routedProgramCode = String(
        this.getSharedFilterValue('program_code', this.reportContext?.routeFilters?.programCode) ?? ''
      ).trim();
      if (routedProgramCode && routedProgramCode !== this.selectedProgramCode) {
        this.selectedProgramCode = routedProgramCode;
      }
    },

    cloneFilterValue(value) {
      if (Array.isArray(value)) return value.slice();
      if (value && typeof value === 'object') return Object.assign({}, value);
      return value;
    },

    filterValuesEqual(a, b) {
      if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
        return a.every((value, index) => this.filterValuesEqual(value, b[index]));
      }
      return String(a ?? '') === String(b ?? '');
    },

    getSharedFilterValue(key, fallback) {
      const filterKey = String(key || '').trim();
      const filters = this.reportContext?.sharedFilters || {};
      if (filterKey && Object.prototype.hasOwnProperty.call(filters, filterKey)) {
        return this.cloneFilterValue(filters[filterKey]);
      }
      return fallback;
    },

    setSharedFilterValue(key, value) {
      const setter = this.reportContext?.setSharedFilter;
      if (typeof setter === 'function') {
        setter(String(key || '').trim(), this.cloneFilterValue(value));
      }
    },

    filterAttrs(key, kind = 'select') {
      const filterKey = String(key || '').trim();
      return {
        id: filterKey ? `report-filter-${filterKey.replace(/[^a-z0-9_-]+/gi, '-')}` : null,
        class: 'js-report-filter',
        'data-report-filter-key': filterKey,
        'data-report-filter-kind': String(kind || 'select').trim() || 'select'
      };
    },

    resolveDeferredSelection({ filterKey, options, currentValue, routeValue, allowBlank = false, fallbackValue = '' }) {
      const normalizedOptions = Array.isArray(options) ? options : [];
      if (!normalizedOptions.length) return currentValue;

      const optionValues = normalizedOptions.map(option =>
        option && typeof option === 'object' && Object.prototype.hasOwnProperty.call(option, 'value')
          ? option.value
          : option
      );

      const matchesOption = (value) => {
        if (allowBlank && String(value ?? '') === '') return true;
        return optionValues.some(optionValue => this.filterValuesEqual(optionValue, value));
      };

      const persistedValue = this.getSharedFilterValue(filterKey, undefined);
      const preferredValues = [persistedValue, routeValue, currentValue];
      const preferred = preferredValues.find(value => value !== undefined && matchesOption(value));
      if (preferred !== undefined) return preferred;

      if (allowBlank && String(fallbackValue ?? '') === '') return fallbackValue;
      return optionValues[0];
    }
  }
};
