(async function () {
  await Promise.all([
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/scripts.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/context_menu.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/components/content_detailed.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/components/settings.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/detailed_report_button.js")
  ]);
  $(document).ready(async function() {
    var courseData, pageReviewData, pageCriteria, objectivesData, courseCode, year;
    async function refreshData() {
      // course level data
      courseData  = (await canvasGet(`/api/v1/courses/${ENV.COURSE_ID}`))[0];
      let courseCodeYear = getCourseCodeYear(courseData);
      year = courseCodeYear.year;
      courseCode = courseCodeYear.courseCode;

      // criteria
      let criteriaData = (await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/criteria/type/Pages`));
      pageCriteria = {};
      for (let c in criteriaData) {
        let criterion = criteriaData[c];
        let name = criterionNameToVariable(criterion.name);
        pageCriteria[name] = criterion;
      }

      try {
        pageReviewData = await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${ENV.COURSE_ID}/pages/${ENV.WIKI_PAGE.page_id}`);
      } catch (err) {
        console.error(err);
        return false;
      }

      // objectives
      let objectivesQueryString = '';
      for (let o in pageReviewData.objectives) {
        if (o > 0) objectivesQueryString += '&';
        objectivesQueryString += 'objectives[]=' + pageReviewData.objectives[o];
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

    if (pageReviewData?.page_id == undefined) return;
    let $modal = initModal();
    let $vueApp = await generateDetailedContent('Pages', pageReviewData, null, pageCriteria, null, objectivesData);
    let $detailedReportButton = addDetailedReportButton($vueApp);
    addContextMenu($detailedReportButton, [
      { id: 'reevaluate', text: 'Reevaluate', func: async function () {
        $detailedReportButton.html('');
        await evaluatePage(ENV.COURSE_ID, courseCode, year, ENV.WIKI_PAGE.page_id, ENV.WIKI_PAGE.body);
        await refreshData();
        let reviewData = pageReviewData;
        let criteria = pageCriteria;
        $vueApp.contentData = reviewData;
        setButtonHTML($detailedReportButton, reviewData, criteria, null, null);
      }},
      { id: 'disable', text: 'Toggle Ignore', func: async function () {
        reviewData.ignore = !reviewData.ignore;
        setButtonHTML($detailedReportButton, reviewData, criteria, null, null);
        ignoreItem(reviewData.course_id, 'pages', reviewData.page_id, reviewData.ignore);
      }},
      // { id: 'clearReview', text: 'Clear Review', func: () => {}}
    ]);

    let reviewData = pageReviewData;
    let criteria = pageCriteria;
    setButtonHTML($detailedReportButton, reviewData, criteria, null, null);
  })
})();