(async function() {
  function dateToString(date) {
    if (!date) return "N/A"
    // Get the current year
    const year = date.getUTCFullYear();
    if (!year) return "N/A";
    
    // Get the current month (0-indexed, so we add 1)
    const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
    if (!month) return "N/A";
    
    // Get the current day of the month
    const day = ('0' + date.getUTCDate()).slice(-2);
    if (!day) return "N/A";
    return `${year}-${month}-${day}`;
  }
  //add conclude button if hidden for not concluded but not active students
  if ($(".unconclude_enrollment_link_holder").css("display") == "none") $(".conclude_enrollment_link_holder").css("display", "block");

  //The actual enrollment bit
  $($(".more_user_information fieldset")[0]).append(`
    <div id="student_last_attended__component">
      <span style="margin: 0.75rem 0.5rem;">
        <div style="margin: 0.75rem 0px;">
          <span wrap="normal" letter-spacing="normal">
            <b>Set Enrollment End Date</b> 
          </span>
        </div>
        <div>
          <input id="btech-enrollment-end-date" type="date" value=""> 
          <input type="checkbox" id="btech-enrollment-is-extension" style="cursor: pointer;"><span>Is Extension?</span>
          <button id="btech-enrollment-reset" style="cursor: pointer;">Reset Date</button>
          <button id="btech-enrollment-view-all-dates" style="cursor: pointer;">View All Dates</button>
        </div>
      </span>
    </div>
  `);


  $("#btech-enrollment-view-all-dates").click(async () => {
    $("body").append(`
      <div class='btech-modal' style='display: inline-block;'>
        <!-- ERASE THE DISPLAY PIECE BEFORE GOING LIVE -->
        <div class='btech-modal-content' style='max-width: 800px;'>
          <div class='btech-modal-content-inner'></div>
        </div>
      </div>
    `);
    let modalContent = $('body .btech-modal-content-inner');
    let dates = await bridgetoolsReq(`https://reports.bridgetools.dev/api/courses/${ENV.COURSE_ID}/users/${ENV.USER_ID}/end_dates`);
    for (let d in dates) {
      let date = dates[d];
      modalContent.append(`<div><span style="width: 2.5rem; display: inline-block;">${date.is_extension ? '<b>EXT</b>' : ''}</span><span style="width: 6rem; display: inline-block;">${dateToString(new Date(date.end_date))}</span>Created By: ${date.creator_name} @ ${dateToString(new Date(date.created))}</div>`)
    }
    let modal = $('body .btech-modal');
    modal.on("click", function(event) {
      if ($(event.target).is(modal)) {
          modal.remove();
      }
    });
  });

  let endAtEl = document.getElementById("btech-enrollment-end-date");

  $("#btech-enrollment-reset").click(() => {
    $("#btech-enrollment-end-date").val("");
    $("#btech-enrollment-is-extension").prop('checked', false);
    resetDate();
  });
  let enrollment = (await $.get(`/api/v1/courses/${ENV.COURSE_ID}/enrollments?user_id=${ENV.USER_ID}`))[0];
  let endAt = enrollment?.end_at;
  function resetDate() {
    //for...reasons, this is a day off
    $.post("/api/v1/courses/" + ENV.COURSE_ID + "/enrollments",
      {
        enrollment: {
          start_at: enrollment.start_at ?? enrollment.created_at ?? new Date(),
          end_at: "",
          user_id: enrollment.user.id,
          course_section_id: enrollment.course_section_id,
          type: enrollment.type,
          enrollment_state: "active",
          notify: false
        }
      }
    );
  }
  function changeDate() {
    let endAtDate = new Date(endAtEl.value);
    let isExtension = $("#btech-enrollment-is-extension").prop('checked');
    //reset is extension
    $("#btech-enrollment-is-extension").prop('checked', false);
    //for...reasons, this is a day off
    endAtDate.setDate(endAtDate.getDate() + 1);
    endAtDate.setTime(endAtDate.getTime() + (6 * 60 * 60 * 1000));
    $.post("/api/v1/courses/" + ENV.COURSE_ID + "/enrollments",
      {
        enrollment: {
          start_at: enrollment.start_at ?? enrollment.created_at ?? new Date(),
          end_at: endAtDate,
          user_id: enrollment.user.id,
          course_section_id: enrollment.course_section_id,
          type: enrollment.type,
          enrollment_state: "active",
          notify: false
        }
      }
    );
    let postData = {
      canvas_user_id: ENV.USER_ID,
      canvas_course_id: ENV.COURSE_ID,
      canvas_section_id: enrollment.course_section_id,
      is_extension: isExtension,
      end_date: endAtDate,
      creator_id: ENV.current_user.id,
      creator_name: ENV.current_user.display_name
    }
    bridgetoolsReq(`https://reports.bridgetools.dev/api/courses/${ENV.COURSE_ID}/users/${ENV.USER_ID}/end_dates`, postData, "POST");
    if (isExtension) alert("Extension Set");
    else alert("End Date Updated")
  }
  $(endAtEl).change(changeDate);
  if (endAt !== undefined && endAt !== null) {
    endAt = new Date(endAt);

    var day = ("0" + endAt.getDate()).slice(-2);
    var month = ("0" + (endAt.getMonth() + 1)).slice(-2);

    endAt = `${endAt.getFullYear()}-${month}-${day}`;
    endAtEl.value = endAt;
  }
})();