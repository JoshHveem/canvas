// program-employment-skills.js (single table, with modal drilldown)
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
      tick: 0,

      // modal state
      modalOpen: false,
      modalTitle: '',
      modalStudent: null,
      modalSkills: [] // [{ skill, score }]
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

    // NEW: clickable “mean score” cells
    this.makeSkillsMeanClickableColumn(
        'Last score',
        'Mean of all skill scores in the most recent evaluation. Click for details.',
        '7rem',
        s => s?.employment_skills_last,
        { mode: 'last' }
    ),
    this.makeSkillsMeanClickableColumn(
        'Avg score',
        'Mean of all average skill scores. Click for details.',
        '7rem',
        s => s?.employment_skills_averages,
        { mode: 'avg' }
    )
    ]);
  },

  computed: {
    studentsClean() { return Array.isArray(this.students) ? this.students : []; },

    visibleRows() {
      const rows = this.studentsClean.slice().sort((a, b) => {
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
    makeSkillsMeanClickableColumn(name, description, width, getter, opts = {}) {
    const mode = opts.mode || 'last';

    return new window.ReportColumn(
        name,
        description,
        width,
        false,
        'number',
        s => {
        const obj = this.asObject(getter(s));
        const mean = this.meanScoreFromObj(obj);
        if (!Number.isFinite(mean)) return '—';

        const sid = this.escapeHtml(String(s?.sis_user_id ?? ''));
        const cid = this.escapeHtml(String(s?.canvas_user_id ?? ''));
        const key = `${sid}|${cid}|${mode}`;

        // clickable number
        return `
            <a href="#" class="emp-skill-link" data-emp-skill-key="${key}" title="Click to view all skills">
            <b>${mean.toFixed(2)}</b>
            </a>
        `;
        },
        null,
        s => {
        const obj = this.asObject(getter(s));
        const mean = this.meanScoreFromObj(obj);
        return Number.isFinite(mean) ? mean : -Infinity;
        }
    );
    },

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

    // Parse employment_skills_* which might arrive as jsonb object OR stringified JSON OR stringified hstore-ish.
    // If it's already an object => return it.
    // If it's a JSON string => parse JSON.
    // If it's like "{""Professionalism"": 1.0, ...}" => try to normalize quotes and parse.
    asObject(v) {
      if (!v) return null;
      if (typeof v === 'object') return v;

      if (typeof v === 'string') {
        // try JSON parse first
        try { return JSON.parse(v); } catch (_e) {}

        // try to normalize Postgres-ish {"":""} quoting to JSON
        // Example: {""Professionalism"": 1.0, ""Quality"": 0.9}
        const cleaned = v
          .trim()
          .replace(/^{/, '{')
          .replace(/}$/, '}')
          .replace(/""/g, '"');

        try { return JSON.parse(cleaned); } catch (_e2) {}
      }
      return null;
    },

    objToSkillRows(obj) {
      if (!obj || typeof obj !== 'object') return [];
      return Object.entries(obj)
        .map(([skill, score]) => ({ skill: String(skill), score: Number(score) }))
        .filter(r => r.skill && Number.isFinite(r.score))
        .sort((a, b) => b.score - a.score || a.skill.localeCompare(b.skill));
    },

    meanScoreFromObj(obj) {
        const rows = this.objToSkillRows(obj); // already filters finite numbers
        if (!rows.length) return null;
        const sum = rows.reduce((acc, r) => acc + r.score, 0);
        return sum / rows.length;
    },

    // ---------- modal ----------
    openSkillsModal(student, mode, rawObj) {
      const obj = this.asObject(rawObj);
      const rows = this.objToSkillRows(obj);

      const who = this.escapeHtml(this.displayName(student));
      const title = mode === 'avg'
        ? `Employment skills (Average) — ${who}`
        : `Employment skills (Last) — ${who}`;

      this.modalStudent = student || null;
      this.modalTitle = title;
      this.modalSkills = rows;
      this.modalOpen = true;
    },

    closeSkillsModal() {
      this.modalOpen = false;
      this.modalTitle = '';
      this.modalStudent = null;
      this.modalSkills = [];
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

    makeSkillsPreviewClickableColumn(name, description, width, getter, opts = {}) {
      const maxItems = Number.isFinite(opts.maxItems) ? opts.maxItems : 2;
      const mode = opts.mode || 'last';

      return new window.ReportColumn(
        name,
        description,
        width,
        false,
        'string',
        s => {
          const obj = this.asObject(getter(s));
          const rows = this.objToSkillRows(obj);

          if (!rows.length) return '—';

          const preview = rows.slice(0, maxItems)
            .map(r => `${this.escapeHtml(r.skill)}: <b>${r.score.toFixed(2)}</b>`)
            .join(' &nbsp;•&nbsp; ');

          // clickable element; we’ll catch clicks via event delegation (below)
          // include dataset so we know which row + mode was clicked
          const sid = this.escapeHtml(String(s?.sis_user_id ?? ''));
          const cid = this.escapeHtml(String(s?.canvas_user_id ?? ''));
          const key = `${sid}|${cid}|${mode}`;

          return `
            <a href="#" class="emp-skill-link" data-emp-skill-key="${key}" title="Click to view all skills">
              ${preview}
            </a>
          `;
        },
        null,
        s => {
          const obj = this.asObject(getter(s));
          const rows = this.objToSkillRows(obj);
          return rows.length ? rows[0].score : -Infinity;
        }
      );
    },

    // --- sort handlers ---
    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tick++; },

    // handle clicks from the table (event delegation)
    onTableClick(ev) {
      const el = ev?.target?.closest?.('.emp-skill-link');
      if (!el) return;
      ev.preventDefault();

      const key = el.getAttribute('data-emp-skill-key') || '';
      const parts = key.split('|');
      const mode = parts[2] || 'last';

      // find student back from visibleRows (or studentsClean)
      // prefer sis_user_id, else canvas_user_id
      const sis = parts[0] || null;
      const canvas = parts[1] || null;

      const s = this.studentsClean.find(x =>
        (sis && String(x?.sis_user_id ?? '') === sis) ||
        (canvas && String(x?.canvas_user_id ?? '') === canvas)
      );

      if (!s) return;

      const raw = (mode === 'avg') ? s?.employment_skills_averages : s?.employment_skills_last;
      this.openSkillsModal(s, mode, raw);
    }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
      Loading students…
    </div>

    <div v-else @click="onTableClick">
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
        Click “Last” or “Avg” to view a full skill breakdown.
      </div>

      <!-- MODAL -->
      <div v-if="modalOpen"
        style="position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:9999;"
        @click.self="closeSkillsModal">
        <div class="btech-card btech-theme"
          style="width:min(720px, 92vw); margin:8vh auto; padding:12px;">
          <div class="btech-row" style="align-items:center;">
            <h4 class="btech-card-title" style="margin:0; font-size: .95rem;" v-html="modalTitle"></h4>
            <div style="flex:1;"></div>
            <button class="btech-btn" @click="closeSkillsModal">Close</button>
          </div>

          <div v-if="!modalSkills.length" class="btech-muted" style="padding:10px; text-align:center;">
            No employment skills data available.
          </div>

          <div v-else style="margin-top:10px;">
            <div style="display:grid; grid-template-columns: 1fr 6rem; gap:8px; padding:.25rem .5rem;
                        font-size:.75rem; user-select:none; border-bottom:1px solid rgba(0,0,0,0.12);">
              <div><b>Skill</b></div>
              <div style="text-align:right;"><b>Score</b></div>
            </div>

            <div v-for="(r, idx) in modalSkills" :key="r.skill + '-' + idx"
              :style="{ background: (idx % 2) ? 'white' : '#F8F8F8' }"
              style="display:grid; grid-template-columns: 1fr 6rem; gap:8px; padding:.25rem .5rem; font-size:.75rem;">
              <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" :title="r.skill">
                {{ r.skill }}
              </div>
              <div style="text-align:right;">
                {{ Number.isFinite(r.score) ? r.score.toFixed(2) : '—' }}
              </div>
            </div>
          </div>

        </div>
      </div>
      <!-- /MODAL -->

    </div>
  </div>
  `
});