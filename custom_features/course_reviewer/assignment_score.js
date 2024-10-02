(async function () {
  await Promise.all([
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/scripts.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/context_menu.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/detailed_report_button.js")
  ]);

  $(document).ready(async function() {
    var courseData, assignmentData, assignmentReviewData, assignmentCriteria, rubricCriteria, rubricReviewData, objectivesData, relatedAssignments, courseCode, year;
    async function refreshData() {
      // course level data
      courseData  = (await canvasGet(`/api/v1/courses/${ENV.COURSE_ID}`))[0];
      let courseCodeYear = getCourseCodeYear(courseData);
      year = courseCodeYear.year;
      courseCode = courseCodeYear.courseCode;

      //New Quizzes
      if (ENV.ASSIGNMENT?.is_quiz_lti_assignment ?? false) {
        assignmentData = (await canvasGet(`/api/quiz/v1/courses/${ENV.COURSE_ID}/quizzes/${ENV.ASSIGNMENT.id}`))[0];
        try {
          assignmentReviewData = await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${ENV.COURSE_ID}/quizzes/${ENV.ASSIGNMENT.id}`);
        } catch (err) {
          console.log(err);
          return false;
        }
        assignmentCriteria = (await getCriteria('Quizzes'))['Quizzes'];
      } 
      // Regular Assignments
      else {
        assignmentData = (await canvasGet(`/api/v1/courses/${ENV.COURSE_ID}/assignments/${ENV.ASSIGNMENT_ID}`))[0];
        assignmentCriteria = (await getCriteria('Assignments'))['Assignments'];
        rubricCriteria = (await getCriteria('Rubrics'))['Rubrics'];
        try {
          assignmentReviewData = await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${ENV.COURSE_ID}/assignments/${ENV.ASSIGNMENT_ID}`);
        } catch (err) {
          console.log(err);
          return false;
        }
        try {
          rubricReviewData = await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${ENV.COURSE_ID}/assignments/${ENV.ASSIGNMENT_ID}/rubric`);
          console.log(rubricReviewData);
        } catch (err) {
          rubricReviewData = undefined;
          console.log(err);
        }
      }

      // objectives
      let objectivesQueryString = '';
      for (let o in assignmentReviewData.objectives) {
        if (o > 0) objectivesQueryString += '&';
        objectivesQueryString += 'objectives[]=' + assignmentReviewData.objectives[o];
      }

      try {
        objectivesData = await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${courseCode}/year/${year}/objectives`);
      } catch (err) {
        objectivesData = [];
        console.log(err);
      }

      return true;
    }

    

    await refreshData();
   // Function to create and position the custom context menu
   // Function to create and position the custom context menu

    if (assignmentReviewData?.assignment_id == undefined) return;
    let $detailedReportButton = addDetailedReportButton();
    generateDetailedContent('Assignments', assignmentReviewData, rubricReviewData, assignmentCriteria, rubricCriteria, objectivesData);
    addContextMenu($detailedReportButton, [
      { id: 'reevaluate', text: 'Reevaluate', func: async function () {
        $detailedReportButton.html('')
        let assignmentId = assignmentData.id;
        if (ENV.ASSIGNMENT?.is_quiz_lti_assignment ?? false) {
          let description = assignmentData.instructions;
          await evaluateNewQuiz(ENV.COURSE_ID, courseCode, year, assignmentId, description);
        } else {
          let description = assignmentData.description;
          let rubric = JSON.stringify(assignmentData.rubric);
          await evaluateAssignment(ENV.COURSE_ID, courseCode, year, assignmentId, description, rubric);
        }
        await refreshData();
      }},
      { id: 'disable', text: 'Toggle Ignore', func: async function () {
      }},
      // { id: 'clearReview', text: 'Clear Review', func: () => {}}
    ]);


    let data = assignmentReviewData;
    let averageScore = calcCriteriaAverageScore(data, assignmentCriteria);
    console.log(rubricReviewData);
    let averageRubricScore = calcCriteriaAverageScore(rubricReviewData, rubricCriteria);
    if (data.ignore) $detailedReportButton.html('🚫');
    else {
      $detailedReportButton.html(`<div class="btech-course-reviewer-assignment-score-left" style="position: absolute; clip-path: inset(0 50% 0 0);">${emoji?.[averageScore]}</div><div class="btech-course-reviewer-assignment-score-right" style="clip-path: inset(0 0 0 50%);">⚪</div>`);
      $(`.btech-course-reviewer-assignment-score-right`).html(
          `${emoji?.[averageRubricScore]}`
      );
    }
  });
})();