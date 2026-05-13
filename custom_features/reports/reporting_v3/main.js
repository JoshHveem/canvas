// reports/reporting_v3/main.js
(async function () {
  console.log("LOAD REPORTING V3 MAIN JS");
  const VERSION = Date.now();
  const BASE_PATH = "/custom_features/reports/reporting_v3";
  const TEMPLATE_URL = `${SOURCE_URL}${BASE_PATH}/template.vue?v=${VERSION}`;
  const UTILS_URL = `${SOURCE_URL}${BASE_PATH}/utils.js?v=${VERSION}`;
  const REPORTS_URL = `${SOURCE_URL}${BASE_PATH}/reports.json?v=${VERSION}`;
  const TABLE_COMPONENT_URL = `${SOURCE_URL}${BASE_PATH}/components/reports-v3-table.js?v=${VERSION}`;
  const SEGMENTED_BAR_COMPONENT_URL = `${SOURCE_URL}${BASE_PATH}/components/reports-v3-segmented-bar.js?v=${VERSION}`;
  const SETTINGS_NAMESPACE = "edu.btech.canvas.reporting_v3";
  const SETTINGS_KEY = "reporting_v3";
  const ROOT_ID = "canvas-reporting-v3-vue";

  await $.getScript(UTILS_URL);

  const utils = window.ReportingV3Utils;

  async function loadReportTypes() {
    const payload = await utils.fetchJson(REPORTS_URL);
    return Array.isArray(payload?.reportTypes) ? payload.reportTypes : [];
  }

  function getComponentScriptUrl(componentName, groupName) {
    const name = String(componentName || "").trim();
    if (!name) return "";

    const group = String(groupName || "").trim();
    const folder = group ? `${group}/` : "";

    return `${SOURCE_URL}${BASE_PATH}/reports/${folder}${name}.js?v=${VERSION}`;
  }

  function getReportComponentScripts(reportTypes) {
    const scripts = [];
    const seen = new Set();

    function addScript(componentName, groupName, required) {
      const component = String(componentName || "").trim();
      const url = getComponentScriptUrl(component, groupName);
      if (!url || seen.has(url)) return;

      seen.add(url);
      scripts.push({
        url,
        name: component,
        required: !!required
      });
    }

    (Array.isArray(reportTypes) ? reportTypes : []).forEach((report) => {
      addScript(report?.component, "", true);

      if (Array.isArray(report?.subMenus)) {
        report.subMenus.forEach((subMenu) => {
          const views = utils.getReportViews(subMenu);
          views.forEach((view) => addScript(view?.component, report?.value, false));
        });
      }
    });

    return scripts;
  }

  async function postLoad(reportTypes) {
    const vueString = (await utils.fetchText(TEMPLATE_URL))
      .replace("<template>", "")
      .replace("</template>", "");

    const contentRoot = $("#content");
    if (!contentRoot.length) {
      throw new Error('Reporting V3 could not find div#content to mount into.');
    }

    contentRoot.empty().append(`<div id="${ROOT_ID}"></div>`);
    $(`#${ROOT_ID}`).html(vueString);

    new Vue({
      el: `#${ROOT_ID}`,

      data: function () {
        return {
          loading: true,
          reportTypes,
          settings: utils.getDefaultSettings(reportTypes),
          sidebarTab: "reports",
          reportShellHeight: "600px",
          programs: [],
          avps: [],
          viewFilterControls: [],
          openMultiFilterKey: "",
          sharedLoading: {
            programs: false,
            avps: false
          }
        };
      },

      computed: {
        currentYear() {
          return new Date().getFullYear();
        },

        currentReportMeta() {
          const fallback = this.reportTypes[0] || {};
          return this.reportTypes.find((report) => report.value === this.settings.reportType) || fallback;
        },

        currentFilters() {
          if (Array.isArray(this.currentViewMeta?.filters)) {
            return this.currentViewMeta.filters;
          }

          if (Array.isArray(this.currentSubMenuMeta?.filters)) {
            return this.currentSubMenuMeta.filters;
          }

          return Array.isArray(this.currentReportMeta?.filters) ? this.currentReportMeta.filters : [];
        },

        currentFilterControls() {
          const filterKeys = this.currentNeedsAcademicYear
            ? ["academic_year", ...this.currentFilters]
            : this.currentFilters.slice();

          return filterKeys.map((filterKey) => this.buildFilterControl(filterKey)).filter(Boolean);
        },

        allFilterControls() {
          return [
            ...this.currentFilterControls,
            ...(Array.isArray(this.viewFilterControls) ? this.viewFilterControls : [])
          ];
        },

        currentSubMenus() {
          return this.currentReportMeta?.subMenus || [];
        },

        currentSubKey() {
          const reportType = this.currentReportMeta?.value;
          const saved = this.settings?.subMenuByType?.[reportType];
          const hasSaved = this.currentSubMenus.some((menu) => menu.value === saved);

          if (hasSaved) return saved;
          return this.currentSubMenus[0]?.value || "";
        },

        currentSubMenuMeta() {
          return this.currentSubMenus.find((menu) => menu.value === this.currentSubKey) || this.currentSubMenus[0] || {};
        },

        currentViews() {
          return utils.getReportViews(this.currentSubMenuMeta);
        },

        currentViewSettingsKey() {
          return utils.getViewSettingsKey(this.currentReportMeta?.value, this.currentSubMenuMeta?.value);
        },

        currentViewKey() {
          const saved = this.settings?.viewByReport?.[this.currentViewSettingsKey];
          const hasSaved = this.currentViews.some((view) => view.value === saved);

          if (hasSaved) return saved;
          return this.currentViews[0]?.value || "";
        },

        currentViewMeta() {
          return this.currentViews.find((view) => view.value === this.currentViewKey) || this.currentViews[0] || {};
        },

        currentNeedsAcademicYear() {
          if (Object.prototype.hasOwnProperty.call(this.currentViewMeta || {}, "filter_by_year")) {
            return !!this.currentViewMeta.filter_by_year;
          }

          return !!this.currentSubMenuMeta?.filter_by_year;
        },

        currentViewProps() {
          const props = {
            reportMeta: this.currentReportMeta,
            subMenu: this.currentSubKey,
            currentView: this.currentViewKey,
            settings: this.settings,
            selectedFilters: this.settings.filters || {},
            sharedLoading: this.sharedLoading
          };

          if (this.currentFilters.includes("programs")) {
            props.programs = this.programs;
          }

          if (this.currentFilters.includes("avps")) {
            props.avps = this.avps;
          }

          return props;
        },

        currentNeedsPrograms() {
          return this.currentFilters.includes("programs");
        },

        currentNeedsAvps() {
          return this.currentFilters.includes("avps");
        },

        academicYearOptions() {
          return Array.from({ length: 5 }, (_, index) => {
            const year = this.currentYear - index;
            return {
              value: String(year),
              label: String(year)
            };
          });
        }
      },

      methods: {
        async loadPrograms() {
          if (this.sharedLoading.programs) return;
          if (Array.isArray(this.programs) && this.programs.length) return;

          this.sharedLoading.programs = true;

          try {
            const response = await bridgetools.req3("programs", {
              academic_year: { op: ">=", value: 2021 }
            });

            this.programs = Array.isArray(response?.data) ? response.data : [];
          } catch (error) {
            console.error("Failed to load programs", error);
            this.programs = [];
          } finally {
            this.sharedLoading.programs = false;
          }
        },

        async loadAvps() {
          if (this.sharedLoading.avps) return;
          if (Array.isArray(this.avps) && this.avps.length) return;

          this.sharedLoading.avps = true;

          try {
            const response = await bridgetools.req3("avps");
            console.log("[Reporting V3] loadAvps response", response);
            console.log("[Reporting V3] loadAvps response.data", response?.data);
            this.avps = Array.isArray(response?.data) ? response.data : [];
            console.log("[Reporting V3] normalized avps list", this.avps);
          } catch (error) {
            console.error("Failed to load avps", error);
            this.avps = [];
          } finally {
            this.sharedLoading.avps = false;
          }
        },

        async ensureSharedFilterData() {
          if (this.currentNeedsPrograms) {
            await this.loadPrograms();
            this.pruneFilterSelection("programs");
          }

          if (this.currentNeedsAvps) {
            await this.loadAvps();
            this.pruneFilterSelection("avps");
          }
        },

        buildFilterControl(filterKey) {
          if (filterKey === "academic_year") {
            return {
              key: "academic_year",
              label: "Academic Year",
              placeholder: "Select Year",
              options: this.academicYearOptions,
              value: String(this.settings?.filters?.academic_year || this.currentYear),
              disabled: false
            };
          }

          if (filterKey === "programs") {
            return {
              key: "programs",
              label: "Program",
              placeholder: "All Programs",
              options: this.getProgramFilterOptions(),
              value: String(this.settings?.filters?.programs || ""),
              disabled: this.sharedLoading.programs
            };
          }

          if (filterKey === "avps") {
            return {
              key: "avps",
              label: "AVP",
              placeholder: "All AVPs",
              options: this.getAvpFilterOptions(),
              value: String(this.settings?.filters?.avps || ""),
              disabled: this.sharedLoading.avps
            };
          }

          return null;
        },

        getProgramFilterOptions() {
          const list = Array.isArray(this.programs) ? this.programs : [];
          const selectedYear = Number(this.settings?.filters?.academic_year || 0);
          const byCode = new Map();

          for (const program of list) {
            const code = String(program?.program_code || "").trim();
            if (!code) continue;

            if (this.currentNeedsAcademicYear && selectedYear && Number(program?.academic_year) !== selectedYear) {
              continue;
            }

            const existing = byCode.get(code);
            const next = {
              value: code,
              label: `${String(program?.program_name || code).trim()} (${code})`,
              academicYear: Number(program?.academic_year || 0)
            };

            if (!existing || next.academicYear > existing.academicYear) {
              byCode.set(code, next);
            }
          }

          return Array.from(byCode.values())
            .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
            .map(({ value, label }) => ({ value, label }));
        },

        getAvpFilterOptions() {
          const list = Array.isArray(this.avps) ? this.avps : [];
          const bySisId = new Map();

          for (const avp of list) {
            const sisUserId = String(avp?.avp_sis_user_id || "").trim();
            if (!sisUserId) continue;

            bySisId.set(sisUserId, {
              value: sisUserId,
              label: String(avp?.name || sisUserId).trim()
            });
          }

          return Array.from(bySisId.values()).sort((a, b) =>
            a.label.localeCompare(b.label, undefined, { numeric: true })
          );
        },

        pruneFilterSelection(filterKey) {
          if (filterKey !== "programs" && filterKey !== "avps") return;

          const selected = String(this.settings?.filters?.[filterKey] || "");
          if (!selected) return;

          const options = filterKey === "programs" ? this.getProgramFilterOptions() : this.getAvpFilterOptions();
          const valid = options.some((option) => option.value === selected);
          if (!valid) {
            this.$set(this.settings.filters, filterKey, "");
          }
        },

        async persistSettings() {
          await utils.saveUserSettings(SETTINGS_NAMESPACE, SETTINGS_KEY, this.settings);
        },

        clearViewFilterControls() {
          this.viewFilterControls = [];
          this.openMultiFilterKey = "";
        },

        setViewFilterControls(controls) {
          this.viewFilterControls = Array.isArray(controls) ? controls : [];
        },

        async onReportChange() {
          this.clearViewFilterControls();
          this.settings = utils.normalizeSettings(this.settings, this.reportTypes);
          this.ensureAcademicYearFilter();
          await this.ensureSharedFilterData();
          await this.persistSettings();
        },

        async setSubMenu(value) {
          const type = this.currentReportMeta?.value;
          if (!type) return;

          this.clearViewFilterControls();
          this.$set(this.settings.subMenuByType, type, value);
          this.ensureCurrentView();
          this.ensureAcademicYearFilter();
          this.pruneFilterSelection("programs");
          this.pruneFilterSelection("avps");
          await this.persistSettings();
        },

        async setView(value) {
          if (!this.currentViewSettingsKey) return;

          this.clearViewFilterControls();
          this.$set(this.settings.viewByReport, this.currentViewSettingsKey, value);
          this.ensureAcademicYearFilter();
          this.pruneFilterSelection("programs");
          this.pruneFilterSelection("avps");
          await this.persistSettings();
        },

        async updateFilterValue(filterKey, value) {
          this.$set(this.settings.filters, filterKey, value);
          if (filterKey === "academic_year") {
            this.pruneFilterSelection("programs");
            this.pruneFilterSelection("avps");
          }
          await this.persistSettings();
        },

        getFilterArrayValue(filterKey) {
          const value = this.settings?.filters?.[filterKey];
          return Array.isArray(value) ? value : [];
        },

        isMultiFilterOptionSelected(filter, value) {
          return this.getFilterArrayValue(filter?.key).includes(value);
        },

        async updateMultiFilterValue(filterKey, optionValue, selected) {
          const current = this.getFilterArrayValue(filterKey);
          const next = selected
            ? Array.from(new Set([...current, optionValue]))
            : current.filter((value) => value !== optionValue);

          this.$set(this.settings.filters, filterKey, next);
          await this.persistSettings();
        },

        async clearMultiFilterValue(filterKey) {
          this.$set(this.settings.filters, filterKey, []);
          await this.persistSettings();
        },

        toggleMultiFilter(filterKey) {
          this.openMultiFilterKey = this.openMultiFilterKey === filterKey ? "" : filterKey;
        },

        isMultiFilterOpen(filterKey) {
          return this.openMultiFilterKey === filterKey;
        },

        multiFilterLabel(filter) {
          const count = this.getFilterArrayValue(filter?.key).length;
          if (!count) return filter?.placeholder || "Select options";
          if (count === 1) return "1 selected";
          return `${count} selected`;
        },

        updateReportShellHeight() {
          const root = this.$refs?.reportShell || this.$el;
          const top = root?.getBoundingClientRect ? root.getBoundingClientRect().top : 0;
          const available = Math.max(420, window.innerHeight - top - 16);

          this.reportShellHeight = `${Math.floor(available)}px`;
        },

        ensureAcademicYearFilter() {
          if (!this.currentNeedsAcademicYear) return;

          const validYears = new Set(this.academicYearOptions.map((option) => option.value));
          const currentValue = String(this.settings?.filters?.academic_year || "");

          if (!validYears.has(currentValue)) {
            this.$set(this.settings.filters, "academic_year", String(this.currentYear));
          }
        },

        ensureCurrentView() {
          const firstView = this.currentViews[0];
          if (!this.currentViewSettingsKey || !firstView) return;

          const saved = this.settings?.viewByReport?.[this.currentViewSettingsKey];
          const hasSaved = this.currentViews.some((view) => view.value === saved);
          if (!hasSaved) {
            this.$set(this.settings.viewByReport, this.currentViewSettingsKey, firstView.value);
          }
        },

        async drillToReport(payload) {
          const nextType = String(payload?.report || "").trim();
          const nextSubMenu = String(payload?.subMenu || "").trim();
          const nextView = String(payload?.view || "").trim();
          if (!nextType) return;

          this.settings.reportType = nextType;
          this.clearViewFilterControls();

          if (nextSubMenu) {
            this.$set(this.settings.subMenuByType, nextType, nextSubMenu);
          }

          if (nextSubMenu && nextView) {
            this.$set(this.settings.viewByReport, utils.getViewSettingsKey(nextType, nextSubMenu), nextView);
          }

          await this.onReportChange();
        }
      },

      async mounted() {
        const loadedSettings = await utils.loadUserSettings(
          SETTINGS_NAMESPACE,
          SETTINGS_KEY,
          utils.getDefaultSettings(this.reportTypes)
        );

        this.settings = utils.normalizeSettings(loadedSettings, this.reportTypes);
        this.ensureAcademicYearFilter();
        await this.ensureSharedFilterData();
        this.loading = false;
        this.$nextTick(this.updateReportShellHeight);
        window.addEventListener("resize", this.updateReportShellHeight);
      },

      beforeDestroy() {
        window.removeEventListener("resize", this.updateReportShellHeight);
      }
    });
  }

  async function init() {
    utils.loadCSS("https://reports.bridgetools.dev/department_report/style/main.css");
    utils.loadCSS("https://reports.bridgetools.dev/style/main.css");

    if (!window.Vue) {
      await utils.loadScriptOnce("https://bridgetools.dev/canvas/external-libraries/vue.2.6.12.js");
    }

    const reportTypes = await loadReportTypes();
    const reportComponentScripts = getReportComponentScripts(reportTypes);

    await utils.loadScriptOnce(TABLE_COMPONENT_URL);
    await utils.loadScriptOnce(SEGMENTED_BAR_COMPONENT_URL);
    for (const script of reportComponentScripts) {
      try {
        await utils.loadScriptOnce(script.url);
      } catch (error) {
        if (script.required) {
          throw error;
        }

        console.warn(`Skipping optional report component script "${script.name}"`, error);
      }
    }

    await postLoad(reportTypes);
  }

  try {
    await init();
  } catch (error) {
    console.error("Reporting V3 failed to initialize", error);
  }
})();
