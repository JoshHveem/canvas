Vue.component('employment-skills-report', {
  template: `
    <div style="margin-top: 12px;">
      <div
        v-if="loading"
        style="
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #f9fafb;
          color: #4b5563;
        "
      >
        Loading employment skills...
      </div>

      <div
        v-else-if="error"
        style="
          padding: 20px;
          border: 1px solid #fecaca;
          border-radius: 12px;
          background: #fef2f2;
          color: #991b1b;
        "
      >
        {{ error }}
      </div>

      <div
        v-else
        style="
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #f9fafb;
        "
      >
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap;">
          <h2 style="margin: 0;">Employment Skills</h2>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <span
              style="padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #e5e7eb; color: #111827;"
            >
              Evaluations: {{ selectedRecord ? selectedRecord.num_evals__employment_skills || 0 : 0 }}
            </span>
            <span
              v-if="selectedRecord"
              :style="pendingPillStyle"
            >
              {{ selectedRecord.is_pending_instructor_eval ? 'Instructor Eval Pending' : 'Instructor Eval Complete' }}
            </span>
            <span
              v-if="selectedRecord && selectedRecord.most_recent_employment_skills_created_at"
              style="padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #dbeafe; color: #1e3a8a;"
            >
              Most Recent: {{ formatDate(selectedRecord.most_recent_employment_skills_created_at) }}
            </span>
          </div>
        </div>

        <div v-if="!selectedRecord" style="color: #4b5563;">
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
              style="
                padding: 14px;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
                background: #ffffff;
              "
            >
              <div style="font-weight: 600; margin-bottom: 10px; color: #111827;">
                {{ entry.name }}
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span :style="scorePillStyle(entry.instructorScore)">
                  Instructor: {{ displayScore(entry.instructorScore) }}
                </span>
                <span :style="selfScorePillStyle(entry.selfScore)">
                  Self: {{ displayScore(entry.selfScore) }}
                </span>
              </div>
            </div>
          </div>

          <div
            v-if="selectedRecord.employment_skills_goals"
            style="
              padding: 14px;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              background: #ffffff;
            "
          >
            <div style="font-weight: 600; margin-bottom: 8px; color: #111827;">Goals</div>
            <div style="color: #374151; white-space: pre-wrap;">{{ selectedRecord.employment_skills_goals }}</div>
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
    pendingPillStyle() {
      if (!this.selectedRecord) return '';
      return this.selectedRecord.is_pending_instructor_eval
        ? 'padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #fef3c7; color: #92400e;'
        : 'padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #dcfce7; color: #166534;';
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
    scorePillStyle(score) {
      return 'padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: '
        + this.scoreBackground(score)
        + '; color: '
        + this.scoreColor(score)
        + ';';
    },
    selfScorePillStyle(score) {
      return 'padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid #d1d5db; background: #f3f4f6; color: '
        + this.scoreColor(score)
        + ';';
    },
    scoreBackground(score) {
      const numeric = Number(score);
      if (!Number.isFinite(numeric)) return '#e5e7eb';
      if (numeric >= 4) return '#dcfce7';
      if (numeric >= 3) return '#fef3c7';
      return '#fee2e2';
    },
    scoreColor(score) {
      const numeric = Number(score);
      if (!Number.isFinite(numeric)) return '#374151';
      if (numeric >= 4) return '#166534';
      if (numeric >= 3) return '#92400e';
      return '#991b1b';
    }
  }
});
