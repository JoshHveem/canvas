(async function () {
  //FILTER BY SECTION
  //NEW QUIZZES???
  //https://btech.instructure.com/courses/498455/accredidation
  //https://jhveem.xyz/accredidation/lti.xml
  if (document.title === "BTECH Accredidation") {
    //abort if this has already been run on the page
    if ($('#accredidation').length > 0) return;

    let rCheckInCourse = /^\/courses\/([0-9]+)/;
    if (rCheckInCourse.test(window.location.pathname)) {
      //Allows printing of an element, may be obsolete
      add_javascript_library("https://cdnjs.cloudflare.com/ajax/libs/printThis/1.15.0/printThis.min.js");
      //convert html to a canvas which can then be converted to a blob...
      add_javascript_library("https://html2canvas.hertzen.com/dist/html2canvas.min.js");
      //and converted to a pdf
      add_javascript_library("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.1.1/jspdf.umd.js");
      //which can then be zipped into a file using this library
      add_javascript_library("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js");
      //and then saved
      add_javascript_library("https://cdn.jsdelivr.net/npm/file-saver@2.0.2/dist/FileSaver.min.js");
      let CURRENT_COURSE_ID = parseInt(window.location.pathname.match(rCheckInCourse)[1]);
      //add in a selector for all students with their grade then only show assignments they've submitted so far???
      $("#content").html(`
      <div id='accredidation'>
        <div>
          <div v-for='group in assignmentGroups'>
            <h2>{{group.name}}</h2>
            <div v-for='assignment in getSubmittedAssignments(group.assignments)'>
              <div v-if='assignment.no_submissions===false'>
                <a style='cursor: pointer;' @click='currentGroup = group; openModal(assignment)'>{{assignment.name}}</a> (<span v-if='assignment.submissions.length > 0'>{{assignment.submissions.length}}</span><span v-else>...</span>)
              </div>
            </div>
          </div>
        </div>
        <div v-if='preparingDocument' class='btech-modal' style='display: inline-block;'>
          <div class='btech-modal-content'>
            <div class='btech-modal-content-inner'>
              <p>Please wait while content is prepared to print.</p>
            </div>
          </div>
        </div>
        <div v-if='showModal && !preparingDocument' class='btech-modal' style='display: inline-block;'>
          <div class='btech-modal-content'>
            <div style='float: right; cursor: pointer;' v-on:click='close()'>X</div>
            <div class='btech-modal-content-inner'>
              <h2><a target='#' v-bind:href="'/courses/'+courseId+'/assignments/'+currentAssignment.id">{{currentAssignment.name}}</a></h2>
              <div v-if='submissions.length > 0'>
                <div v-for='submission in submissions'>
                  <i class='icon-download' style='cursor: pointer;' @click='downloadSubmission(currentAssignment, submission)'></i>
                  <a target='#' v-bind:href="'/courses/'+courseId+'/assignments/'+currentAssignment.id+'/submissions/'+submission.user.id">{{submission.user.name}} ({{Math.round(submission.grade / currentAssignment.points_possible * 1000) / 10}}%)</a>
                </div>
              </div>
              <div v-else>
                No graded submissions found. There may be submissions pending grading.
              </div>
            </div>
          </div>
        </div>
      </div>`);
      await $.getScript("https://cdn.jsdelivr.net/npm/vue");
      new Vue({
        el: "#accredidation",
        mounted: async function () {
          let app = this;
          app.courseId = CURRENT_COURSE_ID;
          await $.get("/api/v1/courses/" + app.courseId + "/assignment_groups?include[]=assignments&per_page=100").done(function (data) {
            for (let i = 0; i < data.length; i++) {
              let group = data[i];
              for (let j = 0; j < group.assignments.length; j++) {
                data[i].assignments[j].submissions = [];
                data[i].assignments[j].no_submissions = false;
              }
            }
            app.assignmentGroups = data;
          });
          let sections = await canvasGet("/api/v1/courses/" + app.courseId + "/sections?include[]=students")
          app.getAllSubmissions();
          console.log(sections);
          /* unused as far as I can tell
          let enrollments = await canvasGet("/api/v1/courses/" + app.courseId + "/enrollments", {
            type: [
              'StudentEnrollment'
            ],
            state: [
              'active',
              'completed',
              'inactive'
            ]
          });
          app.enrollments = enrollments;
          */
        },
        data: function () {
          return {
            assignmentGroups: {},
            enrollments: [],
            courseId: null,
            currentUser: '',
            showModal: false,
            preparingDocument: false,
            submissions: [],
            currentAssignment: {}
          }
        },
        methods: {
          getSubmittedAssignments(assignments) {
            let app = this;
            let submittedAssignments = [];
            for (let i = 0; i < assignments.length; i++) {
              let assignment = assignments[i];
              if (assignment.has_submitted_submissions) {
                submittedAssignments.push(assignment);
              }
            }
            return submittedAssignments;
          },
          async getAllSubmissions(assignmentId = '') {
            let app = this;
            submissionsByAssignment = {};
            //let submissions = await canvasGet("/api/v1/courses/" + app.courseId + "/assignments/" + assignment.id + "/submissions", {
            let packet = {
              'student_ids': 'all',
              'workflow_state': 'graded',
              'include': [
                'user',
                'submission_comments'
              ]
            };
            if (assignmentId !== '') {
              packet['assignment_ids'] = [assignmentId];
            }
            let submissions = await canvasGet("/api/v1/courses/" + app.courseId + "/students/submissions", packet);
            for (let s = 0; s < submissions.length; s++) {
              let submission = submissions[s];
              if (submissionsByAssignment[submission.assignment_id] === undefined) {
                submissionsByAssignment[submission.assignment_id] = [];
              }
              submissionsByAssignment[submission.assignment_id].push(submission);
            }
            for (let g = 0; g < app.assignmentGroups.length; g++) {
              let group = app.assignmentGroups[g];
              console.log(group);
              let assignments = group.assignments;
              let submittedAssignments = app.getSubmittedAssignments(assignments);
              for (let a = 0; a < submittedAssignments.length; a++) {
                let assignment = submittedAssignments[a];
                if (assignment.id === assignmentId || assignmentId === '') {
                  let assignmentSubmissions = submissionsByAssignment[assignment.id];
                  if (assignmentSubmissions !== undefined) {
                    assignment.submissions = assignmentSubmissions;
                  } else {
                    assignment.no_submissions = true;
                  }
                }
              }

            }
            return submissions;
          },
          getComments(submission) {
            let comments = submission.submission_comments;
            let el = "";
            if (comments.length > 0) {
              el = $("<div style='page-break-before: always;' class='btech-accredidation-comments'></div>")
              el.append("<h2>Comments</h2>")
              for (let i = 0; i < comments.length; i++) {
                let comment = comments[i];
                let commentEl = $(`<div class='btech-accredidation-comment' style='border-bottom: 1px solid #000;'>
                  <p>` + comment.comment + `</p>
                  <p style='text-align: right;'><i>-` + comment.author_name + `, ` + comment.created_at + `</i></p>
                </div>`);
                el.append(commentEl);
              }
            }
            return el;
          },
          async downloadSubmission(assignment, submission) {
            let app = this;
            let types = assignment.submission_types;
            app.preparingDocument = true;

            //this needs to be set or it will flip preparing Document to false at the end, IE if it will be pulling up a print screen, set this to true
            needsToWait = false;

            if (assignment.quiz_id !== undefined) {
              let url = '/courses/' + app.courseId + '/assignments/' + assignment.id + '/submissions/' + submission.user.id + '?preview=1';
              await app.createIframe(url, app.downloadQuiz, {
                'submission': submission,
                'assignment': assignment
              });
              needsToWait = true;
            }
            if (assignment.rubric != undefined) {
              let url = "/courses/" + app.courseId + "/assignments/" + assignment.id + "/submissions/" + submission.user.id;
              await app.createIframe(url, app.downloadRubric, {
                'submission': submission,
                'assignment': assignment
              });
              needsToWait = true;
            }
            if (types.includes("online_upload")) {
              //CHECK IF THERE ARE COMMENTS AND CREATE A FILE WITH THOSE COMMENTS AND DOWNLOAD
              let url = "/api/v1/courses/" + app.courseId + "/assignments/" + assignment.id + "/submissions/" + submission.user.id;
              let assignmentsData = null;
              await $.get(url, function (data) {
                assignmentsData = data;
              });
              for (let i = 0; i < assignmentsData.attachments.length; i++) {
                let attachment = assignmentsData.attachments[i];
                await app.createIframe(attachment.url);
              }
            }
            //check if nothing has been gotten
            if (false) {
              console.log('assignment type undefined');
            }
            if (needsToWait == false) {
              app.preparingDocument = false;
            }
          },
          async downloadRubric(iframe, content, data) {
            let app = this;
            let title = data.assignment.name + "-" + data.submission.user.name + " submission"
            let commentEl = app.getComments(data.submission);
            content.find("#rubric_holder").show();
            content.find("#rubric_holder").prepend("<div>Submitted:" + data.submission.submitted_at + "</div>");
            content.find("#rubric_holder").prepend("<div>Student:" + data.submission.user.name + "</div>");
            content.find("#rubric_holder").prepend("<div>Assignment:" + data.assignment.name + "</div>");
            content.find("#rubric_holder").css({
              'max-height': '',
              'overflow': 'visible'
            });
            let ogTitle = $('title').text();
            $('title').text(title);
            content.find("#rubric_holder").printThis({
              pageTitle: title,
              afterPrint: function () {
                $('title').text(ogTitle);
                app.preparingDocument = false;
                iframe.remove();
              }
            });
            return;
          },
          async downloadQuiz(iframe, content, data) {
            let app = this;
            let elId = iframe.attr('id');
            let id = elId.replace('btech-content-', '');
            let title = data.assignment.name + "-" + data.submission.user.name + " submission"
            let commentEl = app.getComments(data.submission);
            content.prepend("<div>Submitted:" + data.submission.submitted_at + "</div>");
            content.prepend("<div>Student:" + data.submission.user.name + "</div>");
            content.prepend("<div>Assignment:" + data.assignment.name + "</div>");
            content.append(commentEl);
            let ogTitle = $('title').text();
            $('title').text(title);
            let window = document.getElementById(elId).contentWindow;
            window.onafterprint = (event) => {
              $('title').text(ogTitle);
              app.preparingDocument = false;
              iframe.remove();
            }
            window.focus();
            window.print();
            return;
          },
          async createIframe(url, func = null, data = {}) {
            let app = this;
            let id = genId();
            let elId = 'btech-content-' + id
            let iframe = $('<iframe id="' + elId + '" style="display: none;" src="' + url + '"></iframe>');

            $("#content").append(iframe);
            //This is unused. was for trying to convert an html element to a canvas then to a data url then to image then to pdf, but ran into cors issues.
            // $("#content").append("<div id='btech-export-" + id + "'></div>");
            let window = document.getElementById(elId).contentWindow;
            window.onload = function () {
              let content = $(window.document.getElementsByTagName('body')[0]);
              let imgs = content.find('img');
              if (func !== null) {
                func(iframe, content, data);
              }
            }
            return;
          },
          async openModal(assignment) {
            let app = this;
            app.showModal = true;
            app.currentAssignment = assignment;
            app.submissions = [];
            if (assignment.submissions.length == 0) {
              await app.getAllSubmissions(assignment.id);
            }
            app.submissions = assignment.submissions;
          },
          submittedAssignments(submissions) {
            let output = [];
            for (let i = 0; i < submissions.length; i++) {
              let submission = submissions[i];
              if (submission.workflow_state != "unsubmitted") {
                output.push(submission);
              }
            }
            return output;
          },
          close() {
            let app = this;
            app.showModal = false;
          }
        }
      });
      let assignmentData = [];
      for (let i = 0; i < assignmentData.length; i++) {
        let group = assignmentData[i];
        $("#content").append("<h2>" + group.name + " (" + group.group_weight + "%)</h2>");
      }
    }
  }
})();