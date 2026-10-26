export const labels = {
  methods: {
    programName(row) {
      return String(row?.program_name ?? row?.program_code ?? '').trim() || '(no program)';
    },

    courseLabel(row) {
      const code = String(row?.course_code ?? '').trim();
      const name = String(row?.course_name ?? '').trim();
      if (code && name) return `${code} - ${name}`;
      return code || name || '(no course)';
    },

    departmentName(department) {
      return String(department?.department_name ?? department?.name ?? department?.department_code ?? '').trim();
    }
  }
};
