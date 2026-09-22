(()=>{(()=>{"use strict";var pe;let $=ENV.COURSE_ID,ie="import-chcm-content",ce=decodeURIComponent(((pe=document.cookie.match(/(?:^|;\s*)_csrf_token=([^;]+)/))==null?void 0:pe[1])||"");function U(t){let o=new URLSearchParams;return Object.entries(t).forEach(([n,a])=>{a!=null&&o.append(n,String(a))}),o}async function P(t,o,n=null){let a=await fetch(t,{method:o,credentials:"same-origin",headers:{Accept:"application/json","X-CSRF-Token":ce,...n?{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"}:{}},body:n});if(!a.ok)throw new Error(`${o} ${t}: ${a.status} ${await a.text()}`);let p=await a.text();return p?JSON.parse(p):null}async function re(t,o,n=null){let a=await fetch(t,{method:o,credentials:"same-origin",headers:{"X-CSRF-Token":ce,...n?{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"}:{}},body:n});if(!a.ok)throw new Error(`${o} ${t}: ${a.status} ${await a.text()}`);return a.text()}function v(t){return String(t||"").trim().toLowerCase()}function le(t){let o=String(t||"").trim().match(/^(?:Chapter|Ch)\s+0*(\d+)(?:\s*[:.-]\s*|\s+)(.+)$/i);return o?{number:Number(o[1]),contentType:o[2].trim()}:null}function de(t){var o;return((o=le(t))==null?void 0:o.contentType)||null}function Y(t){var o,n;return(n=(o=le(t))==null?void 0:o.number)!=null?n:null}function me(t,o){let n=de(t.name);return n?o.typeActions.get(v(n))||"assignment":o.assignmentActions.get(Number(t.id))||"assignment"}function oe(t,o="Button"){let n=document.createElement("button");return n.type="button",n.className=o,n.textContent=t,n}function xe(){if(document.getElementById("chcm-import-wizard-styles"))return;let t=document.createElement("style");t.id="chcm-import-wizard-styles",t.textContent=`
      .chcm-overlay {
        position: fixed;
        inset: 0;
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.55);
      }

      .chcm-modal {
        box-sizing: border-box;
        width: min(760px, calc(100vw - 40px));
        max-height: calc(100vh - 60px);
        overflow: auto;
        padding: 24px;
        background: #fff;
        border-radius: 4px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
      }

      .chcm-modal h2 {
        margin-top: 0;
      }

      .chcm-course-search {
        box-sizing: border-box;
        width: 100%;
        margin: 8px 0 16px;
      }

      .chcm-course-list,
      .chcm-content-list {
        max-height: 430px;
        overflow: auto;
        margin-bottom: 24px;
        border-top: 1px solid #c7cdd1;
      }

      .chcm-course-row {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 11px 4px;
        border-bottom: 1px solid #c7cdd1;
        cursor: pointer;
      }

      .chcm-course-row input {
        margin-top: 4px;
      }

      .chcm-course-name {
        display: block;
        font-weight: 600;
      }

      .chcm-course-code {
        display: block;
        color: #6b7780;
        font-size: 0.875rem;
      }

      .chcm-content-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        min-height: 44px;
        padding: 8px 4px;
        border-bottom: 1px solid #c7cdd1;
      }

      .chcm-content-label {
        flex: 1;
        min-width: 0;
      }

      .chcm-content-label small {
        color: #6b7780;
      }

      .chcm-choice-buttons {
        display: flex;
        flex: 0 0 auto;
        gap: 8px;
      }

      .chcm-choice {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 0;
        color: #000;
        background: transparent;
        border: 0;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
      }

      .chcm-choice:hover,
      .chcm-choice:focus {
        background: #e8e8e8;
      }

      .chcm-choice.is-selected {
        color: #fff;
        background: #168821;
      }

      .chcm-choice.is-selected:hover,
      .chcm-choice.is-selected:focus {
        color: #fff;
        background: #0b6b15;
      }

      .chcm-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
        margin: 16px 0 20px;
      }

      .chcm-legend span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .chcm-modal-actions {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }

      .chcm-modal-actions-right {
        display: flex;
        gap: 8px;
      }

      .chcm-progress {
        width: 100%;
        height: 18px;
        margin: 12px 0 10px;
        border: 1px solid #c7cdd1;
        border-radius: 999px;
        background: #f5f5f5;
        overflow: hidden;
      }

      .chcm-progress-bar {
        height: 100%;
        width: 0%;
        background: #0b6b15;
        transition: width 160ms ease;
      }

      .chcm-progress-text {
        margin: 0;
        color: #4a5968;
        font-size: 0.95rem;
      }
    `,document.head.append(t)}function _e(t){xe();let o=document.createElement("div");o.className="chcm-overlay";let n=document.createElement("div");n.className="chcm-modal",n.setAttribute("role","dialog"),n.setAttribute("aria-modal","true"),n.setAttribute("aria-labelledby","chcm-wizard-title"),o.append(n),document.body.append(o);let a=null,p=new Set,w=[],k=[],N=!1,z=!1,D=()=>{},Z=new Promise(r=>{D=r});function J(r){z||(z=!0,D(r))}function G(r){o.remove(),J(r)}function V({title:r,message:y,current:x=null,total:f=null}){N=!0,n.replaceChildren();let b=document.createElement("h2");b.id="chcm-wizard-title",b.textContent=r;let d=document.createElement("p");if(d.textContent=y,n.append(b),Number.isFinite(x)&&Number.isFinite(f)&&f>0){let c=document.createElement("div");c.className="chcm-progress",c.setAttribute("role","progressbar"),c.setAttribute("aria-valuemin","0"),c.setAttribute("aria-valuemax",String(f)),c.setAttribute("aria-valuenow",String(x)),c.setAttribute("aria-label","Import progress");let g=document.createElement("div");g.className="chcm-progress-bar",g.style.width=`${Math.max(0,Math.min(100,x/f*100))}%`,c.append(g),n.append(c)}let u=document.createElement("p");u.className="chcm-progress-text",u.textContent=y,n.append(u)}function H({backAction:r,nextText:y,nextAction:x,nextDisabled:f=!1}){let b=document.createElement("div");b.className="chcm-modal-actions";let d=document.createElement("div"),u=document.createElement("div");if(u.className="chcm-modal-actions-right",r){let A=oe("Back");A.addEventListener("click",r),d.append(A)}let c=oe("Cancel");c.addEventListener("click",()=>{N||G(null)});let g=oe(y,"Button Button--primary");return g.disabled=f,g.addEventListener("click",x),u.append(c,g),b.append(d,u),{actions:b,next:g}}function R(){N=!1,n.replaceChildren();let r=document.createElement("h2");r.id="chcm-wizard-title",r.textContent="1. Select source course";let y=document.createElement("p");y.textContent="Select one cartridge course whose content you want to add.";let x=document.createElement("input");x.type="search",x.className="form-control chcm-course-search",x.placeholder="Search courses\u2026",x.setAttribute("aria-label","Search source courses");let f=document.createElement("div");f.className="chcm-course-list";let b=H({nextText:"Next",nextDisabled:!a,nextAction:async()=>{if(a){b.next.disabled=!0,b.next.textContent="Loading\u2026";try{[w,k]=await Promise.all([canvasGet(`/api/v1/courses/${a.id}/assignments`),canvasGet(`/api/v1/courses/${a.id}/assignment_groups`)]),w=w.filter(u=>{var c;return(c=u.external_tool_tag_attributes)==null?void 0:c.url}),p=new Set,F()}catch(u){console.error(u),alert(`Could not load source course: ${u.message}`),b.next.disabled=!1,b.next.textContent="Next"}}}});function d(){let u=v(x.value);f.replaceChildren(),t.filter(c=>!u||v(c.name).includes(u)||v(c.course_code).includes(u)||String(c.id).includes(u)).forEach(c=>{let g=document.createElement("label");g.className="chcm-course-row";let A=document.createElement("input");A.type="radio",A.name="chcm-source-course",A.value=c.id,A.checked=(a==null?void 0:a.id)===c.id;let T=document.createElement("span"),L=document.createElement("span");L.className="chcm-course-name",L.textContent=c.name||`Course ${c.id}`;let I=document.createElement("span");I.className="chcm-course-code",I.textContent=[c.course_code,`ID: ${c.id}`].filter(Boolean).join(" \u2022 "),T.append(L,I),g.append(A,T),f.append(g),A.addEventListener("change",()=>{a=c,b.next.disabled=!1})})}x.addEventListener("input",d),n.append(r,y,x,f,b.actions),d(),x.focus()}function F(){N=!1,n.replaceChildren();let r=[...new Set(w.map(d=>Y(d.name)).filter(d=>d!==null))].sort((d,u)=>d-u),y=document.createElement("h2");y.id="chcm-wizard-title",y.textContent=`2. Select chapters from ${a.name}`;let x=document.createElement("p");x.textContent="Select one or more chapter numbers to bring into the destination course.";let f=document.createElement("div");f.className="chcm-content-list";let b=H({backAction:R,nextText:"Next",nextDisabled:p.size===0,nextAction:ee});if(r.forEach(d=>{let u=w.filter(I=>Y(I.name)===d).length,c=document.createElement("label");c.className="chcm-course-row";let g=document.createElement("input");g.type="checkbox",g.value=d,g.checked=p.has(d);let A=document.createElement("span"),T=document.createElement("span");T.className="chcm-course-name",T.textContent=`Chapter ${d}`;let L=document.createElement("span");L.className="chcm-course-code",L.textContent=`${u} content item${u===1?"":"s"}`,A.append(T,L),c.append(g,A),f.append(c),g.addEventListener("change",()=>{g.checked?p.add(d):p.delete(d),b.next.disabled=p.size===0})}),!r.length){let d=document.createElement("p");d.textContent="No numbered chapter content was found in this course.",f.append(d)}n.append(y,x,f,b.actions)}function ee(){N=!1,n.replaceChildren();let r=w.filter(l=>{let m=Y(l.name);return m===null||p.has(m)}),y=[],x=new Map,f=[];r.forEach(l=>{let m=de(l.name);if(!m){f.push(l);return}let _=v(m);y.push({assignment:l,key:_,label:m,chapter:Y(l.name)}),x.set(_,(x.get(_)||0)+1)});let b=new Map,d=[];y.forEach(({assignment:l,key:m,label:_,chapter:C})=>{if(C!==null&&x.get(m)===1){d.push({assignment:l,chapter:C,label:_});return}b.has(m)||b.set(m,{key:m,label:_,count:0}),b.get(m).count+=1});let u=[...b.values()].sort((l,m)=>l.label.localeCompare(m.label));d.sort((l,m)=>{var _,C;return((_=l.chapter)!=null?_:0)-((C=m.chapter)!=null?C:0)||l.label.localeCompare(m.label)}),f.sort((l,m)=>l.name.localeCompare(m.name));let c=new Map,g=new Map,A=document.createElement("h2");A.id="chcm-wizard-title",A.textContent=`3. Select content from ${a.name}`;let T=document.createElement("p");T.textContent="Assignment is selected by default. Link creates only a module link. The unpublish icon means the content will not be pulled in.";let L=document.createElement("div");L.className="chcm-legend",L.innerHTML=`
          <span>
            <i class="icon-assignment" aria-hidden="true"></i>
            Assignment
          </span>
          <span>
            <i class="icon-link" aria-hidden="true"></i>
            Link
          </span>
          <span>
            <i class="icon-unpublish" aria-hidden="true"></i>
            Don't pull in
          </span>
        `;function I({label:l,detail:m,actionMap:_,actionKey:C}){_.set(C,"assignment");let M=document.createElement("div");M.className="chcm-content-row";let O=document.createElement("div");O.className="chcm-content-label";let e=document.createElement("span");if(e.textContent=l,O.append(e),m){let i=document.createElement("small");i.textContent=` ${m}`,O.append(i)}let s=document.createElement("div");return s.className="chcm-choice-buttons",[{action:"assignment",icon:"icon-assignment",label:"Import as assignment"},{action:"link",icon:"icon-link",label:"Import as link"},{action:"skip",icon:"icon-unpublish",label:"Do not pull in"}].forEach(i=>{let h=document.createElement("button");h.type="button",h.className="chcm-choice",h.title=`${i.label}: ${l}`,h.setAttribute("aria-label",`${i.label}: ${l}`),h.setAttribute("aria-pressed",i.action==="assignment"?"true":"false"),h.innerHTML=`<i class="${i.icon}" aria-hidden="true"></i>`,i.action==="assignment"&&h.classList.add("is-selected"),h.addEventListener("click",()=>{_.set(C,i.action),s.querySelectorAll(".chcm-choice").forEach(S=>{S.classList.remove("is-selected"),S.setAttribute("aria-pressed","false")}),h.classList.add("is-selected"),h.setAttribute("aria-pressed","true")}),s.append(h)}),M.append(O,s),M}let te=document.createElement("h3");te.textContent="Chapter content types";let j=document.createElement("div");if(j.className="chcm-content-list",u.forEach(l=>{j.append(I({label:l.label,detail:`(${l.count})`,actionMap:c,actionKey:l.key}))}),n.append(A,T,L),u.length&&n.append(te,j),d.length){let l=document.createElement("h3");l.textContent=`Chapter specific (${d.length})`;let m=document.createElement("p");m.textContent="These items only appear in one selected chapter, so choose them individually.";let _=document.createElement("div");_.className="chcm-content-list",d.forEach(({assignment:C,chapter:M})=>{_.append(I({label:C.name,detail:M===null?null:`(Chapter ${M})`,actionMap:g,actionKey:Number(C.id)}))}),n.append(l,m,_)}if(f.length){let l=document.createElement("h3");l.textContent=`Other (${f.length})`;let m=document.createElement("p");m.textContent="These items did not match \u201CChapter/Ch <number> <content type>.\u201D Choose each one individually.";let _=document.createElement("div");_.className="chcm-content-list",f.forEach(C=>{_.append(I({label:C.name,detail:null,actionMap:g,actionKey:Number(C.id)}))}),n.append(l,m,_)}let K=H({backAction:F,nextText:"Add selected content",nextAction:()=>{J({sourceCourse:a,assignments:r,groups:k,selections:{typeActions:c,assignmentActions:g}})}});n.append(K.actions),K.next.focus()}return o.addEventListener("click",r=>{r.target===o&&!N&&G(null)}),n.addEventListener("keydown",r=>{r.key==="Escape"&&!N&&G(null)}),R(),{result:Z,showProgress(r,y){V({title:"Adding content",message:`Do not leave this page or your progress will be lost. ${r} of ${y} processed.`,current:r,total:y})},close(){G(null)}}}async function we(t,o){let n=await P(`/api/v1/courses/${$}/modules`,"POST",U({"module[name]":t}));return o&&await P(`/api/v1/courses/${$}/modules/${n.id}`,"PUT",U({"module[published]":!0})),n}async function ye(t){return P(`/api/v1/courses/${$}/assignment_groups`,"POST",U({name:t}))}async function Ee(t,o){var n,a,p,w;return P(`/api/v1/courses/${$}/assignments`,"POST",U({"assignment[name]":t.name,"assignment[description]":t.description||"","assignment[position]":t.position,"assignment[assignment_group_id]":o,"assignment[submission_types][]":"external_tool","assignment[external_tool_tag_attributes][url]":t.external_tool_tag_attributes.url,"assignment[external_tool_tag_attributes][new_tab]":(n=t.external_tool_tag_attributes.new_tab)!=null?n:!0,"assignment[points_possible]":(a=t.points_possible)!=null?a:0,"assignment[grading_type]":t.grading_type||"points","assignment[omit_from_final_grade]":(p=t.omit_from_final_grade)!=null?p:!1,"assignment[hide_in_gradebook]":(w=t.hide_in_gradebook)!=null?w:!1,"assignment[published]":t.published===!0}))}async function ve(t,o,n){var a,p,w,k;return P(`/api/v1/courses/${$}/assignments/${t}`,"PUT",U({"assignment[name]":o.name,"assignment[description]":o.description||"","assignment[position]":o.position,"assignment[assignment_group_id]":n,"assignment[submission_types][]":"external_tool","assignment[external_tool_tag_attributes][url]":o.external_tool_tag_attributes.url,"assignment[external_tool_tag_attributes][new_tab]":(a=o.external_tool_tag_attributes.new_tab)!=null?a:!0,"assignment[points_possible]":(p=o.points_possible)!=null?p:0,"assignment[grading_type]":o.grading_type||"points","assignment[omit_from_final_grade]":(w=o.omit_from_final_grade)!=null?w:!1,"assignment[hide_in_gradebook]":(k=o.hide_in_gradebook)!=null?k:!1,"assignment[published]":o.published===!0}))}async function Ce(t){return P(`/api/v1/courses/${$}/assignments/${t}`,"DELETE")}async function Ae(t){let o=new URLSearchParams({url:t});return(await canvasGet(`/api/v1/courses/${$}/external_tools/sessionless_launch?${o}`)).id}async function ue({module:t,type:o,title:n,contentId:a,externalUrl:p,position:w,published:k,newTab:N}){let z={"module_item[title]":n,"module_item[type]":o,"module_item[content_id]":a,"module_item[position]":w,"module_item[indent]":0};o==="ExternalTool"&&(z["module_item[external_url]"]=p,z["module_item[new_tab]"]=N!=null?N:!0);let D=await P(`/api/v1/courses/${$}/modules/${t.id}/items`,"POST",U(z));return await P(`/api/v1/courses/${$}/modules/${t.id}/items/${D.id}`,"PUT",U({"module_item[published]":k===!0})),D}async function $e(t,o){return P(`/api/v1/courses/${$}/modules/${t}/items/${o}`,"DELETE")}async function Ne(){let t=await re(`/courses/${$}/undelete`,"GET");return[...new DOMParser().parseFromString(t,"text/html").querySelectorAll('a[href*="/undelete/assignment_"], form[action*="/undelete/assignment_"]')].map(n=>{let a=n.getAttribute("action")||n.getAttribute("href")||"",p=a.match(/\/undelete\/assignment_(\d+)/);if(!p)return null;let w=n.closest("li, tr, .item, .ic-Table__row")||n.parentElement,k=String((w==null?void 0:w.textContent)||n.textContent||"").replace(/\brestore\b/gi,"").replace(/\s+/g," ").trim();return{id:Number(p[1]),name:k,restorePath:a}}).filter(Boolean)}async function ke(t){await re(t,"POST")}async function Le(t,o){var O;let{assignments:n,groups:a,selections:p}=t,w=new Map(a.map(e=>[Number(e.id),e])),k=n.filter(e=>me(e,p)!=="skip"),[N,z,D]=await Promise.all([canvasGet(`/api/v1/courses/${$}/modules`),canvasGet(`/api/v1/courses/${$}/assignment_groups`),canvasGet(`/api/v1/courses/${$}/assignments`)]),Z=(await Promise.all(N.map(async e=>(await canvasGet(`/api/v1/courses/${$}/modules/${e.id}/items`)).map(s=>({...s,module_id:e.id}))))).flat(),J=new Map(N.map(e=>[v(e.name),e])),G=new Map(z.map(e=>[v(e.name),e])),V=new Map,H=new Map,R=new Map,F=new Map(N.map(e=>[e.id,Z.filter(s=>Number(s.module_id)===Number(e.id))])),ee=new Map,r=null;function y(e,s){return[v(e),v(s)].join("|")}function x(e,s,i){s&&(e.has(s)||e.set(s,[]),e.get(s).push(i))}function f(e,s,i){if(!e.has(s))return;let h=e.get(s).filter(S=>!i(S));h.length?e.set(s,h):e.delete(s)}function b(e){var i;let s=v((i=e.external_tool_tag_attributes)==null?void 0:i.url);s&&(V.set(y(e.name,s),e),x(H,s,e))}function d(e){var i;let s=v((i=e.external_tool_tag_attributes)==null?void 0:i.url);s&&(V.delete(y(e.name,s)),f(H,s,h=>Number(h.id)===Number(e.id)))}function u(e){let s=v(e.external_url);s&&x(R,s,e)}function c(e){let s=v(e.external_url);s&&f(R,s,i=>Number(i.id)===Number(e.id)&&Number(i.module_id)===Number(e.module_id))}D.forEach(b),Z.filter(e=>e.type==="ExternalTool").forEach(u);async function g(e){return F.get(e)||[]}async function A(){return r||(r=Ne()),r}async function T(e){let s=await A(),i=v(e.name);return s.find(h=>v(h.name)===i)||null}function L(e){r&&(r=r.then(s=>s.filter(i=>Number(i.id)!==Number(e))))}async function I(e){let s=v(e.name),i=J.get(s);if(!i){let h=k.some(S=>Number(S.assignment_group_id)===Number(e.id)&&S.published===!0);i=await we(e.name,h),J.set(s,i),F.set(i.id,[])}return i}async function te(e){let s=v(e.name),i=G.get(s);return i||(i=await ye(e.name),G.set(s,i)),i}let j=[],K=[],l=[],m=[],_=[],C=[],M=[];for(let e=0;e<n.length;e++){let s=n[e],i=me(s,p);o.showProgress(e+1,n.length);try{if(i==="skip"){C.push(s.name);continue}let h=w.get(Number(s.assignment_group_id));if(!h)throw new Error("Source assignment group not found");let S=await I(h),ae=await g(S.id),W=s.external_tool_tag_attributes.url,ne=v(W),he=ne?[...H.get(ne)||[]]:[],ge=ne?[...R.get(ne)||[]]:[];if(i==="link"){if(ge.length){C.push(s.name);continue}for(let X of he)await Ce(X.id),d(X),m.push(s.name),F.forEach(Q=>{for(let se=Q.length-1;se>=0;se--){let be=Q[se];be.type==="Assignment"&&Number(be.content_id)===Number(X.id)&&Q.splice(se,1)}});let E=ee.get(W);E||(E=await Ae(W),ee.set(W,E));let q=await ue({module:S,type:"ExternalTool",title:s.name,contentId:E,externalUrl:W,position:s.position,published:s.published===!0,newTab:(O=s.external_tool_tag_attributes.new_tab)!=null?O:!0});q.module_id=S.id,ae.push(q),u(q),K.push(s.name);continue}if(he.length){C.push(s.name);continue}for(let E of ge){await $e(E.module_id,E.id);let q=await g(E.module_id),X=q.findIndex(Q=>Number(Q.id)===Number(E.id));X>=0&&q.splice(X,1),c(E),_.push(s.name)}let fe=await te(h),Ie=[v(s.name),W].join("|"),B=V.get(Ie);if(!B){let E=await T(s);E?(await ke(E.restorePath),L(E.id),B=await ve(E.id,s,fe.id),l.push(s.name)):B=await Ee(s,fe.id),b(B)}if(!ae.find(E=>E.type==="Assignment"&&Number(E.content_id)===Number(B.id))){let E=await ue({module:S,type:"Assignment",title:B.name,contentId:B.id,position:s.position,published:B.published===!0});ae.push(E)}j.push(s.name)}catch(h){console.error(`Failed to add "${s.name}"`,h),M.push({assignment:s.name,error:h.message})}}console.table(j.map(e=>({assignment:e}))),console.table(K.map(e=>({link:e}))),console.table(l.map(e=>({restoredAssignment:e}))),console.table(m.map(e=>({replacedAssignmentWithLink:e}))),console.table(_.map(e=>({replacedLinkWithAssignment:e}))),console.table(M),alert([`Assignments added: ${j.length}`,`Links added: ${K.length}`,`Assignments restored: ${l.length}`,`Not pulled in: ${C.length}`,`Failed: ${M.length}`].join(`
`))}async function Se(t){let o=t.innerHTML;t.disabled=!0,t.textContent="Loading courses\u2026";try{let n=await canvasGet("/api/v1/accounts/4495/courses?state[]=created&state[]=claimed&state[]=available");n.sort((w,k)=>String(w.name||"").localeCompare(String(k.name||""))),t.disabled=!1,t.innerHTML=o;let a=_e(n),p=await a.result;if(!p)return;t.disabled=!0,await Le(p,a),a.close(),location.reload()}catch(n){console.error("CHCM content import stopped",n),alert(`Import stopped: ${n.message}`)}finally{t.disabled=!1,t.innerHTML=o}}function Te(){if(document.getElementById(ie))return;let t=document.querySelector("#course_show_secondary #course_status");if(!t)return;let o=document.createElement("button");o.id=ie,o.type="button",o.className="btn button-sidebar-wide",o.innerHTML='<i class="icon-import" aria-hidden="true"></i> Import CHCM Content',o.addEventListener("click",()=>Se(o)),t.insertAdjacentElement("afterend",o)}Te()})();})();
