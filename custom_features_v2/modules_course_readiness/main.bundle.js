(()=>{(async function(){var Q;if(!IS_TEACHER)return;let m=(Q=ENV.COURSE_ID)!=null?Q:ENV.course_id,l="btech-course-readiness-checklist",W="btech-course-readiness-style",V=6e4,J="243044643269963",j="241976981675072",ee="https://surveys.bridgetools.dev/init?jotform_id=261403741698967&response_jotform_id=261436460329962",se="https://surveys.bridgetools.dev/init",te="employment skills",N="106228",ne=[{key:"cleanUnusedContent",title:"Clean up unused content",detail:"Confirm unused content has been cleaned up."}],ie={instructorsAdded:"https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.8xba0hu8flvw",instructorEvaluation:"https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.rlqjyqw6zccd",courseEvaluation:"https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.rlqjyqw6zccd",courseContent:"https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.2trq1w64kmtd",groupWeights:"https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.ixz8s2t0x82k",assignmentsInModules:"https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.5npc62ocz9sq",assignmentsPublished:"https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.5npc62ocz9sq",syllabusLinkEnabled:"https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.n1lazhgzfkk9",syllabusModuleLinks:"",syllabus:"https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.n1lazhgzfkk9",cleanUnusedContent:""};if(!m)return;let S=[],w=null;function re(e){let s=String(e!=null?e:"").match(/\b(20\d{2})\b/);return s?s[1]:""}function qe(e,s={}){var L;let t=s.baseUrl||"https://btech.simplesyllabus.com/api2/doc",n=s.pageSize||50,o=s.delayMs||200,u=String((L=s.termYear)!=null?L:"").trim(),g=String(e),c=0;function h(v){return new RegExp("\\("+g+"\\)").test(String(v||""))}function _(){let v={"entity_types[]":"section",page:c,page_size:n};return u&&(v.term_name=u),$.get(t,v).then(function(M){let C=(M.items||[]).find(k=>h(k.title));if(C)return C.entity_id;let E=M.pagination||{},A=E.total;return(E.returned||0)===0||Number.isInteger(A)&&(c+1)*n>=A?null:(c++,new Promise(k=>setTimeout(k,o)).then(_))})}return _()}function De(e,s={}){let t=s.baseUrl||"https://btech.simplesyllabus.com/api2/doc";return $.get(t,{"entity_ids[]":e,page:0,page_size:50}).then(function(n){if((n.sys||{}).success===!1)throw new Error("Simple Syllabus API returned success=false");return(n.items||[])[0]||null})}function oe(e,s={}){let t=s.baseUrl||"https://btech.simplesyllabus.com/api2/doc";return $.get(t,{code:String(e!=null?e:"").trim(),page:0,page_size:50}).then(function(n){if((n.sys||{}).success===!1)throw new Error("Simple Syllabus API returned success=false");return(n.items||[])[0]||null})}async function le(e){var n;let s=await bridgetools.req3("reports",{canvas_course_id:Number(e)},{dataset:"syllabi_status"}),t=Array.isArray(s)?s.find(o=>{var u;return String((u=o==null?void 0:o.simple_syllabus_doc_id)!=null?u:"").trim()}):null;return String((n=t==null?void 0:t.simple_syllabus_doc_id)!=null?n:"").trim()||null}let x=null,T=!1;async function ae(e,s=""){if(!T){try{x=await le(e)}catch(t){console.warn("Course readiness syllabus code lookup via reports failed.",t)}console.log("Course readiness syllabus code lookup",{courseId:Number(e),termYear:String(s!=null?s:""),syllabusDocCode:x}),T=!0}return x?await oe(x):null}function b(e){return $("<div>").text(e!=null?e:"").html()}async function ue(e){return await $.put(`/api/v1/courses/${m}/tabs/${encodeURIComponent(e)}`,{hidden:!1,position:2})}async function de(e){for(let s=0;s<e.length;s++){let t=e[s];await $.put(`/api/v1/courses/${m}/modules/${t.moduleId}/items/${t.id}`,{module_item:{external_url:t.fixedUrl}})}}async function ce(e){for(let s=0;s<e.length;s++){let t=e[s];await $.delete(`/api/v1/courses/${m}/modules/${t.moduleId}/items/${t.id}`)}}async function G(e){if(!(w!=null&&w.id))throw new Error("No module found for evaluation placement.");let s=await $.post(`/api/v1/courses/${m}/assignments`,{assignment:{name:e.title,submission_types:["external_tool"],points_possible:1,allowed_attempts:-1,published:!0,external_tool_tag_attributes:{url:e.url,new_tab:!1}}});return await $.post(`/api/v1/courses/${m}/modules/${w.id}/items`,{module_item:{type:"Assignment",content_id:s.id,position:999}}),s}function be(){document.getElementById(W)||$("head").append(`
      <style id="${W}">
        #${l} {
          margin-top: 1rem;
          border: 1px solid #c7cdd1;
          border-radius: 6px;
          background: #ffffff;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        #${l} .btech-course-readiness__readiness {
          padding: 0;
        }

        #${l} .btech-course-readiness__readiness-banner {
          position: relative;
          min-height: 2rem;
          overflow: hidden;
          border-top: 1px solid #c7cdd1;
          border-bottom: 1px solid #c7cdd1;
        }

        #${l} .btech-course-readiness__readiness-banner.is-loading {
          background: #eef2f4;
          border-color: #5b6d79;
        }

        #${l} .btech-course-readiness__readiness-banner.is-fail {
          background: #fde8e8;
          border-color: #a61b1b;
        }

        #${l} .btech-course-readiness__readiness-banner.is-ready {
          background: #fff3cd;
          border-color: #8a5b00;
        }

        #${l} .btech-course-readiness__readiness-banner.is-published {
          background: #dff3e4;
          border-color: #0b6b2f;
        }

        #${l} .btech-course-readiness__readiness-label {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 0.75rem;
          min-height: 2rem;
          font-size: 0.82rem;
          font-weight: 700;
          color: #000000;
          letter-spacing: 0.02em;
          text-align: center;
        }

        #${l} .btech-course-readiness__meta {
          margin: 0;
          padding: 0.45rem 1rem 0;
          font-size: 0.75rem;
          color: #5b6d79;
        }

        #${l} .btech-course-readiness__body {
          padding: 1rem;
        }

        #${l} .btech-course-readiness__checks {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.6rem;
        }

        #${l} .btech-course-readiness__check {
          display: block;
        }

        #${l} .btech-course-readiness__check.has-divider {
          border-top: 1px solid #e5e8ea;
          margin-top: 0.55rem;
          padding-top: 0.8rem;
        }

        #${l} .btech-course-readiness__check-header {
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }

        #${l} .btech-course-readiness__guide-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1rem;
          height: 1rem;
          min-width: 1rem;
          border: 1px solid #8b969e;
          border-radius: 999px;
          color: #394b58;
          font-size: 0.72rem;
          font-weight: 700;
          line-height: 1;
          text-decoration: none;
        }

        #${l} .btech-course-readiness__guide-link:hover,
        #${l} .btech-course-readiness__guide-link:focus {
          color: #1f5f8b;
          border-color: #1f5f8b;
          text-decoration: none;
        }

        #${l} .btech-course-readiness__section-label {
          margin-bottom: 0.45rem;
          font-size: 0.72rem;
          font-weight: 700;
          color: #5b6d79;
          text-transform: uppercase;
        }

        #${l} .btech-course-readiness__action {
          margin-top: 0.45rem;
        }

        #${l} .btech-course-readiness__pill {
          width: 0.8rem;
          height: 0.8rem;
          min-width: 0.8rem;
          border-radius: 999px;
        }

        #${l} .btech-course-readiness__check.is-pass .btech-course-readiness__pill {
          background: #dff3e4;
          border: 1px solid #0b6b2f;
        }

        #${l} .btech-course-readiness__check.is-loading .btech-course-readiness__pill {
          background: #e5e8ea;
          border: 1px solid #5b6d79;
        }

        #${l} .btech-course-readiness__check.is-warn .btech-course-readiness__pill {
          background: #fff3cd;
          border: 1px solid #8a5b00;
        }

        #${l} .btech-course-readiness__check.is-fail .btech-course-readiness__pill {
          background: #fde8e8;
          border: 1px solid #a61b1b;
        }

        #${l} .btech-course-readiness__check.is-info .btech-course-readiness__pill {
          background: #eef2f4;
          border: 1px solid #5b6d79;
        }

        #${l} .btech-course-readiness__check-title {
          flex: 1 1 auto;
          font-size: 0.875rem;
          font-weight: 600;
          color: #2d3b45;
        }

        #${l} .btech-course-readiness__check-detail {
          display: block;
          margin-top: 0.35rem;
          font-size: 0.8rem;
          color: #5b6d79;
        }

        #${l} .btech-course-readiness__check-list {
          margin: 0.45rem 0 0 1.35rem;
          padding: 0;
          font-size: 0.8rem;
          color: #2d3b45;
        }

        #${l} .btech-course-readiness__check-list li + li {
          margin-top: 0.2rem;
        }

        #${l} .btech-course-readiness__disclosure {
          margin-top: 0.45rem;
        }

        #${l} .btech-course-readiness__disclosure-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0;
          border: 0;
          background: transparent;
          color: #5b6d79;
          font-size: 0.8rem;
          line-height: 1.3;
          text-align: left;
          cursor: pointer;
        }

        #${l} .btech-course-readiness__disclosure-arrow {
          display: inline-block;
          width: 0.65rem;
          min-width: 0.65rem;
          color: #394b58;
        }

        #${l} .btech-course-readiness__disclosure.is-open .btech-course-readiness__disclosure-arrow {
          transform: rotate(90deg);
        }

        #${l} .btech-course-readiness__error {
          margin: 0;
          font-size: 0.8rem;
          color: #a61b1b;
        }
      </style>
    `)}function me(){let e=$("#right-side-wrapper");if(!e.length)return null;let s=$(`#${l}`);return s.length||(s=$(`<div id="${l}"></div>`),e.append(s)),s}function he(e){let s=[Number(e.id)],t=Number(e.quiz_id);return Number.isFinite(t)&&t>0&&s.push(t),s.filter(n=>Number.isFinite(n)&&n>0)}function pe(e,s={}){var o,u,g,c;let t=[Number(e.content_id)],n=Number((g=(u=s==null?void 0:s[e.content_id])!=null?u:(o=e.content_details)==null?void 0:o.assignment_id)!=null?g:e.assignment_id);return String((c=e.type)!=null?c:"").toLowerCase()==="discussion"&&Number.isFinite(n)&&n>0&&t.push(n),t.filter(h=>Number.isFinite(h)&&h>0)}function ge(e){let s=String(e!=null?e:"").match(new RegExp(`/courses/(\\d+)/external_tools/${N}(?:\\b|[/?#])`));return s?s[1]:""}function fe(e){return String(e!=null?e:"").replace(new RegExp(`/courses/\\d+/external_tools/${N}`),`/courses/${m}/external_tools/${N}`)}async function ye(){var H,O,Y;let[e,s,t,n,o,u,g]=await Promise.all([$.get(`/api/v1/courses/${m}?include[]=term`),canvasGet(`/api/v1/courses/${m}/assignment_groups?include[]=assignments`),canvasGet(`/api/v1/courses/${m}/modules?include[]=items&include[]=content_details`),canvasGet(`/api/v1/courses/${m}/assignments`),canvasGet(`/api/v1/courses/${m}/discussion_topics`),canvasGet(`/api/v1/courses/${m}/enrollments?type[]=TeacherEnrollment&state[]=active&state[]=invited&state[]=creation_pending`),canvasGet(`/api/v1/courses/${m}/tabs`)]),c=String((O=(H=e==null?void 0:e.term)==null?void 0:H.name)!=null?O:""),h=re(c),_=t.flatMap(i=>{var r;return((r=i.items)!=null?r:[]).map(d=>({...d,moduleId:i.id,moduleName:i.name}))});w=t.length?t[t.length-1]:null;let L=o.reduce((i,r)=>{let d=Number(r==null?void 0:r.id),f=Number(r==null?void 0:r.assignment_id);return Number.isFinite(d)&&d>0&&Number.isFinite(f)&&f>0&&(i[d]=f),i},{}),v=new Set(_.flatMap(i=>pe(i,L)).filter(i=>Number.isFinite(i)&&i>0)),M=s.flatMap(i=>{var r;return((r=i.assignments)!=null?r:[]).map(d=>({...d,assignmentGroupName:i.name}))}),R=[],C=[],E=new Set;M.forEach(i=>{var X,Z;if(E.has(i.id))return;E.add(i.id);let r=Number((X=i.points_possible)!=null?X:0),d=he(i).some(Te=>v.has(Te)),f=Number.isFinite(Number(i.quiz_id))&&Number(i.quiz_id)>0&&String((Z=i==null?void 0:i.name)!=null?Z:"").trim().toLowerCase()==="employment skills evaluation";i.published===!0&&r>0&&!d&&!f&&R.push({id:i.id,name:i.name,pointsPossible:r,assignmentGroupName:i.assignmentGroupName}),i.published===!1&&d&&C.push({id:i.id,name:i.name,assignmentGroupName:i.assignmentGroupName})});let A=_.map(i=>{var f;let r=String(i.external_url||i.url||i.html_url||((f=i.content_details)==null?void 0:f.url)||""),d=ge(r);return{id:i.id,title:i.title,moduleId:i.moduleId,moduleName:i.moduleName,url:r,linkedCourseId:d,fixedUrl:fe(r)}}).filter(i=>i.linkedCourseId&&i.linkedCourseId!==String(m));S=A;let z=s.reduce((i,r)=>{var d;return i+Number((d=r.group_weight)!=null?d:0)},0),k=!!(e!=null&&e.apply_assignment_group_weights),ze=s.filter(i=>{var r,d;return Number((r=i==null?void 0:i.group_weight)!=null?r:0)>0&&((d=i.assignments)!=null?d:[]).length===0}).map(i=>{var r;return{id:i.id,name:i.name,groupWeight:Number((r=i.group_weight)!=null?r:0)}}),We=n.filter(i=>{var r,d;return String((d=(r=i==null?void 0:i.external_tool_tag_attributes)==null?void 0:r.url)!=null?d:"").toLowerCase().includes(`jotform_id=${J}`)}),Je=n.filter(i=>(()=>{var d,f;let r=String((f=(d=i==null?void 0:i.external_tool_tag_attributes)==null?void 0:d.url)!=null?f:"").toLowerCase();return r.includes(`jotform_id=${j}`)||r===se})()),B=n.filter(i=>{var r;return String((r=i==null?void 0:i.name)!=null?r:"").toLowerCase().includes(te)}),je=B.filter(i=>{var r;return ke((r=i==null?void 0:i.external_tool_tag_attributes)==null?void 0:r.url)});return{termName:c,termYear:h,isCoursePublished:!!(e!=null&&e.published)||["available","completed"].includes(String((Y=e==null?void 0:e.workflow_state)!=null?Y:"").toLowerCase()),employmentSkillsAssignments:B,employmentSkillsAssignmentsWithResponseLinks:je,instructorEvalAssignments:We,courseEvalAssignments:Je,instructorEnrollments:u,tabs:g,hasAnyContent:_.length>0,usesAssignmentGroupWeights:k,assignmentGroupWeightsAddTo100:k&&Math.abs(z-100)<.001,assignmentGroupWeightTotal:z,emptyWeightedAssignmentGroups:ze,assignmentsWorthPointsNotInModule:R,unpublishedAssignmentsInModule:C,syllabusModuleLinkMismatches:A}}function _e(e){return U(e).filter(s=>s.isScored!==!1).every(s=>s.state==="pass")}function p(e,s="Loading..."){return a(e,"loading",s)}function ve(e){return{"Assignments Published":"assignmentsPublished","Assignments in Modules":"assignmentsInModules","Course Content":"courseContent","Course Evaluation":"courseEvaluation","Empty Group(s)":"groupWeights","Employment Skills Evaluation":"employmentSkillsEvaluation","Group Weights = 100%":"groupWeights","Instructor Evaluation":"instructorEvaluation","Instructors Added":"instructorsAdded","Syllabus Submitted":"syllabus","Syllabus in Navigation":"syllabusLinkEnabled","Syllabus Module Links":"syllabusModuleLinks"}[e]||""}function a(e,s,t="",n={}){return{title:e,guideKey:ve(e),state:s,detail:t,...n}}function ke(e){let s=String(e!=null?e:"").trim();if(!s)return!1;try{let t=new URL(s,window.location.origin),n=t.searchParams.get("jotform_id"),o=t.searchParams.get("response_jotform_id");return!!(n&&o)}catch(t){return!1}}function q(e,s){return e.length?e.some(n=>n.published===!0||n.workflow_state==="published")?a(s,"pass",`${s} assignment is published.`):a(s,"warn",`${s} assignment exists but is not published.`):a(s,"fail",`Add the ${s.toLowerCase()} assignment.`,{action:{type:s==="Instructor Evaluation"?"addInstructorEvaluation":"addCourseEvaluation",label:"Add Eval"}})}function Se(e){var t,n;let s=(t=e.employmentSkillsAssignments)!=null?t:[];return s.length?((n=e.employmentSkillsAssignmentsWithResponseLinks)!=null?n:[]).length>0?a("Employment Skills Evaluation","pass","Employment Skills evaluation includes both jotform_id and response_jotform_id.",{action:{type:"addEmploymentSkillsEvaluation",label:"Add Eval"}}):a("Employment Skills Evaluation","fail","An Employment Skills assignment or quiz exists, but its link is missing jotform_id and/or response_jotform_id.",{action:{type:"addEmploymentSkillsEvaluation",label:"Add Eval"},items:s,itemFormatter:o=>b(o.name),itemSummary:`${s.length} matching item(s)`}):a("Employment Skills Evaluation","info","No assignment or quiz with 'employment skills' in the name was found.",{action:{type:"addEmploymentSkillsEvaluation",label:"Add Eval"},isScored:!1})}function we(e){return e.syllabusLoading?p("Syllabus Submitted","Loading syllabus status..."):e.syllabusLoadError?a("Syllabus Submitted","fail","Unable to load syllabus status."):e.syllabusDoc?e.syllabusStatus==="completed"?a("Syllabus Submitted","pass","Syllabus is completed."):e.syllabusStatus==="awaiting_approval"?a("Syllabus Submitted","warn","Syllabus is awaiting approval."):a("Syllabus Submitted","fail",e.syllabusStatus?`Syllabus status is ${e.syllabusStatus.replace(/_/g," ")}.`:"Syllabus status is unavailable."):a("Syllabus Submitted","fail","No Simple Syllabus record was found for this course.")}function $e(e){var n;let s=e.tabs.find(o=>{var u;return String((u=o==null?void 0:o.label)!=null?u:"").trim().toLowerCase()==="simple syllabus"});return s?String((n=s.visibility)!=null?n:"").toLowerCase()==="public"&&s.hidden!==!0?a("Syllabus in Navigation","pass","Simple Syllabus is enabled in course navigation."):a("Syllabus in Navigation","fail",s.visibility?`Simple Syllabus navigation visibility is ${s.visibility}.`:"Simple Syllabus navigation visibility is unavailable.",{action:{type:"enableSyllabusLink",label:"Enable Link",tabId:s.id}}):a("Syllabus in Navigation","fail","Simple Syllabus was not found in course navigation.")}function Ce(e){return e.hasAnyContent?e.syllabusModuleLinkMismatches.length>0?a("Syllabus Module Links","fail","",{actions:[{type:"removeSyllabusModuleLinks",label:"Remove Link"},{type:"fixSyllabusModuleLinks",label:"Fix Link"}]}):a("Syllabus Module Links","pass","Simple Syllabus module links point to this course."):a("Syllabus Module Links","fail","No module content exists yet.")}function Ee(e){return e.hasAnyContent?a("Course Content","pass","Course content exists."):a("Course Content","fail","No module items were found in this course.")}function Ae(e){let s=e.instructorEnrollments.length;return s>0?a("Instructors Added","pass",`${s} instructor(s) found.`,{items:e.instructorEnrollments,itemFormatter:t=>{var n,o;return b(((n=t==null?void 0:t.user)==null?void 0:n.name)||((o=t==null?void 0:t.user)==null?void 0:o.sortable_name)||`User ${t.user_id}`)},itemSummary:`${s} instructor(s) added`}):a("Instructors Added","fail","No instructors have been added to this course.")}function xe(e){return e.usesAssignmentGroupWeights?a("Group Weights = 100%",e.assignmentGroupWeightsAddTo100?"pass":"fail",`Current total: ${Math.round(e.assignmentGroupWeightTotal*100)/100}%`):a("Group Weights = 100%","pass","Assignment group weighting is not enabled for this course.")}function Ie(e){var s;return e.usesAssignmentGroupWeights?((s=e.emptyWeightedAssignmentGroups)!=null?s:[]).length>0?a("Empty Group(s)","warn",`${e.emptyWeightedAssignmentGroups.length} weighted assignment group(s) have no assignments.`,{items:e.emptyWeightedAssignmentGroups,itemFormatter:t=>`${b(t.name)} (${b(String(t.groupWeight))}%)`,itemSummary:`${e.emptyWeightedAssignmentGroups.length} empty weighted group(s)`}):a("Empty Group(s)","pass","All weighted assignment groups contain assignments."):a("Empty Group(s)","pass","Assignment group weighting is not enabled for this course.")}function Le(e){return e.hasAnyContent?e.assignmentsWorthPointsNotInModule.length>0?a("Assignments in Modules","fail",`${e.assignmentsWorthPointsNotInModule.length} assignment(s) still need a module placement.`,{items:e.assignmentsWorthPointsNotInModule,itemFormatter:s=>`${b(s.name)} (${b(String(s.pointsPossible))} pts)`,itemSummary:`${e.assignmentsWorthPointsNotInModule.length} assignment(s) need module placement`}):a("Assignments in Modules","pass","All point-bearing assignments are in a module."):a("Assignments in Modules","fail","No module content exists yet.")}function Me(e){return e.hasAnyContent?e.unpublishedAssignmentsInModule.length>0?a("Assignments Published","warn",`${e.unpublishedAssignmentsInModule.length} assignment(s) in modules are still unpublished.`,{items:e.unpublishedAssignmentsInModule,itemFormatter:s=>b(s.name),itemSummary:`${e.unpublishedAssignmentsInModule.length} assignment(s) unpublished`}):a("Assignments Published","pass","All assignments found in modules are published."):a("Assignments Published","fail","No module content exists yet.")}function D(){return ne.map((e,s)=>a(e.title,"info",e.detail,{guideKey:e.key,sectionLabel:s===0?"Manual Confirmation":"",dividerBefore:s===0,isScored:!1}))}function U(e){return e.coreLoaded?[Ae(e),q(e.instructorEvalAssignments,"Instructor Evaluation"),q(e.courseEvalAssignments,"Course Evaluation"),Se(e),Ee(e),xe(e),Ie(e),Le(e),Me(e),Ce(e),$e(e),we(e),...D()]:[p("Instructors Added"),p("Instructor Evaluation"),p("Course Evaluation"),p("Employment Skills Evaluation"),p("Course Content"),p("Group Weights = 100%"),p("Empty Group(s)"),p("Assignments in Modules"),p("Assignments Published"),p("Syllabus Module Links"),p("Syllabus in Navigation"),p("Syllabus Submitted","Loading syllabus status..."),...D()]}function Ne(e){return U(e)}function Ge(e){let s=U(e),t=s.filter(n=>n.isScored!==!1);return t.some(n=>n.state==="loading")?{state:"loading",checks:s}:{state:t.every(n=>n.state==="pass")?"pass":"fail",checks:s}}function Ue(e){let s=Ne(e),t=s.filter(n=>n.isScored!==!1);return t.some(n=>n.state==="loading")?{state:"loading",checks:s}:t.some(n=>n.state==="fail")?{state:"fail",checks:s}:t.some(n=>n.state==="warn")?{state:"warn",checks:s}:{state:"pass",checks:s}}function Ke(e){let s=e.filter(c=>c.isScored!==!1),t=s.length||1,n=s.filter(c=>c.state==="pass").length,o=s.filter(c=>c.state==="loading").length,u=s.filter(c=>c.state==="warn").length,g=s.filter(c=>c.state==="fail").length;return{total:t,passCount:n,loadingCount:o,warnCount:u,failCount:g,percentComplete:Math.round(n/t*100)}}function Pe(e){let s=Array.isArray(e.items)?e.items:[],t=Array.isArray(e.actions)?e.actions:e.action?[e.action]:[],n=s.length?`
        <div class="btech-course-readiness__disclosure">
          <button type="button" class="btech-course-readiness__disclosure-toggle" aria-expanded="false">
            <span class="btech-course-readiness__disclosure-arrow" aria-hidden="true">&gt;</span>
            <span>${b(e.itemSummary||`${s.length} item(s)`)}</span>
          </button>
          <ul class="btech-course-readiness__check-list" hidden>
            ${s.map(h=>`<li>${e.itemFormatter(h)}</li>`).join("")}
          </ul>
        </div>
      `:"",o='<span class="btech-course-readiness__pill" aria-hidden="true"></span>',u=t.length?`
        <div class="btech-course-readiness__action">
          ${t.map(h=>`
            <button
              type="button"
              class="btn btn-small btech-course-readiness__action-button"
              data-action-type="${b(h.type)}"
              data-tab-id="${b(h.tabId)}"
            >${b(h.label)}</button>
          `).join("")}
        </div>
      `:"",g=ie[e.guideKey]||"",c=g?`<a
          class="btech-course-readiness__guide-link"
          href="${b(g)}"
          target="_blank"
          rel="noopener"
          title="${b(`Guide for ${e.title}`)}"
          aria-label="${b(`Guide for ${e.title}`)}"
        >i</a>`:"";return`
      <li class="btech-course-readiness__check is-${e.state}${e.dividerBefore?" has-divider":""}">
        ${e.sectionLabel?`<div class="btech-course-readiness__section-label">${b(e.sectionLabel)}</div>`:""}
        <div class="btech-course-readiness__check-header">
          ${o}
          <span class="btech-course-readiness__check-title">${b(e.title)}</span>
          ${c}
        </div>
        ${e.state==="pass"||t.length||s.length?"":`<span class="btech-course-readiness__check-detail">${b(e.detail)}</span>`}
        ${u}
        ${n}
      </li>
    `}function I(e,s,t=""){let n=new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});if(t){e.html(`
        <div class="btech-course-readiness__readiness">
          <div class="btech-course-readiness__readiness-banner is-fail">
            <span class="btech-course-readiness__readiness-label">Course Readiness</span>
          </div>
          <p class="btech-course-readiness__meta">Last checked ${b(n)}</p>
        </div>
        <div class="btech-course-readiness__body">
          <p class="btech-course-readiness__error">${b(t)}</p>
        </div>
      `);return}let o=Ue(s),u=Ge(s),g=u.state==="loading"?"loading":(s==null?void 0:s.isCoursePublished)===!0&&u.state==="pass"?"published":u.state==="pass"?"ready":"fail",c=u.state==="loading"?"Checking Readiness...":(s==null?void 0:s.isCoursePublished)===!0&&u.state==="pass"?"Published!":u.state==="pass"?"Course Ready to Publish":"Course Not Ready";e.html(`
      <div class="btech-course-readiness__readiness">
        <div class="btech-course-readiness__readiness-banner is-${g}">
          <span class="btech-course-readiness__readiness-label">${b(c)}</span>
        </div>
        <p class="btech-course-readiness__meta">Last checked ${b(n)}</p>
      </div>
      <div class="btech-course-readiness__body">
        <ul class="btech-course-readiness__checks">
          ${o.checks.map(h=>Pe(h)).join("")}
        </ul>
      </div>
    `),Re(e),Fe(e)}function Fe(e){e.find(".btech-course-readiness__disclosure-toggle").on("click",function(){let s=$(this),t=s.closest(".btech-course-readiness__disclosure"),n=t.find(".btech-course-readiness__check-list").first(),o=s.attr("aria-expanded")==="true";s.attr("aria-expanded",String(!o)),t.toggleClass("is-open",!o),n.prop("hidden",o)})}function y(e){e.closest(".btech-course-readiness__check").removeClass("is-fail is-warn is-loading").addClass("is-pass"),e.closest(".btech-course-readiness__action").html('<span class="btech-course-readiness__check-detail">Refresh to view changes.</span>')}function Re(e){e.find(".btech-course-readiness__action-button").on("click",async function(){let s=$(this),t=s.data("action-type");if(t==="enableSyllabusLink"){s.prop("disabled",!0).text("Enabling...");try{await ue(s.data("tab-id")),y(s)}catch(n){console.error("Unable to enable Simple Syllabus link.",n),s.prop("disabled",!1).text("Enable Link"),alert("Unable to enable the Simple Syllabus link right now.")}return}if(t==="fixSyllabusModuleLinks"){s.prop("disabled",!0).text("Fixing...");try{await de(S),S=[],y(s)}catch(n){console.error("Unable to fix Simple Syllabus module links.",n),s.prop("disabled",!1).text("Fix Link"),alert("Unable to fix the Simple Syllabus module links right now.")}return}if(t==="removeSyllabusModuleLinks"){s.prop("disabled",!0).text("Removing...");try{await ce(S),S=[],y(s)}catch(n){console.error("Unable to remove Simple Syllabus module links.",n),s.prop("disabled",!1).text("Remove Link"),alert("Unable to remove the Simple Syllabus module link right now.")}return}if(t==="addInstructorEvaluation"){s.prop("disabled",!0).text("Adding...");try{await G({title:"Instructor Evaluation",url:`https://surveys.bridgetools.dev/init?jotform_id=${J}`}),y(s)}catch(n){console.error("Unable to add Instructor Evaluation.",n),s.prop("disabled",!1).text("Add Eval"),alert("Unable to add the Instructor Evaluation right now.")}return}if(t==="addCourseEvaluation"){s.prop("disabled",!0).text("Adding...");try{await G({title:"Course Evaluation",url:`https://surveys.bridgetools.dev/init?jotform_id=${j}`}),y(s)}catch(n){console.error("Unable to add Course Evaluation.",n),s.prop("disabled",!1).text("Add Eval"),alert("Unable to add the Course Evaluation right now.")}return}if(t==="addEmploymentSkillsEvaluation"){s.prop("disabled",!0).text("Adding...");try{await G({title:"Employment Skills Evaluation",url:ee}),y(s)}catch(n){console.error("Unable to add Employment Skills Evaluation.",n),s.prop("disabled",!1).text("Add Eval"),alert("Unable to add the Employment Skills Evaluation right now.")}}})}let P=!1,F=!1;async function K(){var s;let e=me();if(!(!e||P)){P=!0;try{e.html().trim()||I(e,{coreLoaded:!1,syllabusLoading:!0});let t=await ye(),n={...t,coreLoaded:!0,syllabusLoading:!0,syllabusDoc:null,syllabusStatus:"",syllabusLoadError:!1};I(e,n);let o;try{let u=await ae(m,t.termYear);o={...n,syllabusLoading:!1,syllabusDoc:u,syllabusStatus:String((s=u==null?void 0:u.status)!=null?s:"").trim().toLowerCase(),syllabusLoadError:!1}}catch(u){console.error("Course readiness syllabus check failed.",u),o={...n,syllabusLoading:!1,syllabusDoc:null,syllabusStatus:"",syllabusLoadError:!0}}I(e,o),F=_e(o),F&&window.__btechCourseReadinessIntervalId&&(clearInterval(window.__btechCourseReadinessIntervalId),window.__btechCourseReadinessIntervalId=null)}catch(t){console.error("Course readiness check failed.",t),I(e,null,"Unable to refresh the course readiness checklist right now.")}finally{P=!1}}}be(),await K(),window.__btechCourseReadinessIntervalId&&clearInterval(window.__btechCourseReadinessIntervalId),F||(window.__btechCourseReadinessIntervalId=window.setInterval(K,V))})();})();
