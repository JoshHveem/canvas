  /*
    There are two pieces to this tool, the first is view on the submissions page which is a table created with Vue that allows teachers and students to review the student's submissions
    The second is the assignment page, where the student will select a service and submit it.
    It stores points and service options in a rubric. Rubric description = service. Max points = required submissions.
    It stores submission data in comments. Each submission is given and id and then the comment stores information like the id, the service performed, etc. 
    When reviewed, a matching commment with the same ID is added along with whether it was confirmed or rejected.

    I recommend breaking up Services into as small of chunks as is manageable because there could easily be 1000s of comments otherwise
  */
  //DEMO HERE:
  //https://btech.beta.instructure.com/courses/470598
  (async function () {
    IMPORTED_FEATURE = {};
    //IF the editor, add the ability to add services
    if (TOOLBAR.checkEditorPage()) {
      await TOOLBAR.checkReady();

      function checkButtonColor(btn) {
        let body = tinyMCE.activeEditor.getBody();
        let services = $(body).find("#btech-services");
        if (services.length === 0) {
          btn.find('i').css({
            'color': "#000000"
          });
        } else {
          btn.find('i').css({
            'color': "#d22212"
          });
        }
      }
      let btn = await TOOLBAR.addButtonIcon("far fa-concierge-bell", "Convert this assignment to a Services assignment", async function () {
        let body = tinyMCE.activeEditor.getBody();
        let services = $(body).find("#btech-services");
        if (services.length === 0) {
          $(body).prepend(`
            <div id='btech-services' style='border: 1px solid #000;'>DO NOT DELETE. THIS SETS THIS ASSIGNMENT AS A #SERVICES# ASSIGNMENT</div><p> </p>
          `);
        } else {
          services.remove();
        }
      });
      checkButtonColor(btn);
      btn.click(function () {
        checkButtonColor(btn);
      });
    }

    //GRADING VIEW
    //This one has to come first so it doesn't have the submission view run on the grading page
    if (/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/.test(window.location.pathname)) {

      if (ENV.current_user_roles.includes("teacher")) {
        IMPORTED_FEATURE = {
          initiated: false,
          async _init(params = {}) {
            //NEEDS
            ////TOP PRIORITY: Need to handle pagination for comments since there will be more than 100
            ////Checks on if a student has already submitted their max number of submissions, at least a warning, probably not a hard block
            ////Allow students to see everything except for the review tab so they can see their summary, submitted, and rejected info too
            ////Allow the color themes to affect the color of the buttons and display in both teacher view and student view
            ////Option to delete a submission, which will delete that comment and all other comments with the submission id

            let vueString = `
              <div style="padding:10px;" id='app-services'>
                <div class="btech-tabs-container">
                  <div class="btech-tabs">
                  <ul>
                    <li v-for="menuName, key in menus" :class="{active: menu==menuName}" @click="menu=menuName">{{menuName}}</li>
                    <li v-if="flaggedDates.length > 0" :class="{active: menu=='flagged'}" @click="menu='flagged'">flagged dates</li>
                  </ul>
                  </div>
                  <div style="padding: 10px;">

                    <div v-if="menu == 'review'">
                      <div v-if="loading==true">Loading Content...</div>
                      <div v-else>
                        <h3>Select a service and submit to confirm a student pass off.</h3>
                        <select v-model="selectedCriterion">
                          <option value="" disabled>-Select Service-</option>
                          <option v-for="criterion in criteria" :value="criterion.description">{{criterion.description}} ({{criterion.points_current}}/{{criterion.points}} completed)</option>
                        </select>
                        <input v-model='criterionNumber' width='64px' type='number' min='1'>
                        <textarea style="width: 100%; box-sizing: border-box;" v-model="reviewerComment" placeholder="You may leave a comment about the student's performance here."></textarea>
                        <br>
                        <div id="btech-services-confirm" v-on:click="confirmCurrentService()" class="Button">Submit</div>
                      </div>
                    </div>

                    <div v-if="menu == 'completed'">
                      <p>Select a Service from the dropdown below to review completed submissions</p>
                      <select v-model="selectedCompletedCriterion">
                        <option value="">-Select Service-</option>
                        <option v-for="criterion in criteria" :value="criterion.description">{{criterion.description}} ({{criterion.points_current}}/{{criterion.points}} completed)</option>
                      </select>
                      <input type="date" v-model="completedCriterionDate" min="2018-01-01">
                      <br>
                      <div v-for="service in services">
                        <div v-if="(service.service === selectedCompletedCriterion || selectedCompletedCriterion === '') && (completedCriterionDate === '' || dateToString(completedCriterionDate) == dateToString(service.canvas_data.created_at))" style="border: 1px solid #000; padding: 20px; margin-bottom: 20px;">
                          <div style='float: right; user-select: none; cursor: pointer;' @click='deleteService(service)'>X</div>
                          <h3 v-if="(selectedCompletedCriterion === '')"><b>{{service.service}}</b></h3>
                          <p><b>Completed: </b>{{dateToString(service.canvas_data.created_at)}}</p>
                          <p><b>Reviewer: </b>{{service.author_data.display_name}}</p>
                          <blockquote v-if="service.comments!=''">{{service.comments}}</blockquote>
                        </div>
                      </div>
                    </div>

                    <div v-if="menu === 'progress'">
                      <div>Progress: {{Math.round(totalProgress * 100)}}%</div>
                      <br>
                      <div v-for="criterion in criteria">
                          {{criterion.description}}: {{criterion.points_current}} / {{criterion.points}} completed ({{Math.round((criterion.points_current / criterion.points) * 100)}}%)
                      </div>
                    </div>

                    <div v-if="menu === 'flagged'">
                      <div v-for="date in flaggedDates">{{date}} ({{minToHoursString(hoursSubmittedInDate(date))}})</div>
                    </div>

                  </div>
                </div>
              </div>`;
            let rPieces = /^\/courses\/([0-9]+)\/assignments\/([0-9]+)\/submissions\/([0-9]+)/;
            let pieces = window.location.pathname.match(rPieces);
            let courseId = parseInt(pieces[1]);
            let studentId = parseInt(pieces[3]);
            let assignmentId = parseInt(pieces[2]);
            let description = '';
            await $.get("/api/v1/courses/" + courseId + "/assignments/" + assignmentId, function (data) {
              description = data.description;
            });
            if (description.includes("#SERVICES#")) {
              let rURL = /^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/
              if (rURL.test(window.location.pathname)) {
                $("div.submission-details-frame iframe").hide();
                $("div.submission-details-frame").append(vueString);
                await getElement("#app-services");
                new Vue({
                  el: '#app-services',
                  data: function () {
                    return {
                      menu: 'review',
                      menus: [
                        'review',
                        'completed',
                        'progress'
                      ],
                      loading: true,
                      courseid: 0,
                      assignmetnId: 0,
                      studentId: 0,
                      comments: [],
                      services: {},
                      completedServices: [],
                      criteria: {},
                      selectedCriterion: '',
                      criterionNumber: 1,
                      selectedCompletedCriterion: '',
                      reviewerComment: '',
                      completedCriterionDate: '',
                      dates: [],
                      flaggedDates: []
                    }
                  },
                  mounted: async function () {
                    let rPieces = /^\/courses\/([0-9]+)\/assignments\/([0-9]+)\/submissions\/([0-9]+)/;
                    let pieces = window.location.pathname.match(rPieces);
                    this.courseId = parseInt(pieces[1]);
                    this.studentId = parseInt(pieces[3]);
                    this.assignmentId = parseInt(pieces[2]);
                    this.criteria = await this.getCriteria();
                    this.comments = await this.getComments();
                    this.processComments(this.comments);
                    this.loading = false;
                  },
                  computed: {
                    totalProgress: function () {
                      let points = 0;
                      let maxPoints = 0;
                      for (let name in this.criteria) {
                        let criterion = this.criteria[name];
                        points += criterion.points_current;
                        maxPoints += criterion.points;
                      }
                      return points / maxPoints;
                    },
                  },
                  methods: {
                    deleteService: async function (service) {
                      //Needs to update the rubric before this can be used
                      /*
                      for (let s = 0; s < this.services.length; s++) {
                        if (this.services[s] === service) {
                          await $.delete(window.location.origin + "/submission_comments/" + this.services[s].comment_id);
                          this.services.splice(s, 1);
                        }
                      }
                      */
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
                        // this.selectedCompletedCriterion this.completedCriterionDate
                      }
                      return total;
                    },
                    createComment(service, comment) {
                      let text = `SERVICE: ` + service + `\nCOMMENT: ` + comment;
                      return text;
                    },
                    dateToString(date) {
                      date = new Date(Date.parse(date));
                      return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
                    },
                    async confirmCurrentService() {
                      let service = this.selectedCriterion;
                      if (service != "") {
                        this.loading = true;
                        let url = "/api/v1/courses/" + this.courseId + "/assignments/" + this.assignmentId + "/submissions/" + this.studentId;
                        this.criteria[service].points_current += parseInt(this.criterionNumber);
                        let rubricData = {};
                        for (var key in this.criteria) {
                          rubricData[this.criteria[key].id] = {
                            points: this.criteria[key].points_current
                          };
                        }
                        this.loading = true;
                        for (let i = 1; i <= this.criterionNumber; i++) {
                          $.put(url, {
                            comment: {
                              text_comment: this.createComment(service, this.reviewerComment)
                            },
                            rubric_assessment: rubricData
                          });
                        }
                        location.reload(true);
                      }
                    },
                    async getComments() {
                      let url = "/api/v1/courses/" + this.courseId + "/assignments/" + this.assignmentId + "/submissions/" + this.studentId;
                      let comments = [];
                      let data = await canvasGet(url, {
                        include: [
                          'submission_comments'
                        ]
                      });
                      comments = data[0].submission_comments;
                      console.log(comments);
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
                    async getCriteria() {
                      let url = "/api/v1/courses/" + this.courseId + "/assignments/" + this.assignmentId;
                      let criteria = {};
                      await $.get(url, function (data) {
                        for (let i = 0; i < data.rubric.length; i++) {
                          let criterion = data.rubric[i];
                          //look to see if time data was provided
                          criterion.average_time = 0;
                          let rPieces = /([0-9]+) min/;
                          let pieces = criterion.long_description.match(rPieces);
                          if (pieces !== null) {
                            criterion.average_time = parseInt(pieces[1]);
                          }
                          criterion.points_current = 0;
                          criteria[criterion.description] = criterion;
                        }
                      });
                      return criteria;
                    },
                    processComments(canvasCommentsData) {
                      this.completedServices = [];
                      this.rejectedServices = [];
                      this.pendingServices = [];
                      this.services = [];
                      for (let c = 0; c < canvasCommentsData.length; c++) {
                        let comment = canvasCommentsData[c].comment;
                        let authorData = canvasCommentsData[c].author;
                        let date = this.dateToString(canvasCommentsData[c].created_at);
                        let cService = this.getCommentData(comment, "SERVICE");
                        if (authorData.id !== this.studentId) {
                          if (cService !== "" && cService !== "undefined") {
                            let cService = this.getCommentData(comment, "SERVICE");
                            let cComment = this.getCommentData(comment, "COMMENT");
                            //Check if it's a student comment or a teacher confirmation
                            this.services.push({
                              service: cService,
                              comments: cComment,
                              author_data: authorData,
                              canvas_data: canvasCommentsData[c],
                              comment_id: canvasCommentsData[c].id
                            });
                            if (!this.dates.includes(date)) {
                              this.dates.push(date);
                            }
                            this.criteria[cService].points_current += 1;
                          }
                        }
                      }
                      for (var i = 0; i < this.dates.length; i++) {
                        let date = this.dates[i];
                        if (this.hoursSubmittedInDate(date) > (4 * 60)) {
                          this.flaggedDates.push(date);
                        }
                      }
                    },
                  },
                });
              }
            }
          }
        }
      }
      //SUBMISSION VIEW
    } else if (/^\/courses\/[0-9]+\/assignments\/[0-9]+/.test(window.location.pathname)) {
      //Just add in a div with the id:  btech-services-modal
      IMPORTED_FEATURE = {
        initiated: false, //SET TO TRUE WHEN feature() IS RUN FROM THE custom_canvas.js PAGE TO MAKE SURE FEATURE ISN'T INITIATED TWICE
        _init(params = {}) { //SOME FEATURES NEED CUSTOM PARAMS DEPENDING ON THE USER/DEPARTMENT/COURSE SUCH AS IF DENTAL HAS ONE SET OF RULES GOVERNING FORMATTING WHILE BUSINESS HAS ANOTHER
          let contents = $("div.user_content").html();
          //should start of hidden from the default css
          $("#btech-services").empty();
          $("#btech-services").append("");
          //add in whatever should appear in here.
          ////one option is a selector for teachers to select a student or a link to the student's grades page if it's the student
        }
      }
    }
  })();