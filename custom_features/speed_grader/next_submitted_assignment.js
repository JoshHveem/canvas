// == Next Assignment Button (Observer Format) ==
function createNextButton(nextUrl) {
  const btn = $(`
    <button id="next-assignment-button"
            class="Button Button--icon-action gradebookMoveToNext next"
            type="button"
            aria-label="Next Assignment">
      <i class="icon-assignment next" aria-hidden="true">Next</i>
    </button>
  `);
  btn.on('click', function () {
    window.location.href = nextUrl;
  });
  return btn;
}

function ensureNextButton(container, nextUrl) {
  if (!nextUrl) return; // nothing to add if we don't have a destination
  if ($('#next-assignment-button').length === 0) {
    container.append(createNextButton(nextUrl));
  }
}

async function postLoad() {
  // Figure out student_id from current SpeedGrader URL
  const rUrl = /\/courses\/([0-9]+)\/gradebook\/speed_grader\?assignment_id=([0-9]+)&student_id=([0-9]+)/;
  const pieces = window.location.href.match(rUrl);
  if (!pieces) return;

  const student_id = parseInt(pieces[3], 10);

  // Pull submitted assignments for the student
  let submissions = await canvasGet(`/api/v1/courses/${ENV.course_id}/students/submissions`, {
    student_ids: [student_id],
    workflow_state: 'submitted'
  });
  console.log(submissions)

  if (!Array.isArray(submissions) || submissions.length === 0) return;

  // Determine "next" assignment relative to current ENV.assignment_id
  let nextAssignment = submissions[0];
  for (let i = 0; i < submissions.length; i++) {
    const submission = submissions[i];
    if (submission.assignment_id === ENV.assignment_id) {
      if (i !== submissions.length - 1) {
        nextAssignment = submissions[i + 1];
      } else {
        // we're on the last submitted item; no next destination
        nextAssignment = undefined;
      }
      break;
    }
  }

  // Build next URL if available
  let nextUrl = undefined;
  if (nextAssignment && nextAssignment.assignment_id) {
    nextUrl = `/courses/${ENV.course_id}/gradebook/speed_grader?assignment_id=${nextAssignment.assignment_id}&student_id=${student_id}`;
  }

  // Target container where the button lives in SpeedGrader
  const container = $('#gradebook_header .studentSelection');
  if (container.length === 0) return;

  // Initial ensure
  ensureNextButton(container, nextUrl);

  // Keep it present as the DOM changes
  const observer = new MutationObserver((mutationsList) => {
    console.log('ran mutation observer for next assignment button');
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        ensureNextButton(container, nextUrl);
      }
    }
  });
  observer.observe(container[0], { childList: true, subtree: false });
}

// Kick it off (same pattern as your example)
(async function () {
  try {
    await postLoad();
  } catch (e) {
    // optional: log or swallow
    console.error('Next Assignment observer init failed:', e);
  }
})();
