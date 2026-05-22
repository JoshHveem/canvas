Vue.component('reports-department-coe', {
  template: `
    <div>
      <!-- Could show a loading indicator if you like -->
      <department-cpl
        v-for="campus in cpl"
        :cpl="campus"
        :year="year"
      />
      <department-coe
        :coe-list="coe"
        :year="year"
      />
    </div>
  `,
  props: {
    year: { type: [Number, String], required: true },
    cpl: { type: Object, required: true },
    coe: { type: Object, required: true },
  },
  data() {
    return {
      loading: false,
    }
  },
  async mounted() {
  },
  methods: {
  },
});
