Vue.component('student-courses-report-2', {
  template:` 
    <div>
      <div style="margin-bottom: 5px;">
        <div style="display: flex; align-items: center;">
          <input
            type="checkbox"
            v-model="treatUngradedAsZero"
            id="treat-ungraded"
            style="margin: 0 6px 0 0;"
          />
          <label
            for="treat-ungraded"
            style="cursor: pointer; margin: 0; line-height: 1;"
          >
            Treat Ungraded as 0
          </label>
        </div>
      </div>
 

      <!-- courses -->
      <div>
        <h2>Core</h2>
        <div v-for="course in core" :key="'core-' + course.course_code">
          <course-row-ind-2
            :progress="(course?.progress ?? 0) * 100"
            :colors="colors"
            :credits="course?.credits"
            :score="getDisplayScore(course)"
            :state="course?.state ?? ''"
            :course-name="course.course_name"
            :course-id="course.canvas_course_id"
            :course-code="course.course_code"
            :user-canvas-id="'' + user.canvas_user_id"
            :extensions="course.num_extensions"
            :istransfer="course?.is_transfer"
            :iswithdraw="false"
          ></course-row-ind-2>
        </div>

        <h2>Electives</h2>
        <div v-for="course in electives" :key="'elective-' + course.course_code">
          <course-row-ind-2
            :progress="(course?.progress ?? 0) * 100"
            :colors="colors"
            :credits="course?.credits"
            :score="getDisplayScore(course)"
            :state="course?.state ?? ''"
            :course-name="course.course_name"
            :course-id="course.canvas_course_id"
            :course-code="course.course_code"
            :user-canvas-id="'' + user.canvas_user_id"
            :extensions="course.num_extensions"
            :istransfer="course?.is_transfer"
            :iswithdraw="false"
          ></course-row-ind-2>
        </div>

        <h2>Other</h2>
        <div v-for="course in others" :key="'other-' + course.course_code">
          <course-row-ind-2
            :progress="(course?.progress ?? 0) * 100"
            :colors="colors"
            :credits="course?.credits"
            :score="getDisplayScore(course)"
            :state="course?.state ?? ''"
            :course-name="course.course_name"
            :course-id="course.canvas_course_id"
            :course-code="course.course_code"
            :user-canvas-id="'' + user.canvas_user_id"
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
    major: {},
    coreCourses: {
      type: Array,
      default: () => []
    },
    electiveCourses: {
      type: Array,
      default: () => []
    },
    otherCourses: {
      type: Array,
      default: () => []
    },
    settings: {}
  },
  computed: {
    core: function () {
      return this.buildMajorCourseList(this.coreCourses);
    },
    electives: function () {
      return this.buildMajorCourseList(this.electiveCourses);
    },
    others: function () {
      const majorOtherCourses = this.buildMajorCourseList(this.otherCourses);
      const majorCourseCodes = new Set(
        [...this.coreCourses, ...this.electiveCourses, ...this.otherCourses]
          .map(course => course.course_code)
      );
      const extraUserCourses = (this.user?.courses || [])
        .filter(course => !majorCourseCodes.has(course.course_code))
        .map(course => this.mergeUserCourseData(course, course.course_code));

      return [...majorOtherCourses, ...extraUserCourses]
        .filter((course, index, courses) => {
          return index === courses.findIndex(other => other.course_code === course.course_code);
        })
        .sort(this.sortByCourseCode);
    }
  },
  data() {
    return {
      colors: bridgetools.colors,
      donut: {},
      treatUngradedAsZero: true,
    }
  },
  mounted() {
    // let entry = new Date();
    let donut = new ProgressGraphDonut();
    this.donut = donut;
  },

  methods: {
    sortByCourseCode(a, b) {
      const ad = String(a.course_code || '').toLowerCase();
      const bd = String(b.course_code || '').toLowerCase();
      return ad.localeCompare(bd);
    },
    buildMajorCourseList(majorCourses) {
      return majorCourses
        .map(course => this.mergeUserCourseData(course, course.course_code))
        .sort(this.sortByCourseCode);
    },
    mergeUserCourseData(course, courseCode) {
      const data = {
        ...course,
        course_code: courseCode,
        course_name: course.course_name || course.name || courseCode
      };
      const userData = this.getUserCourseData(courseCode);

      if (!userData) {
        if (data.time_in_course != null && data.days_in_course == null) {
          data.days_in_course = this.getDaysInCourse(data.time_in_course);
        }
        return data;
      }

      const isActive = userData.is_active ?? false;
      const isTransfer = userData.is_transfer ?? false;

      return {
        ...data,
        ...userData,
        course_name: userData.course_name || userData.name || data.course_name,
        is_active: isActive,
        is_transfer: isTransfer,
        num_extensions: userData.num_extensions,
        canvas_course_id: userData.canvas_course_id,
        progress: userData.progress,
        current_score: userData.current_score,
        final_score: userData.final_score,
        credits_per_day: userData.credits_per_day,
        days_in_course: this.getDaysInCourse(userData.time_in_course),
        state: isTransfer ? 'Transfer' : isActive ? 'Active' : 'Concluded',
      };
    },
    getDaysInCourse(timeInCourse) {
      if (timeInCourse == null) return undefined;
      if (typeof timeInCourse === 'number') return timeInCourse / (60 * 60 * 24);
      if (typeof timeInCourse?.days === 'number') return timeInCourse.days;
      return undefined;
    },
    getDisplayScore(course) {
      let score = this.treatUngradedAsZero ? course?.final_score : course?.current_score;
      return score;
    },
    updateHeader () {
      let donut = this.donut;
      try {
        donut._init('btech-department-report-student-progress-donut', this.colors.gray);
        donut.fillHours( 
          {
            max: 1, 
            hours: 0, 
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
