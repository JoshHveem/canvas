//THIS HAS VERY MUCH BEEN TAILORED TO DENTAL. IT WILL NEED TO BE REWORKED TO BE FLEXIBLE ACROSS DEPARTMENTS
if (/^\/courses\/[0-9]+\/grades\/[0-9]+$/.test(window.location.pathname)) {

  //adds a colored dot next to the score on the grades page
  function addDot(el, color="#C00", hoverText="Below minium required score") {
    $(el.find(".assignment_score .score_holder")).append(`
      <span 
        title="${hoverText}"
        class="unread_dot grade_dot" 
        style="background-color: ${color}; cursor: help;"
      >&nbsp;</span>
    `);
  }

  //create lookup dict of submissions
  let submissions = {};
  let submissionsData = ENV.submissions;
  for (let s in submissionsData) {
    let submission = submissionsData[s];
    submissions[submission.assignment_id] = submission;
  }

  //iterate over assignments group by group
  let groups = ENV.assignment_groups;
  for (let g in groups) {
    let group = groups[g];
    let assignments = group.assignments;
    for (let a in assignments) {

      //get assignment sumbission details
      let assignment = assignments[a];
      if (!!submissions?.[assignment.id]) {
        let el =  $(`#submission_${assignment.id}`);
        let submission = submissions[assignment.id];
        let score = submission.score;

        //If needs grading, mark in red for instructor
        if (submission.workflow_state == 'submitted' && score == null) {
          addDot(el, "#FC0", "Needs to be graded");
          continue;
        }

        //if graded, check if it meets score requirements
        let possible = assignment.points_possible;
        let perc = score / possible;
        if (score != null) {
          //different rules depending on assignment group
          let assignmentGroupName = el.find("div.context").text();
          if (assignmentGroupName === "Skills Pass-Off") {
            let rubricAssessment = {};
            let rubricAssessments = ENV.rubric_assessments;
            //rewrite this to do a filter on the array, sort so the most recent is first, then set that as the assessment
            for (let a in rubricAssessments) {
              let rub = rubricAssessments[a];
              if (rub.rubric_association.association_id == assignment.id) {
                rubricAssessment = rub;
              }
            }

            let rubric = {};
            let rubrics = ENV.rubrics;
            for (let r in rubrics) {
              let rub = rubrics[r];
              if (rub.id == rubricAssessment.rubric_id) {
                rubric = rub;
                break;
              }
            }
            let incompetentItems = 0;
            for (let d in rubric.data) {
              if (rubricAssessment.data[d].points < rubric.data[d].points) {
                incompetentItems += 1;
              }
            }
            if (incompetentItems > 0) {
              addDot(el, "#C00", "Did not meet competency in " + incompetentItems + " areas");
            }
          } else if (perc < .8) {
            addDot(el, "#C00");
          }
        }
      }
    }
  }
}