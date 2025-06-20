(async function () {
  class Column {
    constructor(name, description, width, average, sort_type) {
      this.name = name;
      this.description = description;
      this.width = width;
      this.average = average;
      this.sort_type = sort_type; //needs to be a result of typeof, probably mostly going to be string or number
      this.sort_state = 0; //becomes 1 or -1 depending on asc or desc
      this.visible = true;
    }
  }
  async function postLoad() {
    let vueString = '';
    await $.get(SOURCE_URL + '/custom_features/reports/grades_page/template.vue', null, function (html) {
      vueString = html.replace("<template>", "").replace("</template>", "");
    }, 'text');
    let canvasbody = $("#application");
    canvasbody.after('<div id="canvas-grades-report-vue"></div>');
    $("#canvas-grades-report-vue").append(vueString);
    let genReportButton = $('<a class="Button" id="canvas-grades-report-vue-gen">Report</a>');
    let newGrades = $('div#gradebook-actions');
    let oldGrades = $('div#gradebook-toolbar');
    if (newGrades.length > 0) newGrades.prepend(genReportButton);
    else if (oldGrades.length > 0) genReportButton.appendTo(oldGrades);
    else $("#right-side").append(genReportButton);
    let modal = $('#canvas-grades-report-vue');
    modal.hide();
    genReportButton.click(function () {
      let modal = $('#canvas-grades-report-vue');
      modal.show();
      $.post("https://tracking.bridgetools.dev/api/hit", {
        "tool": "reports-grades_page",
        "canvasId": ENV.current_user_id
      });
    });
    new Vue({
      el: '#canvas-grades-report-vue',
      mounted: async function () {
        let courseId = ENV?.current_context.id;
        if (courseId) {
          let enrollments = await this.loadEnrollments(courseId);
          this.enrollments.push(...enrollments);
        } else {
          let courses = await canvasGet('/api/v1/courses?enrollment_type=teacher&state[]=available')
          for (let c in courses) {
            let course = courses[c];
            let enrollments = await this.loadEnrollments(course.id);
            this.enrollments.push(...enrollments);
          }
        }
        console.log(this.enrollments);
        // await this.createGradesReport(course.id);
        // await this.processStudentsData(course);
        // this.updateStudents();
        // await this.processStudentsAssignmentData();
        // this.updateStudents();
        this.loading = false;
      },

      data: function () {
        return {
          courseId: null,
          colors: bridgetools.colors,
          columns: [
            new Column('User Name', 'The student\'s name as it appears in Canvas.', 10, false, 'string'),
            new Column('Course Name', 'The course in which the student is enrolled.', 10, false, 'string'),
            new Column('Section Name', 'The section in which the student is enrolled in this course.', 10, false, 'string'),
            new Column('Current Score', 'The student\'s grade based on assignments submitted to date.', 3, true, 'number'),
            new Column('Final Score', 'The student\'s final grade. All unsubmitted assignments are graded as 0. This is their grade if they were to conclude the course right now.', 3, true, 'number'),
            new Column('Progress', 'This is an estimate of the student\'s progress baed on the cirterion selected above.', 12, true, 'number'),
            new Column('Last Submit', 'The number of days since the student\'s last submission.', 3, true, 'number'),
            new Column('Days In Course', 'The number of days since the student began the course.', true, 3, 'number'),
            new Column('Days Left', 'The number of days until the student will be removed from the course.', true, 3, 'number')
            // new Column('Ungraded', '', true, 3, 'number')
          ],
          enrollments: [],
          loading: false, //CHANGE: return this to true if this doesn't work
          menu: '',
          progress_method: "points_weighted",
          section_names: ['All'],
          section_filter: 'All'
        }
      },
      computed: {
        visibleColumns: function () {
          return this.columns.filter(function (c) {
            return c.visible;
          })
        }
      },
      methods: {
        // does not currently handle pagination
        async graphqlUngradedSubmissions(courseId) {
          let queryString = 
          `{
            course(id: "${courseId}"){
              courseCode
              name
               submissionsConnection(filter: {states: [submitted, ungraded, pending_review]}) {
                nodes {
                  enrollmentsConnection {
                    nodes {
                      _id
                    }
                  }
                  submittedAt
                }
              }
              _id
            }
          }`
          let res = await $.post("/api/graphql", { query: queryString });
          return res.data.course;
        },
        async graphqlEnrollments(courseId) {
          let queryString = 
          `{
            course(id: "${courseId}"){
              enrollmentsConnection(filter: {states: active, types: StudentEnrollment}, first: 100) {
                nodes {
                  _id
                  createdAt
                  startAt
                  endAt
                  grades {
                    currentScore
                    finalScore
                  }
                  user {
                    name
                    _id
                  }

                  section {
                    name
                  }
                }
              }
              courseCode
              name
              _id
            }
          }`
          let res = await $.post("/api/graphql", { query: queryString });
          return res.data.course;
        },
        calcDaysBetweenDates(date1, date2=new Date()) {
          let diffTime =  date2 - date1;
          let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays;
        },
        async loadEnrollments(courseId) {
          let enrollments = [];
          
          let courseData = await this.graphqlEnrollments(courseId);
          let ungradedSubmissionsData = await this.graphqlUngradedSubmissions(courseId);
          // let recentSubmissionsData = await this.graphqlRecentSubmissions(courseId);
          let enrollmentsData = courseData.enrollmentsConnection.nodes;
          let ungradedSubmissions = ungradedSubmissionsData.submissionsConnection.nodes;
          for (let e = 0; e < enrollmentsData.length; e++) {
            let enrollmentData = enrollmentsData[e];
            console.log(enrollmentData);
            let endAt = enrollmentData.endAt ? Date.parse(enrollmentData.endAt) : undefined;
            let startAt = enrollmentData.startAt ?? enrollmentData.createdAt;
            startAt = startAt ? Date.parse(startAt) : undefined;
            console.log(startAt);
            console.log(endAt);
            console.log(endAt - startAt)
            let daysLeft = this.calcDaysBetweenDates(new Date(), endAt);
            console.log(daysLeft);
            let daysInCourse = this.calcDaysBetweenDates(startAt);
            let enrollment = {
              course_name: courseData.name,
              course_id: courseData._id,
              course_code: courseData.courseCode,
              enrollment_id: enrollmentData._id,
              created_at: startAt,
              end_at: endAt,
              current_score: enrollmentData.grades.currentScore,
              final_score: enrollmentData.grades.finalScore,
              progress: 0,
              section_name: enrollmentData.section.name,
              days_in_course: daysInCourse,
              days_left: daysLeft,
              user_name: enrollmentData.user.name,
              user_id: enrollmentData.user._id,
              ungraded_submissions: 0
            };
            enrollment = this.processEnrollment(enrollment);
            enrollments.push(enrollment);
          }
          for (let s = 0; s < ungradedSubmissions.length; s++) {
            let submissionData = ungradedSubmissions[s];
            for (let e = 0; e < enrollments.length; e++) {
              if (enrollments[e].enrollment_id == submissionData.enrollmentsConnection.nodes[0]._id) {
                enrollments[e].ungraded_submissions += 1;
              }
            }
          }
          return enrollments;
        },
        processEnrollment(enrollment) {
          if (enrollment.current_score > 0) {
            enrollment.progress = Math.round(enrollment.final_score / enrollment.current_score * 100);
          }
          // let end_date = Date.parse(enrollment.end_at);
          let now = Date.now();
          let diffTime =  now - enrollment.created_at;
          if (diffTime > 0) {
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            enrollment.days_in_course = diffDays;
          }
          return enrollment;
        },
 
        sortColumn(header) {
          let name;
          if (header === "Progress Estimate") name = this.columnNameToCode(this.progress_method);
          else name = this.columnNameToCode(header);
          console.log(name);
          let sortState = 1;
          let sortType = '';
          for (let c = 0; c < this.columns.length; c++) {
            if (this.columns[c].name !== header) {
              //reset everything else
              this.columns[c].sort_state = 0;
            } else {
              //if it's the one being sorted, set it to 1 if not 1, or set it to -1 if is already 1
              if (this.columns[c].sort_state !== 1) this.columns[c].sort_state = 1;
              else this.columns[c].sort_state = -1;
              sortState = this.columns[c].sort_state;
              sortType = this.columns[c].sort_type;
            }
          }
          this.enrollments.sort(function (a, b) {
            let aVal = a[name] ?? -1;
            let bVal = b[name] ?? -1;
            //convert strings to upper case to ignore case when sorting
            if (typeof (aVal) === 'string') aVal = aVal.toUpperCase();
            if (typeof (bVal) === 'string') bVal = bVal.toUpperCase();

            //see if not the same type and which one isn't the sort type
            if (typeof (aVal) !== typeof (bVal)) {
              if (typeof (aVal) !== sortType) return -1 * sortState;
              if (typeof (bVal) !== sortType) return 1 * sortState;
            }
            //check if it's a string or int
            let comp = 0;
            if (aVal > bVal) comp = 1;
            else if (aVal < bVal) comp = -1;
            //flip it if reverse sorting;
            comp *= sortState;
            return comp
          })
        },
   
        columnNameToCode(name) {
          return name.toLowerCase().replace(/ /g, "_");
        },

        close() {
          $(this.$el).hide();
        }

      }
    })
  }
  function loadCSS(url) {
    var style = document.createElement('link'),
      head = document.head || document.getElementsByTagName('head')[0];
    style.href = url;
    style.type = 'text/css';
    style.rel = "stylesheet";
    style.media = "screen,print";
    head.insertBefore(style, head.firstChild);
  }
  function _init() {
    loadCSS("https://reports.bridgetools.dev/department_report/style/main.css");
    loadCSS("https://reports.bridgetools.dev/style/main.css");
    $.getScript("https://reports.bridgetools.dev/department_report/components/courseProgressBarInd.js").done(() => {
      postLoad();
    });
  }
  _init();
})();