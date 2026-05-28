(async function() {
  Vue.component('course-content', {
    template: ` 
      <div style="padding: 8px 0;">
        <h2>{{ type }}</h2>
        <div v-for="(count, name) in filteredCounts" :key="name">
          <span style="font-size: 0.75rem; width: 8rem; display: inline-block;">{{ toTitleCase(name) }}</span>
          <span>{{ calcEmoji(count / counts.num_reviews) }}</span>
        </div>
      </div>
    `,
    props: {
      type: {
        type: String,
        default: '' 
      },
      reviews: {
        type: Object,
        default: () => ({})
      },
      criteria: {
        type: Object,
        default: () => ({})
      },
      calcCounts: {
        type: Function,
        required: true
      }
    },
    computed: {
      activeCriteria() {
        let criteria = {};
        for (const [criterionName, criterion] of Object.entries(this.criteria)) {
          if (criterion.active) {
            criteria[criterionName] = criterion;
          }
        }
        return criteria;
      },
      counts() {
        return this.calcCounts(this.reviews, this.criteria);
      },
      filteredCounts() {
        // Create a filtered and sorted object that excludes 'num_reviews'
        return Object.fromEntries(
          Object.entries(this.counts)
            .filter(([key]) => key !== 'num_reviews')
            .sort(([a], [b]) => a.localeCompare(b))
        );
      }
    }
  });
})();
