Vue.component('reports-evaluations-course-summary', {
  mixins: [
    window.ReportMixins.formatting,
    window.ReportMixins.yearSummary({
      loadErrorMessage: 'Unable to load course evaluations summary.'
    })
  ],

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('Program', colors);

    return {
      colors,
      table
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Program', 'Program name.', '18rem', false, 'string',
        row => this.anonymous ? 'PROGRAM' : this.escapeHtml(this.programName(row)),
        null,
        row => this.programName(row).toLowerCase()
      ),
      new window.ReportColumn(
        'Subs', 'Number of course evaluation submissions.', '5rem', false, 'number',
        row => this.intText(row?.num_submissions),
        null,
        row => Number(row?.num_submissions ?? -1)
      ),
      new window.ReportColumn(
        'Feedback Recs', 'Share of submissions with recommendation feedback.', '8rem', false, 'number',
        row => this.pctText(row?.perc_submissions__feedback_recommendations),
        row => this.feedbackRecsPillStyle(row?.perc_submissions__feedback_recommendations),
        row => Number(row?.perc_submissions__feedback_recommendations ?? -1)
      ),
      new window.ReportColumn(
        'Instr Clear', 'Assignment instructions are clear.', '7rem', false, 'number',
        row => this.pctText(row?.likert_assignment_instructions_clear),
        row => this.likertPillStyle(row?.likert_assignment_instructions_clear),
        row => Number(row?.likert_assignment_instructions_clear ?? -1)
      ),
      new window.ReportColumn(
        'Content', 'Course content is relevant.', '7rem', false, 'number',
        row => this.pctText(row?.likert_course_content_relevant),
        row => this.likertPillStyle(row?.likert_course_content_relevant),
        row => Number(row?.likert_course_content_relevant ?? -1)
      ),
      new window.ReportColumn(
        'Objectives', 'Course objectives are clear.', '7rem', false, 'number',
        row => this.pctText(row?.likert_course_objectives_clear),
        row => this.likertPillStyle(row?.likert_course_objectives_clear),
        row => Number(row?.likert_course_objectives_clear ?? -1)
      ),
      new window.ReportColumn(
        'Recommend', 'Would recommend the course.', '7rem', false, 'number',
        row => this.pctText(row?.likert_would_recommend_course),
        row => this.likertPillStyle(row?.likert_would_recommend_course),
        row => Number(row?.likert_would_recommend_course ?? -1)
      ),
      new window.ReportColumn(
        'Top 1 Tag', 'Most frequent recommendation tag.', '12rem', false, 'string',
        row => this.topTagHtml(row, 0),
        row => this.topTagPillStyle(row, 0),
        row => this.topTagSortValue(row, 0)
      ),
      new window.ReportColumn(
        'Top 2 Tag', 'Second most frequent recommendation tag.', '12rem', false, 'string',
        row => this.topTagHtml(row, 1),
        row => this.topTagPillStyle(row, 1),
        row => this.topTagSortValue(row, 1)
      ),
      new window.ReportColumn(
        'Top 3 Tag', 'Third most frequent recommendation tag.', '12rem', false, 'string',
        row => this.topTagHtml(row, 2),
        row => this.topTagPillStyle(row, 2),
        row => this.topTagSortValue(row, 2)
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
      return (Array.isArray(rows) ? rows : []).map(row => {
        const numSubmissions = Number(row?.num_submissions) || 0;
        const tags = this.normalizeTags(row?.free_response_recommendations__tags, numSubmissions);

        return {
          ...row,
          academic_year: Number(row?.academic_year),
          program_code: String(row?.program_code ?? '').trim(),
          program_name: String(row?.program_name ?? '').trim(),
          num_submissions: numSubmissions,
          perc_submissions__feedback_recommendations: Number(row?.perc_submissions__feedback_recommendations),
          likert_assignment_instructions_clear: Number(row?.likert_assignment_instructions_clear),
          likert_course_content_relevant: Number(row?.likert_course_content_relevant),
          likert_course_objectives_clear: Number(row?.likert_course_objectives_clear),
          likert_would_recommend_course: Number(row?.likert_would_recommend_course),
          top_tags: tags
        };
      });
    },

    normalizeTags(rawTags, numSubmissions) {
      const entries = Object.entries(rawTags && typeof rawTags === 'object' ? rawTags : {})
        .map(([name, count]) => ({
          name: String(name ?? '').trim(),
          count: Number(count) || 0
        }))
        .filter(tag => tag.name && tag.count > 0)
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.name.localeCompare(b.name);
        })
        .map(tag => ({
          ...tag,
          pct: numSubmissions > 0 ? tag.count / numSubmissions : NaN
        }));

      return entries.slice(0, 3);
    },

    programName(row) {
      return String(row?.program_name ?? row?.program_code ?? '').trim() || '(no program)';
    },

    likertPillStyle(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      }

      return {
        backgroundColor: n > 0.9 ? this.colors.green : (n >= 0.8 ? this.colors.yellow : this.colors.red),
        color: this.colors.white
      };
    },

    feedbackRecsPillStyle(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      }

      return {
        backgroundColor: n < 0.5 ? this.colors.green : (n < 0.75 ? this.colors.yellow : this.colors.red),
        color: this.colors.white
      };
    },

    getTopTag(row, index) {
      return Array.isArray(row?.top_tags) ? (row.top_tags[index] || null) : null;
    },

    topTagHtml(row, index) {
      const tag = this.getTopTag(row, index);
      if (!tag) return '<span title="No tag">-</span>';

      const count = Number(tag.count) || 0;
      const label = this.escapeHtml(tag.name);
      return `<span title="${count} mention${count === 1 ? '' : 's'}">${label}</span>`;
    },

    topTagPillStyle(row, index) {
      const tag = this.getTopTag(row, index);
      if (!tag) {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      }

      const pct = Number(tag.pct);
      const count = Number(tag.count) || 0;

      if (Number.isFinite(pct) && pct > 0.1 && count > 3) {
        return { backgroundColor: this.colors.red, color: this.colors.white };
      }
      if (Number.isFinite(pct) && pct > 0.05 && count > 2) {
        return { backgroundColor: this.colors.yellow, color: this.colors.white };
      }
      return { backgroundColor: this.colors.green, color: this.colors.white };
    },

    topTagSortValue(row, index) {
      const tag = this.getTopTag(row, index);
      if (!tag) return -1;
      return Number(tag.count) || -1;
    },

    emitDrill(row) {
      this.$emit('drill-report', {
        report: 'evaluations',
        subMenu: 'course-course-evals-summary',
        program_code: String(row?.program_code ?? '').trim(),
        program_name: String(row?.program_name ?? '').trim()
      });
    }
  },

  template: `
  <report-table-shell
    title-html="Programs - Course Evals Summary"
    :table="table"
    :rows="visibleRows"
    :loading="loading"
    :load-error="loadError"
    loading-text="Loading course evaluations..."
    :row-key-fn="(row, index) => row.program_code || row.program_name || index"
    :row-clickable="true"
    @row-click="emitDrill"
  >
    <template #filters>
      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Year</label>
        <select v-model.number="year" v-bind="filterAttrs('academic_year')" style="font-size:.75rem; min-width:90px;">
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
