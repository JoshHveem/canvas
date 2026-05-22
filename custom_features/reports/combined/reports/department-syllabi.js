// department-syllabi.js
Vue.component('reports-department-syllabi', {
  mixins: [
    window.ReportMixins.formatting,
    window.ReportMixins.departmentScoped({
      optionsDataset: 'department_syllabi_summary',
      emptySelectionMessage: 'Select a department from the summary report to view details.',
      loadErrorMessage: 'Unable to load department syllabi details.'
    })
  ],

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('Course', colors);

    return {
      colors,
      table,
      filters: {
        submitted: '',
        approved: '',
        published_course: ''
      }
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Course', 'Course name (links to Simple Syllabus in Canvas).', '16rem', false, 'string',
        s => this.courseLinkHtml(s),
        null,
        s => this.courseSortKey(s)
      ),
      new window.ReportColumn(
        'Approval', 'Simple Syllabus doc code (links to Simple Syllabus).', '6rem', false, 'string',
        s => this.docLinkHtml(s),
        null,
        s => s?.doc_code ?? ''
      ),
      new window.ReportColumn(
        'Code', 'Course code.', '6rem', false, 'string',
        s => this.courseCodeText(s),
        null,
        s => this.courseCodeSortKey(s)
      ),
      new window.ReportColumn(
        'Status', 'Needs submission / needs approval / completed.', '8rem', false, 'string',
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
      )
    ]);
  },

  mounted() {
  },

  watch: {
    rows: {
      immediate: true,
      handler() {
        this.maybePreloadSimpleSyllabusAuth();
      }
    }
  },

  computed: {
    visibleRows() {
      const filtered = this.rows.filter(row => {
        if (this.filters.submitted !== '') {
          const want = this.filters.submitted === true || this.filters.submitted === 'true';
          if ((row?.is_submitted === true) !== want) return false;
        }
        if (this.filters.approved !== '') {
          const want = this.filters.approved === true || this.filters.approved === 'true';
          if ((row?.is_approved === true) !== want) return false;
        }
        if (this.filters.published_course !== '') {
          const want = this.filters.published_course === true || this.filters.published_course === 'true';
          if ((row?.is_published_course === true) !== want) return false;
        }
        return true;
      });

      this.table.setRows(filtered);
      return this.table.getSortedRows();
    },

    titleText() {
      if (this.anonymous) return 'DEPARTMENT - Syllabi';
      const name = this.loadedDepartmentName || this.getDepartmentName() || 'Department';
      return `${this.escapeHtml(name)} - Syllabi`;
    }
  },

  methods: {
    mapRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        ...row,
        doc_code: row?.doc_code ?? row?.simple_syllabus_doc_id ?? '',
        department_code: String(row?.department_code ?? '').trim(),
        course_code: String(row?.course_code ?? '').trim(),
        course_name: String(row?.course_name ?? row?.name ?? '').trim()
      }));
    },

    statusText(s) {
      if (s?.is_submitted !== true) return 'Needs submission';
      if (s?.is_approved !== true) return 'Needs approval';
      return 'Completed';
    },
    statusSort(s) {
      if (s?.is_submitted === true && s?.is_approved === true) return 2;
      if (s?.is_submitted === true && s?.is_approved !== true) return 1;
      return 0;
    },
    statusPillStyle(s) {
      const status = this.statusText(s);
      if (status === 'Completed') return { backgroundColor: this.colors.green, color: this.colors.white };
      if (status === 'Needs approval') return { backgroundColor: this.colors.yellow, color: this.colors.white };
      return { backgroundColor: this.colors.red, color: this.colors.white };
    },
    courseCodeText(s) {
      return this.escapeHtml(String(s?.course_code ?? '').trim() || '(no course code)');
    },
    courseCodeSortKey(s) {
      return String(s?.course_code ?? '').trim().toLowerCase();
    },
    courseText(s) {
      return this.escapeHtml(String(s?.course_name ?? '').trim() || '(no course name)');
    },
    courseSortKey(s) {
      return String(s?.course_name ?? '').trim().toLowerCase();
    },
    courseLinkHtml(s) {
      const id = s?.canvas_course_id;
      const text = this.courseText(s);
      if (id === undefined || id === null || id === '') return text;
      const url = `https://btech.instructure.com/courses/${encodeURIComponent(id)}/external_tools/106228`;
      return `<a href="${url}" target="_blank" rel="noopener">${text}</a>`;
    },
    docLinkHtml(s) {
      const docCode = s?.doc_code;
      const text = this.escapeHtml(docCode || '');
      if (!docCode) return text;
      const url = `https://btech.simplesyllabus.com/en-US/doc/${encodeURIComponent(docCode)}`;
      return `<a href="${url}" target="_blank" rel="noopener">${text}</a>`;
    },
    maybePreloadSimpleSyllabusAuth() {
      if (this.anonymous) return;
      if (window.__ssPreloaded) return;
      const first = this.rows.find(row => row?.canvas_course_id);
      if (!first) return;

      window.__ssPreloaded = true;
      const iframe = document.createElement('iframe');
      iframe.src = `https://btech.instructure.com/courses/${encodeURIComponent(first.canvas_course_id)}/external_tools/106228`;
      iframe.style.position = 'absolute';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
    }
  },

  template: `
  <report-table-shell
    :title-html="titleText"
    :table="table"
    :rows="visibleRows"
    :loading="loading || loadingDepartments"
    :load-error="loadError"
    loading-text="Loading syllabi..."
    :row-key-fn="(row, index) => row.course_code || row.canvas_course_id || index"
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
        <label class="btech-muted" style="font-size:.75rem;">Submitted</label>
        <select v-model="filters.submitted" style="font-size:.75rem; min-width:70px;">
          <option value="">All</option>
          <option :value="true">Yes</option>
          <option :value="false">No</option>
        </select>
      </div>

      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Approved</label>
        <select v-model="filters.approved" style="font-size:.75rem; min-width:70px;">
          <option value="">All</option>
          <option :value="true">Yes</option>
          <option :value="false">No</option>
        </select>
      </div>
    </template>
  </report-table-shell>
  `
});
