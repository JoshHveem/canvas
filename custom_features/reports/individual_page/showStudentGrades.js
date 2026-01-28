Vue.component('show-student-grades', {
  template: ` 
    <div>
      <div style="margin-bottom: 1rem;">
        <span style="font-size: 2rem;">{{user.name}} ({{user.sis_id}})</span>
        <span style="float: right;">Date Generated: <i>{{dateToString(new Date())}}</i></span>
      </div>

      <!--CONTRACTED HOURS-->
      <div 
        style="margin-block-end: 2rem; display: grid; grid-template-columns: 18rem 7rem 7rem 7rem; gap: 1rem;" 
      >
        <div style="display: contents;">
          <span></span>
          <span><strong>Current Score</strong></span>
          <span><strong>Final Score</strong></span>
          <span><strong>Progress</strong></span>
        </div>

        <div v-if="loading" style="display: contents;">
          <span><i>Loading courses…</i></span>
          <span></span><span></span><span></span>
        </div>

        <div v-else-if="!user || !user.canvas_id" style="display: contents;">
          <span><i>Waiting for Canvas ID…</i></span>
          <span></span><span></span><span></span>
        </div>

        <div v-else-if="enrollments.length === 0" style="display: contents;">
          <span><i>No enrollments found.</i></span>
          <span></span><span></span><span></span>
        </div>

        <div v-for="enrollment in enrollments" :key="enrollment.id" style="display: contents;">
          <span>
            <span><strong>{{ enrollment.course_name }}</strong></span><br>
            <span style="font-size: 0.75rem;"><i>{{ enrollment.term && enrollment.term.name }}</i></span>
          </span>
          <span>{{ enrollment.computed_current_score }}% ({{ enrollment.computed_current_grade }})</span>
          <span>{{ enrollment.computed_final_score }}% ({{ enrollment.computed_final_grade }})</span>
          <span>
            {{
              enrollment.computed_current_score > 0
                ? (Math.round((enrollment.computed_final_score / enrollment.computed_current_score) * 1000) / 10)
                : ''
            }}%
          </span>
        </div>
      </div>
    </div>
  `,
  props: {
    settings: {
      type: Object,
      default: () => ({})
    },
    user: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      MONTH_NAMES_SHORT: ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"],
      DAYS_NAMES_SHORT: ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"],
      DAYS_NAMES: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      previousMonths: (function () {
        let months = [];
        return months;
      })(),
      enrollments: [],
      loading: false,
      error: null,
      _fetchToken: 0
    }
  },

  mounted() {
    // If canvas_id already exists at mount, watcher (immediate) will fetch right away.
    console.log("Mounted user:", this.user);
  },

  watch: {
    // Watch specifically for when canvas_id appears/changes
    'user': {
      immediate: true,
      handler(newUser, oldUser) {
        console.log(newUser);
        let newCanvasId = newUser?.canvas_id;
        let oldCanvasId = oldUser?.canvas_id;
        if (!newCanvasId) {
          // No canvas_id yet; clear state and wait.
          this.enrollments = [];
          this.loading = false;
          this.error = null;
          return;
        }

        // If changed (or appeared), fetch
        if (newCanvasId !== oldCanvasId) {
          this.fetchEnrollments();
        } else if (this.enrollments.length === 0) {
          // Same id but nothing loaded yet (edge cases)
          this.fetchEnrollments();
        }
      }
    }
  },

  methods: {
    async fetchEnrollments() {
      const canvasId = this.user && this.user.canvas_id;
      console.log(canvasId);
      if (!canvasId) return;

      const myToken = ++this._fetchToken;
      this.loading = true;
      this.error = null;

      try {
        const courses = await canvasGet(
          `/api/v1/users/${canvasId}/courses?enrollment_Type=student&include[]=total_scores&include[]=current_grading_period_scores&include[]=term`
        );
        console.log(courses);

        // If a newer request started, ignore this result
        if (myToken !== this._fetchToken) return;
        console.log("MADE IT")

        let enrollments = [];
        (courses || []).forEach(course => {
          (course.enrollments || []).forEach(enrollment => {
            enrollment.course_name = course.name;
            enrollment.term = course.term;
            enrollments.push(enrollment);
          });
        });

        this.enrollments = enrollments;
      } catch (e) {
        if (myToken !== this._fetchToken) return;
        console.error("Failed to fetch enrollments:", e);
        this.error = e;
        this.enrollments = [];
      } finally {
        if (myToken !== this._fetchToken) return;
        this.loading = false;
      }
    },

    dateToString(date) {
      if (typeof date == 'string') {
        if (date == "" || date == "N/A") return "N/A";
        date = new Date(date);
      }
      if (date == null) return "N/A";
      let year = date.getFullYear();
      let month = (1 + date.getMonth()).toString().padStart(2, '0');
      let day = date.getDate().toString().padStart(2, '0');
      return month + '/' + day + '/' + year;
    },
  },

  destroyed: function () {
    // If you want, you can invalidate in-flight requests:
    this._fetchToken++;
  }
});
