(async function () {
  await Promise.all([
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/scripts.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/context_menu.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/components/content_detailed.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/components/settings.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/detailed_report_button.js")
  ]);

  $(document).ready(async function() {
    function extractAssignmentId() {
      // Get the current URL from the browser
      const url = window.location.href;

      // Create a regular expression to match the assignment ID
      const regex = /assignments\/(\d+)/;

      // Use the regex to search for the assignment ID in the URL
      const match = url.match(regex);

      // If a match is found, return the assignment ID; otherwise, return null
      return match ? match[1] : null;
    }

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
          console.error(err);
          return false;
        }
        assignmentCriteria = (await getCriteria('Quizzes'))['Quizzes'];
      } 
      // Regular Assignments
      else {
        if (ENV.ASSIGNMENT_ID == undefined) {
          ENV.ASSIGNMENT_ID = extractAssignmentId(); 
          ENV.IS_LTI = true;
        }
        assignmentData = (await canvasGet(`/api/v1/courses/${ENV.COURSE_ID}/assignments/${ENV.ASSIGNMENT_ID}`))[0];
        assignmentCriteria = (await getCriteria('Assignments'))['Assignments'];
        rubricCriteria = (await getCriteria('Rubrics'))['Rubrics'];
        try {
          assignmentReviewData = await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${ENV.COURSE_ID}/assignments/${ENV.ASSIGNMENT_ID}`);
        } catch (err) {
          console.error(err);
          return false;
        }
        try {
          rubricReviewData = await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${ENV.COURSE_ID}/assignments/${ENV.ASSIGNMENT_ID}/rubric`);
        } catch (err) {
          rubricReviewData = undefined;
          console.error(err);
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
        console.error(err);
      }

      return true;
    }

    

    await refreshData();
   // Function to create and position the custom context menu
   // Function to create and position the custom context menu

    if (assignmentReviewData?.assignment_id == undefined) return;
    let $modal = initModal();
    let $vueApp = generateDetailedContent('Assignments', assignmentReviewData, rubricReviewData, assignmentCriteria, rubricCriteria, objectivesData);
    let $detailedReportButton = addDetailedReportButton($vueApp);
    addContextMenu($detailedReportButton, [
      { id: 'reevaluate', text: 'Reevaluate', func: async function () {
        $detailedReportButton.html('');
        let assignmentId = assignmentData.id;
        if (ENV.ASSIGNMENT?.is_quiz_lti_assignment ?? false) {
          let description = assignmentData.instructions;
          await evaluateNewQuiz(ENV.COURSE_ID, courseCode, year, assignmentId, description);
        } else {
          let description = assignmentData.description;
          let rubric = JSON.stringify(assignmentData.rubric);
          await evaluateAssignment(ENV.COURSE_ID, courseCode, year, assignmentId, description, rubric, ENV.IS_LTI);
        }
        await refreshData();
        let reviewData = assignmentReviewData;
        let criteria = assignmentCriteria;
        $vueApp.contentData = reviewData;
        setButtonHTML($detailedReportButton, reviewData, criteria, rubricReviewData, rubricCriteria);
      }},
      { id: 'disable', text: 'Toggle Ignore', func: async function () {
        reviewData.ignore = !reviewData.ignore;
        setButtonHTML($detailedReportButton, reviewData, criteria, null, null);
        ignoreItem(reviewData.course_id, 'assignments', reviewData.assignment_id, !reviewData.ignore);
      }},
      // { id: 'clearReview', text: 'Clear Review', func: () => {}}
    ]);


    let reviewData = assignmentReviewData;
    let criteria = assignmentCriteria;
    setButtonHTML($detailedReportButton, reviewData, criteria, rubricReviewData, rubricCriteria);
  });
})();