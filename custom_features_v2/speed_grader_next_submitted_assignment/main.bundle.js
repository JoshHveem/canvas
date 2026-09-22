(()=>{function g(e){let t=$(`
    <div role="alert" aria-live="polite"
         style="position: fixed; right: 16px; bottom: 16px; z-index: 9999;
                background: #2e7d32; color: #fff; padding: 12px 16px;
                border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,.2);
                font-size: 14px;">
      ${e}
    </div>
  `);$("body").append(t),setTimeout(()=>t.fadeOut(200,()=>t.remove()),3e3)}function f(e){let t=$(`
  <button
    id="next-assignment-button"
    aria-label="Next Assignment"
    style="
      background:none;
      border:none;
      padding:0;
      cursor:pointer;
      color:white;
      display:flex;
      flex-direction:column;
      align-items:center;
    "
    class="Button"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"
         width="20" height="20" aria-hidden="true" fill="currentColor">
      <path d="M16 1V15H9V13H14V3H9V1L16 1Z"/>
      <path d="M6 4V7L0 7L0 9H6V12H7L11 8L7 4H6Z"/>
    </svg>

    <span style="margin-top:4px;font-size:10px;line-height:1;">NEXT</span>
  </button>
  `);return t.on("click",function(){let n=$(this).data("submittedIds")||[];if(!Array.isArray(n)||n.length===0){g("All current submissions graded");return}let i=Number((window.location.search.match(/(?:\?|&)assignment_id=(\d+)/)||[])[1]),r=n.length,o=n.indexOf(i),d=o>=0?(o+1)%r:0,s=n[d];console.log(n);let a=`/courses/${ENV.course_id}/gradebook/speed_grader?assignment_id=${s}&student_id=${e}`;window.location.href=a}),t}function c(e,t){let n=$('[data-testid="student-navigation-flex"]');if(n.length===0)return;let i=n.find("#next-assignment-button");i.length===0&&(i=f(t),n.append(i)),i.data("submittedIds",Array.isArray(e)?e:[])}function h(e){return new Promise(t=>setTimeout(t,e))}function w(){let e=window.location.search.match(/[?&]assignment_id=([0-9]+)/),t=window.location.search.match(/[?&]student_id=([0-9]+)/),n=window.location.href.match(/\/courses\/([0-9]+)/);return!e||!t||!n?null:{course_id:Number(n[1]),assignment_id:Number(e[1]),student_id:Number(t[1])}}async function m({intervalMs:e=200,maxRetries:t=10}={}){let n=window.location.href;for(let i=0;i<=t;i++){let r=w();if(r)return r;if(window.location.href!==n)return console.warn("URL changed while waiting for pieces; restarting wait."),m({intervalMs:e,maxRetries:t});console.warn(`Missing URL pieces (attempt ${i+1}/${t+1}); retrying in 1s...`,{href:window.location.href,search:window.location.search}),await h(e)}throw new Error("URL pieces never became available (course_id/assignment_id/student_id).")}async function b(){let{student_id:e}=await m({intervalMs:200,maxRetries:10}),t=[];c(t,e);let n=await canvasGet(`/api/v1/courses/${ENV.course_id}/students/submissions`,{student_ids:[e],workflow_state:"submitted",per_page:100});Array.isArray(n)&&n.length>0&&(n.sort((s,a)=>{let u=new Date(s.submitted_at||0).getTime(),l=new Date(a.submitted_at||0).getTime();return u!==l?u-l:Number(s.assignment_id||0)-Number(a.assignment_id||0)}),t=n.map(s=>Number(s.assignment_id)).filter(Number.isFinite)),c(t,e);let i=!1;new MutationObserver(()=>{i||(i=!0,requestAnimationFrame(()=>{i=!1,c(t,e)}))}).observe($("main")[0],{childList:!0,subtree:!0});let o=0,d=setInterval(()=>{o++,c(t,e),($("#next-assignment-button").length>0||o>=20)&&clearInterval(d)},250)}$(document).ready(()=>{b().catch(e=>{console.error("Next Assignment init failed:",e)})});})();
