// department-syllabi.js
Vue.component('reports-program-syllabi', {
  props: {
    year: { type: [Number, String], required: true },
    syllabi: { type: Array, required: true },
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
      sort_column: "Last Edited",
      sort_dir: -1,
      colors
    });

    return {
      colors,
      table,
      tableTick: 0,
      filters: {
        // optional client-side filters if you want later
        submitted: '', // '', true, false
        approved: '',  // '', true, false
      }
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Course', 'Course code + name.', '22rem', false, 'string',
        s => `<a href="https://btech.instructure.com/courses/${s?.canvas_course_id}/external_tools/106228" target="_blank">${this.courseText(s)}</a>`,
        null,
        s => this.courseSortKey(s)
      ),

      new window.ReportColumn(
        'Canvas', 'Canvas course id.', '6rem', false, 'number',
        s => (s?.canvas_course_id ?? ''),
        null,
        s => Number(s?.canvas_course_id ?? -1)
      ),

      new window.ReportColumn(
        'Submitted', 'Submitted to approvals (awaiting_approval or completed).', '6rem', false, 'string',
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
        'Published', 'Canvas course published.', '6rem', false, 'string',
        s => this.boolText(s?.is_published_course),
        s => this.boolPillStyle(s?.is_published_course),
        s => this.boolSort(s?.is_published_course)
      ),

      new window.ReportColumn(
        'Last Edited', 'Last edited timestamp from Simple Syllabus.', '10rem', false, 'string',
        s => this.dateText(s?.last_edited_at),
        null,
        s => this.dateSort(s?.last_edited_at)
      ),

      new window.ReportColumn(
        'AY', 'Academic year.', '4rem', false, 'number',
        s => (s?.academic_year ?? ''),
        null,
        s => Number(s?.academic_year ?? -1)
      ),
    ]);
  },

  computed: {
    visibleRows() {
      const rows = Array.isArray(this.syllabi) ? this.syllabi : [];

      // Optional: slice to the selected year if you sometimes pass mixed years
      const y = Number(this.year);
      const yearFiltered = Number.isFinite(y)
        ? rows.filter(r => Number(r?.academic_year) === y)
        : rows;

      // Optional filters (client side)
      const filtered = yearFiltered.filter(r => {
        if (this.filters.submitted !== '') {
          const want = this.filters.submitted === true || this.filters.submitted === 'true';
          if (!!r?.is_submitted !== want) return false;
        }
        if (this.filters.approved !== '') {
          const want = this.filters.approved === true || this.filters.approved === 'true';
          if (!!r?.is_approved !== want) return false;
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

    // -------- formatting helpers --------
    boolText(v) {
      if (v === undefined || v === null) return 'n/a';
      return v ? 'Yes' : 'No';
    },
    boolSort(v) {
      if (v === undefined || v === null) return -1; // push unknowns down
      return v ? 1 : 0;
    },
    boolPillStyle(v) {
      if (v === undefined || v === null) return { backgroundColor: this.colors.gray, color: this.colors.black };
      return v
        ? { backgroundColor: this.colors.green, color: this.colors.white }
        : { backgroundColor: this.colors.red, color: this.colors.white };
    },

    dateSort(v) {
      const t = Date.parse(v);
      return Number.isFinite(t) ? t : -1;
    },
    dateText(v) {
      const t = Date.parse(v);
      if (!Number.isFinite(t)) return 'n/a';
      // keep it simple; adjust to your preferred format
      const d = new Date(t);
      return d.toLocaleString();
    },

    courseText(s) {
      const code = (s?.course_code ?? '').trim();
      const name = (s?.course_name ?? '').trim();
      if (code && name) return `${this.escapeHtml(code)} — ${this.escapeHtml(name)}`;
      return this.escapeHtml(code || name || '');
    },
    courseSortKey(s) {
      const code = (s?.course_code ?? '').trim();
      const name = (s?.course_name ?? '').trim();
      return `${code} ${name}`.trim().toLowerCase();
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
    <!-- Header -->
    <div class="btech-row" style="align-items:center; margin-bottom:8px;">
      <h4 class="btech-card-title" style="margin:0;">Syllabi</h4>
      <div style="flex:1;"></div>
      <span class="btech-pill" style="margin-left:8px;">Year: {{ year }}</span>
      <span class="btech-pill" style="margin-left:8px;">Rows: {{ visibleRows.length }}</span>
    </div>

    <!-- Optional quick filters -->
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
    </div>

    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
      Loading syllabi…
    </div>

    <div v-else>
      <!-- Column headers -->
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

      <!-- Rows -->
      <div
        v-for="(syl, i) in visibleRows"
        :key="syl.doc_code || syl.canvas_course_id || i"
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
