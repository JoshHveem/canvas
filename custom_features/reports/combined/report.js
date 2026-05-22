// reports/combined/report.js
(async function () {
  function httpGetJson(url) {
    return $.ajax({
      url,
      method: "GET",
      dataType: "json",
      xhrFields: {
        withCredentials: true, // 🔑 THIS is the key
      },
    });
  }


  function _numStudents(c) {
    // treat any of these as “students”
    const v =
      c?.num_students_jenzabar ??
      c?.students ??
      c?.num_students_credits ??
      0;
    return Number(v || 0);
  }

  function _ts(v) {
    const t = Date.parse(v || '');
    return Number.isFinite(t) ? t : -Infinity;
  }

  function _lastUpdateTs(c) {
    // choose best available update timestamp
    return Math.max(
      _ts(c?.last_update),
      _ts(c?.lastUpdate),
      _ts(c?.surveys?.last_update),
      _ts(c?.suggestions?.last_update)
    );
  }

  function dedupeCoursesByCourseCode(courses) {
    const list = Array.isArray(courses) ? courses : [];
    const groups = new Map();

    // group by normalized course_code; if missing, fall back to a stable unique-ish key
    for (const c of list) {
      const code = String(c?.course_code || '').trim().toUpperCase();
      const key = code || `__NO_CODE__::${c?.canvas_course_id || c?.course_id || c?.id || c?._id || Math.random()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(c);
    }

    const out = [];
    for (const [key, group] of groups.entries()) {
      if (group.length === 1) {
        out.push(group[0]);
        continue;
      }

      // rule 1: prefer students > 0
      const withStudents = group.filter(c => _numStudents(c) > 0);

      if (withStudents.length) {
        // if multiple with students > 0, take the newest update among those
        withStudents.sort((a, b) => _lastUpdateTs(b) - _lastUpdateTs(a));
        out.push(withStudents[0]);
        continue;
      }

      // rule 2: all students are 0 -> newest last_update wins
      group.sort((a, b) => _lastUpdateTs(b) - _lastUpdateTs(a));
      out.push(group[0]);
    }

    return out;
  }


  window.ReportColumn = ReportColumn;
  window.ReportTable = ReportTable;

  /********************************************************************
   * Shared Data Cache (NEW)
   * - Lazy-load only when needed by current report selectors
   * - Cache results + dedupe in-flight requests
   * - Cache Canvas user lookups to avoid N calls across reports
   ********************************************************************/
  (function () {
    const TTL_MS = 5 * 60 * 1000; // 5 minutes
    const cache = new Map();      // key -> { ts, promise, value }
    const userCache = new Map();  // canvasId -> { ts, promise, value }

    const now = () => Date.now();
    const fresh = (e) => e && (now() - e.ts) < TTL_MS;

    async function cached(map, key, fn) {
      const e = map.get(key);
      if (e && fresh(e)) return e.value ?? e.promise;

      const promise = (async () => {
        const value = await fn();
        map.set(key, { ts: now(), value, promise: null });
        return value;
      })();

      map.set(key, { ts: now(), value: null, promise });
      return promise;
    }

    async function getCanvasUser(canvasId) {
      if (!canvasId) return null;
      const key = String(canvasId);
      return cached(userCache, key, async () => {
        try {
          const resp = await canvasGet(`/api/v1/users/${key}`);
          const u = Array.isArray(resp) ? resp[0] : resp;
          return u || null;
        } catch (e) {
          return null;
        }
      });
    }

    async function getInstructorsRaw({ account }) {
      const key = `instructorsRaw::acct=${account}`;
      return cached(cache, key, async () => {
        const url = `https://reports.bridgetools.dev/api/instructors?dept_head_account_ids[]=${account}`;
        const resp = await bridgetools.req(url);
        const incoming = resp?.data || [];

        // Enrich names from Canvas (cached)
        for (let i = 0; i < incoming.length; i++) {
          const u = await getCanvasUser(incoming[i].canvas_id);
          if (u) {
            incoming[i].first_name = u.first_name || incoming[i].first_name;
            incoming[i].last_name  = u.last_name  || incoming[i].last_name;
          }
        }
        return incoming;
      });
    }
    async function getStudentsRaw({ account }) {
      const key = `instructorsRaw::acct=${account}`;
      return cached(cache, key, async () => {
        const url = `https://reports.bridgetools.dev/api/v2/students?account_id=${account}`;
        const resp = await bridgetools.req(url);
        const incoming = resp?.data || [];

        // Enrich names from Canvas (cached)
        for (let i = 0; i < incoming.length; i++) {
          const u = await getCanvasUser(incoming[i].canvas_id);
          if (u) {
            incoming[i].first_name = u.first_name || incoming[i].first_name;
            incoming[i].last_name  = u.last_name  || incoming[i].last_name;
          }
        }
        return incoming;
      });
    }

    async function getDepartmentsRaw() {
      const key = `departmentsRaw::all`;
      return cached(cache, key, async () => {
        const url = `https://reports.bridgetools.dev/api/departments/full`;
        const resp = await bridgetools.req(url);

        // backend returns { meta, data }
        const payload = resp?.data;
        const depts = Array.isArray(payload?.data) ? payload.data
                    : Array.isArray(payload) ? payload
                    : [];
        return depts;
      });
    }
    async function getProgramsRaw() {
      const key = `programsRaw::all`;
      return cached(cache, key, async () => {
        const url = `https://reports.bridgetools.dev/api/programs`;
        let data = await bridgetools.req(url);
        let programs = data.filter(p => (p?.students ?? []).length > 0);
        return programs;
      });
    }

    async function getSyllabiStatusRaw({ academicYear }) {
      const year = Number(academicYear) || new Date().getFullYear();
      const key = `syllabiStatusRaw::year=${year}`;
      return await bridgettools.req3('reports', { academic_year: year }, { dataset: 'department_syllabi_summary' });
    }


    async function getCoursesRaw({ account, year }) {
      const y = Number(year) || new Date().getFullYear();
      const key = `coursesRaw::acct=${account}::year=${y}`;
      return cached(cache, key, async () => {
        const limit = 50;

        // "My Courses" (account==0)
        if (Number(account) === 0) {
          const courses = await canvasGet('/api/v1/courses?enrollment_type=teacher&enrollment_state=active&state[]=available&include[]=term');
          const ids = (courses || []).map(c => c.id);

          const out = [];
          for (let i = 0; i < ids.length; i += limit) {
            const chunk = ids.slice(i, i + limit);
            let url = `https://reports.bridgetools.dev/api/reviews/courses?limit=${limit}`;
            chunk.forEach(id => { url += `&course_ids[]=${id}`; });
            const data = await bridgetools.req(url);
            out.push(...(data?.courses || []));
          }
          return out;
        }

        // By account/year (department)
        let url = `https://reports.bridgetools.dev/api/reviews/courses?limit=${limit}&excludes[]=content_items&year=${y}&account_id=${account}`;
        let resp = {};
        const out = [];
        do {
          resp = await bridgetools.req(url + (resp?.next_id ? `&last_id=${resp.next_id}` : ''));
          out.push(...(resp?.courses || []));
        } while ((resp?.courses || []).length === limit);

        return out;
      });
    }

    window.ReportData = {
      getCanvasUser,
      getProgramsRaw,
      getSyllabiStatusRaw,
      getInstructorsRaw,
      getCoursesRaw,
      getDepartmentsRaw,
      getStudentsRaw,
      invalidate(prefix = "") {
        for (const k of cache.keys()) if (String(k).startsWith(prefix)) cache.delete(k);
      }
    };
  })();

  /********************************************************************
   * accounts.mixin.js (unchanged, but available)
   ********************************************************************/
  window.BtechAccountsMixin = {
    data() {
      return {
        accounts: [{ name: 'My Courses', id: '' + 0 }],
        accountsLoading: false
      };
    },
    methods: {

      async loadAccounts() {
        try {
          this.accountsLoading = true;

          let accountsData = await canvasGet('/api/v1/accounts');

          // If college-level admin, pull sub-accounts of 3
          for (let a = 0; a < accountsData.length; a++) {
            let account = accountsData[a];
            if (account.id == 3) {
              accountsData = await canvasGet('/api/v1/accounts/3/sub_accounts');
              break;
            }
          }

          const accounts = [];
          for (let a = 0; a < accountsData.length; a++) {
            const account = accountsData[a];
            if (account.parent_account_id == 3) {
              accounts.push({ name: account.name, id: '' + account.id });
            }
          }

          accounts.sort((a, b) => a.name.localeCompare(b.name));
          this.accounts.splice(1, this.accounts.length - 1, ...accounts);
        } finally {
          this.accountsLoading = false;
        }
      }
    }
  };

  /********************************************************************
   * Button / Mount helpers (unchanged)
   ********************************************************************/
  function createButton() {
    const btn = $('<a class="Button" id="canvas-instructor-report-vue-gen">Reports</a>');
    const wrapper = $('<div style="position: relative; display: block;"></div>');
    wrapper.append(btn);
    btn.click(function () {
      $("#canvas-instructor-report-vue").show();
      $.post("https://tracking.bridgetools.dev/api/hit", {
        "tool": "reports-instructor",
        "canvasId": ENV.current_user_id
      });
    });
    return wrapper;
  }

  function ensureButton(container) {
    if ($('#canvas-instructor-report-vue-gen').length === 0) {
      container.append(createButton());
    }
  }

  async function postLoad() {
    const todayStr = new Date().toISOString();
    let vueString = '';
    await $.get(SOURCE_URL + `/custom_features/reports/combined/template.vue?v=${todayStr}`, null, function (html) {
      vueString = html.replace("<template>", "").replace("</template>", "");
    }, 'text');

    let canvasbody = $("#application");
    canvasbody.after('<div id="canvas-instructor-report-vue"></div>');
    $("#canvas-instructor-report-vue").append(vueString);
    $("#canvas-instructor-report-vue").hide();

    container = $('#right-side');
    ensureButton(container);

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') ensureButton(container);
      }
    });
    observer.observe(container[0], { childList: true, subtree: false });

    new Vue({
      el: '#canvas-instructor-report-vue',

      mounted: async function () {
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') this.courseTagsOpen = false;
        });

        this.loading = true;

        // Load saved settings (generic)
        let settings = await this.loadSettings(this.settings);
        this.settings = settings;

        // Load accounts (generic)
        let accountsData = await canvasGet('/api/v1/accounts');
        let accounts = [];
        for (let a = 0; a < accountsData.length; a++) {
          let account = accountsData[a];
          if (account.id == 3) {
            accountsData = await canvasGet('/api/v1/accounts/3/sub_accounts');
            break;
          }
        }
        for (let a = 0; a < accountsData.length; a++) {
          let account = accountsData[a];
          if (account.parent_account_id == 3) {
            accounts.push({ name: account.name, id: '' + account.id });
          }
        }
        accounts.sort((a, b) => a.name.localeCompare(b.name));
        this.accounts.push(...accounts);

        this.loading = false;

        await this.ensureSharedData();
      },

      data: function () {

        let reports = [
          {
            value: 'departments',
            label: 'Departments',
            component: 'reports-departments',
            title: 'Departments Report',
            selectors: [],
            datasets: ['departments'],
            subMenus: [
              { value: 'syllabi', label: 'Syllabi' },
            ]
          },
          {
            value: 'department',
            label: 'Department',
            component: 'reports-department',
            title: 'Department Report',
            datasets: ['departments'],
            selectors: ['departments'],
            subMenus: [
              { value: 'syllabi',     label: 'Syllabi' },
            ]
          },
        ]
        return {
          colors: bridgetools.colors,
          courseTagsPopupStyle: { left:'0px', top:'0px', width:'240px' },

          settings: {
            anonymous: false,
            account: 0,
            reportType: 'departments',
            subMenuByType: {},
            sort_dir: 1,
            filters: { year: '2025', course_tags: [], program: '', campus: ''}
          },

          campuses: [
            { key: 'L', name: 'Logan' },
            { key: 'B', name: 'Brigham City' }
          ],

          accounts: [{ name: 'My Courses', id: '' + 0 }],
          loading: false,

          // NEW: shared datasets for top-level selectors + reuse across reports
          instructorsRaw: [],
          coursesRaw: [],
          departmentsRaw: [],
          programsRaw: [],
          sharedLoading: { departments: false, programs: false, instructors: false, courses: false, students: false },

          menu: '',
          section_names: ['All'],
          allCourseTags: [],
          section_filter: 'All',
          end_date_filter: true,
          hide_missing_end_date: true,
          hide_past_end_date: false,

          reportTypes: reports,
          courseTagsOpen: false,
          courseTagsSearch: '',

        };
      },

      computed: {
        isISD() {
          return !!(window && window.IS_ISD);
        },
        courseTagsLabel() {
          const sel = this.settings?.filters?.course_tags;
          const n = Array.isArray(sel) ? sel.length : 0;
          if (!n) return 'All (no filter)';
          if (n === 1) return sel[0];
          return `${n} selected`;
        },

        filteredCourseTags() {
          const all = Array.isArray(this.allCourseTags) ? this.allCourseTags : [];
          const q = String(this.courseTagsSearch || '').trim().toLowerCase();
          if (!q) return all;
          return all.filter(t => String(t).toLowerCase().includes(q));
        },

        sortedCoursesRaw() {
          return (this.coursesRaw || []).slice().sort((a, b) => {
            const ac = (a.course_code || '').toUpperCase();
            const bc = (b.course_code || '').toUpperCase();
            return ac.localeCompare(bc, undefined, { numeric: true });
          });
        },

        currentReportMeta() {
          const fallback = this.reportTypes[0];
          return this.reportTypes.find(r => r.value === (this.settings.reportType || 'instructor')) || fallback;
        },

        currentDatasets() {
          const rt = this.currentReportMeta || {};
          return rt.datasets || [];
        },

        currentSelectors() {
          const rt = this.currentReportMeta || {};
          return rt.selectors || rt.selector || []; // tolerate legacy
        },

        currentSubMenus() {
          const rt = this.currentReportMeta;
          const menus = (rt && rt.subMenus) ? rt.subMenus : [];

          // Hide ISD-only menus unless window.IS_ISD is true
          return menus.filter(m => !m.isd_only || this.isISD);
        },
        currentSubKey() {
          const menus = this.currentSubMenus;
          if (!menus.length) return null;

          const map = this.settings.subMenuByType || {};
          const type = this.settings.reportType;
          const saved = map[type];

          if (saved && menus.some(m => m.value === saved)) return saved;

          // If a saved submenu became invalid (e.g. ISD-only), reset it
          const fallback = menus[0].value;
          if (saved && saved !== fallback) {
            // avoid reactivity gotcha: update map safely
            if (!this.settings.subMenuByType) this.$set(this.settings, 'subMenuByType', {});
            this.$set(this.settings.subMenuByType, type, fallback);
            this.saveSettings(this.settings);
          }

          return fallback;
        }, 
        currentReportProps() {
          const base = {
            year: this.settings.filters.year,
            account: this.settings.account,
            instructorId: ENV.current_user_id,
            subMenu: this.currentSubKey
          };

          const ds = this.currentDatasets || [];
          if (ds.includes('instructors')) base.instructorsRaw = this.instructorsRaw;
          if (ds.includes('courses'))     base.coursesRaw = this.coursesRaw;
          if (ds.includes('departments')) base.departmentsRaw = this.departmentsRaw;
          if (ds.includes('programs')) base.programsRaw = this.programsRaw;


          if (ds.length) base.sharedLoading = this.sharedLoading;

          // NEW: pass selected ids only when selector is enabled
          const sel = this.currentSelectors || [];

          if (sel.includes('instructor')) {
            base.selectedInstructorId = this.settings?.filters?.instructor || '';
          }

          if (sel.includes('course')) {
            base.selectedCourseId = this.settings?.filters?.course || '';
          }

          if (sel.includes('course_tags')) {
            base.allCourseTags = this.allCourseTags;
            base.selectedCourseTags = this.settings?.filters?.course_tags || [];
          }

          if (sel.includes('programs')) {
            base.programOptions = this.programOptions;
            base.selectedProgram = this.settings?.filters?.program || '';
          }

          if (sel.includes('campus')) {
            base.campuses = this.campuses;
            base.selectedCampus = this.settings?.filters?.campus || '';
          }



          return base;
        },

        programOptions() {
          const list = Array.isArray(this.programsRaw) ? this.programsRaw : [];
          const year = Number(this.settings?.filters?.year);

          // Optional: if you want the dropdown to only show programs for the selected year:
          const filtered = Number.isFinite(year)
            ? list.filter(p => Number(p?.academic_year) === year)
            : list;

          const map = new Map(); // key -> {key,name}
          for (const p of filtered) {
            const key = String(p?.program || '').trim();
            if (!key) continue;
            const name = String(p?.name || key).trim();
            if (!map.has(key)) map.set(key, { key, name });
          }

          return Array.from(map.values()).sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true })
          );
        }

      },
 

      watch: {
        'settings.reportType': 'ensureSharedData',
        'settings.account': 'ensureSharedData',
        'settings.filters.year': 'ensureSharedData',
      },

      methods: {
        drillToReport(payload) {
          const report = String(payload?.report ?? '').trim();
          const subMenu = String(payload?.subMenu ?? '').trim();
          const instructor = String(payload?.instructor ?? '').trim();
          const course = String(payload?.course ?? '').trim();
          const program = String(payload?.program ?? '').trim();
          const campus  = String(payload?.campus ?? '').trim();
          const account= String(payload?.account ?? '').trim();

          // set filters
          if (course) this.$set(this.settings.filters, 'course', course);
          if (instructor) this.$set(this.settings.filters, 'instructor', instructor);
          if (program) this.$set(this.settings.filters, 'program', program);
          if (campus) this.$set(this.settings.filters, 'campus', campus);
          if (account) this.$set(this.settings, 'account', account);

          // switch report type
          this.settings.reportType = report;
          if (!this.settings.subMenuByType) this.$set(this.settings, 'subMenuByType', {});
          this.$set(this.settings.subMenuByType, report, subMenu);

          // persist + refresh data if needed
          this.saveSettings(this.settings);
          this.ensureSharedData();
        },
        onReportChange() {
          this.saveSettings(this.settings);
          // ensure shared data needed for the new report is loaded
          this.ensureSharedData();
        },

        async ensureSharedData() {
          const ds = this.currentDatasets || [];
          const account = this.settings.account;
          const year = this.settings.filters.year;

          if (ds.includes('instructors')) {
            await this.loadInstructorsRaw(account);
          } else {
            this.instructorsRaw = [];
          }

          if (ds.includes('courses')) {
            await this.loadCoursesRaw(account, year);
          } else {
            this.coursesRaw = [];
          }

          if (ds.includes('departments')) {
            await this.loadDepartmentsRaw(account, year);
          } else {
            this.departmentsRaw = [];
          }

          if (ds.includes('programs')) {
            await this.loadProgramsRaw(year);
          } else {
            this.programsRaw = [];
          }


        },

        buildSyllabiRollup(rows) {
          const syllabi = Array.isArray(rows) ? rows.map(row => ({
            ...row,
            doc_code: row?.doc_code ?? row?.simple_syllabus_doc_id ?? '',
            is_published_course: row?.is_published_course ?? null
          })) : [];

          let needsSubmission = 0;
          let needsApproval = 0;
          let completed = 0;

          for (const row of syllabi) {
            if (row?.is_submitted === true && row?.is_approved === true) {
              completed += 1;
              continue;
            }
            if (row?.is_submitted === true) {
              needsApproval += 1;
              continue;
            }
            needsSubmission += 1;
          }

          const total = syllabi.length;

          return {
            total,
            needs_submission: needsSubmission,
            needs_approval: needsApproval,
            completed,
            pct_completed: total > 0 ? (completed / total) : NaN,
            syllabi
          };
        },

        buildProgramSyllabiRollup(rows) {
          return this.buildSyllabiRollup(rows);
        },

        buildDepartmentSyllabiRollup(rows) {
          return this.buildSyllabiRollup(rows);
        },

        buildDepartmentSyllabiSummary(summaryRow) {
          const total = Number(summaryRow?.num_courses) || 0;
          const submitted = Number(summaryRow?.num_courses__submitted) || 0;
          const approved = Number(summaryRow?.num_courses__approved) || 0;
          const needsApproval = Math.max(submitted - approved, 0);
          const needsSubmission = Math.max(total - submitted, 0);

          return {
            total,
            needs_submission: needsSubmission,
            needs_approval: needsApproval,
            completed: approved,
            pct_completed: total > 0 ? (approved / total) : NaN,
            syllabi: []
          };
        },

        mergeProgramsWithSyllabi(programs, syllabiRows, year) {
          const list = Array.isArray(programs) ? programs : [];
          const rows = Array.isArray(syllabiRows) ? syllabiRows : [];
          const targetYear = Number(year);
          const byProgram = new Map();

          for (const row of rows) {
            if (Number(row?.academic_year) !== targetYear) continue;

            const key = String(row?.program_code || '').trim();
            if (!key) continue;

            if (!byProgram.has(key)) byProgram.set(key, []);
            byProgram.get(key).push(row);
          }

          return list.map(program => {
            const key = String(program?.program || program?.program_code || '').trim();
            const rollup = this.buildProgramSyllabiRollup(byProgram.get(key) || []);
            return {
              ...program,
              syllabi: rollup
            };
          });
        },

        mergeDepartmentsWithSyllabi(departments, syllabiRows, year) {
          const list = Array.isArray(departments) ? departments : [];
          const rows = Array.isArray(syllabiRows) ? syllabiRows : [];
          const targetYear = Number(year);
          const byDepartment = new Map();

          for (const row of rows) {
            if (Number(row?.academic_year) !== targetYear) continue;

            const key = String(
              row?.department_code ??
              row?.dept ??
              row?.department_id ??
              ''
            ).trim();
            if (!key) continue;

            byDepartment.set(key, row);
          }

          return list.map(department => {
            const key = String(department?.dept ?? department?.department_id ?? '').trim();
            return {
              ...department,
              syllabi_summary: this.buildDepartmentSyllabiSummary(byDepartment.get(key) || {})
            };
          });
        },

        async loadProgramsRaw(year) {
          try {
            this.sharedLoading.programs = true;

            const [rawPrograms, syllabiRows] = await Promise.all([
              window.ReportData.getProgramsRaw(),
              window.ReportData.getSyllabiStatusRaw({ academicYear: year })
            ]);

            this.programsRaw = this.mergeProgramsWithSyllabi(rawPrograms, syllabiRows, year);
          } catch (e) {
            console.warn('Failed to load programs', e);
            this.programsRaw = [];
          } finally {
            this.sharedLoading.programs = false;
          }
        },

        async loadDepartmentsRaw(account, year) {
          try {
            this.sharedLoading.departments = true;

            const [raw, syllabiRows] = await Promise.all([
              window.ReportData.getDepartmentsRaw(),
              window.ReportData.getSyllabiStatusRaw({ academicYear: year })
            ]);
            const depts = this.mergeDepartmentsWithSyllabi(
              Array.isArray(raw) ? raw : [],
              syllabiRows,
              year
            );

            this.normalizeCourseSurveyTagPcts(depts);
            this.departmentsRaw = depts;

            this.allCourseTags = this.extractCourseTagsFromDepartments(depts);
            this.pruneInvalidSelectedCourseTags();
          } catch (e) {
            console.warn('Failed to load departments', e);
            this.departmentsRaw = [];
            this.allCourseTags = [];
          } finally {
            this.sharedLoading.departments = false;
          }
        },



        normalizeCourseSurveyTagPcts(depts) {
          const list = Array.isArray(depts) ? depts : [];

          for (const d of list) {
            const years = Array.isArray(d?.course_surveys) ? d.course_surveys : [];
            for (const cs of years) {
              if (!cs) continue;

              const total = Number(cs.num_surveys ?? 0);

              // ensure tags_by_name exists and points to the SAME tag objects where possible
              if ((!cs.tags_by_name || typeof cs.tags_by_name !== "object") && Array.isArray(cs.tags)) {
                cs.tags_by_name = cs.tags.reduce((acc, t) => {
                  const name = String(t?.tag ?? "").trim();
                  if (!name) return acc;
                  acc[name] = t; // same reference
                  return acc;
                }, {});
              }

              // recompute pct on tags[]
              if (Array.isArray(cs.tags)) {
                for (const t of cs.tags) {
                  const cnt = Number(t?.tag_count ?? t?.count_of_submissions ?? 0);
                  t.pct_of_submissions = total > 0 ? (cnt / total) : 0;
                }
              }

              // recompute pct on tags_by_name (and create entries if needed)
              if (cs.tags_by_name && typeof cs.tags_by_name === "object") {
                for (const [tagName, info] of Object.entries(cs.tags_by_name)) {
                  const cnt = Number(info?.tag_count ?? info?.count_of_submissions ?? 0);
                  if (info && typeof info === "object") {
                    info.pct_of_submissions = total > 0 ? (cnt / total) : 0;
                  } else {
                    cs.tags_by_name[tagName] = {
                      tag: tagName,
                      tag_count: cnt,
                      pct_of_submissions: total > 0 ? (cnt / total) : 0
                    };
                  }
                }
              }

              // keep tags[] present if only tags_by_name exists
              if (!Array.isArray(cs.tags) && cs.tags_by_name && typeof cs.tags_by_name === "object") {
                cs.tags = Object.values(cs.tags_by_name);
              }
            }
          }

          return list;
        },

        extractCourseTagsFromDepartments(depts) {
          const set = new Set();
          for (const d of (Array.isArray(depts) ? depts : [])) {
            // tags might be on each year row or already bubbled up; scan broadly
            const courseSurveys = d?.course_surveys;
            const rows = Array.isArray(courseSurveys) ? courseSurveys : [courseSurveys].filter(Boolean);

            for (const r of rows) {
              const tags = r?.tags;
              if (!Array.isArray(tags)) continue;
              for (const t of tags) {
                if (t && typeof t.tag === 'string' && t.tag.trim()) set.add(t.tag.trim());
              }
            }
          }
          return Array.from(set).sort((a,b)=>a.localeCompare(b));
        },

        pruneInvalidSelectedCourseTags() {
          const selected = this.settings?.filters?.course_tags;
          if (!Array.isArray(selected) || !selected.length) return;

          const allowed = new Set(this.allCourseTags || []);
          const next = selected.filter(t => allowed.has(t));

          if (next.length !== selected.length) {
            this.$set(this.settings.filters, 'course_tags', next);
            this.saveSettings(this.settings);
          }
        },



        async loadStudentsRaw(account) {
          try {
            this.sharedLoading.students = true;
            const raw = await window.ReportData.getStudentsRaw({ account })
          } catch (e) {
            console.error(e);
          }
        },


        async loadInstructorsRaw(account) {
          try {
            this.sharedLoading.instructors = true;
            const raw = await window.ReportData.getInstructorsRaw({ account });
            this.instructorsRaw = Array.isArray(raw) ? raw : [];

            // Optional: if selected instructor no longer exists, clear it
            const cur = this.settings?.filters?.instructor;
            if (cur && !this.instructorsRaw.some(i => String(i.canvas_id) === String(cur) || String(i.canvas_user_id) === String(cur))) {
              this.$set(this.settings.filters, 'instructor', '');
              this.saveSettings(this.settings);
            }
          } catch (e) {
            console.error('Failed to load instructorsRaw', e);
            this.instructorsRaw = [];
          } finally {
            this.sharedLoading.instructors = false;
          }
        },

        async loadCoursesRaw(account, year) {
          try {
            this.sharedLoading.courses = true;
            const raw = await window.ReportData.getCoursesRaw({ account, year });
            const arr = Array.isArray(raw) ? raw : [];
            this.coursesRaw = dedupeCoursesByCourseCode(arr);


            // Optional: clear invalid selected course
            const cur = this.settings?.filters?.course;
            if (cur && !this.coursesRaw.some(c => String(c.id) === String(cur) || String(c.canvas_course_id) === String(cur) || String(c.course_id) === String(cur))) {
              this.$set(this.settings.filters, 'course', '');
              this.saveSettings(this.settings);
            }
          } catch (e) {
            console.error('Failed to load coursesRaw', e);
            this.coursesRaw = [];
          } finally {
            this.sharedLoading.courses = false;
          }
        },

        setSubMenu(value) {
          if (!this.settings.subMenuByType) {
            this.$set(this.settings, 'subMenuByType', {});
          }
          this.$set(this.settings.subMenuByType, this.settings.reportType, value);
          this.saveSettings(this.settings);
        },

        async loadSettings(settings) {
          const fallback = JSON.parse(JSON.stringify(settings));
          let saved = {};
          try {
            const resp = await $.get(`/api/v1/users/self/custom_data/instructor?ns=edu.btech.canvas`);
            if (resp.data && resp.data.settings) saved = resp.data.settings;
          } catch (err) { /* keep defaults */ }

          const merged = JSON.parse(JSON.stringify(fallback));
          merged.account = saved.account ?? fallback.account;
          merged.reportType = saved.reportType ?? fallback.reportType;

          if (saved.filters) merged.filters = Object.assign({}, fallback.filters, saved.filters);
          else merged.filters = JSON.parse(JSON.stringify(fallback.filters));

          merged.subMenuByType = saved.subMenuByType || fallback.subMenuByType || {};

          if (merged.anonymous === "true") merged.anonymous = true; else merged.anonymous = false;
          for (const key in merged.filters) {
            const val = merged.filters[key];
            if (val === "true") merged.filters[key] = true;
            else if (val === "false") merged.filters[key] = false;
          }
          merged.filters.section = 'All';

          // Ensure known keys exist to avoid Vue reactivity gotchas
          if (!merged.filters.year) merged.filters.year = String(new Date().getFullYear());
          if (merged.filters.instructor == null) merged.filters.instructor = '';
          if (merged.filters.course == null) merged.filters.course = '';

          return merged;
        },

        async saveSettings(settings) {
          await $.put(`/api/v1/users/self/custom_data/instructor?ns=edu.btech.canvas`, {
            data: { settings: settings }
          });
        },

        toggleCourseTags() {
          this.courseTagsOpen = !this.courseTagsOpen;

          if (this.courseTagsOpen) {
            this.courseTagsSearch = '';

            this.$nextTick(() => {
              const btn = this.$refs.courseTagsBtn;
              if (btn) {
                const r = btn.getBoundingClientRect();
                const panelW = Math.max(r.width, 240);
                const gap = 6;

                let top = r.bottom + gap;
                const panelH = 260;
                const spaceBelow = window.innerHeight - r.bottom;

                if (spaceBelow < panelH && r.top > panelH) {
                  top = r.top - gap;
                  this.courseTagsPopupStyle = { left: `${r.left}px`, top: `${top}px`, width: `${panelW}px`, openAbove: true };
                } else {
                  this.courseTagsPopupStyle = { left: `${r.left}px`, top: `${top}px`, width: `${panelW}px`, openAbove: false };
                }
              }

              const input = this.$refs.courseTagsSearchInput;
              if (input && typeof input.focus === 'function') {
                input.focus();
                input.select && input.select();
              } else {
                // fallback: focus scroll container
                const sc = this.$refs.courseTagsScroll;
                if (sc && typeof sc.focus === 'function') sc.focus();
              }
            });
          }
        },

        clearCourseTags() {
          this.$set(this.settings.filters, 'course_tags', []);
          this.saveSettings(this.settings);
        },


        close() { $(this.$el).hide(); }
      }
    });
  }

  function loadCSS(url) {
    var style = document.createElement('link'),
      head = document.head || document.getElementsByTagName('head')[0];
    style.href = url;
    style.type = 'text/css';
    style.rel = "stylesheet";
    style.media = "screen,print";
    head.insertBefore(style, head.firstChild);
  }

  async function _init() {
    loadCSS("https://reports.bridgetools.dev/department_report/style/main.css");
    loadCSS("https://reports.bridgetools.dev/style/main.css");

    await $.getScript("https://bridgetools.dev/canvas/external-libraries/vue.2.6.12.js");
    await $.getScript("https://bridgetools.dev/canvas/external-libraries/d3.v7.js");

    // Reports
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/departments.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/departments-syllabi.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department.js");
    await $.getScript("https://bridgetools.dev/canvas/custom_features/reports/combined/reports/department-syllabi.js");

    postLoad();
  }

  _init();
})();
