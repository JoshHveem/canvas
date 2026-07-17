Vue.component('course-row-ind', {
  template:` 
      <div
        style="background-color: rgb(255, 255, 255); display: inline-block; width: 100%; font-size: 0.75rem; padding: .25rem;"
      >
        <div style="display: inline-block; width: 15rem;">
          <a :class="{
              disabled: !checkValidCourseId 
            }" 
            style="text-decoration: none; color: #000000;"
            :href="courseUrl"
            target="_blank">
            {{courseName}} ({{courseCode}})
          </a>
        </div>
        <div style="display: inline-block; width: 4rem; font-size: 1rem;">
          <span class="btech-pill-text" :style="{
              'background-color': gradeBGColor,
              'color': gradeFontColor,
            }">
            {{gradeText}}
          </span>
        </div>
        <!--Change the first 90 under width to the course's hours once figure out how to include that-->
        <course-progress-bar-ind
          :progress='progress'
          :colors='colors'
          :hours='0'
        ></course-progress-bar-ind> 
      </div>
  `,
  props: {
    hours: {
      type: Number,
      default: 0
    },
    progress: {
      type: Number,
      default: 0
    },
    course: {
      type: Object,
      default: () => ({type: 'someType'})
    },
    courseName: {
      type: String,
      default: ''
    },
    courseCode: {
      type: String,
      default: ''
    },
    colors: {
      type: Object,
      default: () => ({type: 'someType'})
    },
    userCanvasId: {
      type: String,
      default: ''
    }
  },
  computed: {
    checkValidCourseId: function() {
      let vm = this;
      if (vm.course === undefined) return false;
      if (vm.course.canvas_id === null || vm.course.canvas_id === undefined) return false;
      return true;
    },
    courseUrl: function() {
      let vm = this;
      if (vm.course === undefined) return '';
      if (vm.course.canvas_id === null || vm.course.canvas_id === undefined) return '';
      return 'https://btech.instructure.com/courses/' + vm.course.canvas_id + '/grades/' + vm.userCanvasId
    },
    enrolled: function() {
      let vm = this;
      if (vm.course === undefined) return false;
      return true;
    },
    gradeBGColor: function() {
      let vm = this;
      if (vm.course.score === undefined) return vm.colors.gray;
      let score = vm.course.score;
      if (score < 60) return vm.colors.red;
      if (score < 80) return vm.colors.yellow;
      return vm.colors.green;

    },
    gradeFontColor: function() {
      let vm = this;
      if (vm.course.score === undefined) return vm.colors.black;
       return vm.colors.white;

    },
    gradeText: function() {
      let vm = this;
      if (vm.course.score === undefined) return "N/A";
      if (vm.course.score === null) return "N/A";
      return vm.course.score + "%"

    }
  },
  data() {
    return {
    }
  },
  mounted() {
    let vm = this;
  },
  methods: {
  },
  destroyed: function () {
  }
});