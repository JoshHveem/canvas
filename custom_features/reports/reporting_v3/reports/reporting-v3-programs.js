(function () {
  function getReportViews(report) {
    if (window.ReportingV3Utils?.getReportViews) {
      return window.ReportingV3Utils.getReportViews(report);
    }

    if (Array.isArray(report?.views) && report.views.length) {
      return report.views;
    }

    return report?.component
      ? [{
        value: "initial",
        label: "Initial View",
        component: report.component,
        source: report.source,
        include: report.include,
        filters: report.filters,
        filter_by_year: report.filter_by_year
      }]
      : [];
  }

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
      currentView: {
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
        sectionRows: {},
        sectionLoading: {},
        sectionErrors: {},
        sectionLoaded: {}
      };
    },
    computed: {
      sections() {
        return Array.isArray(this.reportMeta?.subMenus) ? this.reportMeta.subMenus : [];
      },
      activeSection() {
        return this.sections.find((section) => section.value === this.subMenu) || this.sections[0] || null;
      },
      activeSectionKey() {
        return String(this.activeSection?.value || "");
      },
      activeSectionViews() {
        return getReportViews(this.activeSection);
      },
      activeView() {
        return this.activeSectionViews.find((view) => view.value === this.currentView) || this.activeSectionViews[0] || null;
      },
      activeViewKey() {
        return String(this.activeView?.value || "");
      },
      activeDataKey() {
        return this.getSectionDataKey(this.activeSection, this.activeView);
      },
      activeSectionComponent() {
        return String(this.activeView?.component || "").trim();
      },
      activeSectionRows() {
        return Array.isArray(this.sectionRows[this.activeDataKey]) ? this.sectionRows[this.activeDataKey] : [];
      },
      activeFilterKeys() {
        if (Array.isArray(this.activeView?.filters)) {
          return this.activeView.filters;
        }

        if (Array.isArray(this.activeSection?.filters)) {
          return this.activeSection.filters;
        }

        return Array.isArray(this.reportMeta?.filters) ? this.reportMeta.filters : [];
      },
      activeNeedsAcademicYear() {
        if (Object.prototype.hasOwnProperty.call(this.activeView || {}, "filter_by_year")) {
          return !!this.activeView.filter_by_year;
        }

        return !!this.activeSection?.filter_by_year;
      },
      activeSectionLoading() {
        return !!this.sectionLoading[this.activeDataKey];
      },
      activeSectionError() {
        return String(this.sectionErrors[this.activeDataKey] || "");
      },
      summary() {
        return JSON.stringify(
          {
            reportType: this.reportMeta.value || "",
            subMenu: this.subMenu || "",
            sections: this.sections.map((section) => ({
              value: section.value,
              views: getReportViews(section).map((view) => {
                const dataKey = this.getSectionDataKey(section, view);
                return {
                  value: view.value,
                  component: view.component || "",
                  include: view.include || "",
                  source: view.source || section.source || "programs",
                  rows: Array.isArray(this.sectionRows[dataKey]) ? this.sectionRows[dataKey].length : 0,
                  loaded: !!this.sectionLoaded[dataKey]
                };
              })
            })),
            currentView: this.currentView || "",
            selectedFilters: this.selectedFilters || {},
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
          this.ensureActiveSectionData();
        }
      },
      currentView: {
        immediate: true,
        handler() {
          this.ensureActiveSectionData();
        }
      },
      selectedFilters: {
        deep: true,
        handler() {
          this.ensureActiveSectionData(true);
        }
      }
    },
    methods: {
      buildProgramFilters() {
        const filters = {};
        const selectedYear = Number(this.selectedFilters?.academic_year || 0);
        const selectedProgram = String(this.selectedFilters?.programs || "").trim();

        if (this.activeNeedsAcademicYear && selectedYear) {
          filters.academic_year = { op: "=", value: selectedYear };
        }

        if (this.activeFilterKeys.includes("programs") && selectedProgram) {
          filters.program_code = { op: "=", value: selectedProgram };
        }

        return filters;
      },

      getSectionKey(section) {
        return String(section?.value || "");
      },

      getSectionDataKey(section, view) {
        const sectionKey = this.getSectionKey(section);
        const viewKey = String(view?.value || "initial");
        return sectionKey ? `${sectionKey}::${viewKey}` : "";
      },

      async ensureActiveSectionData(forceReload = false) {
        await this.ensureSectionData(this.activeSection, this.activeView, forceReload);
      },

      async ensureSectionData(section, view, forceReload = false) {
        const key = this.getSectionKey(section);
        const dataKey = this.getSectionDataKey(section, view);
        const include = String(view?.include || section?.include || "").trim();
        const source = String(view?.source || section?.source || "programs").trim() || "programs";
        if (!key || !dataKey || !source) return;

        if (this.sectionLoading[dataKey]) return;
        if (!forceReload && this.sectionLoaded[dataKey]) return;

        const missingRequiredFilters = (Array.isArray(view?.required_filters) ? view.required_filters : [])
          .filter((filterKey) => {
            const value = this.selectedFilters?.[filterKey];
            if (Array.isArray(value)) return !value.length;
            return !String(value || "").trim();
          });

        if (missingRequiredFilters.length) {
          this.$set(this.sectionRows, dataKey, []);
          this.$set(this.sectionErrors, dataKey, "");
          this.$set(this.sectionLoaded, dataKey, true);
          this.$set(this.sectionLoading, dataKey, false);
          return;
        }

        this.$set(this.sectionLoading, dataKey, true);
        this.$set(this.sectionErrors, dataKey, "");

        try {
          const options = include ? { include: [include] } : undefined;
          const data = await bridgetools.req3(source, this.buildProgramFilters(), options);

          this.$set(this.sectionRows, dataKey, Array.isArray(data?.data) ? data.data : []);
          this.$set(this.sectionLoaded, dataKey, true);
        } catch (error) {
          console.error(`Failed to load program ${key} data`, error);
          this.$set(this.sectionRows, dataKey, []);
          this.$set(this.sectionErrors, dataKey, String(error?.message || error || `Failed to load ${key} data.`));
          this.$set(this.sectionLoaded, dataKey, false);
        } finally {
          this.$set(this.sectionLoading, dataKey, false);
        }
      }
    },
    template: `
      <div class="btech-card btech-theme" style="padding:20px; display:inline-block; width:fit-content; max-width:100%;">
        <component
          v-if="activeSectionComponent"
          :is="activeSectionComponent"
          :programs="activeSectionRows"
          :rows="activeSectionRows"
          :report-data="activeSectionRows"
          :selected-filters="selectedFilters"
          :view="activeView"
          :loading="activeSectionLoading"
          :error="activeSectionError"
          @filter-controls-change="$emit('filter-controls-change', $event)"
        />

        <div v-else style="margin-top:18px; border:1px dashed #cbd5e1; border-radius:12px; padding:16px; background:#f8fafc;">
          <div style="font-weight:600; margin-bottom:6px;">Next build point</div>
          <div class="btech-muted" style="margin-bottom:12px;">
            Add a view component and data source in reports.json to render this report.
          </div>
          <pre style="margin:0; font-size:12px; line-height:1.5; white-space:pre-wrap;">{{ summary }}</pre>
        </div>
      </div>
    `
  });
})();
