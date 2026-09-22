(async function() {
  async function createNextYear(courseId) {
    const modal = createModal();
    const course = await $.get(`/api/v1/courses/${courseId}`);
    const currentTermId = course.enrollment_term_id;
    const term = await $.get(`/api/v1/accounts/3/terms/${currentTermId}`);
    const match = term.name.match(/\b\d{4}\b/);
    const year = parseInt(match[0]);
    const nextTermName = term.name.replace("" + year, "" + (year + 1));
    
    let terms = (await $.get(`/api/v1/accounts/3/terms`)).enrollment_terms;
    terms = terms.filter(term => term.name == nextTermName);
    let nextTerm;
    if (terms.length > 0) {
      nextTerm = terms[0];
    } else {
      nextTerm = term;
    }
    const newCourse = await $.post(`/api/v1/accounts/${course.account_id}/courses`, {
      course: {
          name: course.name,
          course_code: course.course_code,
          term_id: nextTerm.id
      }
    });
    const blueprintSubscriptions = await $.get(`/api/v1/courses/${courseId}/blueprint_subscriptions`);
    if (blueprintSubscriptions.length > 0) {
      confirmBlueprintContent(modal, courseId, newCourse.id, blueprintSubscriptions[0].blueprint_course.id);
    } else {
      confirmCopyContent(modal, courseId, newCourse.id);
    }
  }

  function createModal() {
    let modal = $(`
          <div class='btech-modal' style='display: inline-block;'>
              <!-- ERASE THE DISPLAY PIECE BEFORE GOING LIVE -->
              <div class='btech-modal-content' style='max-width: 500px;'>
                  <div class='btech-modal-content-inner'>
                      <div id="copy-course-message">Creating course...</div>
                      <div id="copy-course-bar"></div>
                      <div id='copy-course-buttons' style='width: 100%; text-align: center;'></div>
                  </div>
              </div>
          </div>
    `);
    $("body").append(modal);
    return modal;
  }

  async function confirmBlueprintContent(modal, oldCourseId, newCourseId, blueprintCourseId) {
    $("#copy-course-message").html(`<a target="_blank" href="/courses/${newCourseId}">New Course</a> created. <br> The source course was connected to a <a target="_blank" href="/courses/${blueprintCourseId}">Blueprint</a>. Connect content from that course.`);
    $("#copy-course-buttons").html(`<button class="yes btn button-sidebar-wide">OK</button>`);
    $("#copy-course-buttons button.yes").click(async function() {
      confirmInstructors(modal, oldCourseId, newCourseId);
    });
  }

  async function confirmCopyContent(modal, oldCourseId, newCourseId) {
    $("#copy-course-message").html(`Copy content to <a target="_blank" href="/courses/${newCourseId}">new course</a>?`);
    $("#copy-course-buttons").html(`<button class="yes btn button-sidebar-wide">Yes</button><button class="no btn button-sidebar-wide">No</button>`);
    $("#copy-course-buttons button.no").click(async function() {
      confirmInstructors(modal, oldCourseId, newCourseId);
    });
    $("#copy-course-buttons button.yes").click(async function() {
      await $.post(`/api/v1/courses/${newCourseId}/content_migrations`, {
        migration_type: 'course_copy_importer',
        settings: {
          source_course_id: oldCourseId
        }
      });
      confirmInstructors(modal, oldCourseId, newCourseId);
    });
  }

  async function confirmInstructors(modal, oldCourseId, newCourseId) {
    $("#copy-course-message").html(`Add instructors to <a target="_blank" href="/courses/${newCourseId}">new course</a>?`);
    $("#copy-course-buttons").html(`<button class="yes btn button-sidebar-wide">Yes</button><button class="no btn button-sidebar-wide">No</button>`);
    $("#copy-course-buttons button.no").click(async function() {
      $(modal).remove();
    });
    $("#copy-course-buttons button.yes").click(async function() {
      $("#copy-course-message").empty();
      $("#copy-course-message").html("Getting instructors.");
      $("#copy-course-buttons").empty();
      let teachers = await $.get(`/api/v1/courses/${oldCourseId}/enrollments?type[]=TeacherEnrollment`);
      $("#copy-course-message").html("Adding instructors.");
      for (let t in teachers) {
        let teacher = teachers[t];
        await $.post(`/api/v1/courses/${newCourseId}/enrollments`, {
          enrollment: {
            user_id: teacher.user.id,
            type: 'TeacherEnrollment',
            enrollment_state: 'active',
            notify: false
          }
        });
        $("#copy-course-message").html(teacher.user.name);
      }
      $("#copy-course-message").html(`All done setting up your <a target="_blank" href="/courses/${newCourseId}">new course</a>.`);
      $("#copy-course-buttons").html('<button class="yes button-sidebar-wide">Close</button>');
      $("#copy-course-buttons button.yes").click(async function() {
        $(modal).remove();
      });
    });
  }
  let copyObserver = new ResizeObserver(() => { 
    var rows = $('tbody[data-automation="courses list"] tr');
    rows.each(function () {
      let row = $(this);
      if (row.find(".btech-content-migrator").length == 0) {
        var link = row.find('a').filter(function() {
          return $(this).attr('href').match(/\/courses\/([0-9]+)/);
        });
        
        var courseId = link.attr('href').match(/\/courses\/([0-9]+)/)[1];
        let icons = row.find('td:last-child');
        let transferButton = $(`<i style="cursor: pointer;" class="btech-content-migrator icon-export-content"></i>`);
        transferButton.click(function() {
            createNextYear(courseId);
        });
        icons.append(transferButton);
      }
    });
  });
  await getElement(`tbody[data-automation="courses list"]`);
  copyObserver.observe($(`tbody[data-automation="courses list"]`)[0]);
})();