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
        <div v-if="!recordGroups.length" :style="{ color: colors.black }">
          No historic employment skills evaluations were found for this student and major.
        </div>

        <div
          v-else
          style="display: flex; flex-direction: column; gap: 16px;"
        >
          <div
            v-for="(group, groupIndex) in recordGroups"
            :key="'group-' + groupIndex"
            :style="tableWrapperStyle()"
          >
            <div
              v-if="groupIndex > 0"
              style="padding: 10px 12px 0 12px;"
            >
              <span class="btech-ind-header__label">
                Skill set changed
              </span>
            </div>
            <div
              :style="tableGridStyle(group.skillColumns)"
            >
              <div :style="headerCellStyle()">Submitted At</div>
              <div :style="headerCellStyle()">Status</div>
              <div :style="headerCellStyle()">Course</div>
              <div
                v-for="skillName in group.skillColumns"
                :key="'header-' + groupIndex + '-' + skillName"
                :style="headerCellStyle()"
                :title="skillName"
              >
                {{ skillName }}
              </div>

              <template v-for="record in group.records">
                <div
                  :key="recordKey(record) + '-date'"
                  :style="cellStyle()"
                >
                  <span
                    class="btech-pill-text btech-ind-header__pill"
                    :style="datePillStyle(record)"
                  >
                    {{ formatDate(record.created_at__instructor_eval || record.created_at__self_eval) }}
                  </span>
                </div>
                <div
                  :key="recordKey(record) + '-status'"
                  :style="cellStyle()"
                >
                  <span
                    class="btech-pill-text btech-ind-header__pill"
                    :style="statusPillStyle(record)"
                  >
                    {{ record.is_pending_instructor_eval ? 'Pending' : 'Submitted' }}
                  </span>
                </div>
                <div
                  :key="recordKey(record) + '-course'"
                  :style="cellStyle('flex-start')"
                >
                  <a
                    v-if="submissionLink(record)"
                    :href="submissionLink(record)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btech-ind-header__label"
                    :title="record.course_name || 'Open SpeedGrader'"
                    style="text-decoration: underline;"
                  >
                    {{ record.course_name || 'Submission Link' }}
                  </a>
                  <span
                    v-else
                    class="btech-ind-header__label"
                    :title="record.course_name || ''"
                  >
                    {{ record.course_name || 'N/A' }}
                  </span>
                </div>
                <div
                  v-for="skillName in group.skillColumns"
                  :key="recordKey(record) + '-' + skillName"
                  :style="cellStyle()"
                  :title="skillName + ': ' + displayScore(instructorScore(record, skillName))"
                >
                  <span
                    class="btech-pill-text btech-ind-header__pill"
                    :style="scorePillStyle(instructorScore(record, skillName))"
                  >
                    {{ displayScore(instructorScore(record, skillName)) }}
                  </span>
                </div>
              </template>
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
    },
    recordGroups() {
      const groups = [];

      this.filteredRecords.forEach(record => {
        const skillColumns = this.getRecordSkillColumns(record);
        const skillSignature = this.buildSkillSignature(skillColumns);
        const lastGroup = groups[groups.length - 1];

        if (!lastGroup || lastGroup.skillSignature !== skillSignature) {
          groups.push({
            skillSignature,
            skillColumns,
            records: [record]
          });
          return;
        }

        lastGroup.records.push(record);
      });

      return groups;
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
    getRecordSkillColumns(record) {
      const instructorScores = record.employment_skills_scores || {};
      const selfScores = record.employment_skills_scores__self || {};
      const allSkillNames = Array.from(new Set([
        ...Object.keys(instructorScores),
        ...Object.keys(selfScores)
      ]));

      const populatedSkillNames = allSkillNames.filter(skillName => {
        return this.hasScore(instructorScores[skillName]) || this.hasScore(selfScores[skillName]);
      });

      return (populatedSkillNames.length ? populatedSkillNames : allSkillNames)
        .sort((a, b) => a.localeCompare(b));
    },
    buildSkillSignature(skillColumns) {
      return (skillColumns || []).join('|');
    },
    hasScore(score) {
      return score != null && score !== '';
    },
    instructorScore(record, skillName) {
      return record.employment_skills_scores?.[skillName];
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
    tableWrapperStyle() {
      return 'overflow: auto; max-height: 70vh; border: 1px solid ' + this.colors.gray + '; border-radius: 10px; background: ' + this.colors.white + ';';
    },
    tableGridStyle(skillColumns) {
      const baseColumns = '160px 110px 220px';
      const dynamicColumns = (skillColumns || []).map(() => 'minmax(120px, 1fr)').join(' ');
      const templateColumns = [baseColumns, dynamicColumns].filter(Boolean).join(' ');
      const minWidth = 490 + ((skillColumns || []).length * 120);
      return 'display: grid; grid-template-columns: ' + templateColumns + '; min-width: ' + minWidth + 'px;';
    },
    headerCellStyle() {
      return 'position: sticky; top: 0; z-index: 2; padding: 10px 8px; border-bottom: 1px solid ' + this.colors.gray + '; background: ' + this.colors.white + '; font-size: 12px; font-weight: 700; white-space: normal; line-height: 1.25;';
    },
    cellStyle(justifyContent = 'center') {
      return 'padding: 8px; border-bottom: 1px solid ' + this.colors.gray + '; background: ' + this.colors.white + '; display: flex; align-items: center; justify-content: ' + justifyContent + '; min-height: 46px;';
    },
    pillStyle(backgroundColor, textColor) {
      return 'padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background: ' + backgroundColor + '; color: ' + textColor + ';';
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
