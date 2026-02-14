Vue.component('reports-department-course-readiness', {
  props: {
    year: { type: [Number, String], required: true },
    courseReadiness: { type: Object, required: true },
    anonymous: { type: Boolean, default: false }, // optional parity
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
    };
  },

  created() {
    console.log(this.courseReadiness);
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
        null,
        c => Number(c?.canvas_course_id ?? -1)
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


      new window.ReportColumn(
        'Source', 'Creation source.', '7rem', false, 'string',
        c => (c?.creation_source ?? ''),
        null,
        c => (c?.creation_source ?? '')
      ),
      new window.ReportColumn(
        'Overall', 'Overall readiness rollup.', '8rem', false, 'string',
        c => this.overallStatus(c),
        c => this.overallStyle(this.overallStatus(c)),
        c => this.overallStatus(c)
        ),

    ]);
  },

  computed: {
    visibleRows() {
      const rows = Array.isArray(this.courseReadiness?.courses)
        ? this.courseReadiness.courses
        : [];

      this.table.setRows(rows);
      return this.table.getSortedRows();
    }
  },

  methods: {
    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tableTick++; },
    statusStyle(s) {
    const v = String(s ?? '').trim();

    if (!v || v === 'N/A') {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
    }

    if (v === 'Deleted') {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
    }

    if (v === 'Published' || v === 'Approved') {
        return { backgroundColor: this.colors.green, color: this.colors.white };
    }

    if (v === 'Unpublished' || v === 'Pending Approval') {
        return { backgroundColor: this.colors.yellow, color: this.colors.black };
    }

    if (v === 'None' || v === 'Unsubmitted') {
        return { backgroundColor: this.colors.red, color: this.colors.white };
    }

    // fallback for unexpected values
    return { backgroundColor: this.colors.gray, color: this.colors.black };
    },

    statusText(s) {
    const v = String(s ?? '').trim();
    return v ? v : 'N/A';
},
overallStatus(course) {
  const cs = course?.course_status;
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

  // good case: published + approved/published statuses
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
