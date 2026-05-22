Vue.component('reports-department-instructors', {
  mixins: [
    window.ReportMixins.formatting,
    window.ReportMixins.departmentScoped({
      optionsDataset: 'instructors_department_summary',
      emptySelectionMessage: 'Select a department to view instructor summary.',
      loadErrorMessage: 'Unable to load department instructor summary.'
    })
  ],

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('Instructor', colors);

    return {
      colors,
      table,
      filters: {
        instructor_id: ''
      }
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
        '% Graded', 'Weighted share of department grading done by this instructor.', '8rem', false, 'number',
        row => this.pctText(row?.perc_department_instructor_support_hours_weighted),
        row => this.pctPillStyle(row?.perc_department_instructor_support_hours_weighted),
        row => Number(row?.perc_department_instructor_support_hours_weighted ?? -1)
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
  },

  watch: {
    rows: {
      immediate: true,
      handler() {
        const selected = String(this.filters.instructor_id || '').trim();
        if (!selected) return;
        if (!this.instructorOptions.some(option => option.value === selected)) {
          this.filters.instructor_id = '';
        }
      }
    }
  },

  computed: {
    instructorOptions() {
      return this.rows
        .map(row => ({
          value: String(row?.canvas_user_id ?? '').trim(),
          label: this.instructorName(row)
        }))
        .filter(option => option.value && option.label)
        .sort((a, b) => a.label.localeCompare(b.label));
    },

    visibleRows() {
      const selected = String(this.filters.instructor_id || '').trim();
      const filtered = !selected
        ? this.rows
        : this.rows.filter(row => String(row?.canvas_user_id ?? '').trim() === selected);

      this.table.setRows(filtered);
      return this.table.getSortedRows();
    },

    titleText() {
      if (this.anonymous) return 'DEPARTMENT - Instructors';
      const name = this.loadedDepartmentName || this.getDepartmentName() || 'Department';
      return `${this.escapeHtml(name)} - Instructors`;
    }
  },

  methods: {
    mapRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        ...row,
        first_name: String(row?.first_name ?? '').trim(),
        last_name: String(row?.last_name ?? '').trim(),
        department_code: String(row?.department_code ?? '').trim(),
        department_name: String(row?.department_name ?? '').trim(),
        academic_year: Number(row?.academic_year)
      }));
    },

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
    }
  },

  template: `
  <report-table-shell
    :title-html="titleText"
    :table="table"
    :rows="visibleRows"
    :loading="loading || loadingDepartments"
    :load-error="loadError"
    loading-text="Loading instructors..."
    :row-key-fn="(row, index) => row.canvas_user_id || index"
  >
    <template #filters>
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
          <option
            v-for="option in departmentOptions"
            :key="option.value"
            :value="option.value"
          >{{ option.label }}</option>
        </select>
      </div>

      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Instructor</label>
        <select v-model="filters.instructor_id" style="font-size:.75rem; min-width:220px; max-width:320px;">
          <option value="">All</option>
          <option
            v-for="option in instructorOptions"
            :key="option.value"
            :value="option.value"
          >{{ option.label }}</option>
        </select>
      </div>
    </template>
  </report-table-shell>
  `
});
