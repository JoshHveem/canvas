/*
// this should be enough to pull all questions that could possibly appear in the quiz.
// need to probably weight it by the number of questions pulled from each group
//// somehow randomly select some of the questions if it's over x ammount, e.g. pull up to 2x the number of items pulled into the quiz itself.
// then need to pull questions that aren't in a bank separately
*/
(async function () {
  await Promise.all([
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/scripts.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/context_menu.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/components/content_detailed.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/components/settings.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/components/settings.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/detailed_report_button.js")
  ]);

  var courseData, quizReviewData = {}, quizCriteria = {}, quizData = {}, objectivesData, courseCode, year;
  $(document).ready(async function() {

    async function refreshData() {
      let criteriaData = (await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/criteria/type/Quizzes`));
      quizCriteria = {};
      for (let c in criteriaData) {
        let criterion = criteriaData[c];
        let name = criterionNameToVariable(criterion.name);
        quizCriteria[name] = criterion;
      }

      courseData  = (await canvasGet(`/api/v1/courses/${ENV.COURSE_ID}`))[0];
      quizData = (await canvasGet(`/api/v1/courses/${ENV.COURSE_ID}/quizzes/${ENV.QUIZ.id}`))[0];
      let courseCodeYear = getCourseCodeYear(courseData);
      year = courseCodeYear.year;
      courseCode = courseCodeYear.courseCode;
      try {
        quizReviewData = await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${ENV.COURSE_ID}/quizzes/${ENV.QUIZ.id}`);
      } catch (err) {
        console.log(err);
        return false;
      }

      let objectivesQueryString = '';
      for (let o in quizReviewData.objectives) {
        if (o > 0) objectivesQueryString += '&';
        objectivesQueryString += 'objectives[]=' + quizReviewData.objectives[o];
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

    if (quizReviewData?.quiz_id == undefined) return;
    let rubricReviewData = null;
    let rubricCriteria = null;
    let $modal = initModal();
    let $vueApp = generateDetailedContent('Quizzes', quizReviewData, null, quizCriteria, null, objectivesData);
    let $detailedReportButton = addDetailedReportButton($vueApp)

    addContextMenu($detailedReportButton, [
      { id: 'reevaluate', text: 'Reevaluate', func: async function () {
        $detailedReportButton.html('');
        await evaluateQuiz(ENV.COURSE_ID, courseCode, year, quizData.id, quizData.description)
        await refreshData();
        let reviewData = quizReviewData;
        let criteria = quizCriteria;
        setButtonHTML($detailedReportButton, reviewData, criteria, rubricReviewData, rubricCriteria);
      }},
      { id: 'disable', text: 'Toggle Ignore', func: async function () {
        console.log(reviewData);
        ignoreItem(reviewData.course_id, 'quizzes', reviewData.quiz_id, !reviewData.ignore);
      }},
      // { id: 'clearReview', text: 'Clear Review', func: () => {}}
    ]);

    let reviewData = quizReviewData;
    let criteria = quizCriteria;
    setButtonHTML($detailedReportButton, reviewData, criteria, rubricReviewData, rubricCriteria);
  });
})();