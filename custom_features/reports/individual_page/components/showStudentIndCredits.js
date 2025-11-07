Vue.component('show-student-ind-credits', {
  template: ` 
    <div>
      <!--STUDENT INFORMATION-->
      <div 
        v-if="whatif"
        style="float: right; display: inline-block; width: 5rem;"
        @click="whatif = false; resetUser(); resetOverride();"
      >
        <span 
          class="btech-pill-text button" 
          :style="{
            'background-color': (whatif) ? colors.purple: colors.gray,
            'color': (whatif) ? colors.white: colors.black,
          }"
        >Reset</span>
      </div>
      <ind-header-credits
        :colors="colors"
        :user="user"
        :settings="settings"
        :student-tree="studentTree"
        :whatif="whatif"
        :whatifdata="user.whatif"
        ref="studentdataheader"
      ></ind-header-credits>

      <!--COURSE TREE-->
      <div>
        <h1>
          {{studentTree.name}} ({{studentTree.dept_code}} {{studentTree.year}})
        </h1>

        <!--CORE & ELECTIVE COURSES-->
        <div 
          style="padding-top: 0.25rem; padding-bottom: 0.25rem;"
          v-for="(courses, courseType) in studentTree.courses"
        >
          <span v-if="Object.keys(studentTree.courses[courseType]).length > 0"><strong>{{courseType.toUpperCase()}}</strong></span>
          <div v-for="(course, courseCode) in courses">
            <course-row-ind
              :progress="getUserCourseProgress(courseCode)"
              :colors="colors"
              :credits="course.credits"
              :course="user.courses[courseCode]"
              :course-name="course.name"
              :course-code="courseCode"
              :user-canvas-id="'' + user.canvas_id"
              :include-hours="(!whatif && user?.include_hours?.includes(courseCode)) || (whatif && override?.[courseCode]?.include)"
              :istransfer="user?.transfer_courses?.includes(courseCode)"
              :override="override?.[courseCode]"
              :whatif="whatif"
              @togglecourseinclude="updateOverrideInclude"
              @togglecourseprogress="updateOverrideProgress"
            ></course-row-ind>
          </div>
        </div>

        <!--OTHER COURSES-->
        <div 
          style="padding-top: 0.25rem; padding-bottom: 0.25rem;"
        >
          <span><strong>OTHER</strong></span>
          <div v-for="course in user.treeCourses.other">
            <course-row-ind
              v-if="(user.courses[course.code].enabled || (user.courses[course.code].state==='active' || user.courses[course.code].state==='completed'))"
              :progress="getUserCourseProgress(course.code)"
              :colors="colors"
              :whatif="whatif"
              :credits="course.credits"
              :course="user.courses[course.code]"
              :course-name="user.courses[course.code].name"
              :course-code="course.code"
              :user-canvas-id="'' + user.canvas_id"
              :include-hours="user?.include_hours?.includes(course.code)"
              :istransfer="user?.transfer_courses?.includes(course.code)"
            ></course-row-ind>
          </div>
        </div>
      </div>
    </div>
  `,
  props: {
    colors: {
      type: Object,
      default: () => ({})
    },
    scroll: {
      type: Boolean,
      default: false 
    },
    settings: {
      type: Object,
      default: () => ({})
    },
    user: {
      type: Object,
      default: () => ({})
    },
    studentTree: {
      type: Object,
      default: () => ({
        type: 'someType'
      })
    }
  },
  computed: {},
  data() {
    return {
      whatif: false,
      MONTH_NAMES_SHORT: ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"],
      donut: {},
      override: {
      }
    }
  },
  mounted() {
    this.resetUser();
    this.resetOverride();

    if (isNaN(this.user.completed_hours)) this.user.completed_hours = 0;
    
    if (this.scroll) {
      this.scrollTop = $(window).scrollTop();
      $(window).scrollTop(0);
    }
  },

  methods: {
    printReport() {
      print();
    },

    resetUser() {
      this.user = bridgetools.processUserData(this.user, this.studentTree); 
      this.$refs.studentdataheader.updateHeader();
    },

    resetOverride() {
      let courses = this.user.courses;
      for (let courseCode in courses) {
        let course = courses[courseCode];
        this.override[courseCode] = {
          include: this.user.include_hours.includes(courseCode),
          progress: course.progress 
        }
      }
      this.updateOverride();
      this.$emit('goal', undefined);
    },

    updateOverrideProgress(courseCode, progress) {
      if (!this.whatif) this.whatif = true;
      if (this.override?.[courseCode] == undefined) {
        this.override[courseCode] = {
          include: true,
          progress: progress
        }
        this.user.courses[courseCode] = {
          progress: 0,
          score: "N/A",
        }
      }
      this.override[courseCode].progress = progress;
      this.override[courseCode].include = true;
      this.updateOverride();
    },

    updateOverrideInclude(courseCode) {
      if (!this.whatif) this.whatif = true;
      if (this.override?.[courseCode] == undefined) {
        this.override[courseCode] = {
          include: true,
          progress: 0
        }
      }
      this.override[courseCode].include = !this.override[courseCode].include;
        this.updateOverride();
    },

    updateOverride() {
      this.user = bridgetools.processUserData(this.user, this.studentTree, this.override);
      this.$nextTick(() => {
        this.$refs.studentdataheader.updateHeader();
      });
      this.$emit('goal', this.override);
    },
    
    getUserCourseProgress(courseCode) {
      if (this.whatif) {
        return this.override?.[courseCode]?.progress ?? this.user?.courses?.[courseCode]?.progress ?? 0
      }
        return this.user?.courses?.[courseCode]?.progress ?? 0
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

  destroyed: function () {}
});