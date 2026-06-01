Vue.component('reports-evaluations-instructor-summary', {
  mixins: [
    window.ReportMixins.formatting,
    window.ReportMixins.yearSummary({
      loadErrorMessage: 'Unable to load instructor evaluations summary.'
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
        'Subs', 'Number of instructor evaluation submissions.', '5rem', false, 'number',
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
        'Support', 'Instructor was available for support.', '7rem', false, 'number',
        row => this.pctText(row?.likert_available_support),
        row => this.likertPillStyle(row?.likert_available_support),
        row => Number(row?.likert_available_support ?? -1)
      ),
      new window.ReportColumn(
        'Instruction', 'Instructor provided clear instruction.', '7rem', false, 'number',
        row => this.pctText(row?.likert_clear_instruction),
        row => this.likertPillStyle(row?.likert_clear_instruction),
        row => Number(row?.likert_clear_instruction ?? -1)
      ),
      new window.ReportColumn(
        'Career Prep', 'Instructor prepared students for career success.', '7rem', false, 'number',
        row => this.pctText(row?.likert_career_preparation),
        row => this.likertPillStyle(row?.likert_career_preparation),
        row => Number(row?.likert_career_preparation ?? -1)
      ),
      new window.ReportColumn(
        'Respect', 'Instructor treated students with respect.', '7rem', false, 'number',
        row => this.pctText(row?.likert_respect),
        row => this.likertPillStyle(row?.likert_respect),
        row => Number(row?.likert_respect ?? -1)
      ),
      new window.ReportColumn(
        'Progress', 'Instructor regularly reviewed progress.', '7rem', false, 'number',
        row => this.pctText(row?.likert_regular_progress_reviews),
        row => this.likertPillStyle(row?.likert_regular_progress_reviews),
        row => Number(row?.likert_regular_progress_reviews ?? -1)
      ),
      new window.ReportColumn(
        'Grading', 'Instructor graded in a timely way.', '7rem', false, 'number',
        row => this.pctText(row?.likert_timely_grading),
        row => this.likertPillStyle(row?.likert_timely_grading),
        row => Number(row?.likert_timely_grading ?? -1)
      ),
      new window.ReportColumn(
        'Feedback', 'Instructor feedback was helpful.', '7rem', false, 'number',
        row => this.pctText(row?.likert_helpful_feedback),
        row => this.likertPillStyle(row?.likert_helpful_feedback),
        row => Number(row?.likert_helpful_feedback ?? -1)
      ),
      new window.ReportColumn(
        'Prepared', 'Instructor was prepared for class.', '7rem', false, 'number',
        row => this.pctText(row?.likert_prepared_for_class),
        row => this.likertPillStyle(row?.likert_prepared_for_class),
        row => Number(row?.likert_prepared_for_class ?? -1)
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
          likert_available_support: Number(row?.likert_available_support),
          likert_clear_instruction: Number(row?.likert_clear_instruction),
          likert_career_preparation: Number(row?.likert_career_preparation),
          likert_respect: Number(row?.likert_respect),
          likert_regular_progress_reviews: Number(row?.likert_regular_progress_reviews),
          likert_timely_grading: Number(row?.likert_timely_grading),
          likert_helpful_feedback: Number(row?.likert_helpful_feedback),
          likert_prepared_for_class: Number(row?.likert_prepared_for_class),
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
    }
  },

  template: `
  <report-table-shell
    title-html="Programs - Instructor Eval Summary"
    :table="table"
    :rows="visibleRows"
    :loading="loading"
    :load-error="loadError"
    loading-text="Loading instructor evaluations..."
    :row-key-fn="(row, index) => row.program_code || row.program_name || index"
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
    </template>
  </report-table-shell>
  `
});
