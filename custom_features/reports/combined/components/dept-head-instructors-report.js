/* ===========================
 * Instructor Overview (rows)
 * =========================== */

/* One instructor row */
Vue.component('instructor-metrics-row', {
  props: {
    // expects: { first_name, last_name, canvas_user_id, div_code, academic_year, grading, support_hours, interactions }
    instructor: { type: Object, required: true },
    goals: {
      type: Object,
      default: () => ({
        attempts_lt: 1.1,
        grade_days_lt: 2,
        comments_gte: 1,
        reply_days_lt: 2,
        rubric_pct_gte: 1.0 // 100%
      })
    }
  },
  computed: {
    // identity
    name() {
      const f = this.instructor?.first_name || '';
      const l = this.instructor?.last_name || '';
      return (f + ' ' + l).trim() || `User ${this.instructor?.canvas_user_id || ''}`;
    },
    year() { return this.instructor?.academic_year || '—'; },
    divCode() { return this.instructor?.div_code || null; },

    // data groups
    g()  { return this.instructor?.grading || {}; },
    sh() { return this.instructor?.support_hours || {}; },
    ix() { return this.instructor?.interactions || {}; },

    // KPIs
    assignmentsGraded() { return Number(this.g?.assignments_graded) || 0; },
    avgAttempts()       { return this.safeNum(this.g?.average_attempts); },
    daysToGrade()       { return this.safeNum(this.g?.days_to_grade); },
    commentsPerSubm()   { return this.safeNum(this.g?.comments_per_submission_graded); },
    rubricPct()         {
      const p = Number(this.g?.perc_graded_with_rubric);
      return Number.isFinite(p) ? p : null; // 0..1
    },
    deptSharePct() {
        console.log(this.sh);
      const p = Number(this.sh?.perc_instructor_support_hours_weighted);
      return Number.isFinite(p) ? p : 0; // 0..1
    },
    daysToReply() { return this.safeNum(this.ix?.days_to_reply); },

    // goal classes
    attemptsClass()     { return this.goalClassLT(this.avgAttempts, this.goals.attempts_lt); },
    daysToGradeClass()  { return this.goalClassLT(this.daysToGrade, this.goals.grade_days_lt); },
    commentsClass()     { return this.goalClassGTE(this.commentsPerSubm, this.goals.comments_gte); },
    replyClass()        { return this.goalClassLT(this.daysToReply, this.goals.reply_days_lt); },
    rubricClass()       { return this.goalClassGTE(this.rubricPct, this.goals.rubric_pct_gte); },

    // inline styles
    rowStyle() {
      return [
        'display:grid',
        'grid-template-columns: 1.4fr repeat(6, 1fr) 1.2fr',
        'gap:8px',
        'align-items:center',
        'padding:8px 10px',
        'border:1px solid #E5E7EB',
        'border-radius:10px',
        'margin-bottom:8px',
        'background:#FFFFFF'
      ].join(';');
    },
    identityCellStyle() { return 'min-width:0'; },
    nameStyle() { return 'font-weight:700;color:#111827;'; },
    metaStyle() { return 'margin-top:4px;display:flex;gap:6px;flex-wrap:wrap;'; },
    pillStyle() { return 'display:inline-block;border-radius:9999px;padding:2px 6px;font-size:12px;font-weight:600;background:#F3F4F6;color:#111827;'; },

    labelStyle() { return 'font-size:12px;color:#374151;font-weight:600;'; },
    valueStyle() { return 'font-size:18px;font-weight:700;color:#111827;'; },
    smallValueStyle() { return 'font-size:12px;font-weight:700;color:#111827;margin-top:4px;'; },

    kpiBaseStyle() { return 'min-width:0;padding:6px;border-radius:8px;border:1px solid transparent;'; },
    kpiGoodStyle() { return this.kpiBaseStyle + 'background:#ECFDF5;border-color:#A7F3D0;'; },   // green
    kpiBadStyle()  { return this.kpiBaseStyle + 'background:#FEF2F2;border-color:#FECACA;'; },   // red
    kpiNeutralStyle(){ return this.kpiBaseStyle + 'background:#FFFFFF;border-color:#E5E7EB;'; },

    // share bar
    shareCellStyle() { return 'min-width:0;padding:6px;border:1px solid #E5E7EB;border-radius:8px;'; },
    shareBarStyle()  { return 'height:8px;border-radius:9999px;background:#E5E7EB;overflow:hidden;margin-top:4px;'; },
    shareFillStyle() {
      const width = Math.max(0, Math.min(100, this.deptSharePct * 100));
      return `height:100%;width:${width}%;background:#6366F1;`;
    },
  },
  methods: {
    safeNum(v) {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    },
    goalClassLT(val, target) {
      if (val == null) return 'neutral';
      return val < target ? 'good' : 'bad';
    },
    goalClassGTE(val, target) {
      if (val == null) return 'neutral';
      return val >= target ? 'good' : 'bad';
    },
    kpiStyleByClass(kind) {
      if (kind === 'good') return this.kpiGoodStyle;
      if (kind === 'bad')  return this.kpiBadStyle;
      return this.kpiNeutralStyle;
    },
    fmtInt(n) { return (Number(n) || 0).toLocaleString(); },
    fmt1(n)   { return (n == null) ? '—' : Number(n).toFixed(1); },
    fmt2(n)   { return (n == null) ? '—' : Number(n).toFixed(2); },
    fmtPct01(n) {
      if (n == null) return '—';
      const pct = Math.max(0, Math.min(100, n * 100));
      return Math.round(pct) + '%';
    }
  },
  template: `
    <div :style="rowStyle" aria-label="Instructor row">
      <!-- Identity -->
      <div :style="identityCellStyle">
        <div :style="nameStyle">{{ name }}</div>
        <div :style="metaStyle">
          <span v-if="divCode" :style="pillStyle">DIV {{ divCode }}</span>
          <span :style="pillStyle">{{ year }}</span>
          <span :style="pillStyle" :title="'Canvas ID ' + (instructor?.canvas_user_id || '')">ID: {{ instructor?.canvas_user_id }}</span>
        </div>
      </div>

      <!-- KPIs -->
      <div :style="kpiNeutralStyle" :title="'Assignments graded'">
        <div :style="labelStyle">Assign. Graded</div>
        <div :style="valueStyle">{{ fmtInt(assignmentsGraded) }}</div>
      </div>

      <div :style="kpiStyleByClass(attemptsClass)" :title="'Avg Attempts (goal < ' + goals.attempts_lt + ')'">
        <div :style="labelStyle">Avg Attempts</div>
        <div :style="valueStyle">{{ fmt2(avgAttempts) }}</div>
      </div>

      <div :style="kpiStyleByClass(daysToGradeClass)" :title="'Days to Grade (goal < ' + goals.grade_days_lt + ')'">
        <div :style="labelStyle">Days to Grade</div>
        <div :style="valueStyle">{{ fmt1(daysToGrade) }}</div>
      </div>

      <div :style="kpiStyleByClass(commentsClass)" :title="'Comments / Subm (goal ≥ ' + goals.comments_gte + ')'">
        <div :style="labelStyle">Comments / Subm</div>
        <div :style="valueStyle">{{ fmt2(commentsPerSubm) }}</div>
      </div>

      <div :style="kpiStyleByClass(replyClass)" :title="'Days to Reply (goal < ' + goals.reply_days_lt + ')'">
        <div :style="labelStyle">Days to Reply</div>
        <div :style="valueStyle">{{ fmt1(daysToReply) }}</div>
      </div>

      <div :style="kpiStyleByClass(rubricClass)" :title="'% Graded w/ Rubric (goal 100%)'">
        <div :style="labelStyle">Rubric Used</div>
        <div :style="valueStyle">{{ fmtPct01(rubricPct) }}</div>
      </div>

      <div :style="shareCellStyle" :title="'Share of department support/graded hours'">
        <div :style="labelStyle">Dept Share</div>
        <div :style="shareBarStyle">
          <div :style="shareFillStyle" role="progressbar"
               :aria-valuenow="Math.max(0, Math.min(100, (deptSharePct || 0) * 100))"
               aria-valuemin="0" aria-valuemax="100"
               :aria-label="'Dept share ' + fmtPct01(deptSharePct)"></div>
        </div>
        <div :style="smallValueStyle">{{ fmtPct01(deptSharePct) }}</div>
      </div>
    </div>
  `
});

