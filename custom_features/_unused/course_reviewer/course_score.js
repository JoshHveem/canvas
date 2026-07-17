(async function () {
  await Promise.all([
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/scripts.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/components/course_content.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/components/content_detailed.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/components/surveys.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/components/settings.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/course_score_els.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/course_scripts.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/context_menu.js"),
    $.getScript("https://bridgetools.dev/canvas/custom_features/course_reviewer/detailed_report_button.js")
  ]);


  // insert empty icons for unscored items
  $(".context_module_item").each(function() {
    let el = $(this);
    let infoEl = el.find('div.ig-info')
    infoEl.before(`<span class="ig-btech-evaluation-score" style="font-size: 1rem; cursor: pointer; user-select: none;"></span>`)
  });

  // insert empty icons for modules
  $(".ig-header").each(function() {
    let el = $(this);
    el.find('span.name').prepend(`<span class="ig-btech-evaluation-score" style="font-size: 1rem; cursor: pointer; user-select: none;">⚪</span>`);
  });

  // init vars
  var 
    courseData
    , externalContentCounts
    , assignmentsData
    , courseReviewData
    , criteria
    , objectivesData
    , courseCode
    , year
    , bloomsCounts
    , topicTagsCounts
    , objectivesCounts
    , totalContentCounts
    , runningReviewer
    ;
    runningReviewer = false;

  async function initIcons() {
    totalContentCounts = 0;
    $(".context_module_item span.ig-btech-evaluation-score").each(function() {
      let el = $(this);
      el.html(`⚪`);
      totalContentCounts += 1;
    });
    $(".context_module_item.attachment span.ig-btech-evaluation-score").each(function() {
      let el = $(this);
      el.html(`🚫`);
    });
    $(".context_module_item.external_url span.ig-btech-evaluation-score").each(function() {
      let el = $(this);
      el.html(`🚫`);
    });
    $(".context_module_item.context_external_tool span.ig-btech-evaluation-score").each(function() {
      let el = $(this);
      el.html(`🚫`);
    });
    $(".context_module_item.context_module_sub_header span.ig-btech-evaluation-score").each(function() {
      let el = $(this);
      el.html(``);
      totalContentCounts -= 1;
    });

    await calcExternalContentCount();
  }

  async function calcExternalContentCount() {
    try {
      assignmentsData = await canvasGet(`/api/v1/courses/${ENV.COURSE_ID}/assignments`);
      for (let a in assignmentsData) {
        let assignment = assignmentsData[a];
        if (assignment.submission_types.includes('external_tool') && !assignment.is_quiz_assignment) {
          $(`.Assignment_${assignment.id} span.ig-btech-evaluation-score`).html('🚫');
        }
      }
    } catch (err) {
      console.error(err);
    }

    let externalContentCount = 0;
    $("span.ig-btech-evaluation-score").each(function() {
      let el = $(this);
      if (el.html() == `🚫`) externalContentCount += 1;
    });
    return externalContentCount;
  }

  function calcBloomsCounts(quizReviews, assignmentReviews, discussionReviews) {
    let bloomsCounts = {};
    for (let q in quizReviews) {
      let quiz = quizReviews[q];
      // blooms
      if (quiz.blooms) {
        if (bloomsCounts?.[quiz.blooms] === undefined) bloomsCounts[quiz.blooms] = 0;
        bloomsCounts[quiz.blooms] += 1;
      }
    }

    for (let d in discussionReviews) {
      let discussion = discussionReviews[d];
      // blooms
      if (discussion.blooms) {
        if (bloomsCounts?.[discussion.blooms] === undefined) bloomsCounts[discussion.blooms] = 0;
        bloomsCounts[discussion.blooms] += 1;
      }
    }

    for (let a in assignmentReviews) {
      let assignment = assignmentReviews[a];
      // blooms
      if (assignment.blooms) {
        if (bloomsCounts?.[assignment.blooms] === undefined) bloomsCounts[assignment.blooms] = 0;
        bloomsCounts[assignment.blooms] += 1;
      }
    }
    return bloomsCounts;
  }

  function calcObjectivesCounts(quizReviews, assignmentReviews, discussionReviews) {
    let objectivesCounts = {};
    objectivesCounts =  addObjectives(objectivesCounts, quizReviews);
    objectivesCounts =  addObjectives(objectivesCounts, discussionReviews);
    objectivesCounts =  addObjectives(objectivesCounts, assignmentReviews);

    return objectivesCounts;
  }

  function setIcon($scoreEl, type, contentReview, contentCriteria, rubricReview, rubricCriteria) {
    let score = calcCriteriaAverageScore(contentReview, contentCriteria);
    $scoreEl.html('');
    if (contentReview.ignore) {
      $scoreEl.html('🚫');
    } else {
      if (rubricReview !== null || type === 'Assignment') {
        $scoreEl.html(
          `<div class="btech-course-reviewer-score-left" style="position: absolute; clip-path: inset(0 50% 0 0);">${calcEmoji(score)}</div><div class="btech-course-reviewer-assignment-score-right" style="clip-path: inset(0 0 0 50%);">⚪</div>`
        );
        if (rubricReview !== null) {
          let rubricScore = calcCriteriaAverageScore(rubricReview, rubricCriteria);
          $scoreEl.find(`.btech-course-reviewer-assignment-score-right`).html(
              `${calcEmoji(rubricScore)}`
          );
        }
      } else {
        $scoreEl.html(calcEmoji(score));
      }
    }
  }

  function initContentIcon($scoreEl, $vueApp, $modal, type, contentReview, contentCriteria, rubricReview = null, rubricCriteria = null) {
    setIcon($scoreEl, type, contentReview, contentCriteria, rubricReview, rubricCriteria);
    $scoreEl.click(function (e) {
      e.stopPropagation();
      $vueApp.individualContent = {
        type: type,
        contentData: contentReview,
        contentCriteria: contentCriteria,
        rubricData: rubricReview ?? {},
        rubricCriteria: rubricCriteria ?? {} 
      }
      $vueApp.menuCurrent = 'individual';
      $modal.show();

    });

    addContextMenu($scoreEl, [
      { id: 'reevaluate', text: 'Reevaluate', func: async function () {
        if (contentReview?.module_id) {
          $scoreEl.html('⚪'); // Clear the content while reevaluating
          await bridgetools.req(
            `https://reports.bridgetools.dev/api/reviews/courses/${ENV.COURSE_ID}/modules/${contentReview.module_id}/evaluate`,
            { course_code: courseCode, year: year },
            'POST'
          );

          let module;
          do {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
            module = await bridgetools.req(
              `https://reports.bridgetools.dev/api/reviews/courses/${ENV.COURSE_ID}/modules/${contentReview.module_id}`
            );
          } while (new Date(module.last_update) <= new Date(contentReview.last_update));

          setIcon($scoreEl, type, module, contentCriteria, rubricReview, rubricCriteria);
        }
      }},
      { id: 'ignore', text: 'Toggle Ignore', func: async function () {
        if (contentReview?.type == 'Page') {
          ignoreItem(contentReview.course_id, 'pages', contentReview.page_id, !contentReview.ignore);
        }
        if (contentReview?.type == 'Assignment') {
          ignoreItem(contentReview.course_id, 'assignments', contentReview.assignment_id, !contentReview.ignore);
        }
        if (contentReview?.type == 'Quiz') {
          ignoreItem(contentReview.course_id, 'quizzes', contentReview.quiz_id, !contentReview.ignore);
        }
        if (contentReview?.type == 'Discussions') {
          ignoreItem(contentReview.course_id, 'discussions', contentReview.discussion_id, !contentReview.ignore);
        }
      }},
      // { id: 'clearReview', text: 'Clear Review', func: () => {}}
    ], 'absolute');
  }

  function getRubricReview(contentId, rubricReviews) {
    for (let r in rubricReviews) {
      let rubric = courseReviewData.rubrics[r];
      if (rubric.assignment_id == contentId) return rubric;
    }
  }

  function refreshIcons($vueApp, $modal) {
    // get assignment data to locate external assignments

    for (let m in courseReviewData.modules) {
      let moduleReview = courseReviewData.modules[m];
      let $scoreEl = $(`#${moduleReview.module_id} span.ig-btech-evaluation-score`);
      initContentIcon($scoreEl, $vueApp, $modal, 'Module', moduleReview, criteria.Modules);
    }

    for (let p in courseReviewData.pages) {
      let page = courseReviewData.pages[p];
      page.name = $(`.WikiPage_${page.page_id} span.item_name a.title`).text().trim();
      let $scoreEl = $(`.WikiPage_${page.page_id} span.ig-btech-evaluation-score`);
      initContentIcon($scoreEl, $vueApp, $modal, 'Page', page, criteria.Pages);
    }

    for (let q in courseReviewData.quizzes) {
      let quiz = courseReviewData.quizzes[q];
      quiz.name = $(`.Quiz_${quiz.quiz_id} span.item_name a.title`).text().trim();
      let $scoreEl = $(`.Quiz_${quiz.quiz_id} span.ig-btech-evaluation-score`);
      initContentIcon($scoreEl, $vueApp, $modal, 'Quiz', quiz, criteria.Quizzes);
    }

    for (let d in courseReviewData.discussions) {
      let discussion = courseReviewData.discussions[d];
      discussion.name = $(`.DiscussionTopic_${discussion.discussion_id} span.item_name a.title`).text().trim();
      let $scoreEl = $(`.DiscussionTopic_${discussion.discussion_id} span.ig-btech-evaluation-score`);
      initContentIcon($scoreEl, $vueApp, $modal, 'Discussion', discussion, criteria.Discussions);
    }

    for (let a in courseReviewData.assignments) {
      let assignment = courseReviewData.assignments[a];
      assignment.name = $(`.Assignment_${assignment.assignment_id} span.item_name a.title`).text().trim();
      if (assignment.quiz_id) {
        let $scoreEl = $(`.Assignment_${assignment.quiz_id} span.ig-btech-evaluation-score`);
        initContentIcon($scoreEl, $vueApp, $modal, 'Quiz', assignment, criteria.Quizzes);
      }
      else if (assignment.assignment_id) {
        let rubric = getRubricReview(assignment.assignment_id, courseReviewData.rubrics);
        let $scoreEl = $(`.Assignment_${assignment.assignment_id} span.ig-btech-evaluation-score`);
        initContentIcon($scoreEl, $vueApp, $modal, 'Assignment', assignment, criteria.Assignments, rubric, criteria.Rubrics);
      }
    }

  }
  
  async function refreshData() {
    let start = new Date();
    // get course level data
    courseData = {};
    courseReviewData = {};
    objectivesData = [];
    criteria = {};
    year = null;
    courseCode = '';
    topicTagsCounts = {};

    [courseData, courseReviewData, criteria] = await Promise.all([
      (await canvasGet(`/api/v1/courses/${ENV.COURSE_ID}`))[0],
      await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${ENV.COURSE_ID}`),
      await getCriteria(),
    ]);
    if (courseReviewData.surveys == undefined) courseReviewData.surveys = {last_update: new Date()};
    else courseReviewData.surveys.last_update = new Date(courseReviewData.surveys.last_update);
    start = new Date();

    let courseCodeYear = getCourseCodeYear(courseData);
    year = courseCodeYear.year;
    courseCode = courseCodeYear.courseCode;



    try {
      objectivesData = await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${courseCode}/year/${year}/objectives`);
    } catch (err) {
      console.error(err);
    }
    start = new Date();

    objectivesCounts = calcObjectivesCounts(courseReviewData.quizzes, courseReviewData.assignments, courseReviewData.discussions);
    bloomsCounts = calcBloomsCounts(courseReviewData.quizzes, courseReviewData.assignments, courseReviewData.discussions);
    // objectivesCounts =  addObjectives(objectivesCounts, courseReviewData.pages);

    return true;
  }


  $(document).ready(async function() {
    initIcons();
    let $modal = initModal();
    await refreshData();
    let $vueApp = generateDetailedCourseContent(
      courseReviewData
      , courseCode
      , year
      , criteria
      , objectivesData
      , objectivesCounts
      , externalContentCounts
      , totalContentCounts
      , bloomsCounts
    );
    refreshIcons($vueApp, $modal);
    // button creates container, must run button first
    let $detailedReportButton = addDetailedReportButton($vueApp);
    addContextMenu($detailedReportButton, [
      { id: 'reevaluate', text: 'Reevaluate All', func: async function () {
        updateReviewProgress({processed: 0, remaining: 1});
        await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/courses/${ENV.COURSE_ID}/evaluate_content`, {course_code: courseCode, year: year}, 'POST');
        checkReviewProgress(
          courseReviewData, criteria
        );
      }},
      { id: 'refreshScore', text: 'Refresh Score', func: async function () {
        $detailedReportButton.html('');
        await refreshData();
        let courseScore = calcCourseScore(
          courseReviewData, criteria
        );
        let emoji = calcEmoji(courseScore);
        $detailedReportButton.html(emoji);
      }},
      // { id: 'clearReview', text: 'Clear Review', func: () => {}}
    ], 'fixed');
    let courseScore = calcCourseScore(
      courseReviewData, criteria
    );
    let emoji = calcEmoji(courseScore);
    $detailedReportButton.append(emoji);
    initReviewProgressInterval(
      courseReviewData, criteria
    );
  })
})();