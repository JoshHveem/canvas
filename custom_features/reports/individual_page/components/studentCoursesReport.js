Vue.component('student-courses-report', {
  template:` 
    <div>
      <div style="margin-bottom: 2rem;">
        <div class="btech-user-name" style="margin-bottom: .25rem;">
          <div style="display: inline-block; padding-right: .5rem; font-size: 1rem;">
            <a :href="'https://btech.instructure.com/users/' + user.canvas_id"
              target="_blank">
              <strong>{{settings.anonymize ? ("Student " + user.canvas_id) : user.name + " (" + user.sis_id + ")"}}</strong>
            </a>
          </div>
          <div
            v-if="user?.academic_probation?.probation != undefined"
            :title="user?.academic_probation?.probation == undefined ? 'No current probations' : user?.academic_probation?.probation" 
            style="cursor: help; display: inline-block; padding-right: .5rem; vertical-align: middle;"
          >
            <icon-alert 
              :fill="user?.academic_probation?.category == -4 ? (user.academic_probation.code.includes('2') ? colors.orange : colors.yellow) : (user?.academic_probation?.category == -5 ? colors.red : colors.gray)" 
              width="1.5rem" 
              height="1.5rem"
            ></icon-alert>
          </div>
          <div
            v-if=" user?.distance_approved"
            :title="user.distance_approved ? 'Approved to clock in from a distance.' : 'To get a student distance approved, speak with your AVP.'" 
            style="cursor: help; display: inline-block; padding-right: .5rem; vertical-align: middle;"
          >
            <icon-distance-approved :class="{'distance-approved': user.distance_approved, 'not-distance-approved': !user.distance_approved}" width="1.5rem" height="1.5rem"></icon-distance-approved>
          </div>
          <span>
            Avg. Grade
          </span>
          <div style="display: inline-block; width: 3rem; font-size: 1rem;">
            <span 
              class="btech-pill-text" :style="{
                'background-color': degree?.average_score ? (Math.round(degree.average_score) < 60 ? colors.red : Math.round(degree.average_score) < 80 ? colors.yellow : colors.green) : colors.gray,
                'color': degree?.average_score ? colors.white : colors.black,
              }">
              {{degree?.average_score ? Math.round(degree.average_score) + '%' : "N/A"}}
            </span>
          </div>
          <div 
            title="The last time this user's data was updated."
            style="float: right; display: inline-block; width: 10rem; font-size: 1rem; cursor: help;">
            <div style="display: inline-block; width: 3rem; font-size: 1rem;">
              <span 
                class="btech-pill-text" 
                :style="{
                  'background-color': colors.gray,
                  'color': '#000000',
                }"
              >
                {{dateToString(user?.last_update)}}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div 
        class="btech-department-report-student-hours"
      >
        <div style="height: 200px; width: 200px;" class="btech-department-report-student-avatar">
          <img style="position: absolute;" v-if="user.avatar_url !== undefined" :src="user.avatar_url">
        </div>
        <div style="display: inline-block;">
          <div class="data-item">
            <span class="data-item-title">
              Certificate Credits 
            </span>
            <div style="display: inline-block; width: 4rem; font-size: 1rem;">
              <span class="btech-pill-text" :style="{
                  'background-color': colors.gray,
                  'color': '#000000',
                }">
                {{tree.hours}}
              </span>
            </div>
          </div>
          <div class="data-item">
            <span class="data-item-title">
              Earned Credits 
            </span>
            <div style="display: inline-block; width: 6rem; font-size: 1rem;">
              <span 
                class="btech-pill-text" 
                :style="{
                  'background-color': colors.blue,
                  'color': '#ffffff',
                }">
                {{ Math.round((degree?.graded_hours ?? 0) * 10) / 10 }}
              </span>
            </div>
          </div>
        </div>
        <div>
          <div 
            style="cursor: help;"
            title="The student's program start date."
            class="data-item">
            <span style="display: inline-block; width: 12rem;">Start Date</span>
            <span 
              v-if="degree?.entry_date"
              class="btech-pill-text" :style="{
              'background-color': colors.gray,
              'color': colors.black,
            }">
              {{dateToString(degree?.entry_date ?? '')}}
            </span>
          </div>
          <div 
            style="cursor: help;"
            title="The last time the student logged into Canvas."
            class="data-item">
            <span style="display: inline-block; width: 12rem;">
              Last Login   
            </span>
            <span class="btech-pill-text" :style="{
                'background-color': calcLastLoginColorBg(user.last_login),
                'color': '#ffffff',
              }">
              {{dateToString(user.last_login)}}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  props: {
    user: {},
    degree: {},
    tree: {},
    settings: {}
  },
  computed: {
    courses: function () {
      console.log(this.tree);
      return degree.courses;
    }
  },
  data() {
    return {
      colors: bridgetools.colors
    }
  },
  mounted() {
      // let entry = new Date();
  },
  methods: {
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
  },
  destroyed: function () {
  }
});