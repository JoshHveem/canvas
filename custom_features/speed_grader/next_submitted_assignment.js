// // == Next Assignment Button (Observer Format) ==

// // Simple green toast
// function showSuccessToast(message) {
//   const toast = $(`
//     <div role="alert" aria-live="polite"
//          style="position: fixed; right: 16px; bottom: 16px; z-index: 9999;
//                 background: #2e7d32; color: #fff; padding: 12px 16px;
//                 border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,.2);
//                 font-size: 14px;">
//       ${message}
//     </div>
//   `);
//   $('body').append(toast);
//   setTimeout(() => toast.fadeOut(200, () => toast.remove()), 3000);
// }

// function createNextButton(student_id) {
//   const btn = $(`
// <button
//   id="next-assignment-button"
//   aria-label="Next Assignment"
//   style="
//     background: none;
//     border: none;
//     padding: 0;
//     cursor: pointer;
//     color: white;
//   "
// >
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     viewBox="0 0 16 16"
//     width="16"
//     height="16"
//     aria-hidden="true"
//     fill="currentColor"
//   >
//     <path d="M16 1V15H9V13H14V3H9V1L16 1Z"/>
//     <path d="M6 4V7L0 7L0 9H6V12H7L11 8L7 4H6Z"/>
//   </svg>
// </button>

//   `);

//   // Click handler computes the next destination *at click time*
//   btn.on('click', function () {
//     const submittedIds = $(this).data('submittedIds') || [];
//     if (!Array.isArray(submittedIds) || submittedIds.length === 0) {
//       // No submitted items at all → toast
//       showSuccessToast('All current submissions graded');
//       return;
//     }

//     // Current assignment
//     const currId = Number(ENV.assignment_id);
//     const len = submittedIds.length;

//     // Find current index; if not in list, start at 0
//     const idx = submittedIds.indexOf(currId);
//     const nextIdx = idx >= 0 ? (idx + 1) % len : 0;

//     const nextAssignmentId = submittedIds[nextIdx];
//     const nextUrl =
//       `/courses/${ENV.course_id}/gradebook/speed_grader?assignment_id=${nextAssignmentId}&student_id=${student_id}`;

//     window.location.href = nextUrl;
//   });

//   return btn;
// }

// function ensureNextButton(container, student_id, submittedIds) {
//   let btn = $('#next-assignment-button');
//   if (btn.length === 0) {
//     btn = createNextButton(student_id).appendTo(container);
//   }
//   // Always keep the latest submittedIds on the button (can be empty array)
//   btn.data('submittedIds', Array.isArray(submittedIds) ? submittedIds : []);
// }

// async function postLoad() {
//   // Parse student_id from SpeedGrader URL
//   const rUrl = /\/courses\/([0-9]+)\/gradebook\/speed_grader\?assignment_id=([0-9]+)&student_id=([0-9]+)/;
//   const pieces = window.location.href.match(rUrl);
//   if (!pieces) return;

//   const student_id = Number(pieces[3]);

//   // Container to place the button
//   const container = $('[data-testid="student-navigation-flex"]');
//   if (container.length === 0) return;

//   // Render button immediately (it will toast until we load submissions)
//   ensureNextButton(container, student_id, []);

//   // Fetch submitted items for this student
//   let submissions = await canvasGet(`/api/v1/courses/${ENV.course_id}/students/submissions`, {
//     student_ids: [student_id],
//     workflow_state: 'submitted',
//     per_page: 100
//   });

//   // Normalize + sort deterministically
//   let submittedIds = [];
//   if (Array.isArray(submissions) && submissions.length > 0) {
//     submissions.sort((a, b) => {
//       const sa = new Date(a.submitted_at || 0).getTime();
//       const sb = new Date(b.submitted_at || 0).getTime();
//       if (sa !== sb) return sa - sb;
//       return Number(a.assignment_id || 0) - Number(b.assignment_id || 0);
//     });
//     submittedIds = submissions
//       .map(s => Number(s.assignment_id))
//       .filter(id => Number.isFinite(id));
//   }

//   // Update button with the latest list (empty => toast)
//   ensureNextButton(container, student_id, submittedIds);

//   // Keep it present as the DOM changes
//   const observer = new MutationObserver((mutationsList) => {
//     for (const mutation of mutationsList) {
//       if (mutation.type === 'childList') {
//         // Re-attach with current data
//         ensureNextButton(container, student_id, submittedIds);
//       }
//     }
//   });
//   observer.observe(container[0], { childList: true, subtree: false });
// }

