(()=>{function k(u,y=15e3){let h=()=>{let g=u.querySelector('[data-testid="enhanced-rubric-assessment-container"]');if(g!=null&&g.querySelector("[data-criterion-id], [data-criterion-score-id], [data-criterion-comment-id]"))return g;let b=u.querySelector(".react_rubric_container");if(b!=null&&b.querySelector("tbody tr, [data-criterion-id]"))return b;let t=u.querySelector("#rubric_holder");return t!=null&&t.querySelector(".rubric_table tbody tr, .rubric_table .criterion")?t:null},p=h();return p?Promise.resolve(p):new Promise((g,b)=>{let t=!1,e=()=>{let i=u.querySelector(".assess_submission_link");t||!i||i.disabled||(t=!0,i.click())},n=new MutationObserver(()=>{let i=h();if(!i){e();return}n.disconnect(),clearTimeout(s),g(i)}),s=setTimeout(()=>{n.disconnect(),b(new Error("Canvas did not render a supported rubric for this submission."))},y);n.observe(u.body,{childList:!0,subtree:!0,attributes:!0}),e()})}async function q(u,{courseId:y,assignmentId:h,userId:p},g=fetch){var m,C,w;let b=`/api/v1/courses/${encodeURIComponent(y)}/assignments/${encodeURIComponent(h)}`,t=async v=>{let f=await g(v,{credentials:"include"});if(!f.ok)throw new Error(`Canvas could not load rubric data (HTTP ${f.status}).`);return f.json()},[e,n]=await Promise.all([t(b),t(`${b}/submissions/${encodeURIComponent(p)}?include[]=rubric_assessment`)]),s=e.rubric,i=n.rubric_assessment;if(!Array.isArray(s)||!s.length||!i||!s.some(v=>Object.prototype.hasOwnProperty.call(i,v.id)))throw new Error("Canvas did not return an assessed rubric for this submission.");let r=(v,f)=>{let _=u.createElement(v);return f!==void 0&&(_.textContent=String(f)),_},c=r("section");c.className="btech-api-rubric",c.append(r("h2","Assessed rubric"));let a=r("table");a.className="rubric_table";let o=r("thead"),l=r("tr");for(let v of["Criterion","Ratings","Score","Instructor comments"])l.append(r("th",v));o.append(l);let d=r("tbody");for(let v of s){let f=i[v.id],_=r("tr"),I=r("td");I.append(r("strong",v.description||"Criterion")),v.long_description&&I.append(r("p",v.long_description));let x=r("td");for(let A of v.ratings||[]){let T=(f==null?void 0:f.rating_id)!=null&&String(f.rating_id)===String(A.id),E=r("p",`${T?"Selected: ":""}${A.description||""} (${(m=A.points)!=null?m:"\u2014"} pts)`);T&&(E.style.fontWeight="bold"),A.long_description&&E.append(r("span",` \u2014 ${A.long_description}`)),x.append(E)}_.append(I,x,r("td",`${(C=f==null?void 0:f.points)!=null?C:"Not scored"} / ${(w=v.points)!=null?w:"\u2014"}`),r("td",(f==null?void 0:f.comments)||"")),d.append(_)}return a.append(o,d),c.append(a),c}function D(u,y){let h=y.cloneNode(!0),p=y.querySelectorAll("*");h.querySelectorAll("*").forEach((e,n)=>{var i;let s=(i=u.defaultView)==null?void 0:i.getComputedStyle(p[n]);s&&[s.overflowX,s.overflowY].some(r=>r==="auto"||r==="scroll")&&(e.style.overflow="visible",e.style.maxHeight="none",e.style.height="auto")});let g=y.querySelectorAll("input, textarea, select");h.querySelectorAll("input, textarea, select").forEach((e,n)=>{let s=g[n];if(s.type==="hidden"){e.remove();return}let i=u.createElement(s.tagName==="TEXTAREA"?"div":"span");i.className=s.tagName==="TEXTAREA"?"btech-print-field btech-print-comment":"btech-print-field",i.textContent=s.tagName==="SELECT"?Array.from(s.selectedOptions,r=>r.textContent).join(", "):s.type==="checkbox"||s.type==="radio"?s.checked?"Selected":"Not selected":s.value,e.replaceWith(i)}),h.querySelectorAll("button").forEach(e=>{var i;if(!e.matches('[data-testid^="rubric-rating-button-"], [data-testid^="traditional-criterion-"][data-testid*="-ratings-"]')){e.remove();return}let n=e.querySelector('[data-testid$="-selected"]')||((i=e.parentElement)==null?void 0:i.querySelector('[data-testid="rubric-rating-button-selected"]')),s=u.createElement("div");if(s.className=e.className,s.style.cssText=e.style.cssText,s.append(...Array.from(e.childNodes)),n){let r=u.createElement("strong");r.textContent=" Selected",s.append(r)}e.replaceWith(s)}),h.querySelectorAll("script, .screenreader-only, .no-print").forEach(e=>e.remove()),h.style.display="block",h.style.maxHeight="none",h.style.overflow="visible";let b=u.createElement("main");b.id="btech-accreditation-rubric-export",b.append(h);let t=u.createElement("style");return t.textContent=`
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
  `,u.head.append(t),u.body.replaceChildren(b),b}async function R(u,y=1e4){var g;let h=Promise.all([(g=u.fonts)==null?void 0:g.ready,...Array.from(u.images,b=>b.complete?Promise.resolve():b.decode().catch(()=>{}))]),p;try{await Promise.race([h,new Promise((b,t)=>{p=setTimeout(()=>t(new Error("Rubric print assets did not finish loading.")),y)})])}finally{clearTimeout(p)}}var S="data-btech-print-media-link",P="btech-print-media-links-style";function F(u,y,h=!1){var b,t;let p;try{p=new URL(u,y)}catch(e){return null}if(!u||!["https:","http:"].includes(p.protocol))return null;let g=p.hostname.toLowerCase();if(/(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be)$/.test(g)){let e=g==="youtu.be"?p.pathname.split("/")[1]:((b=p.pathname.match(/^\/(?:embed|shorts|v)\/([^/]+)/))==null?void 0:b[1])||p.searchParams.get("v");return e&&/^[\w-]+$/.test(e)?`https://www.youtube.com/watch?v=${encodeURIComponent(e)}`:null}if(g==="player.vimeo.com"){let e=(t=p.pathname.match(/^\/video\/(\d+)/))==null?void 0:t[1];if(e)return`https://vimeo.com/${e}${p.searchParams.has("h")?"/"+encodeURIComponent(p.searchParams.get("h")):""}`}return h||/(^|\.)(vimeo\.com|kaltura\.com|instructuremedia\.com)$/.test(g)||g==="kaltura.bridgetools.dev"||/(^|\.)instructure\.com$/.test(g)&&/\/media_(?:objects|attachments)(?:_iframe)?\//.test(p.pathname)?p.href:null}function L(u){let y=u.body;if(!y||u.getElementById(P))return;let h=u.createElement("style");h.id=P,h.textContent=`
    [${S}] { display: none !important; }
    @media print {
      [${S}] { display: block !important; overflow-wrap: anywhere; margin: 8px 0; }
      [${S}] a { color: #111 !important; text-decoration: underline; }
    }
  `,u.head.append(h);let p=new Map,g=()=>{for(let[e,n]of p)y.contains(e)||(n.remove(),p.delete(e));y.querySelectorAll(".user_content iframe, .user_content video, .user_content audio").forEach(e=>{var a;let n=e.getAttribute("src")||((a=e.querySelector("source[src]"))==null?void 0:a.getAttribute("src")),s=F(n,u.baseURI,e.tagName!=="IFRAME"),i=p.get(e);if(!s){i==null||i.remove(),p.delete(e);return}if(!i){i=u.createElement("span"),i.setAttribute(S,"");let o=u.createElement("a");i.append(o),p.set(e,i)}let r=i.firstElementChild;r.getAttribute("href")!==s&&(r.href=s,r.textContent=s);let c=e;for(let o=e.parentElement;o&&!o.classList.contains("user_content");o=o.parentElement)o.matches('.instructure_resizable, .media_comment, [data-test-id="youtube-migration-container"]')&&(c=o);i.parentElement!==c.parentElement&&c.before(i)})};g();let b=u.defaultView.MutationObserver;new b(g).observe(y,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["src"]}),u.defaultView.addEventListener("beforeprint",g)}(async function(){let u=0;if(document.title==="BTECH Accreditation"){if($("#accreditation").length>0)return;let y=/^\/courses\/([0-9]+)/;if(y.test(window.location.pathname)){if(!document.querySelector("#content"))return;let h="",p=parseInt(window.location.pathname.match(y)[1]);try{await $.ajax({url:`/api/v1/courses/${p}/gradebook_settings`,type:"PUT",timeout:1e4,data:{gradebook_settings:{show_concluded_enrollments:!0}}})}catch(t){console.warn("[Accreditation] Could not update gradebook preference:",t),h="Could not enable concluded enrollments. The tool will continue, but concluded students may be missing."}let g=`
      <div>
        <p v-if="startupWarning" role="status">{{startupWarning}}</p>
        <div v-if="loadError" role="alert">
          {{loadError}} <button type="button" @click="reloadTool">Reload tool</button>
        </div>
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
      </div>`;$("#content").html("<div id='accreditation'><div id='accreditation-app'></div></div>"),new Vue({el:"#accreditation-app",template:g,mounted:async function(){try{this.courseId=p;let t=await this.getGraphQLData(this.courseId);this.courseData={name:t.name,course_code:t.course_code};let e=this.courseData.course_code;this.assignmentGroups=t.assignment_groups,this.loadingCourse=!1;let n=await canvasGet("/api/v1/courses/"+this.courseId+"/sections?include[]=students");this.sections=n;let s=a=>{if(a!=null&&a.sis_data__is_distance_approved)return"Online";let o=String((a==null?void 0:a.sis_data__campus_code)||"").trim().toUpperCase();return o==="L"?"Logan Campus":o==="B"?"Brigham City Campus":o},i=(a,o)=>{let l=String((a==null?void 0:a.sis_data__course_type)||"").trim().toUpperCase();return l||(o.toLowerCase().includes("hs")?"HS":o!==""?"CS":"")},r=a=>{let o=0;return a!=null&&a.is_deleted||(o+=100),a!=null&&a.is_active&&(o+=50),a!=null&&a.is_concluded||(o+=25),a!=null&&a.exit_date||(o+=10),o},c={};try{let a=await bridgetools.req3("reports",{canvas_course_id:{op:"=",value:this.courseId}},{dataset:"canvas_enrollments"}),o=Array.isArray(a)?a:[];for(let l=0;l<o.length;l++){let d=o[l],m=d==null?void 0:d.canvas_user_id;if(m==null)continue;let C=c[m];if(!C){c[m]=d;continue}let w=r(C),v=r(d);if(v>w){c[m]=d;continue}if(v===w){let f=Date.parse((C==null?void 0:C.entry_date)||(C==null?void 0:C.last_active_at)||0)||0;(Date.parse((d==null?void 0:d.entry_date)||(d==null?void 0:d.last_active_at)||0)||0)>f&&(c[m]=d)}}}catch(a){console.error("Failed to load accreditation enrollment data",a)}for(let a in n){let o=n[a];for(let l in o.students){let d=o.students[l];if(d.id in this.campuses)continue;this.campuses[d.id]="";let m=c[d.id];if(!m)continue;let C=s(m);this.campuses[d.id]=C;let w=i(m,C);w!==""&&(this.enrollmentTypes[d.id]=w)}}}catch(t){console.error("[Accreditation] Course loading failed:",t),this.loadError="Some course data could not be loaded. Reload the tool to try again."}finally{this.loadingCourse=!1}},data:function(){return{startupWarning:h,loadError:"",anonymous:!1,assignmentGroups:{},courseData:{},enrollments:[],courseId:null,currentUser:"",showModal:!1,preparingDocument:!1,submissions:[],currentAssignment:{},startDate:null,endDate:null,sections:[],section:"",needsToWait:!1,sortBy:"name",campuses:{},enrollmentTypes:{},loadingCourse:!0,loadingAssignmentDetails:!1,assignmentDetailsError:"",assignmentDetailsRequestId:0}},methods:{reloadTool(){window.location.reload()},async mapWithConcurrency(t,e,n){let s=new Array(t.length),i=0;async function r(){for(;;){let o=i;if(i+=1,o>=t.length)return;s[o]=await n(t[o],o)}}let c=Math.min(e,t.length),a=[];for(let o=0;o<c;o++)a.push(r());return await Promise.all(a),s},normalizeSubmission(t,e=!1){var n,s,i,r,c;if(e&&(!Array.isArray((n=t.commentsConnection)==null?void 0:n.nodes)||!Array.isArray((s=t.rubricAssessmentsConnection)==null?void 0:s.nodes)))throw new Error("Submission comments or rubric details are missing.");return{...t,quiz_id:(i=t==null?void 0:t.quiz)==null?void 0:i._id,user:{id:t.user._id,name:t.user.name},comments:e?((r=t.commentsConnection)==null?void 0:r.nodes)||[]:[],rubric_assessments:e?((c=t.rubricAssessmentsConnection)==null?void 0:c.nodes)||[]:[],detailsLoaded:e}},hasComments(t){var e;return((e=t==null?void 0:t.comments)==null?void 0:e.length)>0?!0:((t==null?void 0:t.rubric_assessments)||[]).some(n=>(n.assessmentRatings||[]).some(s=>this.hasCommentContent(s.comments,s.commentsHtml)))},hasCommentContent(t,e){if(typeof t=="string"&&t.trim().length>0)return!0;if(typeof e!="string")return!1;let n=e.replace(/<!--[\s\S]*?-->/g,"");return/<(?:img|audio|video|iframe)\b/i.test(n)?!0:n.replace(/<[^>]*>/g,"").replace(/&(?:nbsp|#0*160|#x0*a0);/gi," ").replace(/[\s\u200b-\u200d\ufeff]/g,"").length>0},getSubmissionDate(t){let e=t.submittedAt;return e===null&&(e=t.gradedAt),e},getFilteredSubmissions(t){let e=this,n=e.startDate,s=e.endDate,i=e.section,r=null;if(i!=="")for(let o=0;o<e.sections.length;o++){let l=e.sections[o];if(l.id===i){r=l;break}}let c=[];if(r!==null){let o=r.students;for(let l=0;l<o.length;l++)c.push(o[l].id)}let a=[];for(let o=0;o<t.length;o++){let l=t[o],d=!1,m=e.getSubmissionDate(l);m!==null&&(m>=n||n===null)&&(m<=s||s===null)&&(d=!0);let C=!0;r!==null&&(C=c.includes(parseInt(l.user.id)));let w=!0;l.submissionStatus=="unsubmitted"&&l.rubric_assessments.length==0&&(w=!1),d&&C&&w&&a.push(l)}return a},async getCourseMeta(t){let e=`
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
            `;return(await $.post("/api/graphql",{query:e})).data.course},async getAssignments(t){let e=[],n=!0,s=null;for(;n;){let i=`
                query {
                  assignmentGroup(id: "${t}") {
                    _id

                    assignmentsConnection(first: 50${s?`, after: "${s}"`:""}) {
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
              `,c=(await $.post("/api/graphql",{query:i})).data.assignmentGroup.assignmentsConnection;e=e.concat(c.nodes),n=c.pageInfo.hasNextPage,s=c.pageInfo.endCursor}return e.map(i=>{var r;i.id=i._id,i.quiz_id=(r=i==null?void 0:i.quiz)==null?void 0:r._id}),e},async getSubmissions(t,{includeDetails:e=!1}={}){var r,c,a,o;let n=[],s=!0,i=null;for(;s;){let l=`
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
                        ${e?`
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
              `,d=await $.post("/api/graphql",{query:l});if((r=d==null?void 0:d.errors)!=null&&r.length)throw new Error(d.errors.map(C=>C.message).join("; "));let m=(a=(c=d==null?void 0:d.data)==null?void 0:c.assignment)==null?void 0:a.submissionsConnection;if(!Array.isArray(m==null?void 0:m.nodes)||typeof((o=m==null?void 0:m.pageInfo)==null?void 0:o.hasNextPage)!="boolean"||m.pageInfo.hasNextPage&&(!m.pageInfo.endCursor||m.pageInfo.endCursor===i))throw new Error("Canvas returned incomplete submission data.");n=n.concat(m.nodes),s=m.pageInfo.hasNextPage,i=m.pageInfo.endCursor}return n},async getGraphQLData(t){try{let e=await this.getCourseMeta(t),n=e.assignmentGroupsConnection.nodes.filter(r=>r.state==="available"),s=6;await Promise.all(n.map(async r=>{r.assignments=await this.getAssignments(r.id)}));let i=n.flatMap(r=>r.assignments||[]);return await this.mapWithConcurrency(i,s,async r=>{try{let c=await this.getSubmissions(r._id);r.submissions=c.map(a=>this.normalizeSubmission(a))}catch(c){console.error(`Failed to load submissions for assignment ${r._id}`,c),r.submissions=[]}r.submissionDetailsLoaded=!1}),{id:t,name:e.name,course_code:e.courseCode,assignment_groups:n}}catch(e){throw console.error(e),e}},plainCommentToHTML(t){return t.split(`
`).filter(s=>s.trim()!=="").map(s=>`<p>${s}</p>`).join("")},getComments(t){var s,i;let e=t.comments,n="";if(e.length>0){n=$("<div style='page-break-before: always;' class='btech-accreditation-comments'></div>"),n.append("<h2>Comments</h2>");for(let r=0;r<e.length;r++){let c=e[r],a=$(`<div class='btech-accreditation-comment' style='border-bottom: 1px solid #000;'>
                  ${this.plainCommentToHTML(c.comment)}
                  <p style='text-align: right;'><i>-${(i=(s=c==null?void 0:c.author)==null?void 0:s.name)!=null?i:"automated comment"}, ${this.dateToString(c.createdAt)}</i></p>
                </div>`);n.append(a)}}return n},async downloadAttachments(t){for(let e=0;e<t.length;e++){let n=t[e];await this.downloadSingleAttachment(n)}},downloadSingleAttachment(t){return new Promise(e=>{window.open(t.url,"_blank"),setTimeout(e,100)})},async downloadSubmission(t,e){var i;let n=this,s=e.submissionType;if(n.preparingDocument=!0,n.needsToWait=!1,s=="online_quiz"){let r="/courses/"+n.courseId+"/assignments/"+t.id+"/submissions/"+e.user.id+"?preview=1";r=`/courses/${n.courseId}/quizzes/${t.quiz_id}/history?user_id=${e.user.id}`,await n.createIframe(r,n.downloadQuiz,{submission:e,assignment:t}),n.needsToWait=!0}if(s=="discussion_topic"){let r="/courses/"+n.courseId+"/assignments/"+t.id+"/submissions/"+e.user.id+"?preview=1";await n.createIframe(r,n.downloadDiscussion,{submission:e,assignment:t}),n.needsToWait=!0}if(e.rubric_assessments.length>0){let r="/courses/"+n.courseId+"/assignments/"+t.id+"/submissions/"+e.user.id;await n.createIframe(r,n.downloadRubric,{submission:e,assignment:t}),n.needsToWait=!0}else{let r="/courses/"+n.courseId+"/assignments/"+t.id+"/submissions/"+e.user.id;await n.createIframe(r,n.downloadComments,{submission:e,assignment:t}),n.needsToWait=!0}((i=e==null?void 0:e.attachments)==null?void 0:i.length)>0&&await this.downloadAttachments(e.attachments),n.needsToWait===!1&&(n.preparingDocument=!1)},checkLTI(t){let e=t.submissionType;if(e==="basic_lti_launch"){let n=t.previewUrl;window.open(n,"_blank")}e=="external_tool"&&alert("This is an assignment handled by a third party tool. You will need to pull evidence from the tool directly.")},async downloadComments(t,e,n){let s=this,i=t.attr("id"),r=this.getTitle(n)+" submission comments",c=s.getComments(n.submission);this.addRequiredInformation(e,n.submission,n.assignment),e.append(c);let a=document.getElementById(i).contentWindow,o=$("title").text();$("title").text(r),a.onafterprint=l=>{$("title").text(o),s.preparingDocument=!1,s.checkLTI(n.submission),t.remove()},a.focus(),a.print()},addRequiredInformation(t,e,n){var s,i;t.prepend("<p>Submitted: <span style='background-color: #FF0;'>"+this.getSubmissionDate(e)+"</span></p>"),t.prepend("<p>Student: <span style='background-color: #FF0;'>"+(this.anonymous?"Anonymous User "+e.user.id:e.user.name)+"</span></p>"),(i=(s=this.campuses)==null?void 0:s[e.user.id])!=null&&i&&t.prepend("<p>Campus: <span style='background-color: #FF0;'>"+this.campuses[e.user.id]+"</span></p>"),t.prepend("<p>Title: <span style='background-color: #FF0;'>"+n.name+"</span></p>"),t.prepend("<p>Course: <span style='background-color: #FF0;'>"+this.courseData.name+" ("+this.courseData.course_code+")</span></p>")},getTitle(t){return this.courseData.name+" - "+t.assignment.name+" - "+(this.anonymous?"Anonymous User "+t.submission.user.id:t.submission.user.name)},async downloadRubric(t,e,n){let s=this,i=this.getTitle(n)+" submission rubric",r=t[0].contentWindow,c=r.document,a=document.title,o=()=>{document.title=a,s.preparingDocument=!1,t.remove()};try{let l;try{l=await k(c)}catch(m){l=await q(c,{courseId:s.courseId,assignmentId:n.assignment.id,userId:n.submission.user.id})}let d=$(D(c,l));s.addRequiredInformation(d,n.submission,n.assignment),d.append(s.getComments(n.submission)),c.title=i,await R(c),document.title=i,r.onafterprint=()=>{o(),s.checkLTI(n.submission)},r.focus(),r.print()}catch(l){o(),console.error("Unable to prepare rubric export",l),alert("Unable to prepare this rubric for printing. "+l.message)}},async downloadNewQuiz(t,e,n){let s=this,i=t.attr("id"),r=i.replace("btech-content-",""),c=this.getTitle(n)+" submission";this.addRequiredInformation(e,n.submission,n.assignment);let a=s.getComments(n.submission);e.append(a);let o=$("title").text();$("title").text(c);let l=document.getElementById(i).contentWindow;l.onafterprint=d=>{$("title").text(o),s.preparingDocument=!1},l.focus(),l.print()},async downloadDiscussion(t,e,n){let s=this,i=t.attr("id"),r=i.replace("btech-content-",""),c=this.getTitle(n)+" submission";this.addRequiredInformation(e,n.submission,n.assignment);let a=s.getComments(n.submission);e.append(a);let o=$("title").text();$("title").text(c);let l=document.getElementById(i).contentWindow;l.onafterprint=d=>{$("title").text(o),s.preparingDocument=!1,t.remove()},l.focus(),l.print()},async downloadQuiz(t,e,n){let s=this,i=t.attr("id"),r=i.replace("btech-content-",""),c=this.getTitle(n)+" submission";this.addRequiredInformation(e,n.submission,n.assignment);let a=s.getComments(n.submission);e.append(a);let o=$("title").text();$("title").text(c);let l=document.getElementById(i).contentWindow,d=l.document,m=()=>{d.querySelectorAll(".answer").forEach(w=>{let v=w.classList.contains("selected_answer"),f=w.classList.contains("correct_answer"),_=d.createElement("span");_.style.fontWeight="bold",_.style.fontSize="14px",_.style.marginLeft="0.5em",v&&f?(_.textContent="\u2714 Correct (Your Answer)",_.style.color="green"):v&&!f?(_.textContent="\u2718 Incorrect (Your Answer)",_.style.color="red"):!v&&f?(_.textContent="\u2714 Correct Answer",_.style.color="green"):_.textContent="";let I=w.querySelector(".answer_html")||w.querySelector(".answer_match_right")||w.querySelector(".answer_text")||w.querySelector("select")||w.querySelector(".answer_type")||w;_.textContent!==""&&I.appendChild(_);let x=d.createElement("hr");x.style.border="0",x.style.borderTop="1px solid #aaa",x.style.margin="10px 0",w.appendChild(x)})};d.readyState==="complete"?(m(),l.focus(),l.onafterprint=()=>{$("title").text(o),s.preparingDocument=!1,t.remove()},l.print()):t.on("load",()=>{m(),l.focus(),l.onafterprint=()=>{$("title").text(o),s.preparingDocument=!1,t.remove()},l.print()})},async createIframe(t,e=null,n={}){let s;do s="btech-content-"+ ++u;while(document.getElementById(s));let i=$('<iframe id="'+s+'" style="width: 1200px;" src="'+t+'"></iframe>');i.hide(),$("#content").append(i);let r=document.getElementById(s).contentWindow;return r.onload=function(){L(r.document);let c=$(r.document.getElementsByTagName("body")[0]),a=c.find("img");e!==null&&e(i,c,n)},i},async openModal(t,{force:e=!1}={}){let n=this,s=++n.assignmentDetailsRequestId;if(n.showModal=!0,n.currentAssignment=t,n.submissions=[],n.assignmentDetailsError="",n.loadingAssignmentDetails=!1,e||t.submissionDetailsLoaded!==!0){t.submissionDetailsLoaded=!1,n.loadingAssignmentDetails=!0;try{let r=(await n.getSubmissions(t.id,{includeDetails:!0})).map(c=>n.normalizeSubmission(c,!0));if(s!==n.assignmentDetailsRequestId)return;t.submissions=r,t.submissionDetailsLoaded=!0}catch(i){if(console.error(i),s!==n.assignmentDetailsRequestId)return;n.assignmentDetailsError="Unable to load assignment details. Comments and rubrics could not be verified. Please retry.";return}finally{s===n.assignmentDetailsRequestId&&(n.loadingAssignmentDetails=!1)}}n.submissions=t.submissions},submittedAssignments(t){let e=[];for(let n=0;n<t.length;n++){let s=t[n];s.workflow_state!="unsubmitted"&&e.push(s)}return e},dateToString(t){return t=new Date(Date.parse(t)),t.getFullYear()+"-"+(t.getMonth()+1)+"-"+t.getDate()},close(){let t=this;t.showModal=!1,t.assignmentDetailsRequestId+=1,t.loadingAssignmentDetails=!1}}});let b=[];for(let t=0;t<b.length;t++){let e=b[t];$("#content").append("<h2>"+e.name+" ("+e.group_weight+"%)</h2>")}}}})().catch(u=>{console.error("[Accreditation] Startup failed:",u);let y=document.querySelector("#content");if(!y||document.getElementById("btech-accreditation-error"))return;let h=document.createElement("div");h.id="btech-accreditation-error",h.setAttribute("role","alert"),h.textContent="The accreditation tool could not start. Reload to try again. ";let p=document.createElement("button");p.type="button",p.textContent="Reload tool",p.addEventListener("click",()=>window.location.reload()),h.appendChild(p),y.prepend(h)});})();
