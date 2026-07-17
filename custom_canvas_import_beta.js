
//toggle color of submitted assignments for students
//*currently only in meats for testing
if (/^\/courses\/[0-9]+\/modules$/.test(window.location.pathname)) {
  if (ENV.course_id === "473716" || ENV.course_id === "497780") {
    async function getSubmittedAssignments(page) {
      let userId = ENV.current_user.id;
      let courseId = ENV.COURSE_ID;
      let url = "/api/v1/users/"+userId+"/courses/"+courseId+"/assignments?include[]=submission&page="+page+"&per_page=50";
      let data = await $.get(url, function(data) {
        for (let a = 0; a < data.length; a++) {
          let assignment = data[a];
          if (assignment.submission.submitted_at !== null) {
            $('div.ig-row').each(function(index, value) {
              let infoEl = $(value).find('div.ig-info');
              let aEl = infoEl.find('a');
              if (aEl.length > 0) {
                let name = aEl.html().trim();
                let typeEl = infoEl.find('span.type');
                let type = typeEl.html();
                if (name === assignment.name) {
                  //this makes it green, we could play around with potentially other colors, but it's a little trickier than just adding color to the icon and I haven't figured it out yet.
                  $(value).removeClass('student-view');
                  $(value).find('.module-item-status-icon').append('<span class="ig-type-icon"><i class="icon-Solid icon-publish"></i></span>');
                }
              }
            });
            }
        }
        return data;
      });
      if (data.length === 50) {
        await getSubmittedAssignments(page + 1);
      }
    }
    async function formatSubmittedAssignments() {
      let isStudent = ENV.IS_STUDENT;
      if (isStudent) {
        $(".collapse_module_link").hide();
        $(".expand_module_link").show();
        $(".content").hide();
        getSubmittedAssignments(1).then(() => {
          $('.item-group-condensed').each(function(index, value) {
            let checkFinished = true;
            let quizzes = $(value).find('li.quiz');
            quizzes.each(function(index, value) {
              if ($(value).find('i.icon-publish').length === 0) {
                $(value).find('.module-item-status-icon').append('<span class="ig-type-icon"><i class="icon icon-publish"></i></span>');
                checkFinished = false;
              }
            });
            let assignments = $(value).find('li.assignment');
            assignments.each(function(index, value) {
              if ($(value).find('i.icon-publish').length === 0) {
                $(value).find('.module-item-status-icon').append('<span class="ig-type-icon"><i class="icon icon-publish"></i></span>');
                checkFinished = false;
              }
            });
            if (checkFinished) {
              $(value).find('div.ig-header-admin').append('<span class="ig-type-icon"><i class="icon-Solid icon-publish"></i></span>');
            }
          });
        });
      }
    }
    formatSubmittedAssignments();
  }
}
//*///END toggle submitted assignments

//*On speed grader page, make it so a comment is added with the rubric info whenever a rubric score is submitted
let rubric_courses_test = [489058, 489089, 489702]; //dental assisting I and III & microcontrollers I
$.put = function(url, data){
  return $.ajax({
    url: url,
    type: 'PUT'
  });
}

function genRubricComment(course, assignment, user, rowSelector, rubricSelector, offset=1) {
  let comment = "";
  let header = "<h2><b>RUBRIC</b></h2>";
  let rows = $(rowSelector).find("tr");
  let totalMax = 0;
  let totalCrit = 0;
  header += ($(rows[rows.length - offset]).text().trim() + "%0A");
  $(rubricSelector).find("tr.rubric-criterion").each(function(index) {
    let description = $(this).find("th.description-header").find("div.description").text();
    let points_val = $(this).find("td.criterion_points").find("div.graded-points").find("input").val();
    let points = $(this).find("td.criterion_points").find("div.graded-points").text();
    points = points.replace("/", "").replace(" pts", "").replace("Points", "");
    totalCrit += 1;
    points = ("" + points).trim();
    points_val = ("" + points_val).trim();
    if (points === points_val) {
      totalMax += 1;
    }
    description = description.replace("This criterion is linked to a Learning Outcome", "");
    comment += (description + "%0A" + points_val + "/" + points + "%0A");
  });
  header += ("TOTAL CRITERIA AT FULL POINTS: %0A" + totalMax + "/" + totalCrit);
  comment = header + '%0A<div class="btech-comment-collapse">%0A' + comment + '%0A</div>';
  $.put("/api/v1/courses/"+course+"/assignments/"+assignment+"/submissions/"+user+"?comment[text_comment]="+comment,{} );
}

if (/^\/courses\/[0-9]+\/gradebook\/speed_grader/.test(window.location.pathname)) {
  let currentUser = parseInt(ENV.current_user.id);
  let course = parseInt(ENV.course_id);
  if (currentUser === 1893418 || rubric_courses_test.includes(course)) {
    $(".save_rubric_button").on("click", function() {
      let user = ENV.RUBRIC_ASSESSMENT.assessment_user_id;
      let assignment = ENV.assignment_id;
      genRubricComment(course, assignment, user, "div#rubric_full", "div#rubric_full", 2);
      /*
      let comment = "-RUBRIC-%0A";
      let rows = $("div#rubric_full").find("tr");
      comment += ($(rows[rows.length - 2]).text().trim() + "%0A%0A");
      $("div#rubric_full").find("tr.rubric-criterion").each(function(index) {
        let description = $(this).find("th.description-header").find("div.description").text();
        let points_val = $(this).find("td.criterion_points").find("div.graded-points").find("input").val();
        let points = $(this).find("td.criterion_points").find("div.graded-points").text();
        description = description.replace("This criterion is linked to a Learning Outcome", "");
        comment += (description + "%0A" + points_val + points.replace("Points", "") + "%0A%0A");
      });
      $.put("https://btech.beta.instructure.com/api/v1/courses/"+ENV.course_id+"/assignments/"+ENV.assignment_id+"/submissions/"+ENV.RUBRIC_ASSESSMENT.assessment_user_id+"?comment[text_comment]="+comment,{} );
      */
    });
  }
}

if (/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/.test(window.location.pathname)) {
  let currentUser = parseInt(ENV.current_user.id);
  let pieces = window.location.pathname.match(/^\/courses\/([0-9]+)\/assignments\/([0-9]+)\/submissions\/([0-9]+)/);
  let course = parseInt(pieces[1]);
  let assignment = parseInt(pieces[2]);
  let user = parseInt(pieces[3]);
  if (currentUser === 1893418 || rubric_courses_test.includes(course)) {
    $(".save_rubric_button").on("click", function() {
      genRubricComment(course, assignment, user, "div.react-rubric table", "div.react-rubric");
    });
  }
}
//*///END rubric score comment saving

//Just for IV Therapy, changes 2019 short term to 2019/2020 short term
//remove in July
if (/^\/courses\/489538/.test(window.location.pathname)) {
    let _section = $('#section-tabs-header-subtitle');
    let _text = _section.text();
    let _new = _text.replace('2019', '2019/2020');
    _section.text(_new);
}