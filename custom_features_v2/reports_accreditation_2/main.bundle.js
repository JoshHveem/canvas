(()=>{function k(u,w=15e3){let b=()=>{let g=u.querySelector('[data-testid="enhanced-rubric-assessment-container"]');if(g!=null&&g.querySelector("[data-criterion-id], [data-criterion-score-id], [data-criterion-comment-id]"))return g;let t=u.querySelector(".react_rubric_container");if(t!=null&&t.querySelector("tbody tr, [data-criterion-id]"))return t;let s=u.querySelector("#rubric_holder");return s!=null&&s.querySelector(".rubric_table tbody tr, .rubric_table .criterion")?s:null},h=b();return h?Promise.resolve(h):new Promise((g,t)=>{let s=!1,e=()=>{let n=u.querySelector(".assess_submission_link");s||!n||n.disabled||(s=!0,n.click())},r=new MutationObserver(()=>{let n=b();if(!n){e();return}r.disconnect(),clearTimeout(i),g(n)}),i=setTimeout(()=>{r.disconnect(),t(new Error("Canvas did not render a supported rubric for this submission."))},w);r.observe(u.body,{childList:!0,subtree:!0,attributes:!0}),e()})}async function q(u,{courseId:w,assignmentId:b,userId:h},g=fetch){var y,f,_;let t=`/api/v1/courses/${encodeURIComponent(w)}/assignments/${encodeURIComponent(b)}`,s=async v=>{let m=await g(v,{credentials:"include"});if(!m.ok)throw new Error(`Canvas could not load rubric data (HTTP ${m.status}).`);return m.json()},[e,r]=await Promise.all([s(t),s(`${t}/submissions/${encodeURIComponent(h)}?include[]=rubric_assessment`)]),i=e.rubric,n=r.rubric_assessment;if(!Array.isArray(i)||!i.length||!n||!i.some(v=>Object.prototype.hasOwnProperty.call(n,v.id)))throw new Error("Canvas did not return an assessed rubric for this submission.");let o=(v,m)=>{let C=u.createElement(v);return m!==void 0&&(C.textContent=String(m)),C},a=o("section");a.className="btech-api-rubric",a.append(o("h2","Assessed rubric"));let c=o("table");c.className="rubric_table";let l=o("thead"),d=o("tr");for(let v of["Criterion","Ratings","Score","Instructor comments"])d.append(o("th",v));l.append(d);let p=o("tbody");for(let v of i){let m=n[v.id],C=o("tr"),x=o("td");x.append(o("strong",v.description||"Criterion")),v.long_description&&x.append(o("p",v.long_description));let E=o("td");for(let I of v.ratings||[]){let T=(m==null?void 0:m.rating_id)!=null&&String(m.rating_id)===String(I.id),S=o("p",`${T?"Selected: ":""}${I.description||""} (${(y=I.points)!=null?y:"\u2014"} pts)`);T&&(S.style.fontWeight="bold"),I.long_description&&S.append(o("span",` \u2014 ${I.long_description}`)),E.append(S)}C.append(x,E,o("td",`${(f=m==null?void 0:m.points)!=null?f:"Not scored"} / ${(_=v.points)!=null?_:"\u2014"}`),o("td",(m==null?void 0:m.comments)||"")),p.append(C)}return c.append(l,p),a.append(c),a}function D(u,w){let b=w.cloneNode(!0),h=w.querySelectorAll("*");b.querySelectorAll("*").forEach((e,r)=>{var n;let i=(n=u.defaultView)==null?void 0:n.getComputedStyle(h[r]);i&&[i.overflowX,i.overflowY].some(o=>o==="auto"||o==="scroll")&&(e.style.overflow="visible",e.style.maxHeight="none",e.style.height="auto")});let g=w.querySelectorAll("input, textarea, select");b.querySelectorAll("input, textarea, select").forEach((e,r)=>{let i=g[r];if(i.type==="hidden"){e.remove();return}let n=u.createElement(i.tagName==="TEXTAREA"?"div":"span");n.className=i.tagName==="TEXTAREA"?"btech-print-field btech-print-comment":"btech-print-field",n.textContent=i.tagName==="SELECT"?Array.from(i.selectedOptions,o=>o.textContent).join(", "):i.type==="checkbox"||i.type==="radio"?i.checked?"Selected":"Not selected":i.value,e.replaceWith(n)}),b.querySelectorAll("button").forEach(e=>{var n;if(!e.matches('[data-testid^="rubric-rating-button-"], [data-testid^="traditional-criterion-"][data-testid*="-ratings-"]')){e.remove();return}let r=e.querySelector('[data-testid$="-selected"]')||((n=e.parentElement)==null?void 0:n.querySelector('[data-testid="rubric-rating-button-selected"]')),i=u.createElement("div");if(i.className=e.className,i.style.cssText=e.style.cssText,i.append(...Array.from(e.childNodes)),r){let o=u.createElement("strong");o.textContent=" Selected",i.append(o)}e.replaceWith(i)}),b.querySelectorAll("script, .screenreader-only, .no-print").forEach(e=>e.remove()),b.style.display="block",b.style.maxHeight="none",b.style.overflow="visible";let t=u.createElement("main");t.id="btech-accreditation-rubric-export",t.append(b);let s=u.createElement("style");return s.textContent=`
    @page { margin: 14mm; }
    html, body { min-width: 0 !important; height: auto !important; overflow: visible !important; }
    body { margin: 0 !important; padding: 0 !important; }
    #btech-accreditation-rubric-export { font: 12px/1.45 Arial, sans-serif; color: #111; overflow-wrap: anywhere; }
    #btech-accreditation-rubric-export > p { margin: 0 0 8px; }
    #btech-accreditation-rubric-export #rubric_holder,
    #btech-accreditation-rubric-export [data-testid="enhanced-rubric-assessment-container"],
    #btech-accreditation-rubric-export #rubric-assessment-view-container,
    #btech-accreditation-rubric-export [data-testid="rubric-assessment-traditional-view"],
    #btech-accreditation-rubric-export .react_rubric_container,
    #btech-accreditation-rubric-export .rubric_container { width: auto !important; min-width: 0 !important; max-width: none !important; max-height: none !important; overflow: visible !important; }
    #btech-accreditation-rubric-export .rubric_table { width: 100% !important; border-collapse: collapse; }
    #btech-accreditation-rubric-export th,
    #btech-accreditation-rubric-export td { padding: 8px; vertical-align: top; }
    #btech-accreditation-rubric-export tr { break-inside: avoid; }
    #btech-accreditation-rubric-export .btech-print-field { font: inherit; overflow-wrap: anywhere; }
    #btech-accreditation-rubric-export .btech-print-comment { white-space: pre-wrap; margin-top: 6px; }
    #btech-accreditation-rubric-export .btech-accreditation-comments { padding-top: 12px; }
    #btech-accreditation-rubric-export a { overflow-wrap: anywhere; }
  `,u.head.append(s),u.body.replaceChildren(t),t}async function R(u,w=1e4){var g;let b=Promise.all([(g=u.fonts)==null?void 0:g.ready,...Array.from(u.images,t=>t.complete?Promise.resolve():t.decode().catch(()=>{}))]),h;try{await Promise.race([b,new Promise((t,s)=>{h=setTimeout(()=>s(new Error("Rubric print assets did not finish loading.")),w)})])}finally{clearTimeout(h)}}var A="data-btech-print-media-link",P="btech-print-media-links-style";function F(u,w,b=!1){var t,s;let h;try{h=new URL(u,w)}catch(e){return null}if(!u||!["https:","http:"].includes(h.protocol))return null;let g=h.hostname.toLowerCase();if(/(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be)$/.test(g)){let e=g==="youtu.be"?h.pathname.split("/")[1]:((t=h.pathname.match(/^\/(?:embed|shorts|v)\/([^/]+)/))==null?void 0:t[1])||h.searchParams.get("v");return e&&/^[\w-]+$/.test(e)?`https://www.youtube.com/watch?v=${encodeURIComponent(e)}`:null}if(g==="player.vimeo.com"){let e=(s=h.pathname.match(/^\/video\/(\d+)/))==null?void 0:s[1];if(e)return`https://vimeo.com/${e}${h.searchParams.has("h")?"/"+encodeURIComponent(h.searchParams.get("h")):""}`}return b||/(^|\.)(vimeo\.com|kaltura\.com|instructuremedia\.com)$/.test(g)||g==="kaltura.bridgetools.dev"||/(^|\.)instructure\.com$/.test(g)&&/\/media_(?:objects|attachments)(?:_iframe)?\//.test(h.pathname)?h.href:null}function L(u){let w=u.body;if(!w||u.getElementById(P))return;let b=u.createElement("style");b.id=P,b.textContent=`
    [${A}] { display: none !important; }
    @media print {
      [${A}] { display: block !important; overflow-wrap: anywhere; margin: 8px 0; }
      [${A}] a { color: #111 !important; text-decoration: underline; }
    }
  `,u.head.append(b);let h=new Map,g=()=>{for(let[e,r]of h)w.contains(e)||(r.remove(),h.delete(e));w.querySelectorAll(".user_content iframe, .user_content video, .user_content audio").forEach(e=>{var c;let r=e.getAttribute("src")||((c=e.querySelector("source[src]"))==null?void 0:c.getAttribute("src")),i=F(r,u.baseURI,e.tagName!=="IFRAME"),n=h.get(e);if(!i){n==null||n.remove(),h.delete(e);return}if(!n){n=u.createElement("span"),n.setAttribute(A,"");let l=u.createElement("a");n.append(l),h.set(e,n)}let o=n.firstElementChild;o.getAttribute("href")!==i&&(o.href=i,o.textContent=i);let a=e;for(let l=e.parentElement;l&&!l.classList.contains("user_content");l=l.parentElement)l.matches('.instructure_resizable, .media_comment, [data-test-id="youtube-migration-container"]')&&(a=l);n.parentElement!==a.parentElement&&a.before(n)})};g();let t=u.defaultView.MutationObserver;new t(g).observe(w,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["src"]}),u.defaultView.addEventListener("beforeprint",g)}(async function(){let u=0;if(document.title==="BTECH Accreditation"){if($("#accreditation").length>0)return;let w=/^\/courses\/([0-9]+)/;if(w.test(window.location.pathname)){await Promise.all(["https://html2canvas.hertzen.com/dist/html2canvas.min.js","https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.1.1/jspdf.umd.js","https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js","https://cdn.jsdelivr.net/npm/file-saver@2.0.2/dist/FileSaver.min.js"].map(t=>$.getScript(window.btechAssetUrl?window.btechAssetUrl(t):t)));let b=parseInt(window.location.pathname.match(w)[1]);await $.put(`https://btech.instructure.com/api/v1/courses/${b}/gradebook_settings`,{gradebook_settings:{show_concluded_enrollments:!0}});let h=`
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
                    <i v-if="hasComments(submission)" class='icon-check'></i>
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
      </div>`;$("#content").html("<div id='accreditation'><div id='accreditation-app'></div></div>"),new Vue({el:"#accreditation-app",template:h,mounted:async function(){this.courseId=b;let t=await this.getGraphQLData(this.courseId);this.courseData={name:t.name,course_code:t.course_code};let s=this.courseData.course_code;this.assignmentGroups=t.assignment_groups,this.loadingCourse=!1;let e=await canvasGet("/api/v1/courses/"+this.courseId+"/sections?include[]=students");this.sections=e;let r=a=>{if(a!=null&&a.sis_data__is_distance_approved)return"Online";let c=String((a==null?void 0:a.sis_data__campus_code)||"").trim().toUpperCase();return c==="L"?"Logan Campus":c==="B"?"Brigham City Campus":c},i=(a,c)=>{let l=String((a==null?void 0:a.sis_data__course_type)||"").trim().toUpperCase();return l||(c.toLowerCase().includes("hs")?"HS":c!==""?"CS":"")},n=a=>{let c=0;return a!=null&&a.is_deleted||(c+=100),a!=null&&a.is_active&&(c+=50),a!=null&&a.is_concluded||(c+=25),a!=null&&a.exit_date||(c+=10),c},o={};try{let a=await bridgetools.req3("reports",{canvas_course_id:{op:"=",value:this.courseId}},{dataset:"canvas_enrollments"}),c=Array.isArray(a)?a:[];for(let l=0;l<c.length;l++){let d=c[l],p=d==null?void 0:d.canvas_user_id;if(p==null)continue;let y=o[p];if(!y){o[p]=d;continue}let f=n(y),_=n(d);if(_>f){o[p]=d;continue}if(_===f){let v=Date.parse((y==null?void 0:y.entry_date)||(y==null?void 0:y.last_active_at)||0)||0;(Date.parse((d==null?void 0:d.entry_date)||(d==null?void 0:d.last_active_at)||0)||0)>v&&(o[p]=d)}}}catch(a){console.error("Failed to load accreditation enrollment data",a)}for(let a in e){let c=e[a];for(let l in c.students){let d=c.students[l];if(d.id in this.campuses)continue;this.campuses[d.id]="";let p=o[d.id];if(!p)continue;let y=r(p);this.campuses[d.id]=y;let f=i(p,y);f!==""&&(this.enrollmentTypes[d.id]=f)}}},data:function(){return{anonymous:!1,assignmentGroups:{},courseData:{},enrollments:[],courseId:null,currentUser:"",showModal:!1,preparingDocument:!1,submissions:[],currentAssignment:{},startDate:null,endDate:null,sections:[],section:"",needsToWait:!1,sortBy:"name",campuses:{},enrollmentTypes:{},loadingCourse:!0,loadingAssignmentDetails:!1,assignmentDetailsError:"",assignmentDetailsRequestId:0}},methods:{async mapWithConcurrency(t,s,e){let r=new Array(t.length),i=0;async function n(){for(;;){let c=i;if(i+=1,c>=t.length)return;r[c]=await e(t[c],c)}}let o=Math.min(s,t.length),a=[];for(let c=0;c<o;c++)a.push(n());return await Promise.all(a),r},normalizeSubmission(t,s=!1){var e,r,i,n,o;if(s&&(!Array.isArray((e=t.commentsConnection)==null?void 0:e.nodes)||!Array.isArray((r=t.rubricAssessmentsConnection)==null?void 0:r.nodes)))throw new Error("Submission comments or rubric details are missing.");return{...t,quiz_id:(i=t==null?void 0:t.quiz)==null?void 0:i._id,user:{id:t.user._id,name:t.user.name},comments:s?((n=t.commentsConnection)==null?void 0:n.nodes)||[]:[],rubric_assessments:s?((o=t.rubricAssessmentsConnection)==null?void 0:o.nodes)||[]:[],detailsLoaded:s}},hasComments(t){var s;return((s=t==null?void 0:t.comments)==null?void 0:s.length)>0?!0:((t==null?void 0:t.rubric_assessments)||[]).some(e=>(e.assessmentRatings||[]).some(r=>this.hasCommentContent(r.comments,r.commentsHtml)))},hasCommentContent(t,s){if(typeof t=="string"&&t.trim().length>0)return!0;if(typeof s!="string")return!1;let e=s.replace(/<!--[\s\S]*?-->/g,"");return/<(?:img|audio|video|iframe)\b/i.test(e)?!0:e.replace(/<[^>]*>/g,"").replace(/&(?:nbsp|#0*160|#x0*a0);/gi," ").replace(/[\s\u200b-\u200d\ufeff]/g,"").length>0},getSubmissionDate(t){let s=t.submittedAt;return s===null&&(s=t.gradedAt),s},getFilteredSubmissions(t){let s=this,e=s.startDate,r=s.endDate,i=s.section,n=null;if(i!=="")for(let c=0;c<s.sections.length;c++){let l=s.sections[c];if(l.id===i){n=l;break}}let o=[];if(n!==null){let c=n.students;for(let l=0;l<c.length;l++)o.push(c[l].id)}let a=[];for(let c=0;c<t.length;c++){let l=t[c],d=!1,p=s.getSubmissionDate(l);p!==null&&(p>=e||e===null)&&(p<=r||r===null)&&(d=!0);let y=!0;n!==null&&(y=o.includes(parseInt(l.user.id)));let f=!0;l.submissionStatus=="unsubmitted"&&l.rubric_assessments.length==0&&(f=!1),d&&y&&f&&a.push(l)}return a},async getCourseMeta(t){let s=`
              query {
                course(id: "${t}") {
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
            `;return(await $.post("/api/graphql",{query:s})).data.course},async getAssignments(t){let s=[],e=!0,r=null;for(;e;){let i=`
                query {
                  assignmentGroup(id: "${t}") {
                    _id

                    assignmentsConnection(first: 50${r?`, after: "${r}"`:""}) {
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
              `,o=(await $.post("/api/graphql",{query:i})).data.assignmentGroup.assignmentsConnection;s=s.concat(o.nodes),e=o.pageInfo.hasNextPage,r=o.pageInfo.endCursor}return s.map(i=>{var n;i.id=i._id,i.quiz_id=(n=i==null?void 0:i.quiz)==null?void 0:n._id}),s},async getSubmissions(t,{includeDetails:s=!1}={}){var n,o,a,c;let e=[],r=!0,i=null;for(;r;){let l=`
                query {
                  assignment(id: "${t}") {
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
                            assessmentRatings {
                              comments
                              commentsHtml
                            }
                          }
                        }`:""}
                      }
                    }
                  }
                }
              `,d=await $.post("/api/graphql",{query:l});if((n=d==null?void 0:d.errors)!=null&&n.length)throw new Error(d.errors.map(y=>y.message).join("; "));let p=(a=(o=d==null?void 0:d.data)==null?void 0:o.assignment)==null?void 0:a.submissionsConnection;if(!Array.isArray(p==null?void 0:p.nodes)||typeof((c=p==null?void 0:p.pageInfo)==null?void 0:c.hasNextPage)!="boolean"||p.pageInfo.hasNextPage&&(!p.pageInfo.endCursor||p.pageInfo.endCursor===i))throw new Error("Canvas returned incomplete submission data.");e=e.concat(p.nodes),r=p.pageInfo.hasNextPage,i=p.pageInfo.endCursor}return e},async getGraphQLData(t){try{let s=await this.getCourseMeta(t),e=s.assignmentGroupsConnection.nodes.filter(n=>n.state==="available"),r=6;await Promise.all(e.map(async n=>{n.assignments=await this.getAssignments(n.id)}));let i=e.flatMap(n=>n.assignments||[]);return await this.mapWithConcurrency(i,r,async n=>{try{let o=await this.getSubmissions(n._id);n.submissions=o.map(a=>this.normalizeSubmission(a))}catch(o){console.error(`Failed to load submissions for assignment ${n._id}`,o),n.submissions=[]}n.submissionDetailsLoaded=!1}),{id:t,name:s.name,course_code:s.courseCode,assignment_groups:e}}catch(s){return console.error(s),{name:"",assignment_groups:[]}}},plainCommentToHTML(t){return t.split(`
`).filter(r=>r.trim()!=="").map(r=>`<p>${r}</p>`).join("")},getComments(t){var r,i;let s=t.comments,e="";if(s.length>0){e=$("<div style='page-break-before: always;' class='btech-accreditation-comments'></div>"),e.append("<h2>Comments</h2>");for(let n=0;n<s.length;n++){let o=s[n],a=$(`<div class='btech-accreditation-comment' style='border-bottom: 1px solid #000;'>
                  ${this.plainCommentToHTML(o.comment)}
                  <p style='text-align: right;'><i>-${(i=(r=o==null?void 0:o.author)==null?void 0:r.name)!=null?i:"automated comment"}, ${this.dateToString(o.createdAt)}</i></p>
                </div>`);e.append(a)}}return e},async downloadAttachments(t){for(let s=0;s<t.length;s++){let e=t[s];await this.downloadSingleAttachment(e)}},downloadSingleAttachment(t){return new Promise(s=>{window.open(t.url,"_blank"),setTimeout(s,100)})},async downloadSubmission(t,s){var i;let e=this,r=s.submissionType;if(e.preparingDocument=!0,e.needsToWait=!1,r=="online_quiz"){let n="/courses/"+e.courseId+"/assignments/"+t.id+"/submissions/"+s.user.id+"?preview=1";n=`/courses/${e.courseId}/quizzes/${t.quiz_id}/history?user_id=${s.user.id}`,await e.createIframe(n,e.downloadQuiz,{submission:s,assignment:t}),e.needsToWait=!0}if(r=="discussion_topic"){let n="/courses/"+e.courseId+"/assignments/"+t.id+"/submissions/"+s.user.id+"?preview=1";await e.createIframe(n,e.downloadDiscussion,{submission:s,assignment:t}),e.needsToWait=!0}if(s.rubric_assessments.length>0){let n="/courses/"+e.courseId+"/assignments/"+t.id+"/submissions/"+s.user.id;await e.createIframe(n,e.downloadRubric,{submission:s,assignment:t}),e.needsToWait=!0}else{let n="/courses/"+e.courseId+"/assignments/"+t.id+"/submissions/"+s.user.id;await e.createIframe(n,e.downloadComments,{submission:s,assignment:t}),e.needsToWait=!0}((i=s==null?void 0:s.attachments)==null?void 0:i.length)>0&&await this.downloadAttachments(s.attachments),e.needsToWait===!1&&(e.preparingDocument=!1)},checkLTI(t){let s=t.submissionType;if(s==="basic_lti_launch"){let e=t.previewUrl;window.open(e,"_blank")}s=="external_tool"&&alert("This is an assignment handled by a third party tool. You will need to pull evidence from the tool directly.")},async downloadComments(t,s,e){let r=this,i=t.attr("id"),n=this.getTitle(e)+" submission comments",o=r.getComments(e.submission);this.addRequiredInformation(s,e.submission,e.assignment),s.append(o);let a=document.getElementById(i).contentWindow,c=$("title").text();$("title").text(n),a.onafterprint=l=>{$("title").text(c),r.preparingDocument=!1,r.checkLTI(e.submission),t.remove()},a.focus(),a.print()},addRequiredInformation(t,s,e){var r,i;t.prepend("<p>Submitted: <span style='background-color: #FF0;'>"+this.getSubmissionDate(s)+"</span></p>"),t.prepend("<p>Student: <span style='background-color: #FF0;'>"+(this.anonymous?"Anonymous User "+s.user.id:s.user.name)+"</span></p>"),(i=(r=this.campuses)==null?void 0:r[s.user.id])!=null&&i&&t.prepend("<p>Campus: <span style='background-color: #FF0;'>"+this.campuses[s.user.id]+"</span></p>"),t.prepend("<p>Title: <span style='background-color: #FF0;'>"+e.name+"</span></p>"),t.prepend("<p>Course: <span style='background-color: #FF0;'>"+this.courseData.name+" ("+this.courseData.course_code+")</span></p>")},getTitle(t){return this.courseData.name+" - "+t.assignment.name+" - "+(this.anonymous?"Anonymous User "+t.submission.user.id:t.submission.user.name)},async downloadRubric(t,s,e){let r=this,i=this.getTitle(e)+" submission rubric",n=t[0].contentWindow,o=n.document,a=document.title,c=()=>{document.title=a,r.preparingDocument=!1,t.remove()};try{let l;try{l=await k(o)}catch(p){l=await q(o,{courseId:r.courseId,assignmentId:e.assignment.id,userId:e.submission.user.id})}let d=$(D(o,l));r.addRequiredInformation(d,e.submission,e.assignment),d.append(r.getComments(e.submission)),o.title=i,await R(o),document.title=i,n.onafterprint=()=>{c(),r.checkLTI(e.submission)},n.focus(),n.print()}catch(l){c(),console.error("Unable to prepare rubric export",l),alert("Unable to prepare this rubric for printing. "+l.message)}},async downloadNewQuiz(t,s,e){let r=this,i=t.attr("id"),n=i.replace("btech-content-",""),o=this.getTitle(e)+" submission";this.addRequiredInformation(s,e.submission,e.assignment);let a=r.getComments(e.submission);s.append(a);let c=$("title").text();$("title").text(o);let l=document.getElementById(i).contentWindow;l.onafterprint=d=>{$("title").text(c),r.preparingDocument=!1},l.focus(),l.print()},async downloadDiscussion(t,s,e){let r=this,i=t.attr("id"),n=i.replace("btech-content-",""),o=this.getTitle(e)+" submission";this.addRequiredInformation(s,e.submission,e.assignment);let a=r.getComments(e.submission);s.append(a);let c=$("title").text();$("title").text(o);let l=document.getElementById(i).contentWindow;l.onafterprint=d=>{$("title").text(c),r.preparingDocument=!1,t.remove()},l.focus(),l.print()},async downloadQuiz(t,s,e){let r=this,i=t.attr("id"),n=i.replace("btech-content-",""),o=this.getTitle(e)+" submission";this.addRequiredInformation(s,e.submission,e.assignment);let a=r.getComments(e.submission);s.append(a);let c=$("title").text();$("title").text(o);let l=document.getElementById(i).contentWindow,d=l.document,p=()=>{d.querySelectorAll(".answer").forEach(f=>{let _=f.classList.contains("selected_answer"),v=f.classList.contains("correct_answer"),m=d.createElement("span");m.style.fontWeight="bold",m.style.fontSize="14px",m.style.marginLeft="0.5em",_&&v?(m.textContent="\u2714 Correct (Your Answer)",m.style.color="green"):_&&!v?(m.textContent="\u2718 Incorrect (Your Answer)",m.style.color="red"):!_&&v?(m.textContent="\u2714 Correct Answer",m.style.color="green"):m.textContent="";let C=f.querySelector(".answer_html")||f.querySelector(".answer_match_right")||f.querySelector(".answer_text")||f.querySelector("select")||f.querySelector(".answer_type")||f;m.textContent!==""&&C.appendChild(m);let x=d.createElement("hr");x.style.border="0",x.style.borderTop="1px solid #aaa",x.style.margin="10px 0",f.appendChild(x)})};d.readyState==="complete"?(p(),l.focus(),l.onafterprint=()=>{$("title").text(c),r.preparingDocument=!1,t.remove()},l.print()):t.on("load",()=>{p(),l.focus(),l.onafterprint=()=>{$("title").text(c),r.preparingDocument=!1,t.remove()},l.print()})},async createIframe(t,s=null,e={}){let r;do r="btech-content-"+ ++u;while(document.getElementById(r));let i=$('<iframe id="'+r+'" style="width: 1200px;" src="'+t+'"></iframe>');i.hide(),$("#content").append(i);let n=document.getElementById(r).contentWindow;return n.onload=function(){L(n.document);let o=$(n.document.getElementsByTagName("body")[0]),a=o.find("img");s!==null&&s(i,o,e)},i},async openModal(t,{force:s=!1}={}){let e=this,r=++e.assignmentDetailsRequestId;if(e.showModal=!0,e.currentAssignment=t,e.submissions=[],e.assignmentDetailsError="",e.loadingAssignmentDetails=!1,s||t.submissionDetailsLoaded!==!0){t.submissionDetailsLoaded=!1,e.loadingAssignmentDetails=!0;try{let n=(await e.getSubmissions(t.id,{includeDetails:!0})).map(o=>e.normalizeSubmission(o,!0));if(r!==e.assignmentDetailsRequestId)return;t.submissions=n,t.submissionDetailsLoaded=!0}catch(i){if(console.error(i),r!==e.assignmentDetailsRequestId)return;e.assignmentDetailsError="Unable to load assignment details. Comments and rubrics could not be verified. Please retry.";return}finally{r===e.assignmentDetailsRequestId&&(e.loadingAssignmentDetails=!1)}}e.submissions=t.submissions},submittedAssignments(t){let s=[];for(let e=0;e<t.length;e++){let r=t[e];r.workflow_state!="unsubmitted"&&s.push(r)}return s},dateToString(t){return t=new Date(Date.parse(t)),t.getFullYear()+"-"+(t.getMonth()+1)+"-"+t.getDate()},close(){let t=this;t.showModal=!1,t.assignmentDetailsRequestId+=1,t.loadingAssignmentDetails=!1}}});let g=[];for(let t=0;t<g.length;t++){let s=g[t];$("#content").append("<h2>"+s.name+" ("+s.group_weight+"%)</h2>")}}}})();})();
