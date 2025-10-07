/* ===========================
 * Reusable column helper
 * =========================== */
class InstructorColumn {
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
Vue.component('instructors-report', {
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
        rubric_pct_gte: 1.00 // target 100%
      })
    }
  },

  data() {
    const colors = (window.bridgetools?.colors) || {
      red:'#b20b0f', orange:'#f59e0b', yellow:'#eab308',
      green:'#16a34a', gray:'#e5e7eb', black:'#111827', white:'#fff',
      indigo:'#6366F1'
    };

    const pct01 = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? (n * 100).toFixed(0) + '%' : '—';
    };
    const band = (n, goodIfLt, goodIfGte=false) => {
      const v = Number(n);
      if (!Number.isFinite(v)) return { backgroundColor: colors.gray, color: colors.black };
      if (goodIfGte) {
        return { backgroundColor: (v >= goodIfLt ? colors.green : colors.red), color: colors.white };
      }
      return { backgroundColor: (v < goodIfLt ? colors.green : colors.red), color: colors.white };
    };

    return {
      colors,
      sort_column: 'Name',
      sort_dir: 1,
      columns: [
        new InstructorColumn(
          'Name', 'Instructor name', '1.6fr', 'string',
          i => ((i?.first_name || '') + ' ' + (i?.last_name || '')).trim() || `User ${i?.canvas_user_id || ''}`,
          null,
          i => ((i?.last_name || '') + ' ' + (i?.first_name || '')).toUpperCase() // sort Last, First
        ),
        new InstructorColumn(
          'Year', 'Academic year', '5rem', 'string',
          i => (i?.academic_year ?? '—'),
          null,
          i => String(i?.academic_year ?? '')
        ),
        new InstructorColumn(
          'Assign. Graded', 'Assignments graded', '7rem', 'number',
          i => (Number(i?.grading?.assignments_graded) || 0).toLocaleString(),
          null,
          i => Number(i?.grading?.assignments_graded ?? Number.NaN)
        ),
        new InstructorColumn(
          'Avg Attempts', 'Avg attempts (goal < ' + this?.goals?.attempts_lt + ')', '7rem', 'number',
          i => {
            const v = Number(i?.grading?.average_attempts);
            return Number.isFinite(v) ? v.toFixed(2) : '—';
          },
          i => band(i?.grading?.average_attempts, this.goals.attempts_lt),
          i => Number(i?.grading?.average_attempts ?? Number.NaN)
        ),
        new InstructorColumn(
          'Days to Grade', 'Median days to grade (goal < ' + this?.goals?.grade_days_lt + ')', '7rem', 'number',
          i => {
            const v = Number(i?.grading?.days_to_grade);
            return Number.isFinite(v) ? v.toFixed(1) : '—';
          },
          i => band(i?.grading?.days_to_grade, this.goals.grade_days_lt),
          i => Number(i?.grading?.days_to_grade ?? Number.NaN)
        ),
        new InstructorColumn(
          'Comments/Subm', 'Comments per graded submission (goal ≥ ' + this?.goals?.comments_gte + ')', '8rem', 'number',
          i => {
            const v = Number(i?.grading?.comments_per_submission_graded);
            return Number.isFinite(v) ? v.toFixed(2) : '—';
          },
          i => band(i?.grading?.comments_per_submission_graded, this.goals.comments_gte, /*goodIfGte*/true),
          i => Number(i?.grading?.comments_per_submission_graded ?? Number.NaN)
        ),
        new InstructorColumn(
          'Days to Reply', 'Median days to reply (goal < ' + this?.goals?.reply_days_lt + ')', '7rem', 'number',
          i => {
            const v = Number(i?.interactions?.days_to_reply);
            return Number.isFinite(v) ? v.toFixed(1) : 'N/A';
          },
          i => band(i?.interactions?.days_to_reply, this.goals.reply_days_lt),
          i => Number(i?.interactions?.days_to_reply ?? Number.NaN)
        ),
        new InstructorColumn(
          'Rubric Used', 'Percent graded with rubric (goal 100%)', '7rem', 'number',
          i => pct01(i?.grading?.perc_graded_with_rubric),
          i => band(i?.grading?.perc_graded_with_rubric, 1, /*goodIfGte*/true),
          i => Number(i?.grading?.perc_graded_with_rubric ?? Number.NaN)
        ),
        new InstructorColumn(
          'Dept Share', 'Share of dept support/graded hours', '7rem', 'number',
          i => renderDeptShareBar(i),
          null,
          i => Number(i?.support_hours?.perc_hours_graded ?? Number.NaN)
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
    renderDeptShareBar(inst) {
      const val = Number(inst?.support_hours?.perc_hours_graded) || 0;
      const pct = Math.max(0, Math.min(100, val * 100));
      const bg  = this.colors.indigo || '#6366F1';
      return `
        <div style="width:100%;display:flex;flex-direction:column;">
          <div style="height:6px;background:#E5E7EB;border-radius:9999px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${bg};"></div>
          </div>
          <div style="font-size:.7rem;font-weight:700;color:#111827;margin-top:2px;text-align:center;">${pct.toFixed(0)}%</div>
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
          style="display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;"
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
