// reports/reporting_v3/main.js
(async function () {
  const VERSION = Date.now();
  const BASE_PATH = "/custom_features/reports/reporting_v3";
  const TEMPLATE_URL = `${SOURCE_URL}${BASE_PATH}/template.vue?v=${VERSION}`;
  const UTILS_URL = `${SOURCE_URL}${BASE_PATH}/utils.js?v=${VERSION}`;
  const REPORTS_URL = `${SOURCE_URL}${BASE_PATH}/reports.json?v=${VERSION}`;
  const TABLE_COMPONENT_URL = `${SOURCE_URL}${BASE_PATH}/components/reports-v3-table.js?v=${VERSION}`;
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

  function registerBaseComponents() {
    Vue.component("reporting-v3-shell", {
      props: {
        reportMeta: {
          type: Object,
          default: function () {
            return {};
          }
        },
        subMenu: {
          type: String,
          default: ""
        },
        settings: {
          type: Object,
          default: function () {
            return {};
          }
        },
        selectedFilters: {
          type: Object,
          default: function () {
            return {};
          }
        },
        programs: {
          type: Array,
          default: function () {
            return [];
          }
        }
      },
      template: `
        <div class="btech-card btech-theme" style="padding:20px;">
          <div style="border:1px dashed #cbd5e1; border-radius:12px; padding:16px; background:#f8fafc;">
            <div style="font-weight:600; margin-bottom:6px;">Starting point</div>
            <div class="btech-muted" style="margin-bottom:12px;">
              Replace this component or add more registered report components as you build out reporting v3.
            </div>
            <pre style="margin:0; font-size:12px; line-height:1.5; white-space:pre-wrap;">{{ summary }}</pre>
          </div>
        </div>
      `,
      computed: {
        summary() {
          return JSON.stringify(
            {
              reportType: this.reportMeta.value || "",
              subMenu: this.subMenu || "",
              selectedFilters: this.selectedFilters || {},
              programsCount: Array.isArray(this.programs) ? this.programs.length : 0,
              savedSettings: this.settings || {}
            },
            null,
            2
          );
        }
      }
    });

    Vue.component("reporting-v3-programs", {
      props: {
        reportMeta: {
          type: Object,
          default: function () {
            return {};
          }
        },
        subMenu: {
          type: String,
          default: ""
        },
        settings: {
          type: Object,
          default: function () {
            return {};
          }
        },
        selectedFilters: {
          type: Object,
          default: function () {
            return {};
          }
        },
        programs: {
          type: Array,
          default: function () {
            return [];
          }
        },
        sharedLoading: {
          type: Object,
          default: function () {
            return {};
          }
        }
      },
      data() {
        return {
          cplPrograms: [],
          cplLoading: false,
          cplError: ""
        };
      },
      computed: {
        sections() {
          return Array.isArray(this.reportMeta?.subMenus) ? this.reportMeta.subMenus : [];
        },
        activeSection() {
          return this.sections.find((section) => section.value === this.subMenu) || this.sections[0] || null;
        },
        showCplView() {
          return this.subMenu === "completion";
        },
        summary() {
          return JSON.stringify(
            {
              reportType: this.reportMeta.value || "",
              subMenu: this.subMenu || "",
              sections: this.sections.map((section) => section.value),
              selectedFilters: this.selectedFilters || {},
              cplProgramsCount: Array.isArray(this.cplPrograms) ? this.cplPrograms.length : 0,
              savedSettings: this.settings || {}
            },
            null,
            2
          );
        }
      },
      watch: {
        subMenu: {
          immediate: true,
          handler() {
            if (this.showCplView) {
              this.ensureCplPrograms();
            }
          }
        },
        selectedFilters: {
          deep: true,
          handler() {
            if (this.showCplView) {
              this.ensureCplPrograms(true);
            }
          }
        }
      },
      methods: {
        buildCplFilters() {
          const filters = {};
          const selectedYear = Number(this.selectedFilters?.academic_year || 0);
          const selectedProgram = String(this.selectedFilters?.programs || "").trim();

          if (selectedYear) {
            filters.academic_year = { op: "=", value: selectedYear };
          }

          if (selectedProgram) {
            filters.program_code = { op: "=", value: selectedProgram };
          }

          return filters;
        },

        async ensureCplPrograms(forceReload = false) {
          if (this.cplLoading) return;
          if (!forceReload && Array.isArray(this.cplPrograms) && this.cplPrograms.length) return;

          this.cplLoading = true;
          this.cplError = "";

          try {
            const data = await bridgetools.req3("programs", this.buildCplFilters(), { include: ["cpl"] });
            this.cplPrograms = Array.isArray(data?.data) ? data.data : [];
          } catch (error) {
            console.error("Failed to load program CPL data", error);
            this.cplPrograms = [];
            this.cplError = String(error?.message || error || "Failed to load CPL data.");
          } finally {
            this.cplLoading = false;
          }
        }
      },
      template: `
        <div class="btech-card btech-theme" style="padding:20px;">
          <reports-v3-programs-cpl
            v-if="showCplView"
            :programs="cplPrograms"
            :selected-filters="selectedFilters"
            :loading="cplLoading"
            :error="cplError"
          />

          <div v-else style="margin-top:18px; border:1px dashed #cbd5e1; border-radius:12px; padding:16px; background:#f8fafc;">
            <div style="font-weight:600; margin-bottom:6px;">Next build point</div>
            <div class="btech-muted" style="margin-bottom:12px;">
              Add program-specific filters, loaders, and visualizations to this component as each section gets implemented.
            </div>
            <pre style="margin:0; font-size:12px; line-height:1.5; white-space:pre-wrap;">{{ summary }}</pre>
          </div>
        </div>
      `
    });

    Vue.component("reports-v3-programs-cpl", {
      props: {
        programs: {
          type: Array,
          default: function () {
            return [];
          }
        },
        selectedFilters: {
          type: Object,
          default: function () {
            return {};
          }
        },
        loading: {
          type: Boolean,
          default: false
        },
        error: {
          type: String,
          default: ""
        }
      },
      computed: {
        filteredPrograms() {
          const list = Array.isArray(this.programs) ? this.programs : [];

          return list
            .map((program) => this.normalizeProgramRow(program))
            .filter(Boolean);
        },

        tableColumns() {
          return [
            { key: "programName", label: "Program", width: "18rem" },
            { key: "programCode", label: "Code", width: "7rem" },
            { key: "academicYear", label: "Year", width: "6rem", format: "integer", align: "right" },
            { key: "campusCode", label: "Campus", width: "6rem" },
            { key: "completion", label: "Completion", width: "8rem", format: "percent", decimals: 0, align: "right" },
            { key: "placement", label: "Placement", width: "8rem", format: "percent", decimals: 0, align: "right" },
            { key: "licensure", label: "Licensure", width: "8rem", format: "percent", decimals: 0, align: "right" }
          ];
        }
      },
      methods: {
        normalizeProgramRow(program) {
          if (!program || typeof program !== "object") return null;

          return {
            programCode: String(program?.program_code || "").trim(),
            programName: String(program?.program_name || program?.program_code || "Program").trim(),
            academicYear: Number(program?.academic_year || 0),
            campusCode: String(program?.campus_code || "").trim(),
            completion: program?.cpl__completion,
            placement: program?.cpl__placement,
            licensure: program?.cpl__licensure
          };
        },

        rowKey(row) {
          return `${row.programCode}-${row.academicYear}-${row.campusCode || "na"}`;
        }
      },
      template: `
        <div style="margin-top:18px;">
          <div v-if="loading" class="btech-card btech-theme" style="padding:16px;">
            <div class="btech-muted">Loading CPL data...</div>
          </div>

          <div v-else-if="error" class="btech-card btech-theme" style="padding:16px; border-color:#fecaca; background:#fef2f2;">
            <div style="font-weight:600; margin-bottom:4px;">CPL Data Error</div>
            <div class="btech-muted">{{ error }}</div>
          </div>

          <div v-else-if="!filteredPrograms.length" class="btech-card btech-theme" style="padding:16px;">
            <div style="font-weight:600; margin-bottom:4px;">Programs CPL</div>
            <div class="btech-muted">No CPL rows match the current filters.</div>
          </div>

          <reports-v3-table
            v-else
            :rows="filteredPrograms"
            :columns="tableColumns"
            :row-key="rowKey"
            default-sort-key="programName"
            :default-sort-dir="1"
            empty-message="No CPL rows match the current filters."
          />
        </div>
      `
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
    registerBaseComponents();

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

    await postLoad();
  }

  await init();
})();
