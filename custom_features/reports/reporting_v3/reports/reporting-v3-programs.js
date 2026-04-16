(function () {
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
})();
