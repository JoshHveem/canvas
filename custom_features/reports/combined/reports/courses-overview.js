//courses-overview.js
Vue.component('reports-courses-overview', {
  props: {
    account:   { type: [Number, String], required: true },   // same as your master report
    year:      { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },
    courses: {type: Array, required: true}
  },

  data() {
    const colors = (window.bridgetools?.colors) || { red:'#b20b0f', orange:'#f59e0b', yellow:'#eab308', green:'#16a34a', gray:'#e5e7eb', black:'#111827', white:'#fff' };
    const table = new window.CoursesTable({
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
      sort_column: 'Course Code',
      sort_dir: 1,
      

    };
  },
  created() {
    this.table.setColumns([
        new CoursesColumn(
          'Name', 'The name of the course.', '20rem', false, 'string',
          c => this.anonymous ? 'COURSE NAME ' + (c.course_id || '') : (c.name ?? ''),
          null,
          c => (c.name ?? '')
        ),
        new CoursesColumn(
          'Course Code', 'The course code for the course.', '6rem', false, 'string',
          c => this.anonymous ? 'AAAA 0000' : (c.course_code ?? ''),
          null,
          c => (c.course_code ?? '')
        ),
        new CoursesColumn(
          'Crdts', 'The credits value of the course.', '4rem', false, 'number',
          c => Math.round(c.credits) || 0,
          null,
          c => Number(c.credits ?? -1)
        ),
        new CoursesColumn(
          'Suggested', 'Suggested Credits based on time to complete for students who got at least 80% of the way through this course.', '6rem', false, 'number',
          c => c.suggested_credits !== null ? c.suggested_credits : 'n/a',
          c => {
            const v = Math.abs(c.suggested_credits - c.credits);
            if (c.suggested_credits === null) return { backgroundColor: this.colors.gray, color: this.colors.black };
            return {
              backgroundColor: (v > 0.75) ? this.colors.red : (v > 0.5 ? this.colors.orange: (v > 0.25 ? this.colors.yellow : this.colors.green)),
              color: this.colors.white
            };
          },
          c => Number(c.pct_last_active ?? -1) // sort on raw 0–1 value
        ),
        new CoursesColumn(
          'Students', 'Students counted for credits/week calc.', '5rem', false, 'number',
          c => c.num_students_jenzabar ?? 0,
          null,
          c => Number(c.num_students_jenzabar ?? -1)
        ),
        new CoursesColumn(
          'Extn', 'Percent of students requiring an extension.', '4rem', false, 'number',
          c => c.pct_need_extension !== null ? (c.pct_need_extension * 100).toFixed(1) + '%' : 'n/a',
          c => {
            const v = c.pct_need_extension;
            if (v === null) return { backgroundColor: this.colors.gray, color: this.colors.black };
            return {
              backgroundColor: (v > 0.25) ? this.colors.red : (v > 0.1 ? this.colors.orange: (v > 0 ? this.colors.yellow : this.colors.green)),
              color: this.colors.white
            };
          },
          c => Number(c.pct_need_extension ?? -1) // sort on raw 0–1 value
        ),
        new CoursesColumn(
          'Drop', 'Percent of students who dropped.', '4rem', false, 'number',
          c => c.pct_dropped !== null ? (c.pct_dropped * 100).toFixed(1) + '%' : 'n/a',
          c => {
            const v = c.pct_dropped;
            if (v === null) return { backgroundColor: this.colors.gray, color: this.colors.black };
            return {
              backgroundColor: (v > 0.25) ? this.colors.red : (v > 0.1 ? this.colors.orange: (v > 0 ? this.colors.yellow : this.colors.green)),
              color: this.colors.white
            };
          },
          c => Number(c.pct_dropped ?? -1) // sort on raw 0–1 value
        ),
        new CoursesColumn(
          'Grades', 'Avg student grade (%) based on submitted work.', '5rem', true, 'number',
          c => Number.isFinite(Number(c.average_score)) ? Number(c.average_score).toFixed(1) + '%' : 'n/a',
          c => {
            const v = Number(c.average_score);
            if (!Number.isFinite(v)) return { backgroundColor: this.colors.gray, color: this.colors.black };
            return {
              backgroundColor: (v < 80) ? this.colors.red : (v < 90 ? this.colors.yellow : this.colors.green),
              color: this.colors.white
            };
          },
          c => Number(c.average_score ?? -1)
        ),
        new CoursesColumn(
          'Objectives', 'Course content matched objectives.', '6.5rem', true, 'number',
          c => this.pctText(c.objectives),
          c => this.bandBg(c.objectives),
          c => Number(c.objectives ?? -1) // raw 0–1
        ),
        new CoursesColumn(
          'Relevance', 'Content relevant to career.', '6rem', true, 'number',
          c => this.pctText(c.relevance),
          c => this.bandBg(c.relevance),
          c => Number(c.relevance ?? -1)
        ),
        new CoursesColumn(
          'Examples', 'Course contained sufficient examples.', '6rem', true, 'number',
          c => this.pctText(c.examples),
          c => this.bandBg(c.examples),
          c => Number(c.examples ?? -1)
        ),
        new CoursesColumn(
          'Recommend', 'Would recommend this course.', '7rem', true, 'number',
          c => this.pctText(c.recommendable),
          c => this.bandBg(c.recommendable),
          c => Number(c.recommendable ?? -1)
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
    setSortColumn(name) { this.table.setSortColumn(name); }
  },

  template: `
    <div>
      <div :style="{ 'grid-template-columns': getColumnsWidthsString() }">
        <div v-for="col in table.getVisibleColumns()" :key="col.name" @click="setSortColumn(col.name)">
          {{ col.name }}
        </div>
      </div>

      <div v-for="(course,i) in visibleRows" :key="course.course_id || i"
           :style="{ 'grid-template-columns': getColumnsWidthsString() }">
        <div v-for="col in table.getVisibleColumns()" :key="col.name">
          <span :class="col.style_formula ? 'btech-pill-text' : ''"
                :style="col.get_style(course)"
                v-html="col.getContent(course)"></span>
        </div>
      </div>
    </div> 
  `
});
