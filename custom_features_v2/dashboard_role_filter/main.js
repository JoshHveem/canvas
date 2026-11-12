(async function initDashboardRoleView() {
  'use strict';

  const DASHBOARD_PATH = '/';
  const CARD_CONTAINER_SELECTOR = '#DashboardCard_Container';
  const TOOLBAR_ID = 'btech-dashboard-role-toggle';
  const STYLE_ID = 'btech-dashboard-role-toggle-styles';
  const STORAGE_KEY = 'canvas-role-dashboard-mode';
  const TEACHING_ROLES = new Set(['TeacherEnrollment', 'TaEnrollment', 'DesignerEnrollment']);
  const STUDENT_ROLES = new Set(['StudentEnrollment']);

  if (window.location.pathname !== DASHBOARD_PATH || window.self !== window.top) return;

  let enrollmentsByCourse = new Map();
  let availableModes = [];
  let currentMode = null;
  let refreshTimer = null;

  function readSavedMode() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  }

  function saveMode(mode) {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch (_) {
      // The view remains usable when browser storage is unavailable.
    }
  }

  async function canvasFetch(url) {
    const requestUrl = new URL(url, window.location.origin);
    if (requestUrl.origin !== window.location.origin || !requestUrl.pathname.startsWith('/api/v1/')) {
      throw new Error('Refusing an unexpected Canvas API URL.');
    }

    const response = await fetch(requestUrl.href, {
      credentials: 'include',
      headers: { Accept: 'application/json+canvas-string-ids' }
    });

    if (!response.ok) {
      throw new Error(`Canvas API request failed: ${response.status} ${response.statusText}`);
    }
    return response;
  }

  function getNextPage(linkHeader) {
    if (!linkHeader) return null;
    const nextLink = linkHeader.match(/<([^>]+)>\s*;\s*rel="?next"?/i);
    return nextLink ? nextLink[1] : null;
  }

  async function fetchAllPages(url) {
    const results = [];
    let nextUrl = url;
    const visited = new Set();

    while (nextUrl) {
      const requestUrl = new URL(nextUrl, window.location.origin);
      if (visited.has(requestUrl.href)) throw new Error('Canvas returned a repeated pagination link.');
      visited.add(requestUrl.href);

      const response = await canvasFetch(requestUrl.href);
      const page = await response.json();
      if (!Array.isArray(page)) throw new Error('Canvas returned an unexpected enrollment response.');
      results.push(...page);
      nextUrl = getNextPage(response.headers.get('Link'));
    }
    return results;
  }

  async function loadEnrollments() {
    const enrollments = await fetchAllPages(
      '/api/v1/users/self/enrollments?state[]=active&per_page=100'
    );
    const map = new Map();

    for (const enrollment of enrollments) {
      if (enrollment.course_id == null || !enrollment.type) continue;
      const courseId = String(enrollment.course_id);
      if (!map.has(courseId)) map.set(courseId, new Set());
      map.get(courseId).add(enrollment.type);
    }
    enrollmentsByCourse = map;

    const types = new Set(enrollments.flatMap(enrollment => enrollment.type ? [enrollment.type] : []));
    availableModes = [];
    if (Array.from(types).some(type => TEACHING_ROLES.has(type))) availableModes.push('teacher');
    if (types.has('StudentEnrollment')) availableModes.push('student');
    if (availableModes.length > 1) availableModes.push('all');

    const savedMode = readSavedMode();
    if (availableModes.includes(savedMode)) {
      currentMode = savedMode;
    } else if (availableModes.includes('teacher')) {
      currentMode = 'teacher';
    } else if (availableModes.includes('student')) {
      currentMode = 'student';
    } else {
      currentMode = 'all';
      availableModes = ['all'];
    }
  }

  function getCourseIdFromCard(card) {
    for (const link of card.querySelectorAll('a[href*="/courses/"]')) {
      try {
        const url = new URL(link.href, window.location.origin);
        const match = url.pathname.match(/^\/courses\/([^/]+)(?:\/|$)/);
        if (match) return String(match[1]);
      } catch (_) {
        // Ignore malformed dashboard links.
      }
    }
    return null;
  }

  function courseMatchesMode(courseId) {
    if (currentMode === 'all') return true;
    const types = enrollmentsByCourse.get(courseId);
    if (!types) return false;
    if (currentMode === 'teacher') return Array.from(types).some(type => TEACHING_ROLES.has(type));
    if (currentMode === 'student') return Array.from(types).some(type => STUDENT_ROLES.has(type));
    return true;
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${TOOLBAR_ID} { margin: 0 0 20px; color: #2d3b45; }
      #${TOOLBAR_ID} .btech-dashboard-role-title { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
      #${TOOLBAR_ID} .btech-dashboard-role-buttons { display: inline-flex; flex-wrap: wrap; gap: 4px; }
      #${TOOLBAR_ID} button {
        border: 1px solid #c7cdd1; border-radius: 4px; background: #fff; color: #2d3b45;
        padding: 7px 14px; font: inherit; font-size: 13px; font-weight: 600; line-height: 20px; cursor: pointer;
      }
      #${TOOLBAR_ID} button:hover { background: #f5f5f5; }
      #${TOOLBAR_ID} button[aria-pressed="true"] { border-color: #0374b5; background: #0374b5; color: #fff; }
      #${TOOLBAR_ID} button:focus-visible { outline: 2px solid #0374b5; outline-offset: 2px; }
    `;
    document.head.appendChild(style);
  }

  function updateActiveButton(toolbar) {
    toolbar.querySelectorAll('[data-dashboard-role-mode]').forEach(button => {
      const active = button.dataset.dashboardRoleMode === currentMode;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function makeToolbar(container) {
    let toolbar = document.getElementById(TOOLBAR_ID);
    if (!toolbar) {
      toolbar = document.createElement('section');
      toolbar.id = TOOLBAR_ID;
      toolbar.setAttribute('aria-label', 'Dashboard view');
      const title = document.createElement('h2');
      title.className = 'btech-dashboard-role-title';
      title.textContent = 'Dashboard View';
      const buttons = document.createElement('div');
      buttons.className = 'btech-dashboard-role-buttons';
      buttons.setAttribute('role', 'group');
      buttons.setAttribute('aria-label', 'Filter courses by enrollment role');

      const labels = { teacher: 'Teacher', student: 'Student', all: 'All' };
      availableModes.forEach(mode => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.dashboardRoleMode = mode;
        button.textContent = labels[mode];
        button.addEventListener('click', () => {
          currentMode = mode;
          saveMode(mode);
          refreshDashboard();
        });
        buttons.appendChild(button);
      });
      toolbar.append(title, buttons);
    }

    if (toolbar.nextElementSibling !== container) container.parentNode.insertBefore(toolbar, container);
    updateActiveButton(toolbar);
  }

  function refreshDashboard() {
    const container = document.querySelector(CARD_CONTAINER_SELECTOR);
    if (!container) return;

    ensureStyles();
    if (availableModes.length > 1) makeToolbar(container);

    container.querySelectorAll('.ic-DashboardCard').forEach(card => {
      const courseId = getCourseIdFromCard(card);
      if (!courseId || currentMode === 'all') {
        card.style.display = '';
        return;
      }
      card.style.display = courseMatchesMode(courseId) ? '' : 'none';
    });

    const toolbar = document.getElementById(TOOLBAR_ID);
    if (toolbar) updateActiveButton(toolbar);
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshDashboard, 100);
  }

  function watchDashboard() {
    const observer = new MutationObserver(() => {
      const container = document.querySelector(CARD_CONTAINER_SELECTOR);
      if (!container) return;
      scheduleRefresh();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  try {
    await loadEnrollments();
    refreshDashboard();
    watchDashboard();
  } catch (error) {
    console.error('[BTECH dashboard role view] Could not load enrollment data; leaving dashboard unchanged.', error);
  }
})();
