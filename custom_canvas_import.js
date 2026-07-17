var s = document.createElement("script");
s.type = "text/javascript";
s.src = SOURCE_URL + "/external-libraries/sorttable.js";
$("head").append(s);
$("head").append('<script src="https://kit.fontawesome.com/870f83fdd7.js" crossorigin="anonymous"></script>');

function addMenuItem(linkText, linkhref) {
  'use strict';
  var itemHtml;
  var linkId = linkText.split(' ').join('_');

  itemHtml = '<li clas="section">' +
    ' <a href="' + linkhref + '" tabindex="0">' +
    linkText +
    ' </a>' +
    '</li>';
  $('#section-tabs').append(itemHtml);
}


//zoom into picture on hover
$('span.avatar').hover(function () {
  let large = $(this).clone();
  large.css('width', '250px');
  large.css('height', '250px');
  large.css('position', 'fixed');
  large.attr('id', 'btech-avatar-zoomed');
  large.css('top', $(this).offset().top - $(window).scrollTop() + 'px');
  large.css('left', $(this).offset().left - $(window).scrollLeft() + 'px');
  large.css('z-index', '10000');
  $('body').append(large);
}, function () {
  $('#btech-avatar-zoomed').remove();
});
//end zoom on hover

/*gen report on gradebook page
if (/^\/courses\/[0-9]+\/gradebook$/.test(window.location.pathname)) {
  var scriptElement = document.createElement( "script" );
  scriptElement.src = SOURCE_URL + "/reports/reports_functions.js";
  document.body.appendChild( scriptElement );
  scriptElement.onload = function() {
    let individualReportElement = document.createElement( "script" );
    individualReportElement.src = SOURCE_URL + "/reports/grades_report.js";
    document.body.appendChild(individualReportElement);
  }
}
/*END report*/

/*gen report on individual page
if (/^\/users\/[0-9]+/.test(window.location.pathname) || /^\/accounts\/[0-9]+\/users\/[0-9]+/.test(window.location.pathname)) {
  var scriptElement = document.createElement( "script" );
  scriptElement.src = SOURCE_URL + "/reports/reports_functions.js";
  document.body.appendChild( scriptElement );
  scriptElement.onload = function() {
    let individualReportElement = document.createElement( "script" );
    individualReportElement.src = SOURCE_URL + "/reports/individual_grades_report.js";
    document.body.appendChild(individualReportElement);
  }
}
/*END report*/


//*Show ungraded as 0 Final Grade next to Final Grade based on submitted assignments only.
if (window.location.pathname == "/grades") {
  let user = ENV.current_user_id;
  let tbody = $("table.student_grades").find("tbody");
  $("table.student_grades").find("tbody").find("tr").each(function (i) {
    let element = this;
    let courseURL = $(this).find("a").attr("href");
    let urlArray = courseURL.split("/");
    let course = urlArray[2];
    $.get("/api/v1/courses/" + course + "/enrollments?user_id=" + user, function (data) {
      let score = data[0].grades.final_score;
      $(element).append('<td class="percent">' + score + '%</td>');
    });
  });
  tbody.prepend("<tr><td></td><td>Completed Assignments</td><td></td><td>Final Grade</td></tr>");
}


//this adds a link to speed grader on the canvas assignment grading page to make it easier to access
if (/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/.test(window.location.pathname)) {
  let pieces = window.location.pathname.match(/^\/courses\/([0-9]+)\/assignments\/([0-9]+)\/submissions\/([0-9]+)/);
  let speed_grader_link = '<div style="text-align: right;"><a class="assess_submission_link Button Button--small Button--link" href="/courses/' + pieces[1] + '/gradebook/speed_grader?assignment_id=' + pieces[2] + '&student_id=' + pieces[3] + '"><i class="icon-rubric" aria-hidden="true"></i> Speed Grader</a></div>';
  $($(".submission-details-header div")[0]).after(speed_grader_link);
}
//END SPEED GRADER LINK

//Specific to Animal Sciences, this is hiding certain modules that students who are in specific sections do not need to see
if (/^\/courses\/[0-9]+\/modules$/.test(window.location.pathname)) {
  if (ENV.course_id === "488475") {
    let isStudent = ENV.IS_STUDENT;
    if (isStudent) {
      let modules = $('.item-group-condensed');
      let newStudent = $(modules[1]).find('div.ig-row').length === 1;
      if (newStudent === false) {
        $(modules[1]).hide();
      }
      $('.item-group-condensed').each(function (index, value) {
        let prereq = $(value).find('.ig-header').find('.prerequisites').text();
        if (prereq.includes('Computer Policy') && newStudent === false) {
          $(value).hide();
        }
        if (prereq.includes('Welcome') && newStudent === true) {
          $(value).hide();
        }
      });
    }
  }
}
//END Animal Sciences//