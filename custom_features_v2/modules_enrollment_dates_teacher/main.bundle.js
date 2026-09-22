(()=>{(async function(){function h(e){if(!e)return"N/A";let n=e.getUTCFullYear();if(!n)return"N/A";let t=("0"+(e.getUTCMonth()+1)).slice(-2);if(!t)return"N/A";let l=("0"+e.getDate()).slice(-2);return l?`${n}-${t}-${l}`:"N/A"}$(".unconclude_enrollment_link_holder").css("display")=="none"&&$(".conclude_enrollment_link_holder").css("display","block");function d(e){var n,t;$.post(`/api/v1/courses/${ENV.COURSE_ID}/enrollments`,{enrollment:{start_at:(t=(n=e.start_at)!=null?n:e.created_at)!=null?t:new Date,end_at:"",user_id:e.user.id,course_section_id:e.course_section_id,type:e.type,enrollment_state:"active",notify:!1}})}function u(e,n){var l,s;if(!n)return;let t=new Date(n);t.setDate(t.getDate()+1),t.setTime(t.getTime()+360*60*1e3),$.post(`/api/v1/courses/${ENV.COURSE_ID}/enrollments`,{enrollment:{start_at:(s=(l=e.start_at)!=null?l:e.created_at)!=null?s:new Date,end_at:t,user_id:e.user.id,course_section_id:e.course_section_id,type:e.type,enrollment_state:"active",notify:!1}})}let _=await $.get(`/api/v1/courses/${ENV.COURSE_ID}/enrollments?user_id=${ENV.USER_ID}`),o={};_.forEach(e=>{e.course_section_id&&(o[e.course_section_id]=e)});let f=!!window.IS_DEPARTMENT_HEAD||ENV.ACCOUNT_ID=="3819"||ENV.ACCOUNT_ID=="3866"||ENV.ACCOUNT_ID=="3832";$("tr.enrollment").each(function(){let e=$(this),t=(e.find("td:first a").attr("href")||"").match(/sections\/(\d+)/);if(!t)return;let l=parseInt(t[1],10),s=o[l];if(!s)return;let a="";if(s.end_at){let r=new Date(s.end_at),m=("0"+r.getDate()).slice(-2),p=("0"+(r.getMonth()+1)).slice(-2);a=`${r.getFullYear()}-${p}-${m}`}let i;if(!f){i=$(`
        <td class="btech-end-date-cell" style="vertical-align: top;">
          <div class="btech-enrollment-end-date-row" style="margin-top: 0.5rem;">
            <div style="margin-bottom: 0.25rem;">
              <span style="font-weight: bold;">Enrollment End Date</span>
            </div>
            <div>
              ${a||"\u2014"}
            </div>
          </div>
        </td>
      `),e.append(i);return}i=$(`
      <td class="btech-end-date-cell" style="vertical-align: top;">
        <div class="btech-enrollment-end-date-row" style="margin-top: 0.5rem;">
          <div style="margin-bottom: 0.25rem;">
            <span style="font-weight: bold;">Set Enrollment End Date</span>
          </div>
          <div>
            <input
              style="width: auto;"
              type="date"
              class="btech-enrollment-end-date"
              value="${a}"
            >
            <button
              type="button"
              class="btech-enrollment-reset"
              style="cursor: pointer; margin-left: 0.5rem;"
            >
              Reset
            </button>
          </div>
        </div>
      </td>
    `),e.append(i);let c=i.find(".btech-enrollment-end-date");i.find(".btech-enrollment-reset").on("click",function(){c.val(""),d(s)}),c.on("change",function(){u(s,this.value)})})})();})();
