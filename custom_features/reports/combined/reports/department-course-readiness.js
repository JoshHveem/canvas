Vue.component('multi-filter-pill', {
  props: {
    label: { type: String, required: true },
    options: { type: Array, required: true },
    value: { type: Array, required: true }, // selected
    placeholder: { type: String, default: 'All' },
    maxSummaryItems: { type: Number, default: 2 },
  },

  data() {
    return { open: false };
  },

  computed: {
    summary() {
      const selected = Array.isArray(this.value) ? this.value : [];
      if (!selected.length) return this.placeholder;

      // if everything selected
      if (selected.length === this.options.length) return 'All';

      // show up to maxSummaryItems then "+N"
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
    },

    close() { this.open = false; }
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
  props: {
    year: { type: [Number, String], required: true },
    courseReadiness: { type: Object, required: true },
    anonymous: { type: Boolean, default: false },
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

      // --- FILTER STATE ---
      filters: {
        source: ['Jenzabar'],   // default
        type: ['CS'],           // default
        course_status: []       // will be initialized to "all except Deleted" once we know options
      },

      filtersInitialized: false,
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Course', 'Course code.', '14rem', false, 'string',
        c => this.anonymous ? 'COURSE' : (c?.course_code ?? ''),
        null,
        c => (c?.course_code ?? '')
      ),

      new window.ReportColumn(
        'Canvas ID', 'Canvas course id.', '7rem', false, 'number',
        c => (c?.canvas_course_id ?? 'n/a'),
        c => `<a href="/courses/${c?.canvas_course_id}" target="_blank" rel="noopener noreferrer">${c?.canvas_course_id ?? 'n/a'}</a>`,
        c => Number(c?.canvas_course_id ?? -1)
      ),

      new window.ReportColumn(
        'Source', 'Creation source.', '7rem', false, 'string',
        c => (c?.creation_source ?? ''),
        null,
        c => (c?.creation_source ?? '')
      ),

      new window.ReportColumn(
        'Type', 'Course type.', '7rem', false, 'string',
        c => (c?.course_type ?? ''),
        null,
        c => (c?.course_type ?? '')
      ),

      new window.ReportColumn(
        'Course Status', 'Status of the Canvas course (published, etc.).', '8rem', false, 'string',
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
      ),
    ]);
  },

  computed: {
    allCourses() {
      return Array.isArray(this.courseReadiness?.courses) ? this.courseReadiness.courses : [];
    },

    // --- filter option lists derived from data ---
    sourceOptions() {
      return this.uniqueSorted(this.allCourses.map(c => String(c?.creation_source ?? '').trim()).filter(Boolean));
    },
    typeOptions() {
      return this.uniqueSorted(this.allCourses.map(c => String(c?.course_type ?? '').trim()).filter(Boolean));
    },
    courseStatusOptions() {
      return this.uniqueSorted(this.allCourses.map(c => String(c?.course_status ?? '').trim()).filter(Boolean));
    },

    // rows after filtering + sorting
    visibleRows() {
      // initialize defaults once options exist
      this.initDefaultsOnce();

      const rows = this.allCourses.filter(this.passesFilters);

      this.table.setRows(rows);
      return this.table.getSortedRows();
    }
  },

  methods: {
    // --- init defaults when data arrives ---
    initDefaultsOnce() {
      if (this.filtersInitialized) return;
      if (!this.allCourses.length) return;

      // Default course_status = all except Deleted
      const opts = this.courseStatusOptions;
      if (!this.filters.course_status || this.filters.course_status.length === 0) {
        this.filters.course_status = opts.filter(s => s !== 'Deleted');
      }

      // Default source/type: only set if those values exist; otherwise fall back to "all"
      if (this.filters.source?.length) {
        if (!this.sourceOptions.includes(this.filters.source[0])) {
          this.filters.source = [...this.sourceOptions]; // fallback: all
        }
      } else {
        this.filters.source = ['Jenzabar'];
      }

      if (this.filters.type?.length) {
        if (!this.typeOptions.includes(this.filters.type[0])) {
          this.filters.type = [...this.typeOptions]; // fallback: all
        }
      } else {
        this.filters.type = ['CS'];
      }

      this.filtersInitialized = true;
    },

    // --- general utilities ---
    uniqueSorted(arr) {
      return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
    },

    // --- multi-select handler ---
    onMultiSelectChange(field, evt) {
      const selected = Array.from(evt.target.selectedOptions).map(o => o.value);
      this.$set(this.filters, field, selected);
      this.tableTick++; // force re-render if needed
    },

    selectAll(field, options) {
      this.$set(this.filters, field, [...options]);
      this.tableTick++;
    },

    selectNone(field) {
      this.$set(this.filters, field, []);
      this.tableTick++;
    },

    passesFilters(course) {
      const src = String(course?.creation_source ?? '').trim();
      const typ = String(course?.course_type ?? '').trim();
      const cs  = String(course?.course_status ?? '').trim();

      // If a filter list is empty, treat as "no filter" OR "show none"?
      // Most UIs treat empty selection as "show all". We'll do that.
      const srcOk = !this.filters.source?.length || this.filters.source.includes(src);
      const typOk = !this.filters.type?.length || this.filters.type.includes(typ);
      const csOk  = !this.filters.course_status?.length || this.filters.course_status.includes(cs);

      return srcOk && typOk && csOk;
    },

    // --- report table plumbing ---
    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tableTick++; },

    // --- status helpers (your bucket rules) ---
    statusStyle(s) {
      const v = String(s ?? '').trim();

      if (!v || v === 'N/A') return { backgroundColor: this.colors.gray, color: this.colors.black };
      if (v === 'Deleted')   return { backgroundColor: this.colors.gray, color: this.colors.black };

      if (v === 'Published' || v === 'Approved') {
        return { backgroundColor: this.colors.green, color: this.colors.white };
      }
      if (v === 'Unpublished' || v === 'Pending Approval') {
        return { backgroundColor: this.colors.yellow, color: this.colors.black };
      }
      if (v === 'None' || v === 'Unsubmitted' || v === 'Unpublished') {
        return { backgroundColor: this.colors.red, color: this.colors.white };
      }
      return { backgroundColor: this.colors.gray, color: this.colors.black };
    },

    statusText(s) {
      const v = String(s ?? '').trim();
      return v ? v : 'N/A';
    },

    overallStatus(course) {
      const cs = String(course?.course_status ?? '').trim();
      if (cs === 'Deleted') return 'N/A';

      const vals = [
        course?.course_status,
        course?.syllabus_status,
        course?.course_evaluation_status,
        course?.instructor_evaluation_status,
        course?.employment_skills_evaluation_status,
        course?.canvas_content_status
      ].map(v => String(v ?? '').trim());

      if (vals.includes('None') || vals.includes('Unsubmitted')) return 'Needs Attention';
      if (vals.includes('Unpublished') || vals.includes('Pending Approval') || cs === 'Unpublished') return 'In Progress';
      return 'Ready';
    },

    overallStyle(label) {
      if (label === 'Ready') return { backgroundColor: this.colors.green, color: this.colors.white };
      if (label === 'In Progress') return { backgroundColor: this.colors.yellow, color: this.colors.black };
      if (label === 'Needs Attention') return { backgroundColor: this.colors.red, color: this.colors.white };
      return { backgroundColor: this.colors.gray, color: this.colors.black };
    },
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    <div class="btech-row" style="align-items:center; margin-bottom:8px;">
      <h4 class="btech-card-title" style="margin:0;">Course Readiness</h4>
      <div style="flex:1;"></div>
      <span class="btech-pill" style="margin-left:8px;">Year: {{ year }}</span>
      <span class="btech-pill" style="margin-left:8px;">Courses: {{ visibleRows.length }}</span>
    </div>

    <div v-if="!courseReadiness || !courseReadiness.courses" class="btech-muted" style="text-align:center; padding:10px;">
      No course readiness data.
    </div>

    <div v-else>
      <!-- Filters -->
      <div style="gap:10px; align-items:center; margin-bottom:10px; flex-wrap:wrap;">
        <multi-filter-pill
          label="Source"
          :options="sourceOptions"
          v-model="filters.source"
          placeholder="All"
        ></multi-filter-pill>

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
          :max-summary-items="2"
        ></multi-filter-pill>
      </div> 

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
        v-for="(course, i) in visibleRows"
        :key="course.canvas_course_id || (course.course_code + '-' + i)"
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
            :style="col.get_style(course)"
            v-html="col.getContent(course)"
          ></span>
        </div>
      </div>
    </div>
  </div>
  `
});
