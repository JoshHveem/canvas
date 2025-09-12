Vue.component('department-statistics', {
  props: {
    statistics: { type: Object, default: {}, required: true },
    year: { type: [String, Number], default: null }
  },

  computed: {
    summary() { return this.surveys?.summary ?? ''; },
    yearLabel() { return this.year ?? '—'; },
    
  },

  template: `
    <div
        class="btech-card btech-theme"
        v-if="statistics"
        aria-label="Statistics"
    >
        <!-- Header -->
        <div class="btech-row" style="margin-bottom:12px;">
            <h4 class="btech-card-title">Statistics</h4>
            <span class="btech-pill" :title="'Filters: ' + (year || '')">
            {{ year || '—' }}
            </span>
        </div>

        <!-- KPI Tiles -->
        <div class="btech-grid-3" style="margin-bottom:12px;">
            <kpi-tile
              label="CS Certificates Awarded"
              :value="statistics.cs_certificates"
              :decimals="0"
              title="CS Certificates"
            />
            <kpi-tile
              label="HS Certificates Awarded"
              :value="statistics.hs_certificates"
              :decimals="0"
              title="HS Certificates"
            />
        </div>
    </div>
  `
});
