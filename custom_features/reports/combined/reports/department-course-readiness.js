Vue.component('multi-filter-pill', {
  props: {
    label: { type: String, required: true },
    options: { type: Array, required: true },
    value: { type: Array, required: true },
    placeholder: { type: String, default: 'All' },
    maxSummaryItems: { type: Number, default: 2 }
  },

  data() {
    return { open: false };
  },

  computed: {
    summary() {
      const selected = Array.isArray(this.value) ? this.value : [];
      if (!selected.length) return this.placeholder;
      if (selected.length === this.options.length) return 'All';

      const first = selected.slice(0, this.maxSummaryItems);
      const rest = selected.length - first.length;
      return rest > 0 ? `${first.join(', ')} +${rest}` : first.join(', ');
    }
  },

  mounted() {
    document.addEventListener('click', this.onDocClick, true);
  },

  beforeDestroy() {
    document.removeEventListener('click', this.onDocClick, true);
  },

  methods: {
    toggleOpen() { this.open = !this.open; },
    close() { this.open = false; },

    onDocClick(e) {
      if (!this.open) return;
      const root = this.$refs.root;
      if (root && !root.contains(e.target)) this.open = false;
    },

    isChecked(opt) {
      return (this.value || []).includes(opt);
    },

    setChecked(opt, checked) {
      const current = Array.isArray(this.value) ? [...this.value] : [];
      const has = current.includes(opt);

      let next = current;
      if (checked && !has) next.push(opt);
      if (!checked && has) next = current.filter(x => x !== opt);

      this.$emit('input', next);
    },

    selectAll() {
      this.$emit('input', [...this.options]);
    },

    clearAll() {
      this.$emit('input', []);
    }
  },

  template: `
    <div ref="root" style="position:relative; display:inline-block; min-width:220px;">
      <div
        class="btech-pill"
        style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:6px 10px; cursor:pointer; user-select:none;"
        @click="toggleOpen"
        :title="label + ': ' + summary"
      >
        <div style="display:flex; flex-direction:column; line-height:1.1;">
          <span style="font-size:.7rem; opacity:.8;"><b>{{ label }}</b></span>
          <span style="font-size:.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:260px;">
            {{ summary }}
          </span>
        </div>

        <svg style="width:14px; height:14px; opacity:.8;" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 7l5 6 5-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </div>

      <div
        v-if="open"
        class="btech-card btech-theme"
        style="position:absolute; z-index:50; top:calc(100% + 6px); left:0; width:320px; padding:10px; box-shadow:0 10px 25px rgba(0,0,0,.12);"
        @click.stop
      >
        <div class="btech-row" style="align-items:center; margin-bottom:8px;">
          <div style="font-size:.8rem;"><b>{{ label }}</b></div>
          <div style="flex:1;"></div>
          <button class="btech-btn" type="button" @click="close">Done</button>
        </div>

        <div class="btech-row" style="gap:8px; margin-bottom:8px;">
          <button class="btech-btn" type="button" @click="selectAll">All</button>
          <button class="btech-btn" type="button" @click="clearAll">None</button>
          <div style="flex:1;"></div>
          <span class="btech-muted" style="font-size:.75rem;">
            {{ (value || []).length }} / {{ options.length }}
          </span>
        </div>

        <div style="max-height:220px; overflow:auto; border:1px solid #e5e7eb; border-radius:8px; padding:8px;">
          <label
            v-for="opt in options"
            :key="opt"
            style="display:flex; align-items:center; gap:8px; padding:4px 2px; cursor:pointer;"
          >
            <input
              type="checkbox"
              :checked="isChecked(opt)"
              @change="setChecked(opt, $event.target.checked)"
            />
            <span style="font-size:.8rem;">{{ opt }}</span>
          </label>

          <div v-if="!options || !options.length" class="btech-muted" style="font-size:.8rem;">
            No options.
          </div>
        </div>
      </div>
    </div>
  `
});

