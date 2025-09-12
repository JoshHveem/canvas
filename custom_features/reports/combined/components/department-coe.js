Vue.component('department-coe-entry', {
  props: {
    coe:  { type: Object, required: true },
    year: { type: [String, Number], default: null }
  },
  data() {
    return {
      colors: {
        ok:    '#059669',  // green-600
        bad:   '#B91C1C',  // red-700
        muted: '#E5E7EB',  // gray-200
        white: '#FFFFFF',
        dark:  '#111827',
      }
    }
  },
  computed: {
    campus()    { return this.coe?.campus || '—'; },
    yearLabel() { return Number(this.coe?.academic_year) || this.year || '—'; },

    employmentSkills() {
      const n = Number(this.coe?.employment_skills);
      return Number.isFinite(n) ? n : 0;
    },
    safety() {
      const n = Number(this.coe?.safety);
      return Number.isFinite(n) ? n : 0;
    },

    // Strict: expect [{ name, count }]
    assessments() {
      const arr = Array.isArray(this.coe?.assessments) ? this.coe.assessments : [];
      return arr
        .map(x => ({ name: String(x?.name || '').trim(), count: Number(x?.count) }))
        .filter(x => x.name && Number.isFinite(x.count));
    },

    strongTypes()         { return this.assessments.filter(a => a.count >= 3); },
    meetsEmploymentSkills(){ return this.employmentSkills >= 3; },
    meetsSafety()          { return this.safety >= 3; },
    meetsAssessmentMix()   { return this.strongTypes.length >= 3; },

    pillStyleBase() { return 'display:inline-block; padding:2px 6px; border-radius:9999px; font-size:12px; font-weight:600;'; },

    empPillStyle() {
      const bg = this.meetsEmploymentSkills ? this.colors.ok : this.colors.bad;
      return `${this.pillStyleBase} background:${bg}; color:${this.colors.white}; margin-left:6px;`;
    },
    safPillStyle() {
      const bg = this.meetsSafety ? this.colors.ok : this.colors.bad;
      return `${this.pillStyleBase} background:${bg}; color:${this.colors.white}; margin-left:6px;`;
    },
    mixPillStyle() {
      const bg = this.meetsAssessmentMix ? this.colors.ok : this.colors.bad;
      return `${this.pillStyleBase} background:${bg}; color:${this.colors.white}; margin-left:6px;`;
    },

    kpiGridStyle()   { return 'display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:8px; margin-bottom:8px;'; },
    tileStyle()      { return 'border:1px solid #E5E7EB; border-radius:8px; padding:10px;'; },
    labelStyle()     { return 'font-size:12px; color:#374151; font-weight:600; margin-bottom:4px;'; },
    valueStyle()     { return 'font-size:18px; font-weight:700;'; },
    headerRowStyle() { return 'display:flex; align-items:center; gap:8px; margin-bottom:8px;'; },
    titleStyle()     { return 'margin:0; font-size:16px;'; },

    tagPillBase() { return 'display:inline-block; font-size:12px; font-weight:600; padding:2px 6px; border-radius:9999px; margin:2px;'; }
  },
  methods: {
    assessPillStyle(count) {
      const ok = Number(count) >= 3;
      const bg = ok ? this.colors.ok : this.colors.muted;
      const fg = ok ? this.colors.white : this.colors.dark;
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
            :key="a.name"
            :style="assessPillStyle(a.count)"
            :title="a.name + ': ' + a.count"
          >
            {{ a.name }}: {{ a.count }}
          </span>
          <span v-if="!assessments.length" style="font-size:12px; color:#6B7280;">No assessments reported.</span>
        </div>
      </div>
    </div>
  `
});
