Vue.component('goal-pill', {
  props: {
    comparator: { type: String, default: 'lt' }, // 'lt' | 'lte' | 'gt' | 'gte' | 'between'
    value:      { type: Number, default: null }, // current metric value
    target:     { type: Number, default: null }, // for lt/lte/gt/gte
    min:        { type: Number, default: null }, // for between
    max:        { type: Number, default: null }, // for between
    label:      { type: String, default: '' },   // Goal text, e.g. "Goal: < 2 days"
  },
  computed: {
    meets() {
      const v = this.value;
      if (v == null) return null;
      switch (this.comparator) {
        case 'lt':  return v <  this.target;
        case 'lte': return v <= this.target;
        case 'gt':  return v >  this.target;
        case 'gte': return v >= this.target;
        case 'between': return v >= this.min && v <= this.max;
        default: return null;
      }
    },
    pillClass() {
      if (this.value == null) return 'btech-pill-muted';
      return this.meets ? 'btech-pill-success' : 'btech-pill-danger';
    }
  },
  template: `
    <span class="btech-pill" :class="pillClass" style="margin-left:6px;">
      {{ label }}
    </span>
  `
});
