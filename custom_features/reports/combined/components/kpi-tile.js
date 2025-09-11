Vue.component('kpi-tile', {
  props: {
    label: { type: String, required: true },
    value: { type: [Number, String], default: null },
    unit:  { type: String, default: '' },

    // Pass an array of bands instead of comparator
    // Example: [{ max: 2, status: 'good' }, { max: 3, status: 'warn' }, { status: 'bad' }]
    bands: {
      type: Array,
      default: () => []
    },

    decimals: { type: Number, default: 1 },
    title: { type: String, default: '' }
  },

  computed: {
    numericValue() {
      const n = Number(this.value);
      return Number.isFinite(n) ? n : null;
    },
    displayValue() {
      if (this.numericValue === null) return '—';
      return this.numericValue.toFixed(this.decimals);
    },
    status() {
      const v = this.numericValue;
      if (v === null) return 'neutral';
      for (const band of this.bands) {
        if (band.max === undefined || v <= band.max) return band.status;
      }
      return 'neutral';
    },
    statusClass() {
      if (this.status === 'good') return 'btech-fill-success';
      if (this.status === 'warn') return 'btech-fill-warning';
      if (this.status === 'bad') return 'btech-fill-danger';
      return 'btech-fill-muted';
    }
  },

  template: `
    <div class="btech-tile" :title="title">
      <div class="btech-row" style="margin-bottom:4px; align-items:center;">
        <div class="btech-kpi-label">{{ label }}</div>
      </div>
      <div class="btech-kpi-value" :class="statusClass">
        {{ displayValue }} <span v-if="unit" class="btech-muted">{{ unit }}</span>
      </div>
    </div>
  `
});
