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

//toggle color of submitted assignments for students
/*currently only in meats for testing
if (window.location.pathname.includes("/courses/473716/modules") === true) {
  function getSubmittedAssignments(page) {
    let userId = ENV.current_user.id;
    let courseId = ENV.COURSE_ID;
    let url = "/api/v1/users/"+userId+"/courses/"+courseId+"/assignments?include[]=submission&page="+page+"&per_page=100";
    $.get(url, function(data) {
      if (data.length === 100) getSubmittedAssignments(page + 1);
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
                $(value).removeClass('student-view');
              }
            }
          });
        }
      }
    });
  }
  let isStudent = ENV.IS_STUDENT;
  if (isStudent) {
    getSubmittedAssignments(1);
  }
}
/*END toggle submitted assignments*/

//zoom into picture on hover
$('span.avatar').hover(function() {
    let large = $(this).clone();
    large.css('width', '250px');
    large.css('height', '250px');
    large.css('position', 'fixed');
    large.attr('id', 'btech-avatar-zoomed');
    large.css('top', $(this).offset().top - $(window).scrollTop()+'px');
    large.css('left', $(this).offset().left - $(window).scrollLeft()+'px');
    large.css('z-index', '10000');
    $('body').append(large);
}, function() {
    $('#btech-avatar-zoomed').remove();
});
//end zoom on hover

/*gen report on gradebook page*/
if (window.location.pathname.includes("/gradebook") === true) {
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

/*gen report on individual page*/
if (/^\/users\/[0-9]+/.test(window.location.pathname) || /^\/accounts\/[0-9]+\/users\/[0-9]+/.test(window.location.pathname)) {
  var scriptElement = document.createElement( "script" );
  scriptElement.src = SOURCE_URL + "/reports/reports_functions_test.js";
  document.body.appendChild( scriptElement );
  scriptElement.onload = function() {
    let individualReportElement = document.createElement( "script" );
    individualReportElement.src = SOURCE_URL + "/reports/individual_grades_report_test.js";
    document.body.appendChild(individualReportElement);
  }
}
/*END report*/


//*Show ungraded as 0 Final Grade next to Final Grade based on submitted assignments only.
if (window.location.pathname == "/grades") {
	let user = ENV.current_user_id;
	let tbody = $("table.student_grades").find("tbody");
	$("table.student_grades").find("tbody").find("tr").each(function(i) {
		let element = this;
		let courseURL = $(this).find("a").attr("href");
		let urlArray = courseURL.split("/");
		let course = urlArray[2];
		$.get("/api/v1/courses/"+course+"/enrollments?user_id="+user, function(data) {
			let score = data[0].grades.final_score;
			$(element).append('<td class="percent">'+score+'%</td>');
		});
	});
	tbody.prepend("<tr><td></td><td>Completed Assignments</td><td></td><td>Final Grade</td></tr>");
}
/*
if (window.location.pathname.includes("/grades/") === true) {
    let course = ENV.courses_with_grades[0].id;
    let user = ENV.students[0].id;
    ENV.students[0] = {};
    $.get("/api/v1/courses/"+course+"/enrollments?user_id="+user, function(data) {
        let score = data[0].grades.final_score;
        $('tr.final_grade td.possible').html("<span>Unsubmitted as 0</span>");
        $('tr.final_grade td.details').html("<div class='score_holder'><span class='tooltip'><span class='grade' style='font-size:22px'>"+score+"%</span></span></div>");
        //$(element).append('<td class="percent">'+score+'%</td>');
    });
}
/*END Show ungraded as 0 Final Grade next to Final Grade based on submitted assignments only.*/
/*
	* this is how you check for user roles to only show a menu item to certain users. Just change admin to whatever you want
	if (ENV.current_user_roles.includes('admin')) {
		addMenuItem('Logout', '/logout');
	}	
*/
/*add in accordion stuff*/
/*
var scriptElement = document.createElement( "script" );
scriptElement.src = SOURCE_URL + "/external-libraries/jquery-accordion.js";
document.body.appendChild( scriptElement );
scriptElement.onload = function() {
  $(".btech-accordion").accordion();
  $(".btech-accordion").accordion("option", "icons", null);
}
//*/
/*end of accordion stuff*/