(function () {
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
    `
  });
})();
