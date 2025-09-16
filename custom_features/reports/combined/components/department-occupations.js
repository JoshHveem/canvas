/* Single occupation card */
Vue.component('department-occupation', {
  props: {
    occupation: { type: Object, required: true },
    year: { type: [String, Number], default: null }
  },
  data() {
    return {
      colors: bridgetools.colors
    }
  },
  computed: {
    starPillStyle() {
      // Handle both string colors (e.g. "#10B981") and palette objects (e.g. {500:"#10B981"})
      const pick = c => (typeof c === 'string' ? c : (c?.[500] || c?.base || Object.values(c||{})[0] || '#999'));
      const bg = Number(this.stars || 0) >= 4 ? pick(this.colors.green) : pick(this.colors.red);
      return {
        backgroundColor: bg,
        color: '#fff',
        borderColor: 'transparent'
      };
    },
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
    annualOpenings() {
      const n = Number(this.occupation?.annual_openings);
      return Number.isFinite(n) ? n : null;
    },
    growthDelta() {
      if (this.currentEmployment == null || this.projectedEmployment == null) return null;
      return this.projectedEmployment - this.currentEmployment;
    },
    projectedComposite() {
      // render "current ± delta", e.g. "1,230 + 120" or "1,230 − 80"
      const cur = this.currentEmployment, d = this.growthDelta;
      if (cur == null || d == null) return null;
      const fmt = n => Number(n).toLocaleString();
      const sign = d >= 0 ? '+' : '−'; // U+2212 minus for nicer typography
      return `${fmt(cur)} ${sign} ${fmt(Math.abs(d))}`;
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
    educationText() {
      const s = (this.occupation?.education || '').trim();
      return s || null;
    },
    trainingText() {
      const s = (this.occupation?.training || '').trim();
      return s || null;
    },
    experienceText() {
      const s = (this.occupation?.experience || '').trim();
      return s || null;
    },
    hasRequirements() {
      return !!(this.educationText || this.trainingText || this.experienceText);
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
        <span v-if="area" class="btech-pill" style="margin-left:8px;">{{ area }}</span>
        <span class="btech-pill" :style="starPillStyle" style="margin-left:8px;" title="Projected Growth Outlook and Pay. Goal: >= 4">{{ starText }}</span>
      </div>

      <!-- Description -->
      <div v-if="desc" style="font-size:12px; color:#374151; margin-bottom:8px; line-height:1.35;">
        {{ desc }}
      </div>

      <!-- KPI Tiles -->
      <div class="btech-grid-3" style="margin-bottom:8px;">
        <kpi-tile
          label="Projected Employment Growth"
          :value="growthPct"
          :override="projectedComposite"
          :goal="{ comparator:'gt', target:0, label:'> 0% (growing)' }"
          title="Current employment ± change to reach projected"
        />
        <kpi-tile
          label="Annual Openings"
          :value="annualOpenings"
          :decimals="0"
          unit=""
          :goal="{ comparator:'gt', target:0, label:'> 0' }"
          title="Estimated annual job openings"
        />
        <kpi-tile
          label="Median Wage (Annual)"
          :value="medianWage"
          :decimals="0"
          unit="$"
          title="Estimated median annual wage"
        />
      </div>

      <!-- Requirements -->
      <div
        v-if="hasRequirements"
        class="btech-tile"
        style="background-color: #FFF; padding:8px; border:1px solid #E5E7EB; border-radius:8px; margin-top:8px;"
        aria-label="Job Requirements"
      >
        <div class="btech-grid-3" style="gap:8px;">
          <div v-if="educationText">
            <div class="btech-kpi-label" style="margin-bottom:2px;"><strong>Education</strong></div>
            <div style="font-size:12px; color:#374151; line-height:1.3;">{{ educationText }}</div>
          </div>

          <div v-if="trainingText">
            <div class="btech-kpi-label" style="margin-bottom:2px;"><strong>Training</strong></div>
            <div style="font-size:12px; color:#374151; line-height:1.3;">{{ trainingText }}</div>
          </div>

          <div v-if="experienceText">
            <div class="btech-kpi-label" style="margin-bottom:2px;"><strong>Experience</strong></div>
            <div style="font-size:12px; color:#374151; line-height:1.3;">{{ experienceText }}</div>
          </div>
        </div>
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
