(function () {
  const loadedScripts = new Set();

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  async function loadScriptOnce(url) {
    if (loadedScripts.has(url)) return;
    await $.getScript(url);
    loadedScripts.add(url);
  }

  function loadCSS(url) {
    const style = document.createElement("link");
    const head = document.head || document.getElementsByTagName("head")[0];
    style.href = url;
    style.type = "text/css";
    style.rel = "stylesheet";
    style.media = "screen,print";
    head.insertBefore(style, head.firstChild);
  }

  async function fetchText(url) {
    let value = "";

    await $.get(
      url,
      null,
      function (text) {
        value = text;
      },
      "text"
    );

    return value;
  }

  async function fetchJson(url) {
    return await $.ajax({
      url,
      method: "GET",
      dataType: "json"
    });
  }

  function getDefaultSettings(reports) {
    const firstReport = reports[0] || {};
    const firstSubMenu = (firstReport.subMenus || [])[0];
    const firstView = getFirstView(firstSubMenu);

    return {
      reportType: firstReport.value || "",
      subMenuByType: firstSubMenu && firstReport.value
        ? { [firstReport.value]: firstSubMenu.value }
        : {},
      viewByReport: firstView && firstReport.value && firstSubMenu?.value
        ? { [getViewSettingsKey(firstReport.value, firstSubMenu.value)]: firstView.value }
        : {},
      globalAcademicYear: "",
      filters: {}
    };
  }

  function getReportViews(report) {
    if (Array.isArray(report?.views) && report.views.length) {
      return report.views;
    }

    const component = String(report?.component || "").trim();
    if (!component) return [];

    return [
      {
        value: "initial",
        label: "Initial View",
        component,
        source: report?.source,
        include: report?.include,
        filters: report?.filters,
        filter_by_year: report?.filter_by_year
      }
    ];
  }

  function getFirstView(report) {
    return getReportViews(report)[0] || null;
  }

  function getViewSettingsKey(reportType, reportValue) {
    return `${String(reportType || "").trim()}::${String(reportValue || "").trim()}`;
  }

  function normalizeSettings(settings, reports) {
    const normalized = Object.assign({}, getDefaultSettings(reports), settings || {});

    if (!normalized.reportType) {
      normalized.reportType = reports[0]?.value || "";
    }

    if (!normalized.subMenuByType || typeof normalized.subMenuByType !== "object") {
      normalized.subMenuByType = {};
    }

    if (!normalized.viewByReport || typeof normalized.viewByReport !== "object") {
      normalized.viewByReport = {};
    }

    if (!normalized.filters || typeof normalized.filters !== "object") {
      normalized.filters = {};
    }

    const normalizedGlobalAcademicYear = String(
      normalized.globalAcademicYear || normalized.filters.academic_year || ""
    ).trim();
    normalized.globalAcademicYear = normalizedGlobalAcademicYear;
    if (normalizedGlobalAcademicYear) {
      normalized.filters.academic_year = normalizedGlobalAcademicYear;
    }

    const type = normalized.reportType;
    const report = reports.find((item) => item.value === type) || reports[0] || {};
    const firstSubMenu = (report.subMenus || [])[0];

    if (type && firstSubMenu && !normalized.subMenuByType[type]) {
      normalized.subMenuByType[type] = firstSubMenu.value;
    }

    const activeSubMenuValue = normalized.subMenuByType[type];
    const activeSubMenu = (report.subMenus || []).find((item) => item.value === activeSubMenuValue) || firstSubMenu;
    const firstView = getFirstView(activeSubMenu);
    const viewSettingsKey = getViewSettingsKey(type, activeSubMenu?.value);

    if (type && activeSubMenu?.value && firstView && !normalized.viewByReport[viewSettingsKey]) {
      normalized.viewByReport[viewSettingsKey] = firstView.value;
    }

    return normalized;
  }

  async function loadUserSettings(namespace, key, defaults) {
    const fallback = cloneJson(defaults);

    try {
      const resp = await $.get(`/api/v1/users/self/custom_data/${key}?ns=${namespace}`);
      const saved = resp?.data?.settings || {};
      return {
        reportType: saved.reportType || fallback.reportType,
        subMenuByType: Object.assign({}, fallback.subMenuByType, saved.subMenuByType || {}),
        viewByReport: Object.assign({}, fallback.viewByReport, saved.viewByReport || {}),
        globalAcademicYear: String(saved.globalAcademicYear || saved?.filters?.academic_year || fallback.globalAcademicYear || "").trim(),
        filters: Object.assign({}, fallback.filters, saved.filters || {})
      };
    } catch (err) {
      return fallback;
    }
  }

  async function saveUserSettings(namespace, key, settings) {
    await $.put(`/api/v1/users/self/custom_data/${key}?ns=${namespace}`, {
      data: { settings }
    });
  }

  function createButton(buttonId, buttonLabel, onClick) {
    const btn = $(`<a class="Button" id="${buttonId}">${buttonLabel}</a>`);
    const wrapper = $('<div style="position: relative; display: block;"></div>');

    btn.on("click", onClick);
    wrapper.append(btn);

    return wrapper;
  }

  function ensureButton(container, buttonId, createButtonFn) {
    if (!container || !container.length) return;
    if ($(`#${buttonId}`).length === 0) {
      container.append(createButtonFn());
    }
  }

  window.ReportingV3Utils = {
    cloneJson,
    createButton,
    ensureButton,
    fetchJson,
    fetchText,
    getDefaultSettings,
    getReportViews,
    getViewSettingsKey,
    loadCSS,
    loadScriptOnce,
    loadUserSettings,
    normalizeSettings,
    saveUserSettings
  };
})();
