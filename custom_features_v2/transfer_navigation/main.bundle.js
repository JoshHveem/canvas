(()=>{(async function(){let l=$('<a data-tool-launch-type="transfer_navigation" data-tool-launch-method="" class="Button Button--link Button--link--has-divider"><i class="icon-export-content"></i>Transfer Navigation</a>');$("#right-side div table.summary").before(l);function p(){let t=$(`
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
    `);return $("body").append(t),t}l.click(async function(){var c;let t=p(),i=(await canvasGet(`/api/v1/courses/${CURRENT_COURSE_ID}`))[0],s=await canvasGet(`/api/v1/accounts/${i.account_id}/courses?enrollment_term_id=${i.enrollment_term_id}`),n=await canvasGet(`/api/v1/courses/${i.id}/tabs`),r=[];for(let a in n){let e=n[a];e.label=="Home"||e.label=="Settings"||(r[e.position]=e)}$(".btech-modal #tab-progress-bar").empty(),$(".btech-modal #tab-progress-bar").append('<progress max="100" value="0" aria-label="Navigation progress" style="width: 100%;"></progress>'),$(".btech-modal #course-progress-bar").empty(),$(".btech-modal #course-progress-bar").append('<progress max="100" value="0" aria-label="Course progress" style="width: 100%;"></progress>'),$(".btech-modal #tab-progress-bar progress").css("accent-color","#CF2247");for(let a in s){let e=s[a],b=(parseInt(a)+1)/s.length*100;$(".btech-modal #course-progress-bar").find("progress").val(b),$(".btech-modal #copy-message").html(`${e.name} (${parseInt(a)+1} / ${s.length})`);for(let d in r){let o=r[d],g=(parseInt(d)+1)/r.length*100;if($(".btech-modal #tab-progress-bar").find("progress").val(g),o!==void 0)try{await $.put(`/api/v1/courses/${e.id}/tabs/${o.id}`,{position:o.position,hidden:(c=o.hidden)!=null?c:!1})}catch(m){console.error(m)}}}t.remove()})})();})();
