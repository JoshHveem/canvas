export const cplMetrics = {
  methods: {
    bandStyle(value, warnMin, passMin) {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      }

      return {
        backgroundColor: n < warnMin
          ? this.colors.red
          : (n < passMin ? this.colors.yellow : this.colors.green),
        color: this.colors.white
      };
    },

    completionPillStyle(value) {
      return this.bandStyle(value, 0.6, 0.7);
    },

    outcomePillStyle(value) {
      return this.bandStyle(value, 0.7, 0.8);
    }
  }
};
