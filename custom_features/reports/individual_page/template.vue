<template>
  <div class='btech-modal' style='display: inline-block;'>
    <div class='btech-modal-content'>
      <div class="btech-tabs">
        <ul>
          <li @click="menu='report'">Progress Report</li>
          <li @click="menu='grades'">Grades Report</li>
          <li @click="menu='hours'">Hours Report</li>
          <li @click="menu='employment skills'">Employment Skills</li>
          <li @click="menu='period'">Grades Between Dates</li>
          <li v-if="IS_TEACHER" @click="menu='enroll'">HS Enrollment Periods</li>
          <li style='float: right;' v-on:click='close()'>X</li>
        </ul>
      </div>
      <div class='btech-modal-content-inner'>
          <div v-if="(accessDenied && menu!=='report')">
            <p>
              <b>ERROR:</b> You are not authorized to see all of this student's courses. This often occurs when the
              student is not enrolled in any courses in which you have admin rights to View Enrollments.
            </p>
            <p>
              Reach out to your Canvas Administrator if you have received this message in error
            </p>
          </div>

          <div v-else>
            <div v-if="menu=='report'">
              <div class="btech-canvas-report" style="background-color: #ffffff;">
                <select @change="changeTree(user)" v-model="currentDepartment">
                  <option v-for="dept in user.depts" :value="dept">{{dept.dept}} ({{dept.year}})</option>
                </select>
                <show-student-ind-credits
                    v-if="user.name !== undefined && tree.name !== undefined"
                    style="display: inline-block; background-color: #fff; padding: 0.5rem; box-sizing: border-box; width: 100%;"
                    :colors="colors"
                    :user="user"
                    :settings="settings"
                    :student-tree="tree"
                ></show-student-ind-credits>
              </div>
              <set-goal
                v-if="settingGoal"
                class="btech-modal"
                :colors="colors"
                :course-progress-goals="goal"
                :user="user"
                :student-tree="tree"
                @close="settingGoal = false;"
              >

              </set-goal>
              <div
                v-if="
                  !settingGoal
                "
                @click="settingGoal = true;"
                style="
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    border: none;
                    background-color: #000000;
                    color: white;
                    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
                    font-size: 2rem;
                    text-align: center;
                    line-height: 2rem;
                    cursor: pointer;
                "
              >
                <icon-people style="width: 1.5rem; height: 1.5rem;" :fill="colors.white"></icon-people>
              </div>
            </div>

            <div v-show="menu=='hours'">
              <div class="btech-canvas-report" style="background-color: #ffffff;">
                <show-student-hours
                  v-if="user.name !== undefined && tree.name !== undefined"
                  style="display: inline-block; background-color: #fff; padding: 0.5rem; box-sizing: border-box; width: 100%;"
                  :colors="colors"
                  :user="user"
                  :settings="settings"
                  :student-tree="tree"
                  :manual-hours-perc="true"
                ></show-student-hours>
              </div>
            </div>

            <div v-show="menu == 'grades'">
              <div class="btech-canvas-report" style="background-color: #ffffff;">
                <show-student-grades
                  v-if="user.name !== undefined && tree.name !== undefined"
                  style="display: inline-block; background-color: #fff; padding: 0.5rem; box-sizing: border-box; width: 100%;"
                  :colors="colors"
                  :user="user"
                  :settings="settings"
                  :student-tree="tree"
                  :manual-hours-perc="true"
                ></show-student-grades>
                
              </div>
            </div>

            <div v-show="menu=='employment skills'">
              <div class="btech-canvas-report" style="background-color: #ffffff;">
                <show-student-employment-skills
                  v-if="user.name !== undefined && tree.name !== undefined"
                  style="display: inline-block; background-color: #fff; padding: 0.5rem; box-sizing: border-box; width: 100%;"
                  :colors="colors"
                  :user="user"
                  :settings="settings"
                ></show-student-employment-skills>
              </div>
            </div>

            <div v-show="menu=='period'">
              <show-grades-between-dates
                v-if="enrollmentData != undefined"
                :user="user"
                :enrollments="enrollmentData"
                :user-id="userId"
                :terms="terms"
                :IS-TEACHER="IS_TEACHER"
              ></show-grades-between-dates>
            </div>

            <div v-show="menu=='enroll'">
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
</template>