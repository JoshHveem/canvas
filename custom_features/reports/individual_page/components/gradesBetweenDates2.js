(async function () {
  Vue.component("grades-between-dates-2", {
    template: `
      <div>
        <div v-if='loadingAssignments'>
          <progress 
            id="load-progress" 
            :value="loadingProgress" 
            max="100"
          ></progress>
          {{loadingMessage}}
        </div>

        <div v-else>
          <div class='btech-report-submission-dates'>
            <select @change='updateDatesToSelectedTerm()' v-model='selectedTermId'>
              <option selected disabled value=''>-select term-</option>
              <option v-for='term in terms' :value='term._id'>
                {{dateToHTMLDate(term.entry_date) + " to " + dateToHTMLDate(term.exit_date)}}
              </option>
            </select>

            <span>Start Date:</span>
            <input type="date" v-model="submissionDatesStart" @change="getIncludedAssignmentsBetweenDates()">

            <span>End Date:</span>
            <input type="date" v-model="submissionDatesEnd" @change="getIncludedAssignmentsBetweenDates()">

            <button
              v-if="termDatesDirty"
              :disabled="savingTermDates"
              :style="btnStyle('primary', savingTermDates)"
              @click="saveTermDates"
              @mouseover="$event.target.style.filter='brightness(0.92)'"
              @mouseout="$event.target.style.filter='none'"
            >
              Save
            </button>

            <button
              v-if="termDatesDirty"
              :disabled="savingTermDates"
              :style="btnStyle('secondary', savingTermDates)"
              @click="revertTermDates"
              @mouseover="$event.target.style.filter='brightness(0.92)'"
              @mouseout="$event.target.style.filter='none'"
            >
              Cancel
            </button>
          </div>

          <!-- BULK UPDATE MODAL -->
          <div v-if="showBulkUpdateModal" style="
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          ">
            <div style="
              background: white;
              padding: 1rem;
              border-radius: 14px;
              width: 520px;
              max-height: 80vh;
              overflow-y: auto;
              box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            ">
              <h3 style="margin-top:0;">Update term dates for all students?</h3>

              <div v-if="bulkUpdateStep === 'confirm'">
                <p style="margin-bottom: 1rem;">
                  Would you like to update the term dates for <b>all students</b> in section
                  <b>{{selectedTerm.section_code}}</b> ({{selectedTerm.academic_year}})?
                </p>

                <button :style="btnStyle('primary')" @click="loadBulkUpdateList">
                  Yes, choose students
                </button>

                <button :style="btnStyle('secondary')" @click="confirmSingleUpdate">
                  No
                </button>
              </div>

              <div v-if="bulkUpdateStep === 'select'">
                <p><b>Select students to update:</b></p>

                <div v-if="bulkLoading">Loading students…</div>

                <div v-else>
                  <div style="margin-bottom: 0.75rem;">
                    <button :style="btnStyle('secondary')" @click="selectAllBulk(true)">Select All</button>
                    <button :style="btnStyle('secondary')" @click="selectAllBulk(false)">Select None</button>
                  </div>

                  <div v-for="t in bulkTermsToUpdate" :key="t._id" style="margin-bottom: 0.35rem;">
                    <label style="display:flex; gap:0.5rem; align-items:center;">
                      <input type="checkbox" :value="t._id" v-model="bulkSelectedTermIds">
                      <span>
                        {{t.studentName || t.student_sis_id || t.sis_id || t.canvas_id || "Unknown Student"}}
                      </span>
                    </label>
                  </div>

                  <div style="margin-top: 1rem;">
                    <button
                      :style="btnStyle('primary')"
                      :disabled="bulkSaving || bulkSelectedTermIds.length === 0"
                      @click="confirmBulkUpdate"
                    >
                      {{bulkSaving ? "Saving..." : "Confirm Update"}}
                    </button>
                    <button
                      :style="btnStyle('secondary')"
                      :disabled="bulkSaving"
                      @click="closeBulkModal"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- REPORT TABLE -->
          <table class='btech-report-table' border='1'>
            <thead border='1'>
              <tr>
                <th>Course</th>
                <th>Term Grades</th>
                <th>Term Completed</th>
                <th>Course Credits</th>
                <th>Credits Completed</th>
              </tr>
            </thead>
            <tbody border='1'>
              <tr v-for='course in courses' :key='course.course_id'>
                <td>
                  <a 
                    :href="\`/courses/\${course.course_id}/grades/\${userId}\`"
                    target="_blank"
                  >
                    {{course.name}}
                  </a>
                </td>

                <td>{{getGradesBetweenDates(course.course_id)}}</td>
                <td>{{getProgressBetweenDates(course.course_id)}}</td>
                <td><input style="padding: 0px 4px; margin: 0px; width: 3rem;" v-model="course.credits" type="text"></td>
                <td>{{getCreditsCompleted(course)}}</td>
              </tr>
              <tr height="10px"></tr>
            </tbody>

            <tfoot border='1'>
              <tr>
                <td><b>Grade to Date</b></td>
                <td>
                  {{weightedGradeForTerm}}%
                  <div style='float: right;'>
                    <i style='cursor: pointer;' v-if='showGradeDetails' class='icon-minimize'
                      @click='showGradeDetails = false;' title='Hide additional information.'></i>
                    <i style='cursor: pointer;' v-if='!showGradeDetails' class='icon-question'
                      @click='showGradeDetails = true;'
                      title='Click here for more details about how this grade was calculated.'></i>
                  </div>
                </td>
              </tr>

              <tr height="10px"></tr>
              <tr>
                <td><b>Final Grade (based on enrolled)</b></td>
                <td>{{weightedFinalGradeForTerm}}%</td>
              </tr>
              <tr>
                <td><b>Credits Completed</b></td>
                <td>{{sumCreditsCompleted()}}</td>
              </tr>
              <tr>
                <td><b>Credits Enrolled</b></td>
                <td>{{estimatedCreditsEnrolled}}</td>
              </tr>
              <tr>
                <td><b>Credits Required to Date</b></td>
                <td><input style="padding: 0px 4px; margin: 0px;" v-model="estimatedCreditsRequired" type="text"></td>
              </tr>
            </tfoot>
          </table>

          <div id="submissionGraph"></div>

          <div v-if='showGradeDetails'>
            <div v-for='course in includedAssignments' :key='course.name'>
              <div v-if='checkIncludeCourse(course)'>
                <h3>
                  <input @change="calcGradesFromIncludedAssignments" type="checkbox" :id="course.id + '-checkbox'"
                    v-model="course.include">
                  <a :href="'/courses/' + course.id + '/grades/' + userId" target="_blank">{{course.name}}</a>
                </h3>

                <div v-if='course.include'>
                  <div v-for='group in course.groups' :key='group.name'>
                    <div v-if='checkIncludeGroup(group)'>
                      <h4>
                        <input @change="calcGradesFromIncludedAssignments" type="checkbox"
                          :id="course.id + '-' + group.id + '-checkbox'"
                          v-model="group.include" :disabled="!course.include">
                        <b>{{group.name}} ({{group.groupWeight}}%)</b>
                      </h4>

                      <div v-if='group.include'>
                        <div v-for='assignment in group.assignments' :key='assignment.id'>
                          <div v-if='checkIncludeAssignment(assignment)'>
                            <div>
                              <input @change="calcGradesFromIncludedAssignments" type="checkbox"
                                :id="course.id + '-' + group.id + '-' + assignment.id + '-checkbox'"
                                v-model="assignment.include" :disabled="!course.include || !group.include">

                              <a style='padding-left: 1em;'
                                :href="'/courses/' + course.id + '/assignments/' + assignment.id + '/submissions/' + assignment.sub"
                                target="_blank">
                                {{assignment.name}}
                              </a>
                            </div>

                            <div style='padding-left: 1.5em;'>
                              {{assignment.score}} / {{assignment.points_possible}} pts
                              ({{Math.round((assignment.score / assignment.points_possible) * 100)}}%)
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    `,

    props: {
      colors: { type: Object, default: () => ({}) },
      IS_TEACHER: false,
      scroll: { type: Boolean, default: false },
      terms: { type: Array, default: [] },
      enrollments: { type: Object, default: () => ({}) },
      settings: { type: Object, default: () => ({}) },
      userId: "",
      user: { type: Object, default: () => ({}) },
      studentTree: { type: Object, default: () => ({ type: "someType" }) }
    },

    computed: {
      estimatedCreditsEnrolled() {
        const start = this.parseDate(this.submissionDatesStart);
        const end = this.parseDate(this.submissionDatesEnd);
        if (!start || !end || end <= start) return 0;
        const msInFiveWeeks = 60 * 60 * 24 * 7 * 5 * 1000;
        return Math.floor(Number((end - start) / msInFiveWeeks) * 4) / 4;
      },

      weightedGradeForTerm() {
        const requiredCredits = this.estimatedCreditsRequired;
        const creditsCompleted = this.sumCreditsCompleted();
        let grade = this.unweightedGrade;

        if (creditsCompleted < requiredCredits && requiredCredits !== 0 && creditsCompleted !== 0) {
          grade *= creditsCompleted / requiredCredits;
        }

        const output = Number(grade.toFixed(2));
        return isNaN(output) ? 0 : output;
      },

      unweightedGrade() {
        let totalWeightedGrade = 0;
        const totalCreditsCompleted = this.sumCreditsCompleted();
        const totalProgress = this.sumProgressBetweenDates();

        for (let c in this.courses) {
          const course = this.courses[c];
          const progress = this.progressBetweenDates[course.course_id];
          const grade = this.gradesBetweenDates[course.course_id];

          if (progress !== undefined && grade !== undefined && grade !== "N/A") {
            if (totalCreditsCompleted === 0) {
              const weightedGrade = grade * (progress / totalProgress);
              totalWeightedGrade += weightedGrade;
            } else {
              const creditsCompleted = this.getCreditsCompleted(course);
              let weightedGrade = grade;
              weightedGrade *= creditsCompleted / totalCreditsCompleted;
              totalWeightedGrade += weightedGrade;
            }
          }
        }

        const output = parseFloat(totalWeightedGrade.toFixed(2));
        return isNaN(output) ? 0 : output;
      },

      weightedFinalGradeForTerm() {
        const requiredCredits = this.estimatedCreditsEnrolled;
        const creditsCompleted = this.sumCreditsCompleted();
        let grade = this.unweightedGrade;

        if (creditsCompleted < requiredCredits && requiredCredits !== 0 && creditsCompleted !== 0) {
          grade *= creditsCompleted / requiredCredits;
        }

        const output = Number(grade.toFixed(2));
        return isNaN(output) ? 0 : output;
      },

      termDatesDirty() {
        return (
          !!this.selectedTerm?._id &&
          (this.submissionDatesStart !== this.savedSubmissionDatesStart ||
            this.submissionDatesEnd !== this.savedSubmissionDatesEnd)
        );
      }
    },

    data() {
      return {
        savedSubmissionDatesStart: undefined,
        savedSubmissionDatesEnd: undefined,

        savingTermDates: false,

        showBulkUpdateModal: false,
        bulkUpdateStep: "confirm",
        bulkTermsToUpdate: [],
        bulkSelectedTermIds: [],
        bulkLoading: false,
        bulkSaving: false,

        selectedTermId: "",
        selectedTerm: {},
        gradesBetweenDates: {},
        progressBetweenDates: {},
        hoursAssignmentData: {},
        hoursBetweenDates: {},
        submissionData: {},
        showGradeDetails: false,
        includedAssignments: {},
        courseTotalPoints: {},
        courseAssignmentGroups: {},
        estimatedCreditsRequired: 0,
        submissionDatesStart: undefined,
        submissionDatesEnd: undefined,
        loadingProgress: 0,
        loadingMessage: "Loading...",
        loadingAssignments: true,
        submissionDates: [],
        courses: []
      };
    },

    created: async function () {
      this.loadingProgress = 0;
      this.loadingMessage = "Loading Courses";
      this.courses = await this.getCourseData();

      if (!this.courses?.length) {
        this.loadingMessage = "No courses available.";
        this.loadingProgress = 100;
        return;
      }

      this.submissionData = {};
      this.courseAssignmentGroups = {};

      const allSubmissions = this.courses.flatMap(course => {
        const subs = course.additionalData?.submissions || [];
        subs.forEach(sub => (sub.course_id = course.id));
        this.submissionData[course.id] = subs;

        if (course.additionalData?.assignment_groups) {
          this.courseAssignmentGroups[course.id] = course.additionalData.assignment_groups;
        }
        return subs;
      });

      allSubmissions.forEach(sub => {
        sub.submittedAt = sub.submittedAt
          ? new Date(sub.submittedAt)
          : sub.gradedAt
          ? new Date(sub.gradedAt)
          : null;
      });

      this.submissionDates = allSubmissions
        .filter(s => s.submittedAt)
        .sort((a, b) => a.submittedAt - b.submittedAt);

      this.loadingProgress = 100;
      this.loadingMessage = "Data loading complete.";
      this.loadingAssignments = false;
    },

    methods: {
      /** -------------------------
       *  BULK MODAL FLOW
       *  ------------------------- */

      saveTermDates() {
        const termId = this.selectedTerm?._id;
        if (!termId) return;

        // show modal immediately
        this.showBulkUpdateModal = true;
        this.bulkUpdateStep = "confirm";

        // seed selectedTermIds with the current term
        this.bulkSelectedTermIds = [termId];
      },

      async confirmSingleUpdate() {
        const termId = this.selectedTerm?._id;
        if (!termId) return;

        this.savingTermDates = true;

        try {
          await bridgetools.req(
            `https://reports.bridgetools.dev/api2/hs_terms/${termId}/dates?requester_id=${ENV.current_user_id}`,
            {
              entry_date: this.submissionDatesStart,
              exit_date: this.submissionDatesEnd
            },
            "POST"
          );

          this.savedSubmissionDatesStart = this.submissionDatesStart;
          this.savedSubmissionDatesEnd = this.submissionDatesEnd;

          this.selectedTerm.entry_date = new Date(this.submissionDatesStart);
          this.selectedTerm.exit_date = new Date(this.submissionDatesEnd);

          this.closeBulkModal();
        } catch (err) {
          console.error("Failed saving term dates:", err);
          alert("Failed to save term date changes.");
        } finally {
          this.savingTermDates = false;
        }
      },

      closeBulkModal() {
        this.showBulkUpdateModal = false;
        this.bulkUpdateStep = "confirm";
        this.bulkTermsToUpdate = [];
        this.bulkSelectedTermIds = [];
      },

      selectAllBulk(on = true) {
        this.bulkSelectedTermIds = on ? this.bulkTermsToUpdate.map(t => t._id) : [];
      },

      /**
       * Load all terms in this section/year AND fetch names from Canvas API.
       */
      async loadBulkUpdateList() {
        try {
          this.bulkUpdateStep = "select";
          this.bulkLoading = true;

          const section = this.selectedTerm.section_code;
          const year = this.selectedTerm.academic_year;

          const terms = await bridgetools.req(
            `https://reports.bridgetools.dev/api2/hs_terms/by_section/${section}/${year}?requester_id=${ENV.current_user_id}`,
            {},
            "GET"
          );

          this.bulkTermsToUpdate = terms || [];

          // default select all
          this.bulkSelectedTermIds = this.bulkTermsToUpdate.map(t => t._id);

          // ensure current term included
          const currentTermId = this.selectedTerm?._id;
          if (currentTermId && !this.bulkSelectedTermIds.includes(currentTermId)) {
            this.bulkSelectedTermIds.push(currentTermId);
          }

          // fetch names from Canvas
          await this.attachCanvasNamesToBulkTerms();

        } catch (err) {
          console.error(err);
          alert("Failed loading students for bulk update.");
          this.closeBulkModal();
        } finally {
          this.bulkLoading = false;
        }
      },

      /**
       * Calls Canvas API to fetch each user name, but throttles concurrency.
       * Uses SIS IDs where possible (preferred).
       */
      async attachCanvasNamesToBulkTerms() {
        // Build identifiers from term objects (support several possible fields)
        const ids = this.bulkTermsToUpdate.map(t => ({
          termId: t._id,
          sis: t.student_sis_id || t.sis_id,
          canvas: t.student_canvas_id || t.canvas_id
        }));

        // We'll fetch by SIS ID first, fallback to canvas id
        const tasks = ids.map(row => async () => {
          const name = await this.fetchCanvasUserName(row.sis, row.canvas);
          return { termId: row.termId, name };
        });

        const results = await this.runThrottled(tasks, 8); // 8 at a time

        const nameMap = results.reduce((m, r) => {
          if (r?.termId) m[r.termId] = r.name;
          return m;
        }, {});

        // attach to terms list
        this.bulkTermsToUpdate = this.bulkTermsToUpdate.map(t => ({
          ...t,
          studentName: nameMap[t._id] || null
        }));
      },

      /**
       * Fetch a single user's name from Canvas.
       * Prefers SIS ID: /api/v1/users/sis_user_id:XYZ
       * Falls back to /api/v1/users/:canvas_id
       */
      async fetchCanvasUserName(sisId, canvasId) {
        try {
          if (sisId) {
            const u = await canvasGet(`/api/v1/users/sis_user_id:${sisId}`);
            return u?.name || u?.short_name || u?.sortable_name || `SIS:${sisId}`;
          }
          if (canvasId) {
            const u = await canvasGet(`/api/v1/users/${canvasId}`);
            return u?.name || u?.short_name || u?.sortable_name || `Canvas:${canvasId}`;
          }
          return null;
        } catch (e) {
          // don't hard-fail modal if one name doesn't resolve
          return sisId || canvasId || null;
        }
      },

      /**
       * Simple throttler for async tasks (avoid 100+ Canvas requests at once)
       */
      async runThrottled(taskFns, limit = 8) {
        const results = [];
        let index = 0;

        const workers = new Array(limit).fill(null).map(async () => {
          while (index < taskFns.length) {
            const i = index++;
            try {
              results[i] = await taskFns[i]();
            } catch (e) {
              results[i] = null;
            }
          }
        });

        await Promise.all(workers);
        return results.filter(Boolean);
      },

      async confirmBulkUpdate() {
        try {
          this.bulkSaving = true;

          await bridgetools.req(
            `https://reports.bridgetools.dev/api2/hs_terms/bulk_update_dates?requester_id=${ENV.current_user_id}`,
            {
              termIds: this.bulkSelectedTermIds,
              entry_date: this.submissionDatesStart,
              exit_date: this.submissionDatesEnd
            },
            "POST"
          );

          this.savedSubmissionDatesStart = this.submissionDatesStart;
          this.savedSubmissionDatesEnd = this.submissionDatesEnd;

          this.selectedTerm.entry_date = new Date(this.submissionDatesStart);
          this.selectedTerm.exit_date = new Date(this.submissionDatesEnd);

          this.closeBulkModal();
          alert("Bulk update complete.");
        } catch (err) {
          console.error(err);
          alert("Failed bulk updating students.");
        } finally {
          this.bulkSaving = false;
        }
      },

      /** -------------------------
       *  BUTTON STYLE
       *  ------------------------- */
      btnStyle(kind = "primary", disabled = false) {
        const blue = this.colors?.blue || "#1a73e8";
        const darkGray = this.colors?.darkGray || "#333";
        const bg = kind === "primary" ? blue : kind === "secondary" ? darkGray : "#000";

        return {
          background: bg,
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          padding: "4px 10px",
          marginLeft: kind === "primary" ? "0.5rem" : "0.25rem",
          fontSize: "0.85rem",
          fontWeight: "600",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? "0.55" : "1",
          transition: "filter 0.15s ease, opacity 0.15s ease",
          lineHeight: "1.2",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)"
        };
      },

      /** -------------------------
       *  TERM DATE STATE
       *  ------------------------- */
      revertTermDates() {
        this.submissionDatesStart = this.savedSubmissionDatesStart;
        this.submissionDatesEnd = this.savedSubmissionDatesEnd;
        this.getIncludedAssignmentsBetweenDates();
      },

      updateDatesToSelectedTerm() {
        const term = this.terms.find(t => t._id === this.selectedTermId);
        if (!term) return;

        this.selectedTerm = term;
        const start = this.dateToHTMLDate(term.entry_date);
        const end = this.dateToHTMLDate(term.exit_date);

        this.submissionDatesStart = start;
        this.submissionDatesEnd = end;

        this.savedSubmissionDatesStart = start;
        this.savedSubmissionDatesEnd = end;

        this.getIncludedAssignmentsBetweenDates();
        this.drawSubmissionsGraph(new Date(term.entry_date), new Date(term.exit_date));
      },

      /** -------------------------
       *  EXISTING REPORT METHODS
       *  (unchanged from your original)
       *  ------------------------- */

      // ... all the rest of your existing methods are unchanged ...
      // You already have huge method blocks, so I kept the drop-in focused:
      // Make sure to keep your existing:
      // - drawSubmissionsGraph
      // - extractYear
      // - fetchAllConnection
      // - getAllAssignmentsByGroup
      // - getAllSubmissions
      // - getGraphQLData
      // - getCourseData
      // - getIncludedAssignmentsBetweenDates
      // - calcGradesFromIncludedAssignments
      // - calcCourseGroupPointsPossible
      // - newCourse
      // - checkIncludeCourse/group/assignment
      // - dateToHTMLDate
      //
      // IMPORTANT:
      // Paste the rest of your original methods below this comment.
      // Everything above this comment is the new modal & name-fetch implementation.

      /** ==========================
       *  YOUR ORIGINAL METHODS START
       *  ========================== */

      drawSubmissionsGraph(startDate, endDate) {
        // (unchanged) ... keep your original implementation
      },

      extractYear(termName) {
        const yearMatch = termName.match(/\b(20\d{2})\b/);
        return yearMatch ? yearMatch[1] : null;
      },

      async fetchAllConnection(courseId, connectionField, args = {}, nodeSelection = "") {
        const pageSize = 50;
        let allNodes = [];
        let hasNext = true;
        let after = null;

        while (hasNext) {
          const argsStr = Object.entries({ ...args, first: pageSize, after })
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join(", ");

          const query = `{
            course(id: "${courseId}") {
              ${connectionField}(${argsStr}) {
                ${nodeSelection}
                pageInfo { hasNextPage endCursor }
              }
            }
          }`;

          const res = await $.post("/api/graphql", { query });
          const conn = res.data.course[connectionField];

          allNodes.push(...conn.nodes);
          hasNext = conn.pageInfo.hasNextPage;
          after = conn.pageInfo.endCursor;
        }

        return allNodes;
      },

      async getAllAssignmentsByGroup(course) {
        const assignments = await this.fetchAllConnection(
          course.id,
          "assignmentsConnection",
          {},
          `nodes { _id name published pointsPossible assignmentGroupId }`
        );

        return assignments.reduce((map, a) => {
          const gid = a.assignmentGroupId || "__ungrouped";
          if (!map[gid]) map[gid] = [];
          map[gid].push(a);
          return map;
        }, {});
      },

      async getAllSubmissions(course) {
        return this.fetchAllConnection(
          course.id,
          "submissionsConnection",
          { studentIds: this.userId },
          `nodes {
            id assignmentId submittedAt grade gradedAt score userId
            assignment { name published pointsPossible }
          }`
        );
      },

      async getGraphQLData(course) {
        try {
          const groupQuery = `{
            course(id: "${course.id}") {
              assignmentGroupsConnection {
                nodes { _id name groupWeight state }
              }
            }
          }`;

          const groupRes = await $.post("/api/graphql", { query: groupQuery });
          const groups = groupRes.data.course.assignmentGroupsConnection.nodes.filter(
            g => g.state === "available"
          );

          const assignmentsByGroup = await this.getAllAssignmentsByGroup(course);
          const submissions = await this.getAllSubmissions.call(this, course);

          groups.forEach(g => (g.assignments = assignmentsByGroup[g._id] || []));

          return { name: course.name, assignment_groups: groups, submissions };
        } catch (err) {
          console.error(err);
          return { name: course.name, assignment_groups: [], submissions: [] };
        }
      },

      async getCourseData() {
        const base = `/api/v1/users/${this.userId}/courses?enrollment_Type=student&include[]=total_scores&include[]=current_grading_period_scores&include[]=term`;
        const queries = [
          `${base}&enrollment_state=active&state[]=available&state[]=completed`,
          `${base}&enrollment_state=completed&state[]=active`,
          `${base}&enrollment_state=completed&state[]=available&state[]=completed`
        ];

        const results = await Promise.all(queries.map(q => canvasGet(q)));

        const coursesById = new Map();
        results.flat().forEach(course => {
          if (!coursesById.has(course.id)) coursesById.set(course.id, course);
        });

        const courses = Array.from(coursesById.values());

        for (let c in courses) {
          let course = courses[c];
          course.course_id = course.id;

          this.loadingMessage = "Loading Course Data for Course " + course.course_id;

          let year = this.extractYear(course.term.name);
          if (year) {
            let active = false;
            let completed = false;
            course.enrollments.forEach(enrollment => {
              if (enrollment.enrollment_state == "active") active = true;
              if (enrollment.enrollment_state == "completed") completed = true;
            });

            let state = active ? "Active" : completed ? "Completed" : "N/A";
            let courseRow = this.newCourse(course.id, state, course.name, year, course.course_code);
            course.hours = courseRow.hours;
            course.credits = courseRow.hours / 30;
          }

          this.loadingMessage = "Loading Assignment Data for Course " + course.id;
          let additionalData = await this.getGraphQLData(course);
          course.additionalData = additionalData;
          course.assignments = additionalData.submissions;
        }

        return courses;
      },

      // keep your remaining original methods below (unchanged)
      sumProgressBetweenDates() {
        let sum = 0;
        this.courses.forEach(course => (sum += this.progressBetweenDates[course.id]));
        return sum;
      },

      sumCreditsCompleted() {
        let sum = 0;
        this.courses.forEach(course => {
          let progress = this.progressBetweenDates[course.course_id];
          let credits = course.hours / 30;
          if (credits == "N/A") hours = 0;
          if (progress > 0 && credits > 0) {
            sum += Math.round(progress * credits) * 0.01;
          }
        });
        return parseFloat(sum.toFixed(2)) ?? 0;
      },

      parseDate(dateString) {
        return dateString ? new Date(dateString) : undefined;
      },

      getProgressBetweenDates(courseId) {
        const v = this.progressBetweenDates[courseId];
        return v !== undefined ? `${v}%` : "";
      },

      getGradesBetweenDates(courseId) {
        const v = this.gradesBetweenDates[courseId];
        return v !== undefined ? `${v}%` : "";
      },

      getCreditsCompleted(course) {
        let progress = this.progressBetweenDates[course.course_id];
        let completed = 0;
        if (progress !== undefined) completed = parseFloat((Math.round(progress * course.hours) * 0.01).toFixed(2));
        if (isNaN(completed)) completed = 0;
        credits = Math.round((completed / 30) * 100) / 100;
        return credits;
      },

      async getIncludedAssignmentsBetweenDates() {
        // keep your original (unchanged)
      },

      calcGradesFromIncludedAssignments() {
        // keep your original (unchanged)
      },

      calcCourseGroupPointsPossible(courseId, groupId, sumGroupWeights) {
        // keep your original (unchanged)
      },

      newCourse(id, state, name, year, courseCode) {
        // keep your original (unchanged)
      },

      checkIncludeCourse(course) {
        return Object.values(course.groups || {}).some(g => this.checkIncludeGroup(g));
      },

      checkIncludeGroup(group) {
        return !!group.include;
      },

      checkIncludeAssignment(assignment) {
        return true;
      },

      dateToHTMLDate(date) {
        date = new Date(date);
        date.setDate(date.getDate() + 1);
        let month = "" + (date.getMonth() + 1);
        if (month.length === 1) month = "0" + month;

        let day = "" + date.getDate();
        if (day.length === 1) day = "0" + day;

        return date.getFullYear() + "-" + month + "-" + day;
      }
    }
  });
})();
