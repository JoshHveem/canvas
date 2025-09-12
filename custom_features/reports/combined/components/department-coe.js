Vue.component('department-coe-entry', {
  props: {
    coe:  { type: Object, required: true },
    year: { type: [String, Number], default: null }
  },
  data() {
    return {
      colors: bridgetools.colors // expects { green, red, gray, white, black, ... }
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

    // Strict input: [{ name, count }]
    // - normalize name
    // - coerce count
    // - collapse dupes (case-insensitive)
    // - drop zero-count rows
    assessments() {
      const arr = Array.isArray(this.coe?.assessments) ? this.coe.assessments : [];
      const map = new Map(); // key: lowercased name
      for (const raw of arr) {
        const name = String(raw?.name || '').trim();
        const key = name.toLowerCase();
        const count = Number(raw?.count);
        if (!name || !Number.isFinite(count) || count <= 0) continue;
        map.set(key, (map.get(key) || { name, count: 0 }));
        map.get(key).count += count;
      }
      return Array.from(map.values());
    },

    strongTypes()           { return this.assessments.filter(a => a.count >= 3); },
    meetsEmploymentSkills() { return this.employmentSkills >= 3; },
    meetsSafety()           { return this.safety >= 3; },
    meetsAssessmentMix()    { return this.strongTypes.length >= 3; },

    pillStyleBase() { return 'display:inline-block; padding:2px 6px; border-radius:9999px; font-size:12px; font-weight:600;'; },

    empPillStyle() {
      const bg = this.meetsEmploymentSkills ? this.colors.green : this.colors.red;
      return `${this.pillStyleBase} background:${bg}; color:${this.colors.white}; margin-left:6px;`;
    },
    safPillStyle() {
      const bg = this.meetsSafety ? this.colors.green : this.colors.red;
      return `${this.pillStyleBase} background:${bg}; color:${this.colors.white}; margin-left:6px;`;
    },
    mixPillStyle() {
      const bg = this.meetsAssessmentMix ? this.colors.green : this.colors.red;
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
    // green when >= 3; gray otherwise
    assessPillStyle(count) {
      const ok = Number(count) >= 3;
      const bg = ok ? this.colors.green : this.colors.gray;
      const fg = ok ? this.colors.white : this.colors.black;
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



Vue.component('department-coe', {
  props: {
    coeList: { type: Array, required: true, default: () => [] }, // array of COE rows
    year:    { type: [String, Number], default: null },
    title:   { type: String, default: 'COE' }
  },
  computed: {
    sorted() {
      const arr = [...this.coeList]; // typo guard
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
