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
        v-if="cpl"
        aria-label="CPL"
    >
        <!-- Header -->
        <div class="btech-row" style="margin-bottom:12px;">
            <h4 class="btech-card-title">Department Overview</h4>
            <span class="btech-pill" :title="'Filters: ' + (year || '')">
            {{ year || '—' }}
            </span>
        </div>

        <!-- KPI Tiles -->
        <div class="btech-grid-3" style="margin-bottom:12px;">
            <kpi-tile
              label="CS Certificates"
              :value="statistics.cs_certificates"
              :decimals="0"
              title="CS Certificates"
            />
            <kpi-tile
              label="HS Certificates"
              :value="statistics.hs_certificates"
              :decimals="0"
              title="HS Certificates"
            />
        </div>
    </div>
  `
});
