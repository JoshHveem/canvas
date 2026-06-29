/*
  ISD Hub JSON Page Seed

  Copy/paste this whole file into the browser console while logged into Canvas.
  It seeds this hidden Canvas page:

  https://btech.instructure.com/courses/[course id]/pages/json

  with starter JSON data for events, courses, and resources.
*/
window.ISDHubConfig = Object.assign({
  courseId: window.ENV?.COURSE_ID || window.location.pathname.match(/\/courses\/(\d+)/)?.[1] || ""
}, window.ISDHubConfig || {});

(async function () {
  const HUB_CONFIG = window.ISDHubConfig;
  const DATA_PAGE_URL = "json";
  const DATA_ELEMENT_ID = "isd-hub-json-data";

  function getCourseId() {
    const courseId = String(HUB_CONFIG.courseId || "").trim();
    if (!courseId) {
      throw new Error("ISD Hub course id is missing. Set window.ISDHubConfig.courseId before running.");
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

  const jsonData = {
    version: 1,
    events: [
      {
        id: "evt_learning_objectives",
        title: "Designing Effective Learning Objectives",
        event_date: "2025-05-21",
        start_time: "10:00",
        location_type: "online",
        location_label: "Online (Zoom)",
        booking_url: "REPLACE-WITH-REGISTER-LINK-1",
        status: "active",
        sort_order: 1
      },
      {
        id: "evt_canvas_essentials",
        title: "Canvas Essentials for Instructors",
        event_date: "2025-05-28",
        start_time: "14:00",
        location_type: "online",
        location_label: "Online (Zoom)",
        booking_url: "REPLACE-WITH-REGISTER-LINK-2",
        status: "active",
        sort_order: 2
      },
      {
        id: "evt_ai_responsibly",
        title: "Using AI Responsibly in Teaching",
        event_date: "2025-06-04",
        start_time: "11:00",
        location_type: "online",
        location_label: "Online (Zoom)",
        booking_url: "REPLACE-WITH-REGISTER-LINK-3",
        status: "active",
        sort_order: 3
      },
      {
        id: "evt_assessment_strategies",
        title: "Assessment Strategies That Work",
        event_date: "2025-06-11",
        start_time: "13:00",
        location_type: "online",
        location_label: "Online (Zoom)",
        booking_url: "REPLACE-WITH-REGISTER-LINK-4",
        status: "active",
        sort_order: 4
      }
    ],
    courses: [
      {
        id: "course_instructional_design_foundations",
        icon: "desktop",
        title: "Instructional Design Foundations",
        description: "The core principles of designing effective learning experiences.",
        format: "self_paced",
        course_url: "REPLACE-WITH-COURSE-LINK-1",
        sort_order: 1
      },
      {
        id: "course_designing_engaging_activities",
        icon: "puzzle",
        title: "Designing Engaging Activities",
        description: "Create active learning experiences that stick.",
        format: "self_paced",
        course_url: "REPLACE-WITH-COURSE-LINK-2",
        sort_order: 2
      },
      {
        id: "course_assessment_feedback",
        icon: "chart",
        title: "Assessment & Feedback",
        description: "Design assessments that drive learning.",
        format: "self_paced",
        course_url: "REPLACE-WITH-COURSE-LINK-3",
        sort_order: 3
      },
      {
        id: "course_inclusive_course_design",
        icon: "people",
        title: "Inclusive Course Design",
        description: "Build accessible and inclusive learning environments.",
        format: "self_paced",
        course_url: "REPLACE-WITH-COURSE-LINK-4",
        sort_order: 4
      },
      {
        id: "course_ai_adoption",
        icon: "robot",
        title: "AI Adoption",
        description: "Practical, responsible ways to bring AI into your teaching and workflow.",
        format: "self_paced",
        course_url: "REPLACE-WITH-COURSE-LINK-5",
        sort_order: 5
      }
    ],
    resources: [
      {
        id: "resource_syllabus_template",
        icon: "document",
        title: "Syllabus Template",
        description: "Editable syllabus template aligned to best practices.",
        resource_url: "REPLACE-WITH-RESOURCE-LINK-1",
        action_label: "Download",
        page_url: "",
        sort_order: 1
      },
      {
        id: "resource_course_design_checklist",
        icon: "check",
        title: "Course Design Checklist",
        description: "A checklist to guide your course development.",
        resource_url: "REPLACE-WITH-RESOURCE-LINK-2",
        action_label: "Download",
        page_url: "",
        sort_order: 2
      },
      {
        id: "resource_universal_design_guide",
        icon: "play",
        title: "Universal Design Guide",
        description: "Practical tips for designing for all learners.",
        resource_url: "REPLACE-WITH-RESOURCE-LINK-3",
        action_label: "View Guide",
        page_url: "",
        sort_order: 3
      },
      {
        id: "resource_feedback_strategies",
        icon: "comment",
        title: "Feedback Strategies",
        description: "A quick reference for providing meaningful feedback.",
        resource_url: "REPLACE-WITH-RESOURCE-LINK-4",
        action_label: "View Resource",
        page_url: "",
        sort_order: 4
      }
    ]
  };

  const html = `<pre id="${DATA_ELEMENT_ID}">${escapeHtml(JSON.stringify(jsonData, null, 2))}</pre>`;

  const response = await fetch(`https://btech.instructure.com/api/v1/courses/${getCourseId()}/pages/${DATA_PAGE_URL}`, {
    headers: {
      accept: "application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01",
      "content-type": "application/json",
      "x-csrf-token": getCsrfToken(),
      "x-requested-with": "XMLHttpRequest"
    },
    referrer: `https://btech.instructure.com/courses/${getCourseId()}/pages/${DATA_PAGE_URL}/edit`,
    body: JSON.stringify({
      wiki_page: {
        url: DATA_PAGE_URL,
        title: "JSON",
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
    }),
    method: "PUT",
    mode: "cors",
    credentials: "include"
  });

  const result = await response.json();
  console.log("ISD Hub JSON seed status:", response.status);
  console.log(result);
})();
