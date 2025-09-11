Vue.component('kpi-tile', {
  props: {
    label: { type: String, required: true },
    value: { type: [Number, String], default: null },
    unit:  { type: String, default: '' },

    /**
     * Target semantics:
     *   comparator: "<=" | ">=" | "~"    // "~" = approximately equal
     *   target: Number                    // goal value (e.g., 2, 1.0, 1.00)
     *   tolerance: Number                 // allowed deviation for "~" (e.g., 0.1 means ±0.1)
     *   betterDirection: "lower" | "higher" | "near" // for progress bar direction & hints
     */
    goal: {
      type: Object,
      default: () => ({ comparator: '<=', target: 0, tolerance: 0, betterDirection: 'lower' })
    },

    // formatting
    decimals: { type: Number, default: 1 },
    thousandSep: { type: Boolean, default: true },

    // accessibility/tooltip
    title: { type: String, default: '' },

    // show a skinny progress bar under the value (optional)
    showProgress: { type: Boolean, default: true },

    // Provide a max for progress visualization; if omitted, one will be inferred
    progressMax: { type: Number, default: null }
  },

  computed: {
    numericValue() {
      const n = Number(this.value);
      return Number.isFinite(n) ? n : null;
    },
    displayValue() {
      if (this.numericValue === null) return '—';
      let str = this.numericValue.toFixed(this.decimals);
      if (this.thousandSep) {
        // simple thousands formatting for integers; keep decimals as-is
        const [intPart, decPart] = str.split('.');
        const withSep = Number(intPart).toLocaleString();
        return decPart ? `${withSep}.${decPart}` : withSep;
      }
      return str;
    },
    goalText() {
      const { comparator, target } = this.goal;
      if (comparator === '~') return `≈ ${this.formatTarget(target)}`;
      return `${comparator} ${this.formatTarget(target)}`;
    },
    status() {
      // good / warn / bad based on goal
      const v = this.numericValue;
      if (v === null) return 'neutral';

      const { comparator, target, tolerance = 0 } = this.goal;

      if (comparator === '<=') {
        if (v <= target) return 'good';
        // simple 10% band warning
        return v <= target * 1.25 ? 'warn' : 'bad';
      }
      if (comparator === '>=') {
        if (v >= target) return 'good';
        return v >= target * 0.8 ? 'warn' : 'bad';
      }
      // "~" approx equal within tolerance
      const diff = Math.abs(v - target);
      if (diff <= tolerance) return 'good';
      // warn if within 2x tolerance
      return diff <= (tolerance * 2) ? 'warn' : 'bad';
    },
    statusClass() {
      // map to your palette classes
      if (this.status === 'good') return 'btech-pill btech-fill-success';
      if (this.status === 'warn') return 'btech-pill btech-fill-warning';
      if (this.status === 'bad')  return 'btech-pill btech-fill-danger';
      return 'btech-pill btech-fill-muted';
    },
    progressNow() {
      // Normalize a 0-100 width for the mini bar, relative to the target.
      const v = this.numericValue;
      const { comparator, target, betterDirection = 'lower' } = this.goal;
      if (v === null) return 0;

      const max = this.progressMax ?? (target * 2 || 1); // simple inferred max
      let pct = 0;

      if (betterDirection === 'lower') {
        // 0 = perfect 0, 100 = bad vs inferred max; invert so lower is better (fills less)
        const clamped = Math.max(0, Math.min(max, v));
        pct = (clamped / max) * 100;
      } else if (betterDirection === 'higher') {
        // higher is better; fill towards target/max
        const clamped = Math.max(0, Math.min(max, v));
        pct = (clamped / max) * 100;
      } else { // 'near'
        // center at target, grow as you move away
        const maxDiff = this.progressMax ?? (target || 1);
        const diff = Math.min(maxDiff, Math.abs(v - target));
        pct = (diff / maxDiff) * 100;
      }

      // For 'lower', we might want a *smaller* fill to look "better".
      // We'll keep raw pct and just color-encode via statusClass; simple & consistent.
      return Math.max(0, Math.min(100, Math.round(pct)));
    }
  },

  methods: {
    formatTarget(n) {
      return Number(n).toFixed(this.decimals);
    }
  },

  template: `
    <div class="btech-tile" :title="title">
      <div class="btech-row" style="margin-bottom:4px; align-items:center;">
        <div class="btech-kpi-label">{{ label }}</div>
        <span :class="statusClass" style="margin-left:auto;">
          Goal: {{ goalText }}
        </span>
      </div>

      <div class="btech-kpi-value">
        {{ displayValue }}
        <span v-if="unit" class="btech-muted">{{ unit }}</span>
      </div>

      <div v-if="showProgress" class="btech-progress" role="presentation" style="margin-top:6px;">
        <div
          class="fill"
          :class="{
            'btech-fill-success': status === 'good',
            'btech-fill-warning': status === 'warn',
            'btech-fill-danger':  status === 'bad',
            'btech-fill-muted':   status === 'neutral'
          }"
          :style="{ width: progressNow + '%' }"
          role="progressbar"
          :aria-valuenow="progressNow"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="label + ' progress ' + progressNow + '%'"
        ></div>
      </div>
    </div>
  `
});