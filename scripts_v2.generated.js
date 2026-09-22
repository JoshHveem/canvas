/* Canvas feature manager v2. Loaded by custom_canvas_v2.js. */
(function () {
  'use strict';

  var assetBase = window.SOURCE_URL || 'https://bridgetools.dev/canvas';
  var loaded = new Map();
  var route = window.location.pathname;

  // Compatibility helpers used by many existing feature implementations.
  // The legacy loader supplied these from scripts.js; v2 owns them directly.
  window.canvasGet = window.canvasGet || async function canvasGet(url, reqData, page, resData) {
    reqData = Object.assign({}, reqData || {}, { per_page: 100, page: page || '1' });
    resData = resData || [];
    var nextPage = '';
    await $.get(url, reqData, function (data, status, xhr) {
      resData = resData.concat(data);
      var header = xhr.getResponseHeader('Link');
      var nextMatch = header && header.match(/<([^>]*)>; rel="next"/);
      if (nextMatch) {
        var pageMatch = nextMatch[1].match(/[?&]page=([^&]+)/);
        if (pageMatch) nextPage = pageMatch[1];
      }
    });
    return nextPage ? window.canvasGet(url, reqData, nextPage, resData) : resData;
  };
  if (window.$) {
    $.put = $.put || function (url, data) { return $.ajax({ url: url, data: data, type: 'PUT' }); };
    $.delete = $.delete || function (url, data) { return $.ajax({ url: url, data: data, type: 'DELETE' }); };
  }

  function assetUrl(url) {
    return window.btechAssetUrl ? window.btechAssetUrl(url) : url;
  }

  function loadScript(url, label) {
    var key = url;
    if (loaded.has(key)) return loaded.get(key);
    var promise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = assetUrl(url);
      script.async = true;
      script.onload = resolve;
      script.onerror = function () { reject(new Error('Unable to load ' + (label || url))); };
      document.head.appendChild(script);
    });
    loaded.set(key, promise);
    return promise;
  }

  var dependencies = {
    vue: function () { return loadScript(assetBase + '/external-libraries/vue.2.6.12.js', 'Vue'); },
    select2: function () { return loadScript('https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js', 'Select2'); },
    // Provides req3, colors, date formatting, and other shared Bridgetools helpers.
    bridgetools: function () { return loadScript('https://reports.bridgetools.dev/scripts.js', 'Bridgetools runtime'); },
    reportRuntime: function () {
      // Keep the legacy order where graphs may rely on report-runtime globals.
      return dependencies.bridgetools()
        .then(function () { return loadScript('https://reports.bridgetools.dev/department_report/graphs.js', 'report graphs'); });
    }
  };

  function matches(entry) {
    if (!entry.routes) return true;
    var routes = Array.isArray(entry.routes) ? entry.routes : [entry.routes];
    return routes.some(function (pattern) { return pattern.test(route); });
  }

  function allowed(entry) {
    if (entry.teacher && !window.IS_TEACHER) return false;
    if (entry.notTeacher && window.IS_TEACHER) return false;
    if (entry.isd && !(window.IS_ISD || window.IS_ME)) return false;
    if (entry.rootAdmin && !(ENV.current_user_roles || []).includes('root_admin')) return false;
    if (entry.course && !window.CURRENT_COURSE_ID) return false;
    if (entry.blueprint && !window.IS_BLUEPRINT) return false;
    if (entry.courseIds && !entry.courseIds.includes(window.CURRENT_COURSE_ID)) return false;
    if (entry.departments && !entry.departments.includes(window.CURRENT_DEPARTMENT_ID)) return false;
    return matches(entry);
  }

  function loadFeature(entry) {
    var deps = (entry.dependencies || []).map(function (name) { return dependencies[name](); });
    return Promise.all(deps)
      // Bundles keep feature-local ES module imports compatible with Canvas's
      // cross-origin asset loading, which does not permit raw module scripts.
      .then(function () { return loadScript(assetBase + '/custom_features_v2/' + entry.name + '/main.bundle.js', entry.name); })
      .catch(function (error) { console.error('[BTECH v2] Feature failed:', entry.name, error); });
  }

  function addCourseBanner() {
    if (!/^\/courses\/[0-9]+(?:\/modules)?$/.test(route) || document.querySelector('[data-btech-v2-course-banner]')) return;
    var header = document.querySelector('.header-bar');
    if (!header) return;
    var longName = (ENV.COURSE && ENV.COURSE.long_name) || '';
    var courseCode = (longName.match(/-\s*([A-Za-z]{4}\s\d{4})$/) || $('#breadcrumbs').text().match(/([A-Za-z]{4}\s\d{4})/ ) || [])[1] || '';
    var department = courseCode.slice(0, 4);
    var wrapper = document.createElement('div');
    wrapper.setAttribute('data-btech-v2-course-banner', 'true');
    wrapper.className = 'custom-course-header';
    wrapper.innerHTML = '<div class="course-banner-container"><div class="course-banner-text"><div class="course-banner-title"><strong></strong></div></div><div class="course-banner-image"><div class="course-banner-skew"></div><img alt=""></div></div>';
    wrapper.querySelector('strong').textContent = (ENV.current_context && ENV.current_context.name) || '';
    var image = wrapper.querySelector('img');
    image.src = assetBase + '/media/course-banners/' + department + '.jpg';
    image.onerror = function () { image.style.display = 'none'; };
    header.insertAdjacentElement('afterend', wrapper);
    if (document.getElementById('btech-v2-course-banner-style')) return;
    var style = document.createElement('style');
    style.id = 'btech-v2-course-banner-style';
    style.textContent = '.course-banner-container{max-width:1000px;height:150px;width:100%;margin:auto;display:flex;align-items:center;position:relative;overflow:hidden}.course-banner-text{flex-shrink:0;min-width:40%;background:#f5f5f5;height:100%;display:flex;align-items:center;z-index:2}.course-banner-title{margin-left:calc((150px - 2rem)/2);font-size:2rem;line-height:2rem;max-width:350px;color:#B20B0F;font-family:sans-serif}.course-banner-image{flex-grow:1;position:relative;height:100%}.course-banner-skew{position:absolute;left:-50px;top:0;width:100px;height:100%;background:#f5f5f5;transform:skewX(-20deg);z-index:1}.course-banner-image img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0}@media(max-width:600px){.course-banner-container{flex-direction:column;height:auto}.course-banner-text{min-width:100%;height:auto;justify-content:center;padding:1rem 0}.course-banner-image{width:100%;height:150px}.course-banner-title{margin-left:0;font-size:1.5rem;text-align:center}.course-banner-skew{display:none}}';
    document.head.appendChild(style);
  }

  // Feature entries are generated from custom_features_v2/*/main.js by the
  // feature manager. The source manager intentionally has no manual registry.
  var features = [
    { name: "blueprint_association_links", blueprint: true, notTeacher: false, isd: false, rootAdmin: false, routes: /^\/courses\/[0-9]+(?:\/.*)?$/ },
    { name: "copy_to_next_year", isd: true, routes: /^\/accounts\/[0-9]+$/ },
    { name: "dashboard_students_near_completion", teacher: true, dependencies: ["vue"], routes: /^\/$/ },
    { name: "department_specific_business_hs", departments: [3833], dependencies: ["bridgetools"] },
    { name: "department_specific_data_analytics_feedback_report", departments: [4218], routes: /^\/courses\/[0-9]+(?:\/modules)?$/ },
    { name: "department_specific_phrm_import_cartridges", departments: [3945], teacher: true, routes: /^\/courses\/[0-9]+(?:\/modules)?$/ },
    { name: "department_specific_replace_course_code_with_name", departments: [3827], routes: /^\/courses\/[0-9]+/ },
    { name: "distance_approved_button", dependencies: ["bridgetools"], routes: /^\/courses\/[0-9]+(?:\/modules)?$/ },
    { name: "editor_toolbar_basics", routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)\/.+?\/edit/ },
    { name: "editor_toolbar_headers", dependencies: ["select2"], routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: "editor_toolbar_images", routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: "editor_toolbar_toolbar", dependencies: ["vue","select2"], routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: "files_restore_images", teacher: true, routes: /^\/courses\/[0-9]+/ },
    { name: "files_usage", dependencies: ["bridgetools"], routes: /^\/courses\/[0-9]+\/files/ },
    { name: "grades_page_attempts", routes: /^\/courses\/[0-9]+\/grades\/[0-9]+/ },
    { name: "grades_page_highlighted_grades_page_items", routes: /^\/courses\/[0-9]+\/grades\/[0-9]+/ },
    { name: "highlight_comments_same_date", routes: [/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/, /^\/courses\/[0-9]+\/gradebook\/speed_grader/] },
    { name: "hs_section_adder", isd: true, routes: /^\/accounts\/[0-9]+$/ },
    { name: "img_zoom", priority: "critical", routes: /users/ },
    { name: "inbox_prefill", isd: true, routes: /^\/conversations$/ },
    { name: "kaltura_show_info", routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: "modules_course_readiness", teacher: true, dependencies: ["bridgetools"], routes: /^\/courses\/[0-9]+(?:\/modules)?$/ },
    { name: "modules_delete_module_items", isd: true, routes: /^\/courses\/[0-9]+(?:\/modules)?$/ },
    { name: "modules_enrollment_dates_student_external", priority: "critical", dependencies: ["bridgetools"], routes: /^\/courses\/[0-9]+(?:\/modules)?$/ },
    { name: "modules_enrollment_dates_teacher", routes: /^\/courses\/[0-9]+\/users\/[0-9]+$/ },
    { name: "modules_module_weight", dependencies: ["bridgetools"], routes: /^\/courses\/[0-9]+(?:\/modules)?$/ },
    { name: "modules_show_undelete", teacher: true, routes: /^\/courses\/[0-9]+(?:\/modules)?$/ },
    { name: "page_formatting_ai_hub", courseIds: [621895], teacher: true, priority: "critical", routes: /^\/courses\/[0-9]+(?:\/.*)?$/ },
    { name: "page_formatting_content_image_zoom", priority: "critical", routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)\/(?!.+?\/edit$).+/ },
    { name: "page_formatting_dropdown_from_table", routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: "page_formatting_expandable_from_table", routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: "page_formatting_google_sheets_table", routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: "page_formatting_image_formatting", routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: "page_formatting_image_map", routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: "page_formatting_isd_hub", courseIds: [632661], teacher: true, priority: "critical", routes: /^\/courses\/[0-9]+(?:\/.*)?$/ },
    { name: "page_formatting_isd_hub_gradebook", courseIds: [632661], teacher: true, priority: "critical", routes: [/^\/courses\/[0-9]+\/grades(?:\/[0-9]+)?$/, /^\/courses\/[0-9]+\/gradebook\/[0-9]+/] },
    { name: "page_formatting_print_rubric", routes: /^\/courses\/[0-9]+\/assignments/ },
    { name: "page_formatting_table_from_page", routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: "page_formatting_tabs_from_table", routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: "page_formatting_tinymce_font_size", dependencies: ["select2"], routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)\/.+?\/edit/ },
    { name: "password_reset", routes: [/^\/courses\/[0-9]+\/users\/[0-9]+$/, /^\/accounts\/[0-9]+\/users\/[0-9]+$/, /^\/users\/[0-9]+$/] },
    { name: "people_page_instructor_add_remove_guide", teacher: true, routes: /^\/courses\/[0-9]+\/users$/ },
    { name: "previous_enrollment_data_previous_enrollment_period_grades", departments: [3833] },
    { name: "quizzes_duplicate_bank_item", routes: /\/courses\/([0-9]+)\/question_banks\/([0-9]+)/ },
    { name: "quizzes_printing_accessibility", teacher: true, routes: /^\/courses\/[0-9]+\/quizzes\/[0-9]+\/take/ },
    { name: "quizzes_question_bank_sorter", routes: /^\/courses\/[0-9]+\/quizzes\/[0-9]+\/edit/ },
    { name: "quizzes_quiz_analytics_print_margin", routes: /^\/courses\/[0-9]+\/quizzes\/[0-9]+\/statistics/ },
    { name: "quizzes_show_analytics", teacher: true, routes: /^\/courses\/[0-9]+\/quizzes\/[0-9]+/ },
    { name: "quizzes_upload_questions", routes: /\/courses\/([0-9]+)\/question_banks$/ },
    { name: "remove_former_employees", rootAdmin: true, routes: /^\/(?:accounts\/[0-9]+\/)?users\/[0-9]+/ },
    { name: "report_broken_content", routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: "reports_accreditation_2", dependencies: ["vue","bridgetools"], routes: /^\/courses\/([0-9]+)\/external_tools\/([0-9]+)/ },
    { name: "reports_combined", teacher: true, dependencies: ["vue","reportRuntime"], routes: /^\/$/ },
    { name: "reports_grades_page", teacher: true, dependencies: ["vue","reportRuntime"], routes: /^\/$/ },
    { name: "reports_grades_page", teacher: true, dependencies: ["vue","reportRuntime"], routes: /^\/courses\/[0-9]+\/gradebook$/ },
    { name: "reports_individual_page", notTeacher: true, dependencies: ["vue","reportRuntime"], routes: [/^\/$/, /^\/courses\/[0-9]+\/grades(?:\/[0-9]+)?$/] },
    { name: "reports_individual_page", teacher: true, dependencies: ["vue","reportRuntime"], routes: [/^\/courses\/[0-9]+\/users\/[0-9]+$/, /^\/accounts\/[0-9]+\/users\/[0-9]+$/, /^\/users\/[0-9]+$/, /^\/courses\/[0-9]+\/grades\/[0-9]+$/] },
    { name: "rubrics_attempts_data", departments: [3824], routes: [/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/, /^\/courses\/[0-9]+\/gradebook\/speed_grader/] },
    { name: "rubrics_gen_comment", departments: [3824], routes: [/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/, /^\/courses\/[0-9]+\/gradebook\/speed_grader/] },
    { name: "rubrics_upload_rubric_create_rubric_from_json", routes: /^\/courses\/[0-9]+\/rubrics$/ },
    { name: "sections_conclude_all", teacher: true, routes: /^\/courses\/[0-9]+\/sections\/[0-9]+/ },
    { name: "side_menus", priority: "critical" },
    { name: "sort_assignment_groups", routes: /assignments$/ },
    { name: "speed_grader_answer_key", routes: /^\/courses\/([0-9]+)\/gradebook\/speed_grader/ },
    { name: "speed_grader_next_submitted_assignment", routes: /^\/courses\/([0-9]+)\/gradebook\/speed_grader/ },
    { name: "speed_grader_split_screen", teacher: true, routes: /^\/courses\/[0-9]+\/gradebook\/speed_grader/ },
    { name: "transfer_navigation", teacher: true, routes: /^\/courses\/[0-9]+\/settings/ },
    { name: "welcome_banner", priority: "critical", teacher: false, routes: /^\/$/ }
  ];

  function needsDepartment(entry) { return Boolean(entry.departments); }

  function resolveCourseDepartment() {
    if (!window.CURRENT_COURSE_ID || typeof $ === 'undefined') return Promise.resolve();
    return $.get('/api/v1/courses/' + window.CURRENT_COURSE_ID)
      .then(function (course) { window.CURRENT_DEPARTMENT_ID = course.account_id; })
      .catch(function (error) { console.error('[BTECH v2] Course context failed:', error); });
  }

  function start() {
    addCourseBanner();
    var critical = features.filter(function (entry) { return entry.priority === 'critical' && allowed(entry); });
    critical.forEach(loadFeature);

    var remaining = features.filter(function (entry) { return entry.priority !== 'critical'; });
    var immediate = remaining.filter(function (entry) { return !needsDepartment(entry) && allowed(entry); });
    immediate.forEach(loadFeature);

    if (remaining.some(needsDepartment) && window.CURRENT_COURSE_ID) {
      resolveCourseDepartment().then(function () {
        remaining.filter(function (entry) { return needsDepartment(entry) && allowed(entry); }).forEach(loadFeature);
      });
    }
  }

  window.BTECH_CANVAS_V2 = { start: start, loadFeature: loadFeature, features: features };
}());
