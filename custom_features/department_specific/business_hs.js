(async function () {
  IMPORTED_FEATURE = {};
  //IF the editor, add the ability to add services
  // if (TOOLBAR.checkEditorPage()) {
  //   await TOOLBAR.checkReady();

  //   function checkButtonColor(btn) {
  //     let body = tinyMCE.activeEditor.getBody();
  //     let services = $(body).find("#btech-hs-courses");
  //     if (services.length === 0) {
  //       btn.find('i').css({
  //         'color': "#000000"
  //       });
  //     } else {
  //       btn.find('i').css({
  //         'color': "#d22212"
  //       });
  //     }
  //   }
  //   let btn = await TOOLBAR.addButtonIcon("far fa-abacus", "Convert this assignment to a Course Grading assignment", async function () {
  //     let body = tinyMCE.activeEditor.getBody();
  //     let div = $(body).find("#btech-hs-courses");
  //     if (div.length === 0) {
  //       $(body).prepend(`
  //         <div id='btech-hs-courses' class='btech-hidden' style='border: 1px solid #000;'>DO NOT DELETE. THIS SETS THIS ASSIGNMENT AS AN ASSIGNMENT TO KEEP TRACK OF COURSES COMPLETED IN A TERM.</div><p> </p>
  //       `);
  //     } else {
  //       div.remove();
  //     }
  //   });
  //   checkButtonColor(btn);
  //   btn.click(function () {
  //     checkButtonColor(btn);
  //   });
  // }

  let rPieces = /^\/courses\/([0-9]+)\/assignments\/([0-9]+)\/submissions\/([0-9]+)/;
  let rPiecesInitial = /^\/courses\/([0-9]+)\/assignments\/([0-9]+)\/submissions\/([0-9]+)/;
  let IS_SPEED_GRADER = false;
  if (window.location.pathname.includes("speed_grader")) {
    rPieces = /^\/courses\/([0-9]+)\/gradebook\/speed_grader\?assignment_id=([0-9]+)&student_id=([0-9]+)/
    rPiecesInitial = /^\/courses\/([0-9]+)\/gradebook\/speed_grader\?assignment_id=([0-9]+)/
    IS_SPEED_GRADER = true;
  }

  //GRADING VIEW
  //This one has to come first so it doesn't have the submission view run on the grading page
  if (rPiecesInitial.test(window.location.pathname + window.location.search)) {
    if (ENV.current_user_roles.includes("teacher")) {
      IMPORTED_FEATURE = {
        initiated: false,
        oldHref: "",

        async _init(params = {}) {
          //NEEDS
          ////TOP PRIORITY: Need to handle pagination for comments since there will be more than 100
          ////Checks on if a student has already submitted their max number of submissions, at least a warning, probably not a hard block
          ////Allow students to see everything except for the review tab so they can see their summary, submitted, and rejected info too
          ////Option to delete a submission, which will delete that comment and all other comments with the submission id
          ////Allow the color themes to affect the color of the buttons and display in both teacher view and student view
          let feature = this;
          if (IS_SPEED_GRADER) {
            feature.oldHref = document.location.href,
            await getElement("#right_side");
            var
              bodyList = document.querySelector("#right_side"),
              observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                  if (feature.oldHref !== document.location.href) {
                    feature.oldHref = document.location.href;
                    feature.createApp();
                  }
                });
              });
            var config = {
              childList: true,
              subtree: true
            };
            observer.observe(bodyList, config);
          }
          feature.createApp();
        },
        async createApp() {
          let vueString = `
            <div style="padding:10px;" id='app-hs-courses'>
              <div class="btech-tabs-container">
                <div class="btech-tabs">
                <ul>
                  <li v-for="menuName, key in menus" :class="{active: menu==menuName}" @click="menu=menuName">{{menuName}}</li>
                  <li v-if="flaggedDates.length > 0" :class="{active: menu=='flagged'}" @click="menu='flagged'">flagged dates</li>
                </ul>
                </div>
                <div style="padding: 10px;">

                  <div v-if="menu == 'courses'">
                    <div v-if="loading==true">Loading Content...</div>
                    <div v-else>
                      <h3>Select a course, enter the grade, and submit to add the course to the list of courses to be averaged for this term.</h3>
                      <select v-model="selectedCourse" @change="onCourseSelect()">
                        <option value="" disabled>-Select Course-</option>
                        <option v-for="course in courses" :value="course.course_id">{{course.name}} ({{course.term}})</option>
                      </select>
                      <br>
                      <span>Grade </span><input style="width: 3em;" maxlength="5" type="text" v-model="selectedGrade"><span>%</span>
                      <br>
                      <div v-on:click="submitCourseGrade()" class="Button">Submit</div>
                    </div>
                  </div>

                  <div v-if="menu == 'completed'">
                    <div v-for="course in courseGrades">
                      <p><b>{{course.name}}:</b> {{course.grade}}%<i @click="removeCourse(course)" style="float: right;" class="icon-end"></i></p>
                      <p style="font-size:.66rem;">{{course.term}}</p>
                    </div>
                    <br>
                    <div v-if="courseGrades.length > 0"><b>Average:</b> {{averageScore()}}%</div>
                  </div>

                </div>
              </div>
            </div>`;
          let pieces = (window.location.pathname + window.location.search).match(rPiecesInitial);
          let courseId = parseInt(pieces[1]);
          let assignmentId = parseInt(pieces[2]);
          let description = '';
          await $.get("/api/v1/courses/" + courseId + "/assignments/" + assignmentId, function (data) {
            description = data.description;
          });
          if (description.includes("btech-hs-courses")) {
            if (rPieces.test(window.location.pathname + window.location.search)) {
              let container;
              if (IS_SPEED_GRADER) {
                container = await getElement("#submissions_container");
              } else {
                container = await getElement("div.submission-details-frame");
              }
              container.prepend(vueString);
              new Vue({
                el: '#app-hs-courses',
                data: function () {
                  return {
                    menu: 'courses',
                    menus: [
                      'courses',
                      'completed',
                    ],
                    loading: true,
                    courseid: 0,
                    assignmetnId: 0,
                    studentId: 0,
                    comments: [],
                    services: {},
                    courses: [],
                    courseGrades: [],
                    completedServices: [],
                    criteria: {},
                    selectedCourse: '',
                    selectedGrade: '',
                    completedCriterionDate: '',
                    dates: [],
                    flaggedDates: []
                  }
                },
                mounted: async function () {
                  let app = this;
                  let pieces = (window.location.pathname + window.location.search).match(rPieces);
                  app.courseId = parseInt(pieces[1]);
                  app.studentId = parseInt(pieces[3]);
                  app.assignmentId = parseInt(pieces[2]);
                  let url = window.location.origin + "/users/" + app.studentId;
                  let list = [];
                  let termsData = await canvasGet("/api/v1/accounts/3/terms")
                  let termsList = termsData[0].enrollment_terms;
                  let terms = {};

                  for (let t in termsList) {
                    let term = termsList[t];
                    terms[term.id] = term;
                  }
                  let enrollmentData = await app.bridgetoolsReq("https://reports.bridgetools.dev/api/students/canvas_enrollments/" + app.studentId);
                  for (let e in enrollmentData) {
                    let enrollment = enrollmentData[e];
                    try {
                      let course = (await canvasGet("/api/v1/courses/" + enrollment.course_id))[0];
                      list.push({
                        name: course.name,
                        grade: enrollment.grades.current_score,
                        term: terms[course.enrollment_term_id].name,
                        course_id: course.id
                      });
                    } catch {
                      console.error("ERROR PULLING COURSE " + enrollment.course_id);
                    }
                  }
                  app.courses = list;
                  this.comments = await this.getComments();
                  this.processComments(this.comments);
                  this.loading = false;
                  $("#app-hs-courses").css('display', 'block');
                },
                computed: {},
                methods: {
                  async bridgetoolsReq(url) {

                    let reqUrl = "/api/v1/users/" + ENV.current_user_id + "/custom_data/btech-reports?ns=dev.bridgetools.reports";
                    let authCode = '';
                    await $.get(reqUrl, data => {authCode = data.data.auth_code;});
                    //figure out if any params exist then add autho code depending on set up.
                    if (!url.includes("?")) url += "?auth_code=" + authCode + "&requester_id=" + ENV.current_user_id;
                    else url += "&auth_code=" + authCode + "&requester_id=" + ENV.current_user_id;
                    let output;
                    await $.get(url, function(data) {
                      output = data;
                    });
                    return output;
                  },
                  removeCourse: async function (course) {
                    for (let c = 0; c < this.courseGrades.length; c++) {
                      if (this.courseGrades[c].course === course.course) {
                        await $.delete(window.location.origin + "/submission_comments/" + this.courseGrades[c].comment_id);
                        this.courseGrades.splice(c, 1);
                      }
                    }
                  },
                  onCourseSelect: function () {
                    let app = this;
                    let course = this.selectedCourse;
                    let url = "/api/v1/courses/" + course + "/users?user_ids[]=" + this.studentId + "&enrollment_state[]=active&enrollment_state[]=completed&enrollment_state[]=inactive&include[]=enrollments";
                    $.get(url).done(function (data) {
                      app.selectedGrade = data[0].enrollments[0].grades.current_score;
                    })
                  },
                  averageScore: function () {
                    let coursePointsTotal = 0;
                    let courseCount = this.courseGrades.length;
                    for (let c = 0; c < courseCount; c++) {
                      let courseData = this.courseGrades[c];
                      coursePointsTotal += parseFloat(courseData['grade']);
                    }
                    let average = (Math.round((coursePointsTotal / courseCount) * 10) / 10).toFixed(1);
                    return average;
                  },
                  minToHoursString: function (minutes) {
                    let hours = Math.floor(minutes / 60);
                    minutes = minutes - (hours * 60);
                    return hours + "h " + minutes + "m";
                  },
                  hoursSubmittedInDate: function (date, serviceName = '') {
                    let total = 0;
                    for (var i = 0; i < this.services.length; i++) {
                      let service = this.services[i];
                      if (service.service == serviceName || serviceName == '') {
                        if (date == '' || this.dateToString(date) == this.dateToString(service.canvas_data.created_at)) {
                          total += this.criteria[service.service].average_time;
                        }
                      }
                    }
                    return total;
                  },
                  createComment(course, grade, comment) {
                    for (let c = 0; c < this.courses.length; c++) {
                      if (this.courses[c].course_id == course) {
                        name = this.courses[c].name;
                        term = this.courses[c].term;
                      }
                    }
                    let text = `COURSE: ` + course + `\nNAME: ` + name + `\nTERM: ` + term + `\nGRADE: ` + grade;
                    return text;
                  },
                  dateToString(date) {
                    date = new Date(Date.parse(date));
                    return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
                  },
                  async submitCourseGrade() {
                    let course = '' + this.selectedCourse;
                    let grade = this.selectedGrade;
                    let found = false
                    if (course != "" && grade != "") {
                      for (let c = 0; c < this.courseGrades.length; c++) {
                        if (('' + this.courseGrades[c].course) === course) {
                          this.courseGrades[c].grade = grade;
                          found = true;
                          await $.delete(window.location.origin + "/submission_comments/" + this.courseGrades[c].comment_id);
                        }
                      }
                      if (!found) {
                        this.courseGrades.push({
                          grade: grade
                        });
                      }

                      let averageScore = this.averageScore();
                      this.loading = true;
                      let url = "/api/v1/courses/" + this.courseId + "/assignments/" + this.assignmentId + "/submissions/" + this.studentId;
                      await $.put(url, {
                        comment: {
                          text_comment: this.createComment(course, grade)
                        },
                        submission: {
                          posted_grade: averageScore
                        }
                      });
                      location.reload(true);
                    }
                  },
                  async getComments() {
                    let url = "/api/v1/courses/" + this.courseId + "/assignments/" + this.assignmentId + "/submissions/" + this.studentId + "?include[]=submission_comments";
                    let comments = [];
                    await $.get(url, function (data) {
                      comments = (data.submission_comments);
                    });
                    return comments;
                  },
                  getCommentData(comment, dataName) {
                    let regex = new RegExp(dataName + "\:[ ]*(.+)");
                    let data = comment.match(regex);
                    if (data !== null) {
                      data = data[1];
                    } else {
                      data = "";
                    }
                    return data;
                  },
                  processComments(canvasCommentsData) {
                    this.completedServices = [];
                    this.rejectedServices = [];
                    this.pendingServices = [];
                    courseGrades = [];
                    for (let c = 0; c < canvasCommentsData.length; c++) {
                      let comment = canvasCommentsData[c].comment;
                      let authorData = canvasCommentsData[c].author;
                      let date = this.dateToString(canvasCommentsData[c].created_at);
                      if (authorData.id !== this.studentId) {
                        let cCourse = this.getCommentData(comment, "COURSE");
                        if (cCourse !== "" && cCourse !== "undefined") {
                          let cTerm = this.getCommentData(comment, "TERM");
                          let cGrade = this.getCommentData(comment, "GRADE");
                          let cName = this.getCommentData(comment, "NAME");
                          //Check if it's a student comment or a teacher confirmation
                          courseGrades.push({
                            course: cCourse,
                            grade: cGrade,
                            term: cTerm,
                            name: cName,
                            author_data: authorData,
                            canvas_data: canvasCommentsData[c],
                            comment_id: canvasCommentsData[c].id
                          });
                          if (!this.dates.includes(date)) {
                            this.dates.push(date);
                          }
                        }
                      }
                    }
                    this.courseGrades = courseGrades;
                  },
                },
              });
            }
          }
        }
      }
    }
  }
})();