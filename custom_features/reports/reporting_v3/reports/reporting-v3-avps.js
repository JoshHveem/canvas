(function () {
  Vue.component("reporting-v3-avps", {
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
      avps: {
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
      activeSectionComponent() {
        return String(this.activeSection?.component || "").trim();
      },
      activeSectionRows() {
        return Array.isArray(this.sectionRows[this.activeSectionKey]) ? this.sectionRows[this.activeSectionKey] : [];
      },
      activeSectionLoading() {
        return !!this.sectionLoading[this.activeSectionKey];
      },
      activeSectionError() {
        return String(this.sectionErrors[this.activeSectionKey] || "");
      },
      summary() {
        return JSON.stringify(
          {
            reportType: this.reportMeta.value || "",
            subMenu: this.subMenu || "",
            sections: this.sections.map((section) => ({
              value: section.value,
              component: section.component || "",
              include: section.include || "",
              rows: Array.isArray(this.sectionRows[section.value]) ? this.sectionRows[section.value].length : 0,
              loaded: !!this.sectionLoaded[section.value]
            })),
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
      selectedFilters: {
        deep: true,
        handler() {
          this.ensureActiveSectionData(true);
        }
      }
    },
    methods: {
      getBaseSource() {
        return String(this.reportMeta?.source || this.reportMeta?.value || "avps").trim();
      },

      buildAvpFilters() {
        const filters = {};
        const selectedYear = Number(this.selectedFilters?.academic_year || 0);
        const selectedAvp = String(this.selectedFilters?.avps || "").trim();

        if (selectedYear) {
          filters.academic_year = { op: "=", value: selectedYear };
        }

        if (selectedAvp) {
          filters.avp_sis_user_id = { op: "=", value: selectedAvp };
        }

        return filters;
      },

      getSectionKey(section) {
        return String(section?.value || "");
      },

      async ensureActiveSectionData(forceReload = false) {
        await this.ensureSectionData(this.activeSection, forceReload);
      },

      async ensureSectionData(section, forceReload = false) {
        const key = this.getSectionKey(section);
        const include = String(section?.include || "").trim();
        if (!key || !include) return;

        if (this.sectionLoading[key]) return;
        if (!forceReload && this.sectionLoaded[key]) return;

        this.$set(this.sectionLoading, key, true);
        this.$set(this.sectionErrors, key, "");

        try {
          const data = await bridgetools.req3(this.getBaseSource(), this.buildAvpFilters(), {
            include: [include]
          });

          this.$set(this.sectionRows, key, Array.isArray(data?.data) ? data.data : []);
          this.$set(this.sectionLoaded, key, true);
        } catch (error) {
          console.error(`Failed to load avp ${key} data`, error);
          this.$set(this.sectionRows, key, []);
          this.$set(this.sectionErrors, key, String(error?.message || error || `Failed to load ${key} data.`));
          this.$set(this.sectionLoaded, key, false);
        } finally {
          this.$set(this.sectionLoading, key, false);
        }
      }
    },
    template: `
      <div class="btech-card btech-theme" style="padding:20px; display:inline-block; width:fit-content; max-width:100%;">
        <component
          v-if="activeSectionComponent"
          :is="activeSectionComponent"
          :avps="activeSectionRows"
          :selected-filters="selectedFilters"
          :loading="activeSectionLoading"
          :error="activeSectionError"
        />

        <div v-else style="margin-top:18px; border:1px dashed #cbd5e1; border-radius:12px; padding:16px; background:#f8fafc;">
          <div style="font-weight:600; margin-bottom:6px;">Next build point</div>
          <div class="btech-muted" style="margin-bottom:12px;">
            Add a section component and include name in reports.json to render this submenu.
          </div>
          <pre style="margin:0; font-size:12px; line-height:1.5; white-space:pre-wrap;">{{ summary }}</pre>
        </div>
      </div>
    `
  });
})();
