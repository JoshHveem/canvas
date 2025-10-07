Vue.component('department-instructor-surveys', {
  props: {
    surveys: { // maps from :surveys-data or :survey-metrics (kebab → camel)
      type: Object,
      default: {},
      required: true
    },
    year: { type: [String, Number], default: null }
  },
  computed: {
    summary() { return this.surveys.summary; },
    yearLabel() { return this.year ?? '—'; },
    numSurveys() { return Number(this.surveys?.num_surveys || 0); },
    likerts() { return Array.isArray(this.surveys?.likerts) ? this.surveys.likerts : []; },
    recPct() {
      const v = Number(this.surveys?.has_recommendations || 0);
      return Math.max(0, Math.min(100, Math.round(v * 100)));
    },
    avgLikertPct() {
      if (!this.likerts.length) return 0;
      const avg = this.likerts.reduce((s, x) => s + Number(x?.score || 0), 0) / this.likerts.length;
      return Math.max(0, Math.min(100, Math.round(avg * 1000) / 10)); // one decimal
    }
  },
  template: `
  <div class="btech-card btech-theme" aria-label="Student surveys overview card">
    <div class="btech-row" style="margin-bottom:12px;">
      <h4 class="btech-card-title">Instructor Evaluations</h4>
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
    <!-- Likert Breakdown -->
      <div class="btech-tile" style="margin-bottom:8px;" title="Breakdown of each Likert item">
        <div class="btech-row" style="margin-bottom:6px;">
          <div style="font-size:12px; color:#374151; font-weight:600;">Likert Breakdown</div>
          <div class="btech-muted">0%–100%</div>
        </div>

        <div v-if="likerts.length">
          <div v-for="(item, idx) in likerts" :key="idx" style="margin-bottom:10px;">
            <div class="btech-row" style="margin-bottom:6px;">
              <div style="font-size:12px; color:#374151; font-weight:600;">{{ item.name || 'Item ' + (idx+1) }}</div>
              <div style="font-size:12px; color:#111827; font-weight:700;">{{ Math.round(Number(item.score || 0) * 100) }}%</div>
            </div>

            <!-- New KPI bar: score is 0–1, higher is better, goal=1 -->
            <kpi-fill-bar
              :value="Number(item.score || 0)"
              :goal="1"
              mode="gte"
              :height="6"
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