/* Overview list (multiple instructors) */
Vue.component('instructor-metrics-overview', {
  props: {
    instructors: { type: Array, required: true, default: () => [] },
    title: { type: String, default: 'Instructor Metrics — Overview' },
    year:  { type: [String, Number], default: null },
    sortBy: { type: String, default: 'share' } // 'share' | 'graded' | 'name'
  },
  computed: {
    headerStyle() {
      return [
        'display:flex',
        'align-items:center',
        'margin-bottom:12px'
      ].join(';');
    },
    titleStyle() { return 'margin:0;font-size:18px;font-weight:700;color:#111827;'; },
    spacerStyle() { return 'flex:1'; },
    pillStyle() { return 'display:inline-block;border-radius:9999px;padding:2px 6px;font-size:12px;font-weight:600;background:#F3F4F6;color:#111827;margin-left:8px;'; },
    cardStyle() { return 'padding:12px;border:1px solid #E5E7EB;border-radius:12px;background:#FFFFFF;'; },

    sorted() {
      const arr = Array.isArray(this.instructors) ? [...this.instructors] : [];
      const byShare  = (a,b) => ((b?.support_hours?.perc_instructor_support_hours_weighted || 0) - (a?.support_hours?.perc_instructor_support_hours_weighted || 0));
      const byGraded = (a,b) => ((b?.grading?.assignments_graded || 0) - (a?.grading?.assignments_graded || 0));
      const byName   = (a,b) => {
        const an = ((a?.last_name || '') + ' ' + (a?.first_name || '')).toUpperCase();
        const bn = ((b?.last_name || '') + ' ' + (b?.first_name || '')).toUpperCase();
        return an < bn ? -1 : an > bn ? 1 : 0;
      };
      if (this.sortBy === 'graded') arr.sort(byGraded);
      else if (this.sortBy === 'name') arr.sort(byName);
      else arr.sort(byShare); // default
      return arr;
    }
  },
  template: `
    <div :style="cardStyle" aria-label="Instructor overview">
      <div :style="headerStyle">
        <h3 :style="titleStyle">{{ title }}</h3>
        <div :style="spacerStyle"></div>
        <span v-if="year" :style="pillStyle">Year: {{ year }}</span>
        <span :style="pillStyle">Total: {{ sorted.length }}</span>
      </div>

      <div v-if="sorted.length">
        <instructor-metrics-row
          v-for="(inst, i) in sorted"
          :key="(inst.canvas_user_id || 'u') + '-' + i"
          :instructor="inst"
        />
      </div>
      <div v-else style="text-align:center;color:#6B7280;padding:12px;">No instructor data.</div>
    </div>
  `
});
