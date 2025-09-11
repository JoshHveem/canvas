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
              label="Licensure"
              :value="cpl.licensure * 100"
              unit="%"
              :decimals="0"
              :goal="{ comparator:'gt', target:70, label:'>= 70' }"
              title="Licensure"
            />
            <div class="btech-tile" title="Total number of submissions graded">
            <div class="btech-kpi-label">Placement</div>
            <div class="btech-kpi-value">{{ (cpl.placement * 100 || 0).toLocaleString() }}%</div>
            </div>
            <div class="btech-tile" title="Total number of submissions graded">
            <div class="btech-kpi-label">Licensure</div>
            <div class="btech-kpi-value">{{ (cpl.licensure * 100 || 0).toLocaleString() }}%</div>
            </div>
        </div>
    </div>
  `
});
