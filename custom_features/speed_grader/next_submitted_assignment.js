// == Next Assignment Button (Observer Format) ==
function showSuccessToast(message) {
  // Minimal green toast; auto-removes after 3s
  const toast = $(`
    <div role="alert" aria-live="polite"
         style="
           position: fixed; right: 16px; bottom: 16px; z-index: 9999;
           background: #2e7d32; color: #fff; padding: 12px 16px;
           border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,.2);
           font-size: 14px;">
      ${message}
    </div>
  `);
  $('body').append(toast);
  setTimeout(() => toast.fadeOut(200, () => toast.remove()), 3000);
}

function createNextButton() {
  const btn = $(`
    <button id="next-assignment-button"
            class="Button Button--icon-action gradebookMoveToNext next"
            type="button"
            aria-label="Next Assignment">
      <i class="icon-assignment next" aria-hidden="true">Next</i>
    </button>
  `);

  btn.on('click', function () {
    const nextUrl = $(this).data('nextUrl');
    if (nextUrl) {
      window.location.href = nextUrl;
    } else {
      showSuccessToast('All current submissions graded');
    }
  });

  return btn;
}

function ensureNextButton(container, nextUrl) {
  let btn = $('#next-assignment-button');
  if (btn.length === 0) {
    btn = createNextButton().appendTo(container);
  }
  // Always keep the latest destination (or undefined) on the button
  btn.data('nextUrl', nextUrl);
}

async function postLoad() {
  // Figure out student_id from current SpeedGrader URL
  const rUrl = /\/courses\/([0-9]+)\/gradebook\/speed_grader\?assignment_id=([0-9]+)&student_id=([0-9]+)/;
  const pieces = window.location.href.match(rUrl);
  if (!pieces) return;

  const student_id = parseInt(pieces[3], 10);

  // Target container where the button lives in SpeedGrader
  const container = $('#gradebook_header .studentSelection');
  if (container.length === 0) return;

  // Add the button immediately (will show toast until we know a next URL)
  ensureNextButton(container, undefined);

  // Pull submitted assignments for the student
  let submissions = await canvasGet(`/api/v1/courses/${ENV.course_id}/students/submissions`, {
    student_ids: [student_id],
    workflow_state: 'submitted'
  });

  // Compute next assignment URL if possible
  let nextUrl;
  if (Array.isArray(submissions) && submissions.length > 0) {
    // Sort by something stable if needed; assuming API returns in desired order already
    let nextAssignment = undefined;
    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      if (submission.assignment_id === ENV.assignment_id) {
        if (i !== submissions.length - 1) nextAssignment = submissions[i + 1];
        break;
      }
    }
    if (nextAssignment && nextAssignment.assignment_id) {
      nextUrl = `/courses/${ENV.course_id}/gradebook/speed_grader?assignment_id=${nextAssignment.assignment_id}&student_id=${student_id}`;
    }
  }

  // Update the button with the computed nextUrl (or leave undefined for toast)
  ensureNextButton(container, nextUrl);

  // Keep it present as the DOM changes
  const observer = new MutationObserver((mutationsList) => {
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
    console.error('Next Assignment observer init failed:', e);
  }
})();
