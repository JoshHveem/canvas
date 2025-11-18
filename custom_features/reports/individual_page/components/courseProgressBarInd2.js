Vue.component('course-progress-bar-ind-2', {
  template:` 
   <div 
    class="btech-course-progress-bar" 
    :style="progressBarBaseStyle"
    style="cursor: help;"
    :title="(whatif === undefined) ? 'Progress Bar' : 'Click to adjust progress for What If calculations.'"
    @click="barClick($event)"
    >
      <div 
        class="btech-course-progress-bar-fill" 
        :style="
          progressBarFillStyle
        "
      >
      </div>
      <div 
        :style="{
          color: (progress > 0 ? colors.white : colors.black)
        }" 
        class="btech-course-progress-bar-text">
        {{Math.round(progress * 10) / 10}}% 
      </div>
    </div> 
  `,
  props:{
    progress: 0,
    colors: {},
    whatif: undefined,
    barwidth: {
      type: Number,
      default: 20 
    },
  },
  computed: {
    progressBarBaseStyle() {
      let vm = this;
      return {
        'background-color': vm.colors.gray,
        'width': (this.barwidth) + 'rem'
      }
    },
    progressBarFillStyle() {
      let progress = Math.round(this.progress * 10) / 10;
      let pstrlen = ('' + progress).length * 0.5 + 1;
      return {
        'background-color': this.getFillColor(),
        'width': ((this.progress == 0) ? 0 : (this.progress * 0.01 * this.barwidth  > pstrlen) ? this.progress + '%' : pstrlen + 'rem')
      }
    }
  },
  data() {
    return {
    }
  },
  mounted() {
  },
  methods: {
    barClick(e) {
      var rect = e.target.getBoundingClientRect();
      var x = e.clientX - rect.left; //x position within the element.
      var perc = x / rect.width;
      let progress = Math.ceil((perc * 100) / 25) * 25;
      if (progress == this.progress) progress = Math.round((perc * 100) / 25) * 25;
      this.$emit('togglecourseprogress', progress);
    },

    getFillColor() {
      let vm = this;
      let progress = vm.progress;
      let start = new Date(); //include start date
      if (progress >= 100) return this.whatif ? vm.colors.purple : vm.colors.blue;

      return this.whatif ? vm.colors.darkPurple : vm.colors.cyan;
    },
  },
  destroyed: function () {
  }
});