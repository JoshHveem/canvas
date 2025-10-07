Vue.component('department-course-surveys', {
  props: {
    surveys: { type: Object, default: {}, required: true },
    year: { type: [String, Number], default: null }
  },

  computed: {
    summary() { return this.surveys?.summary ?? ''; },
    yearLabel() { return this.year ?? '—'; },
    numSurveys() { return Number(this.surveys?.num_surveys || 0); },

    // Normalize likerts specifically for COURSE surveys
    // 1) If server sent surveys.likerts as an array, use that.
    // 2) Else, construct from flat fields in a fixed display order.
    likerts() {
      const arr = Array.isArray(this.surveys?.likerts) ? this.surveys.likerts : null;
      if (arr && arr.length) return arr;

      const src = this.surveys || {};
      const map = [
        { name: 'Objectives',             key: 'likert_objectives' },
        { name: 'Workplace Relevance',    key: 'likert_workplace_relevance' },
        { name: 'Examples',               key: 'likert_examples' },
        { name: 'Recommendable',          key: 'likert_recommendable' },
      ];

      const out = [];
      for (const { name, key } of map) {
        const score = Number(src[key]);
        if (!Number.isNaN(score) && score !== null && score !== undefined) {
          out.push({ name, score });
        }
      }
      return out;
    },

    // If has_recommendations is stored as a proportion (0-1), show percent.
    // If it's a count, you can swap this to compute (count / numSurveys) * 100.
    recPct() {
      const v = Number(this.surveys?.has_recommendations || 0);
      const pct = v <= 1 ? v * 100 : v; // auto-handle if already in 0–100
      return Math.max(0, Math.min(100, Math.round(pct)));
    },

    avgLikertPct() {
      if (!this.likerts.length) return 0;
      const avg = this.likerts.reduce((s, x) => s + Number(x?.score || 0), 0) / this.likerts.length;
      // scores are 0–1, display as %
      return Math.max(0, Math.min(100, Math.round(avg * 1000) / 10)); // one decimal
    }
  },

  template: `
  <div class="btech-card btech-theme" aria-label="Student surveys overview card">
    <div class="btech-row" style="margin-bottom:12px;">
      <h4 class="btech-card-title">Course Evaluations</h4>
      <span class="btech-pill" :title="'Filters: ' + yearLabel">{{ yearLabel }}</span>
    </div>

    <div class="btech-grid-3" style="margin-bottom:12px;">
      <div class="btech-tile" title="Total number of survey responses">
        <div class="btech-kpi-label">Responses</div>
        <div class="btech-kpi-value">{{ numSurveys.toLocaleString() }}</div>
      </div>

      <div class="btech-tile" title="Average of all Likert scores (0–1)">
        <div class="btech-kpi-label">Avg Likert</div>
        <div class="btech-kpi-value">{{ avgLikertPct.toFixed(1) }}<span class="btech-muted">%</span></div>
      </div>
    </div>

    <!-- Likert Breakdown -->
    <div class="btech-tile" style="margin-bottom:8px;" title="Breakdown of each Likert item">
      <div class="btech-row" style="margin-bottom:6px;">
        <div style="font-size:12px; color:#374151; font-weight:600;">Likert Breakdown</div>
        <div class="btech-muted">0%–100%</div>
      </div>

     <div v-if="likerts.length">
        <div v-for="(item, idx) in likerts" :key="idx" style="margin-bottom:10px;">
          <div class="btech-row" style="margin-bottom:6px;">
            <div style="font-size:12px; color:#374151; font-weight:600;">
              {{ item.name || 'Item ' + (idx+1) }}
            </div>
            <div style="font-size:12px; color:#111827; font-weight:700;">
              {{ Math.round(Number(item.score || 0) * 100) }}%
            </div>
          </div>

          <!-- New reusable bar -->
          <btech-fill-bar
            :value="Number(item.score || 0)"
            :goal="1"
            mode="gte"
            :height="6"
            label-pos="right"
          />
        </div>
      </div> 
      <div v-else class="btech-muted">No Likert items provided.</div>
    </div>

    <div class="btech-tile" style="margin-bottom:8px;" title="Breakdown of each Likert item">
      <div class="btech-row" style="margin-bottom:6px;">
        <div style="font-size:12px; color:#374151; font-weight:600;">Free Response Summary</div>
      </div>
      <div class="btech-row" style="margin-bottom:6px;">
        <div style="font-size:12px; color:#374151; font-weight:600;">{{ summary }}</div>
      </div>
    </div>

    <div class="btech-muted">
      <span style="display:inline-block; margin-right:8px;">▲ Higher Avg Likert indicates better satisfaction</span>
      <span style="display:inline-block; margin-right:8px;">• All Likert scores are scaled 0–100% for display</span>
    </div>
  </div>

  <div class="btech-card btech-theme" v-else>
    <div class="btech-muted" style="text-align:center;">No survey data yet.</div>
  </div>
  `
});

Vue.component('btech-fill-bar', {
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
        if (v >= 0.95) return this.colors.green;
        if (v >= 0.9) return this.colors.yellow;
        if (v >= 0.8) return this.colors.orange;
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
