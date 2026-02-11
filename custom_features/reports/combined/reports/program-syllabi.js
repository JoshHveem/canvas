// program-syllabi.js
Vue.component('reports-program-syllabi', {
  props: {
    year: { type: [Number, String], required: true }, // kept for UI, but not used to filter (no academic_year in items now)
    syllabiData: { type: Object, required: false, default: () => ({}) }, // kept for possible future use (e.g. summary cards), but not used in current table
    syllabi: { type: Array, required: true },         // you pass program.syllabi.syllabi here
    loading: { type: Boolean, default: false },
    anonymous: { type: Boolean, default: false }
  },

  data() {
    const colors = (window.bridgetools?.colors) || {
      red:'#b20b0f', orange:'#f59e0b', yellow:'#eab308',
      green:'#16a34a', gray:'#e5e7eb', black:'#111827', white:'#fff'
    };

    const table = new window.ReportTable({
      rows: [],
      columns: [],
      sort_column: "Course",
      sort_dir: 1,
      colors
    });

    return {
      colors,
      table,
      tableTick: 0,
      filters: {
        submitted: '', // '', true, false
        approved: '',  // '', true, false
        published_course: '', // '', true, false
        active: '' // '', true, false
      }
    };
  },

  created() {
    console.log(this.syllabi);
    this.table.setColumns([
      new window.ReportColumn(
        'Course', 'Course code (links to Simple Syllabus in Canvas).', '16rem', false, 'string',
        s => this.courseLinkHtml(s),
        null,
        s => this.courseSortKey(s)
      ),

      new window.ReportColumn(
        'Status', 'Needs submission / needs approval / completed.', '10rem', false, 'string',
        s => this.statusText(s),
        s => this.statusPillStyle(s),
        s => this.statusSort(s)
      ),

      new window.ReportColumn(
        'Submitted', 'Submitted to approvals.', '6rem', false, 'string',
        s => this.boolText(s?.is_submitted),
        s => this.boolPillStyle(s?.is_submitted),
        s => this.boolSort(s?.is_submitted)
      ),

      new window.ReportColumn(
        'Approved', 'Approved (completed).', '6rem', false, 'string',
        s => this.boolText(s?.is_approved),
        s => this.boolPillStyle(s?.is_approved),
        s => this.boolSort(s?.is_approved)
      ),

      new window.ReportColumn(
        'Published Course', 'Canvas course published.', '8rem', false, 'string',
        s => this.boolText(s?.is_published_course),
        s => this.boolPillStyle(s?.is_published_course),
        s => this.boolSort(s?.is_published_course)
      ),

      new window.ReportColumn(
        'Published Syllabus', 'Simple Syllabus published.', '9rem', false, 'string',
        s => this.boolText(s?.is_published_syllabus),
        s => this.boolPillStyle(s?.is_published_syllabus),
        s => this.boolSort(s?.is_published_syllabus)
      ),

      new window.ReportColumn(
        'Active', 'Course active.', '6rem', false, 'string',
        s => this.boolText(s?.is_active),
        s => this.boolPillStyle(s?.is_active),
        s => this.boolSort(s?.is_active)
      ),

      new window.ReportColumn(
        'Canvas ID', 'Canvas course id.', '7rem', false, 'number',
        s => (s?.canvas_course_id ?? ''),
        null,
        s => Number(s?.canvas_course_id ?? -1)
      ),
    ]);
  },

  computed: {
    visibleRows() {
      const rows = Array.isArray(this.syllabi) ? this.syllabi : [];

      // Client-side filters
      const filtered = rows.filter(r => {
        if (this.filters.submitted !== '') {
          const want = this.filters.submitted === true || this.filters.submitted === 'true';
          if ((r?.is_submitted === true) !== want) return false;
        }
        if (this.filters.approved !== '') {
          const want = this.filters.approved === true || this.filters.approved === 'true';
          if ((r?.is_approved === true) !== want) return false;
        }
        if (this.filters.published_course !== '') {
          const want = this.filters.published_course === true || this.filters.published_course === 'true';
          if ((r?.is_published_course === true) !== want) return false;
        }
        if (this.filters.active !== '') {
          const want = this.filters.active === true || this.filters.active === 'true';
          if ((r?.is_active === true) !== want) return false;
        }
        return true;
      });

      this.table.setRows(filtered);
      return this.table.getSortedRows();
    }
  },

  methods: {
    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tableTick++; },

    // ---------- status bucket ----------
    statusText(s) {
      if (s?.is_submitted !== true) return 'Needs submission';
      if (s?.is_approved !== true) return 'Needs approval';
      return 'Completed';
    },
    statusSort(s) {
      // Completed first, then needs approval, then needs submission
      if (s?.is_submitted === true && s?.is_approved === true) return 2;
      if (s?.is_submitted === true && s?.is_approved !== true) return 1;
      return 0;
    },
    statusPillStyle(s) {
      const t = this.statusText(s);
      if (t === 'Completed') return { backgroundColor: this.colors.green, color: this.colors.white };
      if (t === 'Needs approval') return { backgroundColor: this.colors.yellow, color: this.colors.white };
      return { backgroundColor: this.colors.red, color: this.colors.white };
    },

    // ---------- bool helpers ----------
    boolText(v) {
      if (v === undefined || v === null) return 'n/a';
      return v ? 'Yes' : 'No';
    },
    boolSort(v) {
      if (v === undefined || v === null) return -1;
      return v ? 1 : 0;
    },
    boolPillStyle(v) {
      if (v === undefined || v === null) return { backgroundColor: this.colors.gray, color: this.colors.black };
      return v
        ? { backgroundColor: this.colors.green, color: this.colors.white }
        : { backgroundColor: this.colors.red, color: this.colors.white };
    },

    // ---------- course formatting ----------
    courseText(s) {
      const code = (s?.course_code ?? '').trim();
      return this.escapeHtml(code || '(no course code)');
    },
    courseSortKey(s) {
      return String(s?.course_code ?? '').trim().toLowerCase();
    },

    courseLinkHtml(s) {
      const id = s?.canvas_course_id;
      const code = this.courseText(s);

      // If missing ID, just show text
      if (id === undefined || id === null || id === '') return code;

      const url = `https://btech.instructure.com/courses/${encodeURIComponent(id)}/external_tools/106228`;
      return `<a href="${url}" target="_blank" rel="noopener">${code}</a>`;
    },

    escapeHtml(str) {
      const s = String(str ?? '');
      return s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    <div class="btech-row" style="align-items:center; margin-bottom:8px;">
      <h4 class="btech-card-title" style="margin:0;">Program — Syllabi</h4>
      <div style="flex:1;"></div>
      <span class="btech-pill" style="margin-left:8px;">Year: {{ year }}</span>
      <span class="btech-pill" style="margin-left:8px;">Rows: {{ visibleRows.length }}</span>
    </div>

    <div class="btech-row" style="gap:8px; margin-bottom:8px;">
      <label class="btech-muted" style="font-size:.75rem;">Submitted</label>
      <select v-model="filters.submitted" style="font-size:.75rem;">
        <option value="">All</option>
        <option :value="true">Yes</option>
        <option :value="false">No</option>
      </select>

      <label class="btech-muted" style="font-size:.75rem; margin-left:8px;">Approved</label>
      <select v-model="filters.approved" style="font-size:.75rem;">
        <option value="">All</option>
        <option :value="true">Yes</option>
        <option :value="false">No</option>
      </select>

      <label class="btech-muted" style="font-size:.75rem; margin-left:8px;">Published</label>
      <select v-model="filters.published_course" style="font-size:.75rem;">
        <option value="">All</option>
        <option :value="true">Yes</option>
        <option :value="false">No</option>
      </select>

      <label class="btech-muted" style="font-size:.75rem; margin-left:8px;">Active</label>
      <select v-model="filters.active" style="font-size:.75rem;">
        <option value="">All</option>
        <option :value="true">Yes</option>
        <option :value="false">No</option>
      </select>
    </div>

    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
      Loading syllabi…
    </div>

    <div v-else>
      <div
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none;"
        :style="{ 'grid-template-columns': getColumnsWidthsString() }"
      >
        <div
          v-for="col in table.getVisibleColumns()"
          :key="col.name"
          :title="col.description"
          style="display:inline-block; cursor:pointer;"
          @click="setSortColumn(col.name)"
        >
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

      <div
        v-for="(syl, i) in visibleRows"
        :key="syl.course_code || syl.canvas_course_id || i"
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.5rem;"
        :style="{
          'grid-template-columns': getColumnsWidthsString(),
          'background-color': (i % 2) ? 'white' : '#F8F8F8'
        }"
      >
        <div
          v-for="col in table.getVisibleColumns()"
          :key="col.name"
          style="display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;"
        >
          <span
            :class="col.style_formula ? 'btech-pill-text' : ''"
            :style="col.get_style(syl)"
            v-html="col.getContent(syl)"
          ></span>
        </div>
      </div>
    </div>
  </div>
  `
});