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
    override:    { type: String, default: undefined },
    // Optional color overrides
  },
  data() {
    return {
      colors: bridgetools.colors
    }
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
        this.value == null ? this.colors.gray:
        this.meets ? this.colors.green : this.colors.red;

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
    label:     { type: String, required: true },
    value:     { type: [Number, String], default: null },
    unit:      { type: String, default: '' },
    decimals:  { type: Number, default: 1 },
    title:     { type: String, default: '' },

    // Provide to show a pill (omit or null to hide)
    // goal = { comparator: 'lt'|'lte'|'gt'|'gte'|'between',
    //          target: Number, min: Number, max: Number, label: String }
    goal:      { type: Object, default: null },

    // Optional subtle status tint via bands (kept simple)
    bands:     { type: Array, default: () => [] } // e.g. [{ max: 2, status:'good' }, { max: 3, status:'warn' }, { status:'bad' }]
  },

  data() {
    return {
      colors: bridgetools.colors
    }
  },
  computed: {
    nValue() {
      const n = Number(this.value);
      return Number.isFinite(n) ? n : null;
    },
    displayValue() {
      console.log(this.override);
      if (this.override !== undefined) return override;
      if (this.nValue === null) return (typeof this.value === 'string' ? this.value : '—');
      return typeof this.value === 'string' ? this.value : this.nValue.toFixed(this.decimals);
    },

    // ---- goal pill logic ----
    meetsGoal() {
      if (!this.goal || this.nValue == null) return null;
      const g = this.goal;
      const v = this.nValue;
      switch ((g.comparator || '').toLowerCase()) {
        case 'lt':  return v <  g.target;
        case 'lte': return v <= g.target;
        case 'gt':  return v >  g.target;
        case 'gte': return v >= g.target;
        case 'between': return v >= g.min && v <= g.max;
        default: return null;
      }
    },
    pillStyle() {
      if (!this.goal) return {};
      const good = this.colors.green, bad = this.colors.red, mute = this.colors.gray;
      const bg = (this.nValue == null) ? mute : (this.meetsGoal ? good : bad);
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
    },

    // ---- visuals ----
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
      return { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' };
    },
    labelStyle() {
      return { fontSize: '12px', color: '#374151', fontWeight: 600, lineHeight: '16px' };
    },
    unitStyle() {
      return { fontSize: '12px', color: '#6b7280', fontWeight: 400 };
    },
    valueRowStyle() {
      // optional tint from bands
      const v = this.nValue;
      let bg = 'transparent';
      if (v !== null && this.bands.length) {
        let status = 'neutral';
        for (const b of this.bands) { if (b.max === undefined || v <= b.max) { status = b.status; break; } }
        if (status === 'good') bg = 'rgba(16,185,129,0.08)';
        if (status === 'warn') bg = 'rgba(245,158,11,0.10)';
        if (status === 'bad')  bg = 'rgba(239,68,68,0.08)';
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
    }
  },

  template: `
    <div :style="tileStyle" :title="title">
      <div :style="labelRowStyle">
        <div :style="labelStyle">{{ label }}</div>
        <span v-if="goal" :style="pillStyle">Goal: {{ goal.label }}</span>
      </div>

      <div :style="valueRowStyle">
        <span>{{ displayValue }}</span>
        <span v-if="unit" :style="unitStyle">{{ unit }}</span>
      </div>
    </div>
  `
});
