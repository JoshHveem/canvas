
if (/^\/courses\/[0-9]+\/users\/[0-9]+/.test(window.location.pathname)) {
  $(".unconclude_enrollment_link").on("click", function() {
      async function run() {
          await delay(1000);
          if ($(".conclude_enrollment_link_holder").css("display") === "block") {
              collectEnrollmentData();
          }
      }
      run();
  });

  $(".conclude_enrollment_link").on("click", function() {
      let courseId = ENV.COURSE_ID;
      let userId = ENV.USER_ID;
      async function run() {
          await delay(500);
          if ($(".unconclude_enrollment_link_holder").css("display") === "block") {
              console.log("RUN");
              let url = "/api/v1/users/"+userId+"/custom_data/previous-enrollments/"+courseId+"/enrollments/"+DATE+"?ns=edu.btech&data[current_grade]="+STUDENT_CURRENT_SCORE+"&data[final_grade]="+STUDENT_FINAL_SCORE;
              $.put(url);
          }
      }
      run();
  });

  var STUDENT_CURRENT_SCORE = 0;
  var STUDENT_FINAL_SCORE = 0;
  var DATE = new Date().getDate() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getFullYear()

  function collectEnrollmentData() {
      let courseId = ENV.COURSE_ID;
      let userId = ENV.USER_ID;
      let url = "/api/v1/courses/"+courseId+"/enrollments?user_id=" + userId;
      $.get(url, function(data) {
          let grades = data[0].grades;
          STUDENT_CURRENT_SCORE = grades.current_score;
          STUDENT_FINAL_SCORE = grades.final_score;
      });
  }

  collectEnrollmentData();
}