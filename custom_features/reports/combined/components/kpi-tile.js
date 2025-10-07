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
    bands:     { type: Array, default: () => [] }, // e.g. [{ max: 2, status:'good' }, { max: 3, status:'warn' }, { status:'bad' }]
    override:    { type: String, default: undefined } 
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
      if (this.override !== undefined) return this.override;
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

Vue.component('kpi-fill-bar', {
  props: {
    value: { type: [Number, String], required: true }, // 0–1 or 0–100
    goal:  { type: Number, default: 1 },               // target (1 for 0–1 scales, 100 for % scales)
    mode:  { type: String, default: 'gte' },           // 'gte' (higher is better) | 'lt' (lower is better)
    height:{ type: [Number, String], default: 6 },     // px
    showLabel: { type: Boolean, default: true },       // show % label
    labelPos: { type: String, default: 'right' },      // 'right' | 'below' | 'none'
  },
  computed: {
    colors() {
      return window.bridgetools?.colors;
    },
    // normalize value to percent (0–100), but compare with goal in same units
    valNum() {
      const n = Number(this.value);
      if (!Number.isFinite(n)) return NaN;
      // If value <=1 and goal <=1, treat as 0–1 scale; else assume 0–100 scale
      const isUnit = this.goal <= 1 && n <= 1;
      return isUnit ? Math.max(0, Math.min(100, n * 100)) : Math.max(0, Math.min(100, n));
    },
    goalNum() {
      // goal in % space, matching val normalization
      const g = Number(this.goal);
      if (!Number.isFinite(g)) return NaN;
      return (g <= 1 ? g * 100 : g);
    },
    fillStyle() {
      return {
        height: '100%',
        width: `${this.valNum}%`,
        background: this.fillColor,
        transition: 'width .25s ease'
      };
    },
    trackStyle() {
      return {
        flex: 1,
        height: (typeof this.height === 'number' ? `${this.height}px` : String(this.height)),
        background: this.colors.gray,
        borderRadius: '9999px',
        overflow: 'hidden'
      };
    },
    wrapperStyle() {
      return {
        width:'100%',
        display:'flex',
        alignItems: (this.labelPos === 'below' ? 'stretch' : 'center'),
        gap: (this.labelPos === 'below' ? '0' : '6px'),
        flexDirection: (this.labelPos === 'below' ? 'column' : 'row')
      };
    },
    labelStyle() {
      return {
        width: (this.labelPos === 'right' ? '2.5rem' : 'auto'),
        textAlign: (this.labelPos === 'right' ? 'right' : 'center'),
        fontSize: '.75rem',
        fontWeight: 700,
        color: this.colors.black
      };
    },
    // color logic with 0.9 / 0.75 bands
    fillColor() {
      const v = this.valNum;  // % space
      const g = this.goalNum; // % space
      if (!Number.isFinite(v) || !Number.isFinite(g)) return this.colors.gray;

      const warn1 = 0.9;  // 90%
      const warn2 = 0.75; // 75%

      if (this.mode === 'gte') {
        if (v >= 95) return this.colors.green;
        if (v >= 90) return this.colors.yellow;
        if (v >= 80) return this.colors.orange;
        return this.colors.red;
      } else { // 'lt' — lower is better
        if (v < g) return this.colors.green;
        if (v < g / warn1) return this.colors.yellow; // ~11% worse than goal
        if (v < g / warn2) return this.colors.orange; // ~33% worse than goal
        return this.colors.red;
      }
    },
    ariaNow() { return Math.round(this.valNum); },
    labelText() { return `${Math.round(this.valNum)}%`; }
  },
  template: `
    <div :style="wrapperStyle">
      <div :style="trackStyle" role="presentation">
        <div :style="fillStyle"></div>
      </div>
      <div v-if="showLabel && labelPos === 'right'" :style="labelStyle">{{ labelText }}</div>
      <div v-if="showLabel && labelPos === 'below'" :style="labelStyle" style="margin-top:3px;">{{ labelText }}</div>
      <div class="sr-only" role="progressbar" :aria-valuenow="ariaNow" aria-valuemin="0" aria-valuemax="100"></div>
    </div>
  `
});