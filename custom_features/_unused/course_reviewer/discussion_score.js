/*
// this should be enough to pull all questions that could possibly appear in the discussion.
// need to probably weight it by the number of questions pulled from each group
//// somehow randomly select some of the questions if it's over x ammount, e.g. pull up to 2x the number of items pulled into the discussion itself.
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

  var courseData, discussionReviewData = {}, discussionCriteria = {}, discussionData = {}, objectivesData, courseCode, year;
  $(document).ready(async function() {

    async function refreshData() {
      let criteriaData = (await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/criteria/type/Discussions`));
      discussionCriteria = {};
      for (let c in criteriaData) {
        let criterion = criteriaData[c];
        let name = criterionNameToVariable(criterion.name);
        discussionCriteria[name] = criterion;
      }

      courseData  = (await canvasGet(`/api/v1/courses/${ENV.course_id}`))[0];
      discussionData = (await canvasGet(`/api/v1/courses/${ENV.course_id}/discussion_topics/${ENV.discussion_topic_id}`))[0];
      let courseCodeYear = getCourseCodeYear(courseData);
      year = courseCodeYear.year;
      courseCode = courseCodeYear.courseCode;
      try {
        discussionReviewData = await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${ENV.course_id}/discussions/${ENV.discussion_topic_id}`);
      } catch (err) {
        console.error(err);
        return false;
      }

      let objectivesQueryString = '';
      for (let o in discussionReviewData.objectives) {
        if (o > 0) objectivesQueryString += '&';
        objectivesQueryString += 'objectives[]=' + discussionReviewData.objectives[o];
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

    if (discussionReviewData?.discussion_id == undefined) return;
    let rubricReviewData = null;
    let rubricCriteria = null;
    let $modal = initModal();
    let $vueApp = generateDetailedContent('Discussions', discussionReviewData, null, discussionCriteria, null, objectivesData);
    let $detailedReportButton = addDetailedReportButton($vueApp)

    addContextMenu($detailedReportButton, [
      { id: 'reevaluate', text: 'Reevaluate', func: async function () {
        $detailedReportButton.html('');
        await evaluateDiscussion(ENV.course_id, courseCode, year, discussionData.id, discussionData.message, {});
        await refreshData();
        let reviewData = discussionReviewData;
        let criteria = discussionCriteria;
        $vueApp.contentData = reviewData;
        setButtonHTML($detailedReportButton, reviewData, criteria, rubricReviewData, rubricCriteria);
      }},
      { id: 'disable', text: 'Toggle Ignore', func: async function () {
        reviewData.ignore = !reviewData.ignore;
        setButtonHTML($detailedReportButton, reviewData, criteria, null, null);
        ignoreItem(reviewData.course_id, 'discussions', reviewData.discussion_id, reviewData.ignore);
      }},
      // { id: 'clearReview', text: 'Clear Review', func: () => {}}
    ]);

    let reviewData = discussionReviewData;
    let criteria = discussionCriteria;
    setButtonHTML($detailedReportButton, reviewData, criteria, rubricReviewData, rubricCriteria);
  });
})();