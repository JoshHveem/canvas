Vue.component('reports-department-ocupations', {
  template: `
    <div>
      <department-cpl-placement
        v-for="campus in cpl"
        :key="campus._id || (campus.campus + '::' + campus.program_name)"
        :cpl="campus"
        :year="year"
      />

      <department-occupations
        :occupations="occupations"
        :year="year"
      />
    </div>
  `,
  props: {
    year: { type: [Number, String], required: true },
    cpl: { type: Array, default: () => [] },
    occupations: { type: Array, default: () => [] },
    statistics: { type: [Array, Object], default: () => ({}) }, // optional if you need it later
  },
});
