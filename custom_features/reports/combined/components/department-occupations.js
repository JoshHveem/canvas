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

      <!-- KPI Tiles -->
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
        <div class="btech-row" style="align-items:center; margin-bottom:4px;"> <div class="btech-kpi-label">Outlook & Pay Rating</div> <goal-pill :value="Number(stars || 0)" :target="4" comparator="gte" label="≥ 4 ★" style="margin-left:6px;" /> </div> <div style="font-size:18px; font-weight:700; letter-spacing:1px;"> {{ starText }} </div>
        
      </div> 
    </div>
  `
});


/* Occupations list (wrapper) */
Vue.component('department-occupations', {
  props: {
    occupations: { type: Array, required: true, default: () => [] },
    year: { type: [String, Number], default: null },
    title: { type: String, default: 'Occupations' }
  },
  computed: {
    yearLabel() { return this.year ?? '—'; },
    sorted() {
      // Sort: stars desc, then projected_employment desc, then title asc
      const copy = [...this.occupations];
      copy.sort((a, b) => {
        const sa = Number(a?.stars || 0), sb = Number(b?.stars || 0);
        if (sb !== sa) return sb - sa;
        const pa = Number(a?.projected_employment || 0), pb = Number(b?.projected_employment || 0);
        if (pb !== pa) return pb - pa;
        const ta = (a?.title || '').toUpperCase();
        const tb = (b?.title || '').toUpperCase();
        return ta < tb ? -1 : ta > tb ? 1 : 0;
      });
      return copy;
    }
  },
  template: `
    <div class="btech-card btech-theme" aria-label="Occupations" style="padding:12px;">
      <!-- Header -->
      <div class="btech-row" style="align-items:center; margin-bottom:12px;">
        <h3 class="btech-card-title" style="margin:0;">{{ title }}</h3>
        <div style="flex:1;"></div>
        <span class="btech-pill" style="margin-left:8px;">Total: {{ sorted.length }}</span>
      </div>

      <!-- List -->
      <div v-if="sorted.length">
        <department-occupation
          v-for="occ in sorted"
          :key="occ.soc_code || occ.title"
          :occupation="occ"
          :year="year"
        />
      </div>
      <div v-else class="btech-muted" style="text-align:center; padding:12px;">No occupations available.</div>
    </div>
  `
});
