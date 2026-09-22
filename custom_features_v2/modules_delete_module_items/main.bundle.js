(()=>{addToModuleMenu("Delete Content","Delete all content from the course.",async(a,l,t,n)=>{a.preventDefault();let s=$(`
      <div class='btech-modal' style='display: inline-block;'>
          <!-- ERASE THE DISPLAY PIECE BEFORE GOING LIVE -->
          <div class='btech-modal-content' style='max-width: 500px;'>
              <div class='btech-modal-content-inner'>
                  <div id="delete-items-progress-message"></div>
                  <div id="delete-items-progress-bar">You are about to delete all of the items from this module from your course. Are you sure this is what you want to do?</div>
  <div id='delete-items-progress-bar-buttons' style='width: 100%; text-align: center;'><button class='yes btn button-sidebar-wide'>Yes</button><button class='no btn button-sidebar-wide'>No</button></div>
              </div>
          </div>
      </div>
      `);$("body").append(s),$("#delete-items-progress-bar-buttons button.no").click(async function(){$(s).remove()}),$("#delete-items-progress-bar-buttons button.yes").click(async function(){$(`#context_module_${t}`).css({opacity:"50%"}),$("#delete-items-progress-bar").empty(),$("#delete-items-progress-bar-buttons").remove(),$("#delete-items-progress-bar").progressbar({value:0});let r=await canvasGet(`/api/v1/courses/${l}/modules/${t}/items?include[]=content_details`),i={ExternalUrl:async e=>{await $.delete(e.html_url.replace("module_item_redirect",`modules/${e.module_id}/items`))},ExternalTool:async e=>{await $.delete(e.html_url)},Page:async e=>{await $.delete(e.url)},Assignment:async e=>{await $.delete(e.url)},Quiz:async e=>{await $.delete(e.url)},Discussion:async e=>{await $.delete(e.url)}};for(let e in r){let o=r[e];await i[o.type](o),$(`#context_module_item_${o.id}`).remove(),$("#delete-items-progress-bar").progressbar({value:(e+1)/(r.length+1)*100})}s.remove(),$(`#context_module_${t}`).css({opacity:"100%"})})},"icon-trash");})();
