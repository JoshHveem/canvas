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
        cplError: "",
        syllabiPrograms: [],
        syllabiLoading: false,
        syllabiError: "",
        employmentSkillsPrograms: [],
        employmentSkillsLoading: false,
        employmentSkillsError: ""
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
      showSyllabiView() {
        return this.subMenu === "syllabi";
      },
      showEmploymentSkillsView() {
        return this.subMenu === "employment-skills";
      },
      summary() {
        return JSON.stringify(
          {
            reportType: this.reportMeta.value || "",
            subMenu: this.subMenu || "",
            sections: this.sections.map((section) => section.value),
            selectedFilters: this.selectedFilters || {},
            cplProgramsCount: Array.isArray(this.cplPrograms) ? this.cplPrograms.length : 0,
            syllabiProgramsCount: Array.isArray(this.syllabiPrograms) ? this.syllabiPrograms.length : 0,
            employmentSkillsProgramsCount: Array.isArray(this.employmentSkillsPrograms) ? this.employmentSkillsPrograms.length : 0,
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
          if (this.showSyllabiView) {
            this.ensureSyllabiPrograms();
          }
          if (this.showEmploymentSkillsView) {
            this.ensureEmploymentSkillsPrograms();
          }
        }
      },
      selectedFilters: {
        deep: true,
        handler() {
          if (this.showCplView) {
            this.ensureCplPrograms(true);
          }
          if (this.showSyllabiView) {
            this.ensureSyllabiPrograms(true);
          }
          if (this.showEmploymentSkillsView) {
            this.ensureEmploymentSkillsPrograms(true);
          }
        }
      }
    },
    methods: {
      buildProgramFilters() {
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
          const data = await bridgetools.req3("programs", this.buildProgramFilters(), { include: ["cpl"] });
          this.cplPrograms = Array.isArray(data?.data) ? data.data : [];
        } catch (error) {
          console.error("Failed to load program CPL data", error);
          this.cplPrograms = [];
          this.cplError = String(error?.message || error || "Failed to load CPL data.");
        } finally {
          this.cplLoading = false;
        }
      },

      async ensureSyllabiPrograms(forceReload = false) {
        if (this.syllabiLoading) return;
        if (!forceReload && Array.isArray(this.syllabiPrograms) && this.syllabiPrograms.length) return;

        this.syllabiLoading = true;
        this.syllabiError = "";

        try {
          const data = await bridgetools.req3("programs", this.buildProgramFilters(), {
            include: ["syllabi"]
          });
          this.syllabiPrograms = Array.isArray(data?.data) ? data.data : [];
        } catch (error) {
          console.error("Failed to load program syllabi data", error);
          this.syllabiPrograms = [];
          this.syllabiError = String(error?.message || error || "Failed to load syllabi data.");
        } finally {
          this.syllabiLoading = false;
        }
      },

      async ensureEmploymentSkillsPrograms(forceReload = false) {
        if (this.employmentSkillsLoading) return;
        if (!forceReload && Array.isArray(this.employmentSkillsPrograms) && this.employmentSkillsPrograms.length) return;

        this.employmentSkillsLoading = true;
        this.employmentSkillsError = "";

        try {
          const data = await bridgetools.req3("programs", this.buildProgramFilters(), {
            include: ["employment_skills_summary"]
          });
          this.employmentSkillsPrograms = Array.isArray(data?.data) ? data.data : [];
        } catch (error) {
          console.error("Failed to load program employment skills data", error);
          this.employmentSkillsPrograms = [];
          this.employmentSkillsError = String(error?.message || error || "Failed to load employment skills data.");
        } finally {
          this.employmentSkillsLoading = false;
        }
      },
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

        <reports-v3-programs-syllabi
          v-else-if="showSyllabiView"
          :programs="syllabiPrograms"
          :selected-filters="selectedFilters"
          :loading="syllabiLoading"
          :error="syllabiError"
        />

        <reports-v3-programs-employment-skills
          v-else-if="showEmploymentSkillsView"
          :programs="employmentSkillsPrograms"
          :selected-filters="selectedFilters"
          :loading="employmentSkillsLoading"
          :error="employmentSkillsError"
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
