(()=>{window.ISDHubConfig=Object.assign({},window.ISDHubConfig||{},{courseId:"632661"});(function(){let Et=window.ISDHubConfig,St=["Home","People","Announcements"],be="data-isd-hub-edit-tab",kt=[{id:"custom-edit-events-link",label:"Edit Events",editor:"events"},{id:"custom-edit-courses-link",label:"Edit Courses",editor:"courses"},{id:"custom-edit-resources-link",label:"Edit Resources",editor:"resources"}],Ue="isd-hub-badges-link",Oe="data-isd-hub-badges-tab",ge="custom-toggle-tabs-button",oe="data-isd-hub-hidden-tab",F="data-isd-hub-previous-display",je=".header-bar-outer-container",xe="data-isd-hub-hidden-header",ie="isd-hub-editor-backdrop",P="isd-hub-editor-panel",q="json",Pe="isd-hub-json-data",re="data-isd-hub-section",Ct="isd-hub-page-backup",W=40,G=40,K=80,V=40,J=150,ae="\u{1F4C4}",se="\u{1F4DA}",Tt={chart:"\u{1F4CA}",check:"\u2705",checklist:"\u2705",computer:"\u{1F4BB}",desktop:"\u{1F4BB}",document:"\u{1F4DA}",people:"\u{1F465}",play:"\u{1F3AC}",puzzle:"\u{1F9E9}",robot:"\u{1F916}"},At={check:"\u2705",checklist:"\u2705",comment:"\u{1F4AC}",document:"\u{1F4C4}",file:"\u{1F4C4}",guide:"\u{1F9ED}",play:"\u25B6\uFE0F",video:"\u{1F3AC}"},Lt={in_person:"In Person",live_cohort:"Live Cohort",self_paced:"Self-Paced"};function U(){let e=String(Et.courseId||"").trim();if(!e)throw new Error("ISD Hub course id is missing. Set window.ISDHubConfig.courseId before running.");return e}function B(){return"/courses/"+U()}function It(){var n,o;let e=String(((n=window.ENV)==null?void 0:n.COURSE_ID)||"").trim(),t=String(((o=window.ENV)==null?void 0:o.current_user_id)||"").trim();return!e||!t?"":"/courses/"+encodeURIComponent(e)+"/grades/"+encodeURIComponent(t)}function me(){return"/api/v1/courses/"+U()+"/pages/"+encodeURIComponent(q)}function ye(e){return"/api/v1/courses/"+U()+"/pages/"+encodeURIComponent(e)}function zt(){return"/api/v1/courses/"+U()+"/pages"}function qe(){var n,o;let e=(o=(n=window.ENV)==null?void 0:n.WIKI_PAGE)==null?void 0:o.url;if(e)return e;let t=window.location.pathname.match(new RegExp("^/courses/"+U()+"/pages/([^/?#]+)"));return t?decodeURIComponent(t[1]):""}function de(){return{version:1,events:[],courses:[],resources:[]}}function Be(){let e=new Date().toISOString();return{version:1,events:[{id:"evt_learning_objectives",title:"Designing Effective Learning Objectives",event_date:"2025-05-21",start_time:"10:00",location_type:"online",location_label:"Online (Zoom)",booking_url:"REPLACE-WITH-REGISTER-LINK-1",status:"active",sort_order:1,created_at:e,updated_at:e},{id:"evt_canvas_essentials",title:"Canvas Essentials for Instructors",event_date:"2025-05-28",start_time:"14:00",location_type:"online",location_label:"Online (Zoom)",booking_url:"REPLACE-WITH-REGISTER-LINK-2",status:"active",sort_order:2,created_at:e,updated_at:e},{id:"evt_ai_responsibly",title:"Using AI Responsibly in Teaching",event_date:"2025-06-04",start_time:"11:00",location_type:"online",location_label:"Online (Zoom)",booking_url:"REPLACE-WITH-REGISTER-LINK-3",status:"active",sort_order:3,created_at:e,updated_at:e},{id:"evt_assessment_strategies",title:"Assessment Strategies That Work",event_date:"2025-06-11",start_time:"13:00",location_type:"online",location_label:"Online (Zoom)",booking_url:"REPLACE-WITH-REGISTER-LINK-4",status:"active",sort_order:4,created_at:e,updated_at:e}],courses:[{id:"course_instructional_design_foundations",icon_key:"computer",title:"Instructional Design Foundations",description:"The core principles of designing effective learning experiences.",format:"self_paced",course_url:"REPLACE-WITH-COURSE-LINK-1",sort_order:1,created_at:e,updated_at:e},{id:"course_designing_engaging_activities",icon_key:"puzzle",title:"Designing Engaging Activities",description:"Create active learning experiences that stick.",format:"self_paced",course_url:"REPLACE-WITH-COURSE-LINK-2",sort_order:2,created_at:e,updated_at:e},{id:"course_assessment_feedback",icon_key:"chart",title:"Assessment & Feedback",description:"Design assessments that drive learning.",format:"self_paced",course_url:"REPLACE-WITH-COURSE-LINK-3",sort_order:3,created_at:e,updated_at:e},{id:"course_inclusive_course_design",icon_key:"people",title:"Inclusive Course Design",description:"Build accessible and inclusive learning environments.",format:"self_paced",course_url:"REPLACE-WITH-COURSE-LINK-4",sort_order:4,created_at:e,updated_at:e},{id:"course_ai_adoption",icon_key:"robot",title:"AI Adoption",description:"Practical, responsible ways to bring AI into your teaching and workflow.",format:"self_paced",course_url:"REPLACE-WITH-COURSE-LINK-5",sort_order:5,created_at:e,updated_at:e}],resources:[{id:"resource_syllabus_template",icon_key:"document",title:"Syllabus Template",description:"Editable syllabus template aligned to best practices.",resource_url:"REPLACE-WITH-RESOURCE-LINK-1",action_label:"Download",sort_order:1,created_at:e,updated_at:e},{id:"resource_course_design_checklist",icon_key:"checklist",title:"Course Design Checklist",description:"A checklist to guide your course development.",resource_url:"REPLACE-WITH-RESOURCE-LINK-2",action_label:"Download",sort_order:2,created_at:e,updated_at:e},{id:"resource_universal_design_guide",icon_key:"play",title:"Universal Design Guide",description:"Practical tips for designing for all learners.",resource_url:"REPLACE-WITH-RESOURCE-LINK-3",action_label:"View Guide",sort_order:3,created_at:e,updated_at:e},{id:"resource_feedback_strategies",icon_key:"comment",title:"Feedback Strategies",description:"A quick reference for providing meaningful feedback.",resource_url:"REPLACE-WITH-RESOURCE-LINK-4",action_label:"View Resource",sort_order:4,created_at:e,updated_at:e}]}}function le(){var n;let e=(n=document.querySelector("meta[name='csrf-token']"))==null?void 0:n.getAttribute("content");if(e)return e;let t=document.cookie.split(";").map(o=>o.trim()).find(o=>o.startsWith("_csrf_token="));return t?decodeURIComponent(t.split("=").slice(1).join("=")):""}function b(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function _(e){return b(e).replace(/"/g,"&quot;")}function Dt(e){return`<pre id="${Pe}">${b(JSON.stringify(e,null,2))}</pre>`}function ve(e){let t=String(e||"").split("-").map(Number);return t.length!==3||t.some(n=>!n)?null:new Date(t[0],t[1]-1,t[2])}function $t(e){let t=ve(e);return t?t.toLocaleDateString(void 0,{month:"short"}).toUpperCase():""}function Nt(e){let t=ve(e);return t?String(t.getDate()).padStart(2,"0"):""}function Ht(e){let t=String(e||"").split(":").map(Number);if(t.length<2||Number.isNaN(t[0])||Number.isNaN(t[1]))return"";let n=t[0]>=12?"PM":"AM",o=t[0]%12||12,i=String(t[1]).padStart(2,"0");return`${o}:${i} ${n}`}function Ut(e){let t=ve(e.event_date),n=t?t.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"}):"Date TBD",o=Ht(e.start_time);return o?`${n} &middot; ${o}`:n}function he(e){return"["+re+"='"+e+"']"}function _e(e,t){var i;let o=Array.from(e.querySelectorAll("h2")).find(s=>s.textContent.trim().replace(/\s+/g," ")===t);return((i=o==null?void 0:o.parentElement)==null?void 0:i.parentElement)||null}function Me(e){return e.querySelector(he("events"))||_e(e,"Upcoming Events")}function Fe(e){return e.querySelector(he("courses"))||_e(e,"Explore Courses")}function We(e){return e.querySelector(he("resources"))||_e(e,"Featured Resources")}function Ge(e){let t=Array.from(e.querySelectorAll("a[href]")).find(n=>/view all events/i.test(n.textContent||""));return(t==null?void 0:t.getAttribute("href"))||"REPLACE-WITH-ALL-EVENTS-LINK"}function Ke(e){let t=Array.from(e.querySelectorAll("a[href]")).find(n=>/view all courses/i.test(n.textContent||""));return(t==null?void 0:t.getAttribute("href"))||"REPLACE-WITH-ALL-COURSES-LINK"}function Ve(e){let t=Array.from(e.querySelectorAll("a[href]")).find(n=>/view all resources/i.test(n.textContent||""));return(t==null?void 0:t.getAttribute("href"))||"REPLACE-WITH-ALL-RESOURCES-LINK"}function we(e){let t=(e==null?void 0:e.icon)||(e==null?void 0:e.icon_key)||"";return lt(t)}function Ee(e){let t=(e==null?void 0:e.icon)||(e==null?void 0:e.icon_key)||"";return ut(t)}function Je(e){return Lt[e]||z(String(e||"self_paced").replace(/_/g," "),24)}function Re(e,t,n){let o=String(e||"").trim();return o==="canvas_page"||o==="view_resource"?"canvas_page":o==="external_link"||/site|external/i.test(t||"")?"external_link":/view|canvas/i.test(t||"")?n?"external_link":"canvas_page":"download"}function ce(e){return Re(e==null?void 0:e.action_type,e==null?void 0:e.action_label,!!(e!=null&&e.resource_url&&!(e!=null&&e.page_url)))}function Ye(e){return ce(e)==="download"?"Download":"View Resource"}function Ot(e){let t=e.title||"Untitled Event",n=$t(e.event_date)||"TBD",o=Nt(e.event_date)||"--",i=e.location_label||"No location",s=e.booking_url||"#";return`
      <div style="background: #ffffff; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; border: 1px solid #e6e8ec;">
        <div style="display: inline-block; align-self: flex-start; border-radius: 8px; padding: 6px 12px; text-align: center; line-height: 1.1; margin-bottom: 14px; border: 1px solid #e6e8ec;">
          <div style="font-size: 11px; color: #b20b0f;">${b(n)}</div>
          <div style="font-size: 22px; color: #000000;">${b(o)}</div>
        </div>
        <h3 style="margin: 0 0 12px; font-size: 16px; color: #000000; line-height: 1.25;">${b(t)}</h3>
        <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;"><span aria-hidden="true">&#128336;&nbsp;</span> ${Ut(e)}</div>
        <div style="font-size: 13px; color: #6b7280; margin-bottom: 18px;"><span aria-hidden="true">&#128205;&nbsp;</span> ${b(i)}</div>
        <a style="margin-top: auto; display: block; text-align: center; background: #000000; color: #ffffff; text-decoration: none; font-size: 14px; padding: 10px; border-radius: 8px; border: 1.5px solid #000000;" href="${_(s)}" target="_blank" aria-label="Register for ${_(t)}" rel="noopener">Register</a>
      </div>
    `}function jt(e){let t=e.title||"Untitled Course",n=e.description||"",o=we(e),i=e.course_url||"#",s=Je(e.format);return`
      <div style="background: #ffffff; border-radius: 14px; padding: 22px 16px; text-align: center; border: 1px solid #e6e8ec;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #eeeeef; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; font-size: 23px;" aria-hidden="true">${b(o)}</div>
        <h3 style="margin: 0 0 8px; font-size: 16px; line-height: 1.25;"><a style="color: #000000; text-decoration: underline;" href="${_(i)}">${b(t)}</a></h3>
        <div style="font-size: 13px; color: #6b7280; margin-bottom: 12px;">${b(n)}</div>
        <div style="font-size: 12px; color: #b20b0f;"><span aria-hidden="true">&#128336;&nbsp;</span> ${b(s)}</div>
      </div>
    `}function Pt(e){let t=e.title||"Untitled Resource",n=e.description||"",o=Ee(e),i=Ye(e),u=ce(e)==="canvas_page"?e.page_url||e.html_url||"#":e.resource_url||"#",h=i==="Download"?"&#11015;":"&rarr;";return`
      <div style="background: #ffffff; border-radius: 14px; padding: 20px 18px; display: flex; flex-direction: column; border: 1px solid #e6e8ec;">
        <div style="width: 44px; height: 44px; border-radius: 10px; background: #eeeeef; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 12px;" aria-hidden="true">${b(o)}</div>
        <h3 style="margin: 0 0 8px; font-size: 16px; color: #000000; line-height: 1.25;">${b(t)}</h3>
        <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280;">${b(n)}</p>
        <a style="margin-top: auto; color: #b20b0f; font-size: 14px; text-decoration: underline;" href="${_(u)}" aria-label="${_(i+" "+t)}">${b(i)} <span aria-hidden="true">${h}</span></a>
      </div>
    `}function Se(e,t){let n=Z(e||[]).filter(i=>i.status!=="archived"),o=n.length?n.map(Ot).join(""):'<div style="background: #ffffff; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; border: 1px solid #e6e8ec; color: #6b7280;">No upcoming events are scheduled yet.</div>';return`
      <div ${re}="events" style="margin-top: 52px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-family: Georgia,'Times New Roman',serif; font-size: 28px; color: #000000;">Upcoming Events</h2>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 16px;">
          ${o}
        </div>
      </div>
    `}function ke(e,t){let n=O(e||[]),o=n.length?n.map(jt).join(""):'<div style="background: #ffffff; border-radius: 14px; padding: 22px 16px; text-align: center; border: 1px solid #e6e8ec; color: #6b7280;">No courses have been added yet.</div>';return`
      <div ${re}="courses" style="margin-top: 52px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-family: Georgia,'Times New Roman',serif; font-size: 28px; color: #000000;">Explore Courses</h2>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 16px;">
          ${o}
        </div>
      </div>
    `}function Ce(e,t){let n=O(e||[]),o=n.length?n.map(Pt).join(""):'<div style="background: #ffffff; border-radius: 14px; padding: 20px 18px; display: flex; flex-direction: column; border: 1px solid #e6e8ec; color: #6b7280;">No featured resources have been added yet.</div>';return`
      <div ${re}="resources" style="margin-top: 52px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-family: Georgia,'Times New Roman',serif; font-size: 28px; color: #000000;">Featured Resources</h2>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 16px;">
          ${o}
        </div>
      </div>
    `}function Xe(e,t){let n=new DOMParser().parseFromString(e||"","text/html"),o=Me(n);if(!o)throw new Error('Could not find the "Upcoming Events" section in the current hub page body.');let i=n.createElement("template");return i.innerHTML=Se(x(t).events,{viewAllUrl:Ge(o)}).trim(),o.replaceWith(i.content.firstElementChild),n.body.innerHTML}function Ze(e,t){let n=new DOMParser().parseFromString(e||"","text/html"),o=Fe(n);if(!o)throw new Error('Could not find the "Explore Courses" section in the current hub page body.');let i=n.createElement("template");return i.innerHTML=ke(x(t).courses,{viewAllUrl:Ke(o)}).trim(),o.replaceWith(i.content.firstElementChild),n.body.innerHTML}function Qe(e,t){let n=new DOMParser().parseFromString(e||"","text/html"),o=We(n);if(!o)throw new Error('Could not find the "Featured Resources" section in the current hub page body.');let i=n.createElement("template");return i.innerHTML=Ce(x(t).resources,{viewAllUrl:Ve(o)}).trim(),o.replaceWith(i.content.firstElementChild),n.body.innerHTML}function qt(e){let t=Me(document);if(!t)return!1;let n=document.createElement("template");return n.innerHTML=Se(x(e).events,{viewAllUrl:Ge(t)}).trim(),t.replaceWith(n.content.firstElementChild),!0}function Bt(e){let t=We(document);if(!t)return!1;let n=document.createElement("template");return n.innerHTML=Ce(x(e).resources,{viewAllUrl:Ve(t)}).trim(),t.replaceWith(n.content.firstElementChild),!0}function Mt(e){let t=Fe(document);if(!t)return!1;let n=document.createElement("template");return n.innerHTML=ke(x(e).courses,{viewAllUrl:Ke(t)}).trim(),t.replaceWith(n.content.firstElementChild),!0}function Ft(e){let t=new DOMParser().parseFromString(e||"","text/html"),n=t.getElementById(Pe),o=n?n.textContent:t.body.textContent;if(!o||!o.trim()||!o.trim().startsWith("{"))return de();try{return Object.assign(de(),JSON.parse(o))}catch(i){return console.warn("ISD Hub JSON page could not be parsed. Using default data.",i),de()}}async function et(){let e=await fetch(me(),{method:"GET",credentials:"include",headers:{accept:"application/json"}});if(!e.ok)throw new Error("Could not fetch JSON data page. Status: "+e.status);return e.json()}async function w(){let e=await et();return Ft(e.body)}async function Te(e){let t={accept:"application/json","content-type":"application/json","x-requested-with":"XMLHttpRequest"},n=le();n&&(t["x-csrf-token"]=n);let o=await fetch(me(),{method:"PUT",credentials:"include",headers:t,body:JSON.stringify({wiki_page:{url:q,title:"JSON",editing_roles:"teachers",published:!1,hide_from_students:!0,front_page:!1,body:Dt(e),set_assignment:"0",assignment:{set_assignment:"0",publishable:!0,hidden:!1,unpublishable:!0},notify_of_update:"0",student_planner_checkbox:!1}})});if(!o.ok)throw new Error("Could not save JSON data page. Status: "+o.status+". "+await o.text());return o.json()}async function Ae(e){let t=await fetch(ye(e),{method:"GET",credentials:"include",headers:{accept:"application/json"}});if(!t.ok)throw new Error("Could not fetch Canvas page /pages/"+e+". Status: "+t.status);return t.json()}function Wt(e,t){let n=new Date().toISOString().replace(/[:.]/g,"-"),o=Ct+":"+U()+":"+e+":"+n;return localStorage.setItem(o,t||""),console.log("ISD Hub page backup saved:",o),o}async function tt(e,t){let n={accept:"application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01","content-type":"application/json","x-requested-with":"XMLHttpRequest"},o=le();o&&(n["x-csrf-token"]=o);let i=e.url||qe(),s=Object.assign({},e,{url:i,body:t,notify_of_update:"0",student_planner_checkbox:!1}),u=await fetch(ye(i),{method:"PUT",mode:"cors",credentials:"include",headers:n,referrer:window.location.origin+B()+"/pages/"+i+"/edit",body:JSON.stringify({wiki_page:s})});if(!u.ok)throw new Error("Could not save visible hub page. Status: "+u.status+". "+await u.text());return u.json()}function Le(e){let t=e.title||"Resource",n=e.description||"An instructional design resource from the ISD Hub.",o=B();return`
      <div data-isd-hub-resource-page="true" style="max-width: 1000px; margin: 0 auto; font-family: 'Lato','Segoe UI',Helvetica,Arial,sans-serif; color: #4b5563; line-height: 1.55;">
        <div style="padding: 0 4px 24px;">
          <a style="display: inline-block; background: #000000; color: #ffffff; text-decoration: none; font-size: 14px; padding: 11px 18px; border-radius: 8px;" href="${_(o)}">&larr; Back to ISD Hub</a>
        </div>
        <div style="padding: 0 4px 28px;">
          <div style="display: inline-block; color: #b20b0f; font-size: 12px; margin-bottom: 10px;">ISD Hub Resource</div>
          <h2 data-isd-hub-resource-title style="font-family: Georgia,'Times New Roman',serif; margin: 0; font-size: 42px; line-height: 1.08; color: #000000;">${b(t)}</h2>
          <p data-isd-hub-resource-description style="margin: 18px 0 0; font-size: 17px; color: #4b5563;">${b(n)}</p>
        </div>
        <div style="padding: 0 4px;">
          [Resource use instructions]
        </div>
        <div style="margin-top: 28px; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e6b8ba;">
          <div style="background: #b20b0f; color: #ffffff; padding: 12px 18px; font-family: Georgia,'Times New Roman',serif; font-size: 18px;">Notice</div>
          <div style="padding: 18px 20px;">
            <p style="margin: 0; font-size: 14px; color: #4b5563;">&nbsp;</p>
          </div>
        </div>
        <div style="margin-top: 28px; background: #ffffff; border: 1px solid #e6e8ec; border-radius: 14px; padding: 20px 22px;">
          <div style="display: inline-block; background: #f8e8e8; color: #b20b0f; border-radius: 8px; padding: 5px 10px; font-size: 12px; margin-bottom: 12px;">Resources</div>
          <ul style="margin: 0; padding-left: 22px; font-size: 15px; color: #4b5563;">
            <li><a style="color: #b20b0f; text-decoration: underline;" href="#">Example resource link</a></li>
          </ul>
        </div>
      </div>
    `}function Gt(e,t){let n=`<h2>${b(t.title||"Resource")}</h2>`,o=`<p>${b(t.description||"")}</p>`,i=String(e||"").trim();if(!i||/^<h2\b[^>]*>[\s\S]*?<\/h2>\s*<p\b[^>]*>[\s\S]*?<\/p>$/i.test(i))return Le(t).trim();let s=new DOMParser().parseFromString(i,"text/html"),u=s.querySelector("[data-isd-hub-resource-page]");if(u){let h=u.querySelector("[data-isd-hub-resource-title]"),I=u.querySelector("[data-isd-hub-resource-description]");return h&&(h.textContent=t.title||"Resource"),I&&(I.textContent=t.description||"An instructional design resource from the ISD Hub."),s.body.innerHTML.trim()}return/<h2\b[^>]*>[\s\S]*?<\/h2>/i.test(i)?i=i.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/i,n):i=n+`
`+i,/<p\b[^>]*>[\s\S]*?<\/p>/i.test(i)?i=i.replace(/<p\b[^>]*>[\s\S]*?<\/p>/i,o):i=i.replace(/<\/h2>/i,`</h2>
`+o),i}async function nt(e){let t={accept:"application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01","content-type":"application/json","x-requested-with":"XMLHttpRequest"},n=le();n&&(t["x-csrf-token"]=n);let o=await fetch(zt(),{method:"POST",mode:"cors",credentials:"include",headers:t,referrer:window.location.origin+B()+"/pages",body:JSON.stringify({wiki_page:{editing_roles:"teachers",editor:"rce",block_editor_attributes:null,publishable:!0,deletable:!0,title:e.title||"New Resource",body:Le(e),student_todo_at:null,publish_at:null,notify_of_update:"0",assignment:{set_assignment:"0",publishable:!0,hidden:!1,unpublishable:!0},set_assignment:"0",student_planner_checkbox:!1}})});if(!o.ok)throw new Error("Could not create resource Canvas page. Status: "+o.status+". "+await o.text());return o.json()}function Ie(e){let t=e==null?void 0:e.page_slug;if(t)return t;let n=(e==null?void 0:e.page_url)||(e==null?void 0:e.html_url);if(!n)return"";try{let i=new URL(n,window.location.origin).pathname.match(/\/pages\/([^/?#]+)/);return i?decodeURIComponent(i[1]):""}catch(o){let i=String(n).match(/\/pages\/([^/?#]+)/);return i?decodeURIComponent(i[1]):""}}async function ot(e){let t=Ie(e);if(!t)throw new Error("Could not find the existing Canvas page slug for this resource.");let n=await Ae(t),o={accept:"application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01","content-type":"application/json","x-requested-with":"XMLHttpRequest"},i=le();i&&(o["x-csrf-token"]=i);let s=n.url||t,u=Object.assign({},n,{url:s,title:e.title||n.title||"Resource",body:Gt(n.body,e),notify_of_update:"0",student_planner_checkbox:!1}),h=await fetch(ye(s),{method:"PUT",mode:"cors",credentials:"include",headers:o,referrer:window.location.origin+B()+"/pages/"+s+"/edit",body:JSON.stringify({wiki_page:u})});if(!h.ok)throw new Error("Could not update resource Canvas page. Status: "+h.status+". "+await h.text());return h.json()}function Kt(e){let t=Ie(e);if(t)return window.location.origin+B()+"/pages/"+t+"/edit";let n=(e==null?void 0:e.page_url)||(e==null?void 0:e.html_url);if(!n)return"";try{let o=new URL(n,window.location.origin);return o.pathname=o.pathname.replace(/\/$/,"")+"/edit",o.search="",o.hash="",o.toString()}catch(o){return String(n).replace(/\/$/,"")+"/edit"}}async function it(e){let t=qe();if(!t)throw new Error("Could not determine the current Canvas page URL.");if(t===q)throw new Error("The visible hub page cannot be updated while you are on the JSON data page.");let n=await Ae(t),o=x(e),i=Xe(n.body,o);i=Ze(i,o),i=Qe(i,o);let s=Wt(t,n.body),u=await tt(n,i);return qt(o),Mt(o),Bt(o),console.log("ISD Hub visible page saved:",t,"Backup:",s),u}async function N(e){await Te(e);try{await it(e)}catch(t){throw new Error("JSON page saved, but visible hub page update failed. "+t.message)}return e}async function Vt(){if(!window.confirm("Replace /pages/"+q+" with starter ISD Hub JSON data?"))return null;let t=Be();return await Te(t),t}function ze(e){return e+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,8)}function x(e){return Object.assign(de(),e||{},{events:Array.isArray(e==null?void 0:e.events)?e.events:[],courses:Array.isArray(e==null?void 0:e.courses)?e.courses:[],resources:Array.isArray(e==null?void 0:e.resources)?e.resources:[]})}function O(e){return[...e].sort((t,n)=>(Number(t.sort_order)||0)-(Number(n.sort_order)||0))}function yn(e){O(e).forEach((t,n)=>{t.sort_order=n+1})}function rt(e){let t=/^\d{4}-\d{2}-\d{2}$/.test((e==null?void 0:e.event_date)||"")?e.event_date:"9999-12-31",n=/^\d{2}:\d{2}$/.test((e==null?void 0:e.start_time)||"")?e.start_time:"23:59";return t+"T"+n}function Z(e){return[...e].sort((t,n)=>{let o=rt(t).localeCompare(rt(n));return o!==0?o:(Number(t.sort_order)||0)-(Number(n.sort_order)||0)})}function Q(e){return e.events=Z(e.events||[]),e.events.forEach((t,n)=>{t.sort_order=n+1}),e}function z(e,t){return String(e||"").trim().slice(0,t)}function Jt(e){var n;let t=String(e||"");return(n=window.Intl)!=null&&n.Segmenter?Array.from(new Intl.Segmenter(void 0,{granularity:"grapheme"}).segment(t),o=>o.segment):Array.from(t)}function pe(e){let t=Tt[String(e||"").trim()];if(t)return t;let n=/[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Regional_Indicator}]/u;return Jt(e).find(o=>n.test(o))||""}function Rt(e,t){let n=new Date().toISOString();return Object.assign({},t||{},{id:(t==null?void 0:t.id)||ze("evt"),title:z(e.title,W),event_date:e.event_date||"",start_time:e.start_time||"",location_type:e.location_type||"online",location_label:e.location_label||"",booking_url:e.booking_url||"",status:e.status||(t==null?void 0:t.status)||"active",sort_order:(t==null?void 0:t.sort_order)||999,created_at:(t==null?void 0:t.created_at)||n,updated_at:n})}async function De(e,t){let n=await w(),o=x(n),i=o.events.findIndex(h=>h.id===e),s=i>=0?o.events[i]:null,u=Rt(t,s);return s?o.events[i]=u:(u.sort_order=o.events.length+1,o.events.push(u)),Q(o),await N(o),u}async function at(e){let t=x(await w());return t.events=t.events.filter(n=>n.id!==e),Q(t),await N(t),t.events}async function st(e,t){let n=x(await w()),o=n.events.find(i=>i.id===e);return o?(o.status=t,o.updated_at=new Date().toISOString(),Q(n),await N(n),o):null}async function Yt(e,t){let n=x(await w());n.events=O(n.events);let o=n.events.findIndex(u=>u.id===e);if(o<0)return n.events;let i=t==="up"?o-1:o+1;if(i<0||i>=n.events.length)return n.events;let s=n.events[o];return n.events[o]=n.events[i],n.events[i]=s,Q(n),await N(n),n.events}async function Xt(e){return De(null,e)}async function dt(e){let t=x(await w()),n={};t.events.forEach(s=>{n[s.id]=s});let o=e.map(s=>n[s]).filter(Boolean),i=t.events.filter(s=>!e.includes(s.id));return t.events=o.concat(i),Q(t),await N(t),t.events}function lt(e){return pe(e)||se}function Zt(e,t){let n=new Date().toISOString();return Object.assign({},t||{},{id:(t==null?void 0:t.id)||ze("course"),icon:lt(e.icon||(t==null?void 0:t.icon)||(t==null?void 0:t.icon_key)),title:z(e.title,G),description:z(e.description,K),format:e.format||(t==null?void 0:t.format)||"self_paced",course_url:e.course_url||"",sort_order:(t==null?void 0:t.sort_order)||999,created_at:(t==null?void 0:t.created_at)||n,updated_at:n})}function ct(e){return e.courses=O(e.courses||[]),e.courses.forEach((t,n)=>{t.sort_order=n+1}),e}async function $e(e,t){let n=x(await w()),o=n.courses.findIndex(u=>u.id===e),i=o>=0?n.courses[o]:null,s=Zt(t,i);return i?n.courses[o]=s:(s.sort_order=n.courses.length+1,n.courses.push(s)),ct(n),await N(n),s}async function Qt(e){return $e(null,e)}async function pt(e){let t=x(await w());return t.courses=t.courses.filter(n=>n.id!==e),ct(t),await N(t),t.courses}function ut(e){return At[e]||pe(e)||ae}function en(e,t){let n=new Date().toISOString(),o=Re(e.action_type,e.action_label),i=o==="download"?"Download":"View Resource";return Object.assign({},t||{},{id:(t==null?void 0:t.id)||ze("resource"),icon:ut(e.icon||(t==null?void 0:t.icon)||(t==null?void 0:t.icon_key)),title:z(e.title,V),description:z(e.description,J),action_type:o,action_label:i,resource_url:o==="canvas_page"?"":e.resource_url||"",sort_order:(t==null?void 0:t.sort_order)||999,created_at:(t==null?void 0:t.created_at)||n,updated_at:n})}function ft(e){return e.resources=O(e.resources||[]),e.resources.forEach((t,n)=>{t.sort_order=n+1}),e}async function Ne(e,t){let n=x(await w()),o=n.resources.findIndex(u=>u.id===e),i=o>=0?n.resources[o]:null,s=en(t,i);if(s.action_type==="canvas_page"){let u=Ie(s)?await ot(s):await nt(s);s.page_id=u.page_id||u.id||s.page_id||"",s.page_slug=u.url||s.page_slug||"",s.page_url=u.html_url||(u.url?B()+"/pages/"+u.url:s.page_url||"")}return i?n.resources[o]=s:(s.sort_order=n.resources.length+1,n.resources.push(s)),ft(n),await N(n),s}async function tn(e){return Ne(null,e)}async function bt(e){let t=x(await w());return t.resources=t.resources.filter(n=>n.id!==e),ft(t),await N(t),t.resources}function gt(){document.querySelectorAll(je).forEach(e=>{e.setAttribute(xe,"true"),e.setAttribute(F,e.style.display||""),e.style.display="none"})}function nn(){document.querySelectorAll(je+"["+xe+"='true']").forEach(e=>{e.style.display=e.getAttribute(F)||"",e.removeAttribute(xe),e.removeAttribute(F)})}function xt(){document.querySelectorAll("#section-tabs li").forEach(e=>{if(e.hasAttribute(be)||e.hasAttribute(Oe)||e.id===ge)return;let t=e.querySelector("a");if(!t)return;let n=t.textContent.trim();St.includes(n)||(e.setAttribute(oe,"true"),e.setAttribute(F,e.style.display||""),e.style.display="none")})}function on(){document.querySelectorAll("#section-tabs li["+oe+"='true']").forEach(e=>{e.style.display=e.getAttribute(F)||"",e.removeAttribute(oe),e.removeAttribute(F)})}function rn(){document.querySelectorAll("#section-tabs li["+be+"]").forEach(e=>{e.remove()})}function mt(e){kt.forEach(t=>{if(document.getElementById(t.id))return;let n=document.createElement("li");n.id=t.id,n.className="section",n.setAttribute(be,t.editor),n.innerHTML=`
        <a href="#" class="settings">
          <i class="icon-edit" aria-hidden="true"></i>
          <span class="name">${t.label}</span>
        </a>
      `,n.querySelector("a").addEventListener("click",o=>{if(o.preventDefault(),t.editor==="events"){sn();return}if(t.editor==="courses"){dn();return}if(t.editor==="resources"){ln();return}console.log("ISD Hub editor tab selected:",t.editor)}),e.appendChild(n)})}function an(e){if(document.getElementById(Ue))return;let t=It();if(!t)return;let n=document.createElement("li");n.id=Ue,n.className="section",n.setAttribute(Oe,"true"),n.innerHTML=`
      <a href="${t}" class="grades">
        <i class="icon-gradebook" aria-hidden="true"></i>
        <span class="name">Badges</span>
      </a>
    `,e.appendChild(n)}function R(){let e=document.getElementById(ie);if(!e)return;let t=document.getElementById(P);e.style.opacity="0",e.style.background="rgba(0,0,0,0)",t&&(t.style.opacity="0",t.style.transform="translateY(18px) scale(0.98)"),window.setTimeout(()=>{e.remove()},180)}function sn(){R();let e=document.createElement("div");e.id=ie,e.style.cssText=["position:fixed","inset:0","z-index:999999","display:flex","align-items:center","justify-content:center","padding:24px","background:rgba(0,0,0,0)","opacity:0","transition:opacity 180ms ease, background 180ms ease"].join(";"),e.innerHTML=`
      <div
        id="${P}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="isd-hub-events-title"
        style="
          width: min(1160px, 100%);
          max-height: min(860px, calc(100vh - 48px));
          overflow: auto;
          background: #fbfbfc;
          color: #111827;
          border: 1px solid #e6e8ec;
          border-radius: 18px;
          box-shadow: 0 28px 80px rgba(0,0,0,0.24);
          font-family: 'Lato','Segoe UI',Arial,sans-serif;
          opacity: 0;
          transform: translateY(18px) scale(0.98);
          transition: opacity 180ms ease, transform 180ms ease;
        "
      >
        <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 24px; border-bottom:1px solid #eceff3; background:#ffffff;">
          <div>
            <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#b20b0f; margin-bottom:4px;">ISD Hub</div>
            <h2 id="isd-hub-events-title" style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:26px; line-height:1.12; color:#000000;">Edit Events</h2>
            <div style="font-size:12px; color:#6b7280; margin-top:5px;">Loaded from /courses/${U()}/pages/${q}</div>
          </div>
          <button type="button" data-action="close-popup" aria-label="Close" style="width:38px; height:38px; border:1px solid #d8dde5; border-radius:50%; background:#ffffff; cursor:pointer; font-size:21px; line-height:1; color:#111827;">&times;</button>
        </div>

        <div style="padding:24px;">
          <div style="display:grid; grid-template-columns:minmax(360px, 1.6fr) minmax(300px, 0.9fr); gap:22px; align-items:start;">
            <section style="border:1px solid #eceff3; border-radius:18px; background:#ffffff; padding:22px; box-shadow:0 16px 36px rgba(15,23,42,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px;">
                <div>
                  <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#b20b0f; margin-bottom:5px;">Event date</div>
                  <h3 data-calendar-title style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:24px; line-height:1.12; color:#000000;"></h3>
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
                  <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#b20b0f; margin-bottom:5px;">Event details</div>
                  <h3 data-isd-hub-event-form-title style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:22px; line-height:1.12; color:#000000;">Add Event</h3>
                </div>
                <button type="button" data-action="clear-event-form" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:8px 12px; cursor:pointer; font-size:13px;">New</button>
              </div>

              <form data-isd-hub-events-form>
                <input name="id" type="hidden" />
                <div style="display:grid; grid-template-columns:1fr; gap:14px;">
                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Title</span>
                      <span data-title-count style="font-size:11px; color:#6b7280;">0 / ${W}</span>
                    </span>
                    <input name="title" type="text" maxlength="${W}" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
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
                  <button type="submit" style="border:1px solid #b20b0f; background:#b20b0f; color:#ffffff; border-radius:999px; padding:10px 18px; cursor:pointer; font-size:14px;">Save Event</button>
                </div>
              </form>
            </section>
          </div>

          <section style="margin-top:18px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px;">
              <div>
                <h3 style="margin:0; font-size:16px; color:#111827;">Event Cards</h3>
                <div data-isd-hub-events-help style="font-size:12px; color:#6b7280; margin-top:3px;">Active cards save in date and time order.</div>
              </div>
              <button type="button" data-action="refresh-events" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:7px 10px; cursor:pointer;">Refresh</button>
            </div>
            <div data-isd-hub-events-tabs style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
              <button type="button" data-action="set-events-list-view" data-view="active" style="border:1px solid #111827; background:#111827; color:#ffffff; border-radius:6px; padding:7px 11px; cursor:pointer;">Active</button>
              <button type="button" data-action="set-events-list-view" data-view="archive" style="border:1px solid #cbd5e1; background:#ffffff; color:#111827; border-radius:6px; padding:7px 11px; cursor:pointer;">Archive</button>
            </div>
            <div data-isd-hub-events-list style="display:grid; grid-template-columns:repeat(auto-fill, 240px); gap:16px; justify-content:start;">
              <div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading events...</div>
            </div>
          </section>

          <div data-isd-hub-event-output style="display:none; margin-top:14px; border:1px solid #d1d5db; border-radius:6px; background:#f9fafb; padding:10px; font-size:13px; white-space:pre-wrap;"></div>
        </div>
      </div>
    `;let t=e.querySelector("[data-isd-hub-events-form]"),n=e.querySelector("[data-isd-hub-events-list]"),o=e.querySelector("[data-calendar-title]"),i=e.querySelector("[data-calendar-grid]"),s=e.querySelector("[data-isd-hub-event-output]"),u=e.querySelector("[data-isd-hub-event-form-title]"),h=e.querySelector("[data-isd-hub-events-tabs]"),I=e.querySelector("[data-isd-hub-events-help]"),Y=e.querySelector("[data-selected-date-output]"),S=e.querySelector("[data-title-count]"),v=new Date,T="active",D=!1;function E(r,a){s.style.display="block",s.style.borderColor=a?"#fca5a5":"#d1d5db",s.style.background=a?"#fef2f2":"#f9fafb",s.textContent=r}function c(){let r=t.elements.title.value.length;S.textContent=`${r} / ${W}`,S.style.color=r>=W?"#b20b0f":"#6b7280"}function g(){t.reset(),t.elements.id.value="",u.textContent="Add Event",s.style.display="none",c()}function C(r){t.elements.id.value=r.id||"",t.elements.title.value=z(r.title,W),t.elements.event_date.value=r.event_date||"",t.elements.start_time.value=r.start_time||"",t.elements.location_type.value=r.location_type||"online",t.elements.status.value=r.status||"active",t.elements.location_label.value=r.location_label||"",t.elements.booking_url.value=r.booking_url||"",u.textContent="Edit Event",s.style.display="none",c(),r.event_date&&(v=y(r.event_date)||v)}function y(r){let a=String(r||"").split("-").map(Number);return a.length!==3||a.some(p=>!p)?null:new Date(a[0],a[1]-1,a[2])}function d(r){let a=r.getFullYear(),p=String(r.getMonth()+1).padStart(2,"0"),l=String(r.getDate()).padStart(2,"0");return`${a}-${p}-${l}`}function f(r){return r.toLocaleDateString(void 0,{month:"long",year:"numeric"})}function A(r){let a=y(r);return a?a.toLocaleDateString(void 0,{weekday:"long",month:"long",day:"numeric",year:"numeric"}):"No date selected"}function k(r){return r.filter(a=>a.event_date&&a.status!=="archived")}function L(r){let a=Z(k(r))[0];return a?y(a.event_date):null}function j(r){let a=y(r);return a?a.toLocaleDateString(void 0,{month:"short"}).toUpperCase():""}function pn(r){let a=y(r);return a?String(a.getDate()).padStart(2,"0"):""}function un(r){let a=y(r.event_date),p=a?a.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"}):"Date TBD",l=fn(r.start_time);return l?`${p} &middot; ${l}`:p}function fn(r){let a=String(r||"").split(":").map(Number);if(a.length<2||Number.isNaN(a[0])||Number.isNaN(a[1]))return"";let p=a[0]>=12?"PM":"AM",l=a[0]%12||12,m=String(a[1]).padStart(2,"0");return`${l}:${m} ${p}`}function X(r){let a=t.elements.event_date.value,p=y(a);p&&!D?(v=p,D=!0):D||(v=L(r)||v,D=!0);let l=v.getFullYear(),m=v.getMonth(),$={};r.forEach(H=>{!H.event_date||H.status==="archived"||($[H.event_date]=($[H.event_date]||0)+1)}),o.textContent=f(v),Y.textContent=A(a);let He=new Date(l,m,1),ue=new Date(l,m,1-He.getDay()),ee=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(H=>`
        <div style="font-size:11px; color:#8a94a6; text-align:center; font-weight:bold; padding:6px 0; text-transform:uppercase;">${H}</div>
      `),xn=d(new Date);for(let H=0;H<42;H++){let fe=new Date(ue);fe.setDate(ue.getDate()+H);let te=d(fe),vt=fe.getMonth()===m,ne=te===a,ht=te===xn,_t=($[te]||0)>0,mn=_t?"Has active events":"No active events",wt=`${A(te)}, ${mn}`;ee.push(`
          <button
            type="button"
            data-action="select-calendar-date"
            data-date="${te}"
            aria-label="${_(wt)}"
            title="${_(wt)}"
            style="
              min-height: 58px;
              border: 0;
              border-radius: 14px;
              background: transparent;
              color: ${vt?"#111827":"#c2c8d2"};
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
              font-weight: ${ne||ht?"bold":"normal"};
              color: ${ne?"#ffffff":vt?"#111827":"#c2c8d2"};
              background: ${ne?"#b20b0f":"#ffffff"};
              border: 1px solid ${ne||ht?"#b20b0f":"transparent"};
              box-shadow: ${ne?"0 10px 22px rgba(178,11,15,0.24)":"none"};
            ">${fe.getDate()}</span>
            ${_t?'<span aria-hidden="true" style="display:block; width:6px; height:6px; border-radius:50%; background:#b20b0f; margin:5px auto 0;"></span>':'<span aria-hidden="true" style="display:block; width:6px; height:6px; margin:5px auto 0;"></span>'}
          </button>
        `)}i.innerHTML=ee.join("")}function bn(r){let a=r.filter(l=>l.status!=="archived").length,p=r.filter(l=>l.status==="archived").length;h.querySelectorAll("[data-view]").forEach(l=>{let m=l.getAttribute("data-view"),$=m===T;l.textContent=m==="archive"?`Archive (${p})`:`Active (${a})`,l.style.borderColor=$?"#111827":"#cbd5e1",l.style.background=$?"#111827":"#ffffff",l.style.color=$?"#ffffff":"#111827"}),I.textContent=T==="archive"?"Archived cards are hidden from the hub page. You can edit, unarchive, or delete them here.":"Active cards save in date and time order."}function gn(r){let a=Z(r),p=a.filter(l=>T==="archive"?l.status==="archived":l.status!=="archived");if(bn(a),!p.length){let l=T==="archive"?"No archived events yet.":"No active events yet.";n.innerHTML=`<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">${l}</div>`;return}n.innerHTML=p.map(l=>{let m=l.status==="archived",$=m?"Archived":"Active",He=m?"Unarchive":"Archive",ue=j(l.event_date)||"TBD",yt=pn(l.event_date)||"--",ee=!1;return`
          <div data-event-card data-event-id="${_(l.id)}" draggable="${ee?"true":"false"}" style="cursor:${ee?"grab":"default"};">
            <div style="background:#ffffff; border-radius:14px; padding:18px; display:flex; flex-direction:column; border:1px solid #e6e8ec; min-height:220px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                <div style="display:inline-block; align-self:flex-start; border-radius:8px; padding:6px 12px; text-align:center; line-height:1.1; margin-bottom:14px; border:1px solid #e6e8ec;">
                  <div style="font-size:11px; color:#b20b0f;">${b(ue)}</div>
                  <div style="font-size:22px; color:#000000;">${b(yt)}</div>
                </div>
                <span style="font-size:11px; border:1px solid ${m?"#d1d5db":"#bbf7d0"}; background:${m?"#f3f4f6":"#f0fdf4"}; color:${m?"#374151":"#166534"}; border-radius:999px; padding:3px 7px;">${$}</span>
              </div>
              <h3 style="margin:0 0 12px; font-size:16px; color:#000000; line-height:1.25;">${b(l.title||"Untitled Event")}</h3>
              <div style="font-size:13px; color:#6b7280; margin-bottom:4px;">Time: ${un(l)}</div>
              <div style="font-size:13px; color:#6b7280; margin-bottom:18px;">Location: ${b(l.location_label||"No location")}</div>
              <a style="margin-top:auto; display:block; text-align:center; background:#000000; color:#ffffff; text-decoration:none; font-size:14px; padding:10px; border-radius:8px; border:1.5px solid #000000;" href="${_(l.booking_url||"#")}" target="_blank" rel="noopener">Register</a>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
              <button type="button" data-action="edit-event" data-event-id="${_(l.id)}" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:5px 8px; cursor:pointer;">Edit</button>
              <button type="button" data-action="toggle-event-status" data-event-id="${_(l.id)}" data-next-status="${m?"active":"archived"}" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:5px 8px; cursor:pointer;">${He}</button>
              <button type="button" data-action="delete-event" data-event-id="${_(l.id)}" style="border:1px solid #fecaca; background:#fff1f2; color:#991b1b; border-radius:6px; padding:5px 8px; cursor:pointer;">Delete</button>
            </div>
          </div>
        `}).join("")}async function M(){n.innerHTML='<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading events...</div>';let r=x(await w());return gn(r.events),X(r.events),r.events}e.addEventListener("click",async r=>{let a=r.target.closest("[data-action]"),p=a==null?void 0:a.getAttribute("data-action");if(r.target===e||p==="close-popup"){R();return}if(p)try{if(p==="set-events-list-view"&&(T=a.getAttribute("data-view")==="archive"?"archive":"active",await M()),p==="clear-event-form"&&(g(),X(x(await w()).events)),(p==="previous-month"||p==="next-month")&&(v=new Date(v.getFullYear(),v.getMonth()+(p==="next-month"?1:-1),1),X(x(await w()).events)),p==="select-calendar-date"&&(t.elements.event_date.value=a.getAttribute("data-date"),v=y(t.elements.event_date.value)||v,X(x(await w()).events)),p==="refresh-events"&&(await M(),E("Events refreshed.",!1)),p==="edit-event"){let l=x(await w()),m=l.events.find($=>$.id===a.getAttribute("data-event-id"));m&&(C(m),X(l.events))}if(p==="delete-event"){if(!window.confirm("Delete this event?"))return;await at(a.getAttribute("data-event-id")),g(),await M(),E("Event deleted.",!1)}p==="toggle-event-status"&&(await st(a.getAttribute("data-event-id"),a.getAttribute("data-next-status")),await M(),E("Event status updated.",!1))}catch(l){console.error(l),E(`Action failed:
`+l.message,!0)}}),t.addEventListener("submit",async r=>{r.preventDefault();let a=t.querySelector("button[type='submit']"),p=new FormData(t),l=Object.fromEntries(p.entries());try{a.disabled=!0,a.textContent="Saving...";let m=await De(l.id||null,l);console.log("ISD Hub event saved to JSON page and visible hub page:",m),g(),await M(),E("Event saved to JSON and hub page.",!1)}catch(m){console.error(m),E(`Save failed:
`+m.message,!0)}finally{a.disabled=!1,a.textContent="Save Event"}}),t.elements.event_date.addEventListener("change",async()=>{v=y(t.elements.event_date.value)||v;try{X(x(await w()).events)}catch(r){console.error(r),E(`Calendar refresh failed:
`+r.message,!0)}}),t.elements.title.addEventListener("input",c),c(),n.addEventListener("dragstart",r=>{if(T!=="active")return;let a=r.target.closest("[data-event-card]");a&&(a.style.opacity="0.45",a.setAttribute("data-dragging","true"),r.dataTransfer.effectAllowed="move",r.dataTransfer.setData("text/plain",a.getAttribute("data-event-id")))}),n.addEventListener("dragend",r=>{let a=r.target.closest("[data-event-card]");a&&(a.style.opacity="",a.removeAttribute("data-dragging"))}),n.addEventListener("dragover",r=>{if(T!=="active")return;let a=n.querySelector("[data-dragging='true']"),p=r.target.closest("[data-event-card]");if(!a||!p||a===p)return;r.preventDefault();let l=p.getBoundingClientRect(),m=r.clientY>l.top+l.height/2;n.insertBefore(a,m?p.nextSibling:p)}),n.addEventListener("drop",async r=>{if(T!=="active")return;r.preventDefault();let a=Array.from(n.querySelectorAll("[data-event-card]")).map(p=>p.getAttribute("data-event-id")).filter(Boolean);try{await dt(a),await M(),E("Event order saved.",!1)}catch(p){console.error(p),E(`Reorder failed:
`+p.message,!0)}}),document.body.appendChild(e),M().catch(r=>{console.error(r),E(`Could not load events:
`+r.message,!0)}),window.requestAnimationFrame(()=>{let r=document.getElementById(P);e.style.opacity="1",e.style.background="rgba(0,0,0,0.38)",r&&(r.style.opacity="1",r.style.transform="translateY(0) scale(1)")})}function dn(){R();let e=document.createElement("div");e.id=ie,e.style.cssText=["position:fixed","inset:0","z-index:999999","display:flex","align-items:center","justify-content:center","padding:24px","background:rgba(0,0,0,0)","opacity:0","transition:opacity 180ms ease, background 180ms ease"].join(";"),e.innerHTML=`
      <div
        id="${P}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="isd-hub-courses-title"
        style="
          width: min(1160px, 100%);
          max-height: min(860px, calc(100vh - 48px));
          overflow: auto;
          background: #fbfbfc;
          color: #111827;
          border: 1px solid #e6e8ec;
          border-radius: 18px;
          box-shadow: 0 28px 80px rgba(0,0,0,0.24);
          font-family: 'Lato','Segoe UI',Arial,sans-serif;
          opacity: 0;
          transform: translateY(18px) scale(0.98);
          transition: opacity 180ms ease, transform 180ms ease;
        "
      >
        <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 24px; border-bottom:1px solid #eceff3; background:#ffffff;">
          <div>
            <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#b20b0f; margin-bottom:4px;">ISD Hub</div>
            <h2 id="isd-hub-courses-title" style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:26px; line-height:1.12; color:#000000;">Edit Courses</h2>
            <div style="font-size:12px; color:#6b7280; margin-top:5px;">Loaded from /courses/${U()}/pages/${q}</div>
          </div>
          <button type="button" data-action="close-popup" aria-label="Close" style="width:38px; height:38px; border:1px solid #d8dde5; border-radius:50%; background:#ffffff; cursor:pointer; font-size:21px; line-height:1; color:#111827;">&times;</button>
        </div>

        <div style="padding:24px;">
          <div style="display:grid; grid-template-columns:minmax(320px, 380px) minmax(0, 1fr); gap:28px; align-items:start;">
            <section style="border:1px solid #eceff3; border-radius:18px; background:#ffffff; padding:22px 26px 22px 22px; box-shadow:0 16px 36px rgba(15,23,42,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:18px;">
                <div>
                  <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#b20b0f; margin-bottom:5px;">Course details</div>
                  <h3 data-isd-hub-course-form-title style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:22px; line-height:1.12; color:#000000;">Add Course</h3>
                </div>
                <button type="button" data-action="clear-course-form" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:8px 12px; cursor:pointer; font-size:13px;">New</button>
              </div>

              <form data-isd-hub-courses-form>
                <input name="id" type="hidden" />

                <div style="display:grid; grid-template-columns:1fr; gap:14px;">
                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Icon
                    <span style="display:flex; align-items:center; gap:10px;">
                      <input name="icon" type="text" maxlength="16" value="${_(se)}" title="Windows: Win + ; or Win + . | Mac: Control + Command + Space" aria-label="Course icon emoji" style="box-sizing:border-box; width:86px; border:1px solid #d8dde5; border-radius:12px; padding:10px 12px; font-size:22px; line-height:1; background:#fbfbfc; color:#111827; text-align:center;" />
                      <span style="font-size:11px; color:#6b7280; line-height:1.7;">
                        Windows: <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Win + ;</span> or <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Win + .</span><br />
                        Mac: <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Control + Command + Space</span>
                      </span>
                    </span>
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Title</span>
                      <span data-course-title-count style="font-size:11px; color:#6b7280;">0 / ${G}</span>
                    </span>
                    <input name="title" type="text" maxlength="${G}" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Description</span>
                      <span data-course-description-count style="font-size:11px; color:#6b7280;">0 / ${K}</span>
                    </span>
                    <textarea name="description" maxlength="${K}" rows="3" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827; resize:vertical;"></textarea>
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
                  <button type="submit" style="border:1px solid #b20b0f; background:#b20b0f; color:#ffffff; border-radius:999px; padding:10px 18px; cursor:pointer; font-size:14px;">Save Course</button>
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

              <div data-isd-hub-courses-list style="display:grid; grid-template-columns:repeat(auto-fill, 220px); gap:16px; justify-content:start; max-width:692px;">
                <div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading courses...</div>
              </div>
            </section>
          </div>

          <div data-isd-hub-course-output style="display:none; margin-top:14px; border:1px solid #d1d5db; border-radius:6px; background:#f9fafb; padding:10px; font-size:13px; white-space:pre-wrap;"></div>
        </div>
      </div>
    `;let t=e.querySelector("[data-isd-hub-courses-form]"),n=e.querySelector("[data-isd-hub-courses-list]"),o=e.querySelector("[data-isd-hub-course-output]"),i=e.querySelector("[data-isd-hub-course-form-title]"),s=e.querySelector("[data-course-title-count]"),u=e.querySelector("[data-course-description-count]");function h(c,g){o.style.display="block",o.style.borderColor=g?"#fca5a5":"#d1d5db",o.style.background=g?"#fef2f2":"#f9fafb",o.textContent=c}function I(){let c=t.elements.title.value.length,g=t.elements.description.value.length;s.textContent=`${c} / ${G}`,u.textContent=`${g} / ${K}`,s.style.color=c>=G?"#b20b0f":"#6b7280",u.style.color=g>=K?"#b20b0f":"#6b7280"}function Y(c){let g=pe(t.elements.icon.value);t.elements.icon.value=g||(c?se:"")}function S(){t.reset(),t.elements.id.value="",i.textContent="Add Course",o.style.display="none",t.elements.icon.value=se,I()}function v(c){t.elements.id.value=c.id||"",t.elements.title.value=z(c.title,G),t.elements.description.value=z(c.description,K),t.elements.format.value=c.format==="in_person"?"in_person":"self_paced",t.elements.course_url.value=c.course_url||"",t.elements.icon.value=we(c),i.textContent="Edit Course",o.style.display="none",I()}function T(c){let g=we(c),C=c.title||"Untitled Course",y=c.description||"",d=Je(c.format);return`
        <div data-course-card data-course-id="${_(c.id)}">
          <div style="background:#ffffff; border-radius:14px; padding:18px; text-align:center; border:1px solid #e6e8ec; min-height:220px; display:flex; flex-direction:column;">
            <div style="width:52px; height:52px; border-radius:50%; background:#eeeeef; margin:0 auto 14px; display:flex; align-items:center; justify-content:center; font-size:23px;" aria-hidden="true">${b(g)}</div>
            <h3 style="margin:0 0 8px; font-size:16px; line-height:1.25; color:#000000;">${b(C)}</h3>
            <div style="font-size:13px; color:#6b7280; margin-bottom:12px;">${b(y)}</div>
            <div style="font-size:12px; color:#b20b0f; margin-top:auto;">${b(d)}</div>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
            <button type="button" data-action="edit-course" data-course-id="${_(c.id)}" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:5px 8px; cursor:pointer;">Edit</button>
            <button type="button" data-action="delete-course" data-course-id="${_(c.id)}" style="border:1px solid #fecaca; background:#fff1f2; color:#991b1b; border-radius:6px; padding:5px 8px; cursor:pointer;">Delete</button>
          </div>
        </div>
      `}function D(c){let g=O(c);if(!g.length){n.innerHTML='<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">No courses yet.</div>';return}n.innerHTML=g.map(T).join("")}async function E(){n.innerHTML='<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading courses...</div>';let c=x(await w());return D(c.courses),c.courses}e.addEventListener("click",async c=>{let g=c.target.closest("[data-action]"),C=g==null?void 0:g.getAttribute("data-action");if(c.target===e||C==="close-popup"){R();return}if(C)try{if(C==="clear-course-form"&&S(),C==="refresh-courses"&&(await E(),h("Courses refreshed.",!1)),C==="edit-course"){let d=x(await w()).courses.find(f=>f.id===g.getAttribute("data-course-id"));d&&v(d)}if(C==="delete-course"){if(!window.confirm("Delete this course card?"))return;await pt(g.getAttribute("data-course-id")),S(),await E(),h("Course deleted.",!1)}}catch(y){console.error(y),h(`Action failed:
`+y.message,!0)}}),t.addEventListener("submit",async c=>{c.preventDefault();let g=t.querySelector("button[type='submit']"),C=new FormData(t),y=Object.fromEntries(C.entries());try{g.disabled=!0,g.textContent="Saving...";let d=await $e(y.id||null,y);console.log("ISD Hub course saved to JSON page and visible hub page:",d),S(),await E(),h("Course saved to JSON and hub page.",!1)}catch(d){console.error(d),h(`Save failed:
`+d.message,!0)}finally{g.disabled=!1,g.textContent="Save Course"}}),t.elements.title.addEventListener("input",I),t.elements.description.addEventListener("input",I),t.elements.icon.addEventListener("input",()=>Y(!1)),t.elements.icon.addEventListener("blur",()=>Y(!0)),t.elements.icon.addEventListener("focus",()=>t.elements.icon.select()),t.elements.icon.addEventListener("click",()=>t.elements.icon.select()),I(),document.body.appendChild(e),E().catch(c=>{console.error(c),h(`Could not load courses:
`+c.message,!0)}),window.requestAnimationFrame(()=>{let c=document.getElementById(P);e.style.opacity="1",e.style.background="rgba(0,0,0,0.38)",c&&(c.style.opacity="1",c.style.transform="translateY(0) scale(1)")})}function ln(){R();let e=document.createElement("div");e.id=ie,e.style.cssText=["position:fixed","inset:0","z-index:999999","display:flex","align-items:center","justify-content:center","padding:24px","background:rgba(0,0,0,0)","opacity:0","transition:opacity 180ms ease, background 180ms ease"].join(";"),e.innerHTML=`
      <div
        id="${P}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="isd-hub-resources-title"
        style="
          width: min(1160px, 100%);
          max-height: min(860px, calc(100vh - 48px));
          overflow: auto;
          background: #fbfbfc;
          color: #111827;
          border: 1px solid #e6e8ec;
          border-radius: 18px;
          box-shadow: 0 28px 80px rgba(0,0,0,0.24);
          font-family: 'Lato','Segoe UI',Arial,sans-serif;
          opacity: 0;
          transform: translateY(18px) scale(0.98);
          transition: opacity 180ms ease, transform 180ms ease;
        "
      >
        <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 24px; border-bottom:1px solid #eceff3; background:#ffffff;">
          <div>
            <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#b20b0f; margin-bottom:4px;">ISD Hub</div>
            <h2 id="isd-hub-resources-title" style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:26px; line-height:1.12; color:#000000;">Edit Resources</h2>
            <div style="font-size:12px; color:#6b7280; margin-top:5px;">Loaded from /courses/${U()}/pages/${q}</div>
          </div>
          <button type="button" data-action="close-popup" aria-label="Close" style="width:38px; height:38px; border:1px solid #d8dde5; border-radius:50%; background:#ffffff; cursor:pointer; font-size:21px; line-height:1; color:#111827;">&times;</button>
        </div>

        <div style="padding:24px;">
          <div style="display:grid; grid-template-columns:minmax(320px, 380px) minmax(0, 1fr); gap:28px; align-items:start;">
            <section style="border:1px solid #eceff3; border-radius:18px; background:#ffffff; padding:22px 26px 22px 22px; box-shadow:0 16px 36px rgba(15,23,42,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:18px;">
                <div>
                  <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#b20b0f; margin-bottom:5px;">Resource details</div>
                  <h3 data-isd-hub-resource-form-title style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:22px; line-height:1.12; color:#000000;">Add Resource</h3>
                </div>
                <button type="button" data-action="clear-resource-form" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:8px 12px; cursor:pointer; font-size:13px;">New</button>
              </div>

              <form data-isd-hub-resources-form>
                <input name="id" type="hidden" />

                <div style="display:grid; grid-template-columns:1fr; gap:14px;">
                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Icon
                    <span style="display:flex; align-items:center; gap:10px;">
                      <input name="icon" type="text" maxlength="16" value="${_(ae)}" title="Windows: Win + ; or Win + . | Mac: Control + Command + Space" aria-label="Resource icon emoji" style="box-sizing:border-box; width:86px; border:1px solid #d8dde5; border-radius:12px; padding:10px 12px; font-size:22px; line-height:1; background:#fbfbfc; color:#111827; text-align:center;" />
                      <span style="font-size:11px; color:#6b7280; line-height:1.7;">
                        Windows: <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Win + ;</span> or <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Win + .</span><br />
                        Mac: <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Control + Command + Space</span>
                      </span>
                    </span>
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Title</span>
                      <span data-resource-title-count style="font-size:11px; color:#6b7280;">0 / ${V}</span>
                    </span>
                    <input name="title" type="text" maxlength="${V}" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Brief Description</span>
                      <span data-resource-description-count style="font-size:11px; color:#6b7280;">0 / ${J}</span>
                    </span>
                    <textarea name="description" maxlength="${J}" rows="3" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827; resize:vertical;"></textarea>
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Action
                    <select name="action_type" style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;">
                      <option value="download">Download</option>
                      <option value="canvas_page">Canvas Page</option>
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
                  <button type="submit" style="border:1px solid #b20b0f; background:#b20b0f; color:#ffffff; border-radius:999px; padding:10px 18px; cursor:pointer; font-size:14px;">Save Resource</button>
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

              <div data-isd-hub-resources-list style="display:grid; grid-template-columns:repeat(auto-fill, 220px); gap:16px; justify-content:start; max-width:692px;">
                <div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading resources...</div>
              </div>
            </section>
          </div>

          <div data-isd-hub-resource-output style="display:none; margin-top:14px; border:1px solid #d1d5db; border-radius:6px; background:#f9fafb; padding:10px; font-size:13px; white-space:pre-wrap;"></div>
        </div>
      </div>
    `;let t=e.querySelector("[data-isd-hub-resources-form]"),n=e.querySelector("[data-isd-hub-resources-list]"),o=e.querySelector("[data-isd-hub-resource-output]"),i=e.querySelector("[data-isd-hub-resource-form-title]"),s=e.querySelector("[data-resource-title-count]"),u=e.querySelector("[data-resource-description-count]"),h=e.querySelector("[data-resource-url-wrap]"),I=e.querySelector("[data-resource-url-label]"),Y=e.querySelector("[data-resource-url-help]");function S(d,f){o.style.display="block",o.style.borderColor=f?"#fca5a5":"#d1d5db",o.style.background=f?"#fef2f2":"#f9fafb",o.textContent=d}function v(){let d=t.elements.title.value.length,f=t.elements.description.value.length;s.textContent=`${d} / ${V}`,u.textContent=`${f} / ${J}`,s.style.color=d>=V?"#b20b0f":"#6b7280",u.style.color=f>=J?"#b20b0f":"#6b7280"}function T(d){let f=pe(t.elements.icon.value);t.elements.icon.value=f||(d?ae:"")}function D(){let d=t.elements.action_type.value,f=d==="canvas_page";if(h.style.display=f?"none":"flex",t.elements.resource_url.required=!f,f){t.elements.resource_url.value="";return}I.textContent=d==="external_link"?"External Link":"Download Link",Y.textContent=d==="external_link"?"Required for External Link. The card will show View Resource.":"Required for downloads. The card will link directly to this URL."}function E(){t.reset(),t.elements.id.value="",t.elements.icon.value=ae,i.textContent="Add Resource",o.style.display="none",D(),v()}function c(d){t.elements.id.value=d.id||"",t.elements.icon.value=Ee(d),t.elements.title.value=z(d.title,V),t.elements.description.value=z(d.description,J),t.elements.action_type.value=ce(d),t.elements.resource_url.value=d.resource_url||"",i.textContent="Edit Resource",o.style.display="none",D(),v()}function g(d){let f=Ee(d),A=d.title||"Untitled Resource",k=d.description||"",L=Ye(d),j=d.page_url&&ce(d)==="canvas_page";return`
        <div data-resource-card data-resource-id="${_(d.id)}">
          <div style="background:#ffffff; border-radius:14px; padding:18px; border:1px solid #e6e8ec; min-height:220px; display:flex; flex-direction:column;">
            <div style="width:44px; height:44px; border-radius:10px; background:#eeeeef; display:flex; align-items:center; justify-content:center; font-size:20px; margin-bottom:12px;" aria-hidden="true">${b(f)}</div>
            <h3 style="margin:0 0 8px; font-size:16px; line-height:1.25; color:#000000;">${b(A)}</h3>
            <div style="font-size:13px; color:#6b7280; margin-bottom:12px;">${b(k)}</div>
            <div style="font-size:12px; color:#b20b0f; margin-top:auto;">${b(L)}${j?" page created":""}</div>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
            <button type="button" data-action="edit-resource" data-resource-id="${_(d.id)}" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:5px 8px; cursor:pointer;">Edit</button>
            <button type="button" data-action="delete-resource" data-resource-id="${_(d.id)}" style="border:1px solid #fecaca; background:#fff1f2; color:#991b1b; border-radius:6px; padding:5px 8px; cursor:pointer;">Delete</button>
          </div>
        </div>
      `}function C(d){let f=O(d);if(!f.length){n.innerHTML='<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">No resources yet.</div>';return}n.innerHTML=f.map(g).join("")}async function y(){n.innerHTML='<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading resources...</div>';let d=x(await w());return C(d.resources),d.resources}e.addEventListener("click",async d=>{let f=d.target.closest("[data-action]"),A=f==null?void 0:f.getAttribute("data-action");if(d.target===e||A==="close-popup"){R();return}if(A)try{if(A==="clear-resource-form"&&E(),A==="refresh-resources"&&(await y(),S("Resources refreshed.",!1)),A==="edit-resource"){let L=x(await w()).resources.find(j=>j.id===f.getAttribute("data-resource-id"));L&&c(L)}if(A==="delete-resource"){if(!window.confirm("Delete this resource card? This will not delete any Canvas page that was already created."))return;await bt(f.getAttribute("data-resource-id")),E(),await y(),S("Resource deleted.",!1)}}catch(k){console.error(k),S(`Action failed:
`+k.message,!0)}}),t.addEventListener("submit",async d=>{d.preventDefault();let f=t.querySelector("button[type='submit']"),A=new FormData(t),k=Object.fromEntries(A.entries());if(k.action_type!=="canvas_page"&&!k.resource_url.trim()){S((k.action_type==="external_link"?"External Link":"Download")+" resources need a link.",!0);return}try{f.disabled=!0,f.textContent=k.action_type==="canvas_page"?"Creating page...":"Saving...";let L=await Ne(k.id||null,k);console.log("ISD Hub resource saved to JSON page and visible hub page:",L);let j=Kt(L);if(L.action_type==="canvas_page"&&j){S("Resource saved. Opening the Canvas page editor...",!1),window.location.assign(j);return}E(),await y(),S("Resource saved to JSON and hub page.",!1)}catch(L){console.error(L),S(`Save failed:
`+L.message,!0)}finally{f.disabled=!1,f.textContent="Save Resource"}}),t.elements.title.addEventListener("input",v),t.elements.description.addEventListener("input",v),t.elements.action_type.addEventListener("change",D),t.elements.icon.addEventListener("input",()=>T(!1)),t.elements.icon.addEventListener("blur",()=>T(!0)),t.elements.icon.addEventListener("focus",()=>t.elements.icon.select()),t.elements.icon.addEventListener("click",()=>t.elements.icon.select()),D(),v(),document.body.appendChild(e),y().catch(d=>{console.error(d),S(`Could not load resources:
`+d.message,!0)}),window.requestAnimationFrame(()=>{let d=document.getElementById(P);e.style.opacity="1",e.style.background="rgba(0,0,0,0.38)",d&&(d.style.opacity="1",d.style.transform="translateY(0) scale(1)")})}function cn(e){if(document.getElementById(ge))return;let t=document.createElement("li");t.id=ge,t.className="section";let n=document.createElement("button");n.type="button",n.textContent="Restore Tabs",n.style.cursor="pointer",n.addEventListener("click",()=>{document.querySelector("#section-tabs li["+oe+"='true']")?(nn(),on(),rn(),n.textContent="Hide Tabs"):(gt(),xt(),mt(e),n.textContent="Restore Tabs")}),t.appendChild(n),e.appendChild(t)}if(window.location.pathname.includes(B())){let e=document.querySelector("#section-tabs");if(!e)return;gt(),xt(),an(e),mt(e),cn(e)}window.ISDHubData={addEventToHubData:Xt,addCourseToHubData:Qt,addResourceToHubData:tn,createCanvasResourcePage:nt,updateCanvasResourcePage:ot,deleteCourseFromHubData:pt,deleteEventFromHubData:at,deleteResourceFromHubData:bt,fetchDataPage:et,fetchCanvasPage:Ae,getDataPageApiUrl:me,getStarterHubData:Be,loadHubData:w,moveEventInHubData:Yt,replaceEventsSectionInBody:Xe,replaceCoursesSectionInBody:Ze,replaceResourcesSectionInBody:Qe,renderCoursesSection:ke,renderEventsSection:Se,renderResourcesSection:Ce,reorderEventsInHubData:dt,saveCanvasPageBody:tt,saveCourseToHubData:$e,saveHubData:Te,saveHubDataAndRenderedPage:N,saveEventToHubData:De,saveResourceToHubData:Ne,saveRenderedHubPage:it,setEventStatusInHubData:st,seedHubDataPage:Vt,sortEventsByDate:Z}})();})();
