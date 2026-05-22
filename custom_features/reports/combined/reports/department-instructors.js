Vue.component('reports-department-instructors', {
  props: {
    reportContext: { type: Object, default: () => ({}) },
    anonymous: { type: Boolean, default: false }
  },

  data() {
    const colors = window.bridgetools?.colors || {
      red: '#b20b0f',
      orange: '#f59e0b',
      yellow: '#eab308',
      green: '#16a34a',
      gray: '#e5e7eb',
      black: '#111827',
      white: '#fff'
    };

    const table = new window.ReportTable({
      rows: [],
      columns: [],
      sort_column: 'Instructor',
      sort_dir: 1,
      colors
    });

    return {
      colors,
      table,
      tableTick: 0,
      loading: false,
      loadingDepartments: false,
      loadError: '',
      year: Number(this.reportContext?.filters?.academic_year) || new Date().getFullYear(),
      rows: [],
      departmentOptions: [],
      selectedDepartmentCode: '',
      loadedDepartmentName: ''
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Instructor', 'Instructor name.', '14rem', false, 'string',
        row => this.anonymous ? 'INSTRUCTOR' : this.escapeHtml(this.instructorName(row)),
        null,
        row => this.instructorSortKey(row)
      ),
      new window.ReportColumn(
        'Assignments', 'Assignments graded.', '7rem', false, 'number',
        row => this.intText(row?.num_assignments_graded),
        null,
        row => Number(row?.num_assignments_graded ?? -1)
      ),
      new window.ReportColumn(
        '% Dept Graded', 'Share of department assignments graded.', '8rem', false, 'number',
        row => this.pctText(row?.perc_department_assignments_graded),
        row => this.pctPillStyle(row?.perc_department_assignments_graded),
        row => Number(row?.perc_department_assignments_graded ?? -1)
      ),
      new window.ReportColumn(
        'Avg Score', 'Average score earned on graded work.', '6rem', false, 'number',
        row => this.pctText(row?.avg_score),
        row => this.pctPillStyle(row?.avg_score),
        row => Number(row?.avg_score ?? -1)
      ),
      new window.ReportColumn(
        'Attempts', 'Average number of attempts.', '6rem', false, 'number',
        row => this.numText(row?.avg_num_attempts, 2),
        null,
        row => Number(row?.avg_num_attempts ?? -1)
      ),
      new window.ReportColumn(
        'Comments', 'Average comments per graded submission.', '6rem', false, 'number',
        row => this.numText(row?.avg_num_comments, 2),
        null,
        row => Number(row?.avg_num_comments ?? -1)
      ),
      new window.ReportColumn(
        'Rubric Use', 'Average percent graded with rubric.', '7rem', false, 'number',
        row => this.pctText(row?.avg_perc_graded_with_rubric),
        row => this.pctPillStyle(row?.avg_perc_graded_with_rubric),
        row => Number(row?.avg_perc_graded_with_rubric ?? -1)
      ),
      new window.ReportColumn(
        'Days to Grade', 'Average days to grade.', '7rem', false, 'number',
        row => this.numText(row?.avg_days_to_grade, 2),
        row => this.bandDaysToGrade(row?.avg_days_to_grade),
        row => Number(row?.avg_days_to_grade ?? -1)
      ),
      new window.ReportColumn(
        'Support Hours', 'Instructor support hours.', '7rem', false, 'number',
        row => this.numText(row?.instructor_support_hours, 1),
        null,
        row => Number(row?.instructor_support_hours ?? -1)
      ),
      new window.ReportColumn(
        'Weighted Share', 'Share of department weighted support hours.', '8rem', false, 'number',
        row => this.pctText(row?.perc_department_instructor_support_hours_weighted),
        row => this.pctPillStyle(row?.perc_department_instructor_support_hours_weighted),
        row => Number(row?.perc_department_instructor_support_hours_weighted ?? -1)
      ),
      new window.ReportColumn(
        'Days to Respond', 'Median days to respond.', '8rem', false, 'number',
        row => this.numText(row?.mdn_days_to_respond, 2),
        row => this.bandDaysToRespond(row?.mdn_days_to_respond),
        row => Number(row?.mdn_days_to_respond ?? -1)
      ),
      new window.ReportColumn(
        'Survey Avg', 'Average of available instructor likert scores.', '7rem', false, 'number',
        row => this.pctText(this.avgLikert(row)),
        row => this.pctPillStyle(this.avgLikert(row)),
        row => this.avgLikert(row)
      )
    ]);
  },

  mounted() {
    this.syncFromReportContext();
    this.loadDepartmentOptions();
  },

  watch: {
    reportContext: {
      deep: true,
      async handler() {
        this.syncFromReportContext();
        await this.loadDepartmentOptions(true);
      }
    },
    async year() {
      await this.loadDepartmentOptions(true);
    },
    selectedDepartmentCode() {
      this.loadData();
    }
  },

  computed: {
    visibleRows() {
      this.table.setRows(this.rows);
      return this.table.getSortedRows();
    },

    titleText() {
      if (this.anonymous) return 'DEPARTMENT - Instructors';
      const name = this.loadedDepartmentName || this.getDepartmentName() || 'Department';
      return `${this.escapeHtml(name)} - Instructors`;
    }
  },

  methods: {
    syncFromReportContext() {
      const nextYear = Number(this.reportContext?.filters?.academic_year);
      if (Number.isFinite(nextYear) && nextYear !== this.year) {
        this.year = nextYear;
      }

      const nextDepartmentCode = this.getDepartmentCode();
      if (nextDepartmentCode && nextDepartmentCode !== this.selectedDepartmentCode) {
        this.selectedDepartmentCode = nextDepartmentCode;
      }
    },

    getDataset() {
      return String(this.reportContext?.dataset || '').trim();
    },

    getRequestFilters() {
      return {
        academic_year: Number(this.year),
        department_code: this.selectedDepartmentCode
      };
    },

    getDepartmentCode() {
      return String(
        this.reportContext?.routeFilters?.departmentCode ??
        this.reportContext?.filters?.department_code ??
        ''
      ).trim();
    },

    getDepartmentName() {
      return String(
        this.reportContext?.routeFilters?.departmentName ??
        this.reportContext?.filters?.department_name ??
        ''
      ).trim();
    },

    async loadDepartmentOptions(forceReloadData = false) {
      try {
        this.loadingDepartments = true;

        const rows = await bridgetools.req3(
          'reports',
          { academic_year: Number(this.year) },
          { dataset: 'instructors_department_summary' }
        );

        const options = Array.from(
          new Map(
            (Array.isArray(rows) ? rows : [])
              .map(row => ({
                value: String(row?.department_code ?? '').trim(),
                label: String(row?.department_name ?? '').trim()
              }))
              .filter(option => option.value && option.label)
              .map(option => [option.value, option])
          ).values()
        ).sort((a, b) => a.label.localeCompare(b.label));

        this.departmentOptions = options;

        if (this.selectedDepartmentCode && options.some(option => option.value === this.selectedDepartmentCode)) {
          if (forceReloadData) {
            this.loadData();
          }
          return;
        }

        const routedDepartmentCode = this.getDepartmentCode();
        if (routedDepartmentCode && options.some(option => option.value === routedDepartmentCode)) {
          this.selectedDepartmentCode = routedDepartmentCode;
          return;
        }

        if (!options.some(option => option.value === this.selectedDepartmentCode)) {
          this.selectedDepartmentCode = '';
        }
      } catch (e) {
        console.warn('Failed to load department options', e);
        this.departmentOptions = [];
        if (!this.selectedDepartmentCode) {
          this.loadError = 'Unable to load department list.';
        }
      } finally {
        this.loadingDepartments = false;
      }
    },

    async loadData() {
      const departmentCode = String(this.selectedDepartmentCode || '').trim();
      if (!departmentCode) {
        this.rows = [];
        this.loadedDepartmentName = '';
        this.loadError = 'Select a department to view instructor summary.';
        return;
      }

      try {
        this.loading = true;
        this.loadError = '';

        const rows = await bridgetools.req3(
          'reports',
          this.getRequestFilters(),
          { dataset: this.getDataset() }
        );

        this.rows = (Array.isArray(rows) ? rows : [])
          .map(row => ({
          ...row,
          first_name: String(row?.first_name ?? '').trim(),
          last_name: String(row?.last_name ?? '').trim(),
          department_code: String(row?.department_code ?? '').trim(),
          department_name: String(row?.department_name ?? '').trim(),
          academic_year: Number(row?.academic_year)
        }));

        const first = this.rows[0] || {};
        this.loadedDepartmentName = String(
          first?.department_name ??
          this.departmentOptions.find(option => option.value === departmentCode)?.label ??
          this.getDepartmentName()
        ).trim();
      } catch (e) {
        console.warn('Failed to load department instructors dataset', e);
        this.rows = [];
        this.loadedDepartmentName = this.departmentOptions.find(option => option.value === departmentCode)?.label || this.getDepartmentName();
        this.loadError = 'Unable to load department instructor summary.';
      } finally {
        this.loading = false;
      }
    },

    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tableTick += 1; },

    instructorName(row) {
      const first = String(row?.first_name ?? '').trim();
      const last = String(row?.last_name ?? '').trim();
      if (first && last) return `${last}, ${first}`;
      return last || first || '(no name)';
    },
    instructorSortKey(row) {
      return this.instructorName(row).toLowerCase();
    },
    avgLikert(row) {
      const values = [
        row?.likert_available_support,
        row?.likert_clear_instruction,
        row?.likert_career_preparation,
        row?.likert_respect,
        row?.likert_regular_progress_reviews,
        row?.likert_timely_grading,
        row?.likert_helpful_feedback,
        row?.likert_prepared_for_class
      ].map(v => Number(v)).filter(v => Number.isFinite(v));

      if (!values.length) return NaN;
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    },
    intText(v) {
      const n = Number(v);
      return Number.isFinite(n) ? Math.round(n).toLocaleString() : 'n/a';
    },
    numText(v, decimals = 2) {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(decimals) : 'n/a';
    },
    pctText(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) return 'n/a';
      return (n * 100).toFixed(1) + '%';
    },
    pctPillStyle(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) return { backgroundColor: this.colors.gray, color: this.colors.black };
      const pct = n * 100;
      return {
        backgroundColor: pct < 80 ? this.colors.red : (pct < 90 ? this.colors.yellow : this.colors.green),
        color: this.colors.white
      };
    },
    bandDaysToGrade(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) return { backgroundColor: this.colors.gray, color: this.colors.black };
      return {
        backgroundColor: n < 2 ? this.colors.green : (n < 3 ? this.colors.yellow : this.colors.red),
        color: this.colors.white
      };
    },
    bandDaysToRespond(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) return { backgroundColor: this.colors.gray, color: this.colors.black };
      return {
        backgroundColor: n <= 1 ? this.colors.green : (n <= 2 ? this.colors.yellow : this.colors.red),
        color: this.colors.white
      };
    },
    escapeHtml(str) {
      return String(str ?? '')
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
      <h4 class="btech-card-title" style="margin:0;" v-html="titleText"></h4>
      <div style="flex:1;"></div>
      <span class="btech-pill">Rows: {{ visibleRows.length }}</span>
    </div>

    <div class="btech-row" style="gap:.75rem; margin-bottom:8px; align-items:center; justify-content:flex-start; flex-wrap:wrap;">
      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Year</label>
        <select v-model.number="year" style="font-size:.75rem; min-width:90px;">
          <option
            v-for="optionYear in Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)"
            :key="optionYear"
            :value="optionYear"
          >{{ optionYear }}</option>
        </select>
      </div>

      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Department</label>
        <select v-model="selectedDepartmentCode" style="font-size:.75rem; min-width:220px; max-width:320px;">
          <option disabled value="">Select department</option>
          <option
            v-for="option in departmentOptions"
            :key="option.value"
            :value="option.value"
          >{{ option.label }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading || loadingDepartments" class="btech-muted" style="text-align:center; padding:10px;">
      Loading instructors...
    </div>

    <div v-else-if="loadError" class="btech-muted" style="text-align:center; padding:10px;">
      {{ loadError }}
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
        v-for="(row, i) in visibleRows"
        :key="row.canvas_user_id || i"
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
            :style="col.get_style(row)"
            v-html="col.getContent(row)"
          ></span>
        </div>
      </div>
    </div>
  </div>
  `
});
