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
                'background-color': degree?.average_score ? (Math.round(degree.average_score * 100) < 60 ? colors.red : Math.round(degree.average_score * 100) < 80 ? colors.yellow : colors.green) : colors.gray,
                'color': degree?.average_score ? colors.white : colors.black,
              }">
              {{degree?.average_score ? Math.round(degree.average_score * 100) + '%' : "N/A"}}
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
    </div>
  `,
  props: {
    user: {},
    degree: {},
    settings: {}
  },
  computed: {
    checkValidCourseId: function() {
    },
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
  },
  destroyed: function () {
  }
});