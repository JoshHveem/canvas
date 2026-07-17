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