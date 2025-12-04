(async function () {
  function dateToString(date) {
    if (!date) return "N/A";
    const year = date.getUTCFullYear();
    if (!year) return "N/A";

    const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
    if (!month) return "N/A";

    const day = ("0" + date.getDate()).slice(-2);
    if (!day) return "N/A";

    return `${year}-${month}-${day}`;
  }

  // add conclude button if hidden for not concluded but not active students
  if ($(".unconclude_enrollment_link_holder").css("display") == "none") {
    $(".conclude_enrollment_link_holder").css("display", "block");
  }

  // Global "view all dates" handler, reused for every row (currently unused, but kept just in case)
  async function showAllDatesModal() {
    $("body").append(`
      <div class='btech-modal' style='display: inline-block;'>
        <div class='btech-modal-content' style='max-width: 800px;'>
          <div class='btech-modal-content-inner'></div>
        </div>
      </div>
    `);
    let modalContent = $("body .btech-modal-content-inner");
    let dates = await bridgetoolsReq(
      `https://reports.bridgetools.dev/api/courses/${ENV.COURSE_ID}/users/${ENV.USER_ID}/end_dates`
    );
    for (let d in dates) {
      let date = dates[d];
      modalContent.append(
        `<div>
          <span style="width: 6rem; display: inline-block;">
            ${dateToString(new Date(date.end_date))}
          </span>
          Created By: ${date.creator_name} @
          ${dateToString(new Date(date.created))}
        </div>`
      );
    }
    let modal = $("body .btech-modal");
    modal.on("click", function (event) {
      if ($(event.target).is(modal)) {
        modal.remove();
      }
    });
  }

  // helpers to actually update/reset a specific enrollment
  function resetDate(enrollment) {
    $.post(`/api/v1/courses/${ENV.COURSE_ID}/enrollments`, {
      enrollment: {
        start_at: enrollment.start_at ?? enrollment.created_at ?? new Date(),
        end_at: "",
        user_id: enrollment.user.id,
        course_section_id: enrollment.course_section_id,
        type: enrollment.type,
        enrollment_state: "active",
        notify: false,
      },
    });
  }

  function changeDate(enrollment, endDateStr) {
    if (!endDateStr) return;

    let endAtDate = new Date(endDateStr);

    // for...reasons, this is a day off
    endAtDate.setDate(endAtDate.getDate() + 1);
    endAtDate.setTime(endAtDate.getTime() + 6 * 60 * 60 * 1000);

    $.post(`/api/v1/courses/${ENV.COURSE_ID}/enrollments`, {
      enrollment: {
        start_at: enrollment.start_at ?? enrollment.created_at ?? new Date(),
        end_at: endAtDate,
        user_id: enrollment.user.id,
        course_section_id: enrollment.course_section_id,
        type: enrollment.type,
        enrollment_state: "active",
        notify: false,
      },
    });

    let postData = {
      canvas_user_id: ENV.USER_ID,
      canvas_course_id: ENV.COURSE_ID,
      canvas_section_id: enrollment.course_section_id,
      end_date: endAtDate,
      creator_id: ENV.current_user.id,
      creator_name: ENV.current_user.display_name,
    };

    bridgetoolsReq(
      `https://reports.bridgetools.dev/api/courses/${ENV.COURSE_ID}/users/${ENV.USER_ID}/end_dates`,
      postData,
      "POST"
    );
  }

  // ---- NEW: per-enrollment UI wiring ----

  // get all enrollments for this user in this course
  let enrollments = await $.get(
    `/api/v1/courses/${ENV.COURSE_ID}/enrollments?user_id=${ENV.USER_ID}`
  );

  // index by section id for easy lookup
  let enrollmentsBySectionId = {};
  enrollments.forEach((e) => {
    if (e.course_section_id) {
      enrollmentsBySectionId[e.course_section_id] = e;
    }
  });

  const isDeptHead = (!!window.IS_DEPARTMENT_HEAD || CURRENT_DEPARTMENT_ID == 3819);

  // for each row in the enrollments table, add controls
  $("tr.enrollment").each(function () {
    let $row = $(this);

    // find the section id from the <a href="/courses/.../sections/685759">
    let href = $row.find("td:first a").attr("href") || "";
    let match = href.match(/sections\/(\d+)/);
    if (!match) return;

    let sectionId = parseInt(match[1], 10);
    let enrollment = enrollmentsBySectionId[sectionId];
    if (!enrollment) return;

    // current end date for this enrollment, formatted for <input type="date">
    let formattedEnd = "";
    if (enrollment.end_at) {
      let endAt = new Date(enrollment.end_at);
      let day = ("0" + endAt.getDate()).slice(-2);
      let month = ("0" + (endAt.getMonth() + 1)).slice(-2);
      formattedEnd = `${endAt.getFullYear()}-${month}-${day}`;
    }

    let $controlsCell;
    console.log(isDeptHead);

    if (!isDeptHead) {
      console.log("NOT DEPT HEAD");
      // Non-department head: read-only display only
      $controlsCell = $(`
        <td class="btech-end-date-cell" style="vertical-align: top;">
          <div class="btech-enrollment-end-date-row" style="margin-top: 0.5rem;">
            <div style="margin-bottom: 0.25rem;">
              <span style="font-weight: bold;">Enrollment End Date</span>
            </div>
            <div>
              ${formattedEnd || "—"}
            </div>
          </div>
        </td>
      `);

      $row.append($controlsCell);
      return; // no handlers, no editing
    }

    // Department head: full editable controls
    $controlsCell = $(`
      <td class="btech-end-date-cell" style="vertical-align: top;">
        <div class="btech-enrollment-end-date-row" style="margin-top: 0.5rem;">
          <div style="margin-bottom: 0.25rem;">
            <span style="font-weight: bold;">Set Enrollment End Date</span>
          </div>
          <div>
            <input
              style="width: auto;"
              type="date"
              class="btech-enrollment-end-date"
              value="${formattedEnd}"
            >
            <button
              type="button"
              class="btech-enrollment-reset"
              style="cursor: pointer; margin-left: 0.5rem;"
            >
              Reset
            </button>
          </div>
        </div>
      </td>
    `);

    // Append NEW CELL to this <tr>
    $row.append($controlsCell);

    // Wire up handlers (dept head only)
    let $dateInput = $controlsCell.find(".btech-enrollment-end-date");

    $controlsCell.find(".btech-enrollment-reset").on("click", function () {
      $dateInput.val("");
      resetDate(enrollment);
    });

    $dateInput.on("change", function () {
      changeDate(enrollment, this.value);
    });
  });
})();
