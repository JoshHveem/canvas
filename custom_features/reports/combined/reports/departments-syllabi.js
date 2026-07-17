// departments-syllabi.js
Vue.component('reports-departments-syllabi', {
  mixins: [
    window.ReportMixins.formatting,
    window.ReportMixins.yearSummary({
      loadErrorMessage: 'Unable to load department syllabi summary.'
    })
  ],

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('Department', colors);

    return {
      colors,
      table
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Department', 'Department name.', '16rem', false, 'string',
        d => this.anonymous ? 'DEPARTMENT' : this.escapeHtml(this.departmentName(d)),
        null,
        d => this.departmentName(d)
      ),
      new window.ReportColumn(
        'Courses', 'Total courses in the req3 summary.', '6rem', false, 'number',
        d => String(this.totalCourses(d)),
        null,
        d => this.totalCourses(d)
      ),
      new window.ReportColumn(
        'Unsubmitted', 'Count: not yet submitted.', '7rem', false, 'number',
        d => String(this.needsSubmission(d)),
        d => this.countPillStyle(this.needsSubmission(d)),
        d => this.needsSubmission(d)
      ),
      new window.ReportColumn(
        'Needs Approval', 'Count: submitted and not approved.', '7rem', false, 'number',
        d => String(this.needsApproval(d)),
        d => this.countPillStyle(this.needsApproval(d)),
        d => this.needsApproval(d)
      ),
      new window.ReportColumn(
        'Completed', 'Count: approved courses.', '7rem', false, 'number',
        d => String(this.completedCount(d)),
        d => this.countPillStyle(this.totalCourses(d) - this.completedCount(d)),
        d => this.completedCount(d)
      ),
      new window.ReportColumn(
        '% Completed', 'completed / total', '8rem', false, 'number',
        d => this.pctText(this.pctCompleted(d)),
        d => this.pctPillStyle(this.pctCompleted(d)),
        d => this.pctCompleted(d)
      )
    ]);
  },
  computed: {
    visibleRows() {
      this.table.setRows(this.rows);
      return this.table.getSortedRows();
    }
  },

  methods: {
    mapRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        ...row,
        department_code: String(row?.department_code ?? '').trim(),
        department_name: String(row?.department_name ?? '').trim(),
        num_courses: Number(row?.num_courses) || 0,
        num_courses__submitted: Number(row?.num_courses__submitted) || 0,
        num_courses__approved: Number(row?.num_courses__approved) || 0
      }));
    },

    emitDrill(department) {
      this.$emit('drill-report', {
        report: 'syllabi',
        subMenu: 'course-status',
        account: String(department?.department_code ?? '').trim(),
        department_code: String(department?.department_code ?? '').trim(),
        department_name: String(department?.department_name ?? '').trim()
      });
    },

    departmentName(department) {
      return String(department?.department_name ?? department?.name ?? department?.department_code ?? '').trim();
    },
    totalCourses(department) {
      return Number(department?.num_courses) || 0;
    },
    submittedCount(department) {
      return Number(department?.num_courses__submitted) || 0;
    },
    completedCount(department) {
      return Number(department?.num_courses__approved) || 0;
    },
    needsSubmission(department) {
      return Math.max(this.totalCourses(department) - this.submittedCount(department), 0);
    },
    needsApproval(department) {
      return Math.max(this.submittedCount(department) - this.completedCount(department), 0);
    },
    pctCompleted(department) {
      const total = this.totalCourses(department);
      return total > 0 ? (this.completedCount(department) / total) : NaN;
    }
  },

  template: `
  <report-table-shell
    title-html="Departments - Syllabi"
    :table="table"
    :rows="visibleRows"
    :loading="loading"
    :load-error="loadError"
    loading-text="Loading departments..."
    :row-key-fn="(row, index) => row.department_code || index"
    :row-clickable="true"
    @row-click="emitDrill"
  >
    <template #filters>
      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Year</label>
        <select v-model.number="year" v-bind="filterAttrs('academic_year')" style="font-size:.75rem; min-width:90px;">
          <option
            v-for="optionYear in Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)"
            :key="optionYear"
            :value="optionYear"
          >{{ optionYear }}</option>
        </select>
      </div>
    </template>
  </report-table-shell>
  `
});
