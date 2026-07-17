Vue.component('course-progress-bar-ind', {
  template:` 
   <div class="btech-course-progress-bar" style="width: 20rem;" :style="progressBarBaseStyle">
      <div 
        class="btech-course-progress-bar-fill" 
        :style="
          progressBarFillStyle
        ">
      </div>
      <div style="color: #000000" class="btech-course-progress-bar-text">
        {{Math.round(progress * 10) / 10}}% 
        <span
          v-if="hours!==0 && !isNaN(hours)">
          ({{Math.round((hours * progress) / 100)}}/{{hours}} HRS)
        </span>
      </div>
    </div> 
  `,
  props: [
    'progress',
    'hours',
    'colors'
  ],
  computed: {
    progressBarBaseStyle() {
      let vm = this;
      return {
        'background-color': vm.colors.gray,
        'width': ((90 / 90) * 20) + 'rem'
      }
    },
    progressBarFillStyle() {
      let vm = this;
      return {
        'background-color': vm.getFillColor(),
        'width': vm.progress + '%'
      }
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
    getFillColor() {
      let vm = this;
      let progress = vm.progress;
      let start = new Date(); //include start date
      if (progress >= 100) return vm.colors.complete;

      let diffDays = Math.floor((new Date() - new Date(start)) / (1000 * 60 * 60 * 24));
      if (diffDays <= 90) return vm.colors.green;
      if (diffDays <= 180) return vm.colors.yellow;
      return vm.colors.red; //red
    },
  },
  destroyed: function () {
  }
});