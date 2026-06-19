Vue.component('employment-skills-report', {
  template: `
    <div style="margin-top: 12px;">
      <div
        v-if="loading"
        :style="panelStyle(colors.white, colors.black)"
      >
        Loading employment skills...
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
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap;">
          <div style="display: flex; gap: 8px 12px; flex-wrap: wrap; align-items: center;">
            <span
              v-if="selectedRecord && selectedRecord.most_recent_employment_skills_created_at"
              class="btech-ind-header__label"
            >
              Last Evaluation:
            </span>
            <span
              v-if="selectedRecord && selectedRecord.most_recent_employment_skills_created_at"
              class="btech-pill-text btech-ind-header__pill"
              :style="lastEvaluationPillStyle"
            >
              {{ formatDate(selectedRecord.most_recent_employment_skills_created_at) }}
            </span>
            <span
              v-if="selectedRecord && selectedRecord.is_pending_instructor_eval"
              class="btech-ind-header__label"
            >
              Status
            </span>
            <span
              v-if="selectedRecord && selectedRecord.is_pending_instructor_eval"
              class="btech-pill-text btech-ind-header__pill"
              :style="pillStyle(colors.red, colors.white)"
            >
              Pending Instructor Eval
            </span>
          </div>
          <div style="display: flex; gap: 8px 12px; flex-wrap: wrap; align-items: center;">
            <span class="btech-ind-header__label">Evaluations Recorded</span>
            <span
              class="btech-pill-text btech-ind-header__pill"
              :style="pillStyle(colors.gray, colors.black)"
            >
              {{ selectedRecord ? selectedRecord.num_evals__employment_skills || 0 : 0 }}
            </span>
          </div>
        </div>

        <div v-if="!selectedRecord" :style="{ color: colors.black }">
          No employment skills evaluations were found for this student and major.
        </div>

        <div v-else>
          <div
            v-if="scoreEntries.length"
            style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
              gap: 12px;
              margin-bottom: 16px;
            "
          >
            <div
              v-for="entry in scoreEntries"
              :key="entry.name"
              :style="cardStyle()"
            >
              <div style="font-weight: 600; margin-bottom: 10px;">
                {{ entry.name }}
              </div>
              <div style="display: flex; gap: 8px 12px; flex-wrap: wrap; align-items: center;">
                <span class="btech-ind-header__label">Instructor</span>
                <span
                  class="btech-pill-text btech-ind-header__pill"
                  :style="scorePillStyle(entry.instructorScore)"
                >
                  {{ displayScore(entry.instructorScore) }}
                </span>
                <span class="btech-ind-header__label">Self</span>
                <span
                  class="btech-pill-text btech-ind-header__pill"
                  :style="selfScorePillStyle(entry.selfScore)"
                >
                  {{ displayScore(entry.selfScore) }}
                </span>
              </div>
            </div>
          </div>

          <div
            v-if="selectedRecord.employment_skills_goals"
            :style="cardStyle()"
          >
            <div style="font-weight: 600; margin-bottom: 8px;">Goals</div>
            <div style="white-space: pre-wrap;">{{ selectedRecord.employment_skills_goals }}</div>
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
  computed: {
    selectedRecord() {
      if (!this.records.length) return null;

      const matchingProgramYear = this.records.find(record => {
        return String(record.program_code || '').trim().toUpperCase() === String(this.major.major_code || '').trim().toUpperCase()
          && Number(record.academic_year) === Number(this.major.academic_year__major);
      });

      if (matchingProgramYear) return matchingProgramYear;

      const matchingProgram = this.records.find(record => {
        return String(record.program_code || '').trim().toUpperCase() === String(this.major.major_code || '').trim().toUpperCase();
      });

      return matchingProgram || this.records[0];
    },
    scoreEntries() {
      if (!this.selectedRecord) return [];

      const instructorScores = this.selectedRecord.employment_skills_scores || {};
      const selfScores = this.selectedRecord.employment_skills_scores__self || {};
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
    lastEvaluationPillStyle() {
      if (!this.selectedRecord || !this.selectedRecord.most_recent_employment_skills_created_at) {
        return this.pillStyle(this.colors.gray, this.colors.black);
      }

      const ageInDays = this.daysSince(this.selectedRecord.most_recent_employment_skills_created_at);
      if (ageInDays < 30) return this.pillStyle(this.colors.green, this.colors.white);
      if (ageInDays < 60) return this.pillStyle(this.colors.yellow, this.colors.black);
      return this.pillStyle(this.colors.red, this.colors.white);
    }
  },
  data() {
    return {
      loading: false,
      error: '',
      records: []
    };
  },
  watch: {
    'user.sis_user_id': {
      handler() {
        this.loadEmploymentSkills();
      },
      immediate: true
    }
  },
  methods: {
    async loadEmploymentSkills() {
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
        this.error = 'Failed to load employment skills data.';
      } finally {
        this.loading = false;
      }
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
    displayScore(score) {
      return score == null || score === '' ? 'N/A' : score;
    },
    daysSince(date) {
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
      return (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24);
    },
    panelStyle(backgroundColor, textColor) {
      return 'padding: 20px; border: 1px solid ' + backgroundColor + '; border-radius: 12px; background: ' + backgroundColor + '; color: ' + textColor + ';';
    },
    cardStyle() {
      return 'padding: 14px; border: 1px solid ' + this.colors.gray + '; border-radius: 10px; background: ' + this.colors.white + '; color: ' + this.colors.black + ';';
    },
    pillStyle(backgroundColor, textColor) {
      return 'padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: ' + backgroundColor + '; color: ' + textColor + ';';
    },
    scorePillStyle(score) {
      return this.pillStyle(this.scoreBackground(score), this.scoreColor(score));
    },
    selfScorePillStyle(score) {
      return 'padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid ' + this.colors.gray + '; background: ' + this.colors.white + '; color: ' + this.colors.black + ';';
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
    }
  }
});
