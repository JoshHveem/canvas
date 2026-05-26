(async function() {
  Vue.component('settings', {
    template: ` 
      <div 
        class="btech-course-evaluator-content-box"
    >
        <div>
            <div>
                <label>
                    <input type="checkbox" v-model="settings.show_scores" @change="updateSettings" />
                    Show Scores 
                </label>
            </div>
        </div>
      </div>
    `,
    data: function() {
      return {
        settings: {}
      };
    },
    mounted() {
      // Initialize settings with the global courseReviewerSettings
      this.settings = { ...courseReviewerSettings };
    },
    methods: {
      updateSettings() {
        // Toggle the hide setting and update the global courseReviewerSettings
        courseReviewerSettings = this.settings;
        updateCourseReviewerSettings(courseReviewerSettings);
      },
      removeLoadingElement(menuName) {
        let index = this.loadingMenus.indexOf(menuName);
        this.loadingMenus.splice(index, 1);
      }
    }
  });
})();
