// Prepare a copy for rendering; source rows remain available for filtering,
// sorting, drilldowns, and requests. Aliases last for this modal session.
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

    prepareReportData(data) {
      if (!this.isAnonymized) return data;

      const labels = {
        first_name: 'First Name', last_name: 'Last Name',
        full_name__instructor: 'Instructor', user_name: 'User', name: 'Name',
        course_name: 'Course', department_name: 'Department',
        program_name: 'Program', campus_name: 'Campus', stage_name: 'Focus Stage'
      };
      const copies = new WeakMap();
      const prepare = value => {
        if (!value || typeof value !== 'object') return value;
        if (Object.prototype.toString.call(value) !== '[object Object]' && !Array.isArray(value)) return value;
        if (copies.has(value)) return copies.get(value);
        const copy = Array.isArray(value) ? [] : {};
        copies.set(value, copy);
        for (const [field, entry] of Object.entries(value)) {
          const nameField = field === 'upcoming_course_name' ? 'course_name' : field;
          // Academic standing is a status, not an identifying name.
          const isName = nameField !== 'academic_standing_name' &&
            (nameField === 'name' || nameField.includes('_name'));
          copy[field] = isName && typeof entry === 'string'
            ? this.displayName(entry, nameField, labels[nameField] || 'Name')
            : prepare(entry);
        }
        return copy;
      };
      return prepare(data);
    }
  }
};
