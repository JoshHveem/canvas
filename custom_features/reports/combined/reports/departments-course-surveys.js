// departments-course-surveys.js
Vue.component('departments-course-surveys', {
  props: {
    account:   { type: [Number, String], required: false, default: '' },
    year:      { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },
    departments: { type: Array, required: true },
    loading:   { type: Boolean, default: false },

    // list of tag names, e.g. ["N/A", "Communication", ...]
    allCourseTags: { type: Array, default: () => [] },
    selectedCourseTags: { type: Array, default: () => [] },
  },

  data() {
    const colors = (window.bridgetools?.colors) || {
      red:'#b20b0f', orange:'#f59e0b', yellow:'#eab308',
      green:'#16a34a', gray:'#e5e7eb', black:'#111827', white:'#fff'
    };

    const table = new window.ReportTable({
      rows: [],
      columns: [],
      sort_column: "Department",
      sort_dir: 1,
      colors
    });

    return {
      colors,
      table,
      tableTick: 0
    };
  },

  created() {
    // Base columns (only course_surveys-related)
    this.setColumns();
  },

  watch: {
    allCourseTags: { handler() { this.setColumns(); }, deep: true },
    selectedCourseTags: { handler() { this.setColumns(); }, deep: true },
  },

  computed: {
    visibleRows() {
      const rows = Array.isArray(this.departments) ? this.departments : [];
      this.table.setRows(rows);
      return this.table.getSortedRows();
    }
  },

  methods: {
    // ---------- column setup ----------
    setColumns() {
      const cols = [];

      cols.push(new window.ReportColumn(
        'Department', 'Department name.', '16rem', false, 'string',
        d => this.anonymous ? 'DEPARTMENT' : (d?.name ?? ''),
        null,
        d => (d?.name ?? '')
      ));

      cols.push(new window.ReportColumn(
        'Course Surveys', 'Number of course survey responses.', '7rem', false, 'number',
        d => Number(d?.course_surveys?.num_surveys ?? 0),
        null,
        d => Number(d?.course_surveys?.num_surveys ?? -1)
      ));

      cols.push(new window.ReportColumn(
        'Course Recs', 'Share of course surveys with recommendations.', '7rem', false, 'number',
        d => this.pctText(d?.course_surveys?.has_recommendations),
        d => this.pctPillStyle(d?.course_surveys?.has_recommendations),
        d => Number(d?.course_surveys?.has_recommendations ?? -1)
      ));

      // Dynamic tag columns (one per tag in props.tags)
      const chosen =
        (Array.isArray(this.selectedCourseTags) && this.selectedCourseTags.length)
          ? this.selectedCourseTags
          : (Array.isArray(this.allCourseTags) && this.allCourseTags.length)
            ? this.allCourseTags
            : (Array.isArray(this.tags) ? this.tags : []); // legacy fallback

      const tagNames = chosen
        .filter(t => typeof t === 'string' && t.trim().length)
        .map(t => t.trim());


      for (const tagName of tagNames) {
        // keep column names short-ish; tooltip has full tag
        const colName = tagName;

        cols.push(new window.ReportColumn(
          colName,
          `Pct of submissions tagged "${tagName}".`,
          '7rem',
          false,
          'number',
          d => {
            const v = d?.course_surveys?.tags_by_name?.[tagName]?.pct_of_submissions ?? 0;
            return this.pctText(v);
          },
          d => {
            const v = d?.course_surveys?.tags_by_name?.[tagName]?.pct_of_submissions ?? 0;
            return this.pctTagsPillStyle(v);
          },
          d => {
            const v = d?.course_surveys?.tags_by_name?.[tagName]?.pct_of_submissions ?? 0;
            return Number.isFinite(Number(v)) ? Number(v) : -1;
          },
          d => {
            const info = d?.course_surveys?.tags_by_name?.[tagName] ?? {};
            console.log(info);
            const cnt = info.tag_count ?? 0;
            let total = 0;
            if (info?.pct_of_submissions > 0) total = info?.tag_count / info?.pct_of_submissions;
            return `${cnt} of ${total} submissions tagged "${tagName}"`;
          }
        ));
      }

      this.table.setColumns(cols);
      this.tableTick++;
    },

    // ---------- ReportTable passthrough ----------
    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tableTick++; },

    // ---------- formatting helpers ----------
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
        backgroundColor: (pct < 80) ? this.colors.red : (pct < 90 ? this.colors.yellow : this.colors.green),
        color: this.colors.white
      };
    },

    pctTagsPillStyle(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      }

      const pct = n * 100;

      if (pct >= 50) return { backgroundColor: this.colors.darkRed, color: this.colors.white };
      if (pct >= 25) return { backgroundColor: this.colors.red, color: this.colors.white };
      if (pct >= 15) return { backgroundColor: this.colors.orange, color: this.colors.white };
      if (pct >= 5)  return { backgroundColor: this.colors.yellow, color: this.colors.white };
      if (pct > 0)  return { backgroundColor: this.colors.yellowGreen, color: this.colors.white };

      return { backgroundColor: this.colors.green, color: this.colors.white };
    }
  
    },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    <!-- Header -->
    <div class="btech-row" style="align-items:center; margin-bottom:8px;">
      <h4 class="btech-card-title" style="margin:0;">Departments — Course Surveys</h4>
      <div style="flex:1;"></div>
      <span class="btech-pill" style="margin-left:8px;">Year: {{ year }}</span>
      <span class="btech-pill" style="margin-left:8px;">Rows: {{ visibleRows.length }}</span>
      <span class="btech-pill" style="margin-left:8px;">
        Tags: {{ (selectedCourseTags && selectedCourseTags.length) ? selectedCourseTags.length : (allCourseTags || tags || []).length }}
      </span>

    </div>

    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
      Loading departments…
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
        v-for="(dept, i) in visibleRows"
        :key="dept.deptId || dept.account_id || dept.id || i"
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
            :title="col.getTooltip(dept) || ''"
            :class="col.style_formula ? 'btech-pill-text' : ''"
            :style="col.get_style(dept)"
            v-html="col.getContent(dept)"
          ></span>
        </div>
      </div>
    </div>
  </div>
`
});
