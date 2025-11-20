Vue.component('ind-header-credits-2', {
  template: `
    <div class="btech-ind-header">
      <!-- Donut + avatar -->
      <div class="btech-ind-header__avatar">
        <div
          v-if="user.avatar_url"
          class="btech-ind-header__avatar-img-wrapper">
          <img
            :src="user.avatar_url"
            alt=""
            class="btech-ind-header__avatar-img">
        </div>
        <div
          id="btech-department-report-student-progress-donut-2"
          class="btech-ind-header__donut-svg">
        </div>
      </div>

      <!-- All user data on one (wrappable) line -->
      <div class="btech-ind-header__info">
        <!-- Name / IDs -->
        <a :href="'https://btech.instructure.com/users/' + user.canvas_id"
          target="_blank"
          class="btech-ind-header__name">
          <strong>
            {{ settings.anonymize ? ("Student " + user.canvas_id) : user.name + " (" + user.sis_id + ")" }}
          </strong>
        </a>

        <!-- Probation -->
        <div
          v-if="user?.academic_probation?.probation != undefined"
          :title="user?.academic_probation?.probation == undefined ? 'No current probations' : user?.academic_probation?.probation"
          class="btech-ind-header__icon">
          <icon-alert
            :fill="academicProbationStyle"
            width="1.5rem"
            height="1.5rem">
          </icon-alert>
        </div>

        <!-- Campus -->
        <span class="btech-ind-header__chip">
          {{ degree?.campus }}
        </span>

        <!-- Distance approved -->
        <div
          v-if="user?.distance_approved"
          :title="user.distance_approved ? 'Approved to clock in from a distance.' : 'To get a student distance approved, speak with your AVP.'"
          class="btech-ind-header__icon">
          <icon-distance-approved
            :class="{'distance-approved': user.distance_approved, 'not-distance-approved': !user.distance_approved}"
            width="1.5rem"
            height="1.5rem">
          </icon-distance-approved>
        </div>

        <!-- Last login -->
        <span class="btech-ind-header__label">Last Login</span>
        <span
          class="btech-pill-text btech-ind-header__pill"
          :style="{
            'background-color': calcLastLoginColorBg(user.last_login),
            'color': '#ffffff',
          }">
          {{ dateToString(user.last_login) }}
        </span>

        <!-- Last updated -->
        <span
          class="btech-ind-header__label"
          title="The last time this user's data was updated.">
          Updated
        </span>
        <span
          class="btech-pill-text btech-ind-header__pill"
          :style="{ 'background-color': colors.gray, 'color': '#000000' }">
          {{ dateToString(user?.last_update) }}
        </span>
      </div>

      <div class="btech-ind-header__info">
        <!-- Earned credits -->
        <span class="btech-ind-header__label">Credits Earned</span>
        <span
          class="btech-pill-text btech-ind-header__pill"
          :style="{ 'background-color': colors.blue, 'color': '#ffffff' }">
          {{ Math.round((degree?.graded_hours ?? 0) * 10) / 10 }} / {{ tree.hours }}
        </span>

        <!-- Avg grade -->
        <span class="btech-ind-header__label">Avg. Grade</span>
        <span
          class="btech-pill-text btech-ind-header__pill"
          :style="{
            'background-color': degree?.average_score ? (Math.round(degree.average_score) < 60 ? colors.red : Math.round(degree.average_score) < 80 ? colors.yellow : colors.green) : colors.gray,
            'color': degree?.average_score ? colors.white : colors.black,
          }">
          {{ degree?.average_score ? Math.round(degree.average_score) + '%' : 'N/A' }}
        </span>
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
    academicProbationStyle: function() {
      let prob = this.user?.academic_probation;
      let category = prob?.category ?? 0;
      let code = prob?.code ?? '';
      let colors = this.colors;
      return category == -4 ? (code.includes('2') ? colors.orange : colors.yellow) : (category == -5 ? colors.red : colors.gray);
    }
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
    },
    user: {
      handler (newVal, oldVal) {
        if (!newVal) return;
        console.log(newVal);
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
        donut._init(
          'btech-department-report-student-progress-donut-2',
          this.colors.gray,
          { width: 140, height: 140 }
        );
        donut.fillHours({
          max: this?.tree?.hours ?? 1,
          hours: this?.degree?.graded_hours ?? 0,
          color: this.colors.blue,
        });
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