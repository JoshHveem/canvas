(async function() {
  return;
  function createModal() {
      let modal = $(`
            <div class='btech-modal' style='display: inline-block;'>
                <!-- ERASE THE DISPLAY PIECE BEFORE GOING LIVE -->
                <div class='btech-modal-content' style='max-width: 500px;'>
                    <div class='btech-modal-content-inner'>
                        <p>Briefly describe what is broken</p>
                        <textarea style="width: 100%; box-sizing: border-box;" id="broken-content-message"></textarea>
                        <button id="broken-content-message-submit">Submit</button>
                    </div>
                </div>
            </div>
      `);
      $("body").append(modal);
      $("#broken-content-message").focus();
      // setTimeout(function() {
      //     document.getElementById("broken-content-message").focus();
      // }, 1);
      return modal;
    }

  let teachers = await canvasGet(`/api/v1/courses/${ENV.COURSE_ID}/enrollments?role[]=Lead%20Teacher`);
  if (teachers.length == 0) teachers = await canvasGet(`/api/v1/courses/${ENV.COURSE_ID}/enrollments?role[]=TeacherEnrollment`);

  let teacherIds = [];
  for (let t in teachers) {
      let teacher = teachers[t];
      teacherIds.push(teacher.user_id);
  }

  let ISDID = 2157883;
  teacherIds.push(ISDID); // add ISD
  teacherIds = [ISDID];

  let button = $('<a class="btn report_broken_content"><img id="damageFileIcon" src="https://bridgetools.dev/canvas/media/icons/damage-file-icon.svg" alt="Damaged File Icon" style="width: 1rem;"> Report Broken Content</a>');
  button.click(async () => {
      let modal = createModal();
      $('#broken-content-message-submit').click(async () => {
          await $.post(`/api/v1/conversations`, {
              recipients: teacherIds,
              subject: `Broken Content Course ${ENV.COURSE_ID}`,
              force_new: true,
              body: `Something is broken on this page:\n${window.location.href}\n\nStudentComment:\n${$('#broken-content-message').val()}`
          });
          modal.remove();
      });
  });
  $('.right-of-crumbs').append(button);
})();