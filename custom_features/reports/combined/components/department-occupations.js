/* Single occupation card */
Vue.component('department-occupation', {
  props: {
    occupation: { type: Object, required: true },
    year: { type: [String, Number], default: null }
  },
  computed: {
    title() { return this.occupation?.title || 'Occupation'; },
    soc() { return this.occupation?.soc_code || '—'; },
    desc() { return this.occupation?.description || ''; },
    area() { return this.occupation?.area || ''; },

    currentEmployment() {
      const n = Number(this.occupation?.current_employment);
      return Number.isFinite(n) ? n : null;
    },
    projectedEmployment() {
      const n = Number(this.occupation?.projected_employment);
      return Number.isFinite(n) ? n : null;
    },
    growthAbs() {
      if (this.currentEmployment == null || this.projectedEmployment == null) return null;
      return this.projectedEmployment - this.currentEmployment;
    },
    growthPct() {
      if (this.currentEmployment == null || this.currentEmployment === 0 || this.projectedEmployment == null) return null;
      return (this.projectedEmployment - this.currentEmployment) / this.currentEmployment * 100;
    },

    // NEW: wages
    entryWage() {
      const n = Number(this.occupation?.entry_wage);
      return Number.isFinite(n) ? n : null;
    },
    medianWage() {
      const n = Number(this.occupation?.median_wage);
      return Number.isFinite(n) ? n : null;
    },

    stars() {
      const n = Number(this.occupation?.stars);
      return Number.isFinite(n) ? n : null;
    },
    yearLabel() { return this.year ?? '—'; },

    // Quick star string (★★★★★ with dim for remainder)
    starText() {
      const s = Math.max(0, Math.min(5, Math.round(this.stars || 0)));
      return '★★★★★'.slice(0, s) + '☆☆☆☆☆'.slice(0, 5 - s);
    }
  },
  template: `
    <div class="btech-card btech-theme" style="margin-bottom:12px; padding:12px;" aria-label="Occupation">
      <!-- Header -->
      <div class="btech-row" style="align-items:center; margin-bottom:8px;">
        <h4 class="btech-card-title" style="margin:0; font-size:16px;">{{ title }}</h4>
        <div style="flex:1;"></div>
        <span class="btech-pill" style="margin-left:8px;">SOC: {{ soc }}</span>
        <span class="btech-pill" style="margin-left:8px;">{{ yearLabel }}</span>
        <span v-if="area" class="btech-pill" style="margin-left:8px;">{{ area }}</span>
      </div>

      <!-- Description -->
      <div v-if="desc" style="font-size:12px; color:#374151; margin-bottom:8px; line-height:1.35;">
        {{ desc }}
      </div>

      <!-- KPI Tiles: Row 1 -->
      <div class="btech-grid-3" style="margin-bottom:8px;">
        <kpi-tile
          label="Current Employment"
          :value="currentEmployment"
          :decimals="0"
          unit=""
          title="Estimated number of currently employed"
        />
        <kpi-tile
          label="Projected Employment"
          :value="projectedEmployment"
          :decimals="0"
          unit=""
          title="Estimated number of roles in projection year"
        />
        <kpi-tile
          label="Growth"
          :value="growthPct"
          unit="%"
          :decimals="0"
          :goal="{ comparator:'gt', target:0, label:'> 0% (growing)' }"
          title="Projected growth from current to projection"
        />
      </div>

      <!-- KPI Tiles: Row 2 (NEW) -->
      <div class="btech-grid-3">
        <kpi-tile
          label="Entry Wage (Annual)"
          :value="entryWage"
          :decimals="0"
          unit="$"
          title="Estimated entry-level annual wage"
        />
        <kpi-tile
          label="Median Wage (Annual)"
          :value="medianWage"
          :decimals="0"
          unit="$"
          title="Estimated median annual wage"
        />
        <!-- Stars as a compact KPI -->
        <kpi-tile
          label="Outlook & Pay Rating"
          :value="stars"
          :decimals="0"
          unit="★"
          :goal="{ comparator:'gte', target:4, label:'≥ 4 ★' }"
          title="5-star rating combining outlook and pay"
        />
      </div>
    </div>
  `
});
