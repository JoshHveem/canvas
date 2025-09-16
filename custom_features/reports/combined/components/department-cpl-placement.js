Vue.component('department-cpl-placement', {
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
            <h4 class="btech-card-title">{{ cpl.program_name }} — {{ cpl.campus }} CPL</h4>
            <span class="btech-pill" :title="'Filters: ' + (year || '')">
            {{ year || '—' }}
            </span>
        </div>

        <!-- KPI Tiles -->
        <div class="btech-grid-3" style="margin-bottom:12px;">
            <kpi-tile
              label="Placement"
              :value="cpl.placement * 100"
              unit="%"
              :decimals="0"
              :goal="{ comparator:'gt', target:70, label:'>= 70' }"
              title="Placement"
            />
            <kpi-tile
              label="Placed"
              :value="cpl.placed"
              :decimals="0"
              title="Placed"
            />
            <kpi-tile
              v-if="cpl.starting_wage"
              label="Starting Wage"
              :value="cpl.starting_wage"
              unit="$"
              :decimals="0"
              title="Starting Wage"
            />
        </div>
    </div>
  `
});
