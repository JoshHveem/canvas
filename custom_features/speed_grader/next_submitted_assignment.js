// // == Next Assignment Button (Observer Format) ==

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
    style="
      background:none;
      border:none;
      padding:0;
      cursor:pointer;
      color:white;
      display:flex;
      flex-direction:column;
      align-items:center;
    "
    class="Button"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"
         width="20" height="20" aria-hidden="true" fill="currentColor">
      <path d="M16 1V15H9V13H14V3H9V1L16 1Z"/>
      <path d="M6 4V7L0 7L0 9H6V12H7L11 8L7 4H6Z"/>
    </svg>

    <span style="margin-top:4px;font-size:10px;line-height:1;">NEXT</span>
  </button>
  `);

  btn.on('click', function () {
    const submittedIds = $(this).data('submittedIds') || [];
    if (!Array.isArray(submittedIds) || submittedIds.length === 0) {
      showSuccessToast('All current submissions graded');
      return;
    }

    const currId = Number((window.location.search.match(/(?:\?|&)assignment_id=(\d+)/) || [])[1]);
    const len = submittedIds.length;
    const idx = submittedIds.indexOf(currId);
    const nextIdx = idx >= 0 ? (idx + 1) % len : 0;
    // console.log({currId, idx, nextIdx, len});

    const nextAssignmentId = submittedIds[nextIdx];
    console.log(submittedIds);
    const nextUrl =
      `/courses/${ENV.course_id}/gradebook/speed_grader?assignment_id=${nextAssignmentId}&student_id=${student_id}`;

    // console.log(nextUrl);
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
  console.log("START");
  let pieces;
  const assignmentMatch = window.location.search.match(/[?&]assignment_id=([0-9]+)/);
  const studentMatch = window.location.search.match(/[?&]student_id=([0-9]+)/);
  const courseMatch = window.location.href.match(/\/courses\/([0-9]+)\/gradebook\/speed_grader/);
  
  // Build a synthetic pieces array to match the format of the strict regex
  pieces = [null, courseMatch[1], assignmentMatch[1], studentMatch[1]];

  console.log(pieces);
  console.log(JSON.stringify(window.location));

  const student_id = Number(pieces[3]);

  console.log("CREATE BUTTON 1");
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
  console.log(submissions);

  // Update with real list
  console.log("CREATE BUTTON 2");
  ensureNextButton(submittedIds, student_id);

  console.log("SETUP OBSERVER");
  // Observer on a stable root 
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

  observer.observe($("main"), { childList: true, subtree: true });

  // === TIMING EDITION: Aggressive retry polling for initial load ===
  // This ensures button mounts even if container isn't ready at init time
  // Polls every 250ms for ~5 seconds until button appears
  let attempts = 0;
  const boot = setInterval(() => {
    attempts++;
    ensureNextButton(submittedIds, student_id);
    if ($('#next-assignment-button').length > 0 || attempts >= 20) clearInterval(boot);
  }, 250);
}

// Kick it off
console.log("INIT");
$(document).ready(async () => {
  try {
    await initNextAssignmentButton();
  } catch (e) {
    console.error('Next Assignment init failed:', e);
  }
});