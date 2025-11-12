/*
    YOU CAN CREATE AN ANSWER KEY FOR A GIVEN ASSIGNMENT AS AN UNPUBLISHED PAGE
    THE PAGE MUST HAVE THE EXACT SAME TITLE AS THE ASSIGNMENT  + ' Answer Key'
    UNSURE IF USED
*/
(async function() {
  pages = await canvasGet("/api/v1/courses/" + ENV.course_id + "/pages");
  for (let p in pages) {
      let page_info = pages[p];
      if (page_info.title.toLowerCase() == (ENV.assignment_title + " Answer Key").toLowerCase()) {
          $.post('https://tracking.bridgetools.dev/api/hit', {
            'tool': 'answer_key',
            'canvasId': ENV.current_user_id
          });
          let page = (await canvasGet("/api/v1/courses/" + ENV.course_id + "/pages/" + page_info.url))[0];
          let button = $(`<span><i style="cursor: pointer;" class="icon-info"></i></span>`);
          let answerKey = $(`
          <div class='btech-modal' style='display: inline-block;'>
              <div class='btech-modal-content' style='max-width: 500px;'>
                  <div class='btech-modal-content-inner'>
                      ` + page.body + `
                  </div>
              </div>
          </div>`);
          $("body").append(answerKey);
          answerKey.hide();
          button.click(function() {
              answerKey.show();
          });
          answerKey.click(function() {
              answerKey.hide();
          });
          $("#speedgrader-icons").append(button);
      }
  }
})();