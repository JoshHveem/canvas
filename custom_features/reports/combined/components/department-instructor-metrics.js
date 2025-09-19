Vue.component('department-instructor-metrics', {
  props: {
    instructorMetrics: { type: Object, default: {}, required: true },
    year: { type: [String, Number], default: null }
  },

  computed: {
    summary() { return this.surveys?.summary ?? ''; },
    yearLabel() { return this.year ?? '—'; },
    
  },
  mounted: async function() {
  },

  template: `
        <div
            class="btech-card btech-theme"
            v-if="instructorMetrics"
            aria-label="Instructor Metrics"
        >
          <!-- Header -->
          <div class="btech-row" style="margin-bottom:12px;">
              <h4 class="btech-card-title">Instructors Overview</h4>
              <span class="btech-pill" :title="'Filters: ' + (year || '')">
              {{ year || '—' }}
              </span>
          </div>

          <!-- KPI Tiles -->
          <div class="btech-grid-3" style="margin-bottom:12px;">
              <kpi-tile
                label="Assignments Graded"
                :value="instructorMetrics.assignments_graded || 0"
                :decimals="0"
                title="Number of Assignments Graded this Year"
              />
              <kpi-tile
                label="Students per Day"
                :value="instructorMetrics.full_time_students_per_day || 0"
                :decimals="0"
                title="Based on credits earned across the department in the year, an estimate of full time students your department is working with each day."
              />
              <kpi-tile
                label="Daily Submission Workload"
                :value="instructorMetrics.assignments_per_day || 0"
                :decimals="0"
                title="Average number of assignments submitted each day."
              />
              <kpi-tile
                label="Days to Grade"
                :value="instructorMetrics.days_to_grade || 0"
                unit="days"
                :decimals="1"
                :goal="{ comparator:'lt', target:2, label:'< 2' }"
                title="Median days to return a grade"
              />

              <kpi-tile
                label="Comments per Submission"
                :value="instructorMetrics.comments_per_submission_graded || 0"
                :decimals="2"
                :goal="{ comparator:'between', min:0.9, max:1.2, label:'~ 1.0' }"
                title="Average comments per graded submission"
              />

              <kpi-tile
                label="Average Attempts"
                :value="instructorMetrics.average_attempts || 0"
                :decimals="2"
                :goal="{ comparator:'between', min:0.9, max:1.1, label:'~ 1.0' }"
                title="Average attempts per student"
              />  
          </div>
          <div class="btech-tile">
              <div class="btech-row" style="margin-bottom:6px;">
                  <div style="font-size:12px; color:#374151; font-weight:600;">Percentage of assignments graded with a rubric</div>
                  <div style="font-size:12px; color:#111827; font-weight:700;">
                  {{ Math.round((instructorMetrics.graded_with_rubric || 0) * 100) }}%
                  </div>
              </div>
              <div class="btech-progress" role="presentation">
                  <div
                  class="fill btech-fill-accent"
                  :style="{ width: Math.max(0, Math.min(100, (instructorMetrics.graded_with_rubric || 0) * 100)) + '%' }"
                  role="progressbar"
                  :aria-valuenow="(instructorMetrics.graded_with_rubric || 0) * 100"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  :aria-label="'Department share ' + Math.round((instructorMetrics.graded_with_rubric || 0) * 100) + '%'"
                  ></div>
              </div>
              <div class="btech-muted" style="margin-top:6px;">
                  Share of all department support/gradings hours handled by this instructor.
              </div>
          </div>
        </div>
  `
});
