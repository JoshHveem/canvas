(async function () {
    console.log("ACCREDITATION 2.0")
  //FILTER BY SECTION
  //NEW QUIZZES???
  //With assignments make sure to also grab if they did a text submission or other possible submission types
  //get comments if nothing submitted. Might be easiest to instead of attaching comments to rubric, just grab whatever appears on assignment submission and attach them to that. Then attach comments to quizzes, so the content gets all comments and rubrics is just a side thing like uploads.

  //https://bridgetools.dev/accreditation/lti.xml
  if (document.title === "BTECH Accreditation") {
    //abort if this has already been run on the page
    //If you change id name, you'll have to update the css
    if ($('#accreditation').length > 0) return;
    let rCheckInCourse = /^\/courses\/([0-9]+)/;
    if (rCheckInCourse.test(window.location.pathname)) {
      add_javascript_library("https://cdn.jsdelivr.net/npm/vue@2.6.12");
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
        await $.put(`https://btech.instructure.com/api/v1/courses/${CURRENT_COURSE_ID}/gradebook_settings`, {
            gradebook_settings: {
                show_concluded_enrollments: true
            }
        });
      //add in a selector for all students with their grade then only show assignments they've submitted so far???
      $("#content").html(`
      <div id='accreditation'>
        <div>
          If the pdf cuts off part of your evidence and you're using Chrome, try changing the layout to Landscape and/or adjusting the Scale (under More Settings) until everything fits.
        </div>
        <div>
          <input type="checkbox" id="checkbox" v-model="anonymous" />
          <label for="checkbox">Anonymize</label>
        </div>
        <div class='date-input'>
          <input type='date' v-model='startDate'>
          <input type='date' v-model='endDate'>
        </div>
        <div class='section-input'>
          <select v-model='section'>
            <option value='' selected>All Sections</option>
            <option v-for='section in sections' :value='section.id'>
              {{section.name}}
            </option>
          </select>
        </div>
        <div v-if="loadingCourse">
          Loading submissions...
        </div>
        <div v-if="!loadingCourse && assignmentGroups.length == 0">
          Failed to load submissions
        </div>
        <div v-if="!loadingCourse && assignmentGroups.length > 0">
          <div v-for='group in assignmentGroups'>
            <h2>{{group.name}}</h2>
            <div 
              v-for='assignment in group.assignments'
              :style="{
                'color': getFilteredSubmissions(assignment?.submissions ?? []).length > 0 ? '#000000' : '#888888'
              }"
            >
              <div>
                <a 
                  :style="{
                    'color': getFilteredSubmissions(assignment?.submissions ?? []).length > 0 ? '#000000' : '#888888'
                  }"
                  style='cursor: pointer;' @click='currentGroup = group; console.log(assignment); openModal(assignment)'>{{assignment.name}}</a> (<span>{{getFilteredSubmissions(assignment.submissions).length}}</span><span v-else>...</span>)
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

        <div v-if='showModal && !preparingDocument' @click="if(!preparingDocument) showModal = false;" class='btech-modal' style='display: inline-block;'>
          <div class='btech-modal-content' @click.stop>
            <div class="icon-container" style='float: right; margin-right: .5rem; margin-top: .5rem;' v-on:click='close()'>
              <i class="icon-end"></i> 
            </div>
            <div class='btech-modal-content-inner'>
              <h2><a target='#' v-bind:href="'/courses/'+courseId+'/assignments/'+currentAssignment.id">{{currentAssignment.name}}</a></h2>
              <div v-if='getFilteredSubmissions(submissions).length > 0'>
                <div
                  class="submission-row"
                >
                  <span>
                  </span>
                  <span>
                  </span>
                  <span>
                    <b>Student Name</b>
                  </span>
                  <span>
                    <b>Enroll Type</b>
                  </span>
                  <span>
                    <b>Score</b>
                  </span>
                  <span>
                    <b>Has Rubric?</b>
                  </span>
                  <span>
                    <b>Has Comments?</b>
                  </span>
                  <span>
                    <b>Date Submitted</b>
                  </span>
                  <span>
                    <b>Campus</b>
                  </span>
                </div>

                <div class="submission-row" v-for='submission in getFilteredSubmissions(submissions)'>
                  <div class='icon-container'>
                    <i class='icon-download' @click='downloadSubmission(currentAssignment, submission)'></i>
                  </div>
                  <div class='icon-container'>
                    <a target='#' v-bind:href="'/courses/'+courseId+'/assignments/'+currentAssignment.id+'/submissions/'+submission.user.id">
                      <i class='icon-student-view'></i>
                    </a>
                  </div>
                  <span>
                    {{anonymous ? ('Anonymous User ' + submission.user.id) : submission.user.name}}
                  </span>
                  <span>
                    {{enrollmentTypes?.[submission.user.id] ?? ''}}
                  </span>
                  <span>
                    {{Math.round(submission.score / currentAssignment.pointsPossible * 1000) / 10}}%
                  </span>
                  <span>
                    <i v-if="submission?.rubric_assessments?.length > 0" class='icon-check'></i>
                  </span>
                  <span>
                    <i v-if="submission?.comments?.length > 0" class='icon-check'></i>
                  </span>
                  <span>
                    {{dateToString(getSubmissionDate(submission))}}
                  </span>
                  <span>
                    {{campuses?.[submission.user.id] ?? 'Loading...'}}
                  </span>
                </div>

                <div v-else>
                  No graded submissions found. There may be submissions pending grading.
                </div>
              </div>
          </div>
        </div>
      </div>`);
      await $.getScript("https://cdn.jsdelivr.net/npm/vue@2.6.12");
      new Vue({
        el: "#accreditation",
        mounted: async function () {
          this.courseId = CURRENT_COURSE_ID;
          let data = await this.getGraphQLData(this.courseId);
          this.courseData = {
            name: data.name,
            course_code: data.course_code
          }
          let courseCode = this.courseData.course_code;
          this.assignmentGroups = data.assignment_groups;
          this.loadingCourse = false;

          let sections = await canvasGet("/api/v1/courses/" + this.courseId + "/sections?include[]=students")
          this.sections = sections;

          // Load campus information
          for (let s in sections) {
            let section = sections[s];
            for (let st in section.students) {
              let student = section.students[st];
              let userData = await bridgetools.req(`https://reports.bridgetools.dev/api/students/${student.id}`);
              if (!(student.id in this.enrollmentTypes)) {
                this.enrollmentTypes[student.id] = userData.enrollment_type;
              }
              if (!(student.id in this.campuses)) {
                this.campuses[student.id] = '';
                if (userData.courses?.[courseCode]?.campus) {
                  let campus = userData.courses?.[courseCode]?.campus;
                  if (campus == 'LC') campus = 'Logan Campus';
                  else if (campus == 'BC') campus = 'Brigham City Campus';
                  this.campuses[student.id] = campus;
                }
              }
            }
          }
        },
        data: function () {
          return {
            anonymous: false,
            assignmentGroups: {},
            courseData: {},
            enrollments: [],
            courseId: null,
            currentUser: '',
            showModal: false,
            preparingDocument: false,
            submissions: [],
            currentAssignment: {},
            startDate: null,
            endDate: null,
            sections: [],
            section: '',
            needsToWait: false,
            sortBy: "name",
            campuses: {},
            enrollmentTypes: {},
            loadingCourse: true
          }
        },
        methods: {
          getSubmissionDate(submission) {
            let date = submission.submittedAt;
            if (date === null) {
              date = submission.gradedAt;
            }
            return date;
          },

          // a filter to determine which submissions display and which don't
          getFilteredSubmissions(submissions) {
            let app = this;
            let startDate = app.startDate;
            let endDate = app.endDate;
            let sectionId = app.section;
            let selectedSection = null;
            if (sectionId !== '') {
              for (let s = 0; s < app.sections.length; s++) {
                let section = app.sections[s];
                if (section.id === sectionId) {
                  selectedSection = section;
                  break;
                }
              }
            }
            let includedStudents = [];
            if (selectedSection !== null) {
              let sectionStudents = selectedSection.students;
              for (let s = 0; s < sectionStudents.length; s++) {
                includedStudents.push(sectionStudents[s].id);
              }
            }

            let output = [];
            for (let s = 0; s < submissions.length; s++) {
              let submission = submissions[s];
              //date filter
              let checkDate = false;
              let date = app.getSubmissionDate(submission);
              if (date !== null) {
                if ((date >= startDate || startDate === null) && (date <= endDate || endDate === null)) {
                  checkDate = true;
                }
              }

              //section filter
              //begins true for default of include all, but filter if there is a selected section
              let checkSection = true;
              if (selectedSection !== null) {
                checkSection = includedStudents.includes(submission.user_id);
              }

              let submitted = true;
              if (submission.submissionStatus == 'unsubmitted' && submission.rubric_assessments.length == 0) {
                submitted = false;
              }

              //check all filters
              if (checkDate && checkSection && submitted) {
                output.push(submission);
              }
            }
            return output;
          },

          async getCourseMeta(courseId) {
            const query = `
              query {
                course(id: "${courseId}") {
                  id
                  name
                  courseCode
                  assignmentGroupsConnection {
                    nodes {
                      id
                      name
                      groupWeight
                      state
                    }
                  }
                }
              }
            `;

            const res = await $.post(`/api/graphql`, { query });
            return res.data.course;
          },

          async getAssignments(groupId) {
            let allAssignments = [];
            let hasNextPage = true;
            let after = null;

            while (hasNextPage) {
              const query = `
                query {
                  assignmentGroup(id: "${groupId}") {
                    _id

                    assignmentsConnection(first: 50${after ? `, after: \"${after}\"` : ''}) {
                      quiz {
                        _id
                      }
                      pageInfo {
                        hasNextPage
                        endCursor
                      }
                      nodes {
                        _id
                        name
                        published
                        pointsPossible
                      }
                    }
                  }
                }
              `;

              const res = await $.post(`/api/graphql`, { query });
              const connection = res.data.assignmentGroup.assignmentsConnection;
              allAssignments = allAssignments.concat(connection.nodes);
              hasNextPage = connection.pageInfo.hasNextPage;
              after = connection.pageInfo.endCursor;
            }
            allAssignments.map(assn => {
              assn.id = assn._id;
              assn.quiz_id = assn?.quiz?._id;
            });


            return allAssignments;
          },

          async getSubmissions(assignmentId) {
            let allSubmissions = [];
            let hasNextPage = true;
            let after = null;

            while (hasNextPage) {
              const query = `
                query {
                  assignment(id: "${assignmentId}") {
                    _id
                    quiz {
                      _id
                    }
                    submissionsConnection(
                      first: 50${after ? `, after: \"${after}\"` : ''},
                      filter: { includeConcluded: true, includeDeactivated: true, includeUnsubmitted: false },
                      orderBy: { field: username }
                    ) {
                      pageInfo {
                        hasNextPage
                        endCursor
                      }

                      nodes {
                        user {
                          id
                          name
                          _id
                        }
                        submissionType
                        submissionStatus
                        submittedAt
                        gradedAt
                        postedAt
                        updatedAt
                        url
                        score
                        attempt
                        body
                        createdAt
                        deductedPoints
                        enteredGrade
                        excused
                        extraAttempts
                        grade
                        late
                        previewUrl
                        submissionCommentDownloadUrl
                        attachments {
                          url
                          updatedAt
                          createdAt
                          displayName
                          contentType
                        }
                        commentsConnection {
                          nodes {
                            comment
                            _id
                            htmlComment
                            createdAt
                            author {
                              name
                            }
                          }
                        }
                        rubricAssessmentsConnection {
                          nodes {
                            score
                            assessmentType
                          }
                        }
                      }
                    }
                  }
                }
              `;

              const res = await $.post(`/api/graphql`, { query });
              const connection = res.data.assignment.submissionsConnection;
              allSubmissions = allSubmissions.concat(connection.nodes);
              hasNextPage = connection.pageInfo.hasNextPage;
              after = connection.pageInfo.endCursor;
            }

            return allSubmissions;
          },

          async getGraphQLData(courseId) {
            try {
              const meta = await this.getCourseMeta(courseId);
              const assignmentGroups = meta.assignmentGroupsConnection.nodes.filter(g => g.state === 'available');

              for (let group of assignmentGroups) {
                group.assignments = await this.getAssignments(group.id);

                for (let assignment of group.assignments) {
                  const submissions = await this.getSubmissions(assignment._id);

                  assignment.submissions = submissions.map(sub => ({
                    ...sub,
                    quiz_id: sub?.quiz?._id,
                    user: {
                      id: sub.user._id,
                      name: sub.user.name
                    },
                    comments: sub.commentsConnection?.nodes || [],
                    rubric_assessments: sub.rubricAssessmentsConnection?.nodes || []
                  }));
                }
              }

              return {
                id: courseId,
                name: meta.name,
                course_code: meta.courseCode,
                assignment_groups: assignmentGroups
              };
            } catch (err) {
              console.error(err);
              return {
                name: '',
                assignment_groups: [],
              };
            }
          },

          plainCommentToHTML(comment) {
            // Split the comment by newlines
            const paragraphs = comment.split('\n');
            
            // Filter out any empty paragraphs and wrap each in <p> tags
            const htmlParagraphs = paragraphs
              .filter(paragraph => paragraph.trim() !== "") // Remove any empty lines
              .map(paragraph => `<p>${paragraph}</p>`);     // Wrap each in <p> tags
            
            // Join the array into a single string of HTML
            return htmlParagraphs.join('');
          },
          // api call to load comments for a submission
          getComments(submission) {
            let comments = submission.comments;
            let el = "";
            if (comments.length > 0) {
              el = $("<div style='page-break-before: always;' class='btech-accreditation-comments'></div>")
              el.append("<h2>Comments</h2>")
              for (let i = 0; i < comments.length; i++) {
                let comment = comments[i];
                let commentEl = $(`<div class='btech-accreditation-comment' style='border-bottom: 1px solid #000;'>
                  ${this.plainCommentToHTML(comment.comment)}
                  <p style='text-align: right;'><i>-${comment?.author?.name ?? 'automated comment'}, ${this.dateToString(comment.createdAt)}</i></p>
                </div>`);
                el.append(commentEl);
              }
            }
            return el;
          },

          async downloadAttachments(attachments) {
              for (let i = 0; i < attachments.length; i++) {
                  const attachment = attachments[i];
                  await this.downloadSingleAttachment(attachment);
              }
          },

          downloadSingleAttachment(attachment) {
            return new Promise((resolve) => {
              window.open(attachment.url, '_blank'); // Opens each URL in a new tab
              setTimeout(resolve, 100); // Slight delay to ensure each attachment has time to open
            });
          },

          //THIS IS WHERE EVERYTHING GETS SORTED OUT AND ALL THE DOWNLOADS ARE INITIATED
          async downloadSubmission(assignment, submission) {
            let app = this;
            let type = submission.submissionType;
            console.log(submission);
            app.preparingDocument = true;

            //this needs to be set or it will flip preparing Document to false at the end, IE if it will be pulling up a print screen, set this to true
            app.needsToWait = false;

            //vanilla quizzes
            //need to append comments to this
            if (type == 'online_quiz') {
              console.log(assignment);

              let url = '/courses/' + app.courseId + '/assignments/' + assignment.id + '/submissions/' + submission.user.id + '?preview=1';
              await app.createIframe(url, app.downloadQuiz, {
                'submission': submission,
                'assignment': assignment
              });
              app.needsToWait = true;
            }

            if (type == 'discussion_topic') {
              let url = '/courses/' + app.courseId + '/assignments/' + assignment.id + '/submissions/' + submission.user.id + '?preview=1';
              await app.createIframe(url, app.downloadDiscussion, {
                'submission': submission,
                'assignment': assignment
              });
              app.needsToWait = true;
            }

            //text entry for assignments
            //append comments here and pull them from rubrics. If no text entry, just grab the comments

            //rubrics
            if (submission.rubric_assessments.length > 0) {
              let url = "/courses/" + app.courseId + "/assignments/" + assignment.id + "/submissions/" + submission.user.id;
              await app.createIframe(url, app.downloadRubric, {
                'submission': submission,
                'assignment': assignment
              });
              app.needsToWait = true;
            } else {
              let url = "/courses/" + app.courseId + "/assignments/" + assignment.id + "/submissions/" + submission.user.id;
              console.log("DOWNLOAD COMMENTS");
              await app.createIframe(url, app.downloadComments, {
                'submission': submission,
                'assignment': assignment
              });
              app.needsToWait = true;
            }
            if (submission?.attachments?.length > 0) {
              await this.downloadAttachments(submission.attachments);
              // console.log(submission);
              // console.log(submission.attachments.length);
              // for (let i = 0; i < submission.attachments.length; i++) {
              //   let attachment = submission.attachments[i];
              //   setTimeout(() => {
              //     let a = document.createElement('a');
              //     a.href = attachment.url;
              //     a.download = (attachment.displayName || 'download');
              //     document.body.appendChild(a);
              //     a.click();
              //     document.body.removeChild(a);
              //     console.log(i);
              //     console.log(a.download);
              //   }, i * 100); // delay of 100ms between each attachment
              // }
            }

            //check if nothing has been gotten
            if (app.needsToWait === false) {
              app.preparingDocument = false;
            }
          },
          // getDiscussionEntries(submission) {
          //   let returnString = "";
          //   if (submission.discussion_entries != undefined) {
          //     returnString += "<div style='page-break-before: always;' class='btech-accreditation-comments'></div>"
          //     returnString += "<h2>User Discussion Entries</h2>"
          //     let entries = submission.discussion_entries;
          //     for (let e in entries) {
          //       let entry = entries[e];
          //       if (entry.user_id == submission.user_id) {
          //         returnString += `
          //         ${entry.message}
          //         <p style="float: right;">Created: <i>${entry.created_at}</i></p>
          //         <p></p>
          //         `
          //       }
          //     }
          //   }
          //   return returnString;
          // },
          checkLTI(submission) {
            let type = submission.submissionType;
            //new quizzes :(
            if (type === 'basic_lti_launch') {
              let url = submission.previewUrl;
              window.open(url, '_blank');
            }
            if (type == 'external_tool') {
              alert(`This is an assignment handled by a third party tool. You will need to pull evidence from the tool directly.`);
            }
          },
          async downloadComments(iframe, content, data) {
            let app = this;
            let elId = iframe.attr('id');
            let title = this.getTitle(data) + " submission comments"
            let commentEl = app.getComments(data.submission);
            /*
            if (commentEl == "") {
              app.preparingDocument = false;
              return; //break if no comments
            }
            */

            // content.show();
            this.addRequiredInformation(content, data.submission, data.assignment)

            content.append(commentEl); //Comments already show up with this download method. Only need to be appended for rubrics
            let window = document.getElementById(elId).contentWindow;
            let ogTitle = $('title').text();
            $('title').text(title);
            window.onafterprint = (event) => {
              $('title').text(ogTitle);
              app.preparingDocument = false;
              app.checkLTI(data.submission);
              iframe.remove();
            }
            window.focus();
            window.print();
            return;
          },
          addRequiredInformation(el, submission, assignment) {
            console.log(submission);
            //Prepend in reverse order of the order you want it to appear at the top
            el.prepend("<p>Submitted: <span style='background-color: #FF0;'>" + this.getSubmissionDate(submission) + "</span></p>");
            el.prepend("<p>Student: <span style='background-color: #FF0;'>" + (this.anonymous ? ('Anonymous User ' + submission.user.id) : submission.user.name) + "</span></p>");
            if (this.campuses?.[submission.user.id] ?? '' != '') {
              content.prepend("<p>Campus: <span style='background-color: #FF0;'>" + this.campuses[submission.user.id] + "</span></p>");
            }
            el.prepend("<p>Title: <span style='background-color: #FF0;'>" + assignment.name + "</span></p>");
            el.prepend("<p>Course: <span style='background-color: #FF0;'>" + this.courseData.name + " (" + this.courseData.course_code + ")" + "</span></p>");
          },
          getTitle(data) {
            console.log(data);
            let title = this.courseData.name + ' - ' + data.assignment.name + ' - ' + (this.anonymous ? ('Anonymous User ' + data.submission.user.id) : data.submission.user.name);
            return title;
          },
          async downloadRubric(iframe, content, data) {
            let app = this;
            let title = this.getTitle(data) + " submission rubric";
            // Wait for the iframe to load
            await new Promise(resolve => {
              $(iframe).on('load', function() {
                let iframeContent = $(this).contents();
    
                // Check if #rubric_holder is present
                let rubricHolder = iframeContent.find("#rubric_holder");
                if (rubricHolder.length > 0) {
                  rubricHolder.show();
                  app.addRequiredInformation(rubricHolder, data.submission, data.assignment);
                  // rubricHolder.prepend(`<div>${data.submission.body}</div>`);
                  let commentEl = app.getComments(data.submission);
                  rubricHolder.append(commentEl);
                  rubricHolder.css({
                    'max-height': '',
                    'overflow': 'visible'
                  });
                  let comments = rubricHolder.find('[data-selenium="criterion_comments_text"]');
                  for (let c = 0; c < comments.length; c++) {
                      let comment = comments[c];
                      console.log(comment);
                      $(comment).css({
                        'height': '10rem',
                        'width': '30rem'
                      });
                  }
  
                  // Continue with the rest of your function
                  let ogTitle = $('title').text();
                  $('title').text(title);
                  rubricHolder.printThis({
                    pageTitle: title,
                    afterPrint: function () {
                      $('title').text(ogTitle);
                      app.preparingDocument = false;
                      app.checkLTI(data.submission);
                      iframe.remove();
                    }
                  });
  
                  resolve(); // Resolve the promise once everything is done
                } else {
                  console.error("#rubric_holder not found");
                  resolve(); // Resolve the promise even if #rubric_holder is not found
                }
              });
            });
          },
        
          //Not currently working because of CORS
          async downloadNewQuiz(iframe, content, data) {
            let app = this;
            let elId = iframe.attr('id');
            let id = elId.replace('btech-content-', '');
            let title = this.getTitle(data) + " submission"
            this.addRequiredInformation(content, data.submission, data.assignment);
            let commentEl = app.getComments(data.submission);
            content.append(commentEl);
            let ogTitle = $('title').text();
            $('title').text(title);
            let window = document.getElementById(elId).contentWindow;
            window.onafterprint = (event) => {
              $('title').text(ogTitle);
              app.preparingDocument = false;
              // iframe.remove();
            }
            window.focus();
            window.print();
            return;
          },
          async downloadDiscussion(iframe, content, data) {
            let app = this;
            let elId = iframe.attr('id');
            let id = elId.replace('btech-content-', '');
            let title = this.getTitle(data) + " submission"
            this.addRequiredInformation(content, data.submission, data.assignment);
            let commentEl = app.getComments(data.submission);
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
          async downloadQuiz(iframe, content, data) {
            let app = this;
            let elId = iframe.attr('id');
            let id = elId.replace('btech-content-', '');
            let title = this.getTitle(data) + " submission";

            this.addRequiredInformation(content, data.submission, data.assignment);
            let commentEl = app.getComments(data.submission);
            content.append(commentEl);

            let ogTitle = $('title').text();
            $('title').text(title);

            let win = document.getElementById(elId).contentWindow;
            let doc = win.document;

            // Inject "Correct"/"Incorrect" labels in printable format
            const injectPrintLabels = () => {
              const arrows = doc.querySelectorAll('.answer_arrow.correct, .answer_arrow.incorrect');
              arrows.forEach(el => {
                if (el.classList.contains('injected')) return;

                const label = doc.createElement('div');
                label.textContent = (el.classList.contains('correct') ? '✔ ' : '✘ ') + el.textContent.trim();
                label.style.fontWeight = 'bold';
                label.style.fontSize = '14px';
                label.style.marginBottom = '4px';
                label.style.color = el.classList.contains('correct') ? 'green' : 'red';
                label.classList.add('printable-feedback');

                let parentAnswer = el.closest('.answer') || el.closest('.answers_wrapper') || el.parentElement;
                if (parentAnswer) {
                  parentAnswer.insertBefore(label, parentAnswer.firstChild);
                  el.classList.add('injected');
                  el.style.display = 'none';
                }
              });
            };

            // Wait until iframe content is fully loaded
            if (doc.readyState === 'complete') {
              injectPrintLabels();
              win.focus();
              win.onafterprint = () => {
                $('title').text(ogTitle);
                app.preparingDocument = false;
                iframe.remove();
              };
              win.print();
            } else {
              // If iframe content is still loading, wait for it
              iframe.on('load', () => {
                injectPrintLabels();
                win.focus();
                win.onafterprint = () => {
                  $('title').text(ogTitle);
                  app.preparingDocument = false;
                  iframe.remove();
                };
                win.print();
              });
            }

            return;
          },

          async createIframe(url, func = null, data = {}) {
            let id = genId();
            let elId = 'btech-content-' + id
            let iframe = $('<iframe id="' + elId + '" style="width: 1200px;" src="' + url + '"></iframe>');
            iframe.hide();

            $("#content").append(iframe);
            //This is unused. was for trying to convert an html element to a canvas then to a data url then to image then to pdf, but ran into cors issues.
            // $("#content").append("<div id='btech-export-" + id + "'></div>");
            let window = document.getElementById(elId).contentWindow;
            window.onload = function () {
              let content = $(window.document.getElementsByTagName('body')[0]);
              let imgs = content.find('img'); // I believe this was done just to make sure the images were fully loaded. Was running into issues with quizzes where images didn't have a chance to load all the way. 
              if (func !== null) {
                func(iframe, content, data);
              }
            }
            return iframe;
          },

          async openModal(assignment) {
            let app = this;
            app.showModal = true;
            app.currentAssignment = assignment;
            app.submissions = [];
            // if (assignment.submissions.length == 0) {
            //   await app.getAllSubmissions(assignment.id);
            // }
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
          dateToString(date) {
            date = new Date(Date.parse(date));
            return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
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