Vue.component('reports-department-course-readiness', {
  mixins: [
    window.ReportMixins.formatting,
    window.ReportMixins.departmentScoped({
      optionsDataset: 'canvas_course_readiness',
      emptySelectionMessage: 'Select a department from the summary report to view details.',
      loadErrorMessage: 'Unable to load department course readiness details.'
    })
  ],

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('Course', colors);

    return {
      colors,
      table,
      filters: {
        source: ['Jenzabar'],
        type: ['CS'],
        course_status: []
      },
      filtersInitialized: false
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Course', 'Course code and name.', '18rem', false, 'string',
        c => this.courseLinkHtml(c),
        null,
        c => this.courseSortKey(c)
      ),
      new window.ReportColumn(
        'Type', 'Course type.', '6rem', false, 'string',
        c => this.escapeHtml(String(c?.course_type_code ?? '').trim() || 'n/a'),
        null,
        c => String(c?.course_type_code ?? '').trim()
      ),
      new window.ReportColumn(
        'Course Status', 'Status of the Canvas course.', '8rem', false, 'string',
        c => this.statusText(c?.course_status),
        c => this.statusStyle(c?.course_status),
        c => String(c?.course_status ?? '')
      ),
      new window.ReportColumn(
        'Syllabus', 'Syllabus status.', '7rem', false, 'string',
        c => this.statusText(c?.syllabus_status),
        c => this.statusStyle(c?.syllabus_status),
        c => String(c?.syllabus_status ?? '')
      ),
      new window.ReportColumn(
        'Course Eval', 'Course evaluation status.', '8rem', false, 'string',
        c => this.statusText(c?.course_evaluation_status),
        c => this.statusStyle(c?.course_evaluation_status),
        c => String(c?.course_evaluation_status ?? '')
      ),
      new window.ReportColumn(
        'Instructor Eval', 'Instructor evaluation status.', '9rem', false, 'string',
        c => this.statusText(c?.instructor_evaluation_status),
        c => this.statusStyle(c?.instructor_evaluation_status),
        c => String(c?.instructor_evaluation_status ?? '')
      ),
      new window.ReportColumn(
        'Employment Skills', 'Employment skills evaluation status.', '10rem', false, 'string',
        c => this.statusText(c?.employment_skills_evaluation_status),
        c => this.statusStyle(c?.employment_skills_evaluation_status),
        c => String(c?.employment_skills_evaluation_status ?? '')
      ),
      new window.ReportColumn(
        'Canvas Content', 'Canvas content status.', '8rem', false, 'string',
        c => this.statusText(c?.canvas_content_status),
        c => this.statusStyle(c?.canvas_content_status),
        c => String(c?.canvas_content_status ?? '')
      )
    ]);
  },

  mounted() {
  },

  watch: {
    reportContext: {
      deep: true,
      handler() {
        this.filtersInitialized = false;
      }
    },
    async year() {
      this.filtersInitialized = false;
    },
    selectedDepartmentCode() {
      this.filtersInitialized = false;
    }
  },

  computed: {
    allCourses() {
      return Array.isArray(this.rows) ? this.rows : [];
    },

    sourceOptions() {
      return this.uniqueSorted(this.allCourses.map(c => String(c?.creation_source ?? '').trim()).filter(Boolean));
    },

    typeOptions() {
      return this.uniqueSorted(this.allCourses.map(c => String(c?.course_type_code ?? '').trim()).filter(Boolean));
    },

    courseStatusOptions() {
      return this.uniqueSorted(this.allCourses.map(c => String(c?.course_status ?? '').trim()).filter(Boolean));
    },

    visibleRows() {
      this.initDefaultsOnce();
      const filtered = this.allCourses.filter(this.passesFilters);
      this.table.setRows(filtered);
      return this.table.getSortedRows();
    },

    titleText() {
      if (this.anonymous) return 'DEPARTMENT - Course Readiness';
      const name = this.loadedDepartmentName || this.getDepartmentName() || 'Department';
      return `${this.escapeHtml(name)} - Course Readiness`;
    }
  },

  methods: {
    mapRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        ...row,
        department_code: String(row?.department_code ?? '').trim(),
        course_code: String(row?.course_code ?? '').trim(),
        course_name: String(row?.course_name ?? row?.name ?? '').trim(),
        creation_source: String(row?.creation_source ?? '').trim(),
        course_type_code: String(row?.course_type_code ?? row?.course_type ?? '').trim(),
        course_status: String(row?.course_status ?? '').trim(),
        syllabus_status: String(row?.syllabus_status ?? '').trim(),
        course_evaluation_status: String(row?.course_evaluation_status ?? '').trim(),
        instructor_evaluation_status: String(row?.instructor_evaluation_status ?? '').trim(),
        employment_skills_evaluation_status: row?.employment_skills_evaluation_status,
        canvas_content_status: String(row?.canvas_content_status ?? '').trim()
      }));
    },

    initDefaultsOnce() {
      if (this.filtersInitialized) return;
      if (!this.allCourses.length) return;

      const courseStatusOptions = this.courseStatusOptions;
      if (!this.filters.course_status.length) {
        this.filters.course_status = courseStatusOptions.filter(status => status !== 'Deleted');
      }

      if (this.filters.source.length) {
        if (!this.filters.source.some(value => this.sourceOptions.includes(value))) {
          this.filters.source = [...this.sourceOptions];
        }
      } else {
        this.filters.source = this.sourceOptions.includes('Jenzabar') ? ['Jenzabar'] : [...this.sourceOptions];
      }

      if (this.filters.type.length) {
        if (!this.filters.type.some(value => this.typeOptions.includes(value))) {
          this.filters.type = [...this.typeOptions];
        }
      } else {
        this.filters.type = this.typeOptions.includes('CS') ? ['CS'] : [...this.typeOptions];
      }

      this.filtersInitialized = true;
    },

    passesFilters(course) {
      const src = String(course?.creation_source ?? '').trim();
      const typ = String(course?.course_type_code ?? '').trim();
      const status = String(course?.course_status ?? '').trim();

      const srcOk = !this.filters.source.length || this.filters.source.includes(src);
      const typOk = !this.filters.type.length || this.filters.type.includes(typ);
      const statusOk = !this.filters.course_status.length || this.filters.course_status.includes(status);

      return srcOk && typOk && statusOk;
    },

    statusStyle(s) {
      const value = String(s ?? '').trim();

      if (!value || value === 'N/A') return { backgroundColor: this.colors.gray, color: this.colors.black };
      if (value === 'Deleted') return { backgroundColor: this.colors.gray, color: this.colors.black };
      if (value === 'Published' || value === 'Approved') {
        return { backgroundColor: this.colors.green, color: this.colors.white };
      }
      if (value === 'Unpublished' || value === 'Pending Approval') {
        return { backgroundColor: this.colors.yellow, color: this.colors.black };
      }
      if (value === 'None' || value === 'Unsubmitted') {
        return { backgroundColor: this.colors.red, color: this.colors.white };
      }
      return { backgroundColor: this.colors.gray, color: this.colors.black };
    },

    statusText(s) {
      const value = String(s ?? '').trim();
      return value || 'N/A';
    },

    courseText(course) {
      const code = String(course?.course_code ?? '').trim();
      const name = String(course?.course_name ?? '').trim();
      if (code && name) return `${code} - ${name}`;
      return code || name || '(no course)';
    },

    courseSortKey(course) {
      return `${String(course?.course_code ?? '').trim()} ${String(course?.course_name ?? '').trim()}`.toLowerCase();
    },

    courseLinkHtml(course) {
      const id = course?.canvas_course_id;
      const text = this.escapeHtml(this.courseText(course));
      if (id === undefined || id === null || id === '') return text;
      return `<a href="/courses/${encodeURIComponent(id)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
  },

  template: `
  <report-table-shell
    :title-html="titleText"
    :table="table"
    :rows="visibleRows"
    :loading="loading || loadingDepartments"
    :load-error="loadError"
    loading-text="Loading course readiness..."
    :row-key-fn="(row, index) => row.canvas_course_id || (row.course_code + '-' + index)"
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

      <multi-filter-pill
        label="Type"
        :options="typeOptions"
        v-model="filters.type"
        placeholder="All"
      ></multi-filter-pill>

      <multi-filter-pill
        label="Course Status"
        :options="courseStatusOptions"
        v-model="filters.course_status"
        placeholder="All"
      ></multi-filter-pill>
    </template>
  </report-table-shell>
  `
});
