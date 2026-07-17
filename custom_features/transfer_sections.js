(async function () {
  async function transferToSection(data, section, courseId) {
    let sectionId = null;
    for (let s = 0; s < data.length; s++) {
      let checkSection = data[s];
      if (section.name === checkSection.name) {
        sectionId = checkSection.id;
      }
    }
    if (sectionId === null) {
      //Possibly also add in start and end at information
      await $.post("/api/v1/courses/" + courseId + "/sections", {
        course_section: {
          name: section.name
        }
      }, function (data) {
        sectionId = data.id;
      });
    }
    for (let s = 0; s < section.students.length; s++) {
      let student = section.students[s];
      try {
        $.post("/api/v1/courses/" + courseId + "/enrollments", {
          enrollment: {
            user_id: student.id,
            type: "StudentEnrollment",
            course_section_id: sectionId
          }
        });
      } catch (e) {
        console.log(e);
      }
    }
  }
  let div = $("<div></div>");
  $(".roster-tab").prepend(div);
  let sectionSelector = $("<select><option selected disabled>-Section to Transfer-</option></select>");
  let courseSelector = $("<input type='text' placeholder='Enter Course Id'>");
  let submit = $("<a href='#' class='btn btn-primary' role='button' style='float: right;'>Transfer</a>");
  let sectionData = {};
  div.append(sectionSelector);
  div.append(" ");
  div.append(courseSelector);
  div.append(submit);
  div.after("<br>");
  submit.click(async function () {
    let section = sectionData[sectionSelector.val()];
    let courseId = courseSelector.val();
    $.get("/api/v1/courses/" + courseId + "/sections?include[]=students").done(function (data) {
      transferToSection(data, section, courseId);
    });
  });
  let sections = $.get("/api/v1/courses/" + CURRENT_COURSE_ID + "/sections?include[]=students").done(function (data) {
    for (let s = 0; s < data.length; s++) {
      let section = data[s];
      let option = $("<option value='" + section.id + "'>" + section.name + "</option>");
      sectionData[section.id] = section;
      sectionSelector.append(option);
    }
  });
})();