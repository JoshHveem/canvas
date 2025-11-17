Vue.component('ind-header-credits', {
  template: `
  <div class="btech-ind-header">
  <!-- Top row: name / meta / last-updated -->
  <div class="btech-ind-header__top">
    <div class="btech-ind-header__name-meta">
      <!-- Name -->
      <a :href="'https://btech.instructure.com/users/' + user.canvas_id"
         target="_blank"
         class="btech-ind-header__name">
        <strong>
          {{ settings.anonymize ? ("Student " + user.canvas_id) : user.name + " (" + user.sis_id + ")" }}
        </strong>
      </a>

      <!-- Probation icon -->
      <div
        v-if="user?.academic_probation?.probation != undefined"
        :title="user?.academic_probation?.probation == undefined ? 'No current probations' : user?.academic_probation?.probation"
        class="btech-ind-header__icon"
      >
        <icon-alert
          :fill="user?.academic_probation?.category == -4 ? (user.academic_probation.code.includes('2') ? colors.orange : colors.yellow) : (user?.academic_probation?.category == -5 ? colors.red : colors.gray)"
          width="1.5rem"
          height="1.5rem"
        ></icon-alert>
      </div>

      <!-- Campus -->
      <span class="btech-ind-header__pill-text">
        {{ degree?.campus }}
      </span>

      <!-- Distance approved -->
      <div
        v-if="user?.distance_approved"
        :title="user.distance_approved ? 'Approved to clock in from a distance.' : 'To get a student distance approved, speak with your AVP.'"
        class="btech-ind-header__icon"
      >
        <icon-distance-approved
          :class="{'distance-approved': user.distance_approved, 'not-distance-approved': !user.distance_approved}"
          width="1.5rem"
          height="1.5rem"
        ></icon-distance-approved>
      </div>

      <!-- Avg grade -->
      <span>Avg. Grade</span>
      <span class="btech-pill-text btech-ind-header__pill"
            :style="{
              'background-color': degree?.average_score ? (Math.round(degree.average_score) < 60 ? colors.red : Math.round(degree.average_score) < 80 ? colors.yellow : colors.green) : colors.gray,
              'color': degree?.average_score ? colors.white : colors.black,
            }">
        {{ degree?.average_score ? Math.round(degree.average_score) + '%' : 'N/A' }}
      </span>
    </div>

    <!-- Last data update -->
    <div class="btech-ind-header__last-updated"
         title="The last time this user's data was updated.">
      <span class="btech-pill-text"
            :style="{ 'background-color': colors.gray, 'color': '#000000' }">
        {{ dateToString(user?.last_update) }}
      </span>
    </div>
  </div>

  <!-- Bottom row: donut + metrics -->
  <div class="btech-ind-header__bottom">
    <!-- Donut/avatar -->
    <div class="btech-ind-header__avatar btech-student-avatar">
      <img v-if="user.avatar_url !== undefined" :src="user.avatar_url">
      <div id="btech-department-report-student-progress-donut"></div>
    </div>

    <!-- 2×2 metrics grid -->
    <div class="btech-ind-header__metrics">
      <div class="btech-data-item">
        <span class="btech-data-item-title">Certificate Credits</span>
        <span class="btech-pill-text"
              :style="{ 'background-color': colors.gray, 'color': '#000000' }">
          {{ tree.hours }}
        </span>
      </div>

      <div class="btech-data-item">
        <span class="btech-data-item-title">Earned Credits</span>
        <span class="btech-pill-text"
              :style="{ 'background-color': colors.blue, 'color': '#ffffff' }">
          {{ Math.round((degree?.graded_hours ?? 0) * 10) / 10 }}
        </span>
      </div>

      <div class="btech-data-item"
           title="The student's program start date.">
        <span class="btech-data-item-title">Start Date</span>
        <span v-if="degree?.entry_date"
              class="btech-pill-text"
              :style="{ 'background-color': colors.gray, 'color': colors.black }">
          {{ dateToString(degree?.entry_date ?? '') }}
        </span>
      </div>

      <div class="btech-data-item"
           title="The last time the student logged into Canvas.">
        <span class="btech-data-item-title">Last Login</span>
        <span class="btech-pill-text"
              :style="{
                'background-color': calcLastLoginColorBg(user.last_login),
                'color': '#ffffff',
              }">
          {{ dateToString(user.last_login) }}
        </span>
      </div>
    </div>
  </div>
</div>

  `,
  props: {
    colors: {
      type: Object,
      default: () => ({})
    },
    user: {
      type: Object,
      default: () => ({})
    },
    degree: {
      type: Object,
      default: () => ({})
    },
    tree: {
      type: Object,
      default: () => ({})
    },
    settings: {
      type: Object,
      default: () => ({})
    },
    updateinc: Number
  },
  computed: {
  },
  watch: {
    tree: {
      handler (newVal, oldVal) {
        if (!newVal) return;
        // make sure DOM is updated before touching the donut, just in case
        this.$nextTick(() => {
          this.updateHeader();
        });
      },
      deep: true,     // needed if the parent mutates properties inside `tree`
      immediate: true // optional: also run once on component creation
    }
  },
  data() {
    return {
      avatarHover: false,
      donut: {}
    }
  },
  mounted() {
    let donut = new ProgressGraphDonut();
    this.donut = donut;
  },
  methods: {
    updateHeader () {
      let donut = this.donut;
      try {
        donut._init('btech-department-report-student-progress-donut', this.colors.gray);
        donut.fillHours( 
          {
            max: this?.tree?.hours ?? 1, 
            hours: this?.degree?.graded_hours ?? 0, 
            color: this.colors.blue, 
          }
        );
      } catch (err) {
        console.error(err);
      }
    },

    calcLastLoginColorBg(date) {
      let app = this;
      if (typeof date == 'string') {
        if (date == "") return app.colors.red;
        date = new Date(date);
      }
      let now = new Date();
      let diff = now - date;
      let days = diff / (1000 * 3600 * 24);
      if (days >= 7) return app.colors.red;
      if (days >= 5) return app.colors.yellow;
      return app.colors.green;
    },

    dateToString(date) {
      if (typeof date == 'string') {
        if (date == "" || date == "N/A") return "N/A";
        date = new Date(date);
      }
      if (date == null) return "N/A";
      let year = date.getFullYear();
      let month = (1 + date.getMonth()).toString().padStart(2, '0');
      let day = date.getDate().toString().padStart(2, '0');

      return month + '/' + day + '/' + year;
    },

  }
})