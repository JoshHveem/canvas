(async function() {
  class Column {
    constructor(name, description, average, sort_type, percent, hideable = true) {
      this.name = name;
      this.description = description;
      this.average = average;
      this.sort_type = sort_type; //needs to be a result of typeof, probably mostly going to be string or number
      this.sort_state = 0; //becomes 1 or -1 depending on asc or desc
      this.visible = true;
      this.percent = percent;
      this.hideable = hideable;
    }
  }
  
  Vue.component('grades-between-dates', {
    template: ` 
      <div>
        {{ terms }}
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
            <input type="date" v-model="submissionDatesStart" @change='getIncludedAssignmentsBetweenDates()'>
            <span>End Date:</span>
            <input type="date" v-model="submissionDatesEnd" @change='getIncludedAssignmentsBetweenDates()'>
          </div>
          <table class='btech-report-table' border='1'>
            <thead border='1'>
              <tr>
                <th>Course</th>
                <th>Term Grades</th>
                <th>Term Completed</th>
                <th>Course Hours</th>
                <th>Hours Completed</th>
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
                <td><input style="padding: 0px 4px; margin: 0px; width: 3rem;" v-model="course.hours" type="text">
                </td>
                <td>{{getHoursCompleted(course)}}</td>
              </tr>
              <tr height="10px"></tr>
            </tbody>
            <tfoot border='1'>
              <tr>
                <td><b>Weighted Final Grade</b>
                </td>
                <td>
                  {{weightedFinalGradeForTerm()}}%
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
              <tr v-if='showGradeDetails'>
                <td><b>Weighted Grade To Date</b></td>
                <td>{{weightedGradeForTerm()}}%</td>
              </tr>
              <tr v-if='showGradeDetails'>
                <td><b>Hours Completed</b></td>
                <td>{{sumHoursCompleted()}}</td>
              </tr>
              <tr v-if='showGradeDetails'>
                <td><b>Hours Enrolled</b></td>
                <td>{{estimatedHoursEnrolled}}</td>
              </tr>
              <tr>
                <td><b>Estimated Hours Required</b></td>
                <td><input style="padding: 0px 4px; margin: 0px;" v-model="estimatedHoursRequired" type="text">
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
    computed: {},
    data() {
      return {
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
        estimatedHoursEnrolled: 0,
        estimatedHoursRequired: 0,
        submissionDatesStart: undefined,
        submissionDatesEnd: undefined,
        loadingProgress: 0,
        loadingMessage: "Loading...",
        loadingAssignments: true,
        courseAssignmentGroups: {},
        submissionDates: [],
        courses: [],
        columns: [
          new Column('Name', '', false, 'string', false, false),
          new Column('State', '', false, 'string', false),
          new Column('Hours', '', false, 'number', false),
          new Column('Grade To Date', '', true, 'number', true),
          new Column('Final Grade', '', true, 'number', true),
          new Column('Points', '', true, 'number', true),
          new Column('Submissions', '', true, 'number', true),
          new Column('Days Since Last Submission', '', true, 'number', false)
        ],
      }
    },
    created: async function () {
      // Initialize state variables
      this.loadingProgress = 0;
      this.loadingMessage = "Loading Courses";
      this.courses = await this.getCourseData();

      if (!this.courses || this.courses.length === 0) {
        this.loadingMessage = "No courses available.";
        this.loadingProgress = 100;
        return;
      }

      this.submissionData = {};
      this.courseAssignmentGroups = {};
      let submissions = [];

      for (let i = 0; i < this.courses.length; i++) {
        const course = this.courses[i];
        
        // Update progress and message
        this.loadingMessage = `Loading Submissions for Course ${course.course_id}`;
        this.loadingProgress += (50 / this.courses.length) * 0.5;

        // Collect submission data
        if (course.additionalData?.submissions) {
          // pop the course id onto each submission
          course.additionalData.submissions.map(sub => sub.course_id = course.id);
          // set up course level submissions data
          this.submissionData[course.id] = course.additionalData.submissions;
          //push each submission in the submissions array
          submissions.push(...course.additionalData.submissions);
        }

        // Update assignment group data
        this.loadingMessage = `Loading Assignment Groups for Course ${course.id}`;
        this.loadingProgress += (50 / this.courses.length) * 0.5;

        if (course.additionalData?.assignment_groups) {
          this.courseAssignmentGroups[course.id] = course.additionalData.assignment_groups;
        }
      }

      // Order submissions by submittedAt, oldest to newest
      submissions.map(sub => {
        sub.submittedAt = sub.submittedAt ? new Date(sub.submittedAt) : new Date(sub.gradedAt);
      });
      submissions = submissions
        .filter(submission => submission.submittedAt) // Ensure submittedAt exists
        .sort((a, b) => a.submittedAt - b.submittedAt);

      this.submissionDates = submissions;
      // Final updates
      this.loadingProgress = 100;
      this.loadingMessage = "Data loading complete.";
      this.loadingAssignments = false;
    },


    methods: {
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

      extractCourseId(url) {
        const courseIdMatch = url.match(/\/courses\/(\d+)\//);
        return courseIdMatch ? courseIdMatch[1] : null;
      },

      extractYear(termName) {
        const yearMatch = termName.match(/\b(20\d{2})\b/);
        return yearMatch ? yearMatch[1] : null;
      },

      async getGraphQLDataOld(course) {
        let query = `{
          course(id: "${course.id}") {
            id
            submissionsConnection(studentIds: "${this.userId}") {
              nodes {
                id
                assignmentId
                assignment {
                  name
                  published
                  pointsPossible
                }
                submittedAt
                grade
                gradedAt
                score
                userId
              }
            }
            name
            assignmentGroupsConnection {
              nodes {
                name
                groupWeight
                state

                assignmentsConnection {
                  nodes {
                    _id
                    name
                    published
                    pointsPossible
                  }
                }
              }
            }
          }
        }`;
        try {
          let res = await $.post(`/api/graphql`, {
            query: query
          });
          let data = res.data.course;
          return {
            name: data.name,
            assignment_groups: data.assignmentGroupsConnection.nodes.filter(group => group.state == 'available').map(group => {
              group.assignments = group.assignmentsConnection.nodes;
              return group;
            }),
            submissions: data.submissionsConnection.nodes
          }
        } catch (err) {
          console.error(err);
          return {
            name: course.name,
            assignment_groups: [],
            submissions: []
          }
        }
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
        let courses = [];
        let coursesActive = await canvasGet(`/api/v1/users/${this.userId}/courses?enrollment_Type=student&include[]=total_scores&include[]=current_grading_period_scores&include[]=term&enrollment_state=active&state[]=available&state[]=completed`)
        courses.push(...coursesActive);
        let coursesCompleted;
        coursesCompleted = await canvasGet(`/api/v1/users/${this.userId}/courses?enrollment_Type=student&include[]=total_scores&include[]=current_grading_period_scores&include[]=term&enrollment_state=completed&state[]=active`);
        // Filter completed courses to only add those not already in `courses`
        coursesCompleted.forEach(course => {
            if (!courses.some(existingCourse => existingCourse.id === course.id)) {
                courses.push(course);
            }
        });
        coursesCompleted = await canvasGet(`/api/v1/users/${this.userId}/courses?enrollment_Type=student&include[]=total_scores&include[]=current_grading_period_scores&include[]=term&enrollment_state=completed&state[]=available&state[]=completed`);
        // Filter completed courses to only add those not already in `courses`
        coursesCompleted.forEach(course => {
            if (!courses.some(existingCourse => existingCourse.id === course.id)) {
                courses.push(course);
            }
        });
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
          }
          this.loadingProgress += (50 / courses.length) * 0.5;

          this.loadingMessage = "Loading Assignment Data for Course " + course.id;
          let additionalData = await this.getGraphQLData(course);
          // let additionalDataOld = await this.getGraphQLDataOld(course);
          course.additionalData = additionalData;
          course.assignments = additionalData.submissions;
          // await this.getAssignmentData(course);
          this.loadingProgress += (50 / courses.length) * 0.5;
        }
        return courses;
      },
      updateDatesToSelectedTerm() {
        let term;
        for (let i = 0; i < this.terms.length; i++) {
          if (this.terms[i]._id === this.selectedTermId) {
            term = this.terms[i];
          }
        }
        this.selectedTerm = term;
        this.submissionDatesStart = this.dateToHTMLDate(term.entry_date);
        this.submissionDatesEnd = this.dateToHTMLDate(term.exit_date);
        this.estimatedHoursEnrolled = new Date(term.exit_date) - new Date(term.entry_date);
        console.log("ESTIMATED HOURS")
        console.log(this.estimatedHoursEnrolled / (60 * 60 * 24 * 1000));
        this.getIncludedAssignmentsBetweenDates();
        this.drawSubmissionsGraph(new Date(term.startDate), new Date(term.endDate));
      },
      sumProgressBetweenDates() {
        let sum = 0;
        this.courses.forEach(course => sum += this.progressBetweenDates[course.id]);
        return sum;
      },
      sumHoursCompleted() {
        let sum = 0;
        this.courses.forEach(course => {
          let progress = this.progressBetweenDates[course.course_id];
          let hours = course.hours;
          if (hours == "N/A") hours = 0;
          if (progress > 0 && hours > 0) {
            sum += Math.round(progress * hours) * .01;
          }
        })
        return parseFloat(sum.toFixed(2)) ?? 0;
      },

      weightedGradeForTerm() {
        let totalWeightedGrade = 0;
        let totalHoursCompleted = this.sumHoursCompleted();
        let totalProgress = this.sumProgressBetweenDates();
        for (let c in this.courses) {
          let course = this.courses[c];
          let progress = this.progressBetweenDates[course.course_id];
          let grade = this.gradesBetweenDates[course.course_id];
          if (progress !== undefined && grade !== undefined && grade != "N/A") {
            if (totalHoursCompleted === 0) {
              let weightedGrade = grade * (progress / totalProgress);
              totalWeightedGrade += weightedGrade;
            } else {
              let hoursCompleted = this.getHoursCompleted(course);
              let weightedGrade = grade;
              //have some check to not = 0 if total hours completed is 0
              weightedGrade *= (hoursCompleted / totalHoursCompleted);
              totalWeightedGrade += weightedGrade;
            }
          }
        }
        let output = parseFloat(totalWeightedGrade.toFixed(2));
        if (isNaN(output)) return 0;
        return output;
      },

      getHoursEnrolled(courseId) {
        let hours = this.hoursBetweenDates[courseId];
        if (hours !== undefined) return hours;
        return "N/A";
      },

      weightedFinalGradeForTerm() {
        let requiredHours = this.estimatedHoursRequired * .67;
        let hoursCompleted = this.sumHoursCompleted();
        let grade = this.weightedGradeForTerm();
        if ((hoursCompleted < requiredHours) && (requiredHours !== 0 && hoursCompleted !== 0)) {
          grade *= (hoursCompleted / requiredHours);
        }
        let output = grade.toFixed(2);
        if (isNaN(output)) return 0;
        return output;
      },

      getProgressBetweenDates(courseId) {
        let progress = this.progressBetweenDates[courseId];
        if (progress !== undefined) return (progress + "%");
        return "";
      },

      getGradesBetweenDates(courseId) {
        let grade = this.gradesBetweenDates[courseId];
        if (grade !== undefined) return (grade + "%");
        return "";
      },

      getHoursCompleted(course) {
        let progress = this.progressBetweenDates[course.course_id];
        let completed = 0;
        if (progress !== undefined) completed = parseFloat((Math.round(progress * course.hours) * .01).toFixed(2));
        if (isNaN(completed)) completed = 0;
        return completed;
      },

      sortColumn(header) {
        let app = this;
        let name = this.columnNameToCode(header);
        let column = app.columns.find(c => c.name === header);
        column.sort_state = column.sort_state === 1 ? -1 : 1;

        app.courses.sort((a, b) => {
          let aVal = a[name] ?? '';
          let bVal = b[name] ?? '';
          
          if (typeof aVal === 'string') aVal = aVal.toUpperCase();
          if (typeof bVal === 'string') bVal = bVal.toUpperCase();

          if (aVal < bVal) return column.sort_state * -1;
          if (aVal > bVal) return column.sort_state * 1;
          return 0;
        });
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
        //estimate the hours enrolled from the hours between dates data collected
        //this value can be edited by the instructor
        this.estimatedHoursEnrolled = this.selectedTerm.hours;
        let estimatedHoursRequired = Math.floor(this.estimatedHoursEnrolled * midtermPercentCompleted);
        if (isNaN(estimatedHoursRequired)) estimatedHoursRequired = 0;
        this.estimatedHoursRequired = estimatedHoursRequired;
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

      parseDate(dateString) {
        if (dateString == undefined) return undefined;
        return new Date(dateString);
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

      

      calcPointsProgress(grade, final_grade) {
        let points = "N/A";
        if (!isNaN(parseInt(grade)) && !isNaN(parseInt(final_grade))) {
          points = Math.round(final_grade / grade * 100);
          if (isNaN(points)) points = 0;
        }
        return points;
      },

      columnNameToCode(name) {
        return name.toLowerCase().replace(/ /g, "_");
      },

      getColumnText(column, course) {
        let text = course[this.columnNameToCode(column.name)];
        if (column.name === "Name") {
          text = course.nameHTML;
        }
        if (column.percent && !isNaN(text)) {
          text += "%";
        }
        return text;
      },
      async getAssignmentData(assignments) {
        let course_id = course.course_id;
        let user_id = this.userId;
        //I think this one works better, but it apparently doesn't work for all students??? Might be related to status. The one it didn't work on was inactive
        // let url = "/api/v1/courses/" + course_id + "/analytics/users/" + user_id + "/assignments";
        let url = "/api/v1/courses/" + course_id + "/students/submissions?student_ids[]=" + user_id + "&include=assignment";
        try {
          let submissions = await canvasGet(url);
          course.assignments = submissions;
          let total_points_possible = 0;
          let current_points_possible = 0;
          let most_recent = {};
          let submitted = 0;
          let max_submissions = 0;
          let progress_per_day = 0;
          let start_date = Date.parse(course.created_at);
          let now_date = Date.now();
          let diff_time = Math.abs(now_date - start_date);
          let diff_days = Math.ceil(diff_time / (1000 * 60 * 60 * 24));
          let most_recent_time = diff_time;
          for (let a = 0; a < submissions.length; a++) {
            let submission = submissions[a];
            let assignment = submission.assignment;
            let points_possible = assignment.points_possible;
            if (submission != undefined) {
              let submitted_at = Date.parse(submission.submitted_at);
              total_points_possible += points_possible;
              if (assignment.points_possible > 0) {
                max_submissions += 1;
                if (submission.score !== null) {
                  current_points_possible += points_possible;
                  submitted += 1;
                }
              }
              if (Math.abs(now_date - submitted_at) < most_recent_time) {
                most_recent_time = Math.abs(now_date - submitted_at);
                most_recent = assignment;
              }
            }
          }
          let perc_submitted = Math.round((submitted / max_submissions) * 100);
          if (isNaN(perc_submitted)) perc_submitted = 0;
          course.submissions = perc_submitted;

          //calc days since last submission from time since last submission
          let most_recent_days = Math.ceil(most_recent_time / (1000 * 60 * 60 * 24));

          //Change output depending on status
          if (course.state === 'Active') {
            course.days_since_last_submission = most_recent_days;
          } else if (course.state == 'Completed') {
            course.days_since_last_submission = "Complete";
            course.points = 100;
          } else {
            course.days_since_last_submission = "N/A";
            course.points = "N/A";
          }
        } catch (err) {
          console.log(err);
        }
      },

      processEnrollment(student, enrollment) {
        let start_date = Date.parse(enrollment.created_at);
        let now_date = Date.now();
        let diff_time = Math.abs(now_date - start_date);
        let diff_days = Math.ceil(diff_time / (1000 * 60 * 60 * 24));
        let grades = enrollment.grades;
        let current_score = grades.current_score;
        if (current_score === null) current_score = 0;
        let final_score = grades.final_score;
        if (final_score === null) final_score = 0;

        //update values
        student.days_in_course = diff_days;
        student.grade = current_score;
        student.final_grade = final_score;
        //there might need to be a check to see if this is a numbe
        if (student.grade > 0 && student.grade != null) {
          student.points = Math.round(student.final_grade / student.grade * 100);
        }
      },

      checkIncludeCourse(course) {
        for (let g in course.groups) {
          let group = course.groups[g];
          if (this.checkIncludeGroup(group)) {
            return true;
          }
        }
        return false;
      },

      checkIncludeGroup(group) {
        if (group.include) return true;
        /*
        for (let a in group.assignments) {
          let assignment = group.assignments[a];
          if (app.checkIncludeAssignment(assignment)) {
            return true;
          }
        }
        */
        return false;
      },

      checkIncludeAssignment(assignment) {
        return true; //show every assignment for now so people can toggle them on and off
        if (assignment.include === true) {
          return true;
        }
        return false;
      },

      close() {
        $(this.$el).hide();
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