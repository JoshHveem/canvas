Vue.component('show-student-hours', {
  template: ` 
    <div>
      <!--HEADER-->
      <ind-header-credits
        :colors="colors"
        :user="user"
        :settings="settings"
        :student-tree="studentTree"
        ref="studentdataheader"
      ></ind-header-credits>

      <!--CONTRACTED HOURS-->
      <div 
        class="btech-department-report-student-contracted-hours"
        style="margin-block-end: 2rem;" 
      >
        <h2>Contracted Hours</h2>
        <div>
          <div
            class="hours-table-header"
          >
            <div
              v-for="day in DAYS_NAMES_SHORT"
              style="
                text-align: center;
                display: inline-block;
                width: 3rem;"
            >
              {{day}} 
            </div>
          </div>

          <div>
            <div
              v-for="day in DAYS_NAMES"
              style="
                text-align: center;
                display: inline-block;
                width: 3rem;"
            >
              <span class="btech-pill-text" :style="{
                'background-color': colors.cyan,
                'color': 'white',
              }">
                {{user?.contracted_hours?.[day] ?? 0}} hrs
              </span>
            </div>
            <div
              style="
                display: inline-block;
                width: 3rem;"
            >
              <span class="btech-pill-text" :style="{
                'background-color': colors.cyan,
                'color': 'white',
              }">
                {{Object.values(user.contracted_hours).reduce((a,b) => a + b)}} hrs
              </span>
            </div>
          </div>

        </div>
      </div>

      <!--ENROLLED / ATTENDED HOURS REPORT-->
      <div class="btech-department-report-student-clock-hours">
        <h2>Attended Hours</h2>
        <div>
          <span 
            class="btech-pill-text" 
            style="
              float: right;
              cursor: pointer;
              user-select: none;
              "
            @click="expandedReport=!expandedReport"
            :style="{
              'background-color': colors.black,
              'color': '#ffffff',
            }">
            <span v-if="expandedReport">
              View Simple Report
            </span>
            <span v-else>
              View Expanded Report
            </span>
          </span>
          <span 
            v-if="manualHoursPerc && settings.individualReport.attendanceCutoffs.show === false"
            class="btech-pill-text" 
            style="
              margin-right: .5rem;
              float: right;
              cursor: pointer;
              user-select: none;
              "
            @click="settings.individualReport.attendanceCutoffs.show = true"
            :style="{
              'background-color': colors.black,
              'color': '#ffffff',
            }">
            <span>
              Show Percentage 
            </span>
          </span>
        </div>


        <!--MINIMIZED REPORT-->
        <div v-if="!expandedReport" class="btech-department-report-student-clock-hours-min">
          <div>
            <div
              class="hours-table-header"
            >
              <div
                style="
                  display: inline-block;
                  width: 3rem;"
              >
               Year 
              </div>
              <div
                style="
                  display: inline-block;
                  width: 3rem;"
              >
                Month
              </div>
              <div
                style="
                  display: inline-block;
                  width: 5rem;"
              >
                SAP 
              </div>
              <div
                style="
                  display: inline-block;
                  width: 5rem;"
              >
                Attended 
              </div>
              <div
                style="
                  display: inline-block;
                  width: 5rem;"
              >
                Enrolled 
              </div>
            </div>
            <div 
              v-for="date in hours"
              style="height: 1.5rem;">
              <div
                style="
                  display: inline-block;
                  width: 3rem;"
              >
                <span class="btech-pill-text" :style="{
                  'background-color': colors.gray,
                  'color': '#000000',
                }">
                  {{date.year}}
                </span>
              </div>
              <div
                style="
                  display: inline-block;
                  width: 3rem;"
              >
                <span class="btech-pill-text" :style="{
                  'background-color': colors.gray,
                  'color': '#000000',
                }">
                  {{MONTH_NAMES_SHORT[date.month - 1]}} 
                </span>
              </div>
              <div
                style="
                  display: inline-block;
                  width: 5rem;"
              >
                <span 
                  class="btech-pill-text" 
                  :style="{
                  'background-color': (user?.sap_history?.[date.year]?.[date.month]) ? (user?.sap_history?.[date.year]?.[date.month] <= 100 ? colors.green : (user?.sap_history?.[date.year]?.[date.month] < 150) ? colors.yellow : colors.red) : colors.gray,
                  'color': (user?.sap_history?.[date.year]?.[date.month]) ? colors.white : colors.black
                }">
                  {{user?.sap_history?.[date.year]?.[date.month] ? user?.sap_history?.[date.year]?.[date.month] + "%" : "N/A"}} 
                </span>
              </div>
              <div
                style="
                  display: inline-block;
                  width: 5rem;"
              >
                <span class="btech-pill-text" :style="{
                  'background-color': colors.blue,
                  'color': '#ffffff',
                }">
                  {{user.clock_hours[date.year][date.month].hours_attended}} hrs
                </span>
              </div>
              <div
                style="
                  display: inline-block;
                  width: 5rem;"
              >
                <span class="btech-pill-text" :style="{
                  'background-color': colors.cyan,
                  'color': '#ffffff',
                }">
                  {{user.clock_hours[date.year][date.month].hours_enrolled}} hrs
                </span>
              </div>
              <div
                style="
                  display: inline-block;
                  width: 5rem;"
              >
                <span 
                  v-if="user.clock_hours[date.year][date.month].hours_enrolled > 0 && settings.individualReport.attendanceCutoffs.show"
                  class="btech-pill-text" 
                  :style="{
                    'background-color': calcHoursAttendedColor(user.clock_hours[date.year][date.month]),
                    'color': '#ffffff',
                  }">
                  {{Math.round((user.clock_hours[date.year][date.month].hours_attended / user.clock_hours[date.year][date.month].hours_enrolled) * 100)}}% 
                </span>
              </div>
            </div>

            </div>
          </div>
        </div>

        <!--EXPANDED REPORT-->
        <div v-if="expandedReport" class="btech-department-report-student-clock-hours-full">

          <!--TOTAL-->
          <div
            style="margin-bottom: 1rem;"
          >
            <div
              class="hours-table-header"
            >
              <div
                style="
                  display: inline-block;
                  width: 3rem;"
              >
              </div>
              <div
                style="
                  display: inline-block;
                  width: 3rem;"
              >
              </div>
              <div
                style="
                  display: inline-block;
                  width: 5rem;"
              >
              </div>
              <div
                style="
                  display: inline-block;
                  width: 5rem;"
              >
                Attended 
              </div>
              <div
                style="
                  display: inline-block;
                  width: 5rem;"
              >
                Enrolled 
              </div>
            </div>
            <div 
              style="height: 1.5rem;">
              <div
                style="
                  display: inline-block;
                  width: 3rem;"
              >
                <span class="btech-pill-text" :style="{
                  'background-color': colors.gray,
                  'color': '#000000',
                }">
                  Total 
                </span>
              </div>
              <div
                style="
                  display: inline-block;
                  width: 3rem;"
              >
              </div>
              <div
                style="
                  display: inline-block;
                  width: 5rem;"
              >
              </div>
              <div
                style="
                  display: inline-block;
                  width: 5rem;"
              >
                <span class="btech-pill-text" :style="{
                  'background-color': colors.blue,
                  'color': '#ffffff',
                }">
                  {{totals.hours_attended}} hrs
                </span>
              </div>
              <div
                style="
                  display: inline-block;
                  width: 5rem;"
              >
                <span class="btech-pill-text" :style="{
                  'background-color': colors.cyan,
                  'color': '#ffffff',
                }">
                  {{totals.hours_enrolled}} hrs
                </span>
              </div>
              <div
                style="
                  display: inline-block;
                  width: 5rem;"
              >
                <span 
                  v-if="totals.hours_enrolled > 0 && settings.individualReport.attendanceCutoffs.show"
                  class="btech-pill-text" 
                  :style="{
                    'background-color': calcHoursAttendedColor(totals),
                    'color': '#ffffff',
                  }">
                  {{Math.round((totals.hours_attended / totals.hours_enrolled) * 100)}}% 
                </span>
              </div>
            </div>
            <div><strong>Note:</strong>The current month's enrolled hours do not update daily and may be off. This number should be used as an estimate.</div>
          </div>

          <!--FOR EACH YEAR-->
          <div 
            v-for="months, year in user.clock_hours"
            style="
              margin-bottom: 1rem; 
              ">
            <div 
              style="
                display: inline-block; 
                vertical-align: top;
              ">
                <div
                  style="
                    display: inline-block;
                    width: 3rem;"
                >
                  Year 
                </div>
              <div>
                <span class="btech-pill-text" :style="{
                  'background-color': colors.gray,
                  'color': '#000000',
                }">
                  {{year}}
                </span>
              </div>
            </div>
            <div 
              style="
                display: inline-block; 
              ">
              <!--HEADINGS-->
              <div
                class="hours-table-header"
              >
                <div
                  style="
                    display: inline-block;
                    width: 3rem;"
                >
                  Month
                </div>
                <div
                  style="
                    display: inline-block;
                    width: 5rem;"
                >
                  SAP 
                </div>
                <div
                  style="
                    display: inline-block;
                    width: 5rem;"
                >
                  Attended 
                </div>
                <div
                  style="
                    display: inline-block;
                    width: 5rem;"
                >
                  Enrolled 
                </div>
              </div>

              <!--MONTHS IN GIVEN YEAR-->
              <div 
                v-for="hours, month in months"
                style="height: 1.5rem;">

                <!--MONTH-->
                <div
                  style="
                    display: inline-block;
                    width: 3rem;"
                >
                  <span 
                    class="btech-pill-text" 
                    :style="{
                    'background-color': colors.gray,
                    'color': '#000000',
                  }">
                    {{MONTH_NAMES_SHORT[month - 1]}} 
                  </span>
                </div>

                <!--SAP-->
                <div
                  style="
                    display: inline-block;
                    width: 4rem;"
                >
                  <span 
                    v-if="user?.sap_history?.[year]?.[month]"
                    class="btech-pill-text" 
                    :style="{
                    'background-color': (user?.sap_history?.[year]?.[month]) ? (user?.sap_history?.[year]?.[month] <= 100 ? colors.green : (user?.sap_history?.[year]?.[month] < 150) ? colors.yellow : colors.red) : colors.gray,
                    'color': (user?.sap_history?.[year]?.[month]) ? colors.white : colors.black
                  }">
                    {{user?.sap_history?.[year]?.[month]}}%
                  </span>
                </div>
                <div
                  style="
                    display: inline-block;
                    width: 1rem;"
                >
                  <span 
                    v-if="SAPUpDown(year, month) != ''"
                    class="btech-pill-text" 
                    :style="{
                    'width': '1rem',
                    'background-color': SAPUpDown(year, month) == '+' ? colors.red : colors.green,
                    'color': colors.white
                  }">
                    {{SAPUpDown(year, month)}}
                  </span>
                </div>

                <div
                  style="
                    display: inline-block;
                    width: 5rem;"
                >
                  <span 
                    :title="(hours?.hours_attended_previous > 0) ? 'These hours are not part of the current SAP period.' : 'Hours attended.'"
                    style="cursor: help;"
                    class="btech-pill-text" 
                    :style="{
                    'background-color': hours?.hours_attended ? colors.blue : hours?.hours_attended_previous ? colors.orange : colors.gray,
                    'color': (hours?.hours_attended > 0 ||  hours?.hours_attended_previous > 0) ? colors.white : colors.black,
                  }">
                    {{hours?.hours_attended > 0 ? hours.hours_attended : hours?.hours_attended_previous ?? 0}} hrs
                  </span>
                </div>
                <div
                  style="
                    display: inline-block;
                    width: 5rem;"
                >
                  <span 
                    :title="(hours?.hours_enrolled_previous > 0) ? 'These hours are not part of the current SAP period.' : 'Hours enrolled.'"
                    style="cursor: help;"
                    class="btech-pill-text" 
                    :style="{
                      'background-color': hours?.hours_enrolled ? colors.cyan: hours?.hours_enrolled_previous ? colors.darkOrange: colors.gray,
                      'color': (hours?.hours_enrolled > 0 ||  hours?.hours_enrolled_previous > 0) ? colors.white : colors.black,
                    }"
                  >
                    {{hours?.hours_enrolled > 0 ? hours.hours_enrolled : hours?.hours_enrolled_previous ?? 0}} hrs
                  </span>
                </div>
                <div
                  v-if="hours.hours_enrolled > 0 && settings.individualReport.attendanceCutoffs.show"
                  style="
                    display: inline-block;
                    width: 5rem;"
                >
                  <span 
                    v-if="hours.hours_enrolled_previous > 0"
                    class="btech-pill-text" 
                    :style="{
                      'background-color': calcHoursAttendedColor(hours),
                      'color': '#ffffff',
                    }">
                    {{Math.round((hours.hours_attended_previous / hours.hours_enrolled_previous) * 1000) / 10}}% 
                  </span>
                  <span 
                    v-if="hours.hours_enrolled > 0"
                    class="btech-pill-text" 
                    :style="{
                      'background-color': calcHoursAttendedColor(hours),
                      'color': '#ffffff',
                    }">
                    {{Math.round((hours.hours_attended / hours.hours_enrolled) * 1000) / 10}}% 
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  props: {
    manualHoursPerc: {
      type: Boolean,
      default: false
    },
    colors: {
      type: Object,
      default: () => ({
        type: 'someType'
      })
    },
    scroll: {
      type: Boolean,
      default: false
    },
    settings: {
      type: Object,
      default: () => ({})
    },
    user: {
      type: Object,
      default: () => ({})
    },
    studentTree: {
      type: Object,
      default: () => ({
        type: 'someType'
      })
    }
  },
  computed: {},
  data() {
    return {
      expandedReport: false,
      hours: [],
      MONTH_NAMES_SHORT: ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"],
      DAYS_NAMES_SHORT: ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"],
      DAYS_NAMES: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      previousMonths: (function () {
        let months = [];
        return months;
      })(),
      totals: {
        hours_enrolled: 0,
        hours_attended: 0
      }
    }
  },
  mounted() {
    let app = this;
    let hours = [];
    for (let i = 1; i < 4; i++) {
      let date = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - i,
        new Date().getDate()
      );
      if (app.user.clock_hours != undefined) {
        if (date.getFullYear() in app.user.clock_hours) {
          app.user.clock_hours[date.getFullYear()][date.getMonth() + 1].include = true;
        }
      }
    }

    app.user = app.processUserData(); 
    this.$refs.studentdataheader.updateHeader();
    //Do some processing of the hours data to prep it for graphing... I think?
    for (let year in app.user.clock_hours) {
      let yearData = app.user.clock_hours[year];
      let yearTotalEnrolled = 0;
      let yearTotalAttended = 0;
      for (let month in yearData) {
        let monthData = yearData[month];
        //I don't know what this does...
        if (monthData.include) hours.push({
          year: year,
          month: month
        })
        yearTotalEnrolled += monthData.hours_enrolled;
        yearTotalAttended += monthData.hours_attended;
        app.totals.hours_enrolled += monthData.hours_enrolled ?? monthData.hours_enrolled_previous ?? 0;
        app.totals.hours_attended += monthData.hours_attended ?? monthData.hours_attended_previous ?? 0;
      }
    }

    app.totals.hours_enrolled = Math.round(app.totals.hours_enrolled * 100) / 100;
    app.totals.hours_attended = Math.round(app.totals.hours_attended * 100) / 100;

    hours.sort(function (a, b) {
      //sorts least recent to most recent
      return (a.year - b.year) || (a.month - b.month)
    })

    app.hours = hours;
    document.title = app.user.name + " Summary"

    if (app.scroll) {
      app.scrollTop = $(window).scrollTop();
      $(window).scrollTop(0);
    }
  },
  methods: {
    SAPUpDown(year, month) {
      let SAP = this.user?.sap_history?.[year]?.[month] ?? 0;
      if (SAP == 0) return "";
      let prevSAP = this.previousMonthSAP(year, month);
      if (prevSAP == 0) return "";
      if (SAP == prevSAP) return "";
      if (SAP > prevSAP) return "+";
      if (SAP < prevSAP) return "-";
      return "";
    },
    previousMonthSAP(year, month) {
      month -= 1;
      if (month == 0) {
        month = 12;
        year -= 1;
      }
      return this.user?.sap_history?.[year]?.[month];
    },
    processUserData() {
      let app = this;
      let user = app.user;
      let lastLogin = "N/A";
      if (user.last_login != undefined) lastLogin = new Date(user.last_login);
      // let completedHours = user.graded_hours;

      return user;
    },
    printReport() {
      print();
    },

    calcHoursAttendedColor(data) {
      let app = this;
      let attendancePercentage = data.hours_attended / data.hours_enrolled * 100;
      if (app.manualHoursPerc) return app.colors.black; //right now, no way to set color breakpoints in manual show page, so just return black (not gray since black works with white)
      if (attendancePercentage >= app.settings.individualReport.attendanceCutoffs.good) return app.colors.green;
      if (attendancePercentage >= app.settings.individualReport.attendanceCutoffs.checkIn) return app.colors.yellow;
      return app.colors.red;
    },

    calcDepartmentTimeText() {
      let app = this;
      let user = app.user;
      if (user.enrolled_hours == 0 || user.completed_hours === undefined || user.completed_hours === 0) return "N/A";
      return Math.round((user.enrolled_hours / user.completed_hours) * 100) + "%";
    },

    calcDepartmentTimeTextColor() {
      let app = this;
      let user = app.user;
      if (user.enrolled_hours == 0 || user.completed_hours === undefined || user.completed_hours === 0) return "#000000";
      return "#FFFFFF";
    },

    calcDepartmentTimeColorBg() {
      let app = this;
      let user = app.user;
      if (user.enrolled_hours == 0 || user.completed_hours === undefined || user.completed_hours === 0) return app.colors.gray;
      let timePerc = Math.round((user.enrolled_hours / user.completed_hours) * 100);
      if (timePerc <= 100) return app.colors.green;
      if (timePerc <= 150) return app.colors.yellow;
      return app.colors.red;
    },

    getUserCourseProgress(courseCode) {
      let app = this;
      let user = app.user;
      if (courseCode in user.courses) {
        return user.courses[courseCode].progress;
      }
      return 0;
    },
    calcDepartmentScoreText() {
      let app = this;
      let averageScore = app.user.average_score;
      if (averageScore === undefined) return "N/A";
      return Math.round(averageScore * 100) + "%";
    },

    calcDepartmentScoreColorBg() {
      let app = this;
      let averageScore = app.user.average_score;
      if (averageScore === undefined) return app.colors.gray;
      let score = Math.round(averageScore * 100);
      if (score < 60) return app.colors.red;
      if (score < 80) return app.colors.yellow;
      return app.colors.green;
    },

    calcDepartmentScoreColorFont() {
      let app = this;
      let averageScore = app.user.average_score;
      if (averageScore === undefined) return "#000000";
      return "#FFFFFF";
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
  },
  destroyed: function () {}
});