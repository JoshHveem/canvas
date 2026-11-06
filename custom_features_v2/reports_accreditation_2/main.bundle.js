(()=>{function C(b,y=15e3){let h=()=>{let p=b.querySelector("#rubric_holder");return p!=null&&p.querySelector(".rubric_table tbody tr, .rubric_table .criterion")?p:null},v=h();return v?Promise.resolve(v):new Promise((p,e)=>{let s=new MutationObserver(()=>{let n=h();n&&(s.disconnect(),clearTimeout(t),p(n))}),t=setTimeout(()=>{s.disconnect(),e(new Error("Canvas did not render a supported rubric for this submission."))},y);s.observe(b.body,{childList:!0,subtree:!0})})}function I(b,y){let h=y.cloneNode(!0),v=y.querySelectorAll("input, textarea, select");h.querySelectorAll("input, textarea, select").forEach((s,t)=>{let n=v[t];if(n.type==="hidden"){s.remove();return}let o=b.createElement(n.tagName==="TEXTAREA"?"div":"span");o.className=n.tagName==="TEXTAREA"?"btech-print-field btech-print-comment":"btech-print-field",o.textContent=n.tagName==="SELECT"?Array.from(n.selectedOptions,i=>i.textContent).join(", "):n.type==="checkbox"||n.type==="radio"?n.checked?"Selected":"Not selected":n.value,s.replaceWith(o)}),h.querySelectorAll("script, button, .screenreader-only, .no-print").forEach(s=>s.remove()),h.style.display="block",h.style.maxHeight="none",h.style.overflow="visible";let p=b.createElement("main");p.id="btech-accreditation-rubric-export",p.append(h);let e=b.createElement("style");return e.textContent=`
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
  `,b.head.append(e),b.body.replaceChildren(p),p}async function A(b,y=1e4){var p;let h=Promise.all([(p=b.fonts)==null?void 0:p.ready,...Array.from(b.images,e=>e.complete?Promise.resolve():e.decode().catch(()=>{}))]),v;try{await Promise.race([h,new Promise((e,s)=>{v=setTimeout(()=>s(new Error("Rubric print assets did not finish loading.")),y)})])}finally{clearTimeout(v)}}(async function(){let b=0;if(document.title==="BTECH Accreditation"){if($("#accreditation").length>0)return;let y=/^\/courses\/([0-9]+)/;if(y.test(window.location.pathname)){await Promise.all(["https://html2canvas.hertzen.com/dist/html2canvas.min.js","https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.1.1/jspdf.umd.js","https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js","https://cdn.jsdelivr.net/npm/file-saver@2.0.2/dist/FileSaver.min.js"].map(e=>$.getScript(window.btechAssetUrl?window.btechAssetUrl(e):e)));let h=parseInt(window.location.pathname.match(y)[1]);await $.put(`https://btech.instructure.com/api/v1/courses/${h}/gradebook_settings`,{gradebook_settings:{show_concluded_enrollments:!0}});let v=`
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

        <div v-if='showModal && !preparingDocument' @click="if(!preparingDocument) close();" class='btech-modal' style='display: inline-block;'>
          <div class='btech-modal-content' @click.stop>
            <div class="icon-container" style='float: right; margin-right: .5rem; margin-top: .5rem;' v-on:click='close()'>
              <i class="icon-end"></i> 
            </div>
            <div class='btech-modal-content-inner'>
              <h2><a target='#' v-bind:href="'/courses/'+courseId+'/assignments/'+currentAssignment.id">{{currentAssignment.name}}</a></h2>
              <button type="button" class="btn" :disabled="loadingAssignmentDetails" @click="openModal(currentAssignment, { force: true })">
                {{assignmentDetailsError ? 'Retry loading details' : 'Refresh details'}}
              </button>
              <div v-if='loadingAssignmentDetails'>
                Loading assignment details...
              </div>
              <div v-else-if="assignmentDetailsError" role="alert">
                {{assignmentDetailsError}}
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

              </div>
              <div v-else>
                No graded submissions found. There may be submissions pending grading.
              </div>
          </div>
        </div>
      </div>`;$("#content").html("<div id='accreditation'><div id='accreditation-app'></div></div>"),new Vue({el:"#accreditation-app",template:v,mounted:async function(){this.courseId=h;let e=await this.getGraphQLData(this.courseId);this.courseData={name:e.name,course_code:e.course_code};let s=this.courseData.course_code;this.assignmentGroups=e.assignment_groups,this.loadingCourse=!1;let t=await canvasGet("/api/v1/courses/"+this.courseId+"/sections?include[]=students");this.sections=t;let n=r=>{if(r!=null&&r.sis_data__is_distance_approved)return"Online";let a=String((r==null?void 0:r.sis_data__campus_code)||"").trim().toUpperCase();return a==="L"?"Logan Campus":a==="B"?"Brigham City Campus":a},o=(r,a)=>{let l=String((r==null?void 0:r.sis_data__course_type)||"").trim().toUpperCase();return l||(a.toLowerCase().includes("hs")?"HS":a!==""?"CS":"")},i=r=>{let a=0;return r!=null&&r.is_deleted||(a+=100),r!=null&&r.is_active&&(a+=50),r!=null&&r.is_concluded||(a+=25),r!=null&&r.exit_date||(a+=10),a},c={};try{let r=await bridgetools.req3("reports",{canvas_course_id:{op:"=",value:this.courseId}},{dataset:"canvas_enrollments"}),a=Array.isArray(r)?r:[];for(let l=0;l<a.length;l++){let d=a[l],u=d==null?void 0:d.canvas_user_id;if(u==null)continue;let g=c[u];if(!g){c[u]=d;continue}let m=i(g),w=i(d);if(w>m){c[u]=d;continue}if(w===m){let x=Date.parse((g==null?void 0:g.entry_date)||(g==null?void 0:g.last_active_at)||0)||0;(Date.parse((d==null?void 0:d.entry_date)||(d==null?void 0:d.last_active_at)||0)||0)>x&&(c[u]=d)}}}catch(r){console.error("Failed to load accreditation enrollment data",r)}for(let r in t){let a=t[r];for(let l in a.students){let d=a.students[l];if(d.id in this.campuses)continue;this.campuses[d.id]="";let u=c[d.id];if(!u)continue;let g=n(u);this.campuses[d.id]=g;let m=o(u,g);m!==""&&(this.enrollmentTypes[d.id]=m)}}},data:function(){return{anonymous:!1,assignmentGroups:{},courseData:{},enrollments:[],courseId:null,currentUser:"",showModal:!1,preparingDocument:!1,submissions:[],currentAssignment:{},startDate:null,endDate:null,sections:[],section:"",needsToWait:!1,sortBy:"name",campuses:{},enrollmentTypes:{},loadingCourse:!0,loadingAssignmentDetails:!1,assignmentDetailsError:"",assignmentDetailsRequestId:0}},methods:{async mapWithConcurrency(e,s,t){let n=new Array(e.length),o=0;async function i(){for(;;){let a=o;if(o+=1,a>=e.length)return;n[a]=await t(e[a],a)}}let c=Math.min(s,e.length),r=[];for(let a=0;a<c;a++)r.push(i());return await Promise.all(r),n},normalizeSubmission(e,s=!1){var t,n,o,i,c;if(s&&(!Array.isArray((t=e.commentsConnection)==null?void 0:t.nodes)||!Array.isArray((n=e.rubricAssessmentsConnection)==null?void 0:n.nodes)))throw new Error("Submission comments or rubric details are missing.");return{...e,quiz_id:(o=e==null?void 0:e.quiz)==null?void 0:o._id,user:{id:e.user._id,name:e.user.name},comments:s?((i=e.commentsConnection)==null?void 0:i.nodes)||[]:[],rubric_assessments:s?((c=e.rubricAssessmentsConnection)==null?void 0:c.nodes)||[]:[],detailsLoaded:s}},getSubmissionDate(e){let s=e.submittedAt;return s===null&&(s=e.gradedAt),s},getFilteredSubmissions(e){let s=this,t=s.startDate,n=s.endDate,o=s.section,i=null;if(o!=="")for(let a=0;a<s.sections.length;a++){let l=s.sections[a];if(l.id===o){i=l;break}}let c=[];if(i!==null){let a=i.students;for(let l=0;l<a.length;l++)c.push(a[l].id)}let r=[];for(let a=0;a<e.length;a++){let l=e[a],d=!1,u=s.getSubmissionDate(l);u!==null&&(u>=t||t===null)&&(u<=n||n===null)&&(d=!0);let g=!0;i!==null&&(g=c.includes(parseInt(l.user.id)));let m=!0;l.submissionStatus=="unsubmitted"&&l.rubric_assessments.length==0&&(m=!1),d&&g&&m&&r.push(l)}return r},async getCourseMeta(e){let s=`
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
            `;return(await $.post("/api/graphql",{query:s})).data.course},async getAssignments(e){let s=[],t=!0,n=null;for(;t;){let o=`
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
              `,c=(await $.post("/api/graphql",{query:o})).data.assignmentGroup.assignmentsConnection;s=s.concat(c.nodes),t=c.pageInfo.hasNextPage,n=c.pageInfo.endCursor}return s.map(o=>{var i;o.id=o._id,o.quiz_id=(i=o==null?void 0:o.quiz)==null?void 0:i._id}),s},async getSubmissions(e,{includeDetails:s=!1}={}){var i,c,r,a;let t=[],n=!0,o=null;for(;n;){let l=`
                query {
                  assignment(id: "${e}") {
                    _id
                    quiz {
                      _id
                    }
                    submissionsConnection(
                      first: 50${o?`, after: "${o}"`:""},
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
                        ${s?`
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
              `,d=await $.post("/api/graphql",{query:l});if((i=d==null?void 0:d.errors)!=null&&i.length)throw new Error(d.errors.map(g=>g.message).join("; "));let u=(r=(c=d==null?void 0:d.data)==null?void 0:c.assignment)==null?void 0:r.submissionsConnection;if(!Array.isArray(u==null?void 0:u.nodes)||typeof((a=u==null?void 0:u.pageInfo)==null?void 0:a.hasNextPage)!="boolean"||u.pageInfo.hasNextPage&&(!u.pageInfo.endCursor||u.pageInfo.endCursor===o))throw new Error("Canvas returned incomplete submission data.");t=t.concat(u.nodes),n=u.pageInfo.hasNextPage,o=u.pageInfo.endCursor}return t},async getGraphQLData(e){try{let s=await this.getCourseMeta(e),t=s.assignmentGroupsConnection.nodes.filter(i=>i.state==="available"),n=6;await Promise.all(t.map(async i=>{i.assignments=await this.getAssignments(i.id)}));let o=t.flatMap(i=>i.assignments||[]);return await this.mapWithConcurrency(o,n,async i=>{try{let c=await this.getSubmissions(i._id);i.submissions=c.map(r=>this.normalizeSubmission(r))}catch(c){console.error(`Failed to load submissions for assignment ${i._id}`,c),i.submissions=[]}i.submissionDetailsLoaded=!1}),{id:e,name:s.name,course_code:s.courseCode,assignment_groups:t}}catch(s){return console.error(s),{name:"",assignment_groups:[]}}},plainCommentToHTML(e){return e.split(`
`).filter(n=>n.trim()!=="").map(n=>`<p>${n}</p>`).join("")},getComments(e){var n,o;let s=e.comments,t="";if(s.length>0){t=$("<div style='page-break-before: always;' class='btech-accreditation-comments'></div>"),t.append("<h2>Comments</h2>");for(let i=0;i<s.length;i++){let c=s[i],r=$(`<div class='btech-accreditation-comment' style='border-bottom: 1px solid #000;'>
                  ${this.plainCommentToHTML(c.comment)}
                  <p style='text-align: right;'><i>-${(o=(n=c==null?void 0:c.author)==null?void 0:n.name)!=null?o:"automated comment"}, ${this.dateToString(c.createdAt)}</i></p>
                </div>`);t.append(r)}}return t},async downloadAttachments(e){for(let s=0;s<e.length;s++){let t=e[s];await this.downloadSingleAttachment(t)}},downloadSingleAttachment(e){return new Promise(s=>{window.open(e.url,"_blank"),setTimeout(s,100)})},async downloadSubmission(e,s){var o;let t=this,n=s.submissionType;if(t.preparingDocument=!0,t.needsToWait=!1,n=="online_quiz"){let i="/courses/"+t.courseId+"/assignments/"+e.id+"/submissions/"+s.user.id+"?preview=1";i=`/courses/${t.courseId}/quizzes/${e.quiz_id}/history?user_id=${s.user.id}`,await t.createIframe(i,t.downloadQuiz,{submission:s,assignment:e}),t.needsToWait=!0}if(n=="discussion_topic"){let i="/courses/"+t.courseId+"/assignments/"+e.id+"/submissions/"+s.user.id+"?preview=1";await t.createIframe(i,t.downloadDiscussion,{submission:s,assignment:e}),t.needsToWait=!0}if(s.rubric_assessments.length>0){let i="/courses/"+t.courseId+"/assignments/"+e.id+"/submissions/"+s.user.id;await t.createIframe(i,t.downloadRubric,{submission:s,assignment:e}),t.needsToWait=!0}else{let i="/courses/"+t.courseId+"/assignments/"+e.id+"/submissions/"+s.user.id;await t.createIframe(i,t.downloadComments,{submission:s,assignment:e}),t.needsToWait=!0}((o=s==null?void 0:s.attachments)==null?void 0:o.length)>0&&await this.downloadAttachments(s.attachments),t.needsToWait===!1&&(t.preparingDocument=!1)},checkLTI(e){let s=e.submissionType;if(s==="basic_lti_launch"){let t=e.previewUrl;window.open(t,"_blank")}s=="external_tool"&&alert("This is an assignment handled by a third party tool. You will need to pull evidence from the tool directly.")},async downloadComments(e,s,t){let n=this,o=e.attr("id"),i=this.getTitle(t)+" submission comments",c=n.getComments(t.submission);this.addRequiredInformation(s,t.submission,t.assignment),s.append(c);let r=document.getElementById(o).contentWindow,a=$("title").text();$("title").text(i),r.onafterprint=l=>{$("title").text(a),n.preparingDocument=!1,n.checkLTI(t.submission),e.remove()},r.focus(),r.print()},addRequiredInformation(e,s,t){var n,o;e.prepend("<p>Submitted: <span style='background-color: #FF0;'>"+this.getSubmissionDate(s)+"</span></p>"),e.prepend("<p>Student: <span style='background-color: #FF0;'>"+(this.anonymous?"Anonymous User "+s.user.id:s.user.name)+"</span></p>"),(o=(n=this.campuses)==null?void 0:n[s.user.id])!=null&&o&&e.prepend("<p>Campus: <span style='background-color: #FF0;'>"+this.campuses[s.user.id]+"</span></p>"),e.prepend("<p>Title: <span style='background-color: #FF0;'>"+t.name+"</span></p>"),e.prepend("<p>Course: <span style='background-color: #FF0;'>"+this.courseData.name+" ("+this.courseData.course_code+")</span></p>")},getTitle(e){return this.courseData.name+" - "+e.assignment.name+" - "+(this.anonymous?"Anonymous User "+e.submission.user.id:e.submission.user.name)},async downloadRubric(e,s,t){let n=this,o=this.getTitle(t)+" submission rubric",i=e[0].contentWindow,c=i.document,r=document.title,a=()=>{document.title=r,n.preparingDocument=!1,e.remove()};try{let l=await C(c),d=$(I(c,l));n.addRequiredInformation(d,t.submission,t.assignment),d.append(n.getComments(t.submission)),c.title=o,await A(c),document.title=o,i.onafterprint=()=>{a(),n.checkLTI(t.submission)},i.focus(),i.print()}catch(l){a(),console.error("Unable to prepare rubric export",l),alert("Unable to prepare this rubric for printing. "+l.message)}},async downloadNewQuiz(e,s,t){let n=this,o=e.attr("id"),i=o.replace("btech-content-",""),c=this.getTitle(t)+" submission";this.addRequiredInformation(s,t.submission,t.assignment);let r=n.getComments(t.submission);s.append(r);let a=$("title").text();$("title").text(c);let l=document.getElementById(o).contentWindow;l.onafterprint=d=>{$("title").text(a),n.preparingDocument=!1},l.focus(),l.print()},async downloadDiscussion(e,s,t){let n=this,o=e.attr("id"),i=o.replace("btech-content-",""),c=this.getTitle(t)+" submission";this.addRequiredInformation(s,t.submission,t.assignment);let r=n.getComments(t.submission);s.append(r);let a=$("title").text();$("title").text(c);let l=document.getElementById(o).contentWindow;l.onafterprint=d=>{$("title").text(a),n.preparingDocument=!1,e.remove()},l.focus(),l.print()},async downloadQuiz(e,s,t){let n=this,o=e.attr("id"),i=o.replace("btech-content-",""),c=this.getTitle(t)+" submission";this.addRequiredInformation(s,t.submission,t.assignment);let r=n.getComments(t.submission);s.append(r);let a=$("title").text();$("title").text(c);let l=document.getElementById(o).contentWindow,d=l.document,u=()=>{d.querySelectorAll(".answer").forEach(m=>{let w=m.classList.contains("selected_answer"),x=m.classList.contains("correct_answer"),f=d.createElement("span");f.style.fontWeight="bold",f.style.fontSize="14px",f.style.marginLeft="0.5em",w&&x?(f.textContent="\u2714 Correct (Your Answer)",f.style.color="green"):w&&!x?(f.textContent="\u2718 Incorrect (Your Answer)",f.style.color="red"):!w&&x?(f.textContent="\u2714 Correct Answer",f.style.color="green"):f.textContent="";let D=m.querySelector(".answer_html")||m.querySelector(".answer_match_right")||m.querySelector(".answer_text")||m.querySelector("select")||m.querySelector(".answer_type")||m;f.textContent!==""&&D.appendChild(f);let _=d.createElement("hr");_.style.border="0",_.style.borderTop="1px solid #aaa",_.style.margin="10px 0",m.appendChild(_)})};d.readyState==="complete"?(u(),l.focus(),l.onafterprint=()=>{$("title").text(a),n.preparingDocument=!1,e.remove()},l.print()):e.on("load",()=>{u(),l.focus(),l.onafterprint=()=>{$("title").text(a),n.preparingDocument=!1,e.remove()},l.print()})},async createIframe(e,s=null,t={}){let n;do n="btech-content-"+ ++b;while(document.getElementById(n));let o=$('<iframe id="'+n+'" style="width: 1200px;" src="'+e+'"></iframe>');o.hide(),$("#content").append(o);let i=document.getElementById(n).contentWindow;return i.onload=function(){let c=$(i.document.getElementsByTagName("body")[0]),r=c.find("img");s!==null&&s(o,c,t)},o},async openModal(e,{force:s=!1}={}){let t=this,n=++t.assignmentDetailsRequestId;if(t.showModal=!0,t.currentAssignment=e,t.submissions=[],t.assignmentDetailsError="",t.loadingAssignmentDetails=!1,s||e.submissionDetailsLoaded!==!0){e.submissionDetailsLoaded=!1,t.loadingAssignmentDetails=!0;try{let i=(await t.getSubmissions(e.id,{includeDetails:!0})).map(c=>t.normalizeSubmission(c,!0));if(n!==t.assignmentDetailsRequestId)return;e.submissions=i,e.submissionDetailsLoaded=!0}catch(o){if(console.error(o),n!==t.assignmentDetailsRequestId)return;t.assignmentDetailsError="Unable to load assignment details. Comments and rubrics could not be verified. Please retry.";return}finally{n===t.assignmentDetailsRequestId&&(t.loadingAssignmentDetails=!1)}}t.submissions=e.submissions},submittedAssignments(e){let s=[];for(let t=0;t<e.length;t++){let n=e[t];n.workflow_state!="unsubmitted"&&s.push(n)}return s},dateToString(e){return e=new Date(Date.parse(e)),e.getFullYear()+"-"+(e.getMonth()+1)+"-"+e.getDate()},close(){let e=this;e.showModal=!1,e.assignmentDetailsRequestId+=1,e.loadingAssignmentDetails=!1}}});let p=[];for(let e=0;e<p.length;e++){let s=p[e];$("#content").append("<h2>"+s.name+" ("+s.group_weight+"%)</h2>")}}}})();})();
