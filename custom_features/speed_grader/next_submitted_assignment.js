(async function () {
  let rUrl = /\/courses\/([0-9]+)\/gradebook\/speed_grader\?assignment_id=([0-9]+)&student_id=([0-9]+)/;
  let student_id = parseInt(window.location.href.match(rUrl)[3]);
  let submissions = await canvasGet("/api/v1/courses/" + ENV.course_id + "/students/submissions", {
    'student_ids': [
      student_id
    ],
    'workflow_state': 'submitted'
  });
  let nextAssignment = submissions[0];
  for (let i = 0; i < submissions.length; i++) {
    let submission = submissions[i];
    if (submission.assignment_id == ENV.assignment_id) {
      if (i !== submissions.length - 1) {
        nextAssignment = submissions[i + 1];
        break;
      }
    }
  }
  let nextAssignmentButton = $(`
    <button id="next-assignment-button" class="Button Button--icon-action gradebookMoveToNext next" type="button" aria-label="Next Assignment">
      <i class="icon-assignment next" aria-hidden="true">Next</i>
    </button>
  `);
  let url = "/courses/" + ENV.course_id + "/gradebook/speed_grader?assignment_id=" + nextAssignment.assignment_id + "&student_id=" + student_id;
  nextAssignmentButton.click(function () {
    window.location.href = (url);
  });
  $("#gradebook_header .subheadContent--flex-end .studentSelection").append(nextAssignmentButton);;
})();