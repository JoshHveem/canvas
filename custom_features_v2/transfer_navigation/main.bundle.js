(()=>{var d=$('<a data-tool-launch-type="transfer_navigation" data-tool-launch-method="" class="Button Button--link Button--link--has-divider"><i class="icon-export-content"></i>Transfer Navigation</a>');$("#right-side div table.summary").before(d);function m(){let t=$(`
          <div class='btech-modal' style='display: inline-block;'>
              <!-- ERASE THE DISPLAY PIECE BEFORE GOING LIVE -->
              <div class='btech-modal-content' style='max-width: 500px;'>
                  <div class='btech-modal-content-inner'>
                      <div id="copy-message">Copying navigation to other courses...</div>
                      <div id="course-progress-bar">-</div>
                      <div id="tab-progress-bar">-</div>
                  </div>
              </div>
          </div>
    `);return $("body").append(t),t}d.click(async function(){var n;let t=m(),i=(await canvasGet(`/api/v1/courses/${CURRENT_COURSE_ID}`))[0],r=await canvasGet(`/api/v1/accounts/${i.account_id}/courses?enrollment_term_id=${i.enrollment_term_id}`),l=await canvasGet(`/api/v1/courses/${i.id}/tabs`),s=[];for(let a in l){let e=l[a];e.label=="Home"||e.label=="Settings"||(s[e.position]=e)}$(".btech-modal #tab-progress-bar").empty(),$(".btech-modal #tab-progress-bar").progressbar({value:0}),$(".btech-modal #course-progress-bar").empty(),$(".btech-modal #course-progress-bar").progressbar({value:0}),$(".btech-modal #tab-progress-bar .ui-progressbar-value").css("background","#CF2247");for(let a in r){let e=r[a],b=(parseInt(a)+1)/r.length*100;$(".btech-modal #course-progress-bar").progressbar({value:b}),$(".btech-modal #copy-message").html(`${e.name} (${parseInt(a)+1} / ${r.length})`);for(let c in s){let o=s[c],p=(parseInt(c)+1)/s.length*100;if($(".btech-modal #tab-progress-bar").progressbar({value:p}),o!==void 0)try{await $.put(`/api/v1/courses/${e.id}/tabs/${o.id}`,{position:o.position,hidden:(n=o.hidden)!=null?n:!1})}catch(u){console.error(u)}}}t.remove()});})();
