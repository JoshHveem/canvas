(()=>{function C(b,y=15e3){let g=()=>{let p=b.querySelector("#rubric_holder");return p!=null&&p.querySelector(".rubric_table tbody tr, .rubric_table .criterion")?p:null},v=g();return v?Promise.resolve(v):new Promise((p,e)=>{let t=new MutationObserver(()=>{let n=g();n&&(t.disconnect(),clearTimeout(s),p(n))}),s=setTimeout(()=>{t.disconnect(),e(new Error("Canvas did not render a supported rubric for this submission."))},y);t.observe(b.body,{childList:!0,subtree:!0})})}function I(b,y){let g=y.cloneNode(!0),v=y.querySelectorAll("input, textarea, select");g.querySelectorAll("input, textarea, select").forEach((t,s)=>{let n=v[s];if(n.type==="hidden"){t.remove();return}let i=b.createElement(n.tagName==="TEXTAREA"?"div":"span");i.className=n.tagName==="TEXTAREA"?"btech-print-field btech-print-comment":"btech-print-field",i.textContent=n.tagName==="SELECT"?Array.from(n.selectedOptions,r=>r.textContent).join(", "):n.type==="checkbox"||n.type==="radio"?n.checked?"Selected":"Not selected":n.value,t.replaceWith(i)}),g.querySelectorAll("script, button, .screenreader-only, .no-print").forEach(t=>t.remove()),g.style.display="block",g.style.maxHeight="none",g.style.overflow="visible";let p=b.createElement("main");p.id="btech-accreditation-rubric-export",p.append(g);let e=b.createElement("style");return e.textContent=`
    @page { margin: 14mm; }
    html, body { min-width: 0 !important; height: auto !important; overflow: visible !important; }
    body { margin: 0 !important; padding: 0 !important; }
    #btech-accreditation-rubric-export { font: 12px/1.45 Arial, sans-serif; color: #111; overflow-wrap: anywhere; }
    #btech-accreditation-rubric-export > p { margin: 0 0 8px; }
    #btech-accreditation-rubric-export #rubric_holder,
    #btech-accreditation-rubric-export .rubric_container { width: auto !important; min-width: 0 !important; max-width: none !important; max-height: none !important; overflow: visible !important; }
    #btech-accreditation-rubric-export .rubric_table { width: 100% !important; border-collapse: collapse; }
    #btech-accreditation-rubric-export th,
    #btech-accreditation-rubric-export td { padding: 8px; vertical-align: top; }
    #btech-accreditation-rubric-export tr { break-inside: avoid; }
    #btech-accreditation-rubric-export .btech-print-field { font: inherit; overflow-wrap: anywhere; }
    #btech-accreditation-rubric-export .btech-print-comment { white-space: pre-wrap; margin-top: 6px; }
    #btech-accreditation-rubric-export .btech-accreditation-comments { padding-top: 12px; }
    #btech-accreditation-rubric-export a { overflow-wrap: anywhere; }
  `,b.head.append(e),b.body.replaceChildren(p),p}async function S(b,y=1e4){var p;let g=Promise.all([(p=b.fonts)==null?void 0:p.ready,...Array.from(b.images,e=>e.complete?Promise.resolve():e.decode().catch(()=>{}))]),v;try{await Promise.race([g,new Promise((e,t)=>{v=setTimeout(()=>t(new Error("Rubric print assets did not finish loading.")),y)})])}finally{clearTimeout(v)}}(async function(){let b=0;if(document.title==="BTECH Accreditation"){if($("#accreditation").length>0)return;let y=/^\/courses\/([0-9]+)/;if(y.test(window.location.pathname)){await Promise.all(["https://html2canvas.hertzen.com/dist/html2canvas.min.js","https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.1.1/jspdf.umd.js","https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js","https://cdn.jsdelivr.net/npm/file-saver@2.0.2/dist/FileSaver.min.js"].map(e=>$.getScript(window.btechAssetUrl?window.btechAssetUrl(e):e)));let g=parseInt(window.location.pathname.match(y)[1]);await $.put(`https://btech.instructure.com/api/v1/courses/${g}/gradebook_settings`,{gradebook_settings:{show_concluded_enrollments:!0}});let v=`
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
      </div>`;$("#content").html("<div id='accreditation'><div id='accreditation-app'></div></div>"),new Vue({el:"#accreditation-app",template:v,mounted:async function(){this.courseId=g;let e=await this.getGraphQLData(this.courseId);this.courseData={name:e.name,course_code:e.course_code};let t=this.courseData.course_code;this.assignmentGroups=e.assignment_groups,this.loadingCourse=!1;let s=await canvasGet("/api/v1/courses/"+this.courseId+"/sections?include[]=students");this.sections=s;let n=o=>{if(o!=null&&o.sis_data__is_distance_approved)return"Online";let a=String((o==null?void 0:o.sis_data__campus_code)||"").trim().toUpperCase();return a==="L"?"Logan Campus":a==="B"?"Brigham City Campus":a},i=(o,a)=>{let c=String((o==null?void 0:o.sis_data__course_type)||"").trim().toUpperCase();return c||(a.toLowerCase().includes("hs")?"HS":a!==""?"CS":"")},r=o=>{let a=0;return o!=null&&o.is_deleted||(a+=100),o!=null&&o.is_active&&(a+=50),o!=null&&o.is_concluded||(a+=25),o!=null&&o.exit_date||(a+=10),a},l={};try{let o=await bridgetools.req3("reports",{canvas_course_id:{op:"=",value:this.courseId}},{dataset:"canvas_enrollments"}),a=Array.isArray(o)?o:[];for(let c=0;c<a.length;c++){let d=a[c],m=d==null?void 0:d.canvas_user_id;if(m==null)continue;let h=l[m];if(!h){l[m]=d;continue}let u=r(h),w=r(d);if(w>u){l[m]=d;continue}if(w===u){let x=Date.parse((h==null?void 0:h.entry_date)||(h==null?void 0:h.last_active_at)||0)||0;(Date.parse((d==null?void 0:d.entry_date)||(d==null?void 0:d.last_active_at)||0)||0)>x&&(l[m]=d)}}}catch(o){console.error("Failed to load accreditation enrollment data",o)}for(let o in s){let a=s[o];for(let c in a.students){let d=a.students[c];if(d.id in this.campuses)continue;this.campuses[d.id]="";let m=l[d.id];if(!m)continue;let h=n(m);this.campuses[d.id]=h;let u=i(m,h);u!==""&&(this.enrollmentTypes[d.id]=u)}}},data:function(){return{anonymous:!1,assignmentGroups:{},courseData:{},enrollments:[],courseId:null,currentUser:"",showModal:!1,preparingDocument:!1,submissions:[],currentAssignment:{},startDate:null,endDate:null,sections:[],section:"",needsToWait:!1,sortBy:"name",campuses:{},enrollmentTypes:{},loadingCourse:!0,loadingAssignmentDetails:!1}},methods:{async mapWithConcurrency(e,t,s){let n=new Array(e.length),i=0;async function r(){for(;;){let a=i;if(i+=1,a>=e.length)return;n[a]=await s(e[a],a)}}let l=Math.min(t,e.length),o=[];for(let a=0;a<l;a++)o.push(r());return await Promise.all(o),n},normalizeSubmission(e,t=!1){var s,n,i;return{...e,quiz_id:(s=e==null?void 0:e.quiz)==null?void 0:s._id,user:{id:e.user._id,name:e.user.name},comments:t?((n=e.commentsConnection)==null?void 0:n.nodes)||[]:[],rubric_assessments:t?((i=e.rubricAssessmentsConnection)==null?void 0:i.nodes)||[]:[],detailsLoaded:t}},getSubmissionDate(e){let t=e.submittedAt;return t===null&&(t=e.gradedAt),t},getFilteredSubmissions(e){let t=this,s=t.startDate,n=t.endDate,i=t.section,r=null;if(i!=="")for(let a=0;a<t.sections.length;a++){let c=t.sections[a];if(c.id===i){r=c;break}}let l=[];if(r!==null){let a=r.students;for(let c=0;c<a.length;c++)l.push(a[c].id)}let o=[];for(let a=0;a<e.length;a++){let c=e[a],d=!1,m=t.getSubmissionDate(c);m!==null&&(m>=s||s===null)&&(m<=n||n===null)&&(d=!0);let h=!0;r!==null&&(h=l.includes(parseInt(c.user.id)));let u=!0;c.submissionStatus=="unsubmitted"&&c.rubric_assessments.length==0&&(u=!1),d&&h&&u&&o.push(c)}return o},async getCourseMeta(e){let t=`
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
            `;return(await $.post("/api/graphql",{query:t})).data.course},async getAssignments(e){let t=[],s=!0,n=null;for(;s;){let i=`
                query {
                  assignmentGroup(id: "${e}") {
                    _id

                    assignmentsConnection(first: 50${n?`, after: "${n}"`:""}) {
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
              `,l=(await $.post("/api/graphql",{query:i})).data.assignmentGroup.assignmentsConnection;t=t.concat(l.nodes),s=l.pageInfo.hasNextPage,n=l.pageInfo.endCursor}return t.map(i=>{var r;i.id=i._id,i.quiz_id=(r=i==null?void 0:i.quiz)==null?void 0:r._id}),t},async getSubmissions(e,{includeDetails:t=!1}={}){let s=[],n=!0,i=null;for(;n;){let r=`
                query {
                  assignment(id: "${e}") {
                    _id
                    quiz {
                      _id
                    }
                    submissionsConnection(
                      first: 50${i?`, after: "${i}"`:""},
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
              `,o=(await $.post("/api/graphql",{query:r})).data.assignment.submissionsConnection;s=s.concat(o.nodes),n=o.pageInfo.hasNextPage,i=o.pageInfo.endCursor}return s},async getGraphQLData(e){try{let t=await this.getCourseMeta(e),s=t.assignmentGroupsConnection.nodes.filter(r=>r.state==="available"),n=6;await Promise.all(s.map(async r=>{r.assignments=await this.getAssignments(r.id)}));let i=s.flatMap(r=>r.assignments||[]);return await this.mapWithConcurrency(i,n,async r=>{try{let l=await this.getSubmissions(r._id);r.submissions=l.map(o=>this.normalizeSubmission(o))}catch(l){console.error(`Failed to load submissions for assignment ${r._id}`,l),r.submissions=[]}r.submissionDetailsLoaded=!1}),{id:e,name:t.name,course_code:t.courseCode,assignment_groups:s}}catch(t){return console.error(t),{name:"",assignment_groups:[]}}},plainCommentToHTML(e){return e.split(`
`).filter(n=>n.trim()!=="").map(n=>`<p>${n}</p>`).join("")},getComments(e){var n,i;let t=e.comments,s="";if(t.length>0){s=$("<div style='page-break-before: always;' class='btech-accreditation-comments'></div>"),s.append("<h2>Comments</h2>");for(let r=0;r<t.length;r++){let l=t[r],o=$(`<div class='btech-accreditation-comment' style='border-bottom: 1px solid #000;'>
                  ${this.plainCommentToHTML(l.comment)}
                  <p style='text-align: right;'><i>-${(i=(n=l==null?void 0:l.author)==null?void 0:n.name)!=null?i:"automated comment"}, ${this.dateToString(l.createdAt)}</i></p>
                </div>`);s.append(o)}}return s},async downloadAttachments(e){for(let t=0;t<e.length;t++){let s=e[t];await this.downloadSingleAttachment(s)}},downloadSingleAttachment(e){return new Promise(t=>{window.open(e.url,"_blank"),setTimeout(t,100)})},async downloadSubmission(e,t){var i;let s=this,n=t.submissionType;if(s.preparingDocument=!0,s.needsToWait=!1,n=="online_quiz"){let r="/courses/"+s.courseId+"/assignments/"+e.id+"/submissions/"+t.user.id+"?preview=1";r=`/courses/${s.courseId}/quizzes/${e.quiz_id}/history?user_id=${t.user.id}`,await s.createIframe(r,s.downloadQuiz,{submission:t,assignment:e}),s.needsToWait=!0}if(n=="discussion_topic"){let r="/courses/"+s.courseId+"/assignments/"+e.id+"/submissions/"+t.user.id+"?preview=1";await s.createIframe(r,s.downloadDiscussion,{submission:t,assignment:e}),s.needsToWait=!0}if(t.rubric_assessments.length>0){let r="/courses/"+s.courseId+"/assignments/"+e.id+"/submissions/"+t.user.id;await s.createIframe(r,s.downloadRubric,{submission:t,assignment:e}),s.needsToWait=!0}else{let r="/courses/"+s.courseId+"/assignments/"+e.id+"/submissions/"+t.user.id;await s.createIframe(r,s.downloadComments,{submission:t,assignment:e}),s.needsToWait=!0}((i=t==null?void 0:t.attachments)==null?void 0:i.length)>0&&await this.downloadAttachments(t.attachments),s.needsToWait===!1&&(s.preparingDocument=!1)},checkLTI(e){let t=e.submissionType;if(t==="basic_lti_launch"){let s=e.previewUrl;window.open(s,"_blank")}t=="external_tool"&&alert("This is an assignment handled by a third party tool. You will need to pull evidence from the tool directly.")},async downloadComments(e,t,s){let n=this,i=e.attr("id"),r=this.getTitle(s)+" submission comments",l=n.getComments(s.submission);this.addRequiredInformation(t,s.submission,s.assignment),t.append(l);let o=document.getElementById(i).contentWindow,a=$("title").text();$("title").text(r),o.onafterprint=c=>{$("title").text(a),n.preparingDocument=!1,n.checkLTI(s.submission),e.remove()},o.focus(),o.print()},addRequiredInformation(e,t,s){var n,i;e.prepend("<p>Submitted: <span style='background-color: #FF0;'>"+this.getSubmissionDate(t)+"</span></p>"),e.prepend("<p>Student: <span style='background-color: #FF0;'>"+(this.anonymous?"Anonymous User "+t.user.id:t.user.name)+"</span></p>"),(i=(n=this.campuses)==null?void 0:n[t.user.id])!=null&&i&&e.prepend("<p>Campus: <span style='background-color: #FF0;'>"+this.campuses[t.user.id]+"</span></p>"),e.prepend("<p>Title: <span style='background-color: #FF0;'>"+s.name+"</span></p>"),e.prepend("<p>Course: <span style='background-color: #FF0;'>"+this.courseData.name+" ("+this.courseData.course_code+")</span></p>")},getTitle(e){return this.courseData.name+" - "+e.assignment.name+" - "+(this.anonymous?"Anonymous User "+e.submission.user.id:e.submission.user.name)},async downloadRubric(e,t,s){let n=this,i=this.getTitle(s)+" submission rubric",r=e[0].contentWindow,l=r.document,o=document.title,a=()=>{document.title=o,n.preparingDocument=!1,e.remove()};try{let c=await C(l),d=$(I(l,c));n.addRequiredInformation(d,s.submission,s.assignment),d.append(n.getComments(s.submission)),l.title=i,await S(l),document.title=i,r.onafterprint=()=>{a(),n.checkLTI(s.submission)},r.focus(),r.print()}catch(c){a(),console.error("Unable to prepare rubric export",c),alert("Unable to prepare this rubric for printing. "+c.message)}},async downloadNewQuiz(e,t,s){let n=this,i=e.attr("id"),r=i.replace("btech-content-",""),l=this.getTitle(s)+" submission";this.addRequiredInformation(t,s.submission,s.assignment);let o=n.getComments(s.submission);t.append(o);let a=$("title").text();$("title").text(l);let c=document.getElementById(i).contentWindow;c.onafterprint=d=>{$("title").text(a),n.preparingDocument=!1},c.focus(),c.print()},async downloadDiscussion(e,t,s){let n=this,i=e.attr("id"),r=i.replace("btech-content-",""),l=this.getTitle(s)+" submission";this.addRequiredInformation(t,s.submission,s.assignment);let o=n.getComments(s.submission);t.append(o);let a=$("title").text();$("title").text(l);let c=document.getElementById(i).contentWindow;c.onafterprint=d=>{$("title").text(a),n.preparingDocument=!1,e.remove()},c.focus(),c.print()},async downloadQuiz(e,t,s){let n=this,i=e.attr("id"),r=i.replace("btech-content-",""),l=this.getTitle(s)+" submission";this.addRequiredInformation(t,s.submission,s.assignment);let o=n.getComments(s.submission);t.append(o);let a=$("title").text();$("title").text(l);let c=document.getElementById(i).contentWindow,d=c.document,m=()=>{d.querySelectorAll(".answer").forEach(u=>{let w=u.classList.contains("selected_answer"),x=u.classList.contains("correct_answer"),f=d.createElement("span");f.style.fontWeight="bold",f.style.fontSize="14px",f.style.marginLeft="0.5em",w&&x?(f.textContent="\u2714 Correct (Your Answer)",f.style.color="green"):w&&!x?(f.textContent="\u2718 Incorrect (Your Answer)",f.style.color="red"):!w&&x?(f.textContent="\u2714 Correct Answer",f.style.color="green"):f.textContent="";let A=u.querySelector(".answer_html")||u.querySelector(".answer_match_right")||u.querySelector(".answer_text")||u.querySelector("select")||u.querySelector(".answer_type")||u;f.textContent!==""&&A.appendChild(f);let _=d.createElement("hr");_.style.border="0",_.style.borderTop="1px solid #aaa",_.style.margin="10px 0",u.appendChild(_)})};d.readyState==="complete"?(m(),c.focus(),c.onafterprint=()=>{$("title").text(a),n.preparingDocument=!1,e.remove()},c.print()):e.on("load",()=>{m(),c.focus(),c.onafterprint=()=>{$("title").text(a),n.preparingDocument=!1,e.remove()},c.print()})},async createIframe(e,t=null,s={}){let n;do n="btech-content-"+ ++b;while(document.getElementById(n));let i=$('<iframe id="'+n+'" style="width: 1200px;" src="'+e+'"></iframe>');i.hide(),$("#content").append(i);let r=document.getElementById(n).contentWindow;return r.onload=function(){let l=$(r.document.getElementsByTagName("body")[0]),o=l.find("img");t!==null&&t(i,l,s)},i},async openModal(e){let t=this;if(t.showModal=!0,t.currentAssignment=e,t.submissions=[],e.submissionDetailsLoaded!==!0){t.loadingAssignmentDetails=!0;try{let s=await t.getSubmissions(e.id,{includeDetails:!0});e.submissions=s.map(n=>t.normalizeSubmission(n,!0)),e.submissionDetailsLoaded=!0}catch(s){console.error(s)}finally{t.loadingAssignmentDetails=!1}}t.submissions=e.submissions},submittedAssignments(e){let t=[];for(let s=0;s<e.length;s++){let n=e[s];n.workflow_state!="unsubmitted"&&t.push(n)}return t},dateToString(e){return e=new Date(Date.parse(e)),e.getFullYear()+"-"+(e.getMonth()+1)+"-"+e.getDate()},close(){let e=this;e.showModal=!1}}});let p=[];for(let e=0;e<p.length;e++){let t=p[e];$("#content").append("<h2>"+t.name+" ("+t.group_weight+"%)</h2>")}}}})();})();
