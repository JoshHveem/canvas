Vue.component('reports-departments-course-readiness', {
  mixins: [
    window.ReportMixins.formatting,
    window.ReportMixins.yearSummary({
      loadErrorMessage: 'Unable to load course readiness summary.'
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
        'Courses', 'Total courses.', '6rem', false, 'number',
        d => String(this.totalCourses(d)),
        null,
        d => this.totalCourses(d)
      ),
      new window.ReportColumn(
        'Syllabi Approved', 'Courses with approved syllabi.', '8rem', false, 'number',
        d => this.countPctText(this.syllabiApprovedCount(d), this.syllabiApprovedPct(d)),
        d => this.pctPillStyle(this.syllabiApprovedPct(d)),
        d => this.syllabiApprovedPct(d)
      ),
      new window.ReportColumn(
        'Course Eval', 'Courses with published course evaluations.', '5rem', false, 'number',
        d => this.countPctText(this.courseEvalPublishedCount(d), this.courseEvalPublishedPct(d)),
        d => this.pctPillStyle(this.courseEvalPublishedPct(d)),
        d => this.courseEvalPublishedPct(d)
      ),
      new window.ReportColumn(
        'Instructor Eval', 'Courses with published instructor evaluations.', '5rem', false, 'number',
        d => this.countPctText(this.instructorEvalPublishedCount(d), this.instructorEvalPublishedPct(d)),
        d => this.pctPillStyle(this.instructorEvalPublishedPct(d)),
        d => this.instructorEvalPublishedPct(d)
      ),
      new window.ReportColumn(
        'Employment Skills', 'Courses with published employment skills evaluations.', '5rem', false, 'number',
        d => this.countPctText(this.employmentSkillsPublishedCount(d), this.employmentSkillsPublishedPct(d)),
        d => this.pctPillStyle(this.employmentSkillsPublishedPct(d)),
        d => this.employmentSkillsPublishedPct(d)
      ),
      new window.ReportColumn(
        'Content', 'Courses with published Canvas content.', '4rem', false, 'number',
        d => this.countPctText(this.contentPublishedCount(d), this.contentPublishedPct(d)),
        d => this.pctPillStyle(this.contentPublishedPct(d)),
        d => this.contentPublishedPct(d)
      ),
      new window.ReportColumn(
        'Ready', 'Courses that meet readiness requirements.', '4rem', false, 'number',
        d => this.countPctText(this.readyCount(d), this.readyPct(d)),
        d => this.pctPillStyle(this.readyPct(d)),
        d => this.readyPct(d)
      ),
      new window.ReportColumn(
        'Published', 'Ready courses that are also published.', '5rem', false, 'number',
        d => this.countPctText(this.readyPublishedCount(d), this.readyPublishedPct(d)),
        d => this.pctPillStyle(this.readyPublishedPct(d)),
        d => this.readyPublishedPct(d)
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
        num_syllabi_approved: Number(row?.num_syllabi_approved) || 0,
        perc_syllabi_approved: Number(row?.perc_syllabi_approved),
        num_course_evaluation_published: Number(row?.num_course_evaluation_published) || 0,
        perc_course_evaluation_published: Number(row?.perc_course_evaluation_published),
        num_instructor_evaluation_published: Number(row?.num_instructor_evaluation_published) || 0,
        perc_instructor_evaluation_published: Number(row?.perc_instructor_evaluation_published),
        num_employment_skills_evaluation_published: Number(row?.num_employment_skills_evaluation_published) || 0,
        perc_employment_skills_evaluation_published: Number(row?.perc_employment_skills_evaluation_published),
        num_content_published: Number(row?.num_content_published) || 0,
        perc_content_published: Number(row?.perc_content_published),
        num_courses_ready: Number(row?.num_courses_ready) || 0,
        perc_courses_ready: Number(row?.perc_courses_ready),
        num_courses_ready_published: Number(row?.num_courses_ready_published) || 0,
        perc_courses_ready_published: Number(row?.perc_courses_ready_published)
      }));
    },

    emitDrill(department) {
      this.$emit('drill-report', {
        report: 'course-readiness',
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
    syllabiApprovedCount(department) {
      return Number(department?.num_syllabi_approved) || 0;
    },
    syllabiApprovedPct(department) {
      return Number(department?.perc_syllabi_approved);
    },
    courseEvalPublishedCount(department) {
      return Number(department?.num_course_evaluation_published) || 0;
    },
    courseEvalPublishedPct(department) {
      return Number(department?.perc_course_evaluation_published);
    },
    instructorEvalPublishedCount(department) {
      return Number(department?.num_instructor_evaluation_published) || 0;
    },
    instructorEvalPublishedPct(department) {
      return Number(department?.perc_instructor_evaluation_published);
    },
    employmentSkillsPublishedCount(department) {
      return Number(department?.num_employment_skills_evaluation_published) || 0;
    },
    employmentSkillsPublishedPct(department) {
      return Number(department?.perc_employment_skills_evaluation_published);
    },
    contentPublishedCount(department) {
      return Number(department?.num_content_published) || 0;
    },
    contentPublishedPct(department) {
      return Number(department?.perc_content_published);
    },
    readyCount(department) {
      return Number(department?.num_courses_ready) || 0;
    },
    readyPct(department) {
      return Number(department?.perc_courses_ready);
    },
    readyPublishedCount(department) {
      return Number(department?.num_courses_ready_published) || 0;
    },
    readyPublishedPct(department) {
      return Number(department?.perc_courses_ready_published);
    },
    countPctText(count, pct) {
      const n = Number(count);
      const pctText = this.pctText(pct);
      if (Number.isFinite(n)) return String(n);
      return pctText;
    }
  },

  template: `
  <report-table-shell
    title-html="Departments - Course Readiness Summary"
    :table="table"
    :rows="visibleRows"
    :loading="loading"
    :load-error="loadError"
    loading-text="Loading departments..."
    :row-key-fn="(row, index) => row.department_code || row.department_name || index"
    :row-clickable="true"
    @row-click="emitDrill"
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
    </template>
  </report-table-shell>
  `
});
