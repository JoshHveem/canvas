/*
  AI Hub

  Live Canvas feature for the AI Hub course.
*/
window.AIHubConfig = Object.assign({}, window.AIHubConfig || {}, {
  courseId: "621895"
});

(function () {
  if (!window.IS_TEACHER) return;

  const HUB_CONFIG = window.AIHubConfig;
  const KEEP_TABS = ["Home", "People", "Announcements"];
  const EDIT_TAB_ATTRIBUTE = "data-ai-hub-edit-tab";
  const EDIT_TABS = [
    { id: "ai-hub-edit-events-link", label: "Edit Calendar", editor: "events" }
    // { id: "ai-hub-edit-courses-link", label: "Edit Courses", editor: "courses" },
    // { id: "ai-hub-edit-resources-link", label: "Edit Resources", editor: "resources" }
  ];
  const TOGGLE_BUTTON_ID = "ai-hub-toggle-tabs-button";
  const HIDDEN_TAB_ATTRIBUTE = "data-ai-hub-hidden-tab";
  const PREVIOUS_DISPLAY_ATTRIBUTE = "data-ai-hub-previous-display";
  const HEADER_BAR_SELECTOR = ".header-bar-outer-container";
  const HIDDEN_HEADER_ATTRIBUTE = "data-ai-hub-hidden-header";
  const POPUP_BACKDROP_ID = "ai-hub-editor-backdrop";
  const POPUP_PANEL_ID = "ai-hub-editor-panel";
  const DATA_PAGE_URL = "json";
  const DATA_ELEMENT_ID = "ai-hub-json-data";
  const HUB_SECTION_ATTRIBUTE = "data-ai-hub-section";
  const HUB_PAGE_BACKUP_PREFIX = "ai-hub-page-backup";
  const EVENT_TITLE_MAX_LENGTH = 40;
  const COURSE_TITLE_MAX_LENGTH = 40;
  const COURSE_DESCRIPTION_MAX_LENGTH = 80;
  const RESOURCE_TITLE_MAX_LENGTH = 40;
  const RESOURCE_DESCRIPTION_MAX_LENGTH = 150;
  const RESOURCE_DEFAULT_ICON = "📄";
  const COURSE_DEFAULT_ICON = "📚";
  const COURSE_ICON_BY_KEY = {
    chart: "📊",
    check: "✅",
    checklist: "✅",
    computer: "💻",
    desktop: "💻",
    document: "📚",
    people: "👥",
    play: "🎬",
    puzzle: "🧩",
    robot: "🤖"
  };
  const RESOURCE_ICON_BY_KEY = {
    check: "✅",
    checklist: "✅",
    comment: "💬",
    document: "📄",
    file: "📄",
    guide: "🧭",
    play: "▶️",
    video: "🎬"
  };
  const COURSE_FORMAT_LABELS = {
    in_person: "In Person",
    live_cohort: "Live Cohort",
    self_paced: "Self-Paced"
  };

  function getCourseId() {
    const courseId = String(HUB_CONFIG.courseId || "").trim();
    if (!courseId) {
      throw new Error("AI Hub course id is missing. Set window.AIHubConfig.courseId before running.");
    }
    return courseId;
  }

  function getCoursePath() {
    return "/courses/" + getCourseId();
  }

  function isAiHubHomePath() {
    return new RegExp("^" + getCoursePath() + "/?$").test(window.location.pathname);
  }

  function getDataPageApiUrl() {
    return "/api/v1/courses/" + getCourseId() + "/pages/" + encodeURIComponent(DATA_PAGE_URL);
  }

  function getPageApiUrl(pageUrl) {
    return "/api/v1/courses/" + getCourseId() + "/pages/" + encodeURIComponent(pageUrl);
  }

  function getPagesApiUrl() {
    return "/api/v1/courses/" + getCourseId() + "/pages";
  }

  function getCurrentHubPageUrl() {
    const envPageUrl = window.ENV?.WIKI_PAGE?.url;
    if (envPageUrl) return envPageUrl;

    const match = window.location.pathname.match(new RegExp("^/courses/" + getCourseId() + "/pages/([^/?#]+)"));
    return match ? decodeURIComponent(match[1]) : "";
  }

  function getDefaultHubData() {
    return {
      version: 1,
      events: [],
      courses: [],
      resources: []
    };
  }

  function getStarterHubData() {
    const now = new Date().toISOString();
    return {
      version: 1,
      events: [
        {
          id: "evt_ai_prompting_lab",
          title: "AI Prompting Lab",
          event_date: "2026-08-12",
          start_time: "10:00",
          location_type: "online",
          location_label: "Online (Zoom)",
          booking_url: "REPLACE-WITH-REGISTER-LINK-1",
          status: "active",
          sort_order: 1,
          created_at: now,
          updated_at: now
        },
        {
          id: "evt_ai_policy_syllabus",
          title: "AI Policy & Syllabus Statements",
          event_date: "2026-08-19",
          start_time: "14:00",
          location_type: "online",
          location_label: "Online (Zoom)",
          booking_url: "REPLACE-WITH-REGISTER-LINK-2",
          status: "active",
          sort_order: 2,
          created_at: now,
          updated_at: now
        },
        {
          id: "evt_feedback_workflows",
          title: "Automating Feedback Workflows",
          event_date: "2026-08-26",
          start_time: "11:00",
          location_type: "online",
          location_label: "Online (Zoom)",
          booking_url: "REPLACE-WITH-REGISTER-LINK-3",
          status: "active",
          sort_order: 3,
          created_at: now,
          updated_at: now
        },
        {
          id: "evt_responsible_ai_office_hours",
          title: "Responsible AI Office Hours",
          event_date: "2026-09-02",
          start_time: "13:00",
          location_type: "online",
          location_label: "Online (Zoom)",
          booking_url: "REPLACE-WITH-REGISTER-LINK-4",
          status: "active",
          sort_order: 4,
          created_at: now,
          updated_at: now
        }
      ],
      courses: [
        {
          id: "course_ai_foundations",
          icon_key: "robot",
          title: "AI Foundations for Educators",
          description: "Core concepts for using AI confidently and responsibly.",
          format: "self_paced",
          course_url: "REPLACE-WITH-COURSE-LINK-1",
          sort_order: 1,
          created_at: now,
          updated_at: now
        },
        {
          id: "course_prompting_course_design",
          icon_key: "puzzle",
          title: "Prompting for Course Design",
          description: "Draft outcomes, activities, examples, and rubrics faster.",
          format: "self_paced",
          course_url: "REPLACE-WITH-COURSE-LINK-2",
          sort_order: 2,
          created_at: now,
          updated_at: now
        },
        {
          id: "course_responsible_ai_teaching",
          icon_key: "chart",
          title: "Responsible AI in Teaching",
          description: "Set clear expectations and reduce academic integrity risk.",
          format: "self_paced",
          course_url: "REPLACE-WITH-COURSE-LINK-3",
          sort_order: 3,
          created_at: now,
          updated_at: now
        },
        {
          id: "course_ai_feedback_workflows",
          icon_key: "people",
          title: "AI Feedback Workflows",
          description: "Use AI to draft feedback while keeping instructor judgment central.",
          format: "self_paced",
          course_url: "REPLACE-WITH-COURSE-LINK-4",
          sort_order: 4,
          created_at: now,
          updated_at: now
        },
        {
          id: "course_ai_accessibility",
          icon_key: "checklist",
          title: "AI Tools for Accessibility",
          description: "Improve readability, captions, alt text, and learner support.",
          format: "self_paced",
          course_url: "REPLACE-WITH-COURSE-LINK-5",
          sort_order: 5,
          created_at: now,
          updated_at: now
        }
      ],
      resources: [
        {
          id: "resource_ai_policy_template",
          icon_key: "document",
          title: "AI Use Policy Template",
          description: "Editable language for setting expectations around AI use.",
          resource_url: "REPLACE-WITH-RESOURCE-LINK-1",
          action_label: "Download",
          sort_order: 1,
          created_at: now,
          updated_at: now
        },
        {
          id: "resource_prompt_library",
          icon_key: "checklist",
          title: "Prompt Library",
          description: "Reusable prompts for planning, teaching, assessment, and feedback.",
          resource_url: "REPLACE-WITH-RESOURCE-LINK-2",
          action_label: "Download",
          sort_order: 2,
          created_at: now,
          updated_at: now
        },
        {
          id: "resource_ai_assignment_checklist",
          icon_key: "play",
          title: "AI Assignment Checklist",
          description: "Review assignments for AI clarity, usefulness, and integrity.",
          resource_url: "REPLACE-WITH-RESOURCE-LINK-3",
          action_label: "View Guide",
          sort_order: 3,
          created_at: now,
          updated_at: now
        },
        {
          id: "resource_tool_evaluation_guide",
          icon_key: "comment",
          title: "Tool Evaluation Guide",
          description: "Compare AI tools for privacy, accessibility, cost, and fit.",
          resource_url: "REPLACE-WITH-RESOURCE-LINK-4",
          action_label: "View Resource",
          sort_order: 4,
          created_at: now,
          updated_at: now
        }
      ]
    };
  }

  function getCsrfToken() {
    const metaToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");
    if (metaToken) return metaToken;

    const csrfCookie = document.cookie
      .split(";")
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith("_csrf_token="));

    return csrfCookie ? decodeURIComponent(csrfCookie.split("=").slice(1).join("=")) : "";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }

  function renderDataPageBody(data) {
    return `<pre id="${DATA_ELEMENT_ID}">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
  }

  function getDataPagePayload(data) {
    return {
      wiki_page: {
        url: DATA_PAGE_URL,
        title: "AI Hub JSON",
        editing_roles: "teachers",
        published: false,
        hide_from_students: true,
        front_page: false,
        body: renderDataPageBody(data),
        set_assignment: "0",
        assignment: {
          set_assignment: "0",
          publishable: true,
          hidden: false,
          unpublishable: true
        },
        notify_of_update: "0",
        student_planner_checkbox: false
      }
    };
  }

  function parseDateInput(value) {
    const parts = String(value || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some(part => !part)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function getShortMonth(value) {
    const parsed = parseDateInput(value);
    if (!parsed) return "";
    return parsed.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  }

  function getDayNumber(value) {
    const parsed = parseDateInput(value);
    return parsed ? String(parsed.getDate()).padStart(2, "0") : "";
  }

  function formatTime(value) {
    const parts = String(value || "").split(":").map(Number);
    if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return "";
    const suffix = parts[0] >= 12 ? "PM" : "AM";
    const hour = parts[0] % 12 || 12;
    const minute = String(parts[1]).padStart(2, "0");
    return `${hour}:${minute} ${suffix}`;
  }

  function getEventDateLine(eventRecord) {
    const parsed = parseDateInput(eventRecord.event_date);
    const dateLabel = parsed
      ? parsed.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
      : "Date TBD";
    const timeLabel = formatTime(eventRecord.start_time);
    return timeLabel ? `${dateLabel} &middot; ${timeLabel}` : dateLabel;
  }

  function getManagedSectionSelector(sectionName) {
    return "[" + HUB_SECTION_ATTRIBUTE + "='" + sectionName + "']";
  }

  function findSectionByHeading(root, headingText) {
    const headings = Array.from(root.querySelectorAll("h2"));
    const heading = headings.find(item => item.textContent.trim().replace(/\s+/g, " ") === headingText);
    return heading?.parentElement?.parentElement || null;
  }

  function findEventsSection(root) {
    return root.querySelector(getManagedSectionSelector("events")) || findSectionByHeading(root, "Upcoming Events");
  }

  function findCoursesSection(root) {
    return root.querySelector(getManagedSectionSelector("courses")) || findSectionByHeading(root, "Explore Courses");
  }

  function findResourcesSection(root) {
    return root.querySelector(getManagedSectionSelector("resources")) || findSectionByHeading(root, "Featured Resources");
  }

  function getCoursesViewAllUrl(section) {
    const viewAllLink = Array.from(section.querySelectorAll("a[href]"))
      .find(link => /view all courses/i.test(link.textContent || ""));
    return viewAllLink?.getAttribute("href") || "REPLACE-WITH-ALL-COURSES-LINK";
  }

  function getResourcesViewAllUrl(section) {
    const viewAllLink = Array.from(section.querySelectorAll("a[href]"))
      .find(link => /view all resources/i.test(link.textContent || ""));
    return viewAllLink?.getAttribute("href") || "REPLACE-WITH-ALL-RESOURCES-LINK";
  }

  function getCourseIcon(courseRecord) {
    const icon = courseRecord?.icon || courseRecord?.icon_key || "";
    return normalizeCourseIcon(icon);
  }

  function getResourceIcon(resourceRecord) {
    const icon = resourceRecord?.icon || resourceRecord?.icon_key || "";
    return normalizeResourceIcon(icon);
  }

  function getCourseFormatLabel(format) {
    return COURSE_FORMAT_LABELS[format] || limitText(String(format || "self_paced").replace(/_/g, " "), 24);
  }

  function normalizeResourceActionType(actionType, actionLabel, hasResourceUrl) {
    const value = String(actionType || "").trim();
    if (value === "canvas_page" || value === "view_resource") return "canvas_page";
    if (value === "external_link") return "external_link";
    if (/site|external/i.test(actionLabel || "")) return "external_link";
    if (/view|canvas/i.test(actionLabel || "")) return hasResourceUrl ? "external_link" : "canvas_page";
    return "download";
  }

  function getResourceActionType(resourceRecord) {
    return normalizeResourceActionType(
      resourceRecord?.action_type,
      resourceRecord?.action_label,
      Boolean(resourceRecord?.resource_url && !resourceRecord?.page_url)
    );
  }

  function getResourceActionLabel(resourceRecord) {
    const actionType = getResourceActionType(resourceRecord);
    return actionType === "download" ? "Download" : "View Resource";
  }

  function renderEventCard(eventRecord) {
    const title = eventRecord.title || "Untitled Event";
    const monthLabel = getShortMonth(eventRecord.event_date) || "TBD";
    const dayLabel = getDayNumber(eventRecord.event_date) || "--";
    const locationLabel = eventRecord.location_label || "No location";
    const bookingUrl = eventRecord.booking_url || "#";

    return `
      <div style="background: #ffffff; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; border: 1px solid #e6e8ec;">
        <div style="display: inline-block; align-self: flex-start; border-radius: 8px; padding: 6px 12px; text-align: center; line-height: 1.1; margin-bottom: 14px; border: 1px solid #e6e8ec;">
          <div style="font-size: 11px; color: #1d4ed8;">${escapeHtml(monthLabel)}</div>
          <div style="font-size: 22px; color: #000000;">${escapeHtml(dayLabel)}</div>
        </div>
        <h3 style="margin: 0 0 12px; font-size: 16px; color: #000000; line-height: 1.25;">${escapeHtml(title)}</h3>
        <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;"><span aria-hidden="true">&#128336;&nbsp;</span> ${getEventDateLine(eventRecord)}</div>
        <div style="font-size: 13px; color: #6b7280; margin-bottom: 18px;"><span aria-hidden="true">&#128205;&nbsp;</span> ${escapeHtml(locationLabel)}</div>
        <a style="margin-top: auto; display: block; text-align: center; background: #000000; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 10px; border-radius: 8px; border: 1.5px solid #000000;" href="${escapeAttribute(bookingUrl)}" target="_blank" aria-label="Register for ${escapeAttribute(title)}" rel="noopener">Register</a>
      </div>
    `;
  }

  function renderCourseCard(courseRecord) {
    const title = courseRecord.title || "Untitled Course";
    const description = courseRecord.description || "";
    const icon = getCourseIcon(courseRecord);
    const courseUrl = courseRecord.course_url || "#";
    const formatLabel = getCourseFormatLabel(courseRecord.format);

    return `
      <div style="background: #ffffff; border-radius: 14px; padding: 22px 16px; text-align: center; border: 1px solid #e6e8ec;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #eeeeef; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; font-size: 23px;" aria-hidden="true">${escapeHtml(icon)}</div>
        <h3 style="margin: 0 0 8px; font-size: 16px; line-height: 1.25;"><a style="color: #000000; text-decoration: underline;" href="${escapeAttribute(courseUrl)}">${escapeHtml(title)}</a></h3>
        <div style="font-size: 13px; color: #6b7280; margin-bottom: 12px;">${escapeHtml(description)}</div>
        <div style="font-size: 12px; color: #1d4ed8;"><span aria-hidden="true">&#128336;&nbsp;</span> ${escapeHtml(formatLabel)}</div>
      </div>
    `;
  }

  function renderResourceCard(resourceRecord) {
    const title = resourceRecord.title || "Untitled Resource";
    const description = resourceRecord.description || "";
    const icon = getResourceIcon(resourceRecord);
    const actionLabel = getResourceActionLabel(resourceRecord);
    const actionType = getResourceActionType(resourceRecord);
    const href = actionType === "canvas_page"
      ? resourceRecord.page_url || resourceRecord.html_url || "#"
      : resourceRecord.resource_url || "#";
    const arrow = actionLabel === "Download" ? "&#11015;" : "&rarr;";

    return `
      <div style="background: #ffffff; border-radius: 14px; padding: 20px 18px; display: flex; flex-direction: column; border: 1px solid #e6e8ec;">
        <div style="width: 44px; height: 44px; border-radius: 10px; background: #eeeeef; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 12px;" aria-hidden="true">${escapeHtml(icon)}</div>
        <h3 style="margin: 0 0 8px; font-size: 16px; color: #000000; line-height: 1.25;">${escapeHtml(title)}</h3>
        <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280;">${escapeHtml(description)}</p>
        <a style="margin-top: auto; color: #1d4ed8; font-size: 14px; text-decoration: underline;" href="${escapeAttribute(href)}" aria-label="${escapeAttribute(actionLabel + " " + title)}">${escapeHtml(actionLabel)} <span aria-hidden="true">${arrow}</span></a>
      </div>
    `;
  }

  function renderEventsSection(events) {
    const activeEvents = sortEventsByDate(events || []).filter(eventRecord => eventRecord.status !== "archived");
    const cardsHtml = activeEvents.length
      ? activeEvents.map(renderEventCard).join("")
      : `<div style="background: #ffffff; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; border: 1px solid #e6e8ec; color: #6b7280;">No upcoming events are scheduled yet.</div>`;

    return `
      <div ${HUB_SECTION_ATTRIBUTE}="events" style="margin-top: 52px;">
        <div style="display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: bold; font-size: 28px; color: #000000;">Upcoming Events</h2>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit,minmax(145px,1fr)); gap: 16px;">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  function renderCoursesSection(courses, options) {
    const sortedCourses = sortBySortOrder(courses || []);
    const viewAllUrl = options?.viewAllUrl || "REPLACE-WITH-ALL-COURSES-LINK";
    const cardsHtml = sortedCourses.length
      ? sortedCourses.map(renderCourseCard).join("")
      : `<div style="background: #ffffff; border-radius: 14px; padding: 22px 16px; text-align: center; border: 1px solid #e6e8ec; color: #6b7280;">No courses have been added yet.</div>`;

    return `
      <div ${HUB_SECTION_ATTRIBUTE}="courses" style="margin-top: 52px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: 700; font-size: 28px; color: #000000;">Explore Courses</h2>
          <a style="color: #000000; text-decoration: underline; font-size: 14px;" href="${escapeAttribute(viewAllUrl)}">View all courses <span aria-hidden="true">&rarr;</span></a>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit,minmax(145px,1fr)); gap: 16px;">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  function renderResourcesSection(resources, options) {
    const sortedResources = sortBySortOrder(resources || []);
    const viewAllUrl = options?.viewAllUrl || "REPLACE-WITH-ALL-RESOURCES-LINK";
    const cardsHtml = sortedResources.length
      ? sortedResources.map(renderResourceCard).join("")
      : `<div style="background: #ffffff; border-radius: 14px; padding: 20px 18px; display: flex; flex-direction: column; border: 1px solid #e6e8ec; color: #6b7280;">No featured resources have been added yet.</div>`;

    return `
      <div ${HUB_SECTION_ATTRIBUTE}="resources" style="margin-top: 52px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: 700; font-size: 28px; color: #000000;">Featured Resources</h2>
          <a style="color: #000000; text-decoration: underline; font-size: 14px;" href="${escapeAttribute(viewAllUrl)}">View all resources <span aria-hidden="true">&rarr;</span></a>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit,minmax(145px,1fr)); gap: 16px;">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  function renderHubPageBody(data) {
    const normalizedData = normalizeHubData(data);

    return `
      <div data-ai-hub-section="shell" style="max-width: 1000px; margin: 0 auto; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; color: #4b5563; line-height: 1.55;">
        <div style="display: flex; flex-wrap: wrap; gap: 30px; align-items: center; padding: 0 4px 52px;">
          <div style="flex: 1 1 340px;">
            <h2 style="font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: bold; margin: 0; font-size: 46px; line-height: 1.08; color: #000000;">Use AI with Purpose<br /><span style="color: #1d4ed8;">Learn. Build. Create.</span></h2>
            <p style="margin: 18px 0 28px; font-size: 17px; max-width: 470px; color: #4b5563;">Your central hub for AI tools, training, resources, and project support across teaching, learning, course design, and daily work.</p>
            <div style="display: flex; flex-wrap: wrap; gap: 12px;"><a style="display: inline-block; background: #1d4ed8; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 13px 24px; border-radius: 8px;" href="https://btech.instructure.com/courses/621895/pages/contact">Get Help with AI: Contact ISD</a></div>
          </div>
          <div style="flex: 1 1 340px;"><img style="display: block; width: 100%; min-height: 300px; border-radius: 18px; border: 1px solid #e5e7eb;" src="https://btech.instructure.com/courses/611213/files/123202821/preview" alt="People collaborating around course and technology planning" data-api-endpoint="https://btech.instructure.com/api/v1/courses/611213/files/123202821" data-api-returntype="File" /></div>
        </div>
        <div style="margin-top: 0;">
          <h2 style="margin: 0 0 18px; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: bold; font-size: 28px; color: #000000;">Choose Your AI Path</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); gap: 18px;">
            <div style="background: #ffffff; border: 1px solid #e6e8ec; border-radius: 16px; padding: 26px; display: flex; flex-direction: column;">
              <div style="font-size: 12px; color: #1d4ed8; text-transform: uppercase; margin-bottom: 8px;"><strong>Start here</strong></div>
              <h3 style="margin: 0 0 10px; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: bold; font-size: 24px; color: #000000; line-height: 1.2;">AI Basics Course</h3>
              <p style="margin: 0 0 20px; font-size: 15px; color: #4b5563;">A guided start-to-finish course for learning AI foundations in chronological order and completing the full pathway.</p>
              <a style="margin-top: auto; display: inline-block; align-self: flex-start; background: #1d4ed8; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 12px 20px; border-radius: 8px;" href="https://btech.instructure.com/courses/621895/modules">Start the Journey</a>
            </div>
            <div style="background: #ffffff; border: 1px solid #e6e8ec; border-radius: 16px; padding: 26px; display: flex; flex-direction: column;">
              <div style="font-size: 12px; color: #1d4ed8; text-transform: uppercase; margin-bottom: 8px;"><strong>Toolbox</strong></div>
              <h3 style="margin: 0 0 10px; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: bold; font-size: 24px; color: #000000; line-height: 1.2;">Micro-Trainings &amp; Resources</h3>
              <p style="margin: 0 0 20px; font-size: 15px; color: #4b5563;">Short, one-off trainings and resources for specific AI skills, tools, classroom uses, and workflow ideas.</p>
              <a style="margin-top: auto; display: inline-block; align-self: flex-start; background: #000000; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 12px 20px; border-radius: 8px;" href="https://btech.instructure.com/courses/621895/pages/tool-box">Open the Toolbox</a>
            </div>
          </div>
        </div>
        ${renderEventsSection(normalizedData.events, {})}
        <div style="margin-top: 48px; margin-bottom: 8px; background: #1d4ed8; border-radius: 16px; padding: 32px 30px; display: flex; flex-wrap: wrap; gap: 20px; align-items: center; justify-content: space-between;">
          <div style="flex: 1 1 320px;">
            <h2 style="margin: 0 0 8px; font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight: bold; font-size: 26px; color: #ffffff;">Need help with an AI project?</h2>
            <div style="font-size: 15px; color: rgba(255,255,255,0.88); max-width: 620px;">ISD can help you plan responsible AI use, choose tools, build workflows, design learning activities, and think through project guardrails.</div>
          </div>
          <span style="color: #1d4ed8;"><a style="display: inline-block; background: #ffffff; color: #1d4ed8; text-decoration: none; font-size: 15px; font-weight: bold; padding: 13px 24px; border-radius: 8px;" href="https://btech.instructure.com/courses/621895/pages/contact">Get Help with AI: Contact ISD</a></span>
        </div>
      </div>
    `;
  }

  function replaceEventsSectionInBody(body, data) {
    const doc = new DOMParser().parseFromString(body || "", "text/html");
    const currentSection = findEventsSection(doc);

    if (!currentSection) {
      throw new Error('Could not find the "Upcoming Events" section in the current hub page body.');
    }

    const template = doc.createElement("template");
    template.innerHTML = renderEventsSection(normalizeHubData(data).events).trim();

    currentSection.replaceWith(template.content.firstElementChild);
    return doc.body.innerHTML;
  }

  function replaceCoursesSectionInBody(body, data) {
    const doc = new DOMParser().parseFromString(body || "", "text/html");
    const currentSection = findCoursesSection(doc);

    if (!currentSection) {
      throw new Error('Could not find the "Explore Courses" section in the current hub page body.');
    }

    const template = doc.createElement("template");
    template.innerHTML = renderCoursesSection(normalizeHubData(data).courses, {
      viewAllUrl: getCoursesViewAllUrl(currentSection)
    }).trim();

    currentSection.replaceWith(template.content.firstElementChild);
    return doc.body.innerHTML;
  }

  function replaceResourcesSectionInBody(body, data) {
    const doc = new DOMParser().parseFromString(body || "", "text/html");
    const currentSection = findResourcesSection(doc);

    if (!currentSection) {
      throw new Error('Could not find the "Featured Resources" section in the current hub page body.');
    }

    const template = doc.createElement("template");
    template.innerHTML = renderResourcesSection(normalizeHubData(data).resources, {
      viewAllUrl: getResourcesViewAllUrl(currentSection)
    }).trim();

    currentSection.replaceWith(template.content.firstElementChild);
    return doc.body.innerHTML;
  }

  function replaceEventsSectionInCurrentDom(data) {
    const currentSection = findEventsSection(document);
    if (!currentSection) return false;

    const template = document.createElement("template");
    template.innerHTML = renderEventsSection(normalizeHubData(data).events).trim();

    currentSection.replaceWith(template.content.firstElementChild);
    return true;
  }

  function replaceResourcesSectionInCurrentDom(data) {
    const currentSection = findResourcesSection(document);
    if (!currentSection) return false;

    const template = document.createElement("template");
    template.innerHTML = renderResourcesSection(normalizeHubData(data).resources, {
      viewAllUrl: getResourcesViewAllUrl(currentSection)
    }).trim();

    currentSection.replaceWith(template.content.firstElementChild);
    return true;
  }

  function replaceCoursesSectionInCurrentDom(data) {
    const currentSection = findCoursesSection(document);
    if (!currentSection) return false;

    const template = document.createElement("template");
    template.innerHTML = renderCoursesSection(normalizeHubData(data).courses, {
      viewAllUrl: getCoursesViewAllUrl(currentSection)
    }).trim();

    currentSection.replaceWith(template.content.firstElementChild);
    return true;
  }

  function readDataFromPageBody(body) {
    const doc = new DOMParser().parseFromString(body || "", "text/html");
    const dataElement = doc.getElementById(DATA_ELEMENT_ID);
    const raw = dataElement ? dataElement.textContent : doc.body.textContent;

    if (!raw || !raw.trim() || !raw.trim().startsWith("{")) {
      return getDefaultHubData();
    }

    try {
      return Object.assign(getDefaultHubData(), JSON.parse(raw));
    } catch (error) {
      console.warn("AI Hub JSON page could not be parsed. Using default data.", error);
      return getDefaultHubData();
    }
  }

  async function fetchDataPage() {
    const response = await fetch(getDataPageApiUrl(), {
      method: "GET",
      credentials: "include",
      headers: {
        "accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Could not fetch JSON data page. Status: " + response.status);
    }

    return response.json();
  }

  async function loadHubData() {
    const page = await fetchDataPage();
    return readDataFromPageBody(page.body);
  }

  async function saveHubData(data) {
    const headers = {
      "accept": "application/json",
      "content-type": "application/json",
      "x-requested-with": "XMLHttpRequest"
    };
    const csrfToken = getCsrfToken();
    if (csrfToken) headers["x-csrf-token"] = csrfToken;

    const payload = getDataPagePayload(data);
    let response = await fetch(getDataPageApiUrl(), {
      method: "PUT",
      credentials: "include",
      headers,
      body: JSON.stringify(payload)
    });

    if (response.status === 404) {
      response = await fetch(getPagesApiUrl(), {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      throw new Error("Could not save JSON data page. Status: " + response.status + ". " + await response.text());
    }

    return response.json();
  }

  async function fetchCanvasPage(pageUrl) {
    const response = await fetch(getPageApiUrl(pageUrl), {
      method: "GET",
      credentials: "include",
      headers: {
        "accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Could not fetch Canvas page /pages/" + pageUrl + ". Status: " + response.status);
    }

    return response.json();
  }

  function saveLocalPageBackup(pageUrl, body) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const key = HUB_PAGE_BACKUP_PREFIX + ":" + getCourseId() + ":" + pageUrl + ":" + stamp;
    localStorage.setItem(key, body || "");
    console.log("AI Hub page backup saved:", key);
    return key;
  }

  async function saveCanvasPageBody(page, updatedBody) {
    const headers = {
      "accept": "application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01",
      "content-type": "application/json",
      "x-requested-with": "XMLHttpRequest"
    };
    const csrfToken = getCsrfToken();
    if (csrfToken) headers["x-csrf-token"] = csrfToken;

    const pageUrl = page.url || getCurrentHubPageUrl();
    const wikiPage = Object.assign({}, page, {
      url: pageUrl,
      body: updatedBody,
      notify_of_update: "0",
      student_planner_checkbox: false
    });

    const response = await fetch(getPageApiUrl(pageUrl), {
      method: "PUT",
      mode: "cors",
      credentials: "include",
      headers,
      referrer: window.location.origin + getCoursePath() + "/pages/" + pageUrl + "/edit",
      body: JSON.stringify({
        wiki_page: wikiPage
      })
    });

    if (!response.ok) {
      throw new Error("Could not save visible hub page. Status: " + response.status + ". " + await response.text());
    }

    return response.json();
  }

  function replaceCurrentPageBodyInDom(updatedBody) {
    const target = document.querySelector("#wiki_page_show .user_content")
      || document.querySelector(".show-content")
      || document.querySelector("#content .user_content")
      || document.querySelector(".user_content");

    if (target) {
      target.innerHTML = updatedBody;
    }
  }

  function renderResourcePageBody(resourceRecord) {
    return `
      <h2>${escapeHtml(resourceRecord.title || "Resource")}</h2>
      <p>${escapeHtml(resourceRecord.description || "")}</p>
    `;
  }

  function updateResourcePageBody(existingBody, resourceRecord) {
    const titleHtml = `<h2>${escapeHtml(resourceRecord.title || "Resource")}</h2>`;
    const descriptionHtml = `<p>${escapeHtml(resourceRecord.description || "")}</p>`;
    let body = String(existingBody || "").trim();

    if (!body) return titleHtml + "\n" + descriptionHtml;

    if (/<h2\b[^>]*>[\s\S]*?<\/h2>/i.test(body)) {
      body = body.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/i, titleHtml);
    } else {
      body = titleHtml + "\n" + body;
    }

    if (/<p\b[^>]*>[\s\S]*?<\/p>/i.test(body)) {
      body = body.replace(/<p\b[^>]*>[\s\S]*?<\/p>/i, descriptionHtml);
    } else {
      body = body.replace(/<\/h2>/i, "</h2>\n" + descriptionHtml);
    }

    return body;
  }

  async function createCanvasResourcePage(resourceRecord) {
    const headers = {
      "accept": "application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01",
      "content-type": "application/json",
      "x-requested-with": "XMLHttpRequest"
    };
    const csrfToken = getCsrfToken();
    if (csrfToken) headers["x-csrf-token"] = csrfToken;

    const response = await fetch(getPagesApiUrl(), {
      method: "POST",
      mode: "cors",
      credentials: "include",
      headers,
      referrer: window.location.origin + getCoursePath() + "/pages",
      body: JSON.stringify({
        wiki_page: {
          editing_roles: "teachers",
          editor: "rce",
          block_editor_attributes: null,
          publishable: true,
          deletable: true,
          title: resourceRecord.title || "New Resource",
          body: renderResourcePageBody(resourceRecord),
          student_todo_at: null,
          publish_at: null,
          notify_of_update: "0",
          assignment: {
            set_assignment: "0",
            publishable: true,
            hidden: false,
            unpublishable: true
          },
          set_assignment: "0",
          student_planner_checkbox: false
        }
      })
    });

    if (!response.ok) {
      throw new Error("Could not create resource Canvas page. Status: " + response.status + ". " + await response.text());
    }

    return response.json();
  }

  function getResourcePageSlug(resourceRecord) {
    const pageSlug = resourceRecord?.page_slug;
    if (pageSlug) return pageSlug;

    const pageUrl = resourceRecord?.page_url || resourceRecord?.html_url;
    if (!pageUrl) return "";

    try {
      const url = new URL(pageUrl, window.location.origin);
      const match = url.pathname.match(/\/pages\/([^/?#]+)/);
      return match ? decodeURIComponent(match[1]) : "";
    } catch (error) {
      const match = String(pageUrl).match(/\/pages\/([^/?#]+)/);
      return match ? decodeURIComponent(match[1]) : "";
    }
  }

  async function updateCanvasResourcePage(resourceRecord) {
    const pageSlug = getResourcePageSlug(resourceRecord);
    if (!pageSlug) {
      throw new Error("Could not find the existing Canvas page slug for this resource.");
    }

    const page = await fetchCanvasPage(pageSlug);
    const headers = {
      "accept": "application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01",
      "content-type": "application/json",
      "x-requested-with": "XMLHttpRequest"
    };
    const csrfToken = getCsrfToken();
    if (csrfToken) headers["x-csrf-token"] = csrfToken;

    const pageUrl = page.url || pageSlug;
    const wikiPage = Object.assign({}, page, {
      url: pageUrl,
      title: resourceRecord.title || page.title || "Resource",
      body: updateResourcePageBody(page.body, resourceRecord),
      notify_of_update: "0",
      student_planner_checkbox: false
    });

    const response = await fetch(getPageApiUrl(pageUrl), {
      method: "PUT",
      mode: "cors",
      credentials: "include",
      headers,
      referrer: window.location.origin + getCoursePath() + "/pages/" + pageUrl + "/edit",
      body: JSON.stringify({
        wiki_page: wikiPage
      })
    });

    if (!response.ok) {
      throw new Error("Could not update resource Canvas page. Status: " + response.status + ". " + await response.text());
    }

    return response.json();
  }

  function getResourcePageEditUrl(resourceRecord) {
    const pageSlug = getResourcePageSlug(resourceRecord);
    if (pageSlug) {
      return window.location.origin + getCoursePath() + "/pages/" + pageSlug + "/edit";
    }

    const pageUrl = resourceRecord?.page_url || resourceRecord?.html_url;
    if (!pageUrl) return "";

    try {
      const editUrl = new URL(pageUrl, window.location.origin);
      editUrl.pathname = editUrl.pathname.replace(/\/$/, "") + "/edit";
      editUrl.search = "";
      editUrl.hash = "";
      return editUrl.toString();
    } catch (error) {
      return String(pageUrl).replace(/\/$/, "") + "/edit";
    }
  }

  async function saveRenderedHubPage(data) {
    const pageUrl = getCurrentHubPageUrl();

    if (!pageUrl) {
      throw new Error("Could not determine the current Canvas page URL.");
    }

    if (pageUrl === DATA_PAGE_URL) {
      throw new Error("The visible hub page cannot be updated while you are on the JSON data page.");
    }

    const page = await fetchCanvasPage(pageUrl);
    const normalizedData = normalizeHubData(data);
    const updatedBody = replaceEventsSectionInBody(page.body, normalizedData);
    const backupKey = saveLocalPageBackup(pageUrl, page.body);
    const savedPage = await saveCanvasPageBody(page, updatedBody);
    replaceEventsSectionInCurrentDom(normalizedData);
    console.log("AI Hub visible page saved:", pageUrl, "Backup:", backupKey);
    return savedPage;
  }

  async function saveHubDataAndRenderedPage(data) {
    await saveHubData(data);

    try {
      await saveRenderedHubPage(data);
    } catch (error) {
      throw new Error("JSON page saved, but visible hub page update failed. " + error.message);
    }

    return data;
  }

  async function seedHubDataPage() {
    const ok = window.confirm("Replace /pages/" + DATA_PAGE_URL + " with starter AI Hub JSON data?");
    if (!ok) return null;

    const data = getStarterHubData();
    await saveHubData(data);
    return data;
  }

  async function seedCurrentHubPage() {
    const pageUrl = getCurrentHubPageUrl();

    if (!pageUrl) {
      throw new Error("Could not determine the current Canvas page URL.");
    }

    if (pageUrl === DATA_PAGE_URL) {
      throw new Error("Open the visible AI Hub page before seeding the page layout.");
    }

    const ok = window.confirm("Replace the current Canvas page body with the starter AI Hub layout and save starter JSON to /pages/" + DATA_PAGE_URL + "?");
    if (!ok) return null;

    const data = getStarterHubData();
    await saveHubData(data);

    const page = await fetchCanvasPage(pageUrl);
    const updatedBody = renderHubPageBody(data).trim();
    const backupKey = saveLocalPageBackup(pageUrl, page.body);
    const savedPage = await saveCanvasPageBody(page, updatedBody);
    replaceCurrentPageBodyInDom(updatedBody);

    console.log("AI Hub starter page saved:", pageUrl, "Backup:", backupKey);
    return { data, savedPage, backupKey };
  }

  function createId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  function normalizeHubData(data) {
    return Object.assign(getDefaultHubData(), data || {}, {
      events: Array.isArray(data?.events) ? data.events : [],
      courses: Array.isArray(data?.courses) ? data.courses : [],
      resources: Array.isArray(data?.resources) ? data.resources : []
    });
  }

  function sortBySortOrder(items) {
    return [...items].sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
  }

  function renumberSortOrder(items) {
    sortBySortOrder(items).forEach((item, index) => {
      item.sort_order = index + 1;
    });
  }

  function getEventDateSortValue(eventRecord) {
    const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(eventRecord?.event_date || "")
      ? eventRecord.event_date
      : "9999-12-31";
    const timeValue = /^\d{2}:\d{2}$/.test(eventRecord?.start_time || "")
      ? eventRecord.start_time
      : "23:59";

    return dateValue + "T" + timeValue;
  }

  function sortEventsByDate(events) {
    return [...events].sort((a, b) => {
      const dateCompare = getEventDateSortValue(a).localeCompare(getEventDateSortValue(b));
      if (dateCompare !== 0) return dateCompare;

      return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
    });
  }

  function sortAndRenumberEventsByDate(data) {
    data.events = sortEventsByDate(data.events || []);
    data.events.forEach((eventRecord, index) => {
      eventRecord.sort_order = index + 1;
    });
    return data;
  }

  function limitText(value, maxLength) {
    return String(value || "").trim().slice(0, maxLength);
  }

  function getGraphemeSegments(value) {
    const text = String(value || "");

    if (window.Intl?.Segmenter) {
      return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), item => item.segment);
    }

    return Array.from(text);
  }

  function extractFirstEmoji(value) {
    const mappedIcon = COURSE_ICON_BY_KEY[String(value || "").trim()];
    if (mappedIcon) return mappedIcon;

    const emojiPattern = /[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Regional_Indicator}]/u;
    return getGraphemeSegments(value).find(segment => emojiPattern.test(segment)) || "";
  }

  function buildEventRecord(formEventData, existingEvent) {
    const now = new Date().toISOString();
    return Object.assign({}, existingEvent || {}, {
      id: existingEvent?.id || createId("evt"),
      title: limitText(formEventData.title, EVENT_TITLE_MAX_LENGTH),
      event_date: formEventData.event_date || "",
      start_time: formEventData.start_time || "",
      location_type: formEventData.location_type || "online",
      location_label: formEventData.location_label || "",
      booking_url: formEventData.booking_url || "",
      status: formEventData.status || existingEvent?.status || "active",
      sort_order: existingEvent?.sort_order || 999,
      created_at: existingEvent?.created_at || now,
      updated_at: now
    });
  }

  async function saveEventToHubData(eventId, formEventData) {
    const data = await loadHubData();
    const normalizedData = normalizeHubData(data);
    const existingIndex = normalizedData.events.findIndex(item => item.id === eventId);
    const existingEvent = existingIndex >= 0 ? normalizedData.events[existingIndex] : null;
    const eventRecord = buildEventRecord(formEventData, existingEvent);

    if (!existingEvent) {
      eventRecord.sort_order = normalizedData.events.length + 1;
      normalizedData.events.push(eventRecord);
    } else {
      normalizedData.events[existingIndex] = eventRecord;
    }

    sortAndRenumberEventsByDate(normalizedData);
    await saveHubDataAndRenderedPage(normalizedData);
    return eventRecord;
  }

  async function deleteEventFromHubData(eventId) {
    const data = normalizeHubData(await loadHubData());
    data.events = data.events.filter(item => item.id !== eventId);
    sortAndRenumberEventsByDate(data);
    await saveHubDataAndRenderedPage(data);
    return data.events;
  }

  async function setEventStatusInHubData(eventId, status) {
    const data = normalizeHubData(await loadHubData());
    const eventRecord = data.events.find(item => item.id === eventId);
    if (!eventRecord) return null;

    eventRecord.status = status;
    eventRecord.updated_at = new Date().toISOString();
    sortAndRenumberEventsByDate(data);
    await saveHubDataAndRenderedPage(data);
    return eventRecord;
  }

  async function moveEventInHubData(eventId, direction) {
    const data = normalizeHubData(await loadHubData());
    data.events = sortBySortOrder(data.events);
    const currentIndex = data.events.findIndex(item => item.id === eventId);
    if (currentIndex < 0) return data.events;

    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= data.events.length) return data.events;

    const moved = data.events[currentIndex];
    data.events[currentIndex] = data.events[nextIndex];
    data.events[nextIndex] = moved;
    sortAndRenumberEventsByDate(data);
    await saveHubDataAndRenderedPage(data);
    return data.events;
  }

  async function addEventToHubData(formEventData) {
    return saveEventToHubData(null, formEventData);
  }

  async function reorderEventsInHubData(orderedIds) {
    const data = normalizeHubData(await loadHubData());
    const byId = {};
    data.events.forEach(item => {
      byId[item.id] = item;
    });

    const reorderedEvents = orderedIds
      .map(id => byId[id])
      .filter(Boolean);
    const unorderedEvents = data.events.filter(item => !orderedIds.includes(item.id));

    data.events = reorderedEvents.concat(unorderedEvents);
    sortAndRenumberEventsByDate(data);
    await saveHubDataAndRenderedPage(data);
    return data.events;
  }

  function normalizeCourseIcon(icon) {
    return extractFirstEmoji(icon) || COURSE_DEFAULT_ICON;
  }

  function buildCourseRecord(formCourseData, existingCourse) {
    const now = new Date().toISOString();
    return Object.assign({}, existingCourse || {}, {
      id: existingCourse?.id || createId("course"),
      icon: normalizeCourseIcon(formCourseData.icon || existingCourse?.icon || existingCourse?.icon_key),
      title: limitText(formCourseData.title, COURSE_TITLE_MAX_LENGTH),
      description: limitText(formCourseData.description, COURSE_DESCRIPTION_MAX_LENGTH),
      format: formCourseData.format || existingCourse?.format || "self_paced",
      course_url: formCourseData.course_url || "",
      sort_order: existingCourse?.sort_order || 999,
      created_at: existingCourse?.created_at || now,
      updated_at: now
    });
  }

  function renumberCourses(data) {
    data.courses = sortBySortOrder(data.courses || []);
    data.courses.forEach((courseRecord, index) => {
      courseRecord.sort_order = index + 1;
    });
    return data;
  }

  async function saveCourseToHubData(courseId, formCourseData) {
    const data = normalizeHubData(await loadHubData());
    const existingIndex = data.courses.findIndex(item => item.id === courseId);
    const existingCourse = existingIndex >= 0 ? data.courses[existingIndex] : null;
    const courseRecord = buildCourseRecord(formCourseData, existingCourse);

    if (!existingCourse) {
      courseRecord.sort_order = data.courses.length + 1;
      data.courses.push(courseRecord);
    } else {
      data.courses[existingIndex] = courseRecord;
    }

    renumberCourses(data);
    await saveHubDataAndRenderedPage(data);
    return courseRecord;
  }

  async function addCourseToHubData(formCourseData) {
    return saveCourseToHubData(null, formCourseData);
  }

  async function deleteCourseFromHubData(courseId) {
    const data = normalizeHubData(await loadHubData());
    data.courses = data.courses.filter(item => item.id !== courseId);
    renumberCourses(data);
    await saveHubDataAndRenderedPage(data);
    return data.courses;
  }

  function normalizeResourceIcon(icon) {
    return RESOURCE_ICON_BY_KEY[icon] || extractFirstEmoji(icon) || RESOURCE_DEFAULT_ICON;
  }

  function buildResourceRecord(formResourceData, existingResource) {
    const now = new Date().toISOString();
    const actionType = normalizeResourceActionType(formResourceData.action_type, formResourceData.action_label);
    const actionLabel = actionType === "download" ? "Download" : "View Resource";

    return Object.assign({}, existingResource || {}, {
      id: existingResource?.id || createId("resource"),
      icon: normalizeResourceIcon(formResourceData.icon || existingResource?.icon || existingResource?.icon_key),
      title: limitText(formResourceData.title, RESOURCE_TITLE_MAX_LENGTH),
      description: limitText(formResourceData.description, RESOURCE_DESCRIPTION_MAX_LENGTH),
      action_type: actionType,
      action_label: actionLabel,
      resource_url: actionType === "canvas_page" ? "" : (formResourceData.resource_url || ""),
      sort_order: existingResource?.sort_order || 999,
      created_at: existingResource?.created_at || now,
      updated_at: now
    });
  }

  function renumberResources(data) {
    data.resources = sortBySortOrder(data.resources || []);
    data.resources.forEach((resourceRecord, index) => {
      resourceRecord.sort_order = index + 1;
    });
    return data;
  }

  async function saveResourceToHubData(resourceId, formResourceData) {
    const data = normalizeHubData(await loadHubData());
    const existingIndex = data.resources.findIndex(item => item.id === resourceId);
    const existingResource = existingIndex >= 0 ? data.resources[existingIndex] : null;
    const resourceRecord = buildResourceRecord(formResourceData, existingResource);

    if (resourceRecord.action_type === "canvas_page") {
      const page = getResourcePageSlug(resourceRecord)
        ? await updateCanvasResourcePage(resourceRecord)
        : await createCanvasResourcePage(resourceRecord);
      resourceRecord.page_id = page.page_id || page.id || resourceRecord.page_id || "";
      resourceRecord.page_slug = page.url || resourceRecord.page_slug || "";
      resourceRecord.page_url = page.html_url || (page.url ? getCoursePath() + "/pages/" + page.url : resourceRecord.page_url || "");
    }

    if (!existingResource) {
      resourceRecord.sort_order = data.resources.length + 1;
      data.resources.push(resourceRecord);
    } else {
      data.resources[existingIndex] = resourceRecord;
    }

    renumberResources(data);
    await saveHubDataAndRenderedPage(data);
    return resourceRecord;
  }

  async function addResourceToHubData(formResourceData) {
    return saveResourceToHubData(null, formResourceData);
  }

  async function deleteResourceFromHubData(resourceId) {
    const data = normalizeHubData(await loadHubData());
    data.resources = data.resources.filter(item => item.id !== resourceId);
    renumberResources(data);
    await saveHubDataAndRenderedPage(data);
    return data.resources;
  }

  function hideHeaderBar() {
    document.querySelectorAll(HEADER_BAR_SELECTOR).forEach(header => {
      header.setAttribute(HIDDEN_HEADER_ATTRIBUTE, "true");
      header.setAttribute(PREVIOUS_DISPLAY_ATTRIBUTE, header.style.display || "");
      header.style.display = "none";
    });
  }

  function restoreHeaderBar() {
    document.querySelectorAll(HEADER_BAR_SELECTOR + "[" + HIDDEN_HEADER_ATTRIBUTE + "='true']").forEach(header => {
      header.style.display = header.getAttribute(PREVIOUS_DISPLAY_ATTRIBUTE) || "";
      header.removeAttribute(HIDDEN_HEADER_ATTRIBUTE);
      header.removeAttribute(PREVIOUS_DISPLAY_ATTRIBUTE);
    });
  }

  function hideCourseTabs() {
    document.querySelectorAll("#section-tabs li").forEach(li => {
      if (li.hasAttribute(EDIT_TAB_ATTRIBUTE) || li.id === TOGGLE_BUTTON_ID) return;

      const link = li.querySelector("a");
      if (!link) return;

      const text = link.textContent.trim();

      if (!KEEP_TABS.includes(text)) {
        li.setAttribute(HIDDEN_TAB_ATTRIBUTE, "true");
        li.setAttribute(PREVIOUS_DISPLAY_ATTRIBUTE, li.style.display || "");
        li.style.display = "none";
      }
    });
  }

  function restoreCourseTabs() {
    document.querySelectorAll("#section-tabs li[" + HIDDEN_TAB_ATTRIBUTE + "='true']").forEach(hiddenLi => {
      hiddenLi.style.display = hiddenLi.getAttribute(PREVIOUS_DISPLAY_ATTRIBUTE) || "";
      hiddenLi.removeAttribute(HIDDEN_TAB_ATTRIBUTE);
      hiddenLi.removeAttribute(PREVIOUS_DISPLAY_ATTRIBUTE);
    });
  }

  function removeEditTabs() {
    document.querySelectorAll("#section-tabs li[" + EDIT_TAB_ATTRIBUTE + "]").forEach(li => {
      li.remove();
    });
  }

  function addEditTabs(nav) {
    EDIT_TABS.forEach(tabData => {
      if (document.getElementById(tabData.id)) return;

      const li = document.createElement("li");
      li.id = tabData.id;
      li.className = "section";
      li.setAttribute(EDIT_TAB_ATTRIBUTE, tabData.editor);

      li.innerHTML = `
        <a href="#" class="settings">
          <i class="icon-edit" aria-hidden="true"></i>
          <span class="name">${tabData.label}</span>
        </a>
      `;

      li.querySelector("a").addEventListener("click", event => {
        event.preventDefault();
        if (tabData.editor === "events") {
          openEventsEditor();
          return;
        }
        if (tabData.editor === "courses") {
          openCoursesEditor();
          return;
        }
        if (tabData.editor === "resources") {
          openResourcesEditor();
          return;
        }
        console.log("AI Hub editor tab selected:", tabData.editor);
      });

      nav.appendChild(li);
    });
  }

  function closeEditorPopup() {
    const backdrop = document.getElementById(POPUP_BACKDROP_ID);
    if (!backdrop) return;

    const panel = document.getElementById(POPUP_PANEL_ID);
    backdrop.style.opacity = "0";
    backdrop.style.background = "rgba(0,0,0,0)";
    if (panel) {
      panel.style.opacity = "0";
      panel.style.transform = "translateY(18px) scale(0.98)";
    }

    window.setTimeout(() => {
      backdrop.remove();
    }, 180);
  }

  function openEventsEditor() {
    closeEditorPopup();

    const backdrop = document.createElement("div");
    backdrop.id = POPUP_BACKDROP_ID;
    backdrop.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:999999",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:24px",
      "background:rgba(0,0,0,0)",
      "opacity:0",
      "transition:opacity 180ms ease, background 180ms ease"
    ].join(";");

    backdrop.innerHTML = `
      <div
        id="${POPUP_PANEL_ID}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-hub-events-title"
        style="
          width: min(1160px, 100%);
          max-height: min(860px, calc(100vh - 48px));
          overflow: auto;
          background: #fbfbfc;
          color: #111827;
          border: 1px solid #e6e8ec;
          border-radius: 18px;
          box-shadow: 0 28px 80px rgba(0,0,0,0.24);
          font-family: 'Inter','Segoe UI',Roboto,Arial,sans-serif;
          opacity: 0;
          transform: translateY(18px) scale(0.98);
          transition: opacity 180ms ease, transform 180ms ease;
        "
      >
        <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 24px; border-bottom:1px solid #eceff3; background:#ffffff;">
          <div>
            <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#1d4ed8; margin-bottom:4px;">AI Hub</div>
            <h2 id="ai-hub-events-title" style="margin:0; font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:26px; line-height:1.12; color:#000000;">Edit Calendar</h2>
            <div style="font-size:12px; color:#6b7280; margin-top:5px;">Loaded from /courses/${getCourseId()}/pages/${DATA_PAGE_URL}</div>
          </div>
          <button type="button" data-action="close-popup" aria-label="Close" style="width:38px; height:38px; border:1px solid #d8dde5; border-radius:50%; background:#ffffff; cursor:pointer; font-size:21px; line-height:1; color:#111827;">&times;</button>
        </div>

        <div style="padding:24px;">
          <div style="display:grid; grid-template-columns:minmax(360px, 1.6fr) minmax(300px, 0.9fr); gap:22px; align-items:start;">
            <section style="border:1px solid #eceff3; border-radius:18px; background:#ffffff; padding:22px; box-shadow:0 16px 36px rgba(15,23,42,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px;">
                <div>
                  <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#1d4ed8; margin-bottom:5px;">Event date</div>
                  <h3 data-calendar-title style="margin:0; font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:24px; line-height:1.12; color:#000000;"></h3>
                  <div data-selected-date-output style="font-size:12px; color:#6b7280; margin-top:8px;">No date selected</div>
                </div>
                <div style="display:flex; gap:8px;">
                  <button type="button" data-action="previous-month" aria-label="Previous month" style="width:36px; height:36px; border:1px solid #d8dde5; background:#ffffff; border-radius:50%; cursor:pointer; color:#111827; font-size:16px; line-height:1;">&lt;</button>
                  <button type="button" data-action="next-month" aria-label="Next month" style="width:36px; height:36px; border:1px solid #d8dde5; background:#ffffff; border-radius:50%; cursor:pointer; color:#111827; font-size:16px; line-height:1;">&gt;</button>
                </div>
              </div>
              <div data-calendar-grid style="display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); gap:8px; max-width:620px; margin:0 auto;"></div>
            </section>

            <section style="border:1px solid #eceff3; border-radius:18px; background:#ffffff; padding:22px; box-shadow:0 16px 36px rgba(15,23,42,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:18px;">
                <div>
                  <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#1d4ed8; margin-bottom:5px;">Event details</div>
                  <h3 data-ai-hub-event-form-title style="margin:0; font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:22px; line-height:1.12; color:#000000;">Add Event</h3>
                </div>
                <button type="button" data-action="clear-event-form" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:8px 12px; cursor:pointer; font-size:13px;">New</button>
              </div>

              <form data-ai-hub-events-form>
                <input name="id" type="hidden" />
                <div style="display:grid; grid-template-columns:1fr; gap:14px;">
                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Title</span>
                      <span data-title-count style="font-size:11px; color:#6b7280;">0 / ${EVENT_TITLE_MAX_LENGTH}</span>
                    </span>
                    <input name="title" type="text" maxlength="${EVENT_TITLE_MAX_LENGTH}" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                  </label>

                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                      Date
                      <input name="event_date" type="date" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:11px 12px; font-size:14px; background:#fbfbfc; color:#111827;" />
                    </label>

                    <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                      Time
                      <input name="start_time" type="time" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:11px 12px; font-size:14px; background:#fbfbfc; color:#111827;" />
                    </label>
                  </div>

                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                      Location Type
                      <select name="location_type" style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;">
                        <option value="online">Online</option>
                        <option value="room">Room</option>
                      </select>
                    </label>

                    <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                      Status
                      <select name="status" style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;">
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                      </select>
                    </label>
                  </div>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Location
                    <input name="location_label" type="text" placeholder="Online (Zoom) or Room 101" style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Booking Link
                    <input name="booking_url" type="text" placeholder="https://..." style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                  </label>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px; padding-top:18px; margin-top:18px; border-top:1px solid #eceff3;">
                  <button type="button" data-action="close-popup" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:10px 16px; cursor:pointer; font-size:14px;">Close</button>
                  <button type="submit" style="border:1px solid #1d4ed8; background:#1d4ed8; color:#ffffff; border-radius:999px; padding:10px 18px; cursor:pointer; font-size:14px;">Save Event</button>
                </div>
              </form>
            </section>
          </div>

          <section style="margin-top:18px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px;">
              <div>
                <h3 style="margin:0; font-size:16px; color:#111827;">Event Cards</h3>
                <div data-ai-hub-events-help style="font-size:12px; color:#6b7280; margin-top:3px;">Active cards save in date and time order.</div>
              </div>
              <button type="button" data-action="refresh-events" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:7px 10px; cursor:pointer;">Refresh</button>
            </div>
            <div data-ai-hub-events-tabs style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
              <button type="button" data-action="set-events-list-view" data-view="active" style="border:1px solid #111827; background:#111827; color:#ffffff; border-radius:6px; padding:7px 11px; cursor:pointer;">Active</button>
              <button type="button" data-action="set-events-list-view" data-view="archive" style="border:1px solid #cbd5e1; background:#ffffff; color:#111827; border-radius:6px; padding:7px 11px; cursor:pointer;">Archive</button>
            </div>
            <div data-ai-hub-events-list style="display:grid; grid-template-columns:repeat(auto-fill, 240px); gap:16px; justify-content:start;">
              <div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading events...</div>
            </div>
          </section>

          <div data-ai-hub-event-output style="display:none; margin-top:14px; border:1px solid #d1d5db; border-radius:6px; background:#f9fafb; padding:10px; font-size:13px; white-space:pre-wrap;"></div>
        </div>
      </div>
    `;

    const form = backdrop.querySelector("[data-ai-hub-events-form]");
    const list = backdrop.querySelector("[data-ai-hub-events-list]");
    const calendarTitle = backdrop.querySelector("[data-calendar-title]");
    const calendarGrid = backdrop.querySelector("[data-calendar-grid]");
    const output = backdrop.querySelector("[data-ai-hub-event-output]");
    const formTitle = backdrop.querySelector("[data-ai-hub-event-form-title]");
    const eventTabs = backdrop.querySelector("[data-ai-hub-events-tabs]");
    const eventHelp = backdrop.querySelector("[data-ai-hub-events-help]");
    const selectedDateOutput = backdrop.querySelector("[data-selected-date-output]");
    const titleCount = backdrop.querySelector("[data-title-count]");
    let calendarDate = new Date();
    let eventListView = "active";
    let calendarHasAutoFocused = false;

    function setMessage(message, isError) {
      output.style.display = "block";
      output.style.borderColor = isError ? "#fca5a5" : "#d1d5db";
      output.style.background = isError ? "#fef2f2" : "#f9fafb";
      output.textContent = message;
    }

    function updateTitleCount() {
      const length = form.elements.title.value.length;
      titleCount.textContent = `${length} / ${EVENT_TITLE_MAX_LENGTH}`;
      titleCount.style.color = length >= EVENT_TITLE_MAX_LENGTH ? "#1d4ed8" : "#6b7280";
    }

    function clearForm() {
      form.reset();
      form.elements.id.value = "";
      formTitle.textContent = "Add Event";
      output.style.display = "none";
      updateTitleCount();
    }

    function fillForm(eventRecord) {
      form.elements.id.value = eventRecord.id || "";
      form.elements.title.value = limitText(eventRecord.title, EVENT_TITLE_MAX_LENGTH);
      form.elements.event_date.value = eventRecord.event_date || "";
      form.elements.start_time.value = eventRecord.start_time || "";
      form.elements.location_type.value = eventRecord.location_type || "online";
      form.elements.status.value = eventRecord.status || "active";
      form.elements.location_label.value = eventRecord.location_label || "";
      form.elements.booking_url.value = eventRecord.booking_url || "";
      formTitle.textContent = "Edit Event";
      output.style.display = "none";
      updateTitleCount();
      if (eventRecord.event_date) {
        calendarDate = parseDateInput(eventRecord.event_date) || calendarDate;
      }
    }

    function parseDateInput(value) {
      const parts = String(value || "").split("-").map(Number);
      if (parts.length !== 3 || parts.some(part => !part)) return null;
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function toDateInputValue(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    function getMonthLabel(date) {
      return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    }

    function getFullDateLabel(value) {
      const parsed = parseDateInput(value);
      return parsed
        ? parsed.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
        : "No date selected";
    }

    function getActiveEvents(events) {
      return events.filter(eventRecord => eventRecord.event_date && eventRecord.status !== "archived");
    }

    function findFirstActiveEventDate(events) {
      const firstEvent = sortEventsByDate(getActiveEvents(events))[0];
      return firstEvent ? parseDateInput(firstEvent.event_date) : null;
    }

    function getShortMonth(value) {
      const parsed = parseDateInput(value);
      if (!parsed) return "";
      return parsed.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
    }

    function getDayNumber(value) {
      const parsed = parseDateInput(value);
      return parsed ? String(parsed.getDate()).padStart(2, "0") : "";
    }

    function getEventDateLine(eventRecord) {
      const parsed = parseDateInput(eventRecord.event_date);
      const dateLabel = parsed
        ? parsed.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
        : "Date TBD";
      const timeLabel = formatTime(eventRecord.start_time);
      return timeLabel ? `${dateLabel} &middot; ${timeLabel}` : dateLabel;
    }

    function formatTime(value) {
      const parts = String(value || "").split(":").map(Number);
      if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return "";
      const suffix = parts[0] >= 12 ? "PM" : "AM";
      const hour = parts[0] % 12 || 12;
      const minute = String(parts[1]).padStart(2, "0");
      return `${hour}:${minute} ${suffix}`;
    }

    function renderCalendar(events) {
      const selectedDate = form.elements.event_date.value;
      const selectedDateObject = parseDateInput(selectedDate);

      if (selectedDateObject && !calendarHasAutoFocused) {
        calendarDate = selectedDateObject;
        calendarHasAutoFocused = true;
      } else if (!calendarHasAutoFocused) {
        calendarDate = findFirstActiveEventDate(events) || calendarDate;
        calendarHasAutoFocused = true;
      }

      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth();
      const eventCountByDate = {};

      events.forEach(eventRecord => {
        if (!eventRecord.event_date || eventRecord.status === "archived") return;
        eventCountByDate[eventRecord.event_date] = (eventCountByDate[eventRecord.event_date] || 0) + 1;
      });

      calendarTitle.textContent = getMonthLabel(calendarDate);
      selectedDateOutput.textContent = getFullDateLabel(selectedDate);
      const firstOfMonth = new Date(year, month, 1);
      const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
      const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const cells = weekdayLabels.map(label => `
        <div style="font-size:11px; color:#8a94a6; text-align:center; font-weight:bold; padding:6px 0; text-transform:uppercase;">${label}</div>
      `);
      const todayValue = toDateInputValue(new Date());

      for (let index = 0; index < 42; index++) {
        const cellDate = new Date(gridStart);
        cellDate.setDate(gridStart.getDate() + index);
        const dateValue = toDateInputValue(cellDate);
        const inMonth = cellDate.getMonth() === month;
        const isSelected = dateValue === selectedDate;
        const isToday = dateValue === todayValue;
        const eventCount = eventCountByDate[dateValue] || 0;
        const hasEvents = eventCount > 0;
        const eventLabel = hasEvents ? "Has active events" : "No active events";
        const calendarLabel = `${getFullDateLabel(dateValue)}, ${eventLabel}`;

        cells.push(`
          <button
            type="button"
            data-action="select-calendar-date"
            data-date="${dateValue}"
            aria-label="${escapeAttribute(calendarLabel)}"
            title="${escapeAttribute(calendarLabel)}"
            style="
              min-height: 58px;
              border: 0;
              border-radius: 14px;
              background: transparent;
              color: ${inMonth ? "#111827" : "#c2c8d2"};
              cursor: pointer;
              padding: 4px 3px;
              text-align: center;
            "
          >
            <span style="
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: ${isSelected || isToday ? "bold" : "normal"};
              color: ${isSelected ? "#ffffff" : (inMonth ? "#111827" : "#c2c8d2")};
              background: ${isSelected ? "#1d4ed8" : "#ffffff"};
              border: 1px solid ${isSelected ? "#1d4ed8" : (isToday ? "#1d4ed8" : "transparent")};
              box-shadow: ${isSelected ? "0 10px 22px rgba(178,11,15,0.24)" : "none"};
            ">${cellDate.getDate()}</span>
            ${hasEvents ? `<span aria-hidden="true" style="display:block; width:6px; height:6px; border-radius:50%; background:#1d4ed8; margin:5px auto 0;"></span>` : `<span aria-hidden="true" style="display:block; width:6px; height:6px; margin:5px auto 0;"></span>`}
          </button>
        `);
      }

      calendarGrid.innerHTML = cells.join("");
    }

    function updateEventTabs(events) {
      const activeCount = events.filter(eventRecord => eventRecord.status !== "archived").length;
      const archiveCount = events.filter(eventRecord => eventRecord.status === "archived").length;

      eventTabs.querySelectorAll("[data-view]").forEach(button => {
        const view = button.getAttribute("data-view");
        const selected = view === eventListView;
        button.textContent = view === "archive" ? `Archive (${archiveCount})` : `Active (${activeCount})`;
        button.style.borderColor = selected ? "#111827" : "#cbd5e1";
        button.style.background = selected ? "#111827" : "#ffffff";
        button.style.color = selected ? "#ffffff" : "#111827";
      });

      eventHelp.textContent = eventListView === "archive"
        ? "Archived cards are hidden from the hub page. You can edit, unarchive, or delete them here."
        : "Active cards save in date and time order.";
    }

    function renderEventList(events) {
      const sortedEvents = sortEventsByDate(events);
      const visibleEvents = sortedEvents.filter(eventRecord => {
        return eventListView === "archive"
          ? eventRecord.status === "archived"
          : eventRecord.status !== "archived";
      });

      updateEventTabs(sortedEvents);

      if (!visibleEvents.length) {
        const emptyMessage = eventListView === "archive" ? "No archived events yet." : "No active events yet.";
        list.innerHTML = `<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">${emptyMessage}</div>`;
        return;
      }

      list.innerHTML = visibleEvents.map(eventRecord => {
        const isArchived = eventRecord.status === "archived";
        const statusLabel = isArchived ? "Archived" : "Active";
        const toggleLabel = isArchived ? "Unarchive" : "Archive";
        const monthLabel = getShortMonth(eventRecord.event_date) || "TBD";
        const dayLabel = getDayNumber(eventRecord.event_date) || "--";
        const canDrag = false;

        return `
          <div data-event-card data-event-id="${escapeAttribute(eventRecord.id)}" draggable="${canDrag ? "true" : "false"}" style="cursor:${canDrag ? "grab" : "default"};">
            <div style="background:#ffffff; border-radius:14px; padding:18px; display:flex; flex-direction:column; border:1px solid #e6e8ec; min-height:220px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                <div style="display:inline-block; align-self:flex-start; border-radius:8px; padding:6px 12px; text-align:center; line-height:1.1; margin-bottom:14px; border:1px solid #e6e8ec;">
                  <div style="font-size:11px; color:#1d4ed8;">${escapeHtml(monthLabel)}</div>
                  <div style="font-size:22px; color:#000000;">${escapeHtml(dayLabel)}</div>
                </div>
                <span style="font-size:11px; border:1px solid ${isArchived ? "#d1d5db" : "#bbf7d0"}; background:${isArchived ? "#f3f4f6" : "#f0fdf4"}; color:${isArchived ? "#374151" : "#166534"}; border-radius:999px; padding:3px 7px;">${statusLabel}</span>
              </div>
              <h3 style="margin:0 0 12px; font-size:16px; color:#000000; line-height:1.25;">${escapeHtml(eventRecord.title || "Untitled Event")}</h3>
              <div style="font-size:13px; color:#6b7280; margin-bottom:4px;">Time: ${getEventDateLine(eventRecord)}</div>
              <div style="font-size:13px; color:#6b7280; margin-bottom:18px;">Location: ${escapeHtml(eventRecord.location_label || "No location")}</div>
              <a style="margin-top:auto; display:block; text-align:center; background:#000000; color:#ffffff; text-decoration:none; font-size:14px; padding:10px; border-radius:8px; border:1.5px solid #000000;" href="${escapeAttribute(eventRecord.booking_url || "#")}" target="_blank" rel="noopener">Register</a>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
              <button type="button" data-action="edit-event" data-event-id="${escapeAttribute(eventRecord.id)}" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:5px 8px; cursor:pointer;">Edit</button>
              <button type="button" data-action="toggle-event-status" data-event-id="${escapeAttribute(eventRecord.id)}" data-next-status="${isArchived ? "active" : "archived"}" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:5px 8px; cursor:pointer;">${toggleLabel}</button>
              <button type="button" data-action="delete-event" data-event-id="${escapeAttribute(eventRecord.id)}" style="border:1px solid #fecaca; background:#fff1f2; color:#991b1b; border-radius:6px; padding:5px 8px; cursor:pointer;">Delete</button>
            </div>
          </div>
        `;
      }).join("");
    }

    async function refreshEvents() {
      list.innerHTML = `<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading events...</div>`;
      const data = normalizeHubData(await loadHubData());
      renderEventList(data.events);
      renderCalendar(data.events);
      return data.events;
    }

    backdrop.addEventListener("click", async event => {
      const actionButton = event.target.closest("[data-action]");
      const action = actionButton?.getAttribute("data-action");

      if (event.target === backdrop || action === "close-popup") {
        closeEditorPopup();
        return;
      }

      if (!action) return;

      try {
        if (action === "set-events-list-view") {
          eventListView = actionButton.getAttribute("data-view") === "archive" ? "archive" : "active";
          await refreshEvents();
        }

        if (action === "clear-event-form") {
          clearForm();
          renderCalendar(normalizeHubData(await loadHubData()).events);
        }

        if (action === "previous-month" || action === "next-month") {
          calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + (action === "next-month" ? 1 : -1), 1);
          renderCalendar(normalizeHubData(await loadHubData()).events);
        }

        if (action === "select-calendar-date") {
          form.elements.event_date.value = actionButton.getAttribute("data-date");
          calendarDate = parseDateInput(form.elements.event_date.value) || calendarDate;
          renderCalendar(normalizeHubData(await loadHubData()).events);
        }

        if (action === "refresh-events") {
          await refreshEvents();
          setMessage("Events refreshed.", false);
        }

        if (action === "edit-event") {
          const data = normalizeHubData(await loadHubData());
          const eventRecord = data.events.find(item => item.id === actionButton.getAttribute("data-event-id"));
          if (eventRecord) {
            fillForm(eventRecord);
            renderCalendar(data.events);
          }
        }

        if (action === "delete-event") {
          const ok = window.confirm("Delete this event?");
          if (!ok) return;
          await deleteEventFromHubData(actionButton.getAttribute("data-event-id"));
          clearForm();
          await refreshEvents();
          setMessage("Event deleted.", false);
        }

        if (action === "toggle-event-status") {
          await setEventStatusInHubData(actionButton.getAttribute("data-event-id"), actionButton.getAttribute("data-next-status"));
          await refreshEvents();
          setMessage("Event status updated.", false);
        }

      } catch (error) {
        console.error(error);
        setMessage("Action failed:\n" + error.message, true);
      }
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const submitButton = form.querySelector("button[type='submit']");
      const formData = new FormData(form);
      const eventData = Object.fromEntries(formData.entries());

      try {
        submitButton.disabled = true;
        submitButton.textContent = "Saving...";
        const savedEvent = await saveEventToHubData(eventData.id || null, eventData);
        console.log("AI Hub event saved to JSON page and visible hub page:", savedEvent);
        clearForm();
        await refreshEvents();
        setMessage("Event saved to JSON and hub page.", false);
      } catch (error) {
        console.error(error);
        setMessage("Save failed:\n" + error.message, true);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Save Event";
      }
    });

    form.elements.event_date.addEventListener("change", async () => {
      calendarDate = parseDateInput(form.elements.event_date.value) || calendarDate;

      try {
        renderCalendar(normalizeHubData(await loadHubData()).events);
      } catch (error) {
        console.error(error);
        setMessage("Calendar refresh failed:\n" + error.message, true);
      }
    });

    form.elements.title.addEventListener("input", updateTitleCount);
    updateTitleCount();

    list.addEventListener("dragstart", event => {
      if (eventListView !== "active") return;
      const card = event.target.closest("[data-event-card]");
      if (!card) return;
      card.style.opacity = "0.45";
      card.setAttribute("data-dragging", "true");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", card.getAttribute("data-event-id"));
    });

    list.addEventListener("dragend", event => {
      const card = event.target.closest("[data-event-card]");
      if (!card) return;
      card.style.opacity = "";
      card.removeAttribute("data-dragging");
    });

    list.addEventListener("dragover", event => {
      if (eventListView !== "active") return;
      const dragging = list.querySelector("[data-dragging='true']");
      const target = event.target.closest("[data-event-card]");
      if (!dragging || !target || dragging === target) return;

      event.preventDefault();
      const targetRect = target.getBoundingClientRect();
      const shouldInsertAfter = event.clientY > targetRect.top + targetRect.height / 2;
      list.insertBefore(dragging, shouldInsertAfter ? target.nextSibling : target);
    });

    list.addEventListener("drop", async event => {
      if (eventListView !== "active") return;
      event.preventDefault();
      const orderedIds = Array.from(list.querySelectorAll("[data-event-card]"))
        .map(card => card.getAttribute("data-event-id"))
        .filter(Boolean);

      try {
        await reorderEventsInHubData(orderedIds);
        await refreshEvents();
        setMessage("Event order saved.", false);
      } catch (error) {
        console.error(error);
        setMessage("Reorder failed:\n" + error.message, true);
      }
    });

    document.body.appendChild(backdrop);
    refreshEvents().catch(error => {
      console.error(error);
      setMessage("Could not load events:\n" + error.message, true);
    });

    window.requestAnimationFrame(() => {
      const panel = document.getElementById(POPUP_PANEL_ID);
      backdrop.style.opacity = "1";
      backdrop.style.background = "rgba(0,0,0,0.38)";
      if (panel) {
        panel.style.opacity = "1";
        panel.style.transform = "translateY(0) scale(1)";
      }
    });
  }

  function openCoursesEditor() {
    closeEditorPopup();

    const backdrop = document.createElement("div");
    backdrop.id = POPUP_BACKDROP_ID;
    backdrop.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:999999",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:24px",
      "background:rgba(0,0,0,0)",
      "opacity:0",
      "transition:opacity 180ms ease, background 180ms ease"
    ].join(";");

    backdrop.innerHTML = `
      <div
        id="${POPUP_PANEL_ID}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-hub-courses-title"
        style="
          width: min(1160px, 100%);
          max-height: min(860px, calc(100vh - 48px));
          overflow: auto;
          background: #fbfbfc;
          color: #111827;
          border: 1px solid #e6e8ec;
          border-radius: 18px;
          box-shadow: 0 28px 80px rgba(0,0,0,0.24);
          font-family: 'Inter','Segoe UI',Roboto,Arial,sans-serif;
          opacity: 0;
          transform: translateY(18px) scale(0.98);
          transition: opacity 180ms ease, transform 180ms ease;
        "
      >
        <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 24px; border-bottom:1px solid #eceff3; background:#ffffff;">
          <div>
            <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#1d4ed8; margin-bottom:4px;">AI Hub</div>
            <h2 id="ai-hub-courses-title" style="margin:0; font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:26px; line-height:1.12; color:#000000;">Edit Courses</h2>
            <div style="font-size:12px; color:#6b7280; margin-top:5px;">Loaded from /courses/${getCourseId()}/pages/${DATA_PAGE_URL}</div>
          </div>
          <button type="button" data-action="close-popup" aria-label="Close" style="width:38px; height:38px; border:1px solid #d8dde5; border-radius:50%; background:#ffffff; cursor:pointer; font-size:21px; line-height:1; color:#111827;">&times;</button>
        </div>

        <div style="padding:24px;">
          <div style="display:grid; grid-template-columns:minmax(320px, 380px) minmax(0, 1fr); gap:28px; align-items:start;">
            <section style="border:1px solid #eceff3; border-radius:18px; background:#ffffff; padding:22px 26px 22px 22px; box-shadow:0 16px 36px rgba(15,23,42,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:18px;">
                <div>
                  <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#1d4ed8; margin-bottom:5px;">Course details</div>
                  <h3 data-ai-hub-course-form-title style="margin:0; font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:22px; line-height:1.12; color:#000000;">Add Course</h3>
                </div>
                <button type="button" data-action="clear-course-form" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:8px 12px; cursor:pointer; font-size:13px;">New</button>
              </div>

              <form data-ai-hub-courses-form>
                <input name="id" type="hidden" />

                <div style="display:grid; grid-template-columns:1fr; gap:14px;">
                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Icon
                    <span style="display:flex; align-items:center; gap:10px;">
                      <input name="icon" type="text" maxlength="16" value="${escapeAttribute(COURSE_DEFAULT_ICON)}" title="Windows: Win + ; or Win + . | Mac: Control + Command + Space" aria-label="Course icon emoji" style="box-sizing:border-box; width:86px; border:1px solid #d8dde5; border-radius:12px; padding:10px 12px; font-size:22px; line-height:1; background:#fbfbfc; color:#111827; text-align:center;" />
                      <span style="font-size:11px; color:#6b7280; line-height:1.7;">
                        Windows: <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Win + ;</span> or <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Win + .</span><br />
                        Mac: <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Control + Command + Space</span>
                      </span>
                    </span>
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Title</span>
                      <span data-course-title-count style="font-size:11px; color:#6b7280;">0 / ${COURSE_TITLE_MAX_LENGTH}</span>
                    </span>
                    <input name="title" type="text" maxlength="${COURSE_TITLE_MAX_LENGTH}" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Description</span>
                      <span data-course-description-count style="font-size:11px; color:#6b7280;">0 / ${COURSE_DESCRIPTION_MAX_LENGTH}</span>
                    </span>
                    <textarea name="description" maxlength="${COURSE_DESCRIPTION_MAX_LENGTH}" rows="3" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827; resize:vertical;"></textarea>
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Format
                    <select name="format" style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;">
                      <option value="self_paced">Self-Paced</option>
                      <option value="in_person">In Person</option>
                    </select>
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Course Link
                    <input name="course_url" type="text" placeholder="https://..." required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                  </label>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px; padding-top:18px; margin-top:18px; border-top:1px solid #eceff3;">
                  <button type="button" data-action="close-popup" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:10px 16px; cursor:pointer; font-size:14px;">Close</button>
                  <button type="submit" style="border:1px solid #1d4ed8; background:#1d4ed8; color:#ffffff; border-radius:999px; padding:10px 18px; cursor:pointer; font-size:14px;">Save Course</button>
                </div>
              </form>
            </section>

            <section>
              <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px;">
                <div>
                  <h3 style="margin:0; font-size:16px; color:#111827;">Course Cards</h3>
                  <div style="font-size:12px; color:#6b7280; margin-top:3px;">Cards save to JSON and refresh the hub page.</div>
                </div>
                <button type="button" data-action="refresh-courses" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:7px 10px; cursor:pointer;">Refresh</button>
              </div>

              <div data-ai-hub-courses-list style="display:grid; grid-template-columns:repeat(auto-fill, 220px); gap:16px; justify-content:start; max-width:692px;">
                <div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading courses...</div>
              </div>
            </section>
          </div>

          <div data-ai-hub-course-output style="display:none; margin-top:14px; border:1px solid #d1d5db; border-radius:6px; background:#f9fafb; padding:10px; font-size:13px; white-space:pre-wrap;"></div>
        </div>
      </div>
    `;

    const form = backdrop.querySelector("[data-ai-hub-courses-form]");
    const list = backdrop.querySelector("[data-ai-hub-courses-list]");
    const output = backdrop.querySelector("[data-ai-hub-course-output]");
    const formTitle = backdrop.querySelector("[data-ai-hub-course-form-title]");
    const titleCount = backdrop.querySelector("[data-course-title-count]");
    const descriptionCount = backdrop.querySelector("[data-course-description-count]");

    function setMessage(message, isError) {
      output.style.display = "block";
      output.style.borderColor = isError ? "#fca5a5" : "#d1d5db";
      output.style.background = isError ? "#fef2f2" : "#f9fafb";
      output.textContent = message;
    }

    function updateTextCounts() {
      const titleLength = form.elements.title.value.length;
      const descriptionLength = form.elements.description.value.length;
      titleCount.textContent = `${titleLength} / ${COURSE_TITLE_MAX_LENGTH}`;
      descriptionCount.textContent = `${descriptionLength} / ${COURSE_DESCRIPTION_MAX_LENGTH}`;
      titleCount.style.color = titleLength >= COURSE_TITLE_MAX_LENGTH ? "#1d4ed8" : "#6b7280";
      descriptionCount.style.color = descriptionLength >= COURSE_DESCRIPTION_MAX_LENGTH ? "#1d4ed8" : "#6b7280";
    }

    function sanitizeIconInput(useDefault) {
      const emoji = extractFirstEmoji(form.elements.icon.value);
      form.elements.icon.value = emoji || (useDefault ? COURSE_DEFAULT_ICON : "");
    }

    function clearForm() {
      form.reset();
      form.elements.id.value = "";
      formTitle.textContent = "Add Course";
      output.style.display = "none";
      form.elements.icon.value = COURSE_DEFAULT_ICON;
      updateTextCounts();
    }

    function fillForm(courseRecord) {
      form.elements.id.value = courseRecord.id || "";
      form.elements.title.value = limitText(courseRecord.title, COURSE_TITLE_MAX_LENGTH);
      form.elements.description.value = limitText(courseRecord.description, COURSE_DESCRIPTION_MAX_LENGTH);
      form.elements.format.value = courseRecord.format === "in_person" ? "in_person" : "self_paced";
      form.elements.course_url.value = courseRecord.course_url || "";
      form.elements.icon.value = getCourseIcon(courseRecord);
      formTitle.textContent = "Edit Course";
      output.style.display = "none";
      updateTextCounts();
    }

    function renderCourseEditorCard(courseRecord) {
      const icon = getCourseIcon(courseRecord);
      const title = courseRecord.title || "Untitled Course";
      const description = courseRecord.description || "";
      const formatLabel = getCourseFormatLabel(courseRecord.format);

      return `
        <div data-course-card data-course-id="${escapeAttribute(courseRecord.id)}">
          <div style="background:#ffffff; border-radius:14px; padding:18px; text-align:center; border:1px solid #e6e8ec; min-height:220px; display:flex; flex-direction:column;">
            <div style="width:52px; height:52px; border-radius:50%; background:#eeeeef; margin:0 auto 14px; display:flex; align-items:center; justify-content:center; font-size:23px;" aria-hidden="true">${escapeHtml(icon)}</div>
            <h3 style="margin:0 0 8px; font-size:16px; line-height:1.25; color:#000000;">${escapeHtml(title)}</h3>
            <div style="font-size:13px; color:#6b7280; margin-bottom:12px;">${escapeHtml(description)}</div>
            <div style="font-size:12px; color:#1d4ed8; margin-top:auto;">${escapeHtml(formatLabel)}</div>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
            <button type="button" data-action="edit-course" data-course-id="${escapeAttribute(courseRecord.id)}" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:5px 8px; cursor:pointer;">Edit</button>
            <button type="button" data-action="delete-course" data-course-id="${escapeAttribute(courseRecord.id)}" style="border:1px solid #fecaca; background:#fff1f2; color:#991b1b; border-radius:6px; padding:5px 8px; cursor:pointer;">Delete</button>
          </div>
        </div>
      `;
    }

    function renderCourseList(courses) {
      const sortedCourses = sortBySortOrder(courses);
      if (!sortedCourses.length) {
        list.innerHTML = `<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">No courses yet.</div>`;
        return;
      }

      list.innerHTML = sortedCourses.map(renderCourseEditorCard).join("");
    }

    async function refreshCourses() {
      list.innerHTML = `<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading courses...</div>`;
      const data = normalizeHubData(await loadHubData());
      renderCourseList(data.courses);
      return data.courses;
    }

    backdrop.addEventListener("click", async event => {
      const actionButton = event.target.closest("[data-action]");
      const action = actionButton?.getAttribute("data-action");

      if (event.target === backdrop || action === "close-popup") {
        closeEditorPopup();
        return;
      }

      if (!action) return;

      try {
        if (action === "clear-course-form") {
          clearForm();
        }

        if (action === "refresh-courses") {
          await refreshCourses();
          setMessage("Courses refreshed.", false);
        }

        if (action === "edit-course") {
          const data = normalizeHubData(await loadHubData());
          const courseRecord = data.courses.find(item => item.id === actionButton.getAttribute("data-course-id"));
          if (courseRecord) fillForm(courseRecord);
        }

        if (action === "delete-course") {
          const ok = window.confirm("Delete this course card?");
          if (!ok) return;
          await deleteCourseFromHubData(actionButton.getAttribute("data-course-id"));
          clearForm();
          await refreshCourses();
          setMessage("Course deleted.", false);
        }
      } catch (error) {
        console.error(error);
        setMessage("Action failed:\n" + error.message, true);
      }
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const submitButton = form.querySelector("button[type='submit']");
      const formData = new FormData(form);
      const courseData = Object.fromEntries(formData.entries());

      try {
        submitButton.disabled = true;
        submitButton.textContent = "Saving...";
        const savedCourse = await saveCourseToHubData(courseData.id || null, courseData);
        console.log("AI Hub course saved to JSON page and visible hub page:", savedCourse);
        clearForm();
        await refreshCourses();
        setMessage("Course saved to JSON and hub page.", false);
      } catch (error) {
        console.error(error);
        setMessage("Save failed:\n" + error.message, true);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Save Course";
      }
    });

    form.elements.title.addEventListener("input", updateTextCounts);
    form.elements.description.addEventListener("input", updateTextCounts);
    form.elements.icon.addEventListener("input", () => sanitizeIconInput(false));
    form.elements.icon.addEventListener("blur", () => sanitizeIconInput(true));
    form.elements.icon.addEventListener("focus", () => form.elements.icon.select());
    form.elements.icon.addEventListener("click", () => form.elements.icon.select());
    updateTextCounts();

    document.body.appendChild(backdrop);
    refreshCourses().catch(error => {
      console.error(error);
      setMessage("Could not load courses:\n" + error.message, true);
    });

    window.requestAnimationFrame(() => {
      const panel = document.getElementById(POPUP_PANEL_ID);
      backdrop.style.opacity = "1";
      backdrop.style.background = "rgba(0,0,0,0.38)";
      if (panel) {
        panel.style.opacity = "1";
        panel.style.transform = "translateY(0) scale(1)";
      }
    });
  }

  function openResourcesEditor() {
    closeEditorPopup();

    const backdrop = document.createElement("div");
    backdrop.id = POPUP_BACKDROP_ID;
    backdrop.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:999999",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:24px",
      "background:rgba(0,0,0,0)",
      "opacity:0",
      "transition:opacity 180ms ease, background 180ms ease"
    ].join(";");

    backdrop.innerHTML = `
      <div
        id="${POPUP_PANEL_ID}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-hub-resources-title"
        style="
          width: min(1160px, 100%);
          max-height: min(860px, calc(100vh - 48px));
          overflow: auto;
          background: #fbfbfc;
          color: #111827;
          border: 1px solid #e6e8ec;
          border-radius: 18px;
          box-shadow: 0 28px 80px rgba(0,0,0,0.24);
          font-family: 'Inter','Segoe UI',Roboto,Arial,sans-serif;
          opacity: 0;
          transform: translateY(18px) scale(0.98);
          transition: opacity 180ms ease, transform 180ms ease;
        "
      >
        <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 24px; border-bottom:1px solid #eceff3; background:#ffffff;">
          <div>
            <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#1d4ed8; margin-bottom:4px;">AI Hub</div>
            <h2 id="ai-hub-resources-title" style="margin:0; font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:26px; line-height:1.12; color:#000000;">Edit Resources</h2>
            <div style="font-size:12px; color:#6b7280; margin-top:5px;">Loaded from /courses/${getCourseId()}/pages/${DATA_PAGE_URL}</div>
          </div>
          <button type="button" data-action="close-popup" aria-label="Close" style="width:38px; height:38px; border:1px solid #d8dde5; border-radius:50%; background:#ffffff; cursor:pointer; font-size:21px; line-height:1; color:#111827;">&times;</button>
        </div>

        <div style="padding:24px;">
          <div style="display:grid; grid-template-columns:minmax(320px, 380px) minmax(0, 1fr); gap:28px; align-items:start;">
            <section style="border:1px solid #eceff3; border-radius:18px; background:#ffffff; padding:22px 26px 22px 22px; box-shadow:0 16px 36px rgba(15,23,42,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:18px;">
                <div>
                  <div style="font-size:11px; letter-spacing:0; text-transform:uppercase; color:#1d4ed8; margin-bottom:5px;">Resource details</div>
                  <h3 data-ai-hub-resource-form-title style="margin:0; font-family:'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-weight:700; font-size:22px; line-height:1.12; color:#000000;">Add Resource</h3>
                </div>
                <button type="button" data-action="clear-resource-form" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:8px 12px; cursor:pointer; font-size:13px;">New</button>
              </div>

              <form data-ai-hub-resources-form>
                <input name="id" type="hidden" />

                <div style="display:grid; grid-template-columns:1fr; gap:14px;">
                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Icon
                    <span style="display:flex; align-items:center; gap:10px;">
                      <input name="icon" type="text" maxlength="16" value="${escapeAttribute(RESOURCE_DEFAULT_ICON)}" title="Windows: Win + ; or Win + . | Mac: Control + Command + Space" aria-label="Resource icon emoji" style="box-sizing:border-box; width:86px; border:1px solid #d8dde5; border-radius:12px; padding:10px 12px; font-size:22px; line-height:1; background:#fbfbfc; color:#111827; text-align:center;" />
                      <span style="font-size:11px; color:#6b7280; line-height:1.7;">
                        Windows: <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Win + ;</span> or <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Win + .</span><br />
                        Mac: <span style="display:inline-block; background:#eef0f3; border:1px solid #dde1e7; border-radius:5px; padding:1px 6px; font-family:Consolas,'Courier New',monospace; color:#374151;">Control + Command + Space</span>
                      </span>
                    </span>
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Title</span>
                      <span data-resource-title-count style="font-size:11px; color:#6b7280;">0 / ${RESOURCE_TITLE_MAX_LENGTH}</span>
                    </span>
                    <input name="title" type="text" maxlength="${RESOURCE_TITLE_MAX_LENGTH}" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                      <span>Brief Description</span>
                      <span data-resource-description-count style="font-size:11px; color:#6b7280;">0 / ${RESOURCE_DESCRIPTION_MAX_LENGTH}</span>
                    </span>
                    <textarea name="description" maxlength="${RESOURCE_DESCRIPTION_MAX_LENGTH}" rows="3" required style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827; resize:vertical;"></textarea>
                  </label>

                  <label style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    Action
                    <select name="action_type" style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;">
                      <option value="download">Download</option>
                      <option value="canvas_page">Canvas Page</option>
                      <option value="external_link">External Link</option>
                    </select>
                  </label>

                  <label data-resource-url-wrap style="display:flex; flex-direction:column; gap:6px; font-size:12px; color:#4b5563;">
                    <span data-resource-url-label>Download Link</span>
                    <input name="resource_url" type="text" placeholder="https://..." style="box-sizing:border-box; width:100%; border:1px solid #d8dde5; border-radius:12px; padding:12px 13px; font-size:14px; background:#fbfbfc; color:#111827;" />
                    <span data-resource-url-help style="font-size:11px; color:#6b7280; line-height:1.35;">Required for downloads. The card will link directly to this URL.</span>
                  </label>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px; padding-top:18px; margin-top:18px; border-top:1px solid #eceff3;">
                  <button type="button" data-action="close-popup" style="border:1px solid #d8dde5; background:#ffffff; color:#111827; border-radius:999px; padding:10px 16px; cursor:pointer; font-size:14px;">Close</button>
                  <button type="submit" style="border:1px solid #1d4ed8; background:#1d4ed8; color:#ffffff; border-radius:999px; padding:10px 18px; cursor:pointer; font-size:14px;">Save Resource</button>
                </div>
              </form>
            </section>

            <section>
              <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px;">
                <div>
                  <h3 style="margin:0; font-size:16px; color:#111827;">Resource Cards</h3>
                  <div style="font-size:12px; color:#6b7280; margin-top:3px;">Canvas Page creates a Canvas page before saving.</div>
                </div>
                <button type="button" data-action="refresh-resources" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:7px 10px; cursor:pointer;">Refresh</button>
              </div>

              <div data-ai-hub-resources-list style="display:grid; grid-template-columns:repeat(auto-fill, 220px); gap:16px; justify-content:start; max-width:692px;">
                <div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading resources...</div>
              </div>
            </section>
          </div>

          <div data-ai-hub-resource-output style="display:none; margin-top:14px; border:1px solid #d1d5db; border-radius:6px; background:#f9fafb; padding:10px; font-size:13px; white-space:pre-wrap;"></div>
        </div>
      </div>
    `;

    const form = backdrop.querySelector("[data-ai-hub-resources-form]");
    const list = backdrop.querySelector("[data-ai-hub-resources-list]");
    const output = backdrop.querySelector("[data-ai-hub-resource-output]");
    const formTitle = backdrop.querySelector("[data-ai-hub-resource-form-title]");
    const titleCount = backdrop.querySelector("[data-resource-title-count]");
    const descriptionCount = backdrop.querySelector("[data-resource-description-count]");
    const urlWrap = backdrop.querySelector("[data-resource-url-wrap]");
    const urlLabel = backdrop.querySelector("[data-resource-url-label]");
    const urlHelp = backdrop.querySelector("[data-resource-url-help]");

    function setMessage(message, isError) {
      output.style.display = "block";
      output.style.borderColor = isError ? "#fca5a5" : "#d1d5db";
      output.style.background = isError ? "#fef2f2" : "#f9fafb";
      output.textContent = message;
    }

    function updateTextCounts() {
      const titleLength = form.elements.title.value.length;
      const descriptionLength = form.elements.description.value.length;
      titleCount.textContent = `${titleLength} / ${RESOURCE_TITLE_MAX_LENGTH}`;
      descriptionCount.textContent = `${descriptionLength} / ${RESOURCE_DESCRIPTION_MAX_LENGTH}`;
      titleCount.style.color = titleLength >= RESOURCE_TITLE_MAX_LENGTH ? "#1d4ed8" : "#6b7280";
      descriptionCount.style.color = descriptionLength >= RESOURCE_DESCRIPTION_MAX_LENGTH ? "#1d4ed8" : "#6b7280";
    }

    function sanitizeIconInput(useDefault) {
      const emoji = extractFirstEmoji(form.elements.icon.value);
      form.elements.icon.value = emoji || (useDefault ? RESOURCE_DEFAULT_ICON : "");
    }

    function updateActionFields() {
      const actionType = form.elements.action_type.value;
      const isCanvasPage = actionType === "canvas_page";
      urlWrap.style.display = isCanvasPage ? "none" : "flex";
      form.elements.resource_url.required = !isCanvasPage;

      if (isCanvasPage) {
        form.elements.resource_url.value = "";
        return;
      }

      urlLabel.textContent = actionType === "external_link" ? "External Link" : "Download Link";
      urlHelp.textContent = actionType === "external_link"
        ? "Required for External Link. The card will show View Resource."
        : "Required for downloads. The card will link directly to this URL.";
    }

    function clearForm() {
      form.reset();
      form.elements.id.value = "";
      form.elements.icon.value = RESOURCE_DEFAULT_ICON;
      formTitle.textContent = "Add Resource";
      output.style.display = "none";
      updateActionFields();
      updateTextCounts();
    }

    function fillForm(resourceRecord) {
      form.elements.id.value = resourceRecord.id || "";
      form.elements.icon.value = getResourceIcon(resourceRecord);
      form.elements.title.value = limitText(resourceRecord.title, RESOURCE_TITLE_MAX_LENGTH);
      form.elements.description.value = limitText(resourceRecord.description, RESOURCE_DESCRIPTION_MAX_LENGTH);
      form.elements.action_type.value = getResourceActionType(resourceRecord);
      form.elements.resource_url.value = resourceRecord.resource_url || "";
      formTitle.textContent = "Edit Resource";
      output.style.display = "none";
      updateActionFields();
      updateTextCounts();
    }

    function renderResourceEditorCard(resourceRecord) {
      const icon = getResourceIcon(resourceRecord);
      const title = resourceRecord.title || "Untitled Resource";
      const description = resourceRecord.description || "";
      const actionLabel = getResourceActionLabel(resourceRecord);
      const createdPage = resourceRecord.page_url && getResourceActionType(resourceRecord) === "canvas_page";

      return `
        <div data-resource-card data-resource-id="${escapeAttribute(resourceRecord.id)}">
          <div style="background:#ffffff; border-radius:14px; padding:18px; border:1px solid #e6e8ec; min-height:220px; display:flex; flex-direction:column;">
            <div style="width:44px; height:44px; border-radius:10px; background:#eeeeef; display:flex; align-items:center; justify-content:center; font-size:20px; margin-bottom:12px;" aria-hidden="true">${escapeHtml(icon)}</div>
            <h3 style="margin:0 0 8px; font-size:16px; line-height:1.25; color:#000000;">${escapeHtml(title)}</h3>
            <div style="font-size:13px; color:#6b7280; margin-bottom:12px;">${escapeHtml(description)}</div>
            <div style="font-size:12px; color:#1d4ed8; margin-top:auto;">${escapeHtml(actionLabel)}${createdPage ? " page created" : ""}</div>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
            <button type="button" data-action="edit-resource" data-resource-id="${escapeAttribute(resourceRecord.id)}" style="border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; padding:5px 8px; cursor:pointer;">Edit</button>
            <button type="button" data-action="delete-resource" data-resource-id="${escapeAttribute(resourceRecord.id)}" style="border:1px solid #fecaca; background:#fff1f2; color:#991b1b; border-radius:6px; padding:5px 8px; cursor:pointer;">Delete</button>
          </div>
        </div>
      `;
    }

    function renderResourceList(resources) {
      const sortedResources = sortBySortOrder(resources);
      if (!sortedResources.length) {
        list.innerHTML = `<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">No resources yet.</div>`;
        return;
      }

      list.innerHTML = sortedResources.map(renderResourceEditorCard).join("");
    }

    async function refreshResources() {
      list.innerHTML = `<div style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff; color:#6b7280;">Loading resources...</div>`;
      const data = normalizeHubData(await loadHubData());
      renderResourceList(data.resources);
      return data.resources;
    }

    backdrop.addEventListener("click", async event => {
      const actionButton = event.target.closest("[data-action]");
      const action = actionButton?.getAttribute("data-action");

      if (event.target === backdrop || action === "close-popup") {
        closeEditorPopup();
        return;
      }

      if (!action) return;

      try {
        if (action === "clear-resource-form") {
          clearForm();
        }

        if (action === "refresh-resources") {
          await refreshResources();
          setMessage("Resources refreshed.", false);
        }

        if (action === "edit-resource") {
          const data = normalizeHubData(await loadHubData());
          const resourceRecord = data.resources.find(item => item.id === actionButton.getAttribute("data-resource-id"));
          if (resourceRecord) fillForm(resourceRecord);
        }

        if (action === "delete-resource") {
          const ok = window.confirm("Delete this resource card? This will not delete any Canvas page that was already created.");
          if (!ok) return;
          await deleteResourceFromHubData(actionButton.getAttribute("data-resource-id"));
          clearForm();
          await refreshResources();
          setMessage("Resource deleted.", false);
        }
      } catch (error) {
        console.error(error);
        setMessage("Action failed:\n" + error.message, true);
      }
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const submitButton = form.querySelector("button[type='submit']");
      const formData = new FormData(form);
      const resourceData = Object.fromEntries(formData.entries());

      if (resourceData.action_type !== "canvas_page" && !resourceData.resource_url.trim()) {
        setMessage((resourceData.action_type === "external_link" ? "External Link" : "Download") + " resources need a link.", true);
        return;
      }

      try {
        submitButton.disabled = true;
        submitButton.textContent = resourceData.action_type === "canvas_page" ? "Creating page..." : "Saving...";
        const savedResource = await saveResourceToHubData(resourceData.id || null, resourceData);
        console.log("AI Hub resource saved to JSON page and visible hub page:", savedResource);
        const editUrl = getResourcePageEditUrl(savedResource);
        if (savedResource.action_type === "canvas_page" && editUrl) {
          setMessage("Resource saved. Opening the Canvas page editor...", false);
          window.location.assign(editUrl);
          return;
        }

        clearForm();
        await refreshResources();
        setMessage("Resource saved to JSON and hub page.", false);
      } catch (error) {
        console.error(error);
        setMessage("Save failed:\n" + error.message, true);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Save Resource";
      }
    });

    form.elements.title.addEventListener("input", updateTextCounts);
    form.elements.description.addEventListener("input", updateTextCounts);
    form.elements.action_type.addEventListener("change", updateActionFields);
    form.elements.icon.addEventListener("input", () => sanitizeIconInput(false));
    form.elements.icon.addEventListener("blur", () => sanitizeIconInput(true));
    form.elements.icon.addEventListener("focus", () => form.elements.icon.select());
    form.elements.icon.addEventListener("click", () => form.elements.icon.select());
    updateActionFields();
    updateTextCounts();

    document.body.appendChild(backdrop);
    refreshResources().catch(error => {
      console.error(error);
      setMessage("Could not load resources:\n" + error.message, true);
    });

    window.requestAnimationFrame(() => {
      const panel = document.getElementById(POPUP_PANEL_ID);
      backdrop.style.opacity = "1";
      backdrop.style.background = "rgba(0,0,0,0.38)";
      if (panel) {
        panel.style.opacity = "1";
        panel.style.transform = "translateY(0) scale(1)";
      }
    });
  }

  function addToggleButton(nav) {
    if (document.getElementById(TOGGLE_BUTTON_ID)) return;

    const li = document.createElement("li");
    li.id = TOGGLE_BUTTON_ID;
    li.className = "section";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Restore Tabs";
    button.style.cursor = "pointer";

    button.addEventListener("click", () => {
      const tabsAreHidden = document.querySelector("#section-tabs li[" + HIDDEN_TAB_ATTRIBUTE + "='true']");

      if (tabsAreHidden) {
        restoreHeaderBar();
        restoreCourseTabs();
        removeEditTabs();
        button.textContent = "Hide Tabs";
      } else {
        hideHeaderBar();
        hideCourseTabs();
        addEditTabs(nav);
        button.textContent = "Restore Tabs";
      }
    });

    li.appendChild(button);
    nav.appendChild(li);
  }

  if (isAiHubHomePath()) {
    const nav = document.querySelector("#section-tabs");
    if (!nav) return;

    hideHeaderBar();
    hideCourseTabs();
    addEditTabs(nav);
    addToggleButton(nav);
  }

  window.AIHubData = {
    addEventToHubData,
    addCourseToHubData,
    addResourceToHubData,
    createCanvasResourcePage,
    updateCanvasResourcePage,
    deleteCourseFromHubData,
    deleteEventFromHubData,
    deleteResourceFromHubData,
    fetchDataPage,
    fetchCanvasPage,
    getDataPageApiUrl,
    getStarterHubData,
    loadHubData,
    moveEventInHubData,
    replaceEventsSectionInBody,
    replaceCoursesSectionInBody,
    replaceResourcesSectionInBody,
    renderHubPageBody,
    renderCoursesSection,
    renderEventsSection,
    renderResourcesSection,
    reorderEventsInHubData,
    saveCanvasPageBody,
    saveCourseToHubData,
    saveHubData,
    saveHubDataAndRenderedPage,
    saveEventToHubData,
    saveResourceToHubData,
    saveRenderedHubPage,
    setEventStatusInHubData,
    seedCurrentHubPage,
    seedHubDataPage,
    sortEventsByDate
  };
})();
