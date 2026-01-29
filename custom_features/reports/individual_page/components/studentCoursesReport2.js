Vue.component('student-courses-report-2', {
  template:` 
    <div>
      <div style="margin-bottom: 5px;">
  <label style="cursor: pointer; display: flex; align-items: center; line-height: 1;">

    <input
      type="checkbox"
      v-model="useCurrentScore"
      style="margin-right: 6px;"
    />
    Treat Ungraded as 0
  </label>
</div>
 

      <!-- courses -->
      <div>
        <h2>Core</h2>
        <div v-for="(course, i) in core">
          <course-row-ind-2
            :progress="(course?.progress ?? 0) * 100"
            :colors="colors"
            :credits="course?.credits"
            :score="getDisplayScore(course)"
            :state="course?.state ?? ''"
            :course-name="course.name"
            :course-id="course.course_id"
            :course-code="course.course_code"
            :user-canvas-id="'' + user.canvas_id"
            :extensions="course.num_extensions"
            :istransfer="course?.is_transfer"
            :iswithdraw="false"
          ></course-row-ind-2>
        </div>

        <h2>Electives</h2>
        <div v-for="(course, i) in electives">
          <course-row-ind-2
            :progress="(course?.progress ?? 0) * 100"
            :colors="colors"
            :credits="course?.credits"
            :score="getDisplayScore(course)"
            :state="course?.state ?? ''"
            :course-name="course.name"
            :course-id="course.course_id"
            :course-code="course.course_code"
            :user-canvas-id="'' + user.canvas_id"
            :extensions="course.num_extensions"
            :istransfer="course?.is_transfer"
            :iswithdraw="false"
          ></course-row-ind-2>
        </div>

        <h2>Other</h2>
        <div v-for="(course, i) in others">
          <course-row-ind-2
            :progress="(course?.progress ?? 0) * 100"
            :colors="colors"
            :credits="course?.credits"
            :score="getDisplayScore(course)"
            :state="course?.state ?? ''"
            :course-name="course.name"
            :course-id="course.course_id"
            :course-code="course.course_code"
            :user-canvas-id="'' + user.canvas_id"
            :extensions="course.num_extensions"
            :istransfer="false"
            :iswithdraw="false"
          ></course-row-ind-2>
        </div>


      </div>
    </div>
  `,
  props: {
    user: {},
    degree: {},
    tree: {},
    settings: {}
  },
  computed: {
    core: function () {
      let courses = this.tree?.courses ?? {};
      let core = courses?.core ?? {};
      let list = [];
      for (let courseCode in core) {
        let data = core[courseCode];
        data.course_code = courseCode;
        let userData = this.getUserCourseData(courseCode);
        if (userData) {
          data.state = userData.canvas_enrollment_state ?? '';
          data.is_transfer = userData.is_transfer;
          data.num_extensions = userData.num_extensions;
          if (data.state == '' && data.is_transfer) data.state = 'transfer';
          data.course_id = userData.course_id;
          data.progress = userData.progress;
          data.current_score = userData.current_score;
          data.final_score = userData.final_score;
          data.credits_per_day = userData.credits_per_day;
          data.days_in_course = userData.time_in_course / (60 * 60 * 24);
        }
        list.push(data);
      }
      list.sort((a, b) => {
        const ad = String(a.course_code || '').toLowerCase();
        const bd = String(b.course_code || '').toLowerCase();
        return ad > bd ? 1 : ad < bd ? -1 : 0;
      });
      return list;
    },
    electives: function () {
      let courses = this.tree?.courses ?? {};
      let electives = courses?.elective ?? {};
      let list = [];
      for (let courseCode in electives) {
        let data = electives[courseCode];
        data.course_code = courseCode;
        let userData = this.getUserCourseData(courseCode);
        if (userData) {
          data.state = userData.canvas_enrollment_state ?? '';
          data.is_transfer = userData.is_transfer;
          if (data.state == '' && data.is_transfer) data.state = 'transfer';
          data.num_extensions = userData.num_extensions;
          data.course_id = userData.course_id;
          data.progress = userData.progress;
          data.final_score = userData.final_score;
          data.current_score = userData.current_score;
          data.credits_per_day = userData.credits_per_day;
          data.days_in_course = userData.time_in_course / (60 * 60 * 24);
        }
        list.push(data);
      }
      list.sort((a, b) => {
        const ad = String(a.course_code || '').toLowerCase();
        const bd = String(b.course_code || '').toLowerCase();
        return ad > bd ? 1 : ad < bd ? -1 : 0;
      });
      return list;
    },
    others: function () {
      const userCourses = this.user?.courses ?? {};
      const courses = this.tree?.courses ?? {};
      const core = courses.core ?? {};
      const electives = courses.elective ?? {};

      const others = [];

      for (let key in userCourses) {
        const course = userCourses[key];
        const code = course.course_code;

        const isCore = code in core;
        const isElective = code in electives;

        // Only include courses that are NOT in core and NOT in electives
        if (!isCore && !isElective) {
          const data = { ...course }; // shallow copy so we don't mutate original

          // If you want days_in_course similar to the others:
          if (data.time_in_course != null) {
            data.days_in_course = data.time_in_course / (60 * 60 * 24);
          }

          others.push(data);
        }
      }

      // Optional: keep them sorted like core/electives
      others.sort((a, b) => {
        const ad = String(a.course_code || "").toLowerCase();
        const bd = String(b.course_code || "").toLowerCase();
        return ad > bd ? 1 : ad < bd ? -1 : 0;
      });

      return others;
    }
  },
  data() {
    return {
      colors: bridgetools.colors,
      donut: {},
      useCurrentScore: false,
    }
  },
  watch: {
    // fires whenever `tree` is replaced by the parent
  },
  mounted() {
    // let entry = new Date();
    let donut = new ProgressGraphDonut();
    this.donut = donut;
  },

  methods: {
    getDisplayScore(course) {
      return this.useCurrentScore
        ? course?.current_score
        : course?.final_score;
    },
    updateHeader () {
      let donut = this.donut;
      try {
        donut._init('btech-department-report-student-progress-donut', this.colors.gray);
        donut.fillHours( 
          {
            max: this?.tree?.hours ?? 1, 
            hours: this?.degree?.graded_hours ?? 0, 
            color: this.colors.blue, 
          }
        );
      } catch (err) {
        console.error(err);
      }
    },
    getUserCourseData(courseCode) {
      for (let c in this.user.courses) {
        let course = this.user.courses[c];
        if (course.course_code == courseCode) return course;
      }
      return undefined;
    },
    calcLastLoginColorBg(date) {
      let app = this;
      if (typeof date == 'string') {
        if (date == "") return app.colors.red;
        date = new Date(date);
      }
      let now = new Date();
      let diff = now - date;
      let days = diff / (1000 * 3600 * 24);
      if (days >= 7) return app.colors.red;
      if (days >= 5) return app.colors.yellow;
      return app.colors.green;
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
  }
});