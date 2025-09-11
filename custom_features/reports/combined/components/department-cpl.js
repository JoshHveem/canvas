Vue.component('department-cpl', {
  props: {
    cpl: { type: Object, default: {}, required: true },
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
              label="Completion"
              :value="cpl.completion * 100"
              unit="%"
              :decimals="0"
              :goal="{ comparator:'gt', target:60, label:'>= 60' }"
              title="Completion"
            />
            <kpi-tile
              label="Placement"
              :value="cpl.placement * 100"
              unit="%"
              :decimals="0"
              :goal="{ comparator:'gt', target:70, label:'>= 70' }"
              title="Placement"
            />
            <kpi-tile
              v-if="cpl.licensure > 0"
              label="Licensure"
              :value="cpl.licensure * 100"
              unit="%"
              :decimals="0"
              :goal="{ comparator:'gt', target:70, label:'>= 70' }"
              title="Licensure"
            />
        </div>
    </div>
  `
});
