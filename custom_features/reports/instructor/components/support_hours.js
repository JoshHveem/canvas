Vue.component('instructor-metrics-support-hours', {
  template: ` 
    <div>
        <!-- Support Hours Card (scoped under #canvas-instructor-report-vue) -->
        <div
            class="btech-card btech-theme"
            v-if="supportHours"
            aria-label="Support hours overview card"
        >
        <!-- Header -->
        <div class="btech-row" style="margin-bottom:12px;">
            <h4 class="btech-card-title">Support Hours Overview</h4>
            <span class="btech-pill" :title="'Filters: ' + (settings.filters?.year || '')">
            {{ settings.filters?.year || '—' }}
            </span>
        </div>

        <!-- KPI Tiles -->
        <div class="btech-grid-3" style="margin-bottom:12px;">
            <!-- Hours Graded -->
            <div class="btech-tile" title="Estimated direct hours spent grading">
            <div class="btech-kpi-label">Hours Graded</div>
            <div class="btech-kpi-value">
                {{ Number(supportHours.hours_graded || 0).toFixed(1) }}
                <span class="btech-muted">hrs</span>
            </div>
            </div>

            <!-- Instructor Support Hours -->
            <div class="btech-tile" title="Broader estimate of grading-related support time">
            <div class="btech-kpi-label">Support Hours</div>
            <div class="btech-kpi-value">
                {{ Number(supportHours.instructor_support_hours || 0).toFixed(1) }}
                <span class="btech-muted">hrs</span>
            </div>
            </div>

            <!-- Weighted Support Hours -->
            <div class="btech-tile" title="Support hours adjusted by course/assignment weighting">
            <div class="btech-kpi-label">Weighted Support Hours</div>
            <div class="btech-kpi-value">
                {{ Number(supportHours.instructor_support_hours_weighted || 0).toFixed(1) }}
                <span class="btech-muted">hrs</span>
            </div>
            </div>
        </div>

        <!-- Progress Bars (share of department) -->
        <div class="btech-grid-2" style="margin-bottom:8px;">
            <!-- % Department (Unweighted) -->
            <div class="btech-tile">
            <div class="btech-row" style="margin-bottom:6px;">
                <div style="font-size:12px; color:#374151; font-weight:600;">Department Share</div>
                <div style="font-size:12px; color:#111827; font-weight:700;">
                {{ Math.round((supportHours.perc_instructor_support_hours || 0) * 100) }}%
                </div>
            </div>
            <div class="btech-progress" role="presentation">
                <div
                class="fill btech-fill-accent"
                :style="{ width: Math.max(0, Math.min(100, (supportHours.perc_instructor_support_hours || 0) * 100)) + '%' }"
                role="progressbar"
                :aria-valuenow="(supportHours.perc_instructor_support_hours || 0) * 100"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="'Department share ' + Math.round((supportHours.perc_instructor_support_hours || 0) * 100) + '%'"
                ></div>
            </div>
            <div class="btech-muted" style="margin-top:6px;">
                Share of all department support/gradings hours handled by this instructor.
            </div>
            </div>

            <!-- % Department (Weighted) -->
            <div class="btech-tile">
            <div class="btech-row" style="margin-bottom:6px;">
                <div style="font-size:12px; color:#374151; font-weight:600;">Department Share (Weighted)</div>
                <div style="font-size:12px; color:#111827; font-weight:700;">
                {{ Math.round((supportHours.perc_instructor_support_hours_weighted || 0) * 100) }}%
                </div>
            </div>
            <div class="btech-progress" role="presentation">
                <div
                class="fill btech-fill-success"
                :style="{ width: Math.max(0, Math.min(100, (supportHours.perc_instructor_support_hours_weighted || 0) * 100)) + '%' }"
                role="progressbar"
                :aria-valuenow="(supportHours.perc_instructor_support_hours_weighted || 0) * 100"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="'Department share (weighted) ' + Math.round((supportHours.perc_instructor_support_hours_weighted || 0) * 100) + '%'"
                ></div>
            </div>
            <div class="btech-muted" style="margin-top:6px;">
                Share adjusted by course/assignment weighting.
            </div>
            </div>
        </div>

        <!-- Footnote -->
        <div class="btech-muted">
            <span style="display:inline-block; margin-right:8px;">▲ Higher is more total grading time contributed</span>
            <span style="display:inline-block; margin-right:8px;">• "Weighted" accounts for course/assignment factors</span>
        </div>
        </div>
    </div>
  `,
  props: {
    year: 0,
    supportHours: {}
  },
  computed: {
  },
  data() {
    return {
    }
  },
  async mounted() {
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