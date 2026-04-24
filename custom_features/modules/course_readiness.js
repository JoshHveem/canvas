(async function () {
  if (!IS_TEACHER) return;

  const courseId = ENV.COURSE_ID ?? ENV.course_id;
  const cardId = "btech-course-readiness-checklist";
  const styleId = "btech-course-readiness-style";
  const refreshMs = 60000;
  const instructorEvalId = "243044643269963";
  const courseEvalId = "241976981675072";

  if (!courseId) return;

  function escapeHtml(value) {
    return $("<div>").text(value ?? "").html();
  }

  function ensureStyles() {
    if (document.getElementById(styleId)) return;

    $("head").append(`
      <style id="${styleId}">
        #${cardId} {
          margin-top: 1rem;
          border: 1px solid #c7cdd1;
          border-radius: 6px;
          background: #ffffff;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        #${cardId} .btech-course-readiness__header {
          padding: 0.9rem 1rem;
          background: #f7f9fa;
          border-bottom: 1px solid #c7cdd1;
        }

        #${cardId} .btech-course-readiness__title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.35rem;
        }

        #${cardId} .btech-course-readiness__title {
          margin: 0;
          font-size: 1rem;
          line-height: 1.3;
          color: #2d3b45;
        }

        #${cardId} .btech-course-readiness__status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0.15rem 0.6rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }

        #${cardId} .btech-course-readiness__status.is-pass {
          background: #dff3e4;
          color: #0b6b2f;
        }

        #${cardId} .btech-course-readiness__status.is-fail {
          background: #fde8e8;
          color: #a61b1b;
        }

        #${cardId} .btech-course-readiness__meta {
          margin: 0;
          font-size: 0.75rem;
          color: #5b6d79;
        }

        #${cardId} .btech-course-readiness__body {
          padding: 1rem;
        }

        #${cardId} .btech-course-readiness__checks,
        #${cardId} .btech-course-readiness__issues {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        #${cardId} .btech-course-readiness__checks {
          display: grid;
          gap: 0.6rem;
        }

        #${cardId} .btech-course-readiness__check {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.55rem;
          align-items: start;
        }

        #${cardId} .btech-course-readiness__pill {
          min-width: 2.5rem;
          border-radius: 999px;
          padding: 0.15rem 0.45rem;
          font-size: 0.7rem;
          font-weight: 700;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        #${cardId} .btech-course-readiness__check.is-pass .btech-course-readiness__pill {
          background: #dff3e4;
          color: #0b6b2f;
        }

        #${cardId} .btech-course-readiness__check.is-fail .btech-course-readiness__pill {
          background: #fde8e8;
          color: #a61b1b;
        }

        #${cardId} .btech-course-readiness__check-title {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #2d3b45;
        }

        #${cardId} .btech-course-readiness__check-detail {
          display: block;
          margin-top: 0.15rem;
          font-size: 0.8rem;
          color: #5b6d79;
        }

        #${cardId} .btech-course-readiness__issues {
          margin-top: 1rem;
          display: grid;
          gap: 0.8rem;
        }

        #${cardId} .btech-course-readiness__issue {
          border-top: 1px solid #e5e8ea;
          padding-top: 0.8rem;
        }

        #${cardId} .btech-course-readiness__issue:first-child {
          border-top: 0;
          padding-top: 0;
        }

        #${cardId} .btech-course-readiness__issue-title {
          margin: 0 0 0.35rem;
          font-size: 0.82rem;
          font-weight: 700;
          color: #2d3b45;
        }

        #${cardId} .btech-course-readiness__issue-list {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.8rem;
          color: #2d3b45;
        }

        #${cardId} .btech-course-readiness__issue-list li + li {
          margin-top: 0.2rem;
        }

        #${cardId} .btech-course-readiness__empty,
        #${cardId} .btech-course-readiness__error {
          margin: 0;
          font-size: 0.8rem;
          color: #5b6d79;
        }

        #${cardId} .btech-course-readiness__error {
          color: #a61b1b;
        }
      </style>
    `);
  }

  function ensureCard() {
    const rightWrapper = $("#right-side-wrapper");
    if (!rightWrapper.length) return null;

    let card = $(`#${cardId}`);
    if (!card.length) {
      card = $(`<div id="${cardId}"></div>`);
      rightWrapper.append(card);
    }

    return card;
  }

  function getAssignmentContentIds(assignment) {
    const ids = [Number(assignment.id)];
    const quizId = Number(assignment.quiz_id);

    if (Number.isFinite(quizId) && quizId > 0) ids.push(quizId);

    return ids.filter(id => Number.isFinite(id) && id > 0);
  }

  function getExternalUrl(item) {
    return String(
      item.external_url
      ?? item.url
      ?? item.html_url
      ?? item.content_details?.url
      ?? ""
    ).toLowerCase();
  }

  async function getCourseData() {
    const [course, assignmentGroups, modules] = await Promise.all([
      $.get(`/api/v1/courses/${courseId}`),
      canvasGet(`/api/v1/courses/${courseId}/assignment_groups?include[]=assignments`),
      canvasGet(`/api/v1/courses/${courseId}/modules?include[]=items&include[]=content_details`)
    ]);

    const moduleItems = modules.flatMap(module =>
      (module.items ?? []).map(item => ({
        ...item,
        moduleName: module.name
      }))
    );

    const assignmentModuleIds = new Set(
      moduleItems
        .map(item => Number(item.content_id))
        .filter(id => Number.isFinite(id) && id > 0)
    );

    const assignments = assignmentGroups.flatMap(group =>
      (group.assignments ?? []).map(assignment => ({
        ...assignment,
        assignmentGroupName: group.name
      }))
    );

    const assignmentsWorthPointsNotInModule = [];
    const unpublishedAssignmentsInModule = [];
    const seenAssignmentIds = new Set();

    assignments.forEach(assignment => {
      if (seenAssignmentIds.has(assignment.id)) return;
      seenAssignmentIds.add(assignment.id);

      const pointsPossible = Number(assignment.points_possible ?? 0);
      const isInModule = getAssignmentContentIds(assignment).some(id => assignmentModuleIds.has(id));

      if (pointsPossible > 0 && !isInModule) {
        assignmentsWorthPointsNotInModule.push({
          id: assignment.id,
          name: assignment.name,
          pointsPossible,
          assignmentGroupName: assignment.assignmentGroupName
        });
      }

      if (assignment.published === false && isInModule) {
        unpublishedAssignmentsInModule.push({
          id: assignment.id,
          name: assignment.name,
          assignmentGroupName: assignment.assignmentGroupName
        });
      }
    });

    const unpublishedModuleItems = moduleItems
      .filter(item => item.published === false || item.content_details?.published === false)
      .map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        moduleName: item.moduleName
      }));

    const assignmentGroupWeightTotal = assignmentGroups.reduce(
      (sum, group) => sum + Number(group.group_weight ?? 0),
      0
    );
    const usesAssignmentGroupWeights = Boolean(course?.apply_assignment_group_weights);

    const urls = moduleItems
      .map(getExternalUrl)
      .filter(Boolean);

    return {
      hasInstructorEval: urls.some(url => url.includes(`jotform_id=${instructorEvalId}`)),
      hasCourseEval: urls.some(url => url.includes(`jotform_id=${courseEvalId}`)),
      hasAnyContent: moduleItems.length > 0,
      usesAssignmentGroupWeights,
      assignmentGroupWeightsAddTo100: usesAssignmentGroupWeights && Math.abs(assignmentGroupWeightTotal - 100) < 0.001,
      assignmentGroupWeightTotal,
      assignmentsWorthPointsNotInModule,
      unpublishedAssignmentsInModule,
      unpublishedModuleItems
    };
  }

  function getIsReady(data) {
    return Boolean(
      data.hasInstructorEval
      && data.hasCourseEval
      && data.hasAnyContent
      && data.assignmentGroupWeightsAddTo100
      && data.assignmentsWorthPointsNotInModule.length === 0
      && data.unpublishedAssignmentsInModule.length === 0
      && data.unpublishedModuleItems.length === 0
    );
  }

  function renderCheck(title, passed, detail) {
    return `
      <li class="btech-course-readiness__check ${passed ? "is-pass" : "is-fail"}">
        <span class="btech-course-readiness__pill">${passed ? "Pass" : "Fix"}</span>
        <div>
          <span class="btech-course-readiness__check-title">${escapeHtml(title)}</span>
        </div>
      </li>
    `;
  }

  function renderIssue(title, items, formatter) {
    if (!items.length) return "";

    return `
      <li class="btech-course-readiness__issue">
        <p class="btech-course-readiness__issue-title">${escapeHtml(title)} (${items.length})</p>
        <ul class="btech-course-readiness__issue-list">
          ${items.map(item => `<li>${formatter(item)}</li>`).join("")}
        </ul>
      </li>
    `;
  }

  function renderCard(card, data, errorMessage = "") {
    const updatedAt = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });

    if (errorMessage) {
      card.html(`
        <div class="btech-course-readiness__header">
          <div class="btech-course-readiness__title-row">
            <h2 class="btech-course-readiness__title">Is Course Ready to Publish?</h2>
            <span class="btech-course-readiness__status is-fail">Error</span>
          </div>
          <p class="btech-course-readiness__meta">Last checked ${escapeHtml(updatedAt)}</p>
        </div>
        <div class="btech-course-readiness__body">
          <p class="btech-course-readiness__error">${escapeHtml(errorMessage)}</p>
        </div>
      `);
      return;
    }

    const isReady = getIsReady(data);
    const issuesMarkup = [
      renderIssue(
        "Assignments worth points but not in a module",
        data.assignmentsWorthPointsNotInModule,
        item => `${escapeHtml(item.name)} (${escapeHtml(String(item.pointsPossible))} pts)`
      ),
      renderIssue(
        "Unpublished assignments in modules",
        data.unpublishedAssignmentsInModule,
        item => escapeHtml(item.name)
      ),
      renderIssue(
        "Unpublished module items",
        data.unpublishedModuleItems,
        item => `${escapeHtml(item.title || item.type || "Module item")} (${escapeHtml(item.moduleName || "Unknown module")})`
      )
    ].join("");

    card.html(`
      <div class="btech-course-readiness__header">
        <div class="btech-course-readiness__title-row">
          <h2 class="btech-course-readiness__title">Course Ready?</h2>
          <span class="btech-course-readiness__status ${isReady ? "is-pass" : "is-fail"}">
            ${isReady ? "Ready" : "Not Ready"}
          </span>
        </div>
        <p class="btech-course-readiness__meta">Last checked ${escapeHtml(updatedAt)}</p>
      </div>
      <div class="btech-course-readiness__body">
        <ul class="btech-course-readiness__checks">
          ${renderCheck(
            "Instructor Evaluation",
            data.hasInstructorEval,
            data.hasInstructorEval ? "Instructor evaluation link found." : "Add the instructor evaluation link to a module."
          )}
          ${renderCheck(
            "Course Evaluation",
            data.hasCourseEval,
            data.hasCourseEval ? "Course evaluation link found." : "Add the course evaluation link to a module."
          )}
          ${renderCheck(
            "Course Content",
            data.hasAnyContent,
            data.hasAnyContent ? "At least one module item was found." : "No module items were found in this course."
          )}
          ${renderCheck(
            "Group Weights = 100%",
            data.assignmentGroupWeightsAddTo100,
            data.usesAssignmentGroupWeights
              ? `Current total: ${Math.round(data.assignmentGroupWeightTotal * 100) / 100}%`
              : "Assignment group weighting is not enabled for this course."
          )}
          ${renderCheck(
            "Assignments in Modules",
            data.assignmentsWorthPointsNotInModule.length === 0 && data.hasAnyContent,
            data.assignmentsWorthPointsNotInModule.length === 0
              ? "All point-bearing assignments are in a module."
              : `${data.assignmentsWorthPointsNotInModule.length} assignment(s) still need a module placement.`
          )}
          ${renderCheck(
            "Assignments Published",
            data.unpublishedAssignmentsInModule.length === 0 && data.hasAnyContent,
            data.unpublishedAssignmentsInModule.length === 0
              ? "All assignments found in modules are published."
              : `${data.unpublishedAssignmentsInModule.length} assignment(s) in modules are still unpublished.`
          )}
          ${renderCheck(
            "Content Published",
            data.unpublishedModuleItems.length === 0 && data.hasAnyContent,
            data.unpublishedModuleItems.length === 0
              ? "No unpublished module items were found."
              : `${data.unpublishedModuleItems.length} module item(s) are still unpublished.`
          )}
        </ul>
      </div>
    `);
  }

  let isRefreshing = false;

  async function refreshCourseReadiness() {
    const card = ensureCard();
    if (!card || isRefreshing) return;

    isRefreshing = true;

    try {
      if (!card.html().trim()) {
        card.html(`
          <div class="btech-course-readiness__header">
            <div class="btech-course-readiness__title-row">
              <h2 class="btech-course-readiness__title">Is Course Ready to Publish?</h2>
              <span class="btech-course-readiness__status is-fail">Loading</span>
            </div>
            <p class="btech-course-readiness__meta">Preparing checklist...</p>
          </div>
        `);
      }

      const data = await getCourseData();
      renderCard(card, data);
    } catch (error) {
      console.error("Course readiness check failed.", error);
      renderCard(card, null, "Unable to refresh the course readiness checklist right now.");
    } finally {
      isRefreshing = false;
    }
  }

  ensureStyles();
  await refreshCourseReadiness();

  if (window.__btechCourseReadinessIntervalId) {
    clearInterval(window.__btechCourseReadinessIntervalId);
  }

  window.__btechCourseReadinessIntervalId = window.setInterval(refreshCourseReadiness, refreshMs);
})();
