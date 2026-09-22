(()=>{(async function(){if(document.title==="BTECH Accreditation"){if($("#accreditation").length>0)return;let y=/^\/courses\/([0-9]+)/;if(y.test(window.location.pathname)){add_javascript_library("https://cdn.jsdelivr.net/npm/vue@2.6.12"),add_javascript_library("https://cdnjs.cloudflare.com/ajax/libs/printThis/1.15.0/printThis.min.js"),add_javascript_library("https://html2canvas.hertzen.com/dist/html2canvas.min.js"),add_javascript_library("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.1.1/jspdf.umd.js"),add_javascript_library("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js"),add_javascript_library("https://cdn.jsdelivr.net/npm/file-saver@2.0.2/dist/FileSaver.min.js");let v=parseInt(window.location.pathname.match(y)[1]);await $.put(`https://btech.instructure.com/api/v1/courses/${v}/gradebook_settings`,{gradebook_settings:{show_concluded_enrollments:!0}});let _=`
      <div>
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
            <option
              v-for='sectionIndex in sections.length'
              :key="'section-' + sectionIndex"
              :value='sections[sectionIndex - 1].id'
            >
              {{sections[sectionIndex - 1].name}}
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
          <div v-for='groupIndex in assignmentGroups.length' :key="'group-' + groupIndex">
            <h2>{{assignmentGroups[groupIndex - 1].name}}</h2>
            <div 
              v-for='assignment in assignmentGroups[groupIndex - 1].assignments'
              :key='assignment.id'
              :style="{
                'color': getFilteredSubmissions(assignment?.submissions ?? []).length > 0 ? '#000000' : '#888888'
              }"
            >
              <div>
                <a 
                  :style="{
                    'color': getFilteredSubmissions(assignment?.submissions ?? []).length > 0 ? '#000000' : '#888888'
                  }"
                  style='cursor: pointer;' @click='currentGroup = assignmentGroups[groupIndex - 1]; openModal(assignment)'>{{assignment.name}}</a> (<span>{{getFilteredSubmissions(assignment.submissions).length}}</span><span v-else>...</span>)
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
              <div v-if='loadingAssignmentDetails'>
                Loading assignment details...
              </div>
              <div v-else-if='getFilteredSubmissions(submissions).length > 0'>
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
      </div>`;$("#content").html("<div id='accreditation'><div id='accreditation-app'></div></div>"),await $.getScript("https://cdn.jsdelivr.net/npm/vue@2.6.12"),new Vue({el:"#accreditation-app",template:_,mounted:async function(){this.courseId=v;let e=await this.getGraphQLData(this.courseId);this.courseData={name:e.name,course_code:e.course_code};let t=this.courseData.course_code;this.assignmentGroups=e.assignment_groups,this.loadingCourse=!1;let s=await canvasGet("/api/v1/courses/"+this.courseId+"/sections?include[]=students");this.sections=s;let i=n=>{if(n!=null&&n.sis_data__is_distance_approved)return"Online";let r=String((n==null?void 0:n.sis_data__campus_code)||"").trim().toUpperCase();return r==="L"?"Logan Campus":r==="B"?"Brigham City Campus":r},a=(n,r)=>{let l=String((n==null?void 0:n.sis_data__course_type)||"").trim().toUpperCase();return l||(r.toLowerCase().includes("hs")?"HS":r!==""?"CS":"")},o=n=>{let r=0;return n!=null&&n.is_deleted||(r+=100),n!=null&&n.is_active&&(r+=50),n!=null&&n.is_concluded||(r+=25),n!=null&&n.exit_date||(r+=10),r},c={};try{let n=await bridgetools.req3("canvas_enrollments",{canvas_course_id:{op:"=",value:this.courseId}},{include:["sis_data"]}),r=Array.isArray(n==null?void 0:n.data)?n.data:[];for(let l=0;l<r.length;l++){let d=r[l],u=d==null?void 0:d.canvas_user_id;if(u==null)continue;let p=c[u];if(!p){c[u]=d;continue}let m=o(p),h=o(d);if(h>m){c[u]=d;continue}if(h===m){let f=Date.parse((p==null?void 0:p.entry_date)||(p==null?void 0:p.last_active_at)||0)||0;(Date.parse((d==null?void 0:d.entry_date)||(d==null?void 0:d.last_active_at)||0)||0)>f&&(c[u]=d)}}}catch(n){console.error("Failed to load accreditation enrollment data",n)}for(let n in s){let r=s[n];for(let l in r.students){let d=r.students[l];if(d.id in this.campuses)continue;this.campuses[d.id]="";let u=c[d.id];if(!u)continue;let p=i(u);this.campuses[d.id]=p;let m=a(u,p);m!==""&&(this.enrollmentTypes[d.id]=m)}}},data:function(){return{anonymous:!1,assignmentGroups:{},courseData:{},enrollments:[],courseId:null,currentUser:"",showModal:!1,preparingDocument:!1,submissions:[],currentAssignment:{},startDate:null,endDate:null,sections:[],section:"",needsToWait:!1,sortBy:"name",campuses:{},enrollmentTypes:{},loadingCourse:!0,loadingAssignmentDetails:!1}},methods:{async mapWithConcurrency(e,t,s){let i=new Array(e.length),a=0;async function o(){for(;;){let r=a;if(a+=1,r>=e.length)return;i[r]=await s(e[r],r)}}let c=Math.min(t,e.length),n=[];for(let r=0;r<c;r++)n.push(o());return await Promise.all(n),i},normalizeSubmission(e,t=!1){var s,i,a;return{...e,quiz_id:(s=e==null?void 0:e.quiz)==null?void 0:s._id,user:{id:e.user._id,name:e.user.name},comments:t?((i=e.commentsConnection)==null?void 0:i.nodes)||[]:[],rubric_assessments:t?((a=e.rubricAssessmentsConnection)==null?void 0:a.nodes)||[]:[],detailsLoaded:t}},getSubmissionDate(e){let t=e.submittedAt;return t===null&&(t=e.gradedAt),t},getFilteredSubmissions(e){let t=this,s=t.startDate,i=t.endDate,a=t.section,o=null;if(a!=="")for(let r=0;r<t.sections.length;r++){let l=t.sections[r];if(l.id===a){o=l;break}}let c=[];if(o!==null){let r=o.students;for(let l=0;l<r.length;l++)c.push(r[l].id)}let n=[];for(let r=0;r<e.length;r++){let l=e[r],d=!1,u=t.getSubmissionDate(l);u!==null&&(u>=s||s===null)&&(u<=i||i===null)&&(d=!0);let p=!0;o!==null&&(p=c.includes(parseInt(l.user.id)));let m=!0;l.submissionStatus=="unsubmitted"&&l.rubric_assessments.length==0&&(m=!1),d&&p&&m&&n.push(l)}return n},async getCourseMeta(e){let t=`
              query {
                course(id: "${e}") {
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
            `;return(await $.post("/api/graphql",{query:t})).data.course},async getAssignments(e){let t=[],s=!0,i=null;for(;s;){let a=`
                query {
                  assignmentGroup(id: "${e}") {
                    _id

                    assignmentsConnection(first: 50${i?`, after: "${i}"`:""}) {
                      pageInfo {
                        hasNextPage
                        endCursor
                      }
                      nodes {
                        _id
                        name
                        published
                        pointsPossible
                        quiz {
                          _id
                        }
                      }
                    }
                  }
                }
              `,c=(await $.post("/api/graphql",{query:a})).data.assignmentGroup.assignmentsConnection;t=t.concat(c.nodes),s=c.pageInfo.hasNextPage,i=c.pageInfo.endCursor}return t.map(a=>{var o;a.id=a._id,a.quiz_id=(o=a==null?void 0:a.quiz)==null?void 0:o._id}),t},async getSubmissions(e,{includeDetails:t=!1}={}){let s=[],i=!0,a=null;for(;i;){let o=`
                query {
                  assignment(id: "${e}") {
                    _id
                    quiz {
                      _id
                    }
                    submissionsConnection(
                      first: 50${a?`, after: "${a}"`:""},
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
                        score
                        ${t?`
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
                        }`:""}
                      }
                    }
                  }
                }
              `,n=(await $.post("/api/graphql",{query:o})).data.assignment.submissionsConnection;s=s.concat(n.nodes),i=n.pageInfo.hasNextPage,a=n.pageInfo.endCursor}return s},async getGraphQLData(e){try{let t=await this.getCourseMeta(e),s=t.assignmentGroupsConnection.nodes.filter(o=>o.state==="available"),i=6;await Promise.all(s.map(async o=>{o.assignments=await this.getAssignments(o.id)}));let a=s.flatMap(o=>o.assignments||[]);return await this.mapWithConcurrency(a,i,async o=>{try{let c=await this.getSubmissions(o._id);o.submissions=c.map(n=>this.normalizeSubmission(n))}catch(c){console.error(`Failed to load submissions for assignment ${o._id}`,c),o.submissions=[]}o.submissionDetailsLoaded=!1}),{id:e,name:t.name,course_code:t.courseCode,assignment_groups:s}}catch(t){return console.error(t),{name:"",assignment_groups:[]}}},plainCommentToHTML(e){return e.split(`
`).filter(i=>i.trim()!=="").map(i=>`<p>${i}</p>`).join("")},getComments(e){var i,a;let t=e.comments,s="";if(t.length>0){s=$("<div style='page-break-before: always;' class='btech-accreditation-comments'></div>"),s.append("<h2>Comments</h2>");for(let o=0;o<t.length;o++){let c=t[o],n=$(`<div class='btech-accreditation-comment' style='border-bottom: 1px solid #000;'>
                  ${this.plainCommentToHTML(c.comment)}
                  <p style='text-align: right;'><i>-${(a=(i=c==null?void 0:c.author)==null?void 0:i.name)!=null?a:"automated comment"}, ${this.dateToString(c.createdAt)}</i></p>
                </div>`);s.append(n)}}return s},async downloadAttachments(e){for(let t=0;t<e.length;t++){let s=e[t];await this.downloadSingleAttachment(s)}},downloadSingleAttachment(e){return new Promise(t=>{window.open(e.url,"_blank"),setTimeout(t,100)})},async downloadSubmission(e,t){var a;let s=this,i=t.submissionType;if(s.preparingDocument=!0,s.needsToWait=!1,i=="online_quiz"){let o="/courses/"+s.courseId+"/assignments/"+e.id+"/submissions/"+t.user.id+"?preview=1";o=`/courses/${s.courseId}/quizzes/${e.quiz_id}/history?user_id=${t.user.id}`,await s.createIframe(o,s.downloadQuiz,{submission:t,assignment:e}),s.needsToWait=!0}if(i=="discussion_topic"){let o="/courses/"+s.courseId+"/assignments/"+e.id+"/submissions/"+t.user.id+"?preview=1";await s.createIframe(o,s.downloadDiscussion,{submission:t,assignment:e}),s.needsToWait=!0}if(t.rubric_assessments.length>0){let o="/courses/"+s.courseId+"/assignments/"+e.id+"/submissions/"+t.user.id;await s.createIframe(o,s.downloadRubric,{submission:t,assignment:e}),s.needsToWait=!0}else{let o="/courses/"+s.courseId+"/assignments/"+e.id+"/submissions/"+t.user.id;await s.createIframe(o,s.downloadComments,{submission:t,assignment:e}),s.needsToWait=!0}((a=t==null?void 0:t.attachments)==null?void 0:a.length)>0&&await this.downloadAttachments(t.attachments),s.needsToWait===!1&&(s.preparingDocument=!1)},checkLTI(e){let t=e.submissionType;if(t==="basic_lti_launch"){let s=e.previewUrl;window.open(s,"_blank")}t=="external_tool"&&alert("This is an assignment handled by a third party tool. You will need to pull evidence from the tool directly.")},async downloadComments(e,t,s){let i=this,a=e.attr("id"),o=this.getTitle(s)+" submission comments",c=i.getComments(s.submission);this.addRequiredInformation(t,s.submission,s.assignment),t.append(c);let n=document.getElementById(a).contentWindow,r=$("title").text();$("title").text(o),n.onafterprint=l=>{$("title").text(r),i.preparingDocument=!1,i.checkLTI(s.submission),e.remove()},n.focus(),n.print()},addRequiredInformation(e,t,s){var i,a;e.prepend("<p>Submitted: <span style='background-color: #FF0;'>"+this.getSubmissionDate(t)+"</span></p>"),e.prepend("<p>Student: <span style='background-color: #FF0;'>"+(this.anonymous?"Anonymous User "+t.user.id:t.user.name)+"</span></p>"),(a=(i=this.campuses)==null?void 0:i[t.user.id])!=null&&a&&e.prepend("<p>Campus: <span style='background-color: #FF0;'>"+this.campuses[t.user.id]+"</span></p>"),e.prepend("<p>Title: <span style='background-color: #FF0;'>"+s.name+"</span></p>"),e.prepend("<p>Course: <span style='background-color: #FF0;'>"+this.courseData.name+" ("+this.courseData.course_code+")</span></p>")},getTitle(e){return this.courseData.name+" - "+e.assignment.name+" - "+(this.anonymous?"Anonymous User "+e.submission.user.id:e.submission.user.name)},async downloadRubric(e,t,s){let i=this,a=this.getTitle(s)+" submission rubric";await new Promise(o=>{$(e).on("load",function(){let n=$(this).contents().find("#rubric_holder");if(n.length>0){n.show(),i.addRequiredInformation(n,s.submission,s.assignment);let r=i.getComments(s.submission);n.append(r),n.css({"max-height":"",overflow:"visible"});let l=n.find('[data-selenium="criterion_comments_text"]');for(let u=0;u<l.length;u++){let p=l[u];$(p).css({height:"10rem",width:"30rem"})}let d=$("title").text();$("title").text(a),n.printThis({pageTitle:a,afterPrint:function(){$("title").text(d),i.preparingDocument=!1,i.checkLTI(s.submission),e.remove()}}),o()}else console.error("#rubric_holder not found"),o()})})},async downloadNewQuiz(e,t,s){let i=this,a=e.attr("id"),o=a.replace("btech-content-",""),c=this.getTitle(s)+" submission";this.addRequiredInformation(t,s.submission,s.assignment);let n=i.getComments(s.submission);t.append(n);let r=$("title").text();$("title").text(c);let l=document.getElementById(a).contentWindow;l.onafterprint=d=>{$("title").text(r),i.preparingDocument=!1},l.focus(),l.print()},async downloadDiscussion(e,t,s){let i=this,a=e.attr("id"),o=a.replace("btech-content-",""),c=this.getTitle(s)+" submission";this.addRequiredInformation(t,s.submission,s.assignment);let n=i.getComments(s.submission);t.append(n);let r=$("title").text();$("title").text(c);let l=document.getElementById(a).contentWindow;l.onafterprint=d=>{$("title").text(r),i.preparingDocument=!1,e.remove()},l.focus(),l.print()},async downloadQuiz(e,t,s){let i=this,a=e.attr("id"),o=a.replace("btech-content-",""),c=this.getTitle(s)+" submission";this.addRequiredInformation(t,s.submission,s.assignment);let n=i.getComments(s.submission);t.append(n);let r=$("title").text();$("title").text(c);let l=document.getElementById(a).contentWindow,d=l.document,u=()=>{d.querySelectorAll(".answer").forEach(m=>{let h=m.classList.contains("selected_answer"),f=m.classList.contains("correct_answer"),g=d.createElement("span");g.style.fontWeight="bold",g.style.fontSize="14px",g.style.marginLeft="0.5em",h&&f?(g.textContent="\u2714 Correct (Your Answer)",g.style.color="green"):h&&!f?(g.textContent="\u2718 Incorrect (Your Answer)",g.style.color="red"):!h&&f?(g.textContent="\u2714 Correct Answer",g.style.color="green"):g.textContent="";let C=m.querySelector(".answer_html")||m.querySelector(".answer_match_right")||m.querySelector(".answer_text")||m.querySelector("select")||m.querySelector(".answer_type")||m;g.textContent!==""&&C.appendChild(g);let b=d.createElement("hr");b.style.border="0",b.style.borderTop="1px solid #aaa",b.style.margin="10px 0",m.appendChild(b)})};d.readyState==="complete"?(u(),l.focus(),l.onafterprint=()=>{$("title").text(r),i.preparingDocument=!1,e.remove()},l.print()):e.on("load",()=>{u(),l.focus(),l.onafterprint=()=>{$("title").text(r),i.preparingDocument=!1,e.remove()},l.print()})},async createIframe(e,t=null,s={}){let a="btech-content-"+genId(),o=$('<iframe id="'+a+'" style="width: 1200px;" src="'+e+'"></iframe>');o.hide(),$("#content").append(o);let c=document.getElementById(a).contentWindow;return c.onload=function(){let n=$(c.document.getElementsByTagName("body")[0]),r=n.find("img");t!==null&&t(o,n,s)},o},async openModal(e){let t=this;if(t.showModal=!0,t.currentAssignment=e,t.submissions=[],e.submissionDetailsLoaded!==!0){t.loadingAssignmentDetails=!0;try{let s=await t.getSubmissions(e.id,{includeDetails:!0});e.submissions=s.map(i=>t.normalizeSubmission(i,!0)),e.submissionDetailsLoaded=!0}catch(s){console.error(s)}finally{t.loadingAssignmentDetails=!1}}t.submissions=e.submissions},submittedAssignments(e){let t=[];for(let s=0;s<e.length;s++){let i=e[s];i.workflow_state!="unsubmitted"&&t.push(i)}return t},dateToString(e){return e=new Date(Date.parse(e)),e.getFullYear()+"-"+(e.getMonth()+1)+"-"+e.getDate()},close(){let e=this;e.showModal=!1}}});let w=[];for(let e=0;e<w.length;e++){let t=w[e];$("#content").append("<h2>"+t.name+" ("+t.group_weight+"%)</h2>")}}}})();})();
