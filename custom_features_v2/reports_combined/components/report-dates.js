export const dates = {
  methods: {
    dateValue(value) {
      const dateOnly = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])).getTime();
      const time = Date.parse(value);
      return Number.isFinite(time) ? time : null;
    },

    dateSort(value) {
      return this.dateValue(value) ?? Number.POSITIVE_INFINITY;
    },

    dateText(value) {
      const time = this.dateValue(value);
      return time === null ? '—' : new Date(time).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }
};
