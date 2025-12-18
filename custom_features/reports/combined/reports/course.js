//courses-overview.js
Vue.component('reports-courses-overview', {
  props: {
    account:   { type: [Number, String], required: true },   // same as your master report
    year:      { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },
    course: {type: Object, required: true}
  },

  data() {
    const colors = (window.bridgetools?.colors) || { red:'#b20b0f', orange:'#f59e0b', yellow:'#eab308', green:'#16a34a', gray:'#e5e7eb', black:'#111827', white:'#fff' };
    
    return {
      colors: colors,
      loading: false,
    };
  },
  created() {
    
  },

  computed: {
    
  },

  methods: {
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    {{course}} 
  </div>
`
});
