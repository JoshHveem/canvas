export const students = {
  methods: {
    getStudentFirstName(row) {
      const firstName = String(row?.first_name ?? '').trim();
      if (firstName) return firstName;

      const canvasUserId = String(row?.canvas_user_id ?? '').trim();
      return canvasUserId ? `Canvas User ${canvasUserId}` : '-';
    },

    getStudentLastName(row) {
      return String(row?.last_name ?? '').trim() || '-';
    },

    // Name columns use the first-name fallback; full profiles fall back only
    // when the entire name is absent (studentName below).
    getStudentName(row) {
      const firstName = this.getStudentFirstName(row);
      const lastName = this.getStudentLastName(row);
      return [firstName, lastName].filter(name => name && name !== '-').join(' ') || '-';
    },

    studentName(row) {
      return [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || `Canvas User ${row.canvas_user_id || row.sis_user_id || '—'}`;
    }
  }
};
