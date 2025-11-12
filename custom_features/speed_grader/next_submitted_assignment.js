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

  const student_id = Number(pieces[3]);

  // Target container where the button lives in SpeedGrader
  const container = $('#gradebook_header .studentSelection');
  if (container.length === 0) return;

  // Add the button immediately (will show toast until we know a next URL)
  ensureNextButton(container, undefined);

  // Pull submitted assignments for the student
  let submissions = await canvasGet(`/api/v1/courses/${ENV.course_id}/students/submissions`, {
    student_ids: [student_id],
    workflow_state: 'submitted',
    per_page: 100 // avoid pagination surprises
  });
  console.log(submissions);

  // Compute next assignment URL if possible
  let nextUrl;
  if (Array.isArray(submissions) && submissions.length > 0) {
    // Make order deterministic: by submitted_at then assignment_id
    submissions.sort((a, b) => {
      const sa = new Date(a.submitted_at || 0).getTime();
      const sb = new Date(b.submitted_at || 0).getTime();
      if (sa !== sb) return sa - sb;
      return Number(a.assignment_id || 0) - Number(b.assignment_id || 0);
    });

    // DEFAULT: first submitted item (covers when current isn't in 'submitted')
    let nextAssignment = submissions[0];

    // If current assignment is in the list, prefer the one after it
    const currId = Number(ENV.assignment_id);
    const idx = submissions.findIndex(s => Number(s.assignment_id) === currId);
    if (idx >= 0) {
      if (idx < submissions.length - 1) {
        nextAssignment = submissions[idx + 1];
      } else {
        // current is last submitted → no next
        nextAssignment = undefined;
      }
    }

    if (nextAssignment && nextAssignment.assignment_id) {
      nextUrl = `/courses/${ENV.course_id}/gradebook/speed_grader?assignment_id=${Number(nextAssignment.assignment_id)}&student_id=${student_id}`;
    } else {
      nextUrl = undefined; // will trigger green toast on click
    }
  }

  // Update the button with the computed nextUrl (or leave undefined for toast)
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
