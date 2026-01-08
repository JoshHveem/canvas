(async function() {
  Vue.component('grades-between-dates-2', {
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
              <option v-for='term in terms' :value='term._id'>{{dateToHTMLDate(term.entry_date) + " to " + dateToHTMLDate(term.exit_date)}}</option>
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
              {{ savingTermDates ? "Saving..." : "Save" }}
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
              width: 500px;
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
                        {{t.student?.hs_name || t.student?.sis_id || t.student?.canvas_id || "Unknown Student"}}
                      </span>
                    </label>
                  </div>

                  <div style="margin-top: 1rem;">
                    <button :style="btnStyle('primary')" :disabled="bulkSaving" @click="confirmBulkUpdate">
                      {{bulkSaving ? "Saving..." : "Confirm Update"}}
                    </button>
                    <button :style="btnStyle('secondary')" :disabled="bulkSaving" @click="closeBulkModal">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                <td><input style="padding: 0px 4px; margin: 0px; width: 3rem;" v-model="course.credits" type="text">
                </td>
                <td>{{getCreditsCompleted(course)}}</td>
              </tr>
              <tr height="10px"></tr>
            </tbody>
            <tfoot border='1'>
              <tr>
                <td><b>Grade to Date</b>
                </td>
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
                <td><input style="padding: 0px 4px; margin: 0px;" v-model="estimatedCreditsRequired" type="text">
                </td>
              </tr>
            </tfoot>
          </table>
          <div id = "submissionGraph"></div>
          <div v-if='showGradeDetails'>
            <!--include a reset button to go back to the default. Probably just rerun the code from on change of date-->
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
                        <b>{{group.name}} ({{group.groupWeight}}%)</b></h4>
                      <div v-if='group.include'>
                        <div v-for='assignment in group.assignments' :key='assignment.id'>
                          <div v-if='checkIncludeAssignment(assignment)'>
                            <div>
                              <input @change="calcGradesFromIncludedAssignments" type="checkbox"
                                :id="course.id + '-' + group.id + '-' + assignment.id + '-checkbox'"
                                v-model="assignment.include" :disabled="!course.include || !group.include">

                              <a style='padding-left: 1em;'
                                :href="'/courses/' + course.id + '/assignments/' + assignment.id + '/submissions/' + assignment.sub"
                                target="_blank"
                                >
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
      colors: {
        type: Object,
        default: () => ({})
      },
      IS_TEACHER: false,
      scroll: {
        type: Boolean,
        default: false 
      },
      terms: {
        type: Array,
        default: [] 
      },
      enrollments: {
        type: Object,
        default: () => ({})
      },
      settings: {
        type: Object,
        default: () => ({})
      },
      userId: "",
      user: {
        type: Object,
        default: () => ({})
      },
      studentTree: {
        type: Object,
        default: () => ({
          type: 'someType'
        })
      }
    },
    computed: {
      estimatedCreditsEnrolled() {
        const start = this.parseDate(this.submissionDatesStart);
        const end   = this.parseDate(this.submissionDatesEnd);

        if (!start || !end || end <= start) return 0;

        const msInFiveWeeks = 60 * 60 * 24 * 7 * 5 * 1000;
        return Math.floor(Number((end - start) / msInFiveWeeks) * 4) / 4;
      },
      weightedGradeForTerm() {
        const requiredCredits = this.estimatedCreditsRequired;
        const creditsCompleted = this.sumCreditsCompleted();

        let grade = this.unweightedGrade;

        if (
          creditsCompleted < requiredCredits &&
          requiredCredits !== 0 &&
          creditsCompleted !== 0
        ) {
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
              weightedGrade *= (creditsCompleted / totalCreditsCompleted);
              totalWeightedGrade += weightedGrade;
            }
          }
        }

        const output = parseFloat(totalWeightedGrade.toFixed(2));
        return isNaN(output) ? 0 : output;
      },

      //
      weightedFinalGradeForTerm() {
        const requiredCredits = this.estimatedCreditsEnrolled;
        const creditsCompleted = this.sumCreditsCompleted();

        let grade = this.unweightedGrade;

        if (
          creditsCompleted < requiredCredits &&
          requiredCredits !== 0 &&
          creditsCompleted !== 0
        ) {
          grade *= creditsCompleted / requiredCredits;
        }

        const output = Number(grade.toFixed(2));
        return isNaN(output) ? 0 : output;
      },
      termDatesDirty() {
        return (
          !!this.selectedTerm?._id &&
          this.submissionDatesStart !== this.savedSubmissionDatesStart ||
          this.submissionDatesEnd !== this.savedSubmissionDatesEnd
        );
      },

    },
    data() {
      return {
        savedSubmissionDatesStart: undefined,
        savedSubmissionDatesEnd: undefined,
        savingTermDates: false,

        showBulkUpdateModal: false,
        bulkUpdateStep: "confirm", // "confirm" or "select"
        bulkTermsToUpdate: [],     // list of terms from server
        bulkSelectedTermIds: [],   // checked terms
        bulkLoading: false,
        bulkSaving: false,


        selectedTermId: '',
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
        courseAssignmentGroups: {},
        submissionDates: [],
        courses: [],
      }
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

      // Normalize submittedAt
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
      async confirmSingleUpdate() {
        const termId = this.selectedTerm?._id;
        if (!termId) return;

        this.savingTermDates = true;

        try {
          await bridgetools.req(
            `https://reports.bridgetools.dev/api2/hs_terms/${termId}/dates?requester_id=${ENV.current_user_id}`,
            {
              entry_date: this.submissionDatesStart,
              exit_date: this.submissionDatesEnd,
            },
            "POST"
          );

          // update saved baseline so dirty flag turns off
          this.savedSubmissionDatesStart = this.submissionDatesStart;
          this.savedSubmissionDatesEnd = this.submissionDatesEnd;

          // update selectedTerm so dropdown reflects new values
          this.selectedTerm.entry_date = new Date(this.submissionDatesStart);
          this.selectedTerm.exit_date  = new Date(this.submissionDatesEnd);

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
        this.bulkSelectedTermIds = on
          ? this.bulkTermsToUpdate.map(t => t._id)
          : [];
      },

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
          const currentTermId = this.selectedTerm?._id;

          this.bulkSelectedTermIds = this.bulkTermsToUpdate.map(t => t._id);

          if (currentTermId && !this.bulkSelectedTermIds.includes(currentTermId)) {
            this.bulkSelectedTermIds.push(currentTermId);
          }

        } catch (err) {
          console.error(err);
          alert("Failed loading students for bulk update.");
          this.closeBulkModal();
        } finally {
          this.bulkLoading = false;
        }
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

          // update baseline so dirty flag turns off
          this.savedSubmissionDatesStart = this.submissionDatesStart;
          this.savedSubmissionDatesEnd = this.submissionDatesEnd;

          // update selectedTerm so dropdown reflects new values
          this.selectedTerm.entry_date = new Date(this.submissionDatesStart);
          this.selectedTerm.exit_date  = new Date(this.submissionDatesEnd);

          this.closeBulkModal();
          alert("Bulk update complete.");
        } catch (err) {
          console.error(err);
          alert("Failed bulk updating students.");
        } finally {
          this.bulkSaving = false;
        }
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

          this.closeBulkModal();
          alert("Bulk update complete.");
        } catch (err) {
          console.error(err);
          alert("Failed bulk updating students.");
        } finally {
          this.bulkSaving = false;
        }
      },

      btnStyle(kind = "primary", disabled = false) {
        const blue = this.colors?.blue || "#1a73e8";
        const darkGray = this.colors?.darkGray || "#333";

        const bg =
          kind === "primary" ? blue :
          kind === "secondary" ? darkGray :
          "#000";

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

      // Example: Drawing a Bar Chart for Submissions

      drawSubmissionsGraph: function (startDate, endDate) {
        // Step 1: Filter and group submissions
        const formatDate = d3.timeFormat("%Y-%m-%d");
        let submissions = this.submissionDates.filter(submission => {
          const submittedDate = submission.submittedAt;
          return submittedDate >= startDate && submittedDate <= endDate;
        });
        
        const submissionsGrouped = d3.rollup(
          submissions,
          v => v.length,
          d => formatDate(d.submittedAt)
        );

        // Fill missing dates with zero counts
        const dateRange = d3.timeDays(new Date(startDate), new Date(endDate));
        const submissionCounts = dateRange.map(date => ({
          date: formatDate(date),
          count: submissionsGrouped.get(formatDate(date)) || 0
        }));

        // Step 2: Set up D3 environment
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const width = 800 - margin.left - margin.right;
        const height = 200 - margin.top - margin.bottom;

        d3.select("#submissionGraph").html("");

        const svg = d3.select("#submissionGraph")
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        // Step 3: Define scales
        const xScale = d3.scaleTime()
          .domain([new Date(startDate), new Date(endDate)])
          .range([0, width]);

        const yScale = d3.scaleLinear()
          .domain([0, d3.max(submissionCounts, d => d.count)])
          .range([height, 0]);

        // Step 4: Add axes
        const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %d"));
        const yAxis = d3.axisLeft(yScale);

        svg.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(xAxis);

        svg.append("g").call(yAxis);

         // Create a tooltip element
        const tooltip = d3.select("#submissionGraph")
          .append("div")
          .style("position", "absolute")
          .style("visibility", "hidden")
          .style("background", "rgba(0, 0, 0, 0.8)")
          .style("color", "white")
          .style("padding", "5px 10px")
          .style("border-radius", "5px")
          .style("font-size", "12px")
          .text("");

        // Draw bars with hover events
        svg.selectAll(".bar")
          .data(submissionCounts)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", d => xScale(new Date(d.date)))
          .attr("y", d => yScale(d.count))
          .attr("width", width / submissionCounts.length - 1) // Dynamic width
          .attr("height", d => height - yScale(d.count))
          .attr("fill", "steelblue")
          .on("mouseover", (event, d) => {
            tooltip
              .style("visibility", "visible")
              .text(`Date: ${d.date}, Count: ${d.count}`);
          })
          .on("mousemove", event => {
            tooltip
              .style("top", `${event.pageY - 10}px`)
              .style("left", `${event.pageX + 10}px`);
          })
          .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
          });
      },

      extractYear(termName) {
        const yearMatch = termName.match(/\b(20\d{2})\b/);
        return yearMatch ? yearMatch[1] : null;
      },

      async fetchAllConnection(courseId, connectionField, args = {}, nodeSelection = '') {
        const pageSize = 50;    // bump up/down as you like
        let allNodes = [];
        let hasNext = true;
        let after = null;
        while (hasNext) {
          // Build the GraphQL query
          const argsStr = Object.entries({ ...args, first: pageSize, after })
            .map(([k,v]) => `${k}: ${JSON.stringify(v)}`)
            .join(", ");

          const query = `{
            course(id: "${courseId}") {
              ${connectionField}(${argsStr}) {
                ${nodeSelection}
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }`;

          const res = await $.post("/api/graphql", { query });
          const conn = res.data.course[connectionField];

          allNodes.push(...conn.nodes);
          hasNext = conn.pageInfo.hasNextPage;
          after   = conn.pageInfo.endCursor;
        }

        return allNodes;
      },

      async getAllAssignmentsByGroup(course) {
        // Pull every assignment in the course
        const assignments = await this.fetchAllConnection(
          course.id,
          "assignmentsConnection",
          {},                             // no args
          `nodes { _id name published pointsPossible assignmentGroupId }`
        );

        // Group in JS:
        const byGroup = assignments.reduce((map, a) => {
          const gid = a.assignmentGroupId || "__ungrouped";
          if (!map[gid]) map[gid] = [];
          map[gid].push(a);
          return map;
        }, {});

        return byGroup;  // { groupId1: […], groupId2: […], … }
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
          // 1. Pull groups
          const groupQuery = `{
            course(id: "${course.id}") {
              assignmentGroupsConnection {
                nodes {
                  _id name groupWeight state
                }
              }
            }
          }`;
          const groupRes = await $.post("/api/graphql", { query: groupQuery });
          const groups = groupRes.data.course.assignmentGroupsConnection.nodes
            .filter(g => g.state === "available");

          // 2. Pull all assignments in the course, then bucket by group
          const assignmentsByGroup = await this.getAllAssignmentsByGroup(course);

          // 3. Pull all submissions for this user
          const submissions = await this.getAllSubmissions.call(this, course);

          // 4. Attach assignments to each group object
          groups.forEach(g => {
            g.assignments = assignmentsByGroup[g._id] || [];
          });

          data = {
            name: course.name,
            assignment_groups: groups,
            submissions: submissions
          };
          return data;

        } catch (err) {
          console.error(err);
          return {
            name: course.name,
            assignment_groups: [],
            submissions: []
          }
        }
      },

      async getCourseData() {
        const base = `/api/v1/users/${this.userId}/courses?enrollment_Type=student&include[]=total_scores&include[]=current_grading_period_scores&include[]=term`;
        const queries = [
          `${base}&enrollment_state=active&state[]=available&state[]=completed`,
          `${base}&enrollment_state=completed&state[]=active`,
          `${base}&enrollment_state=completed&state[]=available&state[]=completed`,
        ];

        // Fetch all three lists in parallel
        const results = await Promise.all(queries.map(q => canvasGet(q)));

        // Deduplicate by id
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
              if (enrollment.enrollment_state == 'active') active = true;
              if (enrollment.enrollment_state == 'completed') completed = true;
            });
            let state = active ? 'Active' : completed ? 'Completed' : 'N/A';
            let courseRow = this.newCourse(course.id, state, course.name, year, course.course_code);
            course.hours = courseRow.hours;
            course.credits = courseRow.hours / 30;
          }
          this.loadingProgress += (50 / courses.length) * 0.5;

          this.loadingMessage = "Loading Assignment Data for Course " + course.id;
          let additionalData = await this.getGraphQLData(course);
          // let additionalDataOld = await this.getGraphQLDataOld(course);
          course.additionalData = additionalData;
          course.assignments = additionalData.submissions;
          this.loadingProgress += (50 / courses.length) * 0.5;
        }
        return courses;
      },
      updateDatesToSelectedTerm() {
        const term = this.terms.find(t => t._id === this.selectedTermId);
        if (!term) return;

        this.selectedTerm = term;

        const start = this.dateToHTMLDate(term.entry_date);
        const end   = this.dateToHTMLDate(term.exit_date);

        // working values used by the report
        this.submissionDatesStart = start;
        this.submissionDatesEnd   = end;

        // saved baseline used to detect dirty state
        this.savedSubmissionDatesStart = start;
        this.savedSubmissionDatesEnd   = end;

        this.getIncludedAssignmentsBetweenDates();
        this.drawSubmissionsGraph(new Date(term.entry_date), new Date(term.exit_date));
      },
      async saveTermDates() {
        const termId = this.selectedTerm?._id;
        if (!termId) return;

        // show modal immediately
        this.showBulkUpdateModal = true;
        this.bulkUpdateStep = "confirm";

        // ensure the current term is always included in bulk option later
        this.bulkSelectedTermIds = [termId];
      },
 

      revertTermDates() {
        this.submissionDatesStart = this.savedSubmissionDatesStart;
        this.submissionDatesEnd = this.savedSubmissionDatesEnd;
        this.getIncludedAssignmentsBetweenDates();
      },


      sumProgressBetweenDates() {
        let sum = 0;
        this.courses.forEach(course => sum += this.progressBetweenDates[course.id]);
        return sum;
      },
      sumCreditsCompleted() {
        let sum = 0;
        this.courses.forEach(course => {
          let progress = this.progressBetweenDates[course.course_id];
          let credits = course.hours / 30;
          if (credits == "N/A") hours = 0;
          if (progress > 0 && credits > 0) {
            sum += Math.round(progress * credits) * .01;
          }
        })
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
        if (progress !== undefined) completed = parseFloat((Math.round(progress * course.hours) * .01).toFixed(2));
        if (isNaN(completed)) completed = 0;
        credits = Math.round((completed / 30) * 100) / 100;
        return credits;
      },

      async getIncludedAssignmentsBetweenDates() {
        let includedAssignments = {};
        let startDate = this.parseDate(this.submissionDatesStart);
        let endDate = this.parseDate(this.submissionDatesEnd);
        //break if a date is undefined
        if (startDate === undefined || endDate === undefined) return;

        //otherwise fill in all the progress / grades data for those dates
        for (let i = 0; i < this.courses.length; i++) {
          let course = this.courses[i];
          let courseId = course.course_id;
          includedAssignments[courseId] = {
            name: course.name,
            id: courseId,
            include: true,
            groups: {}
          };
          let subs = this.submissionData[courseId];
          if (subs !== undefined) {
            //get the data for all submissions
            let subData = {};
            for (let s = 0; s < subs.length; s++) {
              let sub = subs[s];
              //if (sub.posted_at != null) { //used to check if posted
              if (sub.score !== null) { //trying out including anything with a score
                subData[sub.assignmentId] = sub;
              }
            }

            let assignmentGroups = this.courseAssignmentGroups[courseId];

            //calc sum weights, if zero, then don't check weights to include
            let sumWeights = 0;
            for (let g = 0; g < assignmentGroups.length; g++) {
              let group = assignmentGroups[g];
              sumWeights += group.groupWeight;
            }

            //weight grades based on assignment group weighting and hours completed in the course
            for (let g = 0; g < assignmentGroups.length; g++) {
              let group = assignmentGroups[g]
              includedAssignments[courseId].groups[g] = {
                name: group.name,
                id: group.id,
                groupWeight: group.groupWeight,
                include: true,
                assignments: {}
              };
              if (group.groupWeight > 0 || sumWeights === 0) {
                //check each assignment to see if it was submitted within the date range and get the points earned as well as points possible
                for (let a = 0; a < group.assignments.length; a++) {
                  let assignment = group.assignments[a];
                  assignment.id = parseInt(assignment._id);
                  if (assignment.published) {
                    if (assignment.id in subData) {
                      let sub = subData[assignment.id];
                      let subDateString = sub.submittedAt;
                      if (subDateString === null) subDateString = sub.gradedAt;
                      includedAssignments[courseId].groups[g].assignments[assignment.id] = {
                        include: false,
                        id: assignment.id,
                        name: assignment.name,
                        score: sub.score,
                        points_possible: assignment.pointsPossible,
                        sub: sub.id,
                        date: subDateString
                      };
                      let subDate = new Date(subDateString);
                      if (subDate >= startDate && subDate <= endDate) {
                        includedAssignments[courseId].groups[g].assignments[assignment.id].include = true;
                      }
                    }
                  }
                }
              }
            }
          }
        }
        this.includedAssignments = JSON.parse(JSON.stringify(includedAssignments));
        this.calcGradesFromIncludedAssignments();
      },

      calcGradesFromIncludedAssignments() {
        let gradesBetweenDates = {};
        let progressBetweenDates = {};
        let startDate = this.parseDate(this.submissionDatesStart);
        let endDate = this.parseDate(this.submissionDatesEnd);
        let midtermPercentCompleted = 1;
        let currentDate = new Date();
        if (currentDate < endDate) {
          midtermPercentCompleted = (currentDate - startDate) / (endDate - startDate);
        }
        //break if a date is undefined
        if (startDate === undefined || endDate === undefined) return;

        for (let courseId in this.includedAssignments) {
          let course = this.includedAssignments[courseId];
          if (this.checkIncludeCourse(course) && course.include) {
            let currentWeighted = 0;
            let totalWeights = 0; //sum of all weight values for assignment groups
            let totalWeightsSubmitted = 0; //sum of all weight values for assignment groups if at least one submitted assignment
            let totalProgress = 0;
            let totalCurrentPoints = 0; //all points earned in the course
            let totalPossiblePoints = 0; //all points available to have earned from submitted assignments
            let totalTotalPoints = 0; //all points in the course;

            let sumGroupWeights = 0; //used to check if group weights are even used
            for (let groupId in course.groups) {
              let group = course.groups[groupId];
              if (group.include) {
                sumGroupWeights += group.groupWeight;
              }
            }

            for (let groupId in course.groups) {
              let group = course.groups[groupId];
              if (this.checkIncludeGroup(group) && group.include) {
                if (group.groupWeight > 0 || sumGroupWeights === 0) {
                  let currentPoints = 0; //points earned
                  let possiblePoints = 0; //potential points earned
                  let totalPoints = this.calcCourseGroupPointsPossible(courseId, groupId, sumGroupWeights); //all points in the course
                  totalTotalPoints += totalPoints;
                  //check each assignment to see if it was submitted within the date range and get the points earned as well as points possible
                  for (let assignmentId in group.assignments) {
                    let assignment = group.assignments[assignmentId];
                    if (assignment.include) {
                      currentPoints += assignment.score;
                      totalCurrentPoints += assignment.score;
                      possiblePoints += assignment.points_possible;
                      totalPossiblePoints += assignment.points_possible;
                    }
                  }
                  //update info for the submission/earned points values
                  if (possiblePoints > 0) {
                    let groupScore = currentPoints / possiblePoints;
                    if (sumGroupWeights > 0) {
                      currentWeighted += groupScore * group.groupWeight;
                    } else {
                      currentWeighted += groupScore;
                    }
                    totalWeightsSubmitted += group.groupWeight;
                  }
                  //update info for total possible points values 
                  if (totalPoints > 0) {
                    let progress = possiblePoints / totalPoints;
                    if (sumGroupWeights > 0) {
                      totalProgress += progress * group.groupWeight;
                    } else {
                      totalProgress += progress;
                    }
                    totalWeights += group.groupWeight;
                  }
                }
              }
            }
            //if there are any points possible in this course, put out some summary grades data
            if (totalWeights > 0 || sumGroupWeights === 0) {
              let output;
              let weightedGrade;
              //dispaly grade
              if (sumGroupWeights > 0) {
                weightedGrade = Math.round(currentWeighted / totalWeightsSubmitted * 10000) / 100;
              } else {
                weightedGrade = Math.round(totalCurrentPoints / totalPossiblePoints * 10000) / 100;
              }
              output = "";
              if (!isNaN(weightedGrade)) {
                output = weightedGrade;
              }
              gradesBetweenDates[courseId] = output;

              //display progress
              let progress = totalProgress;
              if (totalWeights > 0) {
                progress = Math.round((totalProgress / totalWeights) * 10000) / 100;
              } else {
                progress = Math.round((totalPossiblePoints / totalTotalPoints) * 10000) / 100;
              }
              output = "";
              if (!isNaN(progress)) {
                output = progress;
              }
              progressBetweenDates[courseId] = output;
            }
          }
        }
        this.gradesBetweenDates = JSON.parse(JSON.stringify(gradesBetweenDates));
        this.progressBetweenDates = JSON.parse(JSON.stringify(progressBetweenDates));
        //this value can be edited by the instructor
        let estimatedCreditsRequired = Math.round(this.estimatedCreditsEnrolled * midtermPercentCompleted * 100) / 100;
        if (isNaN(estimatedCreditsRequired)) estimatedCreditsRequired = 0;
        this.estimatedCreditsRequired = estimatedCreditsRequired;
      },

      calcCourseGroupPointsPossible(courseId, groupId, sumGroupWeights) {
        let assignmentGroups = this.courseAssignmentGroups[courseId];
        let group = assignmentGroups[groupId];
        let totalPoints = 0;
        if (group.groupWeight > 0 || sumGroupWeights === 0) {
          //check each assignment to see if it was submitted within the date range and get the points earned as well as points possible
          for (let a = 0; a < group.assignments.length; a++) {
            let assignment = group.assignments[a];
            if (assignment.published) {
              totalPoints += assignment.pointsPossible;
            }
          }
        }
        return totalPoints;
      },

      newCourse(id, state, name, year, courseCode) {
        let course = {};
        course.course_id = id;
        let hours = "N/A";
        //get course hours if there's a year
        if (year !== null) {
          hours = COURSE_HOURS?.[courseCode]?.hours ?? 0;
          //Check to see if a previous year can be found if current year doesn't work
          for (let i = 1; i < 5; i++) {
            if (hours == undefined) hours = COURSE_HOURS?.[courseCode].hours;
          }
          if (hours === undefined) hours = 0;
        }
        course.hours = hours;
        course.state = state;
        course.name = name;
        course.days_in_course = 0;
        course.days_since_last_submission = 0;
        course.days_since_last_submission_color = "#fff";
        course.section = "";
        course.grade_to_date = "N/A";
        course.points = 0;
        course.final_grade = "N/A";
        course.section = "";
        course.ungraded = 0;
        course.submissions = 0;
        course.nameHTML = "<a target='_blank' href='" + window.location.origin + "/courses/" + id + "'>" + name + "</a> (<a target='_blank' href='https://btech.instructure.com/courses/" + id + "/grades/" + this.userId + "'>grades</a>)";
        return course;
      },

      checkIncludeCourse(course) {
        return Object.values(course.groups || {}).some(g => this.checkIncludeGroup(g));
      },

      checkIncludeGroup(group) {
        return !! group.include;
      },

      checkIncludeAssignment(assignment) {
        return true; //show every assignment for now so people can toggle them on and off
      },

      dateToHTMLDate(date) {
        date = new Date(date);
        date.setDate(date.getDate() + 1);
        let month = '' + (date.getMonth() + 1);
        if (month.length === 1) month = '0' + month;

        let day = '' + date.getDate();
        if (day.length === 1) day = '0' + day;

        let htmlDate = date.getFullYear() + "-" + month + "-" + day;
        return htmlDate;
      },
    }
  });
})();