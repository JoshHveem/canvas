(async function() {
  // 1. Async function that returns the array (safer + more concise)
  async function getCompletedEnrollments() {
    const query = `
    {
      allCourses {
        enrollmentsConnection(filter: {types: StudentEnrollment, states: active}) {
          nodes {
            grades {
              finalScore
              currentScore
            }
            user {
              _id
              sortableName
            }
          }
        }
        courseCode
        name
        _id
        term {
          _id
          endAt
        }
      }
    }
    `;

    const res = await $.post(`/api/graphql`, { query });
    const now = Date.now();

    const openCourses = (res?.data?.allCourses || []).filter(course =>
      (course.enrollmentsConnection?.nodes?.length || 0) > 0 &&
      new Date(course.term?.endAt || 0).getTime() > now
    );

    const completed = openCourses.flatMap(course =>
      (course.enrollmentsConnection?.nodes || []).map(enrollment => {
        const grades = enrollment.grades || {};
        const current = Number(grades.currentScore || 0);
        const final = Number(grades.finalScore || 0);

        if (!current || !isFinite(current)) return null; // guard division by zero / invalid

        const progress = final / current;
        if (progress > 0.95) {
          return {
            course_id: course._id,
            course_code: course.courseCode || "",
            user_id: enrollment.user?._id || "",
            user_name: enrollment.user?.sortableName || "",
            progress
          };
        }

        return null;
      }).filter(Boolean)
    );

    completed.sort((a, b) => a.course_code.localeCompare(b.course_code) || a.user_name.localeCompare(b.user_name));

    return completed;
  }


// 2. Modal-creation (make it async so you can await the data)
async function createModal() {
  // prevent duplicate modals
  const existing = $(".btech-modal");
  if (existing.length) {
    existing.first().show();
    return existing.first();
  }

  // build the DOM (keep inline styles for portability)
  const modal = $(
    '<div class="btech-modal" role="dialog" aria-modal="true" style="display: inline-block;">' +
      '<div class="btech-modal-content" style="width: 80%;">' +
        '<div class="btech-modal-content-inner">' +
          '<h2>Students Near Completion</h2>' +
          '<div class="btech-modal-completed-enrollments">Loading…</div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );

  // close when background clicked
  modal.on("click", e => {
    if ($(e.target).is(modal)) modal.remove();
  });

  $("body").append(modal);

  try {
    const list = await getCompletedEnrollments();
      const $container = $("<div>")
        .addClass("btech-enrollment-container")
        .attr("style", "display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px;");

      if (!list.length) {
        modal.find(".btech-modal-completed-enrollments").text("No students are within 95% completion yet.");
      } else {
        list.forEach(({ course_code, course_id, user_id, user_name, progress }) => {
          const pct = (progress * 100).toFixed(1) + "%";

          const $card = $("<div>")
            .addClass("btech-enrollment-card")
            .attr("style", "border: 1px solid #ddd; padding: 8px; border-radius: 4px; width: 200px; box-sizing: border-box;");

          const $course = $("<div>").addClass("course-code").attr("style", "font-weight: bold; margin-bottom: 4px;").text(course_code);
          const $student = $("<div>").addClass("student-name").attr("style", "margin-bottom: 4px;");
          const $link = $("<a>").attr({ target: "_blank", href: `/courses/${course_id}/grades/${user_id}` }).text(user_name);
          $student.append($link);
          const $progress = $("<div>").addClass("progress").text(pct);

          $card.append($course, $student, $progress);
          $container.append($card);
        });

        modal.find(".btech-modal-completed-enrollments").empty().append($container);
      }
  } catch (err) {
    console.error(err);
    modal.find(".btech-modal-completed-enrollments")
         .text("Error loading data.");
  }

  return modal;
}


// 3. Create & hook up the button
$(function() {
  const button = $(`
    <a href="javascript:;" class="Button button-sidebar-wide">
      View Students Near Course Completion
    </a>
  `);

  button.on("click", async e => {
    e.preventDefault();
    await createModal();
  });

  $("#right-side").append(button);
});
 

})();