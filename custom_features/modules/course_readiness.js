(async function () {
  if (!IS_TEACHER) return;

  const courseId = ENV.COURSE_ID ?? ENV.course_id;
  const cardId = "btech-course-readiness-checklist";
  const styleId = "btech-course-readiness-style";
  const refreshMs = 60000;
  const instructorEvalId = "243044643269963";
  const courseEvalId = "241976981675072";
  const courseEvalBaseUrl = "https://surveys.bridgetools.dev/init";
  const simpleSyllabusToolId = "106228";
  const manualConfirmationItems = [
    {
      key: "cleanUnusedContent",
      title: "Clean up unused content",
      detail: "Confirm unused content has been cleaned up."
    }
  ];
  const guideLinks = {
    instructorsAdded: "https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.8xba0hu8flvw",
    instructorEvaluation: "https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.rlqjyqw6zccd",
    courseEvaluation: "https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.rlqjyqw6zccd",
    courseContent: "https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.2trq1w64kmtd",
    groupWeights: "https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.ixz8s2t0x82k",
    assignmentsInModules: "https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.5npc62ocz9sq",
    assignmentsPublished: "https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.5npc62ocz9sq",
    syllabusLinkEnabled: "https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.n1lazhgzfkk9",
    syllabusModuleLinks: "",
    syllabus: "https://docs.google.com/document/d/1gQ3vp4-PcJFETGGA95Ax-oro5LKtmCJ5Awik9bMN7Uk/edit?tab=t.0#heading=h.n1lazhgzfkk9",
    cleanUnusedContent: "",
    published: ""
  };

  if (!courseId) return;

  let latestSyllabusModuleLinkMismatches = [];

  function extractYear(termName) {
    const match = String(termName ?? "").match(/\b(20\d{2})\b/);
    return match ? match[1] : "";
  }

  function findEntityIdByCourseId(courseId, options = {}) {
    const baseUrl = options.baseUrl || "https://btech.simplesyllabus.com/api2/doc";
    const pageSize = options.pageSize || 50;
    const delayMs = options.delayMs || 200;
    const termYear = String(options.termYear ?? "").trim();

    const target = String(courseId);
    let page = 0;

    function titleHasCourseId(title) {
      return new RegExp("\\(" + target + "\\)").test(String(title || ""));
    }

    function fetchPage() {
      const requestData = {
        "entity_types[]": "section",
        page: page,
        page_size: pageSize
      };
      if (termYear) requestData.term_name = termYear;

      return $.get(baseUrl, requestData).then(function (data) {
        const items = data.items || [];

        const found = items.find(item => titleHasCourseId(item.title));

        if (found) {
            return found.entity_id; // 👈 return entity_id only
        }

        const pagination = data.pagination || {};
        const total = pagination.total;
        const returned = pagination.returned || 0;

        if (returned === 0) return null;
        if (Number.isInteger(total) && (page + 1) * pageSize >= total) return null;

        page++;

        return new Promise(resolve => setTimeout(resolve, delayMs))
            .then(fetchPage);
        });
    }

    return fetchPage();
    }

  function findSyllabusByEntityId(entityId, options = {}) {
    const baseUrl = options.baseUrl || "https://btech.simplesyllabus.com/api2/doc";

    return $.get(baseUrl, {
      "entity_ids[]": entityId,
      page: 0,
      page_size: 50
    }).then(function (data) {
      const sys = data.sys || {};
      if (sys.success === false) {
        throw new Error("Simple Syllabus API returned success=false");
      }

      const items = data.items || [];
      return items[0] || null;
    });
  }

  let syllabusEntityId = null;
  let syllabusEntityIdLookupComplete = false;

  async function getSyllabusDocByCourseId(courseId, termYear = "") {
    if (!syllabusEntityIdLookupComplete) {
      syllabusEntityId = await findEntityIdByCourseId(courseId, { termYear });
      syllabusEntityIdLookupComplete = true;
    }

    if (!syllabusEntityId) return null;

    return await findSyllabusByEntityId(syllabusEntityId);
  }

  function escapeHtml(value) {
    return $("<div>").text(value ?? "").html();
  }

  async function enableSyllabusLink(tabId) {
    return await $.put(`/api/v1/courses/${courseId}/tabs/${encodeURIComponent(tabId)}`, {
      hidden: false,
      position: 2
    });
  }

  async function fixSyllabusModuleLinks(mismatches) {
    for (let i = 0; i < mismatches.length; i++) {
      const item = mismatches[i];
      await $.put(`/api/v1/courses/${courseId}/modules/${item.moduleId}/items/${item.id}`, {
        module_item: {
          external_url: item.fixedUrl
        }
      });
    }
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
          box-sizing: border-box;
        }

        #${cardId} .btech-course-readiness__status-segment.is-pass {
          background: #dff3e4;
          border-top: 1px solid #0b6b2f;
          border-bottom: 1px solid #0b6b2f;
        }

        #${cardId} .btech-course-readiness__status-segment.is-warn {
          background: #fff3cd;
          border-top: 1px solid #8a5b00;
          border-bottom: 1px solid #8a5b00;
        }

        #${cardId} .btech-course-readiness__status-segment.is-fail {
          background: #fde8e8;
          border-top: 1px solid #a61b1b;
          border-bottom: 1px solid #a61b1b;
        }

        #${cardId} .btech-course-readiness__status-segment.is-pass:first-child {
          border-left: 1px solid #0b6b2f;
          border-top-left-radius: 999px;
          border-bottom-left-radius: 999px;
        }

        #${cardId} .btech-course-readiness__status-segment.is-warn:first-child {
          border-left: 1px solid #8a5b00;
          border-top-left-radius: 999px;
          border-bottom-left-radius: 999px;
        }

        #${cardId} .btech-course-readiness__status-segment.is-fail:first-child {
          border-left: 1px solid #a61b1b;
          border-top-left-radius: 999px;
          border-bottom-left-radius: 999px;
        }

        #${cardId} .btech-course-readiness__status-segment.is-pass:last-child {
          border-right: 1px solid #0b6b2f;
          border-top-right-radius: 999px;
          border-bottom-right-radius: 999px;
        }

        #${cardId} .btech-course-readiness__status-segment.is-warn:last-child {
          border-right: 1px solid #8a5b00;
          border-top-right-radius: 999px;
          border-bottom-right-radius: 999px;
        }

        #${cardId} .btech-course-readiness__status-segment.is-fail:last-child {
          border-right: 1px solid #a61b1b;
          border-top-right-radius: 999px;
          border-bottom-right-radius: 999px;
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

        #${cardId} .btech-course-readiness__checks {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.6rem;
        }

        #${cardId} .btech-course-readiness__check {
          display: block;
        }

        #${cardId} .btech-course-readiness__check.has-divider {
          border-top: 1px solid #e5e8ea;
          margin-top: 0.55rem;
          padding-top: 0.8rem;
        }

        #${cardId} .btech-course-readiness__check-header {
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }

        #${cardId} .btech-course-readiness__guide-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1rem;
          height: 1rem;
          min-width: 1rem;
          border: 1px solid #8b969e;
          border-radius: 999px;
          color: #394b58;
          font-size: 0.72rem;
          font-weight: 700;
          line-height: 1;
          text-decoration: none;
        }

        #${cardId} .btech-course-readiness__guide-link:hover,
        #${cardId} .btech-course-readiness__guide-link:focus {
          color: #1f5f8b;
          border-color: #1f5f8b;
          text-decoration: none;
        }

        #${cardId} .btech-course-readiness__section-label {
          margin-bottom: 0.45rem;
          font-size: 0.72rem;
          font-weight: 700;
          color: #5b6d79;
          text-transform: uppercase;
        }

        #${cardId} .btech-course-readiness__action {
          margin-top: 0.45rem;
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

        #${cardId} .btech-course-readiness__check.is-loading .btech-course-readiness__pill {
          background: #e5e8ea;
          border: 1px solid #5b6d79;
        }

        #${cardId} .btech-course-readiness__check.is-warn .btech-course-readiness__pill {
          background: #fff3cd;
          border: 1px solid #8a5b00;
        }

        #${cardId} .btech-course-readiness__check.is-fail .btech-course-readiness__pill {
          background: #fde8e8;
          border: 1px solid #a61b1b;
        }

        #${cardId} .btech-course-readiness__check.is-info .btech-course-readiness__pill {
          background: #eef2f4;
          border: 1px solid #5b6d79;
        }

        #${cardId} .btech-course-readiness__check-title {
          flex: 1 1 auto;
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

        #${cardId} .btech-course-readiness__disclosure {
          margin-top: 0.45rem;
        }

        #${cardId} .btech-course-readiness__disclosure-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0;
          border: 0;
          background: transparent;
          color: #5b6d79;
          font-size: 0.8rem;
          line-height: 1.3;
          text-align: left;
          cursor: pointer;
        }

        #${cardId} .btech-course-readiness__disclosure-arrow {
          display: inline-block;
          width: 0.65rem;
          min-width: 0.65rem;
          color: #394b58;
        }

        #${cardId} .btech-course-readiness__disclosure.is-open .btech-course-readiness__disclosure-arrow {
          transform: rotate(90deg);
        }

        #${cardId} .btech-course-readiness__error {
          margin: 0;
          font-size: 0.8rem;
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

  function getSyllabusCourseIdFromUrl(value) {
    const match = String(value ?? "").match(new RegExp(`/courses/(\\d+)/external_tools/${simpleSyllabusToolId}(?:\\b|[/?#])`));
    return match ? match[1] : "";
  }

  function getFixedSyllabusUrl(value) {
    return String(value ?? "").replace(
      new RegExp(`/courses/\\d+/external_tools/${simpleSyllabusToolId}`),
      `/courses/${courseId}/external_tools/${simpleSyllabusToolId}`
    );
  }

  async function getCourseData() {
    const [course, assignmentGroups, modules, assignmentList, instructorEnrollments, tabs] = await Promise.all([
      $.get(`/api/v1/courses/${courseId}?include[]=term`),
      canvasGet(`/api/v1/courses/${courseId}/assignment_groups?include[]=assignments`),
      canvasGet(`/api/v1/courses/${courseId}/modules?include[]=items&include[]=content_details`),
      canvasGet(`/api/v1/courses/${courseId}/assignments`),
      canvasGet(`/api/v1/courses/${courseId}/enrollments?type[]=TeacherEnrollment&state[]=active&state[]=invited&state[]=creation_pending`),
      canvasGet(`/api/v1/courses/${courseId}/tabs`)
    ]);

    const termName = String(course?.term?.name ?? "");
    const termYear = extractYear(termName);

    const moduleItems = modules.flatMap(module =>
      (module.items ?? []).map(item => ({
        ...item,
        moduleId: module.id,
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

      if (assignment.published === true && pointsPossible > 0 && !isInModule) {
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

    const syllabusModuleLinkMismatches = moduleItems
      .map(item => {
        const url = String(item.external_url || item.url || item.html_url || item.content_details?.url || "");
        const linkedCourseId = getSyllabusCourseIdFromUrl(url);

        return {
          id: item.id,
          title: item.title,
          moduleId: item.moduleId,
          moduleName: item.moduleName,
          url,
          linkedCourseId,
          fixedUrl: getFixedSyllabusUrl(url)
        };
      })
      .filter(item => item.linkedCourseId && item.linkedCourseId !== String(courseId));
    latestSyllabusModuleLinkMismatches = syllabusModuleLinkMismatches;

    const assignmentGroupWeightTotal = assignmentGroups.reduce(
      (sum, group) => sum + Number(group.group_weight ?? 0),
      0
    );
    const usesAssignmentGroupWeights = Boolean(course?.apply_assignment_group_weights);

    const instructorEvalAssignments = assignmentList.filter(assignment =>
      String(assignment?.external_tool_tag_attributes?.url ?? "").toLowerCase().includes(`jotform_id=${instructorEvalId}`)
    );

    const courseEvalAssignments = assignmentList.filter(assignment =>
      (() => {
        const url = String(assignment?.external_tool_tag_attributes?.url ?? "").toLowerCase();
        return url.includes(`jotform_id=${courseEvalId}`) || url === courseEvalBaseUrl;
      })()
    );

    return {
      termName,
      termYear,
      isCoursePublished: Boolean(course?.published) || ["available", "completed"].includes(String(course?.workflow_state ?? "").toLowerCase()),
      instructorEvalAssignments,
      courseEvalAssignments,
      instructorEnrollments,
      tabs,
      hasAnyContent: moduleItems.length > 0,
      usesAssignmentGroupWeights,
      assignmentGroupWeightsAddTo100: usesAssignmentGroupWeights && Math.abs(assignmentGroupWeightTotal - 100) < 0.001,
      assignmentGroupWeightTotal,
      assignmentsWorthPointsNotInModule,
      unpublishedAssignmentsInModule,
      syllabusModuleLinkMismatches
    };
  }

  function getIsReady(data) {
    return getChecks(data).every(check => check.state === "pass");
  }

  function getLoadingCheck(title, detail = "Loading...") {
    return createCheck(title, "loading", detail);
  }

  function getGuideKeyFromTitle(title) {
    return {
      "Assignments Published": "assignmentsPublished",
      "Assignments in Modules": "assignmentsInModules",
      "Course Content": "courseContent",
      "Course Evaluation": "courseEvaluation",
      "Group Weights = 100%": "groupWeights",
      "Instructor Evaluation": "instructorEvaluation",
      "Instructors Added": "instructorsAdded",
      "Published": "published",
      "Syllabus Submitted": "syllabus",
      "Syllabus in Navigation": "syllabusLinkEnabled",
      "Syllabus Module Links": "syllabusModuleLinks"
    }[title] || "";
  }

  function createCheck(title, state, detail = "", options = {}) {
    return {
      title,
      guideKey: getGuideKeyFromTitle(title),
      state,
      detail,
      ...options
    };
  }

  function getEvaluationCheck(assignments, title) {
    if (!assignments.length) {
      return createCheck(title, "fail", `Add the ${title.toLowerCase()} assignment.`);
    }

    const hasPublishedAssignment = assignments.some(assignment =>
      assignment.published === true || assignment.workflow_state === "published"
    );

    if (hasPublishedAssignment) {
      return createCheck(title, "pass", `${title} assignment is published.`);
    }

    return createCheck(title, "warn", `${title} assignment exists but is not published.`);
  }

  function getSyllabusCheck(data) {
    if (data.syllabusLoading) {
      return getLoadingCheck("Syllabus Submitted", "Loading syllabus status...");
    }

    if (data.syllabusLoadError) {
      return createCheck("Syllabus Submitted", "fail", "Unable to load syllabus status.");
    }

    if (!data.syllabusDoc) {
      return createCheck("Syllabus Submitted", "fail", "No Simple Syllabus record was found for this course.");
    }

    if (data.syllabusStatus === "completed") {
      return createCheck("Syllabus Submitted", "pass", "Syllabus is completed.");
    }

    if (data.syllabusStatus === "awaiting_approval") {
      return createCheck("Syllabus Submitted", "warn", "Syllabus is awaiting approval.");
    }

    return createCheck(
      "Syllabus Submitted",
      "fail",
      data.syllabusStatus
        ? `Syllabus status is ${data.syllabusStatus.replace(/_/g, " ")}.`
        : "Syllabus status is unavailable."
    );
  }

  function getSyllabusLinkCheck(data) {
    const simpleSyllabusTab = data.tabs.find(tab =>
      String(tab?.label ?? "").trim().toLowerCase() === "simple syllabus"
    );

    if (!simpleSyllabusTab) {
      return createCheck("Syllabus in Navigation", "fail", "Simple Syllabus was not found in course navigation.");
    }

    const visibility = String(simpleSyllabusTab.visibility ?? "").toLowerCase();

    if (visibility === "public" && simpleSyllabusTab.hidden !== true) {
      return createCheck("Syllabus in Navigation", "pass", "Simple Syllabus is enabled in course navigation.");
    }

    return createCheck(
      "Syllabus in Navigation",
      "fail",
      simpleSyllabusTab.visibility
        ? `Simple Syllabus navigation visibility is ${simpleSyllabusTab.visibility}.`
        : "Simple Syllabus navigation visibility is unavailable.",
      {
        action: {
          type: "enableSyllabusLink",
          label: "Enable Link",
          tabId: simpleSyllabusTab.id
        }
      }
    );
  }

  function getSyllabusModuleLinksCheck(data) {
    if (!data.hasAnyContent) {
      return createCheck("Syllabus Module Links", "fail", "No module content exists yet.");
    }

    if (data.syllabusModuleLinkMismatches.length > 0) {
      return createCheck("Syllabus Module Links", "fail", "", {
        action: {
          type: "fixSyllabusModuleLinks",
          label: "Fix Syllabus Links"
        }
      });
    }

    return createCheck("Syllabus Module Links", "pass", "Simple Syllabus module links point to this course.");
  }

  function getContentCheck(data) {
    if (!data.hasAnyContent) {
      return createCheck("Course Content", "fail", "No module items were found in this course.");
    }

    return createCheck("Course Content", "pass", "Course content exists.");
  }

  function getInstructorsCheck(data) {
    const instructorCount = data.instructorEnrollments.length;

    if (instructorCount > 0) {
      return createCheck("Instructors Added", "pass", `${instructorCount} instructor(s) found.`, {
        items: data.instructorEnrollments,
        itemFormatter: enrollment => escapeHtml(enrollment?.user?.name || enrollment?.user?.sortable_name || `User ${enrollment.user_id}`),
        itemSummary: `${instructorCount} instructor(s) added`
      });
    }

    return createCheck("Instructors Added", "fail", "No instructors have been added to this course.");
  }

  function getWeightsCheck(data) {
    if (!data.usesAssignmentGroupWeights) {
      return createCheck("Group Weights = 100%", "pass", "Assignment group weighting is not enabled for this course.");
    }

    return createCheck(
      "Group Weights = 100%",
      data.assignmentGroupWeightsAddTo100 ? "pass" : "fail",
      `Current total: ${Math.round(data.assignmentGroupWeightTotal * 100) / 100}%`
    );
  }

  function getAssignmentsInModulesCheck(data) {
    if (!data.hasAnyContent) {
      return createCheck("Assignments in Modules", "fail", "No module content exists yet.");
    }

    if (data.assignmentsWorthPointsNotInModule.length > 0) {
      return createCheck("Assignments in Modules", "fail", `${data.assignmentsWorthPointsNotInModule.length} assignment(s) still need a module placement.`, {
        items: data.assignmentsWorthPointsNotInModule,
        itemFormatter: item => `${escapeHtml(item.name)} (${escapeHtml(String(item.pointsPossible))} pts)`,
        itemSummary: `${data.assignmentsWorthPointsNotInModule.length} assignment(s) need module placement`
      });
    }

    return createCheck("Assignments in Modules", "pass", "All point-bearing assignments are in a module.");
  }

  function getAssignmentsPublishedCheck(data) {
    if (!data.hasAnyContent) {
      return createCheck("Assignments Published", "fail", "No module content exists yet.");
    }

    if (data.unpublishedAssignmentsInModule.length > 0) {
      return createCheck("Assignments Published", "warn", `${data.unpublishedAssignmentsInModule.length} assignment(s) in modules are still unpublished.`, {
        items: data.unpublishedAssignmentsInModule,
        itemFormatter: item => escapeHtml(item.name),
        itemSummary: `${data.unpublishedAssignmentsInModule.length} assignment(s) unpublished`
      });
    }

    return createCheck("Assignments Published", "pass", "All assignments found in modules are published.");
  }

  function getManualConfirmationChecks() {
    return manualConfirmationItems.map((item, index) => {
      return createCheck(item.title, "info", item.detail, {
        guideKey: item.key,
        sectionLabel: index === 0 ? "Manual Confirmation" : "",
        dividerBefore: index === 0,
        isScored: false
      });
    });
  }

  function getPublishedCheck(data, prerequisitesReady) {
    if (!data.coreLoaded) {
      return {
        ...getLoadingCheck("Published", "Loading publish status..."),
        dividerBefore: true
      };
    }

    if (!prerequisitesReady) {
      return createCheck("Published", "fail", "Not ready to publish.", {
        dividerBefore: true
      });
    }

    if (data.isCoursePublished) {
      return createCheck("Published", "pass", "", {
        dividerBefore: true
      });
    }

    return createCheck("Published", "fail", "Needs to be published.", {
      dividerBefore: true
    });
  }

  function getPrerequisiteChecks(data) {
    if (!data.coreLoaded) {
      return [
        getLoadingCheck("Instructors Added"),
        getLoadingCheck("Instructor Evaluation"),
        getLoadingCheck("Course Evaluation"),
        getLoadingCheck("Course Content"),
        getLoadingCheck("Group Weights = 100%"),
        getLoadingCheck("Assignments in Modules"),
        getLoadingCheck("Assignments Published"),
        getLoadingCheck("Syllabus Module Links"),
        getLoadingCheck("Syllabus in Navigation"),
        getLoadingCheck("Syllabus Submitted", "Loading syllabus status..."),
        ...getManualConfirmationChecks()
      ];
    }

    return [
      getInstructorsCheck(data),
      getEvaluationCheck(data.instructorEvalAssignments, "Instructor Evaluation"),
      getEvaluationCheck(data.courseEvalAssignments, "Course Evaluation"),
      getContentCheck(data),
      getWeightsCheck(data),
      getAssignmentsInModulesCheck(data),
      getAssignmentsPublishedCheck(data),
      getSyllabusModuleLinksCheck(data),
      getSyllabusLinkCheck(data),
      getSyllabusCheck(data),
      ...getManualConfirmationChecks()
    ];
  }

  function getChecks(data) {
    const prerequisiteChecks = getPrerequisiteChecks(data);
    const prerequisitesReady = prerequisiteChecks
      .filter(check => check.isScored !== false)
      .every(check => check.state === "pass");

    return [
      ...prerequisiteChecks,
      getPublishedCheck(data, prerequisitesReady)
    ];
  }

  function getOverallStatus(data) {
    const checks = getChecks(data);
    const scoredChecks = checks.filter(check => check.isScored !== false);

    if (scoredChecks.some(check => check.state === "loading")) {
      return {
        state: "loading",
        checks
      };
    }

    if (scoredChecks.some(check => check.state === "fail")) {
      return {
        state: "fail",
        checks
      };
    }

    if (scoredChecks.some(check => check.state === "warn")) {
      return {
        state: "warn",
        checks
      };
    }

    return {
      state: "pass",
      checks
    };
  }

  function getProgressData(checks) {
    const scoredChecks = checks.filter(check => check.isScored !== false);
    const total = scoredChecks.length || 1;
    const passCount = scoredChecks.filter(check => check.state === "pass").length;
    const loadingCount = scoredChecks.filter(check => check.state === "loading").length;
    const warnCount = scoredChecks.filter(check => check.state === "warn").length;
    const failCount = scoredChecks.filter(check => check.state === "fail").length;

    return {
      total,
      passCount,
      loadingCount,
      warnCount,
      failCount,
      percentComplete: Math.round((passCount / total) * 100)
    };
  }

  function renderCheck(check) {
    const checkItems = Array.isArray(check.items) ? check.items : [];
    const itemList = checkItems.length
      ? `
        <div class="btech-course-readiness__disclosure">
          <button type="button" class="btech-course-readiness__disclosure-toggle" aria-expanded="false">
            <span class="btech-course-readiness__disclosure-arrow" aria-hidden="true">&gt;</span>
            <span>${escapeHtml(check.itemSummary || `${checkItems.length} item(s)`)}</span>
          </button>
          <ul class="btech-course-readiness__check-list" hidden>
            ${checkItems.map(item => `<li>${check.itemFormatter(item)}</li>`).join("")}
          </ul>
        </div>
      `
      : "";
    const checkControl = `<span class="btech-course-readiness__pill" aria-hidden="true"></span>`;
    const actionButton = check.action
      ? `
        <div class="btech-course-readiness__action">
          <button
            type="button"
            class="btn btn-small btech-course-readiness__action-button"
            data-action-type="${escapeHtml(check.action.type)}"
            data-tab-id="${escapeHtml(check.action.tabId)}"
          >${escapeHtml(check.action.label)}</button>
        </div>
      `
      : "";
    const guideUrl = guideLinks[check.guideKey] || "";
    const guideLink = guideUrl
      ? `<a
          class="btech-course-readiness__guide-link"
          href="${escapeHtml(guideUrl)}"
          target="_blank"
          rel="noopener"
          title="${escapeHtml(`Guide for ${check.title}`)}"
          aria-label="${escapeHtml(`Guide for ${check.title}`)}"
        >i</a>`
      : "";

    return `
      <li class="btech-course-readiness__check is-${check.state}${check.dividerBefore ? " has-divider" : ""}">
        ${check.sectionLabel ? `<div class="btech-course-readiness__section-label">${escapeHtml(check.sectionLabel)}</div>` : ""}
        <div class="btech-course-readiness__check-header">
          ${checkControl}
          <span class="btech-course-readiness__check-title">${escapeHtml(check.title)}</span>
          ${guideLink}
        </div>
        ${check.state === "pass" || check.action || checkItems.length ? "" : `<span class="btech-course-readiness__check-detail">${escapeHtml(check.detail)}</span>`}
        ${actionButton}
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
    const isReady = overallStatus.state === "pass";

    card.html(`
      <div class="btech-course-readiness__header">
        <div class="btech-course-readiness__title-row">
          <h2 class="btech-course-readiness__title">Course Readiness</h2>
        </div>
        <div class="btech-course-readiness__status" aria-label="${escapeHtml(`${progress.percentComplete}% complete: ${progress.passCount} passed, ${progress.warnCount} unpublished, ${progress.failCount} failed, ${progress.loadingCount} loading`)}">
          <div class="btech-course-readiness__status-bar">
            <span class="btech-course-readiness__status-segment is-pass" style="width: ${(progress.passCount / progress.total) * 100}%;"></span>
            <span class="btech-course-readiness__status-segment is-warn" style="width: ${(progress.warnCount / progress.total) * 100}%;"></span>
            <span class="btech-course-readiness__status-segment is-fail" style="width: ${(progress.failCount / progress.total) * 100}%;"></span>
          </div>
          <span class="btech-course-readiness__status-label">${progress.percentComplete}% Done</span>
        </div>
        <p class="btech-course-readiness__meta">${progress.passCount} of ${progress.total} checks complete. Last checked ${escapeHtml(updatedAt)}</p>
      </div>
      ${isReady ? "" : `
        <div class="btech-course-readiness__body">
          <ul class="btech-course-readiness__checks">
            ${overallStatus.checks.map(check => renderCheck(check)).join("")}
          </ul>
        </div>
      `}
    `);

    bindActionEvents(card);
    bindDisclosureEvents(card);
  }

  function bindDisclosureEvents(card) {
    card.find(".btech-course-readiness__disclosure-toggle").on("click", function () {
      const button = $(this);
      const disclosure = button.closest(".btech-course-readiness__disclosure");
      const list = disclosure.find(".btech-course-readiness__check-list").first();
      const isOpen = button.attr("aria-expanded") === "true";

      button.attr("aria-expanded", String(!isOpen));
      disclosure.toggleClass("is-open", !isOpen);
      list.prop("hidden", isOpen);
    });
  }

  function markActionResolved(button) {
    const check = button.closest(".btech-course-readiness__check");
    check.removeClass("is-fail is-warn is-loading").addClass("is-pass");
    button.closest(".btech-course-readiness__action").html('<span class="btech-course-readiness__check-detail">Refresh to view changes.</span>');
  }

  function bindActionEvents(card) {
    card.find(".btech-course-readiness__action-button").on("click", async function () {
      const button = $(this);
      const actionType = button.data("action-type");

      if (actionType === "enableSyllabusLink") {
        button.prop("disabled", true).text("Enabling...");

        try {
          await enableSyllabusLink(button.data("tab-id"));
          markActionResolved(button);
        } catch (error) {
          console.error("Unable to enable Simple Syllabus link.", error);
          button.prop("disabled", false).text("Enable Link");
          alert("Unable to enable the Simple Syllabus link right now.");
        }

        return;
      }

      if (actionType === "fixSyllabusModuleLinks") {
        button.prop("disabled", true).text("Fixing...");

        try {
          await fixSyllabusModuleLinks(latestSyllabusModuleLinkMismatches);
          latestSyllabusModuleLinkMismatches = [];
          markActionResolved(button);
        } catch (error) {
          console.error("Unable to fix Simple Syllabus module links.", error);
          button.prop("disabled", false).text("Fix Syllabus Links");
          alert("Unable to fix the Simple Syllabus module links right now.");
        }
      }
    });
  }

  let isRefreshing = false;
  let courseReadinessComplete = false;

  async function refreshCourseReadiness() {
    const card = ensureCard();
    if (!card || isRefreshing) return;

    isRefreshing = true;

    try {
      if (!card.html().trim()) {
        renderCard(card, {
          coreLoaded: false,
          syllabusLoading: true
        });
      }

      const coreData = await getCourseData();
      const partialData = {
        ...coreData,
        coreLoaded: true,
        syllabusLoading: true,
        syllabusDoc: null,
        syllabusStatus: "",
        syllabusLoadError: false
      };
      renderCard(card, partialData);

      let finalData;
      try {
        const syllabusDoc = await getSyllabusDocByCourseId(courseId, coreData.termYear);
        finalData = {
          ...partialData,
          syllabusLoading: false,
          syllabusDoc,
          syllabusStatus: String(syllabusDoc?.status ?? "").trim().toLowerCase(),
          syllabusLoadError: false
        };
      } catch (syllabusError) {
        console.error("Course readiness syllabus check failed.", syllabusError);
        finalData = {
          ...partialData,
          syllabusLoading: false,
          syllabusDoc: null,
          syllabusStatus: "",
          syllabusLoadError: true
        };
      }

      renderCard(card, finalData);
      courseReadinessComplete = getIsReady(finalData);
      if (courseReadinessComplete && window.__btechCourseReadinessIntervalId) {
        clearInterval(window.__btechCourseReadinessIntervalId);
        window.__btechCourseReadinessIntervalId = null;
      }
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

  if (!courseReadinessComplete) {
    window.__btechCourseReadinessIntervalId = window.setInterval(refreshCourseReadiness, refreshMs);
  }
})();
