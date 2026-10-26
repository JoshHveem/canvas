export const formattingUtils = {
  escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  },

  pctText(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 'n/a';
    return (n * 100).toFixed(1) + '%';
  },

  pctPillStyle(colors, v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return { backgroundColor: colors.gray, color: colors.black };
    const pct = n * 100;
    return {
      backgroundColor: pct < 80 ? colors.red : (pct < 90 ? colors.yellow : colors.green),
      color: colors.white
    };
  },

  countPillStyle(colors, count) {
    const n = Number(count);
    if (!Number.isFinite(n)) return { backgroundColor: colors.gray, color: colors.black };
    return {
      backgroundColor: n <= 0 ? colors.green : (n <= 5 ? colors.yellow : colors.red),
      color: colors.white
    };
  },

  boolText(v) {
    if (v === undefined || v === null) return 'n/a';
    return v ? 'Yes' : 'No';
  },

  boolSort(v) {
    if (v === undefined || v === null) return -1;
    return v ? 1 : 0;
  },

  boolPillStyle(colors, v) {
    if (v === undefined || v === null) return { backgroundColor: colors.gray, color: colors.black };
    return v
      ? { backgroundColor: colors.green, color: colors.white }
      : { backgroundColor: colors.red, color: colors.white };
  },

  intText(v) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n).toLocaleString() : 'n/a';
  },

  numText(v, decimals = 2) {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(decimals) : 'n/a';
  },

  bandDaysToGrade(colors, v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return { backgroundColor: colors.gray, color: colors.black };
    return {
      backgroundColor: n < 2 ? colors.green : (n < 3 ? colors.yellow : colors.red),
      color: colors.white
    };
  },

  bandDaysToRespond(colors, v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return { backgroundColor: colors.gray, color: colors.black };
    return {
      backgroundColor: n <= 1 ? colors.green : (n <= 2 ? colors.yellow : colors.red),
      color: colors.white
    };
  },

  uniqueSorted(arr) {
    return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
  }
};

export const formatting = {
  methods: {
    numberValue(value) {
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    },

    sortNumber(value) {
      return this.numberValue(value) ?? Number.POSITIVE_INFINITY;
    },

    percent(value) {
      const number = this.numberValue(value);
      return number === null ? '—' : `${(number * 100).toFixed(1)}%`;
    },

    booleanValue(value) {
      return value === true || value === 1 || value === '1' || String(value ?? '').toLowerCase() === 'true';
    },

    textOrDash(value) {
      const text = String(value ?? '').trim();
      return this.escapeHtml(text || '-');
    },

    escapeHtml(str) { return window.ReportUtils.escapeHtml(str); },

    pctText(v) { return window.ReportUtils.pctText(v); },

    pctPillStyle(v) { return window.ReportUtils.pctPillStyle(this.colors, v); },

    countPillStyle(v) { return window.ReportUtils.countPillStyle(this.colors, v); },

    boolText(v) { return window.ReportUtils.boolText(v); },

    boolSort(v) { return window.ReportUtils.boolSort(v); },

    boolPillStyle(v) { return window.ReportUtils.boolPillStyle(this.colors, v); },

    intText(v) { return window.ReportUtils.intText(v); },

    numText(v, decimals = 2) { return window.ReportUtils.numText(v, decimals); },

    bandDaysToGrade(v) { return window.ReportUtils.bandDaysToGrade(this.colors, v); },

    bandDaysToRespond(v) { return window.ReportUtils.bandDaysToRespond(this.colors, v); },

    uniqueSorted(arr) { return window.ReportUtils.uniqueSorted(arr); }
  }
};
