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

  function loadModule(url, label) {
    var key = 'module:' + url;
    if (loaded.has(key)) return loaded.get(key);
    var promise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.type = 'module';
      script.src = assetUrl(url);
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
      .then(function () { return loadModule(assetBase + '/custom_features_v2/' + entry.name + '/main.js', entry.name); })
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
