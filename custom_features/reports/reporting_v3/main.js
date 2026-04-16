// reports/reporting_v3/main.js
(async function () {
  const VERSION = Date.now();
  const BASE_PATH = "/custom_features/reports/reporting_v3";
  const TEMPLATE_URL = `${SOURCE_URL}${BASE_PATH}/template.vue?v=${VERSION}`;
  const UTILS_URL = `${SOURCE_URL}${BASE_PATH}/utils.js?v=${VERSION}`;
  const REPORTS_URL = `${SOURCE_URL}${BASE_PATH}/reports.json?v=${VERSION}`;
  const TABLE_COMPONENT_URL = `${SOURCE_URL}${BASE_PATH}/components/reports-v3-table.js?v=${VERSION}`;
  const REPORT_COMPONENT_URLS = [
    `${SOURCE_URL}${BASE_PATH}/reports/reporting-v3-shell.js?v=${VERSION}`,
    `${SOURCE_URL}${BASE_PATH}/reports/reports-v3-programs-cpl.js?v=${VERSION}`,
    `${SOURCE_URL}${BASE_PATH}/reports/reporting-v3-programs.js?v=${VERSION}`
  ];
  const SETTINGS_NAMESPACE = "edu.btech.canvas.reporting_v3";
  const SETTINGS_KEY = "reporting_v3";
  const ROOT_ID = "canvas-reporting-v3-vue";
  const BUTTON_ID = "canvas-reporting-v3-gen";
  const BUTTON_LABEL = "Reports V3";

  await $.getScript(UTILS_URL);

  const utils = window.ReportingV3Utils;

  function createOpenButton() {
    return utils.createButton(BUTTON_ID, BUTTON_LABEL, function () {
      $(`#${ROOT_ID}`).show();
    });
  }

  async function loadReportTypes() {
    const payload = await utils.fetchJson(REPORTS_URL);
    return Array.isArray(payload?.reportTypes) ? payload.reportTypes : [];
  }

  async function postLoad() {
    const vueString = (await utils.fetchText(TEMPLATE_URL))
      .replace("<template>", "")
      .replace("</template>", "");

    if ($(`#${ROOT_ID}`).length === 0) {
      $("#application").after(`<div id="${ROOT_ID}"></div>`);
    }

    $(`#${ROOT_ID}`).html(vueString).hide();

    const container = $("#right-side");
    utils.ensureButton(container, BUTTON_ID, createOpenButton);

    if (container.length) {
      const observer = new MutationObserver(function () {
        utils.ensureButton(container, BUTTON_ID, createOpenButton);
      });
      observer.observe(container[0], { childList: true, subtree: false });
    }

    const reportTypes = await loadReportTypes();

    new Vue({
      el: `#${ROOT_ID}`,

      data: function () {
        return {
          loading: true,
          reportTypes,
          settings: utils.getDefaultSettings(reportTypes),
          programs: [],
          sharedLoading: {
            programs: false
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
          return Array.isArray(this.currentReportMeta?.filters) ? this.currentReportMeta.filters : [];
        },

        currentFilterControls() {
          const filterKeys = this.currentNeedsAcademicYear
            ? ["academic_year", ...this.currentFilters]
            : this.currentFilters.slice();

          return filterKeys.map((filterKey) => this.buildFilterControl(filterKey)).filter(Boolean);
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

        currentNeedsAcademicYear() {
          return !!this.currentSubMenuMeta?.filter_by_year;
        },

        currentViewProps() {
          const props = {
            reportMeta: this.currentReportMeta,
            subMenu: this.currentSubKey,
            settings: this.settings,
            selectedFilters: this.settings.filters || {},
            sharedLoading: this.sharedLoading
          };

          if (this.currentFilters.includes("programs")) {
            props.programs = this.programs;
          }

          return props;
        },

        currentNeedsPrograms() {
          return this.currentFilters.includes("programs");
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

        async ensureSharedFilterData() {
          if (this.currentNeedsPrograms) {
            await this.loadPrograms();
            this.pruneFilterSelection("programs");
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

        pruneFilterSelection(filterKey) {
          if (filterKey !== "programs") return;

          const selected = String(this.settings?.filters?.programs || "");
          if (!selected) return;

          const valid = this.getProgramFilterOptions().some((option) => option.value === selected);
          if (!valid) {
            this.$set(this.settings.filters, "programs", "");
          }
        },

        async persistSettings() {
          await utils.saveUserSettings(SETTINGS_NAMESPACE, SETTINGS_KEY, this.settings);
        },

        async onReportChange() {
          this.settings = utils.normalizeSettings(this.settings, this.reportTypes);
          this.ensureAcademicYearFilter();
          await this.ensureSharedFilterData();
          await this.persistSettings();
        },

        async setSubMenu(value) {
          const type = this.currentReportMeta?.value;
          if (!type) return;

          this.$set(this.settings.subMenuByType, type, value);
          this.ensureAcademicYearFilter();
          this.pruneFilterSelection("programs");
          await this.persistSettings();
        },

        async updateFilterValue(filterKey, value) {
          this.$set(this.settings.filters, filterKey, value);
          if (filterKey === "academic_year") {
            this.pruneFilterSelection("programs");
          }
          await this.persistSettings();
        },

        ensureAcademicYearFilter() {
          if (!this.currentNeedsAcademicYear) return;

          const validYears = new Set(this.academicYearOptions.map((option) => option.value));
          const currentValue = String(this.settings?.filters?.academic_year || "");

          if (!validYears.has(currentValue)) {
            this.$set(this.settings.filters, "academic_year", String(this.currentYear));
          }
        },

        async drillToReport(payload) {
          const nextType = String(payload?.report || "").trim();
          const nextSubMenu = String(payload?.subMenu || "").trim();
          if (!nextType) return;

          this.settings.reportType = nextType;

          if (nextSubMenu) {
            this.$set(this.settings.subMenuByType, nextType, nextSubMenu);
          }

          await this.onReportChange();
        },

        close() {
          $(`#${ROOT_ID}`).hide();
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
      }
    });
  }

  async function init() {
    utils.loadCSS("https://reports.bridgetools.dev/department_report/style/main.css");
    utils.loadCSS("https://reports.bridgetools.dev/style/main.css");

    if (!window.Vue) {
      await utils.loadScriptOnce("https://bridgetools.dev/canvas/external-libraries/vue.2.6.12.js");
    }
    await utils.loadScriptOnce(TABLE_COMPONENT_URL);
    for (const url of REPORT_COMPONENT_URLS) {
      await utils.loadScriptOnce(url);
    }

    await postLoad();
  }

  await init();
})();
