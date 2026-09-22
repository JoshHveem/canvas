(()=>{window.AIHubConfig=Object.assign({},window.AIHubConfig||{},{courseId:"621895"});window.AIHubStatus={connected:!0,loadedAt:new Date().toISOString(),mounted:!1,reason:"loading"};(function(){let T=window.AIHubStatus;if(T.path=window.location.pathname,T.isTeacher=!!window.IS_TEACHER,!T.isTeacher){T.reason="not_teacher";return}let Rt=window.AIHubConfig,Kt=["Home","People","Announcements"],Te="data-ai-hub-edit-tab",Yt=[{id:"ai-hub-edit-events-link",label:"Edit Calendar",editor:"events"}],Vt=[{id:"ai-hub-edit-resources-link",label:"Edit Resources",editor:"resources"}],ue="ai-hub-toggle-tabs-button",fe="data-ai-hub-hidden-tab",R="data-ai-hub-previous-display",Qe=".header-bar-outer-container",Le="data-ai-hub-hidden-header",be="ai-hub-editor-backdrop",W="ai-hub-editor-panel",L="ai-hub-json",Xt=["json"],Zt="AI Hub JSON",ze="tool-box",ge=["AI Tools and Resources","AI Tools and Resources Module"],et="ai-hub-json-data",xe="data-ai-hub-section",Qt="ai-hub-page-backup",tt="repeat(auto-fit,minmax(190px,1fr))",nt="14px",K=40,Y=40,V=80,X=40,Z=150,oe=28,re=18,me="\u{1F916}",ye="\u{1F4DA}",en={chart:"\u{1F4CA}",check:"\u2705",checklist:"\u2705",computer:"\u{1F4BB}",desktop:"\u{1F4BB}",document:"\u{1F4DA}",people:"\u{1F465}",play:"\u{1F3AC}",puzzle:"\u{1F9E9}",robot:"\u{1F916}"},tn={check:"\u2705",checklist:"\u2705",comment:"\u{1F4AC}",document:"\u{1F4C4}",file:"\u{1F4C4}",guide:"\u{1F9ED}",play:"\u25B6\uFE0F",video:"\u{1F3AC}"},nn={in_person:"In Person",live_cohort:"Live Cohort",self_paced:"Self-Paced"},ae=L;function U(){let e=String(Rt.courseId||"").trim();if(!e)throw new Error("AI Hub course id is missing. Set window.AIHubConfig.courseId before running.");return e}function P(){return"/courses/"+U()}function He(){return new RegExp("^"+P()+"/?$").test(window.location.pathname)}function Q(){return ve()===ze||new RegExp("^"+P()+"/pages/"+ze+"/?$").test(window.location.pathname)}function on(){return new RegExp("^"+P()+"(?:/|$)").test(window.location.pathname)}function rn(){return Q()?Vt:He()?Yt:[]}function $e(e){return"/api/v1/courses/"+U()+"/pages/"+encodeURIComponent(e||ae||L)}function he(e){return"/api/v1/courses/"+U()+"/pages/"+encodeURIComponent(e)}function ot(){return"/api/v1/courses/"+U()+"/pages"}function an(){let e=[ae,L].concat(Xt);return e.filter((t,n)=>t&&e.indexOf(t)===n)}function Pe(e){e&&(ae=e)}function rt(){return"/api/v1/courses/"+U()+"/modules"}function De(e){return"/api/v1/courses/"+U()+"/modules/"+encodeURIComponent(e)+"/items"}function ve(){var n,o;let e=(o=(n=window.ENV)==null?void 0:n.WIKI_PAGE)==null?void 0:o.url;if(e)return e;let t=window.location.pathname.match(new RegExp("^/courses/"+U()+"/pages/([^/?#]+)"));return t?decodeURIComponent(t[1]):""}function we(){return{version:1,events:[],courses:[],resources:[]}}function Ue(){let e=new Date().toISOString();return{version:1,events:[{id:"evt_ai_prompting_lab",title:"AI Prompting Lab",event_date:"2026-08-12",start_time:"10:00",location_type:"online",location_label:"Online (Zoom)",booking_url:"REPLACE-WITH-REGISTER-LINK-1",status:"active",sort_order:1,created_at:e,updated_at:e},{id:"evt_ai_policy_syllabus",title:"AI Policy & Syllabus Statements",event_date:"2026-08-19",start_time:"14:00",location_type:"online",location_label:"Online (Zoom)",booking_url:"REPLACE-WITH-REGISTER-LINK-2",status:"active",sort_order:2,created_at:e,updated_at:e},{id:"evt_feedback_workflows",title:"Automating Feedback Workflows",event_date:"2026-08-26",start_time:"11:00",location_type:"online",location_label:"Online (Zoom)",booking_url:"REPLACE-WITH-REGISTER-LINK-3",status:"active",sort_order:3,created_at:e,updated_at:e},{id:"evt_responsible_ai_office_hours",title:"Responsible AI Office Hours",event_date:"2026-09-02",start_time:"13:00",location_type:"online",location_label:"Online (Zoom)",booking_url:"REPLACE-WITH-REGISTER-LINK-4",status:"active",sort_order:4,created_at:e,updated_at:e}],courses:[{id:"course_ai_foundations",icon_key:"robot",title:"AI Foundations for Educators",description:"Core concepts for using AI confidently and responsibly.",format:"self_paced",course_url:"REPLACE-WITH-COURSE-LINK-1",sort_order:1,created_at:e,updated_at:e},{id:"course_prompting_course_design",icon_key:"puzzle",title:"Prompting for Course Design",description:"Draft outcomes, activities, examples, and rubrics faster.",format:"self_paced",course_url:"REPLACE-WITH-COURSE-LINK-2",sort_order:2,created_at:e,updated_at:e},{id:"course_responsible_ai_teaching",icon_key:"chart",title:"Responsible AI in Teaching",description:"Set clear expectations and reduce academic integrity risk.",format:"self_paced",course_url:"REPLACE-WITH-COURSE-LINK-3",sort_order:3,created_at:e,updated_at:e},{id:"course_ai_feedback_workflows",icon_key:"people",title:"AI Feedback Workflows",description:"Use AI to draft feedback while keeping instructor judgment central.",format:"self_paced",course_url:"REPLACE-WITH-COURSE-LINK-4",sort_order:4,created_at:e,updated_at:e},{id:"course_ai_accessibility",icon_key:"checklist",title:"AI Tools for Accessibility",description:"Improve readability, captions, alt text, and learner support.",format:"self_paced",course_url:"REPLACE-WITH-COURSE-LINK-5",sort_order:5,created_at:e,updated_at:e}],resources:[{id:"resource_ai_policy_template",icon_key:"document",category:"Policy",detail:"Template",title:"AI Use Policy Template",description:"Editable language for setting expectations around AI use.",resource_url:"REPLACE-WITH-RESOURCE-LINK-1",action_label:"Download",sort_order:1,created_at:e,updated_at:e},{id:"resource_prompt_library",icon_key:"checklist",category:"Prompting",detail:"Library",title:"Prompt Library",description:"Reusable prompts for planning, teaching, assessment, and feedback.",resource_url:"REPLACE-WITH-RESOURCE-LINK-2",action_label:"Download",sort_order:2,created_at:e,updated_at:e},{id:"resource_ai_assignment_checklist",icon_key:"play",category:"Assignments",detail:"Checklist",title:"AI Assignment Checklist",description:"Review assignments for AI clarity, usefulness, and integrity.",resource_url:"REPLACE-WITH-RESOURCE-LINK-3",action_label:"View Guide",sort_order:3,created_at:e,updated_at:e},{id:"resource_tool_evaluation_guide",icon_key:"comment",category:"Tools",detail:"Guide",title:"Tool Evaluation Guide",description:"Compare AI tools for privacy, accessibility, cost, and fit.",resource_url:"REPLACE-WITH-RESOURCE-LINK-4",action_label:"View Resource",sort_order:4,created_at:e,updated_at:e}]}}function B(){var n;let e=(n=document.querySelector("meta[name='csrf-token']"))==null?void 0:n.getAttribute("content");if(e)return e;let t=document.cookie.split(";").map(o=>o.trim()).find(o=>o.startsWith("_csrf_token="));return t?decodeURIComponent(t.split("=").slice(1).join("=")):""}function b(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function _(e){return b(e).replace(/"/g,"&quot;")}function sn(e){return`<pre id="${et}">${b(JSON.stringify(e,null,2))}</pre>`}function at(e,t){return{wiki_page:{url:t||ae||L,title:Zt,editing_roles:"teachers",published:!1,hide_from_students:!0,front_page:!1,body:sn(e),set_assignment:"0",assignment:{set_assignment:"0",publishable:!0,hidden:!1,unpublishable:!0},notify_of_update:"0",student_planner_checkbox:!1}}}function Oe(e){let t=String(e||"").split("-").map(Number);return t.length!==3||t.some(n=>!n)?null:new Date(t[0],t[1]-1,t[2])}function dn(e){let t=Oe(e);return t?t.toLocaleDateString(void 0,{month:"short"}).toUpperCase():""}function ln(e){let t=Oe(e);return t?String(t.getDate()).padStart(2,"0"):""}function cn(e){let t=String(e||"").split(":").map(Number);if(t.length<2||Number.isNaN(t[0])||Number.isNaN(t[1]))return"";let n=t[0]>=12?"PM":"AM",o=t[0]%12||12,r=String(t[1]).padStart(2,"0");return`${o}:${r} ${n}`}function pn(e){let t=Oe(e.event_date),n=t?t.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"}):"Date TBD",o=cn(e.start_time);return o?`${n} &middot; ${o}`:n}function Ne(e){return"["+xe+"='"+e+"']"}function je(e,t){var r;let o=Array.from(e.querySelectorAll("h2")).find(a=>a.textContent.trim().replace(/\s+/g," ")===t);return((r=o==null?void 0:o.parentElement)==null?void 0:r.parentElement)||null}function qe(e){return e.querySelector(Ne("events"))||je(e,"Upcoming Events")}function un(e){let t=qe(e);if(!t)return!1;let n=Array.from(t.querySelectorAll("div")).find(o=>{let r=o.getAttribute("style")||"";return/display\s*:\s*grid/i.test(r)&&/grid-template-columns/i.test(r)});return n?(n.style.display="grid",n.style.gridTemplateColumns=tt,n.style.gap=nt,n.style.justifyContent="",!0):!1}function it(e){return e.querySelector(Ne("courses"))||je(e,"Explore Courses")}function fn(e){var c;let n=Array.from(e.querySelectorAll("h2")).find(h=>{let S=h.textContent.trim().replace(/\s+/g," ");return S==="Micro-Trainings & Resources"||S==="AI Mini-Trainings"}),o=((c=n==null?void 0:n.parentElement)==null?void 0:c.parentElement)||Array.from(e.querySelectorAll("div")).find(h=>{let S=h.textContent||"";return/AI Toolbox/i.test(S)&&/Micro-Trainings|AI Mini-Trainings/i.test(S)});if(!o)return null;let r=(n==null?void 0:n.parentElement)||null,a=Array.from(o.children).find(h=>h!==r&&h.querySelector("a[href]"));if(a)return a;let l=o.querySelector("div[style*='grid'][style*='minmax']");return(l==null?void 0:l.parentElement)||null}function st(e){return e.querySelector(Ne("resources"))||fn(e)||je(e,"Featured Resources")}function dt(e){let t=Array.from(e.querySelectorAll("a[href]")).find(n=>/view all courses/i.test(n.textContent||""));return(t==null?void 0:t.getAttribute("href"))||"REPLACE-WITH-ALL-COURSES-LINK"}function ro(e){let t=Array.from(e.querySelectorAll("a[href]")).find(n=>/view all resources/i.test(n.textContent||""));return(t==null?void 0:t.getAttribute("href"))||"REPLACE-WITH-ALL-RESOURCES-LINK"}function Me(e){let t=(e==null?void 0:e.icon)||(e==null?void 0:e.icon_key)||"";return Ht(t)}function Be(e){let t=(e==null?void 0:e.icon)||(e==null?void 0:e.icon_key)||"";return Dt(t)}function lt(e){return nn[e]||I(String(e||"self_paced").replace(/_/g," "),24)}function ct(e,t,n){let o=String(e||"").trim();return o==="canvas_page"||o==="view_resource"?"canvas_page":o==="external_link"||/site|external/i.test(t||"")?"external_link":/view|canvas/i.test(t||"")?n?"external_link":"canvas_page":"download"}function ee(e){return ct(e==null?void 0:e.action_type,e==null?void 0:e.action_label,!!(e!=null&&e.resource_url&&!(e!=null&&e.page_url)))}function bn(e){return ee(e)==="download"?"Download":"View Resource"}function gn(e){return ee(e)==="canvas_page"?e.page_url||e.html_url||"#":e.resource_url||"#"}function Fe(e){let t=I(e.category||e.topic||"",oe),n=I(e.detail||e.duration||"",re);return t&&n?t+" - "+n:t||n||bn(e)}function pt(e){let t=I(e.category||e.topic||"",oe),n=I(e.detail||e.duration||"",re);return t&&n?b(t)+" &middot; "+b(n):b(Fe(e))}function ut(e){return ee(e)==="download"?"Download resource":"Open resource"}function xn(e){let t=e.title||"Untitled Event",n=dn(e.event_date)||"TBD",o=ln(e.event_date)||"--",r=e.location_label||"No location",a=e.booking_url||"#";return`
      <div style="background: #ffffff; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; border: 1px solid #e6e8ec;">
        <div style="display: inline-block; align-self: flex-start; border-radius: 8px; padding: 6px 12px; text-align: center; line-height: 1.1; margin-bottom: 14px; border: 1px solid #e6e8ec;">
          <div style="font-size: 11px; color: #1d4ed8;">${b(n)}</div>
          <div style="font-size: 22px; color: #000000;">${b(o)}</div>
        </div>
        <h3 style="margin: 0 0 12px; font-size: 16px; color: #000000; line-height: 1.25;">${b(t)}</h3>
        <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;"><span aria-hidden="true">&#128336;&nbsp;</span> ${pn(e)}</div>
        <div style="font-size: 13px; color: #6b7280; margin-bottom: 18px;"><span aria-hidden="true">&#128205;&nbsp;</span> ${b(r)}</div>
        <a style="margin-top: auto; display: block; text-align: center; background: #000000; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 10px; border-radius: 8px; border: 1.5px solid #000000;" href="${_(a)}" target="_blank" aria-label="Register for ${_(t)}" rel="noopener">Register</a>
      </div>
    `}function mn(e){let t=e.title||"Untitled Course",n=e.description||"",o=Me(e),r=e.course_url||"#",a=lt(e.format);return`
      <div style="background: #ffffff; border-radius: 14px; padding: 22px 16px; text-align: center; border: 1px solid #e6e8ec;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #eeeeef; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; font-size: 23px;" aria-hidden="true">${b(o)}</div>
        <h3 style="margin: 0 0 8px; font-size: 16px; line-height: 1.25;"><a style="color: #000000; text-decoration: underline;" href="${_(r)}">${b(t)}</a></h3>
        <div style="font-size: 13px; color: #6b7280; margin-bottom: 12px;">${b(n)}</div>
        <div style="font-size: 12px; color: #1d4ed8;"><span aria-hidden="true">&#128336;&nbsp;</span> ${b(a)}</div>
      </div>
    `}function yn(e){let t=e.title||"Untitled Resource",n=e.description||"",o=Be(e),r=pt(e),a=ut(e),l=gn(e);return`
      <div style="display: flex; flex-direction: column; min-height: 270px; color: #111827; background: #ffffff; border: 1px solid #dbe3f0; border-radius: 14px; overflow: hidden;">
        <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 118px; background: #eff6ff; color: #1d4ed8; font-size: 46px; line-height: 1; border-bottom: 1px solid #dbe3f0;" role="img" aria-label="${_(t+" image placeholder")}">${b(o)}</div>
        <span style="display: block; padding: 16px 16px 0; font-size: 12px; color: #1d4ed8; text-transform: uppercase; font-weight: bold;">${r}</span>
        <strong style="display: block; padding: 8px 16px 0; font-size: 19px; line-height: 1.2; color: #000000;">${b(t)}</strong>
        <span style="display: block; padding: 8px 16px 0; font-size: 14px; color: #4b5563;">${b(n)}</span>
        <a style="display: block; margin-top: auto; padding: 16px; color: #1d4ed8; font-size: 14px; font-weight: bold; text-decoration: none;" href="${_(l)}" aria-label="${_(a+" "+t)}">${b(a)} <span aria-hidden="true">&rarr;</span></a>
      </div>
    `}function _e(e){let t=se(e||[]).filter(o=>o.status!=="archived"),n=t.length?t.map(xn).join(""):'<div style="background: #ffffff; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; border: 1px solid #e6e8ec; color: #6b7280;">No upcoming events are scheduled yet.</div>';return`
      <div ${xe}="events" style="margin-top: 52px;">
        <div style="display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: bold; font-size: 28px; color: #000000;">Upcoming Events</h2>
        </div>
        <div style="display: grid; grid-template-columns: ${tt}; gap: ${nt};">
          ${n}
        </div>
      </div>
    `}function We(e,t){let n=F(e||[]),o=(t==null?void 0:t.viewAllUrl)||"REPLACE-WITH-ALL-COURSES-LINK",r=n.length?n.map(mn).join(""):'<div style="background: #ffffff; border-radius: 14px; padding: 22px 16px; text-align: center; border: 1px solid #e6e8ec; color: #6b7280;">No courses have been added yet.</div>';return`
      <div ${xe}="courses" style="margin-top: 52px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: 700; font-size: 28px; color: #000000;">Explore Courses</h2>
          <a style="color: #000000; text-decoration: underline; font-size: 14px;" href="${_(o)}">View all courses <span aria-hidden="true">&rarr;</span></a>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit,minmax(145px,1fr)); gap: 16px;">
          ${r}
        </div>
      </div>
    `}function ke(e,t){let n=F(e||[]),o=n.length?n.map(yn).join(""):'<div style="background: #ffffff; border-radius: 14px; padding: 20px 18px; display: flex; flex-direction: column; border: 1px solid #e6e8ec; color: #6b7280;">No resources have been added yet.</div>';return`
      <div ${xe}="resources" style="padding: 20px; background: #f8fafc; border: 1px solid #dbe3f0; border-radius: 16px;">
        <div style="display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 16px;">
          ${o}
        </div>
      </div>
    `}function Ge(e){let t=m(e);return`
      <div style="max-width: 1000px; margin: 0 auto; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; color: #4b5563; line-height: 1.55;">
        <div style="padding: 0 4px 34px;">
          <div style="display: inline-block; color: #1d4ed8; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px;">AI Toolbox</div>
          <h2 style="font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: bold; margin: 0; font-size: 42px; line-height: 1.08; color: #000000;">Micro-Trainings &amp; Resources</h2>
          <p style="margin: 18px 0 0; font-size: 17px; max-width: 680px; color: #4b5563;">Pick a short training and jump into a specific AI skill, workflow, or teaching move.</p>
        </div>
        ${ke(t.resources,{})}
      </div>
    `}function ft(e){let t=m(e);return`
      <div data-ai-hub-section="shell" style="max-width: 1000px; margin: 0 auto; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; color: #4b5563; line-height: 1.55;">
        <div style="display: flex; flex-wrap: wrap; gap: 30px; align-items: center; padding: 0 4px 52px;">
          <div style="flex: 1 1 340px;">
            <h2 style="font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: bold; margin: 0; font-size: 46px; line-height: 1.08; color: #000000;">Use AI with Purpose<br /><span style="color: #1d4ed8;">Learn. Build. Create.</span></h2>
            <p style="margin: 18px 0 28px; font-size: 17px; max-width: 470px; color: #4b5563;">Your central hub for AI tools, training, resources, and project support across teaching, learning, course design, and daily work.</p>
            <div style="display: flex; flex-wrap: wrap; gap: 12px;"><a style="display: inline-block; background: #1d4ed8; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 13px 24px; border-radius: 8px;" href="https://btech.instructure.com/courses/621895/pages/contact">Get Help with AI: Contact ISD</a></div>
          </div>
          <div style="flex: 1 1 340px;"><img style="display: block; width: 100%; min-height: 300px; border-radius: 18px; border: 1px solid #e5e7eb;" src="https://btech.instructure.com/courses/611213/files/123202821/preview" alt="People collaborating around course and technology planning" data-api-endpoint="https://btech.instructure.com/api/v1/courses/611213/files/123202821" data-api-returntype="File" /></div>
        </div>
        <div style="margin-top: 0;">
          <h2 style="margin: 0 0 18px; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: bold; font-size: 28px; color: #000000;">Choose Your AI Path</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); gap: 18px;">
            <div style="background: #ffffff; border: 1px solid #e6e8ec; border-radius: 16px; padding: 26px; display: flex; flex-direction: column;">
              <div style="font-size: 12px; color: #1d4ed8; text-transform: uppercase; margin-bottom: 8px;"><strong>Start here</strong></div>
              <h3 style="margin: 0 0 10px; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: bold; font-size: 24px; color: #000000; line-height: 1.2;">AI Basics Course</h3>
              <p style="margin: 0 0 20px; font-size: 15px; color: #4b5563;">A guided start-to-finish course for learning AI foundations in chronological order and completing the full pathway.</p>
              <a style="margin-top: auto; display: inline-block; align-self: flex-start; background: #1d4ed8; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 12px 20px; border-radius: 8px;" href="https://btech.instructure.com/courses/621895/modules">Start the Journey</a>
            </div>
            <div style="background: #ffffff; border: 1px solid #e6e8ec; border-radius: 16px; padding: 26px; display: flex; flex-direction: column;">
              <div style="font-size: 12px; color: #1d4ed8; text-transform: uppercase; margin-bottom: 8px;"><strong>Toolbox</strong></div>
              <h3 style="margin: 0 0 10px; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: bold; font-size: 24px; color: #000000; line-height: 1.2;">Micro-Trainings &amp; Resources</h3>
              <p style="margin: 0 0 20px; font-size: 15px; color: #4b5563;">Short, one-off trainings and resources for specific AI skills, tools, classroom uses, and workflow ideas.</p>
              <a style="margin-top: auto; display: inline-block; align-self: flex-start; background: #000000; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 12px 20px; border-radius: 8px;" href="https://btech.instructure.com/courses/621895/pages/tool-box">Open the Toolbox</a>
            </div>
          </div>
        </div>
        ${_e(t.events,{})}
        <div style="margin-top: 48px; margin-bottom: 8px; background: #1d4ed8; border-radius: 16px; padding: 32px 30px; display: flex; flex-wrap: wrap; gap: 20px; align-items: center; justify-content: space-between;">
          <div style="flex: 1 1 320px;">
            <h2 style="margin: 0 0 8px; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: bold; font-size: 26px; color: #ffffff;">Need help with an AI project?</h2>
            <div style="font-size: 15px; color: rgba(255,255,255,0.88); max-width: 620px;">ISD can help you plan responsible AI use, choose tools, build workflows, design learning activities, and think through project guardrails.</div>
          </div>
          <span style="color: #1d4ed8;"><a style="display: inline-block; background: #ffffff; color: #1d4ed8; text-decoration: none; font-size: 15px; font-weight: bold; padding: 13px 24px; border-radius: 8px;" href="https://btech.instructure.com/courses/621895/pages/contact">Get Help with AI: Contact ISD</a></span>
        </div>
      </div>
    `}function bt(e,t){let n=new DOMParser().parseFromString(e||"","text/html"),o=qe(n);if(!o)throw new Error('Could not find the "Upcoming Events" section in the current hub page body.');let r=n.createElement("template");return r.innerHTML=_e(m(t).events).trim(),o.replaceWith(r.content.firstElementChild),n.body.innerHTML}function gt(e,t){let n=new DOMParser().parseFromString(e||"","text/html"),o=it(n);if(!o)throw new Error('Could not find the "Explore Courses" section in the current hub page body.');let r=n.createElement("template");return r.innerHTML=We(m(t).courses,{viewAllUrl:dt(o)}).trim(),o.replaceWith(r.content.firstElementChild),n.body.innerHTML}function xt(e,t){let n=new DOMParser().parseFromString(e||"","text/html"),o=st(n);if(!o)throw new Error("Could not find the toolbox resources section in the current AI Hub page body.");let r=n.createElement("template");return r.innerHTML=ke(m(t).resources,{}).trim(),o.replaceWith(r.content.firstElementChild),n.body.innerHTML}function hn(e){let t=qe(document);if(!t)return!1;let n=document.createElement("template");return n.innerHTML=_e(m(e).events).trim(),t.replaceWith(n.content.firstElementChild),!0}function vn(e){let t=st(document);if(!t)return!1;let n=document.createElement("template");return n.innerHTML=ke(m(e).resources,{}).trim(),t.replaceWith(n.content.firstElementChild),!0}function wn(e){let t=it(document);if(!t)return!1;let n=document.createElement("template");return n.innerHTML=We(m(e).courses,{viewAllUrl:dt(t)}).trim(),t.replaceWith(n.content.firstElementChild),!0}function _n(e,t,n){return n==="courses"?gt(e,t):n==="resources"?xt(e,t):bt(e,t)}function kn(e,t){return t==="courses"?wn(e):t==="resources"?vn(e):hn(e)}function Sn(){return Q()?"resources":"events"}function En(e){let t=new DOMParser().parseFromString(e||"","text/html").body.textContent||"";return/AI Toolbox/i.test(t)&&/Micro-Trainings|AI Mini-Trainings/i.test(t)}function An(e){let t=new DOMParser().parseFromString(e||"","text/html"),n=t.getElementById(et),o=n?n.textContent:t.body.textContent;if(!o||!o.trim()||!o.trim().startsWith("{"))return we();try{return Object.assign(we(),JSON.parse(o))}catch(r){return console.warn("AI Hub JSON page could not be parsed. Using default data.",r),we()}}async function Cn(e){let t=await fetch($e(e),{method:"GET",credentials:"include",headers:{accept:"application/json"}});if(t.ok){let o=await t.json();return Pe(o.url||e),o}let n=new Error("Could not fetch JSON data page /pages/"+e+". Status: "+t.status);throw n.status=t.status,n.pageUrl=e,n}async function mt(){let e=[];for(let r of an())try{return await Cn(r)}catch(a){if(a.pageUrl=a.pageUrl||r,e.push(a),![403,404].includes(a.status))break}let t=e.map(r=>"/pages/"+r.pageUrl+" -> "+(r.status||"request failed")).join("; "),o=e.some(r=>r.status===403)?" Canvas denied access. Confirm the AI Hub JSON page exists at /pages/"+L+" and that your Canvas role can read and edit course pages.":" Confirm the AI Hub JSON page exists at /pages/"+L+".";throw new Error("Could not fetch AI Hub JSON data page. Tried "+t+"."+o)}async function A(){let e=await mt();return An(e.body)}async function Se(e){let t={accept:"application/json","content-type":"application/json","x-requested-with":"XMLHttpRequest"},n=B();n&&(t["x-csrf-token"]=n);let o=ae||L,r=at(e,o),a=await fetch($e(o),{method:"PUT",credentials:"include",headers:t,body:JSON.stringify(r)});if(a.status===404&&(Pe(L),a=await fetch(ot(),{method:"POST",credentials:"include",headers:t,body:JSON.stringify(at(e,L))})),!a.ok)throw new Error("Could not save JSON data page. Status: "+a.status+". "+await a.text());let l=await a.json();return Pe(l.url||o),l}async function ie(e){let t=await fetch(he(e),{method:"GET",credentials:"include",headers:{accept:"application/json"}});if(!t.ok)throw new Error("Could not fetch Canvas page /pages/"+e+". Status: "+t.status);return t.json()}function In(e){let n=(e.headers.get("Link")||"").split(",").find(r=>/rel="?next"?/i.test(r)),o=n?n.match(/<([^>]+)>/):null;return o?o[1]:""}async function yt(e,t){let n=e,o=[];for(;n;){let r=await fetch(n,{method:"GET",credentials:"include",headers:{accept:"application/json"}});if(!r.ok)throw new Error(t+". Status: "+r.status);let a=await r.json();o.push(...Array.isArray(a)?a:[a]),n=In(r)}return o}function ht(e){return String(e||"").trim().toLowerCase().replace(/\s+/g," ").replace(/\s+module$/,"")}async function Tn(){return yt(rt()+"?per_page=100","Could not fetch course modules")}async function Ln(e){return yt(De(e)+"?per_page=100","Could not fetch module items")}async function vt(){let e={accept:"application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01","content-type":"application/json","x-requested-with":"XMLHttpRequest"},t=B();t&&(e["x-csrf-token"]=t);let n=await fetch(rt(),{method:"POST",mode:"cors",credentials:"include",headers:e,referrer:window.location.origin+P()+"/modules",body:JSON.stringify({module:{name:ge[0],position:999}})});if(!n.ok)throw new Error("Could not create the "+ge[0]+" module. Status: "+n.status+". "+await n.text());return n.json()}async function zn(){let e=ge.map(ht);return(await Tn()).find(o=>e.includes(ht(o.name)))||vt()}function Hn(e,t,n){if((e==null?void 0:e.type)!=="Page")return!1;let o=(n==null?void 0:n.url)||G(t),r=String((n==null?void 0:n.page_id)||(n==null?void 0:n.id)||(t==null?void 0:t.page_id)||""),a=e.page_url||"",l=String(e.content_id||"");return!!(o&&a===o)||!!(r&&l===r)}async function $n(e,t,n){if(!(t!=null&&t.id)||t.title===n)return t;let o={accept:"application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01","content-type":"application/json","x-requested-with":"XMLHttpRequest"},r=B();r&&(o["x-csrf-token"]=r);let a=await fetch(De(e)+"/"+encodeURIComponent(t.id),{method:"PUT",mode:"cors",credentials:"include",headers:o,referrer:window.location.origin+P()+"/modules",body:JSON.stringify({module_item:{title:n}})});if(!a.ok)throw new Error("Could not update the resource module item title. Status: "+a.status+". "+await a.text());return a.json()}async function wt(e,t){let n=(t==null?void 0:t.url)||G(e);if(!n)throw new Error("Could not add resource to module because the Canvas page slug is missing.");let o=await zn(),a=(await Ln(o.id)).find(k=>Hn(k,e,t)),l=e.title||(t==null?void 0:t.title)||"Resource";if(a)return $n(o.id,a,l);let c={accept:"application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01","content-type":"application/json","x-requested-with":"XMLHttpRequest"},h=B();h&&(c["x-csrf-token"]=h);let S=await fetch(De(o.id),{method:"POST",mode:"cors",credentials:"include",headers:c,referrer:window.location.origin+P()+"/modules",body:JSON.stringify({module_item:{title:l,type:"Page",page_url:n,indent:0,position:999}})});if(!S.ok)throw new Error("Could not add resource page to the "+ge[0]+" module. Status: "+S.status+". "+await S.text());return S.json()}function _t(e,t){let n=new Date().toISOString().replace(/[:.]/g,"-"),o=Qt+":"+U()+":"+e+":"+n;return localStorage.setItem(o,t||""),console.log("AI Hub page backup saved:",o),o}async function Je(e,t){let n={accept:"application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01","content-type":"application/json","x-requested-with":"XMLHttpRequest"},o=B();o&&(n["x-csrf-token"]=o);let r=e.url||ve(),a=Object.assign({},e,{url:r,body:t,notify_of_update:"0",student_planner_checkbox:!1}),l=await fetch(he(r),{method:"PUT",mode:"cors",credentials:"include",headers:n,referrer:window.location.origin+P()+"/pages/"+r+"/edit",body:JSON.stringify({wiki_page:a})});if(!l.ok)throw new Error("Could not save visible hub page. Status: "+l.status+". "+await l.text());return l.json()}function kt(e){let t=document.querySelector("#wiki_page_show .user_content")||document.querySelector(".show-content")||document.querySelector("#content .user_content")||document.querySelector(".user_content");t&&(t.innerHTML=e)}function Ee(e){let t=e.title||"Resource",n=e.description||"A short AI toolbox resource.",o=Fe(e),r=P()+"/pages/"+ze;return`
      <div data-ai-hub-resource-page="true" style="max-width: 1000px; margin: 0 auto; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; color: #4b5563; line-height: 1.55;">
        <div style="padding: 0 4px 24px;">
          <a style="display: inline-block; background: #000000; color: #ffffff; text-decoration: none; font-size: 14px; padding: 11px 18px; border-radius: 8px;" href="${_(r)}">&larr; Back to resources</a>
        </div>
        <div style="padding: 0 4px 28px;">
          <div data-ai-hub-resource-meta style="display: inline-block; color: #1d4ed8; font-size: 12px; margin-bottom: 10px;">${b(o)}</div>
          <h2 data-ai-hub-resource-title style="font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; margin: 0; font-size: 42px; line-height: 1.08; color: #000000;">${b(t)}</h2>
          <p data-ai-hub-resource-description style="margin: 18px 0 0; font-size: 17px; color: #4b5563;">${b(n)}</p>
        </div>
        <div style="padding: 0 4px;">
          [insert video]
        </div>
        <div style="margin-top: 30px; padding: 0 4px;">
          <h3 style="margin: 0 0 10px; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size: 24px; line-height: 1.2; color: #000000;">Recap</h3>
          <p style="margin: 0; font-size: 16px; color: #4b5563;">&nbsp;</p>
        </div>
        <div style="margin-top: 28px; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #bfdbfe;">
          <div style="background: #1d4ed8; color: #ffffff; padding: 12px 18px; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size: 16px;">Before You Apply This</div>
          <div style="padding: 18px 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit,minmax(210px,1fr)); gap: 22px;">
              <div>
                <div style="font-size: 12px; color: #1d4ed8; margin-bottom: 6px;">Safe</div>
                <p style="margin: 0; font-size: 14px; color: #4b5563;">Do not enter private, sensitive, student, or protected information into AI tools.</p>
              </div>
              <div>
                <div style="font-size: 12px; color: #1d4ed8; margin-bottom: 6px;">Appropriate</div>
                <p style="margin: 0; font-size: 14px; color: #4b5563;">Use AI for planning, drafting, practice, and feedback support while keeping instructor expertise central.</p>
              </div>
              <div>
                <div style="font-size: 12px; color: #1d4ed8; margin-bottom: 6px;">Transparent</div>
                <p style="margin: 0; font-size: 14px; color: #4b5563;">Be clear with learners or colleagues when AI helped shape materials, feedback, examples, or decisions.</p>
              </div>
            </div>
          </div>
        </div>
        <div style="margin-top: 28px; background: #ffffff; border: 1px solid #dbe3f0; border-radius: 14px; padding: 20px 22px;">
          <div style="display: inline-block; background: #e0efff; color: #1d4ed8; border-radius: 8px; padding: 5px 10px; font-size: 12px; margin-bottom: 12px;">Resources</div>
          <ul style="margin: 0; padding-left: 22px; font-size: 15px; color: #4b5563;">
            <li><a style="color: #1d4ed8; text-decoration: underline;" href="#">Example resource link</a></li>
          </ul>
        </div>
      </div>
    `}function Pn(e,t){let n=`<h2>${b(t.title||"Resource")}</h2>`,o=`<p>${b(t.description||"")}</p>`,r=String(e||"").trim();if(!r||/^<h2\b[^>]*>[\s\S]*?<\/h2>\s*<p\b[^>]*>[\s\S]*?<\/p>$/i.test(r))return Ee(t).trim();let a=new DOMParser().parseFromString(r,"text/html"),l=a.querySelector("[data-ai-hub-resource-page]");if(l){let c=l.querySelector("[data-ai-hub-resource-title]"),h=l.querySelector("[data-ai-hub-resource-description]"),S=l.querySelector("[data-ai-hub-resource-meta]");return c&&(c.textContent=t.title||"Resource"),h&&(h.textContent=t.description||"A short AI toolbox resource."),S&&(S.textContent=Fe(t)),a.body.innerHTML.trim()}return/<h2\b[^>]*>[\s\S]*?<\/h2>/i.test(r)?r=r.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/i,n):r=n+`
`+r,/<p\b[^>]*>[\s\S]*?<\/p>/i.test(r)?r=r.replace(/<p\b[^>]*>[\s\S]*?<\/p>/i,o):r=r.replace(/<\/h2>/i,`</h2>
`+o),r}async function St(e){let t={accept:"application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01","content-type":"application/json","x-requested-with":"XMLHttpRequest"},n=B();n&&(t["x-csrf-token"]=n);let o=await fetch(ot(),{method:"POST",mode:"cors",credentials:"include",headers:t,referrer:window.location.origin+P()+"/pages",body:JSON.stringify({wiki_page:{editing_roles:"teachers",editor:"rce",block_editor_attributes:null,publishable:!0,published:!0,deletable:!0,title:e.title||"New Resource",body:Ee(e),student_todo_at:null,publish_at:null,notify_of_update:"0",assignment:{set_assignment:"0",publishable:!0,hidden:!1,unpublishable:!0},set_assignment:"0",student_planner_checkbox:!1}})});if(!o.ok)throw new Error("Could not create resource Canvas page. Status: "+o.status+". "+await o.text());return o.json()}function G(e){let t=e==null?void 0:e.page_slug;if(t)return t;let n=(e==null?void 0:e.page_url)||(e==null?void 0:e.html_url);if(!n)return"";try{let r=new URL(n,window.location.origin).pathname.match(/\/pages\/([^/?#]+)/);return r?decodeURIComponent(r[1]):""}catch(o){let r=String(n).match(/\/pages\/([^/?#]+)/);return r?decodeURIComponent(r[1]):""}}async function Et(e){let t=G(e);if(!t)throw new Error("Could not find the existing Canvas page slug for this resource.");let n=await ie(t),o={accept:"application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01","content-type":"application/json","x-requested-with":"XMLHttpRequest"},r=B();r&&(o["x-csrf-token"]=r);let a=n.url||t,l=Object.assign({},n,{url:a,title:e.title||n.title||"Resource",body:Pn(n.body,e),published:!0,notify_of_update:"0",student_planner_checkbox:!1}),c=await fetch(he(a),{method:"PUT",mode:"cors",credentials:"include",headers:o,referrer:window.location.origin+P()+"/pages/"+a+"/edit",body:JSON.stringify({wiki_page:l})});if(!c.ok)throw new Error("Could not update resource Canvas page. Status: "+c.status+". "+await c.text());return c.json()}async function At(e){let t=G(e);if(!t)return null;let n=await ie(t),o={accept:"application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01","content-type":"application/json","x-requested-with":"XMLHttpRequest"},r=B();r&&(o["x-csrf-token"]=r);let a=n.url||t,l=Object.assign({},n,{url:a,published:!1,notify_of_update:"0",student_planner_checkbox:!1}),c=await fetch(he(a),{method:"PUT",mode:"cors",credentials:"include",headers:o,referrer:window.location.origin+P()+"/pages/"+a+"/edit",body:JSON.stringify({wiki_page:l})});if(!c.ok)throw new Error("Could not unpublish linked resource page. Status: "+c.status+". "+await c.text());return c.json()}function Dn(e){let t=G(e);if(t)return window.location.origin+P()+"/pages/"+t+"/edit";let n=(e==null?void 0:e.page_url)||(e==null?void 0:e.html_url);if(!n)return"";try{let o=new URL(n,window.location.origin);return o.pathname=o.pathname.replace(/\/$/,"")+"/edit",o.search="",o.hash="",o.toString()}catch(o){return String(n).replace(/\/$/,"")+"/edit"}}async function Ct(e,t){let n=ve(),o=t||Sn();if(!n)throw new Error("Could not determine the current Canvas page URL.");if(n===L)throw new Error("The visible hub page cannot be updated while you are on the JSON data page.");let r=await ie(n),a=m(e),l=!1,c="";try{c=_n(r.body,a,o)}catch(k){if(!(o==="resources"&&(Q()||En(r.body)||/tool/i.test(n))))throw k;l=!0,c=Ge(a).trim(),console.warn("AI Hub toolbox resources section was not found. Replacing the toolbox page body instead.",k)}let h=_t(n,r.body),S=await Je(r,c);return l?kt(c):kn(a,o),console.log("AI Hub visible page saved:",n,"Backup:",h),S}async function j(e,t){await Se(e);try{await Ct(e,t)}catch(n){throw new Error("JSON page saved, but visible hub page update failed. "+n.message)}return e}async function Un(){if(!window.confirm("Replace /pages/"+L+" with starter AI Hub JSON data?"))return null;let t=Ue();return await Se(t),t}async function On(){let e=ve();if(!e)throw new Error("Could not determine the current Canvas page URL.");if(e===L)throw new Error("Open the visible AI Hub page before seeding the page layout.");let t=Q()?"starter AI Toolbox layout":"starter AI Hub layout";if(!window.confirm("Replace the current Canvas page body with the "+t+" and save starter JSON to /pages/"+L+"?"))return null;let o=Ue();await Se(o);let r=await ie(e),a=Q()?Ge(o).trim():ft(o).trim(),l=_t(e,r.body),c=await Je(r,a);return kt(a),console.log("AI Hub starter page saved:",e,"Backup:",l),{data:o,savedPage:c,backupKey:l}}function Re(e){return e+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,8)}function m(e){return Object.assign(we(),e||{},{events:Array.isArray(e==null?void 0:e.events)?e.events:[],courses:Array.isArray(e==null?void 0:e.courses)?e.courses:[],resources:Array.isArray(e==null?void 0:e.resources)?e.resources:[]})}function F(e){return[...e].sort((t,n)=>(Number(t.sort_order)||0)-(Number(n.sort_order)||0))}function ao(e){F(e).forEach((t,n)=>{t.sort_order=n+1})}function It(e){let t=/^\d{4}-\d{2}-\d{2}$/.test((e==null?void 0:e.event_date)||"")?e.event_date:"9999-12-31",n=/^\d{2}:\d{2}$/.test((e==null?void 0:e.start_time)||"")?e.start_time:"23:59";return t+"T"+n}function se(e){return[...e].sort((t,n)=>{let o=It(t).localeCompare(It(n));return o!==0?o:(Number(t.sort_order)||0)-(Number(n.sort_order)||0)})}function de(e){return e.events=se(e.events||[]),e.events.forEach((t,n)=>{t.sort_order=n+1}),e}function I(e,t){return String(e||"").trim().slice(0,t)}function Nn(e){var n;let t=String(e||"");return(n=window.Intl)!=null&&n.Segmenter?Array.from(new Intl.Segmenter(void 0,{granularity:"grapheme"}).segment(t),o=>o.segment):Array.from(t)}function Ae(e){let t=en[String(e||"").trim()];if(t)return t;let n=/[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Regional_Indicator}]/u;return Nn(e).find(o=>n.test(o))||""}function jn(e,t){let n=new Date().toISOString();return Object.assign({},t||{},{id:(t==null?void 0:t.id)||Re("evt"),title:I(e.title,K),event_date:e.event_date||"",start_time:e.start_time||"",location_type:e.location_type||"online",location_label:e.location_label||"",booking_url:e.booking_url||"",status:e.status||(t==null?void 0:t.status)||"active",sort_order:(t==null?void 0:t.sort_order)||999,created_at:(t==null?void 0:t.created_at)||n,updated_at:n})}async function Ke(e,t){let n=await A(),o=m(n),r=o.events.findIndex(c=>c.id===e),a=r>=0?o.events[r]:null,l=jn(t,a);return a?o.events[r]=l:(l.sort_order=o.events.length+1,o.events.push(l)),de(o),await j(o,"events"),l}async function Tt(e){let t=m(await A());return t.events=t.events.filter(n=>n.id!==e),de(t),await j(t,"events"),t.events}async function Lt(e,t){let n=m(await A()),o=n.events.find(r=>r.id===e);return o?(o.status=t,o.updated_at=new Date().toISOString(),de(n),await j(n,"events"),o):null}async function qn(e,t){let n=m(await A());n.events=F(n.events);let o=n.events.findIndex(l=>l.id===e);if(o<0)return n.events;let r=t==="up"?o-1:o+1;if(r<0||r>=n.events.length)return n.events;let a=n.events[o];return n.events[o]=n.events[r],n.events[r]=a,de(n),await j(n,"events"),n.events}async function Mn(e){return Ke(null,e)}async function zt(e){let t=m(await A()),n={};t.events.forEach(a=>{n[a.id]=a});let o=e.map(a=>n[a]).filter(Boolean),r=t.events.filter(a=>!e.includes(a.id));return t.events=o.concat(r),de(t),await j(t,"events"),t.events}function Ht(e){return Ae(e)||ye}function Bn(e,t){let n=new Date().toISOString();return Object.assign({},t||{},{id:(t==null?void 0:t.id)||Re("course"),icon:Ht(e.icon||(t==null?void 0:t.icon)||(t==null?void 0:t.icon_key)),title:I(e.title,Y),description:I(e.description,V),format:e.format||(t==null?void 0:t.format)||"self_paced",course_url:e.course_url||"",sort_order:(t==null?void 0:t.sort_order)||999,created_at:(t==null?void 0:t.created_at)||n,updated_at:n})}function $t(e){return e.courses=F(e.courses||[]),e.courses.forEach((t,n)=>{t.sort_order=n+1}),e}async function Ye(e,t){let n=m(await A()),o=n.courses.findIndex(l=>l.id===e),r=o>=0?n.courses[o]:null,a=Bn(t,r);return r?n.courses[o]=a:(a.sort_order=n.courses.length+1,n.courses.push(a)),$t(n),await j(n,"courses"),a}async function Fn(e){return Ye(null,e)}async function Pt(e){let t=m(await A());return t.courses=t.courses.filter(n=>n.id!==e),$t(t),await j(t,"courses"),t.courses}function Dt(e){return tn[e]||Ae(e)||me}function Wn(e,t){let n=new Date().toISOString(),o=ct(e.action_type||"canvas_page",e.action_label),r=o==="download"?"Download":"View Resource",a=Object.prototype.hasOwnProperty.call(e,"category"),l=Object.prototype.hasOwnProperty.call(e,"detail"),c=a?e.category:(t==null?void 0:t.category)||(t==null?void 0:t.topic),h=l?e.detail:(t==null?void 0:t.detail)||(t==null?void 0:t.duration);return Object.assign({},t||{},{id:(t==null?void 0:t.id)||Re("resource"),icon:Dt(e.icon||(t==null?void 0:t.icon)||(t==null?void 0:t.icon_key)),category:I(c,oe),detail:I(h,re),title:I(e.title,X),description:I(e.description,Z),action_type:o,action_label:r,resource_url:o==="canvas_page"?"":e.resource_url||"",sort_order:(t==null?void 0:t.sort_order)||999,created_at:(t==null?void 0:t.created_at)||n,updated_at:n})}function Ut(e){return e.resources=F(e.resources||[]),e.resources.forEach((t,n)=>{t.sort_order=n+1}),e}async function Ve(e,t){let n=m(await A()),o=n.resources.findIndex(c=>c.id===e),r=o>=0?n.resources[o]:null,a=Wn(t,r),l=null;if(a.action_type==="canvas_page"){let c=G(a)?await Et(a):await St(a);l=c,a.page_id=c.page_id||c.id||a.page_id||"",a.page_slug=c.url||a.page_slug||"",a.page_url=c.html_url||(c.url?P()+"/pages/"+c.url:a.page_url||"")}if(r?n.resources[o]=a:(a.sort_order=n.resources.length+1,n.resources.push(a)),Ut(n),await j(n,"resources"),a.action_type==="canvas_page")try{await wt(a,l)}catch(c){console.warn("AI Hub resource page was saved, but module item creation failed.",c),Object.defineProperty(a,"module_item_warning",{value:c.message,enumerable:!1})}return a}async function Gn(e){return Ve(null,e)}async function Ot(e){let t=m(await A()),n=t.resources.find(r=>r.id===e),o={resources:[],page_unpublished:!1,page_unpublish_warning:""};if(t.resources=t.resources.filter(r=>r.id!==e),Ut(t),await j(t,"resources"),o.resources=t.resources,n&&ee(n)==="canvas_page"&&G(n))try{await At(n),o.page_unpublished=!0}catch(r){console.warn("AI Hub resource card was deleted, but linked page unpublish failed.",r),o.page_unpublish_warning=r.message}return o}function Nt(){document.querySelectorAll(Qe).forEach(e=>{e.setAttribute(Le,"true"),e.setAttribute(R,e.style.display||""),e.style.display="none"})}function Jn(){document.querySelectorAll(Qe+"["+Le+"='true']").forEach(e=>{e.style.display=e.getAttribute(R)||"",e.removeAttribute(Le),e.removeAttribute(R)})}function jt(){document.querySelectorAll("#section-tabs li").forEach(e=>{if(e.hasAttribute(Te)||e.id===ue)return;let t=e.querySelector("a");if(!t)return;let n=t.textContent.trim();Kt.includes(n)||(e.setAttribute(fe,"true"),e.setAttribute(R,e.style.display||""),e.style.display="none")})}function Rn(){document.querySelectorAll("#section-tabs li["+fe+"='true']").forEach(e=>{e.style.display=e.getAttribute(R)||"",e.removeAttribute(fe),e.removeAttribute(R)})}function Kn(){document.querySelectorAll("#section-tabs li["+Te+"]").forEach(e=>{e.remove()})}function qt(e){rn().forEach(t=>{if(document.getElementById(t.id))return;let n=document.createElement("li");n.id=t.id,n.className="section",n.setAttribute(Te,t.editor),n.innerHTML=`
        <a href="#" class="settings">
          <i class="icon-edit" aria-hidden="true"></i>
          <span class="name">${t.label}</span>
        </a>
      `,n.querySelector("a").addEventListener("click",o=>{if(o.preventDefault(),t.editor==="events"){Yn();return}if(t.editor==="courses"){Vn();return}if(t.editor==="resources"){Xn();return}console.log("AI Hub editor tab selected:",t.editor)}),e.appendChild(n)})}function te(){let e=document.getElementById(be);if(!e)return;let t=document.getElementById(W);e.style.opacity="0",e.style.background="rgba(0,0,0,0)",t&&(t.style.opacity="0",t.style.transform="translateY(18px) scale(0.98)"),window.setTimeout(()=>{e.remove()},180)}function Yn(){te();let e=document.createElement("div");e.id=be,e.style.cssText=["position:fixed","inset:0","z-index:999999","display:flex","align-items:center","justify-content:center","padding:24px","background:rgba(0,0,0,0)","opacity:0","transition:opacity 180ms ease, background 180ms ease"].join(";"),e.innerHTML=`
      <div
        id="${W}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-hub-events-title"
        style="
          width: min(1160px, 100%);
          max-height: min(860px, calc(100vh - 48px));
          overflow: auto;
          background: #fbfbfc;
          color: #111827;
          border: 1px solid #e6e8ec;
          border-radius: 18px;
          box-shadow: 0 28px 80px rgba(0,0,0,0.24);
          font-family: 'Inter','Segoe UI',Roboto,Arial,sans-serif;
          opacity: 0;
          transform: translateY(18px) scale(0.98);
          transition: opacity 180ms ease, transform 180ms ease;
        "
      >
        <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 24px; border-bottom:1px solid #eceff3; background:#ffffff;">
          <div>
            <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#1d4ed8; margin-bottom:4px;">AI Hub</div>
            <h2 id="ai-hub-events-title" style="margin:0; font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:26px; line-height:1.12; color:#000000;">Edit Calendar</h2>
            <div style="font-size:12px; color:#6b7280; margin-top:5px;">Loaded from /courses/${U()}/pages/${L}</div>
          </div>
          <button type="button" data-action="close-popup" aria-label="Close" style="width:38px; height:38px; border:1px solid #d8dde5; border-radius:50%; background:#ffffff; cursor:pointer; font-size:21px; line-height:1; color:#111827;">&times;</button>
        </div>

        <div style="padding:24px;">
          <div style="display:grid; grid-template-columns:minmax(360px, 1.6fr) minmax(300px, 0.9fr); gap:22px; align-items:start;">
            <section style="border:1px solid #eceff3; border-radius:18px; background:#ffffff; padding:22px; box-shadow:0 16px 36px rgba(15,23,42,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px;">
                <div>
                  <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#1d4ed8; margin-bottom:5px;">Event date</div>
                  <h3 data-calendar-title style="margin:0; font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:24px; line-height:1.12; color:#000000;"></h3>
                  <div data-selected-date-output style="font-size:12px; color:#6b7280; margin-top:8px;">No date selected</div>
                </div>
                <div style="display:flex; gap:8px;">
                  <button type="button" data-action="previous-month" aria-label="Previous month" style="width:36px; height:36px; border:1px solid #d8dde5; background:#ffffff; border-radius:50%; cursor:pointer; color:#111827; font-size:16px; line-height:1;">&lt;</button>
                  <button type="button" data-action="next-month" aria-label="Next month" style="width:36px; height:36px; border:1px solid #d8dde5; background:#ffffff; border-radius:50%; cursor:pointer; color:#111827; font-size:16px; line-height:1;">&gt;</button>
                </div>
              </div>
              <div data-calendar-grid style="display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); gap:8px; max-width:620px; margin:0 auto;"></div>
            </section>

            <section style="border:1px solid #eceff3; border-radius:18px; background:#ffffff; padding:22px; box-shadow:0 16px 36px rgba(15,23,42,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:18px;">
                <div>
                  <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#1d4ed8; margin-bottom:5px;">Event details</div>
                  <h3 data-ai-hub-event-form-title style="margin:0; font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:22px; line-height:1.12; color:#000000;">Add Event</h3>
                </div>
                <button type="button" data-action="clear-event-form" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:8px 12px; cursor:pointer; font-size:13px;">New</button>
              </div>

              <form data-ai-hub-events-form>
                <input name="id" type="hidden" />
                <div style="display:grid; grid-template-columns:1fr; gap:14px;">
                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Title</span>
                      <span data-title-count style="font-size:11px; color:#6b7280;">0 / ${K}</span>
                    </span>
                    <input name="title" type="text" maxlength="${K}" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                  </label>

                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                      Date
                      <input name="event_date" type="date" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:11px 12px; font-size:14px; background:#fbfbfc; color:#111827;" />
                    </label>

                    <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                      Time
                      <input name="start_time" type="time" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:11px 12px; font-size:14px; background:#fbfbfc; color:#111827;" />
                    </label>
                  </div>

                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                      Location Type
                      <select name="location_type" style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;">
                        <option value="online">Online</option>
                        <option value="room">Room</option>
                      </select>
                    </label>

                    <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                      Status
                      <select name="status" style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;">
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                      </select>
                    </label>
                  </div>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Location
                    <input name="location_label" type="text" placeholder="Online (Zoom) or Room 101" style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Booking Link
                    <input name="booking_url" type="text" placeholder="https://..." style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                  </label>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px; padding-top:18px; margin-top:18px; border-top:1px solid #eceff3;">
                  <button type="button" data-action="close-popup" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:10px 16px; cursor:pointer; font-size:14px;">Close</button>
                  <button type="submit" style="border:1px solid #1d4ed8; background:#1d4ed8; color:#ffffff; border-radius:999px; padding:10px 18px; cursor:pointer; font-size:14px;">Save Event</button>
                </div>
              </form>
            </section>
          </div>

          <section style="margin-top:18px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px;">
              <div>
                <h3 style="margin:0; font-size:16px; color:#111827;">Event Cards</h3>
                <div data-ai-hub-events-help style="font-size:12px; color:#6b7280; margin-top:3px;">Active cards save in date and time order.</div>
              </div>
              <button type="button" data-action="refresh-events" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:7px 10px; cursor:pointer;">Refresh</button>
            </div>
            <div data-ai-hub-events-tabs style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
              <button type="button" data-action="set-events-list-view" data-view="active" style="border:1px solid #111827; background:#111827; color:#ffffff; border-radius:6px; padding:7px 11px; cursor:pointer;">Active</button>
              <button type="button" data-action="set-events-list-view" data-view="archive" style="border:1px solid #cbd5e1; background:#ffffff; color:#111827; border-radius:6px; padding:7px 11px; cursor:pointer;">Archive</button>
            </div>
            <div data-ai-hub-events-list style="display:grid; grid-template-columns:repeat(auto-fill, 240px); gap:16px; justify-content:start;">
              <div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading events...</div>
            </div>
          </section>

          <div data-ai-hub-event-output style="display:none; margin-top:14px; border:1px solid #d1d5db; border-radius:6px; background:#f9fafb; padding:10px; font-size:13px; white-space:pre-wrap;"></div>
        </div>
      </div>
    `;let t=e.querySelector("[data-ai-hub-events-form]"),n=e.querySelector("[data-ai-hub-events-list]"),o=e.querySelector("[data-calendar-title]"),r=e.querySelector("[data-calendar-grid]"),a=e.querySelector("[data-ai-hub-event-output]"),l=e.querySelector("[data-ai-hub-event-form-title]"),c=e.querySelector("[data-ai-hub-events-tabs]"),h=e.querySelector("[data-ai-hub-events-help]"),S=e.querySelector("[data-selected-date-output]"),k=e.querySelector("[data-title-count]"),w=new Date,D="active",O=!1;function C(i,s){a.style.display="block",a.style.borderColor=s?"#fca5a5":"#d1d5db",a.style.background=s?"#fef2f2":"#f9fafb",a.textContent=i}function u(){let i=t.elements.title.value.length;k.textContent=`${i} / ${K}`,k.style.color=i>=K?"#1d4ed8":"#6b7280"}function x(){t.reset(),t.elements.id.value="",l.textContent="Add Event",a.style.display="none",u()}function H(i){t.elements.id.value=i.id||"",t.elements.title.value=I(i.title,K),t.elements.event_date.value=i.event_date||"",t.elements.start_time.value=i.start_time||"",t.elements.location_type.value=i.location_type||"online",t.elements.status.value=i.status||"active",t.elements.location_label.value=i.location_label||"",t.elements.booking_url.value=i.booking_url||"",l.textContent="Edit Event",a.style.display="none",u(),i.event_date&&(w=y(i.event_date)||w)}function y(i){let s=String(i||"").split("-").map(Number);return s.length!==3||s.some(f=>!f)?null:new Date(s[0],s[1]-1,s[2])}function d(i){let s=i.getFullYear(),f=String(i.getMonth()+1).padStart(2,"0"),p=String(i.getDate()).padStart(2,"0");return`${s}-${f}-${p}`}function g(i){return i.toLocaleDateString(void 0,{month:"long",year:"numeric"})}function $(i){let s=y(i);return s?s.toLocaleDateString(void 0,{weekday:"long",month:"long",day:"numeric",year:"numeric"}):"No date selected"}function z(i){return i.filter(s=>s.event_date&&s.status!=="archived")}function E(i){let s=se(z(i))[0];return s?y(s.event_date):null}function q(i){let s=y(i);return s?s.toLocaleDateString(void 0,{month:"short"}).toUpperCase():""}function Mt(i){let s=y(i);return s?String(s.getDate()).padStart(2,"0"):""}function Xe(i){let s=y(i.event_date),f=s?s.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"}):"Date TBD",p=Qn(i.start_time);return p?`${f} &middot; ${p}`:f}function Qn(i){let s=String(i||"").split(":").map(Number);if(s.length<2||Number.isNaN(s[0])||Number.isNaN(s[1]))return"";let f=s[0]>=12?"PM":"AM",p=s[0]%12||12,v=String(s[1]).padStart(2,"0");return`${p}:${v} ${f}`}function ne(i){let s=t.elements.event_date.value,f=y(s);f&&!O?(w=f,O=!0):O||(w=E(i)||w,O=!0);let p=w.getFullYear(),v=w.getMonth(),N={};i.forEach(M=>{!M.event_date||M.status==="archived"||(N[M.event_date]=(N[M.event_date]||0)+1)}),o.textContent=g(w),S.textContent=$(s);let Ze=new Date(p,v,1),Ce=new Date(p,v,1-Ze.getDay()),le=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(M=>`
        <div style="font-size:11px; color:#8a94a6; text-align:center; font-weight:bold; padding:6px 0; text-transform:uppercase;">${M}</div>
      `),no=d(new Date);for(let M=0;M<42;M++){let Ie=new Date(Ce);Ie.setDate(Ce.getDate()+M);let ce=d(Ie),Ft=Ie.getMonth()===v,pe=ce===s,Wt=ce===no,Gt=(N[ce]||0)>0,oo=Gt?"Has active events":"No active events",Jt=`${$(ce)}, ${oo}`;le.push(`
          <button
            type="button"
            data-action="select-calendar-date"
            data-date="${ce}"
            aria-label="${_(Jt)}"
            title="${_(Jt)}"
            style="
              min-height: 58px;
              border: 0;
              border-radius: 14px;
              background: transparent;
              color: ${Ft?"#111827":"#c2c8d2"};
              cursor: pointer;
              padding: 4px 3px;
              text-align: center;
            "
          >
            <span style="
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: ${pe||Wt?"bold":"normal"};
              color: ${pe?"#ffffff":Ft?"#111827":"#c2c8d2"};
              background: ${pe?"#1d4ed8":"#ffffff"};
              border: 1px solid ${pe||Wt?"#1d4ed8":"transparent"};
              box-shadow: ${pe?"0 10px 22px rgba(178,11,15,0.24)":"none"};
            ">${Ie.getDate()}</span>
            ${Gt?'<span aria-hidden="true" style="display:block; width:6px; height:6px; border-radius:50%; background:#1d4ed8; margin:5px auto 0;"></span>':'<span aria-hidden="true" style="display:block; width:6px; height:6px; margin:5px auto 0;"></span>'}
          </button>
        `)}r.innerHTML=le.join("")}function eo(i){let s=i.filter(p=>p.status!=="archived").length,f=i.filter(p=>p.status==="archived").length;c.querySelectorAll("[data-view]").forEach(p=>{let v=p.getAttribute("data-view"),N=v===D;p.textContent=v==="archive"?`Archive (${f})`:`Active (${s})`,p.style.borderColor=N?"#111827":"#cbd5e1",p.style.background=N?"#111827":"#ffffff",p.style.color=N?"#ffffff":"#111827"}),h.textContent=D==="archive"?"Archived cards are hidden from the hub page. You can edit, unarchive, or delete them here.":"Active cards save in date and time order."}function to(i){let s=se(i),f=s.filter(p=>D==="archive"?p.status==="archived":p.status!=="archived");if(eo(s),!f.length){let p=D==="archive"?"No archived events yet.":"No active events yet.";n.innerHTML=`<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">${p}</div>`;return}n.innerHTML=f.map(p=>{let v=p.status==="archived",N=v?"Archived":"Active",Ze=v?"Unarchive":"Archive",Ce=q(p.event_date)||"TBD",Bt=Mt(p.event_date)||"--",le=!1;return`
          <div data-event-card data-event-id="${_(p.id)}" draggable="${le?"true":"false"}" style="cursor:${le?"grab":"default"};">
            <div style="background:#ffffff; border-radius:14px; padding:18px; display:flex; flex-direction:column; border:1px solid #e6e8ec; min-height:220px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                <div style="display:inline-block; align-self:flex-start; border-radius:8px; padding:6px 12px; text-align:center; line-height:1.1; margin-bottom:14px; border:1px solid #e6e8ec;">
                  <div style="font-size:11px; color:#1d4ed8;">${b(Ce)}</div>
                  <div style="font-size:22px; color:#000000;">${b(Bt)}</div>
                </div>
                <span style="font-size:11px; border:1px solid ${v?"#d1d5db":"#bbf7d0"}; background:${v?"#f3f4f6":"#f0fdf4"}; color:${v?"#374151":"#166534"}; border-radius:999px; padding:3px 7px;">${N}</span>
              </div>
              <h3 style="margin:0 0 12px; font-size:16px; color:#000000; line-height:1.25;">${b(p.title||"Untitled Event")}</h3>
              <div style="font-size:13px; color:#6b7280; margin-bottom:4px;">Time: ${Xe(p)}</div>
              <div style="font-size:13px; color:#6b7280; margin-bottom:18px;">Location: ${b(p.location_label||"No location")}</div>
              <a style="margin-top:auto; display:block; text-align:center; background:#000000; color:#ffffff; text-decoration:none; font-size:14px; padding:10px; border-radius:8px; border:1.5px solid #000000;" href="${_(p.booking_url||"#")}" target="_blank" rel="noopener">Register</a>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
              <button type="button" data-action="edit-event" data-event-id="${_(p.id)}" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:5px 8px; cursor:pointer;">Edit</button>
              <button type="button" data-action="toggle-event-status" data-event-id="${_(p.id)}" data-next-status="${v?"active":"archived"}" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:5px 8px; cursor:pointer;">${Ze}</button>
              <button type="button" data-action="delete-event" data-event-id="${_(p.id)}" style="border:1px solid #fecaca; background:#fff1f2; color:#991b1b; border-radius:6px; padding:5px 8px; cursor:pointer;">Delete</button>
            </div>
          </div>
        `}).join("")}async function J(){n.innerHTML='<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading events...</div>';let i=m(await A());return to(i.events),ne(i.events),i.events}e.addEventListener("click",async i=>{let s=i.target.closest("[data-action]"),f=s==null?void 0:s.getAttribute("data-action");if(i.target===e||f==="close-popup"){te();return}if(f)try{if(f==="set-events-list-view"&&(D=s.getAttribute("data-view")==="archive"?"archive":"active",await J()),f==="clear-event-form"&&(x(),ne(m(await A()).events)),(f==="previous-month"||f==="next-month")&&(w=new Date(w.getFullYear(),w.getMonth()+(f==="next-month"?1:-1),1),ne(m(await A()).events)),f==="select-calendar-date"&&(t.elements.event_date.value=s.getAttribute("data-date"),w=y(t.elements.event_date.value)||w,ne(m(await A()).events)),f==="refresh-events"&&(await J(),C("Events refreshed.",!1)),f==="edit-event"){let p=m(await A()),v=p.events.find(N=>N.id===s.getAttribute("data-event-id"));v&&(H(v),ne(p.events))}if(f==="delete-event"){if(!window.confirm("Delete this event?"))return;await Tt(s.getAttribute("data-event-id")),x(),await J(),C("Event deleted.",!1)}f==="toggle-event-status"&&(await Lt(s.getAttribute("data-event-id"),s.getAttribute("data-next-status")),await J(),C("Event status updated.",!1))}catch(p){console.error(p),C(`Action failed:
`+p.message,!0)}}),t.addEventListener("submit",async i=>{i.preventDefault();let s=t.querySelector("button[type='submit']"),f=new FormData(t),p=Object.fromEntries(f.entries());try{s.disabled=!0,s.textContent="Saving...";let v=await Ke(p.id||null,p);console.log("AI Hub event saved to JSON page and visible hub page:",v),x(),await J(),C("Event saved to JSON and hub page.",!1)}catch(v){console.error(v),C(`Save failed:
`+v.message,!0)}finally{s.disabled=!1,s.textContent="Save Event"}}),t.elements.event_date.addEventListener("change",async()=>{w=y(t.elements.event_date.value)||w;try{ne(m(await A()).events)}catch(i){console.error(i),C(`Calendar refresh failed:
`+i.message,!0)}}),t.elements.title.addEventListener("input",u),u(),n.addEventListener("dragstart",i=>{if(D!=="active")return;let s=i.target.closest("[data-event-card]");s&&(s.style.opacity="0.45",s.setAttribute("data-dragging","true"),i.dataTransfer.effectAllowed="move",i.dataTransfer.setData("text/plain",s.getAttribute("data-event-id")))}),n.addEventListener("dragend",i=>{let s=i.target.closest("[data-event-card]");s&&(s.style.opacity="",s.removeAttribute("data-dragging"))}),n.addEventListener("dragover",i=>{if(D!=="active")return;let s=n.querySelector("[data-dragging='true']"),f=i.target.closest("[data-event-card]");if(!s||!f||s===f)return;i.preventDefault();let p=f.getBoundingClientRect(),v=i.clientY>p.top+p.height/2;n.insertBefore(s,v?f.nextSibling:f)}),n.addEventListener("drop",async i=>{if(D!=="active")return;i.preventDefault();let s=Array.from(n.querySelectorAll("[data-event-card]")).map(f=>f.getAttribute("data-event-id")).filter(Boolean);try{await zt(s),await J(),C("Event order saved.",!1)}catch(f){console.error(f),C(`Reorder failed:
`+f.message,!0)}}),document.body.appendChild(e),J().catch(i=>{console.error(i),C(`Could not load events:
`+i.message,!0)}),window.requestAnimationFrame(()=>{let i=document.getElementById(W);e.style.opacity="1",e.style.background="rgba(0,0,0,0.38)",i&&(i.style.opacity="1",i.style.transform="translateY(0) scale(1)")})}function Vn(){te();let e=document.createElement("div");e.id=be,e.style.cssText=["position:fixed","inset:0","z-index:999999","display:flex","align-items:center","justify-content:center","padding:24px","background:rgba(0,0,0,0)","opacity:0","transition:opacity 180ms ease, background 180ms ease"].join(";"),e.innerHTML=`
      <div
        id="${W}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-hub-courses-title"
        style="
          width: min(1160px, 100%);
          max-height: min(860px, calc(100vh - 48px));
          overflow: auto;
          background: #fbfbfc;
          color: #111827;
          border: 1px solid #e6e8ec;
          border-radius: 18px;
          box-shadow: 0 28px 80px rgba(0,0,0,0.24);
          font-family: 'Inter','Segoe UI',Roboto,Arial,sans-serif;
          opacity: 0;
          transform: translateY(18px) scale(0.98);
          transition: opacity 180ms ease, transform 180ms ease;
        "
      >
        <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 24px; border-bottom:1px solid #eceff3; background:#ffffff;">
          <div>
            <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#1d4ed8; margin-bottom:4px;">AI Hub</div>
            <h2 id="ai-hub-courses-title" style="margin:0; font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:26px; line-height:1.12; color:#000000;">Edit Courses</h2>
            <div style="font-size:12px; color:#6b7280; margin-top:5px;">Loaded from /courses/${U()}/pages/${L}</div>
          </div>
          <button type="button" data-action="close-popup" aria-label="Close" style="width:38px; height:38px; border:1px solid #d8dde5; border-radius:50%; background:#ffffff; cursor:pointer; font-size:21px; line-height:1; color:#111827;">&times;</button>
        </div>

        <div style="padding:24px;">
          <div style="display:grid; grid-template-columns:minmax(320px, 380px) minmax(0, 1fr); gap:28px; align-items:start;">
            <section style="border:1px solid #eceff3; border-radius:18px; background:#ffffff; padding:22px 26px 22px 22px; box-shadow:0 16px 36px rgba(15,23,42,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:18px;">
                <div>
                  <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#1d4ed8; margin-bottom:5px;">Course details</div>
                  <h3 data-ai-hub-course-form-title style="margin:0; font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:22px; line-height:1.12; color:#000000;">Add Course</h3>
                </div>
                <button type="button" data-action="clear-course-form" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:8px 12px; cursor:pointer; font-size:13px;">New</button>
              </div>

              <form data-ai-hub-courses-form>
                <input name="id" type="hidden" />

                <div style="display:grid; grid-template-columns:1fr; gap:14px;">
                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Icon
                    <span style="display:flex; align-items:center; gap:10px;">
                      <input name="icon" type="text" maxlength="16" value="${_(ye)}" title="Windows: Win + ; or Win + . | Mac: Control + Command + Space" aria-label="Course icon emoji" style="box-sizing:border-box; width:86px; border:1px solid #d8dde5; border-radius:12px; padding:10px 12px; font-size:22px; line-height:1; background:#fbfbfc; color:#111827; text-align:center;" />
                      <span style="font-size:11px; color:#6b7280; line-height:1.7;">
                        Windows: <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Win + ;</span> or <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Win + .</span><br />
                        Mac: <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Control + Command + Space</span>
                      </span>
                    </span>
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Title</span>
                      <span data-course-title-count style="font-size:11px; color:#6b7280;">0 / ${Y}</span>
                    </span>
                    <input name="title" type="text" maxlength="${Y}" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Description</span>
                      <span data-course-description-count style="font-size:11px; color:#6b7280;">0 / ${V}</span>
                    </span>
                    <textarea name="description" maxlength="${V}" rows="3" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827; resize:vertical;"></textarea>
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Format
                    <select name="format" style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;">
                      <option value="self_paced">Self-Paced</option>
                      <option value="in_person">In Person</option>
                    </select>
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Course Link
                    <input name="course_url" type="text" placeholder="https://..." required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                  </label>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px; padding-top:18px; margin-top:18px; border-top:1px solid #eceff3;">
                  <button type="button" data-action="close-popup" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:10px 16px; cursor:pointer; font-size:14px;">Close</button>
                  <button type="submit" style="border:1px solid #1d4ed8; background:#1d4ed8; color:#ffffff; border-radius:999px; padding:10px 18px; cursor:pointer; font-size:14px;">Save Course</button>
                </div>
              </form>
            </section>

            <section>
              <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px;">
                <div>
                  <h3 style="margin:0; font-size:16px; color:#111827;">Course Cards</h3>
                  <div style="font-size:12px; color:#6b7280; margin-top:3px;">Cards save to JSON and refresh the hub page.</div>
                </div>
                <button type="button" data-action="refresh-courses" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:7px 10px; cursor:pointer;">Refresh</button>
              </div>

              <div data-ai-hub-courses-list style="display:grid; grid-template-columns:repeat(auto-fill, 220px); gap:16px; justify-content:start; max-width:692px;">
                <div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading courses...</div>
              </div>
            </section>
          </div>

          <div data-ai-hub-course-output style="display:none; margin-top:14px; border:1px solid #d1d5db; border-radius:6px; background:#f9fafb; padding:10px; font-size:13px; white-space:pre-wrap;"></div>
        </div>
      </div>
    `;let t=e.querySelector("[data-ai-hub-courses-form]"),n=e.querySelector("[data-ai-hub-courses-list]"),o=e.querySelector("[data-ai-hub-course-output]"),r=e.querySelector("[data-ai-hub-course-form-title]"),a=e.querySelector("[data-course-title-count]"),l=e.querySelector("[data-course-description-count]");function c(u,x){o.style.display="block",o.style.borderColor=x?"#fca5a5":"#d1d5db",o.style.background=x?"#fef2f2":"#f9fafb",o.textContent=u}function h(){let u=t.elements.title.value.length,x=t.elements.description.value.length;a.textContent=`${u} / ${Y}`,l.textContent=`${x} / ${V}`,a.style.color=u>=Y?"#1d4ed8":"#6b7280",l.style.color=x>=V?"#1d4ed8":"#6b7280"}function S(u){let x=Ae(t.elements.icon.value);t.elements.icon.value=x||(u?ye:"")}function k(){t.reset(),t.elements.id.value="",r.textContent="Add Course",o.style.display="none",t.elements.icon.value=ye,h()}function w(u){t.elements.id.value=u.id||"",t.elements.title.value=I(u.title,Y),t.elements.description.value=I(u.description,V),t.elements.format.value=u.format==="in_person"?"in_person":"self_paced",t.elements.course_url.value=u.course_url||"",t.elements.icon.value=Me(u),r.textContent="Edit Course",o.style.display="none",h()}function D(u){let x=Me(u),H=u.title||"Untitled Course",y=u.description||"",d=lt(u.format);return`
        <div data-course-card data-course-id="${_(u.id)}">
          <div style="background:#ffffff; border-radius:14px; padding:18px; text-align:center; border:1px solid #e6e8ec; min-height:220px; display:flex; flex-direction:column;">
            <div style="width:52px; height:52px; border-radius:50%; background:#eeeeef; margin:0 auto 14px; display:flex; align-items:center; justify-content:center; font-size:23px;" aria-hidden="true">${b(x)}</div>
            <h3 style="margin:0 0 8px; font-size:16px; line-height:1.25; color:#000000;">${b(H)}</h3>
            <div style="font-size:13px; color:#6b7280; margin-bottom:12px;">${b(y)}</div>
            <div style="font-size:12px; color:#1d4ed8; margin-top:auto;">${b(d)}</div>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
            <button type="button" data-action="edit-course" data-course-id="${_(u.id)}" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:5px 8px; cursor:pointer;">Edit</button>
            <button type="button" data-action="delete-course" data-course-id="${_(u.id)}" style="border:1px solid #fecaca; background:#fff1f2; color:#991b1b; border-radius:6px; padding:5px 8px; cursor:pointer;">Delete</button>
          </div>
        </div>
      `}function O(u){let x=F(u);if(!x.length){n.innerHTML='<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">No courses yet.</div>';return}n.innerHTML=x.map(D).join("")}async function C(){n.innerHTML='<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading courses...</div>';let u=m(await A());return O(u.courses),u.courses}e.addEventListener("click",async u=>{let x=u.target.closest("[data-action]"),H=x==null?void 0:x.getAttribute("data-action");if(u.target===e||H==="close-popup"){te();return}if(H)try{if(H==="clear-course-form"&&k(),H==="refresh-courses"&&(await C(),c("Courses refreshed.",!1)),H==="edit-course"){let d=m(await A()).courses.find(g=>g.id===x.getAttribute("data-course-id"));d&&w(d)}if(H==="delete-course"){if(!window.confirm("Delete this course card?"))return;await Pt(x.getAttribute("data-course-id")),k(),await C(),c("Course deleted.",!1)}}catch(y){console.error(y),c(`Action failed:
`+y.message,!0)}}),t.addEventListener("submit",async u=>{u.preventDefault();let x=t.querySelector("button[type='submit']"),H=new FormData(t),y=Object.fromEntries(H.entries());try{x.disabled=!0,x.textContent="Saving...";let d=await Ye(y.id||null,y);console.log("AI Hub course saved to JSON page and visible hub page:",d),k(),await C(),c("Course saved to JSON and hub page.",!1)}catch(d){console.error(d),c(`Save failed:
`+d.message,!0)}finally{x.disabled=!1,x.textContent="Save Course"}}),t.elements.title.addEventListener("input",h),t.elements.description.addEventListener("input",h),t.elements.icon.addEventListener("input",()=>S(!1)),t.elements.icon.addEventListener("blur",()=>S(!0)),t.elements.icon.addEventListener("focus",()=>t.elements.icon.select()),t.elements.icon.addEventListener("click",()=>t.elements.icon.select()),h(),document.body.appendChild(e),C().catch(u=>{console.error(u),c(`Could not load courses:
`+u.message,!0)}),window.requestAnimationFrame(()=>{let u=document.getElementById(W);e.style.opacity="1",e.style.background="rgba(0,0,0,0.38)",u&&(u.style.opacity="1",u.style.transform="translateY(0) scale(1)")})}function Xn(){te();let e=document.createElement("div");e.id=be,e.style.cssText=["position:fixed","inset:0","z-index:999999","display:flex","align-items:center","justify-content:center","padding:24px","background:rgba(0,0,0,0)","opacity:0","transition:opacity 180ms ease, background 180ms ease"].join(";"),e.innerHTML=`
      <div
        id="${W}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-hub-resources-title"
        style="
          width: min(1160px, 100%);
          max-height: min(860px, calc(100vh - 48px));
          overflow: auto;
          background: #fbfbfc;
          color: #111827;
          border: 1px solid #e6e8ec;
          border-radius: 18px;
          box-shadow: 0 28px 80px rgba(0,0,0,0.24);
          font-family: 'Inter','Segoe UI',Roboto,Arial,sans-serif;
          opacity: 0;
          transform: translateY(18px) scale(0.98);
          transition: opacity 180ms ease, transform 180ms ease;
        "
      >
        <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 24px; border-bottom:1px solid #eceff3; background:#ffffff;">
          <div>
            <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#1d4ed8; margin-bottom:4px;">AI Hub</div>
            <h2 id="ai-hub-resources-title" style="margin:0; font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:26px; line-height:1.12; color:#000000;">Edit Resources</h2>
            <div style="font-size:12px; color:#6b7280; margin-top:5px;">Loaded from /courses/${U()}/pages/${L}</div>
          </div>
          <button type="button" data-action="close-popup" aria-label="Close" style="width:38px; height:38px; border:1px solid #d8dde5; border-radius:50%; background:#ffffff; cursor:pointer; font-size:21px; line-height:1; color:#111827;">&times;</button>
        </div>

        <div style="padding:24px;">
          <div style="display:grid; grid-template-columns:minmax(320px, 380px) minmax(0, 1fr); gap:28px; align-items:start;">
            <section style="border:1px solid #eceff3; border-radius:18px; background:#ffffff; padding:22px 26px 22px 22px; box-shadow:0 16px 36px rgba(15,23,42,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:18px;">
                <div>
                  <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#1d4ed8; margin-bottom:5px;">Resource details</div>
                  <h3 data-ai-hub-resource-form-title style="margin:0; font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:22px; line-height:1.12; color:#000000;">Add Resource</h3>
                </div>
                <button type="button" data-action="clear-resource-form" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:8px 12px; cursor:pointer; font-size:13px;">New</button>
              </div>

              <form data-ai-hub-resources-form>
                <input name="id" type="hidden" />

                <div style="display:grid; grid-template-columns:1fr; gap:14px;">
                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Icon
                    <span style="display:flex; align-items:center; gap:10px;">
                      <input name="icon" type="text" maxlength="16" value="${_(me)}" title="Windows: Win + ; or Win + . | Mac: Control + Command + Space" aria-label="Resource icon emoji" style="box-sizing:border-box; width:86px; border:1px solid #d8dde5; border-radius:12px; padding:10px 12px; font-size:22px; line-height:1; background:#fbfbfc; color:#111827; text-align:center;" />
                      <span style="font-size:11px; color:#6b7280; line-height:1.7;">
                        Windows: <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Win + ;</span> or <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Win + .</span><br />
                        Mac: <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Control + Command + Space</span>
                      </span>
                    </span>
                  </label>

                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                      Category
                      <input name="category" type="text" maxlength="${oe}" placeholder="Prompting" style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                    </label>

                    <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                      Detail
                      <input name="detail" type="text" maxlength="${re}" placeholder="10 min" style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                    </label>
                  </div>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Title</span>
                      <span data-resource-title-count style="font-size:11px; color:#6b7280;">0 / ${X}</span>
                    </span>
                    <input name="title" type="text" maxlength="${X}" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Brief Description</span>
                      <span data-resource-description-count style="font-size:11px; color:#6b7280;">0 / ${Z}</span>
                    </span>
                    <textarea name="description" maxlength="${Z}" rows="3" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827; resize:vertical;"></textarea>
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Action
                    <select name="action_type" style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;">
                      <option value="canvas_page">Canvas Page</option>
                      <option value="download">Download</option>
                      <option value="external_link">External Link</option>
                    </select>
                  </label>

                  <label data-resource-url-wrap style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span data-resource-url-label>Download Link</span>
                    <input name="resource_url" type="text" placeholder="https://..." style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                    <span data-resource-url-help style="font-size:11px; color:#6b7280; line-height:1.35;">Required for downloads. The card will link directly to this URL.</span>
                  </label>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px; padding-top:18px; margin-top:18px; border-top:1px solid #eceff3;">
                  <button type="button" data-action="close-popup" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:10px 16px; cursor:pointer; font-size:14px;">Close</button>
                  <button type="submit" style="border:1px solid #1d4ed8; background:#1d4ed8; color:#ffffff; border-radius:999px; padding:10px 18px; cursor:pointer; font-size:14px;">Save Resource</button>
                </div>
              </form>
            </section>

            <section>
              <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px;">
                <div>
                  <h3 style="margin:0; font-size:16px; color:#111827;">Resource Cards</h3>
                  <div style="font-size:12px; color:#6b7280; margin-top:3px;">Canvas Page creates a Canvas page before saving.</div>
                </div>
                <button type="button" data-action="refresh-resources" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:7px 10px; cursor:pointer;">Refresh</button>
              </div>

              <div data-ai-hub-resources-list style="display:grid; grid-template-columns:repeat(auto-fill, 220px); gap:16px; justify-content:start; max-width:692px;">
                <div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading resources...</div>
              </div>
            </section>
          </div>

          <div data-ai-hub-resource-output style="display:none; margin-top:14px; border:1px solid #d1d5db; border-radius:6px; background:#f9fafb; padding:10px; font-size:13px; white-space:pre-wrap;"></div>
        </div>
      </div>
    `;let t=e.querySelector("[data-ai-hub-resources-form]"),n=e.querySelector("[data-ai-hub-resources-list]"),o=e.querySelector("[data-ai-hub-resource-output]"),r=e.querySelector("[data-ai-hub-resource-form-title]"),a=e.querySelector("[data-resource-title-count]"),l=e.querySelector("[data-resource-description-count]"),c=e.querySelector("[data-resource-url-wrap]"),h=e.querySelector("[data-resource-url-label]"),S=e.querySelector("[data-resource-url-help]");function k(d,g){o.style.display="block",o.style.borderColor=g?"#fca5a5":"#d1d5db",o.style.background=g?"#fef2f2":"#f9fafb",o.textContent=d}function w(){let d=t.elements.title.value.length,g=t.elements.description.value.length;a.textContent=`${d} / ${X}`,l.textContent=`${g} / ${Z}`,a.style.color=d>=X?"#1d4ed8":"#6b7280",l.style.color=g>=Z?"#1d4ed8":"#6b7280"}function D(d){let g=Ae(t.elements.icon.value);t.elements.icon.value=g||(d?me:"")}function O(){let d=t.elements.action_type.value,g=d==="canvas_page";if(c.style.display=g?"none":"flex",t.elements.resource_url.required=!g,g){t.elements.resource_url.value="";return}h.textContent=d==="external_link"?"External Link":"Download Link",S.textContent=d==="external_link"?"Required for External Link. The card will show View Resource.":"Required for downloads. The card will link directly to this URL."}function C(){t.reset(),t.elements.id.value="",t.elements.icon.value=me,t.elements.action_type.value="canvas_page",r.textContent="Add Resource",o.style.display="none",O(),w()}function u(d){t.elements.id.value=d.id||"",t.elements.icon.value=Be(d),t.elements.category.value=I(d.category||d.topic,oe),t.elements.detail.value=I(d.detail||d.duration,re),t.elements.title.value=I(d.title,X),t.elements.description.value=I(d.description,Z),t.elements.action_type.value=ee(d),t.elements.resource_url.value=d.resource_url||"",r.textContent="Edit Resource",o.style.display="none",O(),w()}function x(d){let g=Be(d),$=d.title||"Untitled Resource",z=d.description||"",E=pt(d),q=ut(d),Xe=d.page_url&&ee(d)==="canvas_page"?"Canvas page created":q;return`
        <div data-resource-card data-resource-id="${_(d.id)}">
          <div style="display:flex; flex-direction:column; min-height:270px; color:#111827; background:#ffffff; border:1px solid #dbe3f0; border-radius:14px; overflow:hidden;">
            <div style="display:flex; align-items:center; justify-content:center; width:100%; height:96px; background:#eff6ff; color:#1d4ed8; font-size:40px; line-height:1; border-bottom:1px solid #dbe3f0;" aria-hidden="true">${b(g)}</div>
            <span style="display:block; padding:14px 16px 0; font-size:12px; color:#1d4ed8; text-transform:uppercase; font-weight:bold;">${E}</span>
            <strong style="display:block; padding:8px 16px 0; font-size:18px; line-height:1.2; color:#000000;">${b($)}</strong>
            <span style="display:block; padding:8px 16px 0; font-size:14px; color:#4b5563;">${b(z)}</span>
            <div style="display:block; margin-top:auto; padding:16px; color:#1d4ed8; font-size:14px; font-weight:bold;">${b(Xe)} <span aria-hidden="true">&rarr;</span></div>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
            <button type="button" data-action="edit-resource" data-resource-id="${_(d.id)}" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:5px 8px; cursor:pointer;">Edit</button>
            <button type="button" data-action="delete-resource" data-resource-id="${_(d.id)}" style="border:1px solid #fecaca; background:#fff1f2; color:#991b1b; border-radius:6px; padding:5px 8px; cursor:pointer;">Delete</button>
          </div>
        </div>
      `}function H(d){let g=F(d);if(!g.length){n.innerHTML='<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">No resources yet.</div>';return}n.innerHTML=g.map(x).join("")}async function y(){n.innerHTML='<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading resources...</div>';let d=m(await A());return H(d.resources),d.resources}e.addEventListener("click",async d=>{let g=d.target.closest("[data-action]"),$=g==null?void 0:g.getAttribute("data-action");if(d.target===e||$==="close-popup"){te();return}if($)try{if($==="clear-resource-form"&&C(),$==="refresh-resources"&&(await y(),k("Resources refreshed.",!1)),$==="edit-resource"){let E=m(await A()).resources.find(q=>q.id===g.getAttribute("data-resource-id"));E&&u(E)}if($==="delete-resource"){if(!window.confirm("Delete this resource card? The linked Canvas page will be kept and unpublished."))return;let E=await Ot(g.getAttribute("data-resource-id"));C(),await y(),E.page_unpublish_warning?k(`Resource card deleted, but linked page could not be unpublished:
`+E.page_unpublish_warning,!0):E.page_unpublished?k("Resource card deleted. Linked Canvas page was unpublished.",!1):k("Resource deleted.",!1)}}catch(z){if(console.error(z),$==="delete-resource")try{C(),await y()}catch(E){console.error(E)}k(`Action failed:
`+z.message,!0)}}),t.addEventListener("submit",async d=>{d.preventDefault();let g=t.querySelector("button[type='submit']"),$=new FormData(t),z=Object.fromEntries($.entries());if(z.action_type!=="canvas_page"&&!z.resource_url.trim()){k((z.action_type==="external_link"?"External Link":"Download")+" resources need a link.",!0);return}try{g.disabled=!0,g.textContent=z.action_type==="canvas_page"?"Creating page...":"Saving...";let E=await Ve(z.id||null,z);if(console.log("AI Hub resource saved to JSON page and visible hub page:",E),E.module_item_warning){await y(),k(`Resource saved, but module add failed:
`+E.module_item_warning,!0);return}let q=Dn(E);if(E.action_type==="canvas_page"&&q){k("Resource saved. Opening the Canvas page editor...",!1),window.location.assign(q);return}C(),await y(),k("Resource saved to JSON and hub page.",!1)}catch(E){console.error(E);try{await y()}catch(q){console.error(q)}k(`Save failed:
`+E.message,!0)}finally{g.disabled=!1,g.textContent="Save Resource"}}),t.elements.title.addEventListener("input",w),t.elements.description.addEventListener("input",w),t.elements.action_type.addEventListener("change",O),t.elements.icon.addEventListener("input",()=>D(!1)),t.elements.icon.addEventListener("blur",()=>D(!0)),t.elements.icon.addEventListener("focus",()=>t.elements.icon.select()),t.elements.icon.addEventListener("click",()=>t.elements.icon.select()),t.elements.action_type.value="canvas_page",O(),w(),document.body.appendChild(e),y().catch(d=>{console.error(d),k(`Could not load resources:
`+d.message,!0)}),window.requestAnimationFrame(()=>{let d=document.getElementById(W);e.style.opacity="1",e.style.background="rgba(0,0,0,0.38)",d&&(d.style.opacity="1",d.style.transform="translateY(0) scale(1)")})}function Zn(e){if(document.getElementById(ue))return;let t=document.createElement("li");t.id=ue,t.className="section";let n=document.createElement("button");n.type="button",n.textContent="Restore Tabs",n.style.cursor="pointer",n.addEventListener("click",()=>{document.querySelector("#section-tabs li["+fe+"='true']")?(Jn(),Rn(),Kn(),n.textContent="Hide Tabs"):(Nt(),jt(),qt(e),n.textContent="Restore Tabs")}),t.appendChild(n),e.appendChild(t)}if(T.courseId=U(),T.coursePath=on(),T.homePath=He(),T.toolboxPath=Q(),T.coursePath){let e=document.querySelector("#section-tabs");if(T.hasSectionTabs=!!e,!e){T.reason="missing_section_tabs";return}Nt(),jt(),qt(e),Zn(e),He()&&un(document),T.mounted=!0,T.reason="mounted",T.editCalendar=!!document.getElementById("ai-hub-edit-events-link"),T.editResources=!!document.getElementById("ai-hub-edit-resources-link"),T.restoreTabs=!!document.getElementById(ue)}else T.reason="not_ai_hub_course";window.AIHubData={addEventToHubData:Mn,addCourseToHubData:Fn,addResourceToHubData:Gn,createCanvasResourcePage:St,createResourceModule:vt,ensureResourcePageInModule:wt,updateCanvasResourcePage:Et,unpublishCanvasResourcePage:At,deleteCourseFromHubData:Pt,deleteEventFromHubData:Tt,deleteResourceFromHubData:Ot,fetchDataPage:mt,fetchCanvasPage:ie,getDataPageApiUrl:$e,getStarterHubData:Ue,loadHubData:A,moveEventInHubData:qn,replaceEventsSectionInBody:bt,replaceCoursesSectionInBody:gt,replaceResourcesSectionInBody:xt,renderHubPageBody:ft,renderResourcePageBody:Ee,renderToolboxPageBody:Ge,renderCoursesSection:We,renderEventsSection:_e,renderResourcesSection:ke,reorderEventsInHubData:zt,saveCanvasPageBody:Je,saveCourseToHubData:Ye,saveHubData:Se,saveHubDataAndRenderedPage:j,saveEventToHubData:Ke,saveResourceToHubData:Ve,saveRenderedHubPage:Ct,setEventStatusInHubData:Lt,seedCurrentHubPage:On,seedHubDataPage:Un,sortEventsByDate:se}})();})();
