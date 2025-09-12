Vue.component('department-coe-entry', {
  props: {
    coe:  { type: Object, required: true },
    year: { type: [String, Number], default: null }
  },
  computed: {
    // Basic fields (defensive coercion)
    campus() { return this.coe?.campus || '—'; },
    yearLabel() { return Number(this.coe?.academic_year) || this.year || '—'; },
    employmentSkills() {
      const n = Number(this.coe?.employment_skills);
      return Number.isFinite(n) ? n : 0;
    },
    safety() {
      const n = Number(this.coe?.safety);
      return Number.isFinite(n) ? n : 0;
    },

    // Normalize assessments from either:
    //   assessments: [{type, count}]  OR  flat fields assessments_<type>: <count>
    assessments() {
      const a = Array.isArray(this.coe?.assessments) ? this.coe.assessments : null;
      if (a && a.length) {
        return a
          .map(x => ({ type: String(x.type || ''), count: Number(x.count || 0) }))
          .filter(x => x.type && Number.isFinite(x.count));
      }

      // fall back to flat fields (e.g., assessments_quizzes)
      const out = [];
      for (const k in (this.coe || {})) {
        if (!k || !k.startsWith('assessments_')) continue;
        // ignore a total key if present
        if (k === 'assessments_total_valid_assignments') continue;
        const type = k.replace(/^assessments_/, '').replace(/_/g, ' ');
        const cnt = Number(this.coe[k]);
        if (Number.isFinite(cnt)) out.push({ type, count: cnt });
      }
      return out;
    },

    // Assessment types meeting the "3 or more" threshold
    strongTypes() {
      return this.assessments.filter(a => a.count >= 3);
    },

    // Targets
    meetsEmploymentSkills() { return this.employmentSkills >= 3; },
    meetsSafety()          { return this.safety >= 3; },
    meetsAssessmentMix()   { return this.strongTypes.length >= 3; },

    // Inline style helpers (muted/green/red)
    pillStyleBase() {
      return 'display:inline-block; padding:2px 6px; border-radius:9999px; font-size:12px; font-weight:600;';
    },
    okBg()     { return '#059669'; }, // green-600
    badBg()    { return '#B91C1C'; }, // red-700
    mutedBg()  { return '#E5E7EB'; }, // gray-200
    white()    { return '#FFFFFF'; },
    darkText() { return '#111827'; },

    empPillStyle() {
      const ok = this.meetsEmploymentSkills;
      const bg = ok ? this.okBg : this.badBg;
      const fg = this.white();
      return `${this.pillStyleBase} background:${bg}; color:${fg}; margin-left:6px;`;
    },
    safPillStyle() {
      const ok = this.meetsSafety;
      const bg = ok ? this.okBg : this.badBg;
      const fg = this.white();
      return `${this.pillStyleBase} background:${bg}; color:${fg}; margin-left:6px;`;
    },
    mixPillStyle() {
      const ok = this.meetsAssessmentMix;
      const bg = ok ? this.okBg : this.badBg;
      const fg = this.white();
      return `${this.pillStyleBase} background:${bg}; color:${fg}; margin-left:6px;`;
    },

    // table/grid widths
    kpiGridStyle() {
      return 'display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:8px; margin-bottom:8px;';
    },
    tileStyle() {
      return 'border:1px solid #E5E7EB; border-radius:8px; padding:10px;';
    },
    labelStyle() {
      return 'font-size:12px; color:#374151; font-weight:600; margin-bottom:4px;';
    },
    valueStyle() {
      return 'font-size:18px; font-weight:700;';
    },
    headerRowStyle() {
      return 'display:flex; align-items:center; gap:8px; margin-bottom:8px;';
    },
    titleStyle() {
      return 'margin:0; font-size:16px;';
    },

    // Assessment tag pill styles
    tagPillBase() {
      return 'display:inline-block; font-size:12px; font-weight:600; padding:2px 6px; border-radius:9999px; margin:2px;';
    }
  },
  methods: {
    // Assessment pill style: green if >=3, gray otherwise
    assessPillStyle(count) {
      const ok = Number(count) >= 3;
      const bg = ok ? this.okBg : this.mutedBg;
      const fg = ok ? this.white() : this.darkText;
      return `${this.tagPillBase} background:${bg}; color:${fg};`;
    }
  },
  template: `
    <div class="btech-card btech-theme" style="margin-bottom:12px; padding:12px;" aria-label="COE Entry">
      <!-- Header -->
      <div :style="headerRowStyle">
        <h4 :style="titleStyle">COE — {{ campus }}</h4>
        <div style="flex:1;"></div>
        <span class="btech-pill" style="margin-left:6px;">Year: {{ yearLabel }}</span>
      </div>

      <!-- KPI row -->
      <div :style="kpiGridStyle">
        <!-- Employment Skills -->
        <div :style="tileStyle" title="Minimum of 3 Employment Skills assignments">
          <div :style="labelStyle">Employment Skills</div>
          <div :style="valueStyle">
            {{ employmentSkills }}
            <span :style="empPillStyle">Goal: ≥ 3</span>
          </div>
        </div>

        <!-- Safety -->
        <div :style="tileStyle" title="Minimum of 3 Safety assignments">
          <div :style="labelStyle">Safety</div>
          <div :style="valueStyle">
            {{ safety }}
            <span :style="safPillStyle">Goal: ≥ 3</span>
          </div>
        </div>

        <!-- Assessment Mix -->
        <div :style="tileStyle" title="At least 3 distinct assessment types with count ≥ 3">
          <div :style="labelStyle">Assessment Mix</div>
          <div :style="valueStyle">
            {{ strongTypes.length }} types ≥ 3
            <span :style="mixPillStyle">Goal: ≥ 3 types</span>
          </div>
        </div>
      </div>

      <!-- Assessment type breakdown -->
      <div :style="tileStyle" title="Counts for each assessment type">
        <div :style="labelStyle">Assessment Breakdown</div>
        <div style="display:flex; flex-wrap:wrap;">
          <span
            v-for="a in assessments"
            :key="a.type"
            :style="assessPillStyle(a.count)"
            :title="a.type + ': ' + a.count"
          >
            {{ a.type }}: {{ a.count }}
          </span>
          <span v-if="!assessments.length" style="font-size:12px; color:#6B7280;">No assessments reported.</span>
        </div>
      </div>
    </div>
  `
});
Vue.component('department-coe', {
  props: {
    coeList: { type: Array, required: true, default: () => [] }, // array of COE rows
    year:    { type: [String, Number], default: null },
    title:   { type: String, default: 'COE' }
  },
  computed: {
    sorted() {
      const arr = [...this.coee]; // typo guard
      return (Array.isArray(this.coeList) ? [...this.coeList] : arr)
        .sort((a, b) => {
          const ya = Number(a?.academic_year || 0), yb = Number(b?.academic_year || 0);
          if (yb !== ya) return yb - ya;
          const ca = (a?.campus || '').toUpperCase();
          const cb = (b?.campus || '').toUpperCase();
          return ca < cb ? -1 : ca > cb ? 1 : 0;
        });
    }
  },
  template: `
    <div class="btech-card btech-theme" aria-label="COE Section" style="padding:12px;">
      <!-- Header -->
      <div style="display:flex; align-items:center; margin-bottom:12px;">
        <h3 class="btech-card-title" style="margin:0;">{{ title }}</h3>
        <div style="flex:1;"></div>
        <span class="btech-pill" style="margin-left:8px;">Total: {{ sorted.length }}</span>
      </div>

      <!-- List -->
      <div v-if="sorted.length">
        <department-coe-entry
          v-for="row in sorted"
          :key="(row.div_code || 'x') + '-' + (row.academic_year || 'y') + '-' + (row.campus || 'z')"
          :coe="row"
          :year="year"
        />
      </div>
      <div v-else class="btech-muted" style="text-align:center; padding:12px;">No COE data available.</div>
    </div>
  `
});
