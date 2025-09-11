/* ==========================
 * Goal Pill (inline styles)
 * ========================== */
Vue.component('goal-pill', {
  props: {
    comparator: { type: String, default: 'lt' }, // 'lt' | 'lte' | 'gt' | 'gte' | 'between'
    value:      { type: Number, default: null },  // current metric value
    target:     { type: Number, default: null },  // for lt/lte/gt/gte
    min:        { type: Number, default: null },  // for between
    max:        { type: Number, default: null },  // for between
    label:      { type: String, default: '' },    // text to show (e.g. "< 2 days")
    // Optional color overrides
    colorGood:  { type: String, default: '#10b981' }, // green
    colorBad:   { type: String, default: '#ef4444' }, // red
    colorMute:  { type: String, default: '#9ca3af' }  // gray
  },
  computed: {
    meets() {
      const v = this.value;
      if (v == null || Number.isNaN(v)) return null;
      switch (this.comparator) {
        case 'lt':  return v <  this.target;
        case 'lte': return v <= this.target;
        case 'gt':  return v >  this.target;
        case 'gte': return v >= this.target;
        case 'between': return v >= this.min && v <= this.max;
        default: return null;
      }
    },
    pillStyle() {
      const bg =
        this.value == null ? this.colorMute :
        this.meets ? this.colorGood : this.colorBad;

      return {
        display: 'inline-block',
        marginLeft: '6px',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
        lineHeight: '16px',
        color: '#ffffff',
        background: bg,
        whiteSpace: 'nowrap',
        verticalAlign: 'middle'
      };
    }
  },
  template: `
    <span :style="pillStyle">
      Goal: {{ label }}
    </span>
  `
});

/* ==========================
 * KPI Tile (inline styles)
 * ========================== */
Vue.component('kpi-tile', {
  props: {
    label: { type: String, required: true },
    value: { type: [Number, String], default: null },
    unit:  { type: String, default: '' },
    decimals: { type: Number, default: 1 },
    title: { type: String, default: '' },

    /* Pass-through props for the inner goal pill */
    goalComparator: { type: String, default: null }, // e.g. 'lt', 'between'
    goalTarget:     { type: Number, default: null },
    goalMin:        { type: Number, default: null },
    goalMax:        { type: Number, default: null },
    goalLabel:      { type: String, default: '' },   // e.g. "< 2 days"

    // Optional: lightly tint the value row when a status is computed from bands (kept simple)
    bands: { type: Array, default: () => [] } // [{ max: 2, status: 'good' }, { max: 3, status: 'warn' }, { status: 'bad' }]
  },

  computed: {
    numericValue() {
      const n = Number(this.value);
      return Number.isFinite(n) ? n : null;
    },
    displayValue() {
      if (this.numericValue === null) return '—';
      return typeof this.value === 'string'
        ? this.value
        : this.numericValue.toFixed(this.decimals);
    },
    valueRowStyle() {
      // Subtle background based on bands, completely optional
      const v = this.numericValue;
      let bg = 'transparent';
      if (v !== null && this.bands.length) {
        let status = 'neutral';
        for (const band of this.bands) {
          if (band.max === undefined || v <= band.max) { status = band.status; break; }
        }
        if (status === 'good') bg = 'rgba(16,185,129,0.08)';   // green tint
        if (status === 'warn') bg = 'rgba(245,158,11,0.10)';   // amber tint
        if (status === 'bad')  bg = 'rgba(239,68,68,0.08)';    // red tint
      }
      return {
        fontSize: '22px',
        fontWeight: 700,
        color: '#111827',
        display: 'flex',
        alignItems: 'baseline',
        gap: '6px',
        padding: '4px 6px',
        borderRadius: '8px',
        background: bg
      };
    },
    tileStyle() {
      return {
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        padding: '12px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        background: '#ffffff'
      };
    },
    labelRowStyle() {
      return {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '6px'
      };
    },
    labelStyle() {
      return {
        fontSize: '12px',
        color: '#374151',
        fontWeight: 600,
        lineHeight: '16px'
      };
    },
    unitStyle() {
      return {
        fontSize: '12px',
        color: '#6b7280',
        fontWeight: 400
      };
    }
  },

  template: `
    <div :style="tileStyle" :title="title">
      <div :style="labelRowStyle">
        <div :style="labelStyle">{{ label }}</div>

        <!-- Inline goal pill placed inside the tile's label row -->
        <goal-pill
          v-if="goalComparator"
          :comparator="goalComparator"
          :value="numericValue"
          :target="goalTarget"
          :min="goalMin"
          :max="goalMax"
          :label="goalLabel"
        />
      </div>

      <div :style="valueRowStyle">
        <span>{{ displayValue }}</span>
        <span v-if="unit" :style="unitStyle">{{ unit }}</span>
      </div>
    </div>
  `
});
