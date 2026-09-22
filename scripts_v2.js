/* Canvas feature manager v2. Loaded by custom_canvas_v2.js. */
(function () {
  'use strict';

  var assetBase = window.SOURCE_URL || 'https://bridgetools.dev/canvas';
  var loaded = new Map();
  var route = window.location.pathname;

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
    api3: function () { return loadScript('https://reports.bridgetools.dev/scripts.js', 'API3 client'); },
    reportRuntime: function () {
      // Keep the legacy order where graphs may rely on report-runtime globals.
      return dependencies.api3()
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
      .then(function () { return loadScript(assetBase + '/custom_features/' + entry.name + '.js', entry.name); })
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

  // Entries retain an explicit priority. Critical entries are requested before
  // any optional dependency or account lookup begins.
  var features = [
    { name: 'welcome_banner', routes: /^\/$/, priority: 'critical' },
    { name: 'side_menus', priority: 'critical' },
    { name: 'page_formatting/ai_hub/ai_hub', routes: /^\/courses\/[0-9]+(?:\/.*)?$/, courseIds: [621895], teacher: true, priority: 'critical' },
    { name: 'page_formatting/isd_hub/isd_hub', routes: /^\/courses\/[0-9]+(?:\/.*)?$/, courseIds: [632661], teacher: true, priority: 'critical' },
    { name: 'page_formatting/isd_hub/gradebook', routes: [/^\/courses\/[0-9]+\/grades(?:\/[0-9]+)?$/, /^\/courses\/[0-9]+\/gradebook\/[0-9]+/], courseIds: [632661], teacher: true, priority: 'critical' },
    { name: 'modules/enrollment_dates_student_external', routes: /^\/courses\/[0-9]+(?:\/modules)?$/, priority: 'critical' },
    { name: 'login_page', routes: /^\/login/, priority: 'critical' },
    { name: 'page_formatting/content_image_zoom', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)\/(?!.+?\/edit$).+/, priority: 'critical' },
    { name: 'img-zoom', routes: /users/, priority: 'critical' },
    { name: 'copy_to_next_year', routes: /^\/accounts\/[0-9]+$/, isd: true },
    { name: 'reports/automations/report', routes: /^\/automations$/, dependencies: ['vue', 'reportRuntime'] },
    { name: 'inbox-prefill/inbox-prefill', routes: /^\/conversations$/, isd: true },
    { name: 'dashboard/studentsNearCompletion', routes: /^\/$/, teacher: true, dependencies: ['vue'] },
    { name: 'reports/grades_page/report', routes: /^\/$/, teacher: true, dependencies: ['vue', 'reportRuntime'] },
    { name: 'reports/combined/report', routes: /^\/$/, teacher: true, dependencies: ['vue', 'reportRuntime'] },
    { name: 'reports/reporting_v3/main', routes: /external_tools\/110980/, isd: true, dependencies: ['vue', 'reportRuntime'] },
    { name: 'modules/enrollment_dates_teacher', routes: /^\/courses\/[0-9]+\/users\/[0-9]+$/ },
    { name: 'kaltura/showInfo', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: 'modules/module_weight', routes: /^\/courses\/[0-9]+(?:\/modules)?$/, dependencies: ['api3'] },
    { name: 'quizzes/show_analytics', routes: /^\/courses\/[0-9]+\/quizzes\/[0-9]+/, teacher: true },
    { name: 'quizzes/printing_accessibility', routes: /^\/courses\/[0-9]+\/quizzes\/[0-9]+\/take/, teacher: true },
    { name: 'modules/show_undelete', routes: /^\/courses\/[0-9]+(?:\/modules)?$/, teacher: true },
    { name: 'sections/conclude_all', routes: /^\/courses\/[0-9]+\/sections\/[0-9]+/, teacher: true },
    { name: 'transfer_navigation', routes: /^\/courses\/[0-9]+\/settings/, teacher: true },
    { name: 'files/usage', routes: /^\/courses\/[0-9]+\/files/ },
    { name: 'page_formatting/tinymce_font_size', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)\/.+?\/edit/, dependencies: ['select2'] },
    { name: 'editor_toolbar/toolbar', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/, dependencies: ['vue', 'select2'] },
    { name: 'editor_toolbar/basics', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)\/.+?\/edit/ },
    { name: 'page_formatting/dropdown_from_table', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: 'page_formatting/tabs_from_table', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: 'page_formatting/expandable_from_table', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: 'page_formatting/google_sheets_table', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: 'page_formatting/table_from_page', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: 'page_formatting/image_map', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: 'page_formatting/image_formatting', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: 'editor_toolbar/images', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: 'editor_toolbar/headers', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/, dependencies: ['select2'] },
    { name: 'page_formatting/print_rubric', routes: /^\/courses\/[0-9]+\/assignments/ },
    { name: 'hs_section_adder', routes: /^\/accounts\/[0-9]+$/, isd: true },
    { name: 'reports/individual_page/report', routes: [/^\/$/, /^\/courses\/[0-9]+\/grades(?:\/[0-9]+)?$/], notTeacher: true, dependencies: ['vue', 'reportRuntime'] },
    { name: 'files/restore_images', routes: /^\/courses\/[0-9]+/, teacher: true },
    { name: 'reports/grades_page/report', routes: /^\/courses\/[0-9]+\/gradebook$/, teacher: true, dependencies: ['vue', 'reportRuntime'] },
    { name: 'modules/course_readiness', routes: /^\/courses\/[0-9]+(?:\/modules)?$/, teacher: true },
    { name: 'reports/individual_page/report', routes: [/^\/courses\/[0-9]+\/users\/[0-9]+$/, /^\/accounts\/[0-9]+\/users\/[0-9]+$/, /^\/courses\/[0-9]+\/grades\/[0-9]+$/, /^\/users\/[0-9]+$/], teacher: true, dependencies: ['vue', 'reportRuntime'] },
    { name: 'password_reset', routes: [/^\/courses\/[0-9]+\/users\/[0-9]+$/, /^\/accounts\/[0-9]+\/users\/[0-9]+$/, /^\/users\/[0-9]+$/] },
    { name: 'distance/approved-button', routes: /^\/courses\/[0-9]+(?:\/modules)?$/ },
    { name: 'quizzes/upload_questions/upload_questions', routes: /\/courses\/([0-9]+)\/question_banks$/ },
    { name: 'rubrics/upload_rubric/create_rubric_from_json', routes: /^\/courses\/[0-9]+\/rubrics$/ },
    { name: 'quizzes/duplicate_bank_item', routes: /\/courses\/([0-9]+)\/question_banks\/([0-9]+)/ },
    { name: 'quizzes/quiz_analytics_print_margin', routes: /^\/courses\/[0-9]+\/quizzes\/[0-9]+\/statistics/ },
    { name: 'speed_grader/next_submitted_assignment', routes: /^\/courses\/([0-9]+)\/gradebook\/speed_grader/ },
    { name: 'speed_grader/answer_key', routes: /^\/courses\/([0-9]+)\/gradebook\/speed_grader/ },
    { name: 'highlight_comments_same_date', routes: [/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/, /^\/courses\/[0-9]+\/gradebook\/speed_grader/] },
    { name: 'report_broken_content', routes: /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/ },
    { name: 'grades_page/highlighted_grades_page_items', routes: /^\/courses\/[0-9]+\/grades\/[0-9]+/ },
    { name: 'grades_page/attempts', routes: /^\/courses\/[0-9]+\/grades\/[0-9]+/ },
    { name: 'quizzes/question_bank_sorter', routes: /^\/courses\/[0-9]+\/quizzes\/[0-9]+\/edit/ },
    { name: 'sort_assignment_groups', routes: /assignments$/ },
    { name: 'reports/accreditation-2', routes: /^\/courses\/([0-9]+)\/external_tools\/([0-9]+)/, dependencies: ['vue'] },
    { name: 'page_formatting/prep_parts_lists_for_sharing', routes: /^\/courses\/[0-9]+\/pages\/parts-list-master/, blueprint: true, course: true },
    { name: 'blueprint_association_links', blueprint: true, course: true },
    { name: 'modules/delete_module_items', routes: /^\/courses\/[0-9]+(?:\/modules)?$/, isd: true },
    { name: 'speed_grader/split_screen', routes: /^\/courses\/[0-9]+\/gradebook\/speed_grader/, teacher: true },
    { name: 'people_page/instructor_add_remove_guide', routes: /^\/courses\/[0-9]+\/users$/, teacher: true },
    { name: 'department_specific/phrm_import_cartridges', routes: /^\/courses\/[0-9]+(?:\/modules)?$/, departments: [3945], teacher: true },
    { name: 'department_specific/replace_course_code_with_name', routes: /^\/courses\/[0-9]+/, departments: [3827] },
    { name: 'department_specific/data_analytics_feedback_report', routes: /^\/courses\/[0-9]+(?:\/modules)?$/, departments: [4218] },
    { name: 'rubrics/attempts_data', routes: [/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/, /^\/courses\/[0-9]+\/gradebook\/speed_grader/], departments: [3824] },
    { name: 'rubrics/gen_comment', routes: [/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/, /^\/courses\/[0-9]+\/gradebook\/speed_grader/], departments: [3824] },
    { name: 'department_specific/business_hs', departments: [3833] },
    { name: 'previous-enrollment-data/previous_enrollment_period_grades', departments: [3833] },
    { name: 'remove_former_employees', routes: /^\/(?:accounts\/[0-9]+\/)?users\/[0-9]+/, rootAdmin: true }
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
