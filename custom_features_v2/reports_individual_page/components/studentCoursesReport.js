Vue.component('student-courses-report', {
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
          <course-row-ind
            :progress="course.progress * 100"
            :colors="colors"
            :credits="course.credits"
            :score="getDisplayScore(course)"
            :state="course.state"
            :course-name="course.course_name"
            :course-id="course.canvas_course_id"
            :course-code="course.course_code"
            :user-canvas-id="'' + user.canvas_user_id"
            :extensions="course.num_extensions"
            :istransfer="course.is_transfer"
            :iswithdraw="false"
          ></course-row-ind>
        </div>

        <h2>Electives</h2>
        <div v-for="course in electives" :key="'elective-' + course.course_code">
          <course-row-ind
            :progress="course.progress * 100"
            :colors="colors"
            :credits="course.credits"
            :score="getDisplayScore(course)"
            :state="course.state"
            :course-name="course.course_name"
            :course-id="course.canvas_course_id"
            :course-code="course.course_code"
            :user-canvas-id="'' + user.canvas_user_id"
            :extensions="course.num_extensions"
            :istransfer="course.is_transfer"
            :iswithdraw="false"
          ></course-row-ind>
        </div>

        <h2>Other</h2>
        <div v-for="course in others" :key="'other-' + course.course_code">
          <course-row-ind
            :progress="course.progress * 100"
            :colors="colors"
            :credits="course.credits"
            :score="getDisplayScore(course)"
            :state="course.state"
            :course-name="course.course_name"
            :course-id="course.canvas_course_id"
            :course-code="course.course_code"
            :user-canvas-id="'' + user.canvas_user_id"
            :extensions="course.num_extensions"
            :istransfer="false"
            :iswithdraw="false"
          ></course-row-ind>
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
    userCoursesByCode() {
      return this.user.courses.reduce((map, course) => {
        map[course.course_code] = course;
        return map;
      }, {});
    },
    majorCourseCodes() {
      return new Set(
        [...this.coreCourses, ...this.electiveCourses, ...this.otherCourses]
          .map(course => course.course_code)
      );
    },
    core: function () {
      return this.normalizeCourseList(this.coreCourses);
    },
    electives: function () {
      return this.normalizeCourseList(this.electiveCourses);
    },
    others: function () {
      const majorOtherCourses = this.normalizeCourseList(this.otherCourses);
      const extraUserCourses = this.user.courses
        .filter(course => !this.majorCourseCodes.has(course.course_code))
        .map(course => this.normalizeCourse(course));

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
      treatUngradedAsZero: true,
    }
  },
  methods: {
    sortByCourseCode(a, b) {
      const ad = String(a.course_code || '').toLowerCase();
      const bd = String(b.course_code || '').toLowerCase();
      return ad.localeCompare(bd);
    },
    normalizeCourseList(courses) {
      return courses.map(course => this.normalizeCourse(course)).sort(this.sortByCourseCode);
    },
    normalizeCourse(course) {
      const courseCode = course.course_code;
      const userData = this.userCoursesByCode[courseCode];
      const data = {
        ...course,
        course_code: courseCode,
        course_name: course.course_name
      };

      if (!userData) {
        if (data.time_in_course != null && data.days_in_course == null) {
          data.days_in_course = this.toDaysInCourse(data.time_in_course);
        }
        data.progress = 0;
        data.state = '';
        data.is_transfer = false;
        return data;
      }

      const isActive = userData.is_active;
      const isTransfer = userData.is_transfer;

      return {
        ...data,
        ...userData,
        course_name: userData.course_name,
        is_active: isActive,
        is_transfer: isTransfer,
        num_extensions: userData.num_extensions,
        canvas_course_id: userData.canvas_course_id,
        progress: userData.progress,
        current_score: userData.current_score,
        final_score: userData.final_score,
        credits_per_day: userData.credits_per_day,
        days_in_course: this.toDaysInCourse(userData.time_in_course),
        state: isTransfer ? 'Transfer' : isActive ? 'Active' : 'Concluded',
      };
    },
    toDaysInCourse(timeInCourse) {
      if (timeInCourse == null) return undefined;
      if (typeof timeInCourse === 'number') return timeInCourse / (60 * 60 * 24);
      return timeInCourse.days;
    },
    getDisplayScore(course) {
      let score = this.treatUngradedAsZero ? course.final_score : course.current_score;
      return score;
    },
  },
  destroyed: function () {
  }
});
