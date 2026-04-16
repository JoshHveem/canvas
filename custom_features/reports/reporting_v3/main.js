// reports/reporting_v3/main.js
(async function () {
  const TEMPLATE_PATH = "/custom_features/reports/reporting_v3/template.vue";
  const TEMPLATE_URL = `${SOURCE_URL}${TEMPLATE_PATH}?v=${Date.now()}`;
  const SETTINGS_NAMESPACE = "edu.btech.canvas.reporting_v3";
  const ROOT_ID = "canvas-reporting-v3-vue";
  const BUTTON_ID = "canvas-reporting-v3-gen";
  const BUTTON_LABEL = "Reports V3";
  const loadedScripts = new Set();

  function getDefaultReports() {
    return [
      {
        value: "shell",
        label: "Shell",
        title: "Reporting V3",
        component: "reporting-v3-shell",
        description: "Base shell for building new reports.",
        subMenus: [
          { value: "overview", label: "Overview" }
        ]
      },
      {
        value: "programs",
        label: "Programs",
        title: "Programs",
        component: "reporting-v3-programs",
        description: "Programs report group shell.",
        subMenus: [
          { value: "completion", label: "Completion" },
          { value: "graduates", label: "Graduates" },
          { value: "placements", label: "Placements" },
          { value: "syllabi", label: "Syllabi" },
          { value: "employment-skills", label: "Employment Skills" }
        ]
      }
    ];
  }

  function getDefaultSettings(reports) {
    const firstReport = reports[0] || {};
    const firstSubMenu = (firstReport.subMenus || [])[0];

    return {
      reportType: firstReport.value || "",
      subMenuByType: firstSubMenu && firstReport.value
        ? { [firstReport.value]: firstSubMenu.value }
        : {},
      filters: {}
    };
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

  function createButton() {
    const btn = $(`<a class="Button" id="${BUTTON_ID}">${BUTTON_LABEL}</a>`);
    const wrapper = $('<div style="position: relative; display: block;"></div>');

    btn.on("click", function () {
      $(`#${ROOT_ID}`).show();
    });

    wrapper.append(btn);
    return wrapper;
  }

  function ensureButton(container) {
    if (!container || !container.length) return;
    if ($(`#${BUTTON_ID}`).length === 0) {
      container.append(createButton());
    }
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

  async function loadSettings(defaults) {
    const fallback = JSON.parse(JSON.stringify(defaults));

    try {
      const resp = await $.get(`/api/v1/users/self/custom_data/reporting_v3?ns=${SETTINGS_NAMESPACE}`);
      const saved = resp?.data?.settings || {};
      return {
        reportType: saved.reportType || fallback.reportType,
        subMenuByType: Object.assign({}, fallback.subMenuByType, saved.subMenuByType || {}),
        filters: Object.assign({}, fallback.filters, saved.filters || {})
      };
    } catch (err) {
      return fallback;
    }
  }

  async function saveSettings(settings) {
    await $.put(`/api/v1/users/self/custom_data/reporting_v3?ns=${SETTINGS_NAMESPACE}`, {
      data: { settings }
    });
  }

  async function postLoad() {
    let vueString = "";

    await $.get(
      TEMPLATE_URL,
      null,
      function (html) {
        vueString = html.replace("<template>", "").replace("</template>", "");
      },
      "text"
    );

    if ($(`#${ROOT_ID}`).length === 0) {
      $("#application").after(`<div id="${ROOT_ID}"></div>`);
    }

    $(`#${ROOT_ID}`).html(vueString).hide();

    const container = $("#right-side");
    ensureButton(container);

    if (container.length) {
      const observer = new MutationObserver(function () {
        ensureButton(container);
      });
      observer.observe(container[0], { childList: true, subtree: false });
    }

    const reportTypes = getDefaultReports();
    registerBaseComponents();

    new Vue({
      el: `#${ROOT_ID}`,

      data: function () {
        return {
          loading: true,
          reportTypes,
          settings: getDefaultSettings(reportTypes)
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
        const loadedSettings = await loadSettings(getDefaultSettings(this.reportTypes));
        this.settings = this.normalizeSettings(loadedSettings);
        this.loading = false;
      },

      methods: {
        normalizeSettings(settings) {
          const normalized = Object.assign({}, getDefaultSettings(this.reportTypes), settings || {});

          if (!normalized.reportType) {
            normalized.reportType = this.reportTypes[0]?.value || "";
          }

          if (!normalized.subMenuByType || typeof normalized.subMenuByType !== "object") {
            normalized.subMenuByType = {};
          }

          if (!normalized.filters || typeof normalized.filters !== "object") {
            normalized.filters = {};
          }

          const type = normalized.reportType;
          const report = this.reportTypes.find((item) => item.value === type) || this.reportTypes[0] || {};
          const firstSubMenu = (report.subMenus || [])[0];

          if (type && firstSubMenu && !normalized.subMenuByType[type]) {
            this.$set(normalized.subMenuByType, type, firstSubMenu.value);
          }

          return normalized;
        },

        async persistSettings() {
          await saveSettings(this.settings);
        },

        async onReportChange() {
          const type = this.settings.reportType;
          const report = this.reportTypes.find((item) => item.value === type) || {};
          const firstSubMenu = (report.subMenus || [])[0];

          if (type && firstSubMenu && !this.settings.subMenuByType[type]) {
            this.$set(this.settings.subMenuByType, type, firstSubMenu.value);
          }

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
    loadCSS("https://reports.bridgetools.dev/department_report/style/main.css");
    loadCSS("https://reports.bridgetools.dev/style/main.css");

    if (!window.Vue) {
      await loadScriptOnce("https://bridgetools.dev/canvas/external-libraries/vue.2.6.12.js");
      await $.getScript("https://bridgetools.dev/canvas/external-libraries/d3.v7.js");

    }

    await postLoad();
  }

  await init();
})();
