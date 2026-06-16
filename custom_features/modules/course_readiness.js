(async function () {
  if (!IS_TEACHER) return;

  const courseId = ENV.COURSE_ID ?? ENV.course_id;
  const cardId = "btech-course-readiness-checklist";
  const styleId = "btech-course-readiness-style";
  const refreshMs = 60000;
  const instructorEvalId = "243044643269963";
  const courseEvalId = "241976981675072";
  const employmentSkillsEvalUrl = "https://surveys.bridgetools.dev/init?jotform_id=261403741698967&response_jotform_id=261436460329962";
  const courseEvalBaseUrl = "https://surveys.bridgetools.dev/init";
  const employmentSkillsNameFragment = "employment skills";
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
    cleanUnusedContent: ""
  };

  if (!courseId) return;

  let latestSyllabusModuleLinkMismatches = [];
  let latestLastModule = null;

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

  function findSyllabusByCode(code, options = {}) {
    const baseUrl = options.baseUrl || "https://btech.simplesyllabus.com/api2/doc";

    return $.get(baseUrl, {
      code: String(code ?? "").trim(),
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

  async function findSyllabusCodeFromReports(courseId) {
    const rows = await bridgetools.req3("reports", {
      canvas_course_id: Number(courseId)
    }, {
      dataset: "syllabi_status"
    });

    const row = Array.isArray(rows)
      ? rows.find(item => String(item?.simple_syllabus_doc_id ?? "").trim())
      : null;
    return String(row?.simple_syllabus_doc_id ?? "").trim() || null;
  }

  let syllabusDocCode = null;
  let syllabusDocCodeLookupComplete = false;

  async function getSyllabusDocByCourseId(courseId, termYear = "") {
    if (!syllabusDocCodeLookupComplete) {
      try {
        syllabusDocCode = await findSyllabusCodeFromReports(courseId);
      } catch (error) {
        console.warn("Course readiness syllabus code lookup via reports failed.", error);
      }

      console.log("Course readiness syllabus code lookup", {
        courseId: Number(courseId),
        termYear: String(termYear ?? ""),
        syllabusDocCode
      });

      syllabusDocCodeLookupComplete = true;
    }

    if (!syllabusDocCode) return null;

    return await findSyllabusByCode(syllabusDocCode);
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

  async function removeSyllabusModuleLinks(mismatches) {
    for (let i = 0; i < mismatches.length; i++) {
      const item = mismatches[i];
      await $.delete(`/api/v1/courses/${courseId}/modules/${item.moduleId}/items/${item.id}`);
    }
  }

  async function createEvaluationAssignment(config) {
    if (!latestLastModule?.id) {
      throw new Error("No module found for evaluation placement.");
    }

    const assignment = await $.post(`/api/v1/courses/${courseId}/assignments`, {
      assignment: {
        name: config.title,
        submission_types: ["external_tool"],
        points_possible: 1,
        allowed_attempts: -1,
        published: true,
        external_tool_tag_attributes: {
          url: config.url,
          new_tab: false
        }
      }
    });

    await $.post(`/api/v1/courses/${courseId}/modules/${latestLastModule.id}/items`, {
      module_item: {
        type: "Assignment",
        content_id: assignment.id,
        position: 999
      }
    });

    return assignment;
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

        #${cardId} .btech-course-readiness__readiness {
          padding: 0;
        }

        #${cardId} .btech-course-readiness__readiness-banner {
          position: relative;
          min-height: 2rem;
          overflow: hidden;
          border-top: 1px solid #c7cdd1;
          border-bottom: 1px solid #c7cdd1;
        }

        #${cardId} .btech-course-readiness__readiness-banner.is-loading {
          background: #eef2f4;
          border-color: #5b6d79;
        }

        #${cardId} .btech-course-readiness__readiness-banner.is-fail {
          background: #fde8e8;
          border-color: #a61b1b;
        }

        #${cardId} .btech-course-readiness__readiness-banner.is-ready {
          background: #fff3cd;
          border-color: #8a5b00;
        }

        #${cardId} .btech-course-readiness__readiness-banner.is-published {
          background: #dff3e4;
          border-color: #0b6b2f;
        }

        #${cardId} .btech-course-readiness__readiness-label {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 0.75rem;
          min-height: 2rem;
          font-size: 0.82rem;
          font-weight: 700;
          color: #000000;
          letter-spacing: 0.02em;
          text-align: center;
        }

        #${cardId} .btech-course-readiness__meta {
          margin: 0;
          padding: 0.45rem 1rem 0;
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

  function getModuleItemContentIds(item, discussionAssignmentIdsByTopicId = {}) {
    const ids = [Number(item.content_id)];
    const discussionAssignmentId = Number(
      discussionAssignmentIdsByTopicId?.[item.content_id]
      ?? item.content_details?.assignment_id
      ?? item.assignment_id
    );

    if (String(item.type ?? "").toLowerCase() === "discussion" && Number.isFinite(discussionAssignmentId) && discussionAssignmentId > 0) {
      ids.push(discussionAssignmentId);
    }

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
    const [course, assignmentGroups, modules, assignmentList, discussionTopics, instructorEnrollments, tabs] = await Promise.all([
      $.get(`/api/v1/courses/${courseId}?include[]=term`),
      canvasGet(`/api/v1/courses/${courseId}/assignment_groups?include[]=assignments`),
      canvasGet(`/api/v1/courses/${courseId}/modules?include[]=items&include[]=content_details`),
      canvasGet(`/api/v1/courses/${courseId}/assignments`),
      canvasGet(`/api/v1/courses/${courseId}/discussion_topics`),
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
    latestLastModule = modules.length ? modules[modules.length - 1] : null;

    const discussionAssignmentIdsByTopicId = discussionTopics.reduce((map, topic) => {
      const topicId = Number(topic?.id);
      const assignmentId = Number(topic?.assignment_id);

      if (Number.isFinite(topicId) && topicId > 0 && Number.isFinite(assignmentId) && assignmentId > 0) {
        map[topicId] = assignmentId;
      }

      return map;
    }, {});

    const assignmentModuleIds = new Set(
      moduleItems
        .flatMap(item => getModuleItemContentIds(item, discussionAssignmentIdsByTopicId))
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
    const emptyWeightedAssignmentGroups = assignmentGroups
      .filter(group => Number(group?.group_weight ?? 0) > 0 && (group.assignments ?? []).length === 0)
      .map(group => ({
        id: group.id,
        name: group.name,
        groupWeight: Number(group.group_weight ?? 0)
      }));

    const instructorEvalAssignments = assignmentList.filter(assignment =>
      String(assignment?.external_tool_tag_attributes?.url ?? "").toLowerCase().includes(`jotform_id=${instructorEvalId}`)
    );

    const courseEvalAssignments = assignmentList.filter(assignment =>
      (() => {
        const url = String(assignment?.external_tool_tag_attributes?.url ?? "").toLowerCase();
        return url.includes(`jotform_id=${courseEvalId}`) || url === courseEvalBaseUrl;
      })()
    );

    const employmentSkillsAssignments = assignmentList.filter(assignment =>
      String(assignment?.name ?? "").toLowerCase().includes(employmentSkillsNameFragment)
    );

    const employmentSkillsAssignmentsWithResponseLinks = employmentSkillsAssignments.filter(assignment =>
      hasJotformAndResponseJotformIds(assignment?.external_tool_tag_attributes?.url)
    );

    return {
      termName,
      termYear,
      isCoursePublished: Boolean(course?.published) || ["available", "completed"].includes(String(course?.workflow_state ?? "").toLowerCase()),
      employmentSkillsAssignments,
      employmentSkillsAssignmentsWithResponseLinks,
      instructorEvalAssignments,
      courseEvalAssignments,
      instructorEnrollments,
      tabs,
      hasAnyContent: moduleItems.length > 0,
      usesAssignmentGroupWeights,
      assignmentGroupWeightsAddTo100: usesAssignmentGroupWeights && Math.abs(assignmentGroupWeightTotal - 100) < 0.001,
      assignmentGroupWeightTotal,
      emptyWeightedAssignmentGroups,
      assignmentsWorthPointsNotInModule,
      unpublishedAssignmentsInModule,
      syllabusModuleLinkMismatches
    };
  }

  function getIsReady(data) {
    return getPrerequisiteChecks(data)
      .filter(check => check.isScored !== false)
      .every(check => check.state === "pass");
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
      "Empty Group(s)": "groupWeights",
      "Employment Skills Evaluation": "employmentSkillsEvaluation",
      "Group Weights = 100%": "groupWeights",
      "Instructor Evaluation": "instructorEvaluation",
      "Instructors Added": "instructorsAdded",
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

  function hasJotformAndResponseJotformIds(urlValue) {
    const url = String(urlValue ?? "").trim();
    if (!url) return false;

    try {
      const parsedUrl = new URL(url, window.location.origin);
      const jotformId = parsedUrl.searchParams.get("jotform_id");
      const responseJotformId = parsedUrl.searchParams.get("response_jotform_id");
      return Boolean(jotformId && responseJotformId);
    } catch (error) {
      return false;
    }
  }

  function getEvaluationCheck(assignments, title) {
    if (!assignments.length) {
      return createCheck(title, "fail", `Add the ${title.toLowerCase()} assignment.`, {
        action: {
          type: title === "Instructor Evaluation" ? "addInstructorEvaluation" : "addCourseEvaluation",
          label: "Add Eval"
        }
      });
    }

    const hasPublishedAssignment = assignments.some(assignment =>
      assignment.published === true || assignment.workflow_state === "published"
    );

    if (hasPublishedAssignment) {
      return createCheck(title, "pass", `${title} assignment is published.`);
    }

    return createCheck(title, "warn", `${title} assignment exists but is not published.`);
  }

  function getEmploymentSkillsEvaluationCheck(data) {
    const matchingAssignments = data.employmentSkillsAssignments ?? [];

    if (!matchingAssignments.length) {
      return createCheck(
        "Employment Skills Evaluation",
        "info",
        "No assignment or quiz with 'employment skills' in the name was found.",
        {
          action: {
            type: "addEmploymentSkillsEvaluation",
            label: "Add Eval"
          },
          isScored: false
        }
      );
    }

    if ((data.employmentSkillsAssignmentsWithResponseLinks ?? []).length > 0) {
      return createCheck(
        "Employment Skills Evaluation",
        "pass",
        "Employment Skills evaluation includes both jotform_id and response_jotform_id.",
        {
          action: {
            type: "addEmploymentSkillsEvaluation",
            label: "Add Eval"
          }
        }
      );
    }

    return createCheck(
      "Employment Skills Evaluation",
      "fail",
      "An Employment Skills assignment or quiz exists, but its link is missing jotform_id and/or response_jotform_id.",
      {
        action: {
          type: "addEmploymentSkillsEvaluation",
          label: "Add Eval"
        },
        items: matchingAssignments,
        itemFormatter: item => escapeHtml(item.name),
        itemSummary: `${matchingAssignments.length} matching item(s)`
      }
    );
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
        actions: [
          {
            type: "removeSyllabusModuleLinks",
            label: "Remove Link"
          },
          {
            type: "fixSyllabusModuleLinks",
            label: "Fix Link"
          }
        ]
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

  function getEmptyGroupsCheck(data) {
    if (!data.usesAssignmentGroupWeights) {
      return createCheck("Empty Group(s)", "pass", "Assignment group weighting is not enabled for this course.");
    }

    if ((data.emptyWeightedAssignmentGroups ?? []).length > 0) {
      return createCheck("Empty Group(s)", "warn", `${data.emptyWeightedAssignmentGroups.length} weighted assignment group(s) have no assignments.`, {
        items: data.emptyWeightedAssignmentGroups,
        itemFormatter: item => `${escapeHtml(item.name)} (${escapeHtml(String(item.groupWeight))}%)`,
        itemSummary: `${data.emptyWeightedAssignmentGroups.length} empty weighted group(s)`
      });
    }

    return createCheck("Empty Group(s)", "pass", "All weighted assignment groups contain assignments.");
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

  function getPrerequisiteChecks(data) {
    if (!data.coreLoaded) {
      return [
        getLoadingCheck("Instructors Added"),
        getLoadingCheck("Instructor Evaluation"),
        getLoadingCheck("Course Evaluation"),
        getLoadingCheck("Employment Skills Evaluation"),
        getLoadingCheck("Course Content"),
        getLoadingCheck("Group Weights = 100%"),
        getLoadingCheck("Empty Group(s)"),
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
      getEmploymentSkillsEvaluationCheck(data),
      getContentCheck(data),
      getWeightsCheck(data),
      getEmptyGroupsCheck(data),
      getAssignmentsInModulesCheck(data),
      getAssignmentsPublishedCheck(data),
      getSyllabusModuleLinksCheck(data),
      getSyllabusLinkCheck(data),
      getSyllabusCheck(data),
      ...getManualConfirmationChecks()
    ];
  }

  function getChecks(data) {
    return getPrerequisiteChecks(data);
  }

  function getReadinessStatus(data) {
    const checks = getPrerequisiteChecks(data);
    const scoredChecks = checks.filter(check => check.isScored !== false);

    if (scoredChecks.some(check => check.state === "loading")) {
      return {
        state: "loading",
        checks
      };
    }

    return {
      state: scoredChecks.every(check => check.state === "pass") ? "pass" : "fail",
      checks
    };
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
    const checkActions = Array.isArray(check.actions)
      ? check.actions
      : check.action
        ? [check.action]
        : [];
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
    const actionButton = checkActions.length
      ? `
        <div class="btech-course-readiness__action">
          ${checkActions.map(action => `
            <button
              type="button"
              class="btn btn-small btech-course-readiness__action-button"
              data-action-type="${escapeHtml(action.type)}"
              data-tab-id="${escapeHtml(action.tabId)}"
            >${escapeHtml(action.label)}</button>
          `).join("")}
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
        ${check.state === "pass" || checkActions.length || checkItems.length ? "" : `<span class="btech-course-readiness__check-detail">${escapeHtml(check.detail)}</span>`}
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
        <div class="btech-course-readiness__readiness">
          <div class="btech-course-readiness__readiness-banner is-fail">
            <span class="btech-course-readiness__readiness-label">Course Readiness</span>
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
    const readinessStatus = getReadinessStatus(data);
    const bannerState = readinessStatus.state === "loading"
      ? "loading"
      : data?.isCoursePublished === true && readinessStatus.state === "pass"
        ? "published"
      : readinessStatus.state === "pass"
        ? "ready"
        : "fail";
    const readinessLabel = readinessStatus.state === "loading"
      ? "Checking Readiness..."
      : data?.isCoursePublished === true && readinessStatus.state === "pass"
        ? "Published!"
      : readinessStatus.state === "pass"
        ? "Course Ready to Publish"
        : "Course Not Ready";

    card.html(`
      <div class="btech-course-readiness__readiness">
        <div class="btech-course-readiness__readiness-banner is-${bannerState}">
          <span class="btech-course-readiness__readiness-label">${escapeHtml(readinessLabel)}</span>
        </div>
        <p class="btech-course-readiness__meta">Last checked ${escapeHtml(updatedAt)}</p>
      </div>
      <div class="btech-course-readiness__body">
        <ul class="btech-course-readiness__checks">
          ${overallStatus.checks.map(check => renderCheck(check)).join("")}
        </ul>
      </div>
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
          button.prop("disabled", false).text("Fix Link");
          alert("Unable to fix the Simple Syllabus module links right now.");
        }

        return;
      }

      if (actionType === "removeSyllabusModuleLinks") {
        button.prop("disabled", true).text("Removing...");

        try {
          await removeSyllabusModuleLinks(latestSyllabusModuleLinkMismatches);
          latestSyllabusModuleLinkMismatches = [];
          markActionResolved(button);
        } catch (error) {
          console.error("Unable to remove Simple Syllabus module links.", error);
          button.prop("disabled", false).text("Remove Link");
          alert("Unable to remove the Simple Syllabus module link right now.");
        }

        return;
      }

      if (actionType === "addInstructorEvaluation") {
        button.prop("disabled", true).text("Adding...");

        try {
          await createEvaluationAssignment({
            title: "Instructor Evaluation",
            url: `https://surveys.bridgetools.dev/init?jotform_id=${instructorEvalId}`
          });
          markActionResolved(button);
        } catch (error) {
          console.error("Unable to add Instructor Evaluation.", error);
          button.prop("disabled", false).text("Add Eval");
          alert("Unable to add the Instructor Evaluation right now.");
        }

        return;
      }

      if (actionType === "addCourseEvaluation") {
        button.prop("disabled", true).text("Adding...");

        try {
          await createEvaluationAssignment({
            title: "Course Evaluation",
            url: `https://surveys.bridgetools.dev/init?jotform_id=${courseEvalId}`
          });
          markActionResolved(button);
        } catch (error) {
          console.error("Unable to add Course Evaluation.", error);
          button.prop("disabled", false).text("Add Eval");
          alert("Unable to add the Course Evaluation right now.");
        }

        return;
      }

      if (actionType === "addEmploymentSkillsEvaluation") {
        button.prop("disabled", true).text("Adding...");

        try {
          await createEvaluationAssignment({
            title: "Employment Skills Evaluation",
            url: employmentSkillsEvalUrl
          });
          markActionResolved(button);
        } catch (error) {
          console.error("Unable to add Employment Skills Evaluation.", error);
          button.prop("disabled", false).text("Add Eval");
          alert("Unable to add the Employment Skills Evaluation right now.");
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
