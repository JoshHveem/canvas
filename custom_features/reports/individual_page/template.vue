<template>
  <div class='btech-modal' style='display: inline-block;'>
    <div class='btech-modal-content'>
      <div class="btech-tabs">
        <ul>
          <li @click="menu='report'">Student Course Report</li>
          <li @click="menu='period'">Grades Between Dates</li>
          <li @click="menu='enroll'">HS Enrollment Periods</li>
          <li style='float: right;' v-on:click='close()'>X</li>
        </ul>
      </div>
      <div class='btech-modal-content-inner'>
        <div v-if='loading'>
          <p>Loading...</p>
        </div>
        <div v-else>
          <div v-if="accessDenied">
            <p>
              <b>ERROR:</b> You are not authorized to see all of this student's courses. This often occurs when the
              student
              is not enrolled in any courses in which you have admin rights to View Enrollments.
            </p>
            <p>
              Reach out to your Canvas Administrator if you have received this message in error
            </p>
          </div>

          <div v-else>
            <div v-if="menu=='report'">
              <h5 style='text-align: center;'>Click on column headers to sort by that column.</h5>
              <h5 style='text-align: center;'>Hover over column headers for a description of the information displayed
                in
                that
                column.</h5>
              <div class='btech-report-columns-toggle'>
                <div class='btech-report-column-toggle' style='display: inline-block;' v-for='column in columns'
                  :key='column.name'>
                  <div v-if="column.hideable">
                    <input type="checkbox" v-model="column.visible"><label>{{column.name}}</label>
                  </div>
                </div>
              </div>
              <table class='btech-report-table' border='1'>
                <thead border='1'>
                  <tr>
                    <th v-for='column in visibleColumns' :key='column.name' :class='column.sortable_type'
                      @click="sortColumn(column.name);">{{column.name}}</th>
                  </tr>
                </thead>
                <tbody border='1'>
                  <tr v-if="loading">
                    <td :colspan='visibleColumns.length'>{{loadingMessage}}</td>
                  </tr>
                  <tr v-for='course in courses' :key='course.course_id'>
                    <td v-for='column in visibleColumns' :key='column.name'>
                      <span v-html="getColumnText(column, course)"></span>
                    </td>
                  </tr>
                </tbody>
                <tfoot border='1'>

                </tfoot>
              </table>
            </div>

            <div v-if="menu=='period'">
              <div v-if='loadingAssignments'>{{loadingMessage}}</div>
              <div v-else>
                <div class='btech-report-submission-dates'>
                  <select @change='updateDatesToSelectedTerm()' v-model='selectedTermId'>
                    <option selected disabled value=''>-select term-</option>
                    <option v-for='term in terms' :value='term._id'>{{dateToHTMLDate(term.startDate) + " to " + dateToHTMLDate(term.endDate)}} ({{term.hours}} hrs)</option>
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
                    <tr v-if="loading">
                      <td :colspan='visibleColumns.length'>{{loadingMessage}}</td>
                    </tr>
                    <tr v-for='course in courses' :key='course.course_id'>
                      <td>
                        {{course.name}}
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
                <div v-if='showGradeDetails'>
                  <!--include a reset button to go back to the default. Probably just rerun the code from on change of date-->
                  <div v-for='course in includedAssignments' :key='course.name'>
                    <div v-if='checkIncludeCourse(course)'>
                      <h3>
                        <input @change="calcGradesFromIncludedAssignments" type="checkbox" :id="course.id + '-checkbox'"
                          v-model="course.include">
                        <a :href="'/courses/' + course.id + '/grades/' + userId">{{course.name}}</a>
                      </h3>
                      <div v-if='course.include'>
                        <div v-for='group in course.groups' :key='group.name'>
                          <div v-if='checkIncludeGroup(group)'>
                            <h4>
                              <b>{{group.name}}</b></h4>
                            <div v-if='group.include'>
                              <div v-for='assignment in group.assignments' :key='assignment.id'>
                                <div v-if='checkIncludeAssignment(assignment)'>
                                  <div>
                                    <input @change="calcGradesFromIncludedAssignments" type="checkbox"
                                      :id="course.id + '-' + group.id + '-' + assignment.id + '-checkbox'"
                                      v-model="assignment.include" :disabled="!course.include || !group.include">

                                    <a style='padding-left: 1em;'
                                      :href="'/courses/' + course.id + '/assignments/' + assignment.id + '/submissions/' + assignment.sub">
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

            <div v-if="menu=='enroll'">
              <div class='term-data-container'>
                <span>Start Date</span>
                <input type='date' v-model='enrollment_tab.saveTerm.startDate'>
                <span>End Date</span>
                <input type='date' v-model='enrollment_tab.saveTerm.endDate'>
                <br>
                <span>Term Type</span>
                <select v-model='enrollment_tab.saveTerm.type'>
                  <option>Semester</option>
                  <option>Trimester</option>
                </select>
                <br>
                <span>Hours: </span>
                <input type='number' min='30' max='300' step='15' v-model='enrollment_tab.saveTerm.hours'>
                <br>
                <span>School: </span>
                <select v-model='enrollment_tab.saveTerm.school'>
                  <option value='' selected disabled>-select school-</option>
                  <option v-for='school in enrollment_tab.schools' :value='school'>
                    {{school}}
                  </option>
                </select>
              </div>
              <input type='button' @click='enrollHS()' value='enroll'>
              <br>
              <div class='existing-terms'>
                <h2>Existing Enrollments</h2>
                <div v-for='term in terms'>
                  <span>
                    <i @click='deleteHSEnrollmentTerm(term);' style='cursor: pointer;' class='icon-trash'></i>
                  </span>
                  <span>{{formatDate(term.startDate)}} - {{formatDate(term.endDate)}}</span>
                  <span>{{term.hours}} HRS</span>
                  <span>{{term.school}}</span>
                  <span>{{term.type}}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>