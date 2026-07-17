addToModuleMenu("Delete Content", "Delete all content from the course.", async (event, courseId, moduleId, item) => {  
  event.preventDefault(); 
  let loadBar = $(`
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
      `);
  $("body").append(loadBar);
  $("#delete-items-progress-bar-buttons button.no").click(async function() {
      $(loadBar).remove();
  });
  $("#delete-items-progress-bar-buttons button.yes").click(async function() {
      $(`#context_module_${moduleId}`).css({
          'opacity': '50%'
      });
      $("#delete-items-progress-bar").empty();
      $("#delete-items-progress-bar-buttons").remove();
      $("#delete-items-progress-bar").progressbar({
          value: 0
      });
      let moduleItems = await canvasGet(`/api/v1/courses/${courseId}/modules/${moduleId}/items?include[]=content_details`);
      let deleteFuncs = {
          'ExternalUrl': async (moduleItem) => {
              //do nothing, this will get deleted when module is deleted
              await $.delete(moduleItem.html_url.replace('module_item_redirect', `modules/${moduleItem.module_id}/items`));
              return;
          },
          'ExternalTool': async (moduleItem) => {
              //do nothing, this will get deleted when module is deleted
              await $.delete(moduleItem.html_url);
              return;
          },
          'Page': async (moduleItem) => {
              await $.delete(moduleItem.url);
              return;
          },
          'Assignment': async (moduleItem) => {
              await $.delete(moduleItem.url);
              return;
          },
          'Quiz': async (moduleItem) => {
              await $.delete(moduleItem.url);
              return;
          },
          'Discussion': async (moduleItem) => {
              await $.delete(moduleItem.url);
              return;
          }
      }
      for (let m in moduleItems) {
          let moduleItem = moduleItems[m];
          await deleteFuncs[moduleItem.type](moduleItem);
          $(`#context_module_item_${moduleItem.id}`).remove();
          $("#delete-items-progress-bar").progressbar({
                value: ((m + 1) / (moduleItems.length + 1)) * 100
          })
      }
      loadBar.remove();
      // //await $.delete(`/api/v1/courses/${courseId}/modules/${moduleId}`);
      // location.reload();
      $(`#context_module_${moduleId}`).css({
          'opacity': '100%'
      });
  })
}, "icon-trash");