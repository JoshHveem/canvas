/*
  AI Hub JSON Page Seed

  Copy/paste this whole file into the browser console while logged into Canvas.
  It seeds this hidden Canvas page:

  https://btech.instructure.com/courses/[course id]/pages/json

  with starter JSON data for events, courses, and resources.
*/
window.AIHubConfig = Object.assign({
  courseId: window.ENV?.COURSE_ID || window.location.pathname.match(/\/courses\/(\d+)/)?.[1] || ""
}, window.AIHubConfig || {});

(async function () {
  const HUB_CONFIG = window.AIHubConfig;
  const DATA_PAGE_URL = "json";
  const DATA_ELEMENT_ID = "ai-hub-json-data";

  function getCourseId() {
    const courseId = String(HUB_CONFIG.courseId || "").trim();
    if (!courseId) {
      throw new Error("AI Hub course id is missing. Set window.AIHubConfig.courseId before running.");
    }
    return courseId;
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

  const now = new Date().toISOString();
  const jsonData = {
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

  const html = `<pre id="${DATA_ELEMENT_ID}">${escapeHtml(JSON.stringify(jsonData, null, 2))}</pre>`;
  const payload = {
    wiki_page: {
      url: DATA_PAGE_URL,
      title: "AI Hub JSON",
      editing_roles: "teachers",
      published: false,
      hide_from_students: true,
      front_page: false,
      body: html,
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

  let response = await fetch(`https://btech.instructure.com/api/v1/courses/${getCourseId()}/pages/${DATA_PAGE_URL}`, {
    headers: {
      accept: "application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01",
      "content-type": "application/json",
      "x-csrf-token": getCsrfToken(),
      "x-requested-with": "XMLHttpRequest"
    },
    referrer: `https://btech.instructure.com/courses/${getCourseId()}/pages/${DATA_PAGE_URL}/edit`,
    body: JSON.stringify(payload),
    method: "PUT",
    mode: "cors",
    credentials: "include"
  });

  if (response.status === 404) {
    response = await fetch(`https://btech.instructure.com/api/v1/courses/${getCourseId()}/pages`, {
      headers: {
        accept: "application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01",
        "content-type": "application/json",
        "x-csrf-token": getCsrfToken(),
        "x-requested-with": "XMLHttpRequest"
      },
      referrer: `https://btech.instructure.com/courses/${getCourseId()}/pages/${DATA_PAGE_URL}/edit`,
      body: JSON.stringify(payload),
      method: "POST",
      mode: "cors",
      credentials: "include"
    });
  }

  const result = await response.json();
  console.log("AI Hub JSON seed status:", response.status);
  console.log(result);
})();
