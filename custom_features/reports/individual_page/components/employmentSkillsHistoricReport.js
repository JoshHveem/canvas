Vue.component('employment-skills-historic-report', {
  template: `
    <div style="margin-top: 12px;">
      <div
        v-if="loading"
        :style="panelStyle(colors.white, colors.black)"
      >
        Loading historic employment skills...
      </div>

      <div
        v-else-if="error"
        :style="panelStyle(colors.red, colors.white)"
      >
        {{ error }}
      </div>

      <div
        v-else
        :style="panelStyle(colors.white, colors.black)"
      >
        <div v-if="!filteredRecords.length" :style="{ color: colors.black }">
          No historic employment skills evaluations were found for this student and major.
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 10px;">
          <div
            v-for="record in filteredRecords"
            :key="recordKey(record)"
            :style="rowStyle()"
          >
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 240px;">
              <span class="btech-ind-header__label">Eval</span>
              <span
                class="btech-pill-text btech-ind-header__pill"
                :style="datePillStyle(record)"
              >
                {{ formatDate(record.created_at__instructor_eval || record.created_at__self_eval) }}
              </span>
              <span class="btech-ind-header__label">Status</span>
              <span
                class="btech-pill-text btech-ind-header__pill"
                :style="statusPillStyle(record)"
              >
                {{ record.is_pending_instructor_eval ? 'Pending' : 'Submitted' }}
              </span>
              <a
                v-if="submissionLink(record)"
                :href="submissionLink(record)"
                target="_blank"
                rel="noopener noreferrer"
                class="btech-ind-header__label"
                style="text-decoration: underline;"
              >
                Submission Link
              </a>
            </div>

            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 2px;">
              <div
                v-for="entry in scoreEntries(record)"
                :key="recordKey(record) + '-' + entry.name"
                :title="entry.name + ' | Instructor: ' + displayScore(entry.instructorScore) + ' | Self: ' + displayScore(entry.selfScore)"
                style="display: flex; align-items: center; gap: 4px; white-space: nowrap;"
              >
                <span class="btech-ind-header__label">{{ shortLabel(entry.name) }}</span>
                <span
                  class="btech-pill-text btech-ind-header__pill"
                  :style="scorePillStyle(entry.instructorScore)"
                >
                  {{ displayScore(entry.instructorScore) }}
                </span>
                <span
                  class="btech-pill-text btech-ind-header__pill"
                  :style="selfScorePillStyle()"
                >
                  {{ displayScore(entry.selfScore) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  props: {
    user: {
      type: Object,
      default: () => ({})
    },
    major: {
      type: Object,
      default: () => ({})
    },
    colors: {
      type: Object,
      default: () => bridgetools.colors || {}
    },
    settings: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      loading: false,
      error: '',
      records: []
    };
  },
  computed: {
    filteredRecords() {
      return this.records
        .filter(record => {
          return String(record.program_code || '').trim().toUpperCase() === String(this.major.major_code || '').trim().toUpperCase()
            && Number(record.academic_year) === Number(this.major.academic_year__major);
        })
        .sort((a, b) => {
          return new Date(b.created_at__instructor_eval || b.created_at__self_eval || 0)
            - new Date(a.created_at__instructor_eval || a.created_at__self_eval || 0);
        });
    }
  },
  watch: {
    'user.sis_user_id': {
      handler() {
        this.loadEmploymentSkillsHistory();
      },
      immediate: true
    }
  },
  methods: {
    async loadEmploymentSkillsHistory() {
      const sisUserId = this.user && this.user.sis_user_id;
      if (!sisUserId) {
        this.records = [];
        this.error = 'No SIS user ID is available for this student.';
        return;
      }

      this.loading = true;
      this.error = '';

      try {
        const data = await bridgetools.req3(
          'reports',
          { sis_user_id: sisUserId },
          { dataset: 'student_employment_skills' }
        );

        this.records = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error(err);
        this.records = [];
        this.error = 'Failed to load historic employment skills data.';
      } finally {
        this.loading = false;
      }
    },
    recordKey(record) {
      return [
        record.canvas_course_id,
        record.canvas_assignment_id,
        record.created_at__instructor_eval,
        record.created_at__self_eval
      ].join('|');
    },
    scoreEntries(record) {
      const instructorScores = record.employment_skills_scores || {};
      const selfScores = record.employment_skills_scores__self || {};
      const categories = Array.from(new Set([
        ...Object.keys(instructorScores),
        ...Object.keys(selfScores)
      ]));

      return categories.map(name => ({
        name,
        instructorScore: instructorScores[name],
        selfScore: selfScores[name]
      }));
    },
    shortLabel(name) {
      const labels = {
        'Growth & Development': 'G&D',
        'Collaboration & Respect': 'C&R',
        'Initiative & Adaptability': 'I&A',
        'Integrity & Accountability': 'I&Ac',
        'Productivity & Reliability': 'P&R',
        'Verbal & Written Communication': 'V&WC',
        'Safety & Professional Standards': 'S&PS',
        'Critical Thinking & Decision Making': 'CT&DM'
      };
      return labels[name] || name;
    },
    submissionLink(record) {
      const courseId = record.canvas_course_id;
      const assignmentId = record.canvas_assignment_id;
      const studentId = record.canvas_user_id || this.user.canvas_user_id;

      if (!courseId || !assignmentId || !studentId) return '';

      return 'https://btech.instructure.com/courses/' + courseId
        + '/gradebook/speed_grader?assignment_id=' + assignmentId
        + '&student_id=' + studentId;
    },
    formatDate(date) {
      if (!date) return 'N/A';
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) return String(date);

      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      const year = parsed.getFullYear();
      return month + '/' + day + '/' + year;
    },
    daysSince(date) {
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
      return (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24);
    },
    displayScore(score) {
      return score == null || score === '' ? 'N/A' : score;
    },
    panelStyle(backgroundColor, textColor) {
      return 'padding: 20px; border: 1px solid ' + backgroundColor + '; border-radius: 12px; background: ' + backgroundColor + '; color: ' + textColor + ';';
    },
    rowStyle() {
      return 'display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid ' + this.colors.gray + '; border-radius: 10px; background: ' + this.colors.white + '; overflow-x: auto;';
    },
    pillStyle(backgroundColor, textColor) {
      return 'padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background: ' + backgroundColor + '; color: ' + textColor + ';';
    },
    selfScorePillStyle() {
      return 'padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; border: 1px solid ' + this.colors.gray + '; background: ' + this.colors.white + '; color: ' + this.colors.black + ';';
    },
    scorePillStyle(score) {
      return this.pillStyle(this.scoreBackground(score), this.scoreColor(score));
    },
    scoreBackground(score) {
      const numeric = Number(score);
      if (!Number.isFinite(numeric)) return this.colors.gray;
      if (numeric >= 3) return this.colors.green;
      if (numeric >= 2) return this.colors.yellow;
      return this.colors.red;
    },
    scoreColor(score) {
      const numeric = Number(score);
      if (!Number.isFinite(numeric)) return this.colors.black;
      if (numeric >= 3) return this.colors.white;
      if (numeric >= 2) return this.colors.black;
      return this.colors.white;
    },
    statusPillStyle(record) {
      return record.is_pending_instructor_eval
        ? this.pillStyle(this.colors.red, this.colors.white)
        : this.pillStyle(this.colors.green, this.colors.white);
    },
    datePillStyle(record) {
      const ageInDays = this.daysSince(record.created_at__instructor_eval || record.created_at__self_eval);
      if (ageInDays < 30) return this.pillStyle(this.colors.green, this.colors.white);
      if (ageInDays < 60) return this.pillStyle(this.colors.yellow, this.colors.black);
      return this.pillStyle(this.colors.red, this.colors.white);
    }
  }
});
