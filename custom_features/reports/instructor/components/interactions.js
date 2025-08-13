Vue.component('instructor-metrics-interactions', {
  template: ` 
    <div>
        <div
            class="btech-card btech-theme"
            aria-label="Support Hours overview card"
        >
            <!-- Header -->
            <div class="btech-row" style="margin-bottom:12px;">
                <h4 class="btech-card-title">Support Hours Overview</h4>
                <span class="btech-pill" :title="'Filters: ' + (year || '')">
                {{ year || '—' }}
                </span>
            </div>

            <!-- KPI Tiles -->
            <div class="btech-grid-3" style="margin-bottom:12px;">
                <!-- Hours Graded -->
                <div class="btech-tile" title="Number of replies to students using Canvas Inbox.">
                    <div class="btech-kpi-label">Replies to Students (Canvas Inbox)</div>
                    <div class="btech-kpi-value">
                        {{ Number(interactions.num_replies_to_students || 0).toFixed(1) }}
                    </div>
                </div>

                <!-- Instructor Support Hours -->
                <div class="btech-tile" title="The number of days that pass between a student message in inbox and the instructor's reply.">
                    <div class="btech-kpi-label">Days to Reply</div>
                    <div class="btech-kpi-value">
                        {{ Number(interactions.days_to_reply || 0).toFixed(1) }}
                        <span class="btech-muted">days</span>
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
    interactions: {}
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