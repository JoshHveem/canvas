// Reusable column helper (same idea as your standalone)
class CoursesColumn {
  constructor(name, description, width, average, sort_type, getContent = (course) => course.course_name ?? '', sort_val_func = null, style_formula = null) {
    this.name = name;
    this.description = description;
    this.width = width;
    this.average = average;
    this.sort_type = sort_type;
    this.sort_state = 0;
    this.visible = true;
    this.getContent = getContent;
    this.style_formula = style_formula;
  }
  get_style(course) {
    return this.style_formula ? this.style_formula(course) : {};
  }
  getSortValue(course) {
    return this.sort_val_func ? this.sort_val_func(course) : this.getContent(course)
  }
}

Vue.component('courses-report', {
  props: {
    account:   { type: [Number, String], required: true },   // same as your master report
    year:      { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false }
  },

  data() {
    return {
      colors: (window.bridgetools?.colors) || { red:'#b20b0f', orange:'#f59e0b', yellow:'#eab308', green:'#16a34a', gray:'#e5e7eb', black:'#111827', white:'#fff' },
      loading: false,
      courses: [],
      // Filters that existed in the standalone, kept simple here:
      filters: {
        hide_zero_credits: true,
        hide_zero_students: true
      },
      sort_column: 'Course Code',
      sort_dir: 1,
      columns: [
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
          c => Number(c.credits ?? Number.NaN)
        ),
        new CoursesColumn(
          'Students', 'Students counted for credits/week calc.', '5rem', false, 'number',
          c => c.num_students_jenzabar ?? 0,
          null,
          c => Number(c.num_students_jenzabar ?? Number.NaN)
        ),
        new CoursesColumn(
          'Extn', 'Percent of students requiring an extension.', '4rem', false, 'number',
          c => c.pct_need_extension !== null ? (c.pct_need_extension * 100).toFixed(1) + '%' : 'n/a',
          c => {
            const v = c.pct_need_extension;
            if (v === null) return { backgroundColor: this.colors.gray, color: this.colors.black };
            return {
              backgroundColor: (v > 0.25) ? this.colors.red : (v > 0.1 ? this.colors.yellow : this.colors.green),
              color: this.colors.white
            };
          },
          c => Number(c.pct_need_extension ?? Number.NaN) // sort on raw 0–1 value
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
          c => Number(c.average_score ?? Number.NaN)
        ),
        new CoursesColumn(
          'Objectives', 'Course content matched objectives.', '6.5rem', true, 'number',
          c => this.pctText(c.objectives),
          c => this.bandBg(c.objectives),
          c => Number(c.objectives ?? Number.NaN) // raw 0–1
        ),
        new CoursesColumn(
          'Relevance', 'Content relevant to career.', '6rem', true, 'number',
          c => this.pctText(c.relevance),
          c => this.bandBg(c.relevance),
          c => Number(c.relevance ?? Number.NaN)
        ),
        new CoursesColumn(
          'Examples', 'Course contained sufficient examples.', '6rem', true, 'number',
          c => this.pctText(c.examples),
          c => this.bandBg(c.examples),
          c => Number(c.examples ?? Number.NaN)
        ),
        new CoursesColumn(
          'Recommend', 'Would recommend this course.', '7rem', true, 'number',
          c => this.pctText(c.recommendable),
          c => this.bandBg(c.recommendable),
          c => Number(c.recommendable ?? Number.NaN)
        ),
      ]

    };
  },

  computed: {
    visibleColumns() {
      return this.columns.filter(c => c.visible);
    },
    visibleRows() {
      // filter by year and zero checks
      const yr = Number(this.year);
      const rows = (this.courses || []).filter((c) => {
        if (Number(c.year) !== yr) return false;
        if (this.filters.hide_zero_credits && !(Number(c.credits) > 0)) return false;
        if (this.filters.hide_zero_students && !(Number(c.num_students_credits) > 0)) return false;
        return true;
      });
      // sort
      return this.sortRows(rows);
    }
  },

  watch: {
    year:    'loadCourses',
    account: 'loadCourses'
  },

  async mounted() {
    await this.loadCourses();
  },

  methods: {
    // ---- UI helpers
    pctText(v) {
      const n = Number(v);
      return Number.isFinite(n) ? (n * 100).toFixed(1) + '%' : 'n/a';
    },
    bandBg(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) return { backgroundColor: this.colors.gray, color: this.colors.black };
      return {
        backgroundColor: (n < 0.80) ? this.colors.red : (n < 0.90 ? this.colors.yellow : this.colors.green),
        color: this.colors.white
      };
    },
    renderTagsHTML(course) {
      const s = course?.surveys;
      if (!s || Number(s.num_surveys) < 3) return '';
      const tagsMap = s.tags || {};
      const pills = [];
      Object.keys(tagsMap).forEach(group => {
        const groupTags = tagsMap[group] || {};
        Object.keys(groupTags).forEach(tag => {
          const cnt = Number(groupTags[tag] || 0);
          const perc = cnt / Number(s.num_surveys || 1);
          if (cnt > 1 && perc > 0.05) {
            const bg = (perc > 0.30) ? this.colors.red : (perc > 0.15 ? this.colors.orange : this.colors.yellow);
            pills.push(`<span class="btech-pill-text" title="${cnt} (${(perc * 100).toFixed(1)}%)" style="white-space:nowrap;font-size:.75rem;margin-right:.25rem;background-color:${bg};color:${this.colors.white};">${tag}</span>`);
          }
        });
      });
      return `<div style="display:flex;flex-wrap:wrap;align-items:flex-start;line-height:normal;">${pills.join('')}</div>`;
    },
    getColumnsWidthsString() {
      return this.columns.map(c => c.width).join(' ');
    },
    setSortColumn(name) {
      if (this.sort_column === name) {
        this.sort_dir *= -1;
      } else {
        this.sort_column = name;
        this.sort_dir = 1;
      }
      // update little arrows
      this.columns.forEach(c => c.sort_state = (c.name === name ? this.sort_dir : 0));
    },
    sortRows(rows) {
      const header = this.sort_column;
      const dir = this.sort_dir;
      const col = this.columns.find(c => c.name === header);
      const sortType = col ? col.sort_type : 'string';

      const toStringKey = v => ('' + (v ?? '')).toUpperCase();

      return rows.slice().sort((a, b) => {
        let av, bv;

        if (col && typeof col.getSortValue === 'function') {
          av = col.getSortValue(a);
          bv = col.getSortValue(b);
        } else {
          // Fallbacks if a column didn’t define getSortValue
          const key = this.columnNameToCode(header); // e.g., 'Course Code' -> 'course_code'
          av = a[key];
          bv = b[key];
          // Last-resort: parse from rendered content if numeric
          if (sortType !== 'string') {
            const parsePercentish = (x) => {
              const s = String(x ?? '').replace('%', '').trim();
              const n = Number(s);
              return Number.isFinite(n) ? n : Number.NaN;
            };
            if (!Number.isFinite(Number(av)) && col?.getContent) av = parsePercentish(col.getContent(a));
            if (!Number.isFinite(Number(bv)) && col?.getContent) bv = parsePercentish(col.getContent(b));
          }
        }

        // Normalize types
        if (sortType === 'string') {
          av = toStringKey(av);
          bv = toStringKey(bv);
        } else {
          av = Number(av);
          bv = Number(bv);
        }

        // Deterministic NaN handling
        const aNaN = Number.isNaN(av);
        const bNaN = Number.isNaN(bv);
        let comp;
        if (aNaN && bNaN) comp = 0;
        else if (aNaN) comp = 1;         // push NaNs to bottom on ascending
        else if (bNaN) comp = -1;
        else comp = av > bv ? 1 : (av < bv ? -1 : 0);

        return comp * dir;
      });
    },

    columnNameToCode(name) {
      return (name || '').toLowerCase().replace(/ /g, '_');
    },

    // ---- Data shaping like your standalone
    calcLikert(course, name) {
      const score = (course?.surveys?.likerts ?? []).find(l => l?.name === name)?.score;
      return Number.isFinite(Number(score)) ? Number(score) : null;
    },
    processCourses(courses) {
      return courses.map(course => {
        course.students = course.num_students_credits;
        course.grades = course.average_score;
        course.objectives = this.calcLikert(course, 'Objectives');
        course.relevance  = this.calcLikert(course, 'Workplace Relevance');
        course.examples   = this.calcLikert(course, 'Examples');
        course.recommendable = this.calcLikert(course, 'Recommendable');
        course.recommendations = course?.surveys?.has_recommendations;
        return course;
      });
    },

    // ---- API
    async getMyCourses() {
      const courses = await canvasGet('/api/v1/courses?enrollment_type=teacher&enrollment_state=active&state[]=available&include[]=term');
      const ids = courses.map(c => c.id);
      const out = [];
      const limit = 50;
      for (let i = 0; i < ids.length; i += limit) {
        const chunk = ids.slice(i, i + limit);
        let url = `https://reports.bridgetools.dev/api/reviews/courses?limit=${limit}`;
        chunk.forEach(id => { url += `&course_ids[]=${id}`; });
        const data = await bridgetools.req(url);
        out.push(...(this.processCourses(data.courses || [])));
      }
      return out;
    },

    async loadCourses() {
      try {
        this.loading = true;
        this.courses = [];
        const limit = 50;
        if (Number(this.account) === 0) {
          this.courses = await this.getMyCourses();
          return;
        }
        // by account (department)
        let url = `https://reports.bridgetools.dev/api/reviews/courses?limit=${limit}&excludes[]=content_items&year=${this.year}&account_id=${this.account}`;
        let resp = {};
        do {
          resp = await bridgetools.req(url + (resp?.next_id ? `&last_id=${resp.next_id}` : ''));
          this.courses.push(...this.processCourses(resp?.courses || []));
        } while ((resp?.courses || []).length === limit);
      } finally {
        this.loading = false;
      }
    }
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
          v-for="col in visibleColumns"
          :key="col.name"
          :title="col.description"
          style="display:inline-block; grid-template-columns:auto 1rem; cursor:pointer;"
          @click="setSortColumn(col.name)"
        >
          <span><b>{{ col.name }}</b></span>
          <span style="margin-left:.25rem;">
            <svg style="width:.75rem;height:.75rem;" viewBox="0 0 490 490" xml:space="preserve" aria-hidden="true">
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

      <div v-if="loading" style="text-align:center; padding:8px;">Loading courses…</div>

      <!-- Rows -->
      <div v-else v-for="(course, i) in visibleRows" :key="course.course_id || i"
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.5rem;"
        :style="{ 'grid-template-columns': getColumnsWidthsString(), 'background-color': (i % 2) ? 'white' : '#F8F8F8' }"
      >
        <div v-for="col in visibleColumns" :key="col.name"
             style="display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
          <span v-if="col.name === 'Name'">
            <a :href="\`/courses/\${course.course_id}\`" target="_blank">{{ anonymous ? 'COURSE NAME ' + (course.course_id || '') : (course.name || '') }}</a>
          </span>
          <span v-else :class="col.style_formula ? 'btech-pill-text' : ''" :style="col.get_style(course)"
                v-html="col.getContent(course)"></span>
        </div>
      </div>
    </div>
  `
});
