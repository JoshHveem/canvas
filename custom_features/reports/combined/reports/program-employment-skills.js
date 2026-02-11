// program-employment-skills.js (single table, no bar)
Vue.component('reports-program-employment-skills', {
  props: {
    year: { type: [Number, String], required: true },
    campus: { type: [String], required: true },
    anonymous: { type: Boolean, default: false },
    students: { type: Array, default: () => ([]) },
    loading: { type: Boolean, default: false }
  },

  data() {
    const colors = window.COMPLETION.getColors();
    const table = new window.ReportTable({
      rows: [],
      columns: [],
      sort_column: "Student",
      sort_dir: 1,
      colors
    });

    return {
      colors,
      table,
      tick: 0
    };
  },

  created() {
    this.table.setColumns([
      this.makeStudentColumn(),
      this.makeNumberColumn('Subs', 'Total employment skills submissions.', '5.5rem',
        s => Number(s?.employment_skills_total_submissions ?? 0)
      ),
      this.makeNumberColumn('Mo/Submit', 'Avg months between submissions (server-calculated).', '6.5rem',
        s => {
          const v = s?.employment_skills_avg_months_between_submissions;
          return (v == null) ? null : Number(v);
        },
        { digits: 1 }
      ),
      this.makeDateColumn('Last submitted', 'Last employment skills submission date.', '8rem',
        s => s?.employment_skills_last_submitted_at
      ),

      // Optional: show a compact preview of "last" skills (top 2 by score)
      this.makeSkillsPreviewColumn('Top skills (last)', 'Top 2 skill scores from the most recent submission.', '18rem',
        s => s?.employment_skills_last,
        { maxItems: 2 }
      ),

      // Optional: show a compact preview of "average" skills (top 2 by score)
      this.makeSkillsPreviewColumn('Top skills (avg)', 'Top 2 skill averages across all submissions.', '18rem',
        s => s?.employment_skills_average,
        { maxItems: 2 }
      )
    ]);
  },

  computed: {
    y() { return Number(this.year) || null; },
    studentsClean() { return Array.isArray(this.students) ? this.students : []; },

    // If your server is already sending only the chosen academic_year+program+campus cohort, you can skip this.
    // Otherwise: keep only students whose record matches the selected year.
    includedStudents() {
        const rows = this.studentsClean;
        return rows;
    },
    visibleRows() {
      const rows = this.includedStudents.slice().sort((a, b) => {
        // default stable-ish ordering before table sorting:
        const na = this.safeName(a);
        const nb = this.safeName(b);
        if (na !== nb) return na.localeCompare(nb);
        return String(a?.sis_user_id ?? '').localeCompare(String(b?.sis_user_id ?? ''));
      });

      this.table.setRows(rows);
      return this.table.getSortedRows();
    }
  },

  methods: {
    // ---------- tiny helpers ----------
    safeName(s) { return (s?.name ?? '').toLowerCase(); },

    displayName(s) {
      if (this.anonymous) return 'STUDENT';
      return (s?.name ?? (s?.sis_user_id != null ? `SIS ${s.sis_user_id}` : 'Student'));
    },

    escapeHtml(str) {
      return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    },

    dateOrDash(v) {
      if (!v) return '—';
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? '—' : d.toISOString().slice(0, 10);
    },

    // If your employment_skills_last/average are json strings, parse them safely.
    asObject(v) {
      if (!v) return null;
      if (typeof v === 'object') return v;
      if (typeof v === 'string') {
        try { return JSON.parse(v); } catch (_e) { return null; }
      }
      return null;
    },

    // ---------- columns ----------
    makeStudentColumn() {
      return new window.ReportColumn(
        'Student',
        'Student name (or SIS id).',
        '16rem',
        false,
        'string',
        s => {
          const label = this.escapeHtml(this.displayName(s));
          const id = s?.canvas_user_id;
          return id
            ? `<a href="/users/${encodeURIComponent(id)}" target="_blank" rel="noopener noreferrer">${label}</a>`
            : label;
        },
        null,
        s => (s?.name ?? String(s?.sis_user_id ?? ''))
      );
    },

    makeDateColumn(name, description, width, getter) {
      return new window.ReportColumn(
        name, description, width, false, 'string',
        s => this.dateOrDash(getter(s)),
        null,
        s => {
          const v = getter(s);
          const d = v ? new Date(v) : null;
          return (d && !Number.isNaN(d.getTime())) ? d.getTime() : Infinity;
        }
      );
    },

    makeNumberColumn(name, description, width, getter, opts = {}) {
      const digits = Number.isFinite(opts.digits) ? opts.digits : 0;
      return new window.ReportColumn(
        name, description, width, false, 'number',
        s => {
          const v = getter(s);
          if (v == null || !Number.isFinite(v)) return '—';
          return digits ? v.toFixed(digits) : String(Math.round(v));
        },
        null,
        s => {
          const v = getter(s);
          return Number.isFinite(v) ? v : -Infinity;
        }
      );
    },

    makeSkillsPreviewColumn(name, description, width, getter, opts = {}) {
      const maxItems = Number.isFinite(opts.maxItems) ? opts.maxItems : 2;

      return new window.ReportColumn(
        name, description, width, false, 'string',
        s => {
          const obj = this.asObject(getter(s));
          if (!obj || typeof obj !== 'object') return '—';

          // convert to [skill, score], sort desc, take top N
          const entries = Object.entries(obj)
            .map(([k, v]) => [String(k), Number(v)])
            .filter(([, v]) => Number.isFinite(v))
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxItems);

          if (!entries.length) return '—';

          // "Professionalism: 1.00 • Quality of Work: 0.88"
          return entries
            .map(([k, v]) => `${this.escapeHtml(k)}: <b>${v.toFixed(2)}</b>`)
            .join(' &nbsp;•&nbsp; ');
        },
        null,
        s => {
          const obj = this.asObject(getter(s));
          if (!obj || typeof obj !== 'object') return '';
          // sort key: highest score
          const best = Math.max(
            ...Object.values(obj).map(v => Number(v)).filter(v => Number.isFinite(v))
          );
          return Number.isFinite(best) ? best : -Infinity;
        }
      );
    },

    // --- sort handlers ---
    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tick++; }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
      Loading students…
    </div>

    <div v-else>
      <div class="btech-row" style="align-items:center; margin: 0 0 8px;">
        <h4 class="btech-card-title" style="margin:0; font-size: .95rem;">Employment skills</h4>
        <div style="flex:1;"></div>
        <span class="btech-pill" style="margin-left:8px;">Rows: {{ visibleRows.length }}</span>
      </div>

      <div style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none;"
        :style="{ 'grid-template-columns': getColumnsWidthsString() }">
        <div v-for="col in table.getVisibleColumns()" :key="'h-' + col.name" :title="col.description"
          style="display:inline-block; cursor:pointer;" @click="setSortColumn(col.name)">
          <span><b>{{ col.name }}</b></span>
        </div>
      </div>

      <div v-for="(s, i) in visibleRows" :key="'r-' + (s.sis_user_id || s.canvas_user_id || i)"
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.5rem;"
        :style="{ 'grid-template-columns': getColumnsWidthsString(), 'background-color': (i % 2) ? 'white' : '#F8F8F8' }">
        <div v-for="col in table.getVisibleColumns()" :key="'c-' + col.name"
          style="display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
          <span :class="col.style_formula ? 'btech-pill-text' : ''" :style="col.get_style(s)" v-html="col.getContent(s)"></span>
        </div>
      </div>

      <div class="btech-muted" style="font-size:.7rem; margin-top:10px;">
        Shows total submissions, average months between submissions, and top skill scores.
      </div>
    </div>
  </div>
  `
});