//courses-overview.js
Vue.component('reports-courses-surveys', {
  props: {
    account:   { type: [Number, String], required: true },   // same as your master report
    year:      { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },
    courses: {type: Array, required: true}
  },

  data() {
    const colors = (window.bridgetools?.colors) || { red:'#b20b0f', orange:'#f59e0b', yellow:'#eab308', green:'#16a34a', gray:'#e5e7eb', black:'#111827', white:'#fff' };
    const table = new window.ReportTable({
      rows: [],
      columns: [],     // set in mounted
      sort_column: "Course Code",
      sort_dir: 1,
      colors
    });
    return {
      colors: colors,
      table: table,
      loading: false,
      // Filters that existed in the standalone, kept simple here:
      filters: {
        hide_zero_credits: true,
        hide_zero_students: true
      },
      tableTick: 0
    };
  },
  created() {
    this.table.setColumns([
        new window.ReportColumn(
          'Name', 'The name of the course.', '20rem', false, 'string',
          c => this.anonymous ? 'COURSE NAME ' + (c.course_id || '') : (c.name ?? ''),
          null,
          c => (c.name ?? '')
        ),
        new window.ReportColumn(
          'Course Code', 'The course code for the course.', '6rem', false, 'string',
          c => this.anonymous ? 'AAAA 0000' : (c.course_code ?? ''),
          null,
          c => (c.course_code ?? '')
        ),
        new window.ReportColumn(
          'Objectives', 'Course content matched objectives.', '6.5rem', true, 'number',
          c => this.table.pctText(c.objectives),
          c => this.table.bandBg(c.objectives),
          c => Number(c.objectives ?? -1) // raw 0–1
        ),
        new window.ReportColumn(
          'Relevance', 'Content relevant to career.', '6rem', true, 'number',
          c => this.table.pctText(c.relevance),
          c => this.table.bandBg(c.relevance),
          c => Number(c.relevance ?? -1)
        ),
        new window.ReportColumn(
          'Examples', 'Course contained sufficient examples.', '6rem', true, 'number',
          c => this.table.pctText(c.examples),
          c => this.table.bandBg(c.examples),
          c => Number(c.examples ?? -1)
        ),
        new window.ReportColumn(
          'Recommend', 'Would recommend this course.', '7rem', true, 'number',
          c => this.table.pctText(c.recommendable),
          c => this.table.bandBg(c.recommendable),
          c => Number(c.recommendable ?? -1)
        ),
        new window.ReportColumn(
          'Summary', 'Summary of student free response recommendations.', '7rem', true, 'number',
          c => this.table.pctText(c.survey_summary),
          c => null,
          c => c.survey_summary
        ),
      ]);
  },

  computed: {
    visibleRows() {
      const yr = Number(this.year);
      const rows = (this.courses || []).filter(c => {
        if (Number(c.year) !== yr) return false;
        if (this.filters.hide_zero_credits && !(Number(c.credits) > 0)) return false;
        if (this.filters.hide_zero_students && !(Number(c.num_students_credits) > 0)) return false;
        return true;
      });

      // feed rows into table and return sorted
      this.table.setRows(rows);
      return this.table.getSortedRows();
    } 
  },

  methods: {
    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tableTick++; }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    <!-- Header -->
    <div class="btech-row" style="align-items:center; margin-bottom:8px;">
      <h4 class="btech-card-title" style="margin:0;">Courses</h4>
      <div style="flex:1;"></div>
      <span class="btech-pill" style="margin-left:8px;">Rows: {{ visibleRows.length }}</span>
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

        <!-- optional: keep your arrows if you want -->
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
      :key="course.course_id || i"
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
        <span v-if="col.name === 'Name'">
          <a :href="\`/courses/\${course.course_id}\`" target="_blank">
            {{ anonymous ? 'COURSE NAME ' + (course.course_id || '') : (course.name || '') }}
          </a>
        </span>

        <span
          v-else
          :class="col.style_formula ? 'btech-pill-text' : ''"
          :style="col.get_style(course)"
          v-html="col.getContent(course)"
        ></span>
      </div>
    </div>
  </div>
`

});
