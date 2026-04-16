// reports/reporting_v3/main.js
(async function () {
  const VERSION = Date.now();
  const BASE_PATH = "/custom_features/reports/reporting_v3";
  const TEMPLATE_URL = `${SOURCE_URL}${BASE_PATH}/template.vue?v=${VERSION}`;
  const UTILS_URL = `${SOURCE_URL}${BASE_PATH}/utils.js?v=${VERSION}`;
  const REPORTS_URL = `${SOURCE_URL}${BASE_PATH}/reports.json?v=${VERSION}`;
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
        }
      },
      template: `
        <div class="btech-card btech-theme" style="padding:20px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap;">
            <div>
              <div class="btech-card-title" style="margin-bottom:6px;">{{ reportMeta.title || 'Reporting V3' }}</div>
              <div class="btech-muted">{{ reportMeta.description || 'Base report shell ready for new components.' }}</div>
            </div>
            <div class="btech-pill" style="font-size:11px;">{{ subMenu || 'overview' }}</div>
          </div>

          <div style="margin-top:18px; border:1px dashed #cbd5e1; border-radius:12px; padding:16px; background:#f8fafc;">
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
        }
      },
      computed: {
        sections() {
          return Array.isArray(this.reportMeta?.subMenus) ? this.reportMeta.subMenus : [];
        },
        activeSection() {
          return this.sections.find((section) => section.value === this.subMenu) || this.sections[0] || null;
        },
        summary() {
          return JSON.stringify(
            {
              reportType: this.reportMeta.value || "",
              subMenu: this.subMenu || "",
              sections: this.sections.map((section) => section.value),
              savedSettings: this.settings || {}
            },
            null,
            2
          );
        }
      },
      template: `
        <div class="btech-card btech-theme" style="padding:20px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap;">
            <div>
              <div class="btech-card-title" style="margin-bottom:6px;">{{ reportMeta.title || 'Programs' }}</div>
              <div class="btech-muted">{{ reportMeta.description || 'Programs report group shell.' }}</div>
            </div>
            <div class="btech-pill" style="font-size:11px;">{{ activeSection ? activeSection.label : 'Programs' }}</div>
          </div>

          <div style="margin-top:18px; display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
            <div
              v-for="section in sections"
              :key="section.value"
              :style="section.value === subMenu
                ? 'border:1px solid #111827; border-radius:12px; padding:14px; background:#111827; color:#fff;'
                : 'border:1px solid #cbd5e1; border-radius:12px; padding:14px; background:#fff; color:#0f172a;'"
            >
              <div style="font-weight:600; margin-bottom:4px;">{{ section.label }}</div>
              <div style="font-size:12px; opacity:.8;">
                Placeholder view ready for the {{ section.label.toLowerCase() }} report.
              </div>
            </div>
          </div>

          <div style="margin-top:18px; border:1px dashed #cbd5e1; border-radius:12px; padding:16px; background:#f8fafc;">
            <div style="font-weight:600; margin-bottom:6px;">Next build point</div>
            <div class="btech-muted" style="margin-bottom:12px;">
              Add program-specific filters, loaders, and visualizations to this component as each section gets implemented.
            </div>
            <pre style="margin:0; font-size:12px; line-height:1.5; white-space:pre-wrap;">{{ summary }}</pre>
          </div>
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
          settings: utils.getDefaultSettings(reportTypes)
        };
      },

      computed: {
        currentReportMeta() {
          const fallback = this.reportTypes[0] || {};
          return this.reportTypes.find((report) => report.value === this.settings.reportType) || fallback;
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

        currentViewProps() {
          return {
            reportMeta: this.currentReportMeta,
            subMenu: this.currentSubKey,
            settings: this.settings
          };
        }
      },

      async mounted() {
        const loadedSettings = await utils.loadUserSettings(
          SETTINGS_NAMESPACE,
          SETTINGS_KEY,
          utils.getDefaultSettings(this.reportTypes)
        );

        this.settings = utils.normalizeSettings(loadedSettings, this.reportTypes);
        this.loading = false;
      },

      methods: {
        async persistSettings() {
          await utils.saveUserSettings(SETTINGS_NAMESPACE, SETTINGS_KEY, this.settings);
        },

        async onReportChange() {
          this.settings = utils.normalizeSettings(this.settings, this.reportTypes);
          await this.persistSettings();
        },

        async setSubMenu(value) {
          const type = this.currentReportMeta?.value;
          if (!type) return;

          this.$set(this.settings.subMenuByType, type, value);
          await this.persistSettings();
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
      }
    });
  }

  async function init() {
    utils.loadCSS("https://reports.bridgetools.dev/department_report/style/main.css");
    utils.loadCSS("https://reports.bridgetools.dev/style/main.css");

    if (!window.Vue) {
      await utils.loadScriptOnce("https://bridgetools.dev/canvas/external-libraries/vue.2.6.12.js");
    }

    await postLoad();
  }

  await init();
})();
