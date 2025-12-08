/* ===========================
 * Reusable column helper
 * =========================== */
class InstructorSurveysColumn {
  constructor(
    name,
    description,
    width,
    sort_type,                             // 'string' | 'number'
    getContent = (inst) => '',
    style_formula = null,
    getSortValue = null
  ) {
    this.name = name;
    this.description = description;
    this.width = width;
    this.sort_type = sort_type;
    this.sort_state = 0;
    this.visible = true;
    this.getContent = getContent;
    this.style_formula = style_formula;
    this.getSortValueFn = getSortValue;
  }
  get_style(i) { return this.style_formula ? this.style_formula(i) : {}; }
  getSortValue(i) {
    if (typeof this.getSortValueFn === 'function') return this.getSortValueFn(i);
    const raw = this.getContent(i);
    if (this.sort_type === 'number') {
      const n = Number(String(raw ?? '').replace('%','').trim());
      return Number.isFinite(n) ? n : Number.NaN;
    }
    return String(raw ?? '').toUpperCase();
  }
}

/* ===========================
 * Instructors Report (grid, like courses)
 * =========================== */
Vue.component('reports-instructor-surveys', {
  props: {
    instructors: { type: Array, required: true, default: () => [] },
    title: { type: String, default: 'Instructors' },
    year:  { type: [String, Number], default: null },
    filters: {
      type: Object,
      default: () => ({
        year_only: true,        // show only rows for prop:year
        div_code: null          // e.g. 'GEN' (optional)
      })
    },
    goals: {
      type: Object,
      default: () => ({
        attempts_lt: 1.1,
        grade_days_lt: 2,
        comments_gte: 1,
        reply_days_lt: 2,
        rubric_pct_gte: .90 // target 100%
      })
    }
  },

  data() {
    const colors = (window.bridgetools?.colors);

    const pct01 = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? (n * 100).toFixed(0) + '%' : '—';
    };
    const band = (n, goal, goodIfGte = false) => {
      const v = Number(n);
      if (!Number.isFinite(v)) return { backgroundColor: colors.gray, color: colors.black };

      // Tolerances — adjust as needed
      const warn1 = 0.9;  // 90%
      const warn2 = 0.75; // 75%

      let color = colors.red;

      if (goodIfGte) {
        // Higher is better
        if (v >= goal) color = colors.green;
        else if (v >= goal * warn1) color = colors.yellow;
        else if (v >= goal * warn2) color = colors.orange;
      } else {
        // Lower is better
        if (v < goal) color = colors.green;
        else if (v < goal / warn1) color = colors.yellow;
        else if (v < goal / warn2) color = colors.orange;
      }

      return { backgroundColor: color, color: colors.white };
    };


    return {
      colors,
      sort_column: 'Name',
      sort_dir: 1,
      pct01,
      band,
      columns: [
        new InstructorSurveysColumn(
          'Name', 'Instructor name', '1.6fr', 'string',
          i => ((i?.first_name || '') + ' ' + (i?.last_name || '')).trim() || `User ${i?.canvas_user_id || ''}`,
          null,
          i => ((i?.last_name || '') + ' ' + (i?.first_name || '')).toUpperCase() // sort Last, First
        ),
        new InstructorSurveysColumn(
          '# Surveys', 'Total number of surveys submitted for this instructor.', '5rem', 'number',
          i => i?.surveys?.num_surveys ?? 0,
          null,
          i => Number(i?.surveys?.num_surveys ?? 0)
        ),
        this.makeLikertColumn('Availability', 'Availability'),
        this.makeLikertColumn('Clarity', 'Clarity'),
        this.makeLikertColumn('Industry Focused', 'Industry Focused'),
        this.makeLikertColumn('Respectful', 'Respectful'),
        this.makeLikertColumn('Progress Meetings', 'Regular Progress Meetings'),
        this.makeLikertColumn('Timely Grading', 'Timely Grading'),
        this.makeLikertColumn('Feedback', 'Provided Feedback'),
        this.makeLikertColumn('Organized', 'Organized'),
        new InstructorSurveysColumn(
          'AI Summary', 'Summary of all student free response feedback.', '25rem', 'string',
          i => i?.surveys?.summary ?? '',
          null,
          i => (i?.surveys?.summary ?? '').toUpperCase()
        ),
      ]
    };
  },

  computed: {
    visibleColumns() { return this.columns.filter(c => c.visible); },
    visibleRows() {
      let rows = Array.isArray(this.instructors) ? this.instructors.slice() : [];
      if (this.filters.year_only && this.year != null) {
        rows = rows.filter(r => String(r?.academic_year ?? '') === String(this.year));
      }
      if (this.filters.div_code) {
        rows = rows.filter(r => String(r?.div_code ?? '') === String(this.filters.div_code));
      }
      return this.sortRows(rows);
    }
  },

  methods: {
    makeLikertColumn(label, likertName, width = '6rem') {
      return new InstructorSurveysColumn(
        label,
        `Likert score for ${label}`,
        width,
        'number',
        i => {
          const score = this.getLikertScore(i, likertName);
          if (score == null) return '—';
          const n = Number(score);
          return this.pct01(n ?? 0);
          return Number.isFinite(n) ? n.toFixed(2) : '—';
        },
        null,
        i => {
          const score = getLikertScore(i, likertName);
          const n = Number(score);
          return Number.isFinite(n) ? n : Number.NaN;
        }
      )
    },
    getLikertScore(inst, likertName) {
      const arr = inst?.surveys?.likerts ?? [];
      if (!Array.isArray(arr)) return null;

      const match = arr.find(item => item?.name === likertName);
      return match?.score ?? null;
    },

    buildLikertColumnsFromInstructors(instructors) {
      const nameSet = new Set();

      (instructors || []).forEach(inst => {
        const likerts = inst?.surveys?.likerts;
        if (!Array.isArray(likerts)) return;

        likerts.forEach(l => {
          if (l?.name) {
            nameSet.add(l.name);
          }
        });
      });

      const names = Array.from(nameSet).sort((a, b) => a.localeCompare(b));
      return names.map(name => this.makeLikertColumn(name));
    },

    renderBar(decimalVal) {
      const val = Number(decimalVal) || 0;
      const pct = Math.max(0, Math.min(100, val * 100));
      const bgTrack = '#E5E7EB';
      const bgFill  = this.colors.indigo || '#6366F1';

      return `
        <div style="
          width: 90%;
          display:flex;
          align-items:center;
          gap:6px;
        ">
          <div style="
            flex:1;
            height:6px;
            background:${bgTrack};
            border-radius:9999px;
            overflow:hidden;
          ">
            <div style="
              height:100%;
              width:${pct}%;
              background:${bgFill};
              transition:width .3s;
            "></div>
          </div>
        </div>
      `;
    },

    onSelect(inst) {
      this.$emit('select', inst);
    },
    getColumnsWidthsString() { return this.columns.map(c => c.width).join(' '); },
    setSortColumn(name) {
      if (this.sort_column === name) this.sort_dir *= -1;
      else { this.sort_column = name; this.sort_dir = 1; }
      this.columns.forEach(c => c.sort_state = (c.name === name ? this.sort_dir : 0));
    },
    sortRows(rows) {
      const header = this.sort_column;
      const dir = this.sort_dir;
      const col = this.columns.find(c => c.name === header);
      const sortType = col ? col.sort_type : 'string';
      const toKey = v => String(v ?? '').toUpperCase();

      return rows.sort((a, b) => {
        let av = col?.getSortValue(a);
        let bv = col?.getSortValue(b);

        if (sortType === 'number') {
          av = Number(av); bv = Number(bv);
        } else {
          av = toKey(av); bv = toKey(bv);
        }

        const aNaN = Number.isNaN(av), bNaN = Number.isNaN(bv);
        let comp = 0;
        if (aNaN && bNaN) comp = 0;
        else if (aNaN) comp = 1;
        else if (bNaN) comp = -1;
        else comp = av > bv ? 1 : (av < bv ? -1 : 0);

        return comp * dir;
      });
    },
    // light wrappers to mimic your courses header/pills
    headerRowStyle() { return { display:'grid', alignItems:'center', fontSize:'.75rem', userSelect:'none', gridTemplateColumns:this.getColumnsWidthsString(), padding:'.25rem .5rem' }; },
    rowStyle(i) { return { display:'grid', alignItems:'center', fontSize:'.75rem', lineHeight:'1.5rem', gridTemplateColumns:this.getColumnsWidthsString(), padding:'.25rem .5rem', backgroundColor:(i%2)?'#FFFFFF':'#F8F8F8' }; },
  },

  template: `
    <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
      <!-- Header -->
      <div class="btech-row" style="align-items:center; margin-bottom:8px;">
        <h4 class="btech-card-title" style="margin:0;">{{ title }}</h4>
        <div style="flex:1;"></div>
        <span v-if="year" class="btech-pill" style="margin-left:8px;">Year: {{ year }}</span>
        <span class="btech-pill" style="margin-left:8px;">Rows: {{ visibleRows.length }}</span>
      </div>

      <!-- Column headers -->
      <div :style="headerRowStyle()">
        <div v-for="col in visibleColumns" :key="col.name" :title="col.description"
             style="display:inline-block; grid-template-columns:auto 1rem; cursor:pointer;"
             @click="setSortColumn(col.name)">
          <span><b>{{ col.name }}</b></span>
          <span style="margin-left:.25rem;">
            <svg style="width:.75rem;height:.75rem;" viewBox="0 0 490 490" aria-hidden="true">
              <g>
                <polygon :style="{ fill: col.sort_state < 0 ? '#000' : '#E0E0E0' }"
                  points="85.877,154.014 85.877,428.309 131.706,428.309 131.706,154.014 180.497,221.213 217.584,194.27 108.792,44.46 0,194.27 37.087,221.213"/>
                <polygon :style="{ fill: col.sort_state > 0 ? '#000' : '#E0E0E0' }"
                  points="404.13,335.988 404.13,61.691 358.301,61.691 358.301,335.99 309.503,268.787 272.416,295.73 381.216,445.54 490,295.715 452.913,268.802"/>
              </g>
            </svg>
          </span>
        </div>
      </div>

      <!-- Rows -->
      <div 
        v-for="(inst, i) in visibleRows" 
        :key="(inst.canvas_user_id || 'u') + '-' + i" 
        :style="rowStyle(i)"
        style="cursor:pointer;"
        @click="onSelect(inst)"
        >
        <div 
          v-for="col in visibleColumns" 
          :key="col.name"
          style="display:inline-block; white-space:nowrap;"
        >
          <span v-if="col.name === 'Name'">
            <a :href="'/users/' + (inst.canvas_user_id || '')" target="_blank" @click.stop>{{ col.getContent(inst) }}</a>
          </span>
          <span v-else :class="col.style_formula ? 'btech-pill-text' : ''" :style="col.get_style(inst)"
                v-html="col.getContent(inst)"></span>
        </div>
      </div>
    </div>
  `
});
