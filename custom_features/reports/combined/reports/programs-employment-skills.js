// programs-employment-skills.js
Vue.component('reports-programs-employment-skills', {
  props: {
    year: { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },
    programs: { type: Array, required: true },
    loading: { type: Boolean, default: false }
  },

  data() {
    const colors = (window.bridgetools?.colors) || {
      red:'#b20b0f', orange:'#f59e0b', yellow:'#eab308',
      green:'#16a34a', gray:'#e5e7eb', black:'#111827', white:'#fff',
      darkGray:'#9ca3af'
    };

    const table = new window.ReportTable({
      rows: [],
      columns: [],
      sort_column: "Program",
      sort_dir: 1,
      colors
    });

    return { colors, table, tableTick: 0 };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Program', 'Program name.', '16rem', false, 'string',
        p => this.anonymous ? 'PROGRAM' : (p?.name ?? ''),
        null,
        p => (p?.name ?? '')
      ),

      new window.ReportColumn(
        'Campus', 'Campus name.', '5rem', false, 'string',
        p => p?.campus,
        null,
        p => (p?.campus ?? '')
      ),

      new window.ReportColumn(
        'Students', 'Number of students in this summary.', '5.5rem', false, 'number',
        p => this.n(p?.employment_skills?.num_students),
        null,
        p => Number(p?.employment_skills?.num_students ?? -1)
      ),

      new window.ReportColumn(
        'Submitted', 'Total evals submitted.', '6rem', false, 'number',
        p => this.n(p?.employment_skills?.total_evals_submitted),
        null,
        p => Number(p?.employment_skills?.total_evals_submitted ?? -1)
      ),

      new window.ReportColumn(
        'Valid', 'Total valid evals.', '4.5rem', false, 'number',
        p => this.n(p?.employment_skills?.total_valid_evals),
        null,
        p => Number(p?.employment_skills?.total_valid_evals ?? -1)
      ),

      new window.ReportColumn(
        'Evals/Student', 'Evals per student.', '6.5rem', false, 'number',
        p => this.f(p?.employment_skills?.evals_per_student, 2),
        null,
        p => Number(p?.employment_skills?.evals_per_student ?? -1)
      ),

      new window.ReportColumn(
        'Evals/Qtr', 'Evals per quarter.', '5.5rem', false, 'number',
        p => this.f(p?.employment_skills?.evals_per_quarter, 2),
        null,
        p => Number(p?.employment_skills?.evals_per_quarter ?? -1)
      ),

      new window.ReportColumn(
        '% Graded', 'Percent of submitted evals that were graded (0–1).', '5.5rem', false, 'string',
        p => {
          const r = Number(p?.employment_skills?.perc_submitted_graded);
          return Number.isFinite(r) ? (r * 100).toFixed(1) + '%' : '—';
        },
        p => this.gradedPillStyle(p),
        p => Number(p?.employment_skills?.perc_submitted_graded ?? -1)
      )
    ]);
  },

  computed: {
    visibleRows() {
      const rows = Array.isArray(this.programs) ? this.programs : [];
      this.table.setRows(rows);
      return this.table.getSortedRows();
    }
  },

  methods: {
    // ---- ReportTable plumbing ----
    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tableTick++; },

    // ---- formatting ----
    n(x) {
      const v = Number(x);
      return Number.isFinite(v) ? String(v) : '—';
    },

    f(x, digits=2) {
      const v = Number(x);
      return Number.isFinite(v) ? v.toFixed(digits) : '—';
    },

    gradedPillStyle(p) {
      const r = Number(p?.employment_skills?.perc_submitted_graded);
      if (!Number.isFinite(r)) return { backgroundColor: 'transparent', color: this.colors.black };

      // simple thresholds (tweak as desired)
      if (r < 0.25) return { backgroundColor: this.colors.red, color: this.colors.white };
      if (r < 0.60) return { backgroundColor: this.colors.yellow, color: this.colors.black };
      return { backgroundColor: this.colors.green, color: this.colors.white };
    },

    emitDrill(p) {
      this.$emit('drill-program', {
        program: String(p?.program ?? p?.program_code ?? p?.name ?? '').trim(),
        campus: String(p?.campus ?? '').trim(),
        row: p
      });
    }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    <div class="btech-row" style="align-items:center; margin-bottom:8px;">
      <h4 class="btech-card-title" style="margin:0;">Employment Skills – All Programs</h4>
      <div style="flex:1;"></div>
      <span class="btech-pill" style="margin-left:8px;">Year: {{ year }}</span>
      <span class="btech-pill" style="margin-left:8px;">Rows: {{ visibleRows.length }}</span>
    </div>

    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
      Loading programs…
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
        v-for="(program, i) in visibleRows"
        :key="program.program_id || program.programId || program.id || program.account_id || i"
        @click="emitDrill(program)"
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
            :style="col.get_style(program)"
            v-html="col.getContent(program)"
          ></span>
        </div>
      </div>
    </div>
  </div>
  `
});