// // Kick it off
// (async function () {
//   try {
//     await postLoad();
//   } catch (e) {
//     console.error('Next Assignment observer init failed:', e);
//   }
// })();

// == Next Assignment Button (Stable Root Observer) ==

// Simple green toast
function showSuccessToast(message) {
  const toast = $(`
    <div role="alert" aria-live="polite"
         style="position: fixed; right: 16px; bottom: 16px; z-index: 9999;
                background: #2e7d32; color: #fff; padding: 12px 16px;
                border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,.2);
                font-size: 14px;">
      ${message}
    </div>
  `);
  $('body').append(toast);
  setTimeout(() => toast.fadeOut(200, () => toast.remove()), 3000);
}

function createNextButton(student_id) {
  const btn = $(`
    <button
      id="next-assignment-button"
      aria-label="Next Assignment"
      style="background:none;border:none;padding:0;cursor:pointer;color:white;"
      class="Button"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"
           width="16" height="16" aria-hidden="true" fill="currentColor">
        <path d="M16 1V15H9V13H14V3H9V1L16 1Z"/>
        <path d="M6 4V7L0 7L0 9H6V12H7L11 8L7 4H6Z"/>
      </svg>
    </button>
  `);

  btn.on('click', function () {
    const submittedIds = $(this).data('submittedIds') || [];
    if (!Array.isArray(submittedIds) || submittedIds.length === 0) {
      showSuccessToast('All current submissions graded');
      return;
    }

    const currId = Number(ENV.assignment_id);
    const len = submittedIds.length;
    const idx = submittedIds.indexOf(currId);
    const nextIdx = idx >= 0 ? (idx + 1) % len : 0;

    const nextAssignmentId = submittedIds[nextIdx];
    const nextUrl =
      `/courses/${ENV.course_id}/gradebook/speed_grader?assignment_id=${nextAssignmentId}&student_id=${student_id}`;

    window.location.href = nextUrl;
  });

  return btn;
}

function ensureNextButton(submittedIds, student_id) {
  const container = $('[data-testid="student-navigation-flex"]'); // <-- re-find every time
  if (container.length === 0) return;

  // IMPORTANT: scope lookup to container so we don’t rely on stale DOM
  let btn = container.find('#next-assignment-button');

  if (btn.length === 0) {
    btn = createNextButton(student_id);

    // You can control placement by appending to a wrapper if needed:
    // const wrapper = $('<span style="display:inline-flex;align-items:center;"></span>');
    // wrapper.append(btn);
    // container.append(wrapper);

    container.append(btn);
  }

  btn.data('submittedIds', Array.isArray(submittedIds) ? submittedIds : []);
}

async function initNextAssignmentButton() {
  const rUrl = /\/courses\/([0-9]+)\/gradebook\/speed_grader\?assignment_id=([0-9]+)&student_id=([0-9]+)/;
  const pieces = window.location.href.match(rUrl);
  if (!pieces) return;

  const student_id = Number(pieces[3]);

  // Mount immediately (empty -> toast behavior)
  let submittedIds = [];
  ensureNextButton(submittedIds, student_id);

  // Fetch submitted items
  let submissions = await canvasGet(`/api/v1/courses/${ENV.course_id}/students/submissions`, {
    student_ids: [student_id],
    workflow_state: 'submitted',
    per_page: 100
  });

  if (Array.isArray(submissions) && submissions.length > 0) {
    submissions.sort((a, b) => {
      const sa = new Date(a.submitted_at || 0).getTime();
      const sb = new Date(b.submitted_at || 0).getTime();
      if (sa !== sb) return sa - sb;
      return Number(a.assignment_id || 0) - Number(b.assignment_id || 0);
    });

    submittedIds = submissions
      .map(s => Number(s.assignment_id))
      .filter(Number.isFinite);
  }

  // Update with real list
  ensureNextButton(submittedIds, student_id);

  // Observer on a stable root (like your working example)
  let rafScheduled = false;
  const observer = new MutationObserver(() => {
    // debounce hard to avoid running hundreds of times per render
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(() => {
      rafScheduled = false;
      ensureNextButton(submittedIds, student_id);
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Extra safety: short “boot loop” for first few seconds
  // (helps when Canvas does multiple initial renders)
  let attempts = 0;
  const boot = setInterval(() => {
    attempts++;
    ensureNextButton(submittedIds, student_id);
    if ($('#next-assignment-button').length > 0 || attempts >= 20) clearInterval(boot);
  }, 250);
}

// Kick it off
(async function () {
  try {
    await initNextAssignmentButton();
  } catch (e) {
    console.error('Next Assignment init failed:', e);
  }
})();