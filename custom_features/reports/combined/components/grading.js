Vue.component('instructor-metrics-grading', {
  template: ` 
    <div>
        <div
            class="btech-card btech-theme"
            v-if="grading"
            aria-label="Grading overview card"
        >
            <!-- Header -->
            <div class="btech-row" style="margin-bottom:12px;">
                <h4 class="btech-card-title">Grading Overview</h4>
                <span class="btech-pill" :title="'Filters: ' + (year || '')">
                {{ year || '—' }}
                </span>
            </div>

            <!-- KPI Tiles -->
            <div class="btech-grid-3" style="margin-bottom:12px;">
                <div class="btech-tile" title="Total number of submissions graded">
                  <div class="btech-kpi-label">Assignments Graded</div>
                  <div class="btech-kpi-value">{{ (grading.assignments_graded || 0).toLocaleString() }}</div>
                </div>
                <div class="btech-tile" title="Average attempts students make before passing">
                  <div class="btech-kpi-label">Average Attempts (Goal: < 1.1)</div>
                  <div class="btech-kpi-value">{{ Number(grading.average_attempts || 0).toFixed(2) }} <span class="btech-muted">per student</span></div>
                </div>
                <div class="btech-tile" title="Median days to return a grade">
                  <div class="btech-kpi-label">Days to Grade (Goal: < 2)</div>
                  <div class="btech-kpi-value">{{ Number(grading.days_to_grade || 0).toFixed(1) }} <span class="btech-muted">days</span></div>
                </div>
                <div class="btech-tile" title="The ammount of progress hours for which this instructor is responsible">
                    <div class="btech-kpi-label">Credits Graded</div>
                    <div class="btech-kpi-value">
                        {{ (Number(supportHours.instructor_support_hours_weighted || 0) / 30).toFixed(1) }}
                        <span class="btech-muted">credits</span>
                    </div>
                </div>
                <div class="btech-tile" title="Average number of comments per graded submission">
                  <div class="btech-kpi-label">Comments / Submission (Goal: >= 1)</div>
                  <div class="btech-kpi-value">{{ Number(grading.comments_per_submission_graded || 0).toFixed(2) }}</div>
                </div>
                <div class="btech-tile" title="The number of days that pass between a student message in inbox and the instructor's reply.">
                    <div class="btech-kpi-label">Days to Reply (Goal: < 2)</div>
                    <div class="btech-kpi-value">
                        {{ Number(interactions.days_to_reply || 0).toFixed(1) }}
                        <span class="btech-muted">days</span>
                    </div>
                </div>
            </div>

            <!-- Progress Bars -->
            <div class="btech-grid-2" style="margin-bottom:8px;">
                <div class="btech-tile">
                    <div class="btech-row" style="margin-bottom:6px;">
                        <div style="font-size:12px; color:#374151; font-weight:600;">Department Share Assignment Hours</div>
                        <div style="font-size:12px; color:#111827; font-weight:700;">
                        {{ Math.round((supportHours.perc_instructor_support_hours_weighted || 0) * 100) }}%
                        </div>
                    </div>
                    <div class="btech-progress" role="presentation">
                        <div
                        class="fill btech-fill-accent"
                        :style="{ width: Math.max(0, Math.min(100, (supportHours.perc_instructor_support_hours_weighted || 0) * 100)) + '%' }"
                        role="progressbar"
                        :aria-valuenow="(supportHours.perc_instructor_support_hours_weighted || 0) * 100"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        :aria-label="'Department share ' + Math.round((supportHours.perc_instructor_support_hours_weighted || 0) * 100) + '%'"
                        ></div>
                    </div>
                    <div class="btech-muted" style="margin-top:6px;">
                        Share of all department support/gradings hours handled by this instructor.
                    </div>
                </div>

                <div class="btech-tile">
                  <div class="btech-row" style="margin-bottom:6px;">
                      <div style="font-size:12px; color:#374151; font-weight:600;">Graded with Rubric</div>
                      <div style="font-size:12px; color:#111827; font-weight:700;">{{ Math.round((grading.perc_graded_with_rubric || 0) * 100) }}%</div>
                  </div>
                  <div class="btech-progress" role="presentation">
                      <div
                      class="fill btech-fill-success"
                      :style="{ width: Math.max(0, Math.min(100, (grading.perc_graded_with_rubric || 0) * 100)) + '%' }"
                      role="progressbar"
                      :aria-valuenow="(grading.perc_graded_with_rubric || 0) * 100"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      :aria-label="'Rubric usage ' + Math.round((grading.perc_graded_with_rubric || 0) * 100) + '%'"
                      ></div>
                  </div>
                  <div class="btech-muted" style="margin-top:6px;">Target: 100% of graded items should use a rubric.</div>
                </div>
            </div>

            <!-- Footnote -->
            <div class="btech-muted">
                <span style="display:inline-block; margin-right:8px;">▲ Higher is better</span>
                <span style="display:inline-block; margin-right:8px;">• Average Attempts reflects student retakes</span>
            </div>
        </div>

        <!-- Empty State -->
        <div class="btech-card btech-theme" v-else>
            <div class="btech-muted" style="text-align:center;">No grading data yet.</div>
        </div>
    </div>
  `,
  props: {
    year: 0,
    grading: {},
    supportHours: {},
    interactions: {}
  },
  computed: {
  },
  data() {
    return {
    }
  },
  async mounted() {
    console.log(this.grading);
    this.openModal();
  },
  methods: {
    openModal() {
    },

    closeModal() {
    },
  },
  destroyed: function () {}
});