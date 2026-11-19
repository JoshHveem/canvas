(async function() {
let transferNavigation = $(`<a data-tool-launch-type="transfer_navigation" data-tool-launch-method="" class="Button Button--link Button--link--has-divider"><i class="icon-export-content"></i>Transfer Navigation</a>`);
$('#right-side div table.summary').before(transferNavigation);
function createModal() {
    let modal = $(`
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
    `);
    $("body").append(modal);
    return modal;
  }
transferNavigation.click(async function () {
    let modal = createModal();
    
    let templateCourse = (await canvasGet(`/api/v1/courses/${CURRENT_COURSE_ID}`))[0];
    let sisterCourses = await canvasGet(`/api/v1/accounts/${templateCourse.account_id}/courses?enrollment_term_id=${templateCourse.enrollment_term_id}`);
    let templateTabs = await canvasGet(`/api/v1/courses/${templateCourse.id}/tabs`);
    let order = [];
    for (let t in templateTabs) {
        let tab = templateTabs[t];
        if (tab.label == "Home" || tab.label == "Settings") continue;
       order[tab.position] = tab;
        // await $.put(`/api/v1/courses/${CURRENT_COURSE_ID}/tabs/${tab.id}`, {
        //     position: index > 0 ? index : nextIndex++,
        //     hidden: (index == -1)
        // })
    }
    
    $(".btech-modal #tab-progress-bar").empty();
    $(".btech-modal #tab-progress-bar").append('<progress max="100" value="0" aria-label="Navigation progress" style="width: 100%;"></progress>');
    $(".btech-modal #course-progress-bar").empty();
    $(".btech-modal #course-progress-bar").append('<progress max="100" value="0" aria-label="Course progress" style="width: 100%;"></progress>');
    $(".btech-modal #tab-progress-bar progress").css("accent-color", "#CF2247");
    
    for (let c in sisterCourses) {
        let course = sisterCourses[c];
        let progress = ((parseInt(c) + 1) / sisterCourses.length) * 100;
        $(".btech-modal #course-progress-bar").find("progress").val(progress);
        $('.btech-modal #copy-message').html(`${course.name} (${parseInt(c) + 1} / ${sisterCourses.length})`);
        for (let o in order) {
            let tab = order[o];
            let progress = ((parseInt(o) + 1) / order.length) * 100;
            $(".btech-modal #tab-progress-bar").find("progress").val(progress);
            if (tab !== undefined) {
                try {
                  await $.put(`/api/v1/courses/${course.id}/tabs/${tab.id}`, {
                      position: tab.position,
                      hidden: tab.hidden ?? false
                  })
                } catch (err) {
                  console.error(err);
                }
            }
        }
    }
    modal.remove();
});

})();
