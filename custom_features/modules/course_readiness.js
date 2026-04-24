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
          margin-bottom: 0.6rem;
        }

        #${cardId} .btech-course-readiness__title {
          margin: 0;
          font-size: 1rem;
          line-height: 1.3;
          color: #2d3b45;
        }

        #${cardId} .btech-course-readiness__status {
          position: relative;
          height: 1.15rem;
          border-radius: 999px;
          overflow: hidden;
          background: #e5e8ea;
        }

        #${cardId} .btech-course-readiness__status-bar {
          display: flex;
          width: 100%;
          height: 100%;
        }

        #${cardId} .btech-course-readiness__status-segment {
          height: 100%;
        }

        #${cardId} .btech-course-readiness__status-segment.is-pass {
          background: #dff3e4;
        }

        #${cardId} .btech-course-readiness__status-segment.is-warn {
          background: #fff3cd;
        }

        #${cardId} .btech-course-readiness__status-segment.is-fail {
          background: #fde8e8;
        }

        #${cardId} .btech-course-readiness__status-label {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 700;
          color: #000000;
          letter-spacing: 0.02em;
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
          display: block;
        }

        #${cardId} .btech-course-readiness__check-header {
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }

        #${cardId} .btech-course-readiness__pill {
          width: 0.8rem;
          height: 0.8rem;
          min-width: 0.8rem;
          border-radius: 999px;
        }

        #${cardId} .btech-course-readiness__check.is-pass .btech-course-readiness__pill {
          background: #dff3e4;
          border: 1px solid #0b6b2f;
        }

        #${cardId} .btech-course-readiness__check.is-warn .btech-course-readiness__pill {
          background: #fff3cd;
          border: 1px solid #8a5b00;
        }

        #${cardId} .btech-course-readiness__check.is-fail .btech-course-readiness__pill {
          background: #fde8e8;
          border: 1px solid #a61b1b;
        }

        #${cardId} .btech-course-readiness__check-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2d3b45;
        }

        #${cardId} .btech-course-readiness__check-detail {
          display: block;
          margin-top: 0.35rem;
          font-size: 0.8rem;
          color: #5b6d79;
        }

        #${cardId} .btech-course-readiness__check-list {
          margin: 0.45rem 0 0 1.35rem;
          padding: 0;
          font-size: 0.8rem;
          color: #2d3b45;
        }

        #${cardId} .btech-course-readiness__check-list li + li {
          margin-top: 0.2rem;
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

  async function getCourseData() {
    const [course, assignmentGroups, modules, assignmentList] = await Promise.all([
      $.get(`/api/v1/courses/${courseId}`),
      canvasGet(`/api/v1/courses/${courseId}/assignment_groups?include[]=assignments`),
      canvasGet(`/api/v1/courses/${courseId}/modules?include[]=items&include[]=content_details`),
      canvasGet(`/api/v1/courses/${courseId}/assignments`)
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

    const evaluationUrls = assignmentList
      .map(assignment => String(assignment?.external_tool_tag_attributes?.url ?? ""))
      .map(url => url.toLowerCase())
      .filter(Boolean);

    const instructorEvalAssignments = assignmentList.filter(assignment =>
      String(assignment?.external_tool_tag_attributes?.url ?? "").toLowerCase().includes(`jotform_id=${instructorEvalId}`)
    );

    const courseEvalAssignments = assignmentList.filter(assignment =>
      String(assignment?.external_tool_tag_attributes?.url ?? "").toLowerCase().includes(`jotform_id=${courseEvalId}`)
    );

    return {
      instructorEvalAssignments,
      courseEvalAssignments,
      hasInstructorEval: evaluationUrls.some(url => url.includes(`jotform_id=${instructorEvalId}`)),
      hasCourseEval: evaluationUrls.some(url => url.includes(`jotform_id=${courseEvalId}`)),
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
    return getOverallStatus(data).state === "pass";
  }

  function getEvaluationCheck(assignments, title) {
    if (!assignments.length) {
      return {
        title,
        state: "fail",
        label: "Fail",
        detail: `Add the ${title.toLowerCase()} assignment.`
      };
    }

    const hasPublishedAssignment = assignments.some(assignment =>
      assignment.published === true || assignment.workflow_state === "published"
    );

    if (hasPublishedAssignment) {
      return {
        title,
        state: "pass",
        label: "Pass",
        detail: `${title} assignment is published.`
      };
    }

    return {
      title,
      state: "warn",
      label: "Unpublished",
      detail: `${title} assignment exists but is not published.`
    };
  }

  function getContentCheck(data) {
    if (!data.hasAnyContent) {
      return {
        title: "Course Content",
        state: "fail",
        label: "Fail",
        detail: "No module items were found in this course."
      };
    }

    return {
      title: "Course Content",
      state: "pass",
      label: "Pass",
      detail: "Course content exists."
    };
  }

  function getWeightsCheck(data) {
    return {
      title: "Group Weights = 100%",
      state: data.assignmentGroupWeightsAddTo100 ? "pass" : "fail",
      label: data.assignmentGroupWeightsAddTo100 ? "Pass" : "Fail",
      detail: data.usesAssignmentGroupWeights
        ? `Current total: ${Math.round(data.assignmentGroupWeightTotal * 100) / 100}%`
        : "Assignment group weighting is not enabled for this course."
    };
  }

  function getAssignmentsInModulesCheck(data) {
    if (!data.hasAnyContent) {
      return {
        title: "Assignments in Modules",
        state: "fail",
        label: "Fail",
        detail: "No module content exists yet."
      };
    }

    if (data.assignmentsWorthPointsNotInModule.length > 0) {
      return {
        title: "Assignments in Modules",
        state: "fail",
        label: "Fail",
        detail: `${data.assignmentsWorthPointsNotInModule.length} assignment(s) still need a module placement.`,
        items: data.assignmentsWorthPointsNotInModule,
        itemFormatter: item => `${escapeHtml(item.name)} (${escapeHtml(String(item.pointsPossible))} pts)`
      };
    }

    return {
      title: "Assignments in Modules",
      state: "pass",
      label: "Pass",
      detail: "All point-bearing assignments are in a module."
    };
  }

  function getAssignmentsPublishedCheck(data) {
    if (!data.hasAnyContent) {
      return {
        title: "Assignments Published",
        state: "fail",
        label: "Fail",
        detail: "No module content exists yet."
      };
    }

    if (data.unpublishedAssignmentsInModule.length > 0) {
      return {
        title: "Assignments Published",
        state: "warn",
        label: "Unpublished",
        detail: `${data.unpublishedAssignmentsInModule.length} assignment(s) in modules are still unpublished.`,
        items: data.unpublishedAssignmentsInModule,
        itemFormatter: item => escapeHtml(item.name)
      };
    }

    return {
      title: "Assignments Published",
      state: "pass",
      label: "Pass",
      detail: "All assignments found in modules are published."
    };
  }

  function getContentPublishedCheck(data) {
    if (!data.hasAnyContent) {
      return {
        title: "Content Published",
        state: "fail",
        label: "Fail",
        detail: "No module content exists yet."
      };
    }

    if (data.unpublishedModuleItems.length > 0) {
      return {
        title: "Content Published",
        state: "warn",
        label: "Unpublished",
        detail: `${data.unpublishedModuleItems.length} module item(s) are still unpublished.`,
        items: data.unpublishedModuleItems,
        itemFormatter: item => `${escapeHtml(item.title || item.type || "Module item")} (${escapeHtml(item.moduleName || "Unknown module")})`
      };
    }

    return {
      title: "Content Published",
      state: "pass",
      label: "Pass",
      detail: "No unpublished module items were found."
    };
  }

  function getChecks(data) {
    return [
      getEvaluationCheck(data.instructorEvalAssignments, "Instructor Evaluation"),
      getEvaluationCheck(data.courseEvalAssignments, "Course Evaluation"),
      getContentCheck(data),
      getWeightsCheck(data),
      getAssignmentsInModulesCheck(data),
      getAssignmentsPublishedCheck(data),
      getContentPublishedCheck(data)
    ];
  }

  function getOverallStatus(data) {
    const checks = getChecks(data);

    if (checks.some(check => check.state === "fail")) {
      return {
        state: "fail",
        label: "Not Ready",
        checks
      };
    }

    if (checks.some(check => check.state === "warn")) {
      return {
        state: "warn",
        label: "Needs Publishing",
        checks
      };
    }

    return {
      state: "pass",
      label: "Ready",
      checks
    };
  }

  function getProgressData(checks) {
    const total = checks.length || 1;
    const passCount = checks.filter(check => check.state === "pass").length;
    const warnCount = checks.filter(check => check.state === "warn").length;
    const failCount = checks.filter(check => check.state === "fail").length;

    return {
      total,
      passCount,
      warnCount,
      failCount,
      percentComplete: Math.round((passCount / total) * 100)
    };
  }

  function renderCheck(check) {
    const itemList = Array.isArray(check.items) && check.items.length
      ? `
        <ul class="btech-course-readiness__check-list">
          ${check.items.map(item => `<li>${check.itemFormatter(item)}</li>`).join("")}
        </ul>
      `
      : "";

    return `
      <li class="btech-course-readiness__check is-${check.state}">
        <div class="btech-course-readiness__check-header">
          <span class="btech-course-readiness__pill" aria-hidden="true"></span>
          <span class="btech-course-readiness__check-title">${escapeHtml(check.title)}</span>
        </div>
        ${check.state === "pass" ? "" : `<span class="btech-course-readiness__check-detail">${escapeHtml(check.detail)}</span>`}
        ${itemList}
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
            <h2 class="btech-course-readiness__title">Course Readiness</h2>
          </div>
          <p class="btech-course-readiness__meta">Last checked ${escapeHtml(updatedAt)}</p>
        </div>
        <div class="btech-course-readiness__body">
          <p class="btech-course-readiness__error">${escapeHtml(errorMessage)}</p>
        </div>
      `);
      return;
    }

    const overallStatus = getOverallStatus(data);
    const progress = getProgressData(overallStatus.checks);

    card.html(`
      <div class="btech-course-readiness__header">
        <div class="btech-course-readiness__title-row">
          <h2 class="btech-course-readiness__title">Course Readiness</h2>
        </div>
        <div class="btech-course-readiness__status" aria-label="${escapeHtml(`${progress.percentComplete}% complete: ${progress.passCount} passed, ${progress.warnCount} unpublished, ${progress.failCount} failed`)}">
          <div class="btech-course-readiness__status-bar">
            <span class="btech-course-readiness__status-segment is-pass" style="width: ${(progress.passCount / progress.total) * 100}%;"></span>
            <span class="btech-course-readiness__status-segment is-warn" style="width: ${(progress.warnCount / progress.total) * 100}%;"></span>
            <span class="btech-course-readiness__status-segment is-fail" style="width: ${(progress.failCount / progress.total) * 100}%;"></span>
          </div>
          <span class="btech-course-readiness__status-label">${progress.percentComplete}% Done</span>
        </div>
        <p class="btech-course-readiness__meta">${progress.passCount} of ${progress.total} checks complete. Last checked ${escapeHtml(updatedAt)}</p>
      </div>
      <div class="btech-course-readiness__body">
        <ul class="btech-course-readiness__checks">
          ${overallStatus.checks.map(check => renderCheck(check)).join("")}
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
              <h2 class="btech-course-readiness__title">Course Readiness</h2>
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
