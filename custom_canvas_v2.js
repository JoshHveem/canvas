/*
 * Canvas theme bootstrap v2
 *
 * This is intentionally parallel to custom_canvas.js.  It can be tested by
 * replacing the theme's custom JavaScript URL with this file; it does not
 * modify or depend on the existing bootstrap.
 */
(function () {
  'use strict';

  if (window.self !== window.top || window.BTECH_CANVAS_V2_BOOTSTRAPPED) return;
  window.BTECH_CANVAS_V2_BOOTSTRAPPED = true;

  var courseMatch = window.location.pathname.match(/^\/courses\/([0-9]+)/);
  var accountMatch = window.location.pathname.match(/^\/accounts\/([0-9]+)/);
  var roles = []
    .concat(ENV && ENV.current_user_roles ? ENV.current_user_roles : [])
    .concat(ENV && ENV.current_user_types ? ENV.current_user_types : [])
    .concat(Array.isArray(ENV && ENV.current_user_type) ? ENV.current_user_type : [ENV && ENV.current_user_type])
    .filter(Boolean);
  var isDepartmentHead = roles.some(function (role) {
    return ['Department Head', 'AccountAdmin'].includes(role);
  });

  // Existing feature files consume these globals, so v2 deliberately keeps
  // their names while centralizing where they are calculated.
  window.ISDIDS = [1893418, 1638854, 2048150, 2074560, 2116084, 2118711, 2147128, 1547292, 451607, 451622, 1842412, 2210696];
  window.CURRENT_COURSE_ID = courseMatch ? Number(courseMatch[1]) : null;
  window.CURRENT_DEPARTMENT_ID = accountMatch ? Number(accountMatch[1]) : null;
  window.IS_BLUEPRINT = Boolean(ENV && ENV.BLUEPRINT_COURSES_DATA !== undefined);
  window.IS_DEPARTMENT_HEAD = isDepartmentHead;
  window.IS_TEACHER = roles.some(function (role) { return ['teacher', 'admin'].includes(role); });
  window.IS_ISD = isDepartmentHead;
  window.IS_ME = [1893418, 2210696].includes(Number(ENV && ENV.current_user && ENV.current_user.id));
  window.COURSE_HOURS = undefined;
  window.MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  window.SOURCE_URL = window.SOURCE_URL || 'https://bridgetools.dev/canvas';
  window.btechAssetUrl = window.btechAssetUrl || function (url) {
    var version = window.BTECH_CANVAS_ASSET_VERSION;
    if (!version) return url;
    return url + (url.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(version);
  };

  var managerUrl = window.btechAssetUrl(window.SOURCE_URL + '/scripts_v2.js');
  var script = document.createElement('script');
  script.src = managerUrl;
  script.async = true;
  script.onload = function () { window.BTECH_CANVAS_V2.start(); };
  script.onerror = function () { console.error('[BTECH v2] Failed to load manager:', managerUrl); };
  document.head.appendChild(script);
}());
