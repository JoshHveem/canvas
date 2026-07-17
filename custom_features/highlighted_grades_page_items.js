//THIS HAS VERY MUCH BEEN TAILORED TO DENTAL. IT WILL NEED TO BE REWORKED TO BE FLEXIBLE ACROSS DEPARTMENTS
IMPORTED_FEATURE = {};
if (/^\/courses\/[0-9]+\/grades\/[0-9]+$/.test(window.location.pathname)) {
  let highlightColor = "#FFC";
  $("tr.student_assignment").each(function() {
      let context = $(this).find("div.context").text();
      let gradeText = $(this).find("span.grade").text().replaceAll("Click to test a different score", "").trim();
      let grade = parseFloat(gradeText);
      let total = parseFloat($(this).find("td.points_possible").text().trim());
      if (isNaN(grade) && gradeText != "-" && gradeText != "N/A") {
        $(this).css("background-color", highlightColor);
      } else if (!isNaN(grade) && !isNaN(total)) {
          let percent = (grade / total);
          if (context === "Quizzes" && percent < .8) {
              $(this).css("background-color", highlightColor);
          }
          if (context === "Assignments" && percent < .8) {
              $(this).css("background-color", highlightColor);
          }
          if (context === "Tests" && percent < .8) {
              $(this).css("background-color", highlightColor);
          }
          if (context === "Skills Pass-Off") {
            let rubricId = $(this).attr("id").replace("submission_", "rubric_");
            let table = $("#" + rubricId + " tbody.criterions");
            let criteria = $(table).find("tr.rubric-criterion");
            let completed = true;
            criteria.each(function() {
                //OPTION 1, JUST CHECK THE Time 1.0 CRITERION
                /*
                let isCompletedCriterion = $(this).find("th.description-header").text().includes("Time 1.0");
                if (isCompletedCriterion) {
                    let ratings = $(this).find("div.rating-tier-list div.rating-tier");
                    completed = $(ratings[0]).hasClass("selected");
                }
                //*/

                //OPTION 2, CHECK EVERY CRITERIA EXCEPT FOR ATTEMPTS
                //*
                let isAttemptsCriterion = $(this).find("th.description-header").text().includes("Attempts");
                //CHECK ALL CRITERIA EXCEPT ATTEMPTS
                if (!isAttemptsCriterion) {
                    let ratings = $(this).find("div.rating-tier-list div.rating-tier");
                    //IF THE TOP OPTION ISN'T SELECTED, IT'S NOT COMPLETE
                    if (!$(ratings[0]).hasClass("selected")) {
                        completed = false;
                    }
                }
                //*/
            });
            if (completed === false) {
                $(this).css("background-color", highlightColor);
            }
        }
      }
  });
}