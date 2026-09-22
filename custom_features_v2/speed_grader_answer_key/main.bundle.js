(()=>{(async function(){pages=await canvasGet("/api/v1/courses/"+ENV.course_id+"/pages");for(let i in pages){let s=pages[i];if(s.title.toLowerCase()==(ENV.assignment_title+" Answer Key").toLowerCase()){$.post("https://tracking.bridgetools.dev/api/hit",{tool:"answer_key",canvasId:ENV.current_user_id});let t=(await canvasGet("/api/v1/courses/"+ENV.course_id+"/pages/"+s.url))[0],a=$('<span><i style="cursor: pointer;" class="icon-info"></i></span>'),e=$(`
          <div class='btech-modal' style='display: inline-block;'>
              <div class='btech-modal-content' style='max-width: 500px;'>
                  <div class='btech-modal-content-inner'>
                      `+t.body+`
                  </div>
              </div>
          </div>`);$("body").append(e),e.hide(),a.click(function(){e.show()}),e.click(function(){e.hide()}),$("#speedgrader-icons").append(a)}}})();})();
