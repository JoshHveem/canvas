Vue.component('course-row-ind', {
  template:` 
      <div
        style="background-color: rgb(255, 255, 255); display: inline-block; width: 100%; box-sizing: border-box; font-size: 0.75rem; padding: .25rem;"
      >
        <div style="display: inline-block; width: 20rem;">
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
          <span 
            class="btech-pill-text" 
            v-show="score !== undefined"
            :style="{
              'background-color': gradeBGColor,
              'color': colors.white,
            }">
            {{gradeText}}
          </span>
        </div>
        <div style="display: inline-block; width: 4rem; font-size: 1rem;">
          <span 
            v-show="credits"
            class="btech-pill-text" 
            :title="(istransfer ? 'Transfer Course' : 'Course Credits')"
            :style="{
              'cursor': 'help',
              'background-color': (progress == 0 && state == 'completed') ? colors.gray : (istransfer ? colors.orange : colors.blue),
              'color': (progress == 0 && state == 'completed') ? colors.black : colors.white,
            }">
            {{hours ? hours + ' hrs' : credits + ' crdts'}}
          </span>
        </div>
        <course-progress-bar-ind
          :progress="progress"
          :colors="colors"
          :whatif="whatif"
        ></course-progress-bar-ind> 
        <div style="display: inline-block; width: 5rem; font-size: 1rem;">
          <span
            class="btech-pill-text"
            :style="{
              'background-color': colors.gray,
              'color': colors.black
            }"
          >
            {{state}}
          </span>
        </div>
        <span
          v-if="course?.is_withdraw"
          class="btech-pill-text"
          :style="{
            'background-color': colors.gray,
            'color': colors.black
          }"
        >Withdrawn</span>
        <span
          v-else-if="daysEnrolled > 0 && state !== 'completed'"
          class="btech-pill-text"
          :style="{
            'background-color': colors.gray,
            'color': colors.black
          }"
        >{{daysEnrolled}} Day(s) Enrolled</span>
      </div>
      </div>
  `,
  props: {
    hours: {
      type: Number,
      default: undefined
    },
    credits: {
      type: Number,
      default: 0
    },
    progress: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: undefined 
    },
    state: {
      type: String,
      default: '' 
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
      default: () => ({})
    },
    override: {
      type: Object,
      default: () => ({})
    },
    userCanvasId: {
      type: String,
      default: ''
    },
    whatif: false,
    includeHours: false,
    istransfer: false
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
      if (vm.score === undefined) return vm.colors.gray;
      let score = vm.score;
      if (isNaN(score)) {
        //handle letter grades
        if (score[0] == 'A') return vm.colors.green;
        if (score[0] == 'P') return vm.colors.green;
        if (score[0] == 'B') return vm.colors.green;
        if (score[0] == 'C') return vm.colors.yellow;
        if (score[0] == 'D') return vm.colors.yellow;
        if (score[0] == 'F') return vm.colors.red;
        return vm.colors.gray;
      } else {
        //numeric grades
        if (score < 60) return vm.colors.red;
        if (score < 80) return vm.colors.yellow;

      }
      return vm.colors.green;

    },
    gradeText: function() {
      let vm = this;
      if (vm.score === undefined) return "N/A";
      if (vm.score === null) return "N/A";
      if (isNaN(vm.score)) return vm.score;
      return vm.score + "%"

    },
    daysEnrolled: function() {
      if (!this.includeHours || this.progress >= 100) return 0;
      let diffDays = 0;
      if (this?.course?.start != undefined) {
        diffDays = Math.floor((new Date() - new Date(this.course.start)) / (1000 * 60 * 60 * 24));
      }
      return diffDays;
    }
  },
  data() {
    return {
    }
  },
  mounted() {
    // let entry = new Date();
  },
  methods: {
  },
  destroyed: function () {
  }
});