// Keep aliases outside report rows so filtering, sorting, drilldowns, and requests
// continue to use their real values. The registry lasts for this modal session.
export function createAnonymizationState() {
  const aliases = new Map();
  return {
    enabled: false,
    alias(field, value, label) {
      const key = String(field);
      if (!aliases.has(key)) aliases.set(key, new Map());
      const values = aliases.get(key);
      const text = String(value ?? '').trim();
      if (!values.has(text)) values.set(text, values.size + 1);
      return `${label} #${values.get(text)}`;
    }
  };
}

export const anonymization = {
  inject: {
    reportAnonymization: { default: null }
  },

  computed: {
    isAnonymized() {
      return !!this.reportAnonymization?.enabled;
    }
  },

  methods: {
    displayName(value, field, label) {
      if (!this.isAnonymized || !String(value ?? '').trim()) return value;
      return this.reportAnonymization.alias(field, value, label);
    },

    displayFilterOption(option, field, label) {
      if (option.value === '' || option.value === null || option.value === undefined) return option.label;
      if (!this.isAnonymized) return option.label;
      return this.displayName(option.nameValue ?? option.label, field, label);
    },

    displayColumnContent(column, row) {
      if (!this.isAnonymized || !row || typeof row !== 'object') return column.getContent(row);
      const names = new Map();
      // Observe the actual field reads, including those inside shared formatters.
      // Do not infer sensitive fields from a column's human-readable title.
      const probe = new Proxy(row, {
        get(target, field, receiver) {
          const value = Reflect.get(target, field, receiver);
          if (typeof field === 'string' && (field.includes('_name') || field === 'name')) {
            names.set(field, value);
          }
          return value;
        }
      });
      const content = column.getContent(probe);
      // Names used only in link URLs or other attributes are not displayed names.
      const visibleText = String(content ?? '').replace(/<[^>]*>/g, '');
      const fields = Array.from(names).filter(([, value]) => {
        const name = String(value ?? '').trim();
        return name && (visibleText.includes(window.ReportUtils.escapeHtml(name)) || visibleText.includes(name));
      });
      if (!fields.length) return content;
      fields.sort(([a], [b]) => a.localeCompare(b));
      const field = fields.length === 1 ? fields[0][0] : fields.map(([key]) => key).join(',');
      const value = fields.length === 1 ? fields[0][1] : JSON.stringify(fields.map(([, value]) => value));
      return window.ReportUtils.escapeHtml(this.displayName(value, field, column.name || 'Name'));
    }
  }
};
