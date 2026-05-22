Vue.component('reports-departments-course-readiness', {
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
      sort_column: 'Department',
      sort_dir: 1,
      colors
    });

    return {
      colors,
      table,
      tableTick: 0,
      loading: false,
      loadError: '',
      year: Number(this.reportContext?.filters?.academic_year) || new Date().getFullYear(),
      departments: []
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
        'Ready', 'All tracked areas are complete.', '6rem', false, 'number',
        d => String(this.readyCount(d)),
        d => this.countPillStyle(this.totalCourses(d) - this.readyCount(d)),
        d => this.readyCount(d)
      ),
      new window.ReportColumn(
        'In Progress', 'Some tracked areas still need work.', '7rem', false, 'number',
        d => String(this.inProgressCount(d)),
        d => this.countPillStyle(this.inProgressCount(d)),
        d => this.inProgressCount(d)
      ),
      new window.ReportColumn(
        'Needs Attention', 'One or more tracked areas are missing.', '8rem', false, 'number',
        d => String(this.needsAttentionCount(d)),
        d => this.countPillStyle(this.needsAttentionCount(d)),
        d => this.needsAttentionCount(d)
      ),
      new window.ReportColumn(
        '% Ready', 'ready / total', '7rem', false, 'number',
        d => this.pctText(this.pctReady(d)),
        d => this.pctPillStyle(this.pctReady(d)),
        d => this.pctReady(d)
      )
    ]);
  },

  mounted() {
    this.loadData();
  },

  watch: {
    reportContext: {
      deep: true,
      handler() {
        const nextYear = Number(this.reportContext?.filters?.academic_year);
        if (Number.isFinite(nextYear) && nextYear !== this.year) {
          this.year = nextYear;
          return;
        }
        this.loadData();
      }
    },
    year() {
      this.loadData();
    }
  },

  computed: {
    visibleRows() {
      this.table.setRows(this.departments);
      return this.table.getSortedRows();
    }
  },

  methods: {
    async loadData() {
      try {
        this.loading = true;
        this.loadError = '';

        const dataset = String(this.reportContext?.dataset || '').trim();
        const filters = Object.assign({}, this.reportContext?.filters || {}, {
          academic_year: Number(this.year)
        });

        const rows = await bridgetools.req3('reports', filters, { dataset });
        this.departments = this.buildDepartments(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.warn('Failed to load course readiness summary dataset', e);
        this.departments = [];
        this.loadError = 'Unable to load course readiness summary.';
      } finally {
        this.loading = false;
      }
    },

    buildDepartments(rows) {
      const grouped = new Map();

      for (const row of rows) {
        const department_code = String(row?.department_code ?? '').trim();
        const department_name = String(row?.department_name ?? '').trim();
        const key = `${department_code}::${department_name}`;

        if (!grouped.has(key)) {
          grouped.set(key, {
            department_code,
            department_name,
            num_courses: 0,
            num_ready: 0,
            num_in_progress: 0,
            num_needs_attention: 0
          });
        }

        const summary = grouped.get(key);
        const status = this.overallStatus(row);
        summary.num_courses += 1;

        if (status === 'Ready') summary.num_ready += 1;
        else if (status === 'In Progress') summary.num_in_progress += 1;
        else if (status === 'Needs Attention') summary.num_needs_attention += 1;
      }

      return Array.from(grouped.values()).sort((a, b) =>
        this.departmentName(a).localeCompare(this.departmentName(b))
      );
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

    overallStatus(course) {
      const courseStatus = String(course?.course_status ?? '').trim();
      if (courseStatus === 'Deleted') return 'N/A';

      const values = [
        course?.course_status,
        course?.syllabus_status,
        course?.course_evaluation_status,
        course?.instructor_evaluation_status,
        course?.employment_skills_evaluation_status,
        course?.canvas_content_status
      ].map(v => String(v ?? '').trim());

      if (values.includes('None') || values.includes('Unsubmitted')) return 'Needs Attention';
      if (values.includes('Unpublished') || values.includes('Pending Approval')) return 'In Progress';
      return 'Ready';
    },

    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tableTick += 1; },

    departmentName(department) {
      return String(department?.department_name ?? department?.name ?? department?.department_code ?? '').trim();
    },
    totalCourses(department) {
      return Number(department?.num_courses) || 0;
    },
    readyCount(department) {
      return Number(department?.num_ready) || 0;
    },
    inProgressCount(department) {
      return Number(department?.num_in_progress) || 0;
    },
    needsAttentionCount(department) {
      return Number(department?.num_needs_attention) || 0;
    },
    pctReady(department) {
      const total = this.totalCourses(department);
      return total > 0 ? (this.readyCount(department) / total) : NaN;
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
    countPillStyle(count) {
      const n = Number(count);
      if (!Number.isFinite(n)) return { backgroundColor: this.colors.gray, color: this.colors.black };
      return {
        backgroundColor: n <= 0 ? this.colors.green : (n <= 5 ? this.colors.yellow : this.colors.red),
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
      <h4 class="btech-card-title" style="margin:0;">Departments - Course Readiness</h4>
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
    </div>

    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
      Loading departments...
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
        v-for="(department, i) in visibleRows"
        :key="department.department_code || department.department_name || i"
        @click="emitDrill(department)"
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.5rem; cursor:pointer;"
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
            :style="col.get_style(department)"
            v-html="col.getContent(department)"
          ></span>
        </div>
      </div>
    </div>
  </div>
  `
});
