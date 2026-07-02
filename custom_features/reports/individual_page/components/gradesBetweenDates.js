(async function() {
  const FIVE_WEEKS_MS = 60 * 60 * 24 * 7 * 5 * 1000;
  const deepClone = value => JSON.parse(JSON.stringify(value));
  const parseDateValue = value => value ? new Date(value) : undefined;
  const normalizeLookupValue = value => String(value ?? '').trim().toLowerCase();
  const normalizeTermTimestamp = value => {
    if (!value) return '';

    const normalized = normalizeLookupValue(value)
      .replace('t', ' ')
      .replace('z', '')
      .split('.')[0];
    const match = normalized.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/);
    return match ? `${match[1]} ${match[2]}` : normalized;
  };
  const buildTermKey = termLike => [
    normalizeLookupValue(termLike.sis_user_id),
    normalizeLookupValue(termLike.course_code),
    normalizeLookupValue(termLike.campus_code),
    normalizeTermTimestamp(termLike.entry_at__original || termLike.entry_at)
  ].join('|');
  const toReq3DateTime = dateValue => {
    if (!dateValue) return null;
    return String(dateValue).includes(' ') ? dateValue : `${dateValue} 00:00:00`;
  };
  const toHtmlDate = date => {
    const parsed = new Date(date);
    parsed.setDate(parsed.getDate() + 1);
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${parsed.getFullYear()}-${month}-${day}`;
  };
  const calculateCreditsRequired = (entryAt, exitAt, concurrentCount = 1) => {
    const start = parseDateValue(entryAt);
    const end = parseDateValue(exitAt);

    if (!start || !end || end <= start) return 0;

    let credits = Math.floor(Number((end - start) / FIVE_WEEKS_MS) * 4) / 4;
    const concurrent = Number(concurrentCount) || 1;
    if (concurrent > 1) credits *= concurrent;
    return credits;
  };

  Vue.component('grades-between-dates', {
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
              <option v-for='term in sortedTerms' :value='term._id'>
                {{dateToHTMLDate(term.entry_at) + " to " + dateToHTMLDate(term.exit_at)}} (x{{term.concurrent_sections}})
              </option>
            </select>
            <span>Start Date:</span>
            <input type="date" v-model="submissionDatesStart" @change="onDateRangeChange()">

            <span>End Date:</span>
            <input type="date" v-model="submissionDatesEnd" @change="onDateRangeChange()">

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
                        {{t.student_name}}
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
              <tr>
                <td colspan="2"></td>
                <td colspan="2"><b>Credits Completed</b></td>
                <td>{{sumCreditsCompleted()}}</td>
              </tr>
              <tr height="10px"></tr>
            </tbody>
            <tfoot border='1'>
              <tr>
                <td><b>Grade (to Date)</b>
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
                <td colspan="2"><b>Credits Required (to Date)</b></td>
                <td><input style="padding: 0px 4px; margin: 0px;" v-model="estimatedCreditsRequired" type="text">
                </td>
              </tr>
              <tr>
                <td><b>Grade (Term)*</b></td>
                <td>{{weightedFinalGradeForTerm}}%</td>
                <td colspan="2"><b>Credits Required (Term)</b></td>
                <td>
                  <input
                    style="padding: 0px 4px; margin: 0px;"
                    v-model.number="termCreditsRequired"
                    @input="onTermCreditsRequiredInput"
                    type="text"
                  >
                </td>
              </tr>
              <tr><td colspan="5"><p style="font-size: 0.75rem;">*Grade (Term) is what the student's grade will be at the end of the term if they submit nothing else. Until a student's credits completed surpasses Credits Required (Term) this will always be less than or equal to Grade (to Date). The exact formula is Grade * (Credits Completed / Credits Required)</p></td></tr>
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
      sortedTerms() {
        return [...this.termsData].sort((a, b) => {
          return new Date(b.entry_at) - new Date(a.entry_at);
        });
      },
      calculatedTermCreditsRequired() {
        return calculateCreditsRequired(
          this.submissionDatesStart,
          this.submissionDatesEnd,
          this.selectedTerm?.concurrent_sections
        );
      },
      weightedGradeForTerm() {
        return this.scaleGradeByCredits(this.unweightedGrade, this.estimatedCreditsRequired);
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
        return this.scaleGradeByCredits(this.unweightedGrade, this.termCreditsRequired);
      },
      termDatesDirty() {
        return (
          !!this.selectedTerm?._id &&
          (
            this.submissionDatesStart !== this.savedSubmissionDatesStart ||
            this.submissionDatesEnd !== this.savedSubmissionDatesEnd ||
            Number(this.termCreditsRequired) !== Number(this.savedTermCreditsRequired)
          )
        );
      },

    },
    data() {
      return {
        savedSubmissionDatesStart: undefined,
        savedSubmissionDatesEnd: undefined,
        savedTermCreditsRequired: 0,
        savedTermCreditsHasOverride: false,
        savingTermDates: false,

        showBulkUpdateModal: false,
        bulkUpdateStep: "confirm", // "confirm" or "select"
        bulkTermsToUpdate: [],     // list of terms from server
        bulkSelectedTermIds: [],   // checked terms
        bulkLoading: false,
        bulkSaving: false,


        termsData: [],
        loadedTermsSisUserId: null,
        selectedTermId: '',
        selectedTerm: {},
        gradesBetweenDates: {},
        progressBetweenDates: {},
        submissionData: {},
        showGradeDetails: false,
        includedAssignments: {},
        courseAssignmentGroups: {},
        estimatedCreditsRequired: 0,
        termCreditsRequired: 0,
        termCreditsManuallyEdited: false,
        submissionDatesStart: undefined,
        submissionDatesEnd: undefined,
        loadingProgress: 0,
        loadingMessage: "Loading...",
        loadingAssignments: true,
        submissionDates: [],
        courses: [],
      }
    },
    watch: {
      user: {
        immediate: true,
        deep: true,
        async handler(user) {
          const sisUserId = user.sis_user_id;
          if (!sisUserId) return;
          if (this.loadedTermsSisUserId === sisUserId && this.termsData.length) return;

          try {
            await this.loadTerms();
            this.loadedTermsSisUserId = sisUserId;
          } catch (err) {
            console.error("Failed loading HS terms:", err);
          }
        }
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
      normalizeTerm(baseTerm, overrideTerm) {
        const effectiveEntryAt = overrideTerm ? overrideTerm.entry_at__override || baseTerm.entry_at : baseTerm.entry_at;
        const effectiveExitAt = overrideTerm ? overrideTerm.exit_at__override || baseTerm.exit_at : baseTerm.exit_at;
        const creditsRequiredOverride = overrideTerm ? overrideTerm.credits_required__override : null;

        return {
          ...baseTerm,
          _id: buildTermKey(baseTerm),
          entry_at__original: baseTerm.entry_at,
          exit_at__original: baseTerm.exit_at,
          entry_at: effectiveEntryAt,
          exit_at: effectiveExitAt,
          section_code: baseTerm.section_code,
          concurrent_sections: Number(baseTerm.concurrent_sections),
          credits_required: creditsRequiredOverride != null
            ? Number(creditsRequiredOverride)
            : calculateCreditsRequired(effectiveEntryAt, effectiveExitAt, baseTerm.concurrent_sections),
          has_credits_required_override: creditsRequiredOverride != null,
          override: overrideTerm,
        };
      },

      mergeTerms(baseTerms, overrideTerms) {
        const overridesByKey = new Map(
          (overrideTerms || []).map(term => [buildTermKey(term), term])
        );

        return (baseTerms || []).map(baseTerm => this.normalizeTerm(baseTerm, overridesByKey.get(buildTermKey(baseTerm))));
      },

      applySelectedTerm(term) {
        this.selectedTerm = term;

        const start = toHtmlDate(term.entry_at);
        const end = toHtmlDate(term.exit_at);
        const creditsRequired = Number(term.credits_required) || 0;
        const hasOverride = !!term.has_credits_required_override;

        this.submissionDatesStart = start;
        this.submissionDatesEnd = end;
        this.savedSubmissionDatesStart = start;
        this.savedSubmissionDatesEnd = end;
        this.termCreditsRequired = creditsRequired;
        this.savedTermCreditsRequired = creditsRequired;
        this.savedTermCreditsHasOverride = hasOverride;
        this.termCreditsManuallyEdited = hasOverride;

        this.refreshIncludedAssignments();
        this.drawSubmissionsGraph(new Date(term.entry_at), new Date(term.exit_at));
        if (hasOverride) {
          this.estimatedCreditsRequired = creditsRequired;
        }
      },

      async loadTerms() {
        const sisUserId = this.user.sis_user_id;
        if (!sisUserId) return;

        let query = {
          sis_user_id: sisUserId
        }
        const [baseTerms, overrideTerms] = await Promise.all([
          bridgetools.req3('reports', query, { dataset: 'student_hs_terms' }),
          bridgetools.req3('reports', query, { dataset: 'student_hs_terms__override' })
        ]);

        this.termsData = this.mergeTerms(baseTerms, overrideTerms);

        if (!this.termsData.length) {
          this.selectedTermId = '';
          this.selectedTerm = {};
          return;
        }

        const selectedTermStillExists = this.termsData.some(term => term._id === this.selectedTermId);
        this.selectedTermId = selectedTermStillExists
          ? this.selectedTermId
          : this.sortedTerms[0]._id;

        if (this.selectedTermId) {
          this.applySelectedTerm(this.termsData.find(term => term._id === this.selectedTermId));
        }
      },

      buildHsTermUpdatePayload(term) {
        const payload = {
          sis_user_id: term.sis_user_id,
          course_code: term.course_code,
          campus_code: term.campus_code,
          entry_at: term.entry_at__original,
        };

        const nextEntryAt = toReq3DateTime(this.submissionDatesStart);
        const nextExitAt = toReq3DateTime(this.submissionDatesEnd);
        const nextCreditsRequired = Number(this.termCreditsRequired) || 0;

        if (nextEntryAt && nextEntryAt !== term.entry_at__original) {
          payload.entry_at__override = nextEntryAt;
        }

        if (nextExitAt && nextExitAt !== term.exit_at__original) {
          payload.exit_at__override = nextExitAt;
        }

        if (nextCreditsRequired !== calculateCreditsRequired(nextEntryAt, nextExitAt, term.concurrent_sections)) {
          payload.credits_required__override = nextCreditsRequired;
        }

        return payload;
      },

      async hsTermsUpdate(payload = {}) {
        const authCode = await bridgetools.getCanvasAuthCode();

        return new Promise((resolve, reject) => {
          $.ajax({
            url: 'https://reports.bridgetools.dev/api3/hs_terms',
            method: 'POST',
            data: JSON.stringify(payload),
            contentType: 'application/json',
            processData: false,
            headers: {
              Authorization: `Bearer ${authCode}`,
              'X-Canvas-User-Id': String(ENV.current_user_id),
            },
          })
            .done(data => resolve(data))
            .fail((xhr, status, err) => reject({ xhr, status, err }));
        });
      },

      getSaveErrorMessage(err) {
        const responseJson = err?.xhr?.responseJSON;
        const responseText = err?.xhr?.responseText;
        const message =
          responseJson?.error ||
          responseJson?.message ||
          responseJson?.data?.message ||
          responseText ||
          err?.message ||
          'Failed to save term date changes.';

        return String(message);
      },

      async confirmSingleUpdate() {
        const term = this.selectedTerm;
        if (!term?._id) return;

        this.savingTermDates = true;

        try {
          const payload = this.buildHsTermUpdatePayload(term);
          if (Object.keys(payload).length <= 4) {
            this.savedSubmissionDatesStart = this.submissionDatesStart;
            this.savedSubmissionDatesEnd = this.submissionDatesEnd;
            this.savedTermCreditsRequired = Number(this.termCreditsRequired) || 0;
            this.closeBulkModal();
            return;
          }

          await this.hsTermsUpdate(payload);
          await this.loadTerms();
          this.selectedTermId = term._id;
          this.applySelectedTerm(this.termsData.find(item => item._id === term._id));
          this.closeBulkModal();
        } catch (err) {
          console.error("Failed saving term dates:", err);
          alert(this.getSaveErrorMessage(err));
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

      async hydrateBulkTermsWithNames(terms) {
        const uniqueCanvasUserIds = [...new Set(terms.map(term => term.canvas_user_id))];
        const users = await Promise.all(
          uniqueCanvasUserIds.map(canvasUserId => $.get(`/api/v1/users/${canvasUserId}`))
        );
        const namesByCanvasUserId = new Map(
          users.map(user => [user.id, user.name])
        );

        return terms.map(term => ({
          ...term,
          student_name: namesByCanvasUserId.get(term.canvas_user_id)
        }));
      },

      async loadBulkUpdateList() {
        try {
          this.bulkUpdateStep = "select";
          this.bulkLoading = true;

          const filters = {
            course_code: this.selectedTerm.course_code,
            campus_code: this.selectedTerm.campus_code,
            academic_year: this.selectedTerm.academic_year
          };

          const [baseTerms, overrideTerms] = await Promise.all([
            bridgetools.req3('reports', filters, { dataset: 'student_hs_terms' }),
            bridgetools.req3('reports', filters, { dataset: 'student_hs_terms__override' })
          ]);

          const selectedOriginalEntryAt = normalizeTermTimestamp(this.selectedTerm.entry_at__original);
          const mergedTerms = this.mergeTerms(baseTerms, overrideTerms).filter(term => {
            return normalizeTermTimestamp(term.entry_at__original) === selectedOriginalEntryAt;
          });
          this.bulkTermsToUpdate = await this.hydrateBulkTermsWithNames(mergedTerms);
          const currentTermId = this.selectedTerm?._id;

          this.bulkSelectedTermIds = this.bulkTermsToUpdate.map(t => t._id);

          if (currentTermId && !this.bulkSelectedTermIds.includes(currentTermId)) {
            this.bulkSelectedTermIds.push(currentTermId);
          }

        } catch (err) {
          console.error(err);
          alert(this.getSaveErrorMessage(err));
          this.closeBulkModal();
        } finally {
          this.bulkLoading = false;
        }
      },
      async confirmBulkUpdate() {
        try {
          this.bulkSaving = true;

          const selectedTerms = this.bulkTermsToUpdate.filter(term => {
            return this.bulkSelectedTermIds.includes(term._id);
          });

          const payloads = selectedTerms
            .map(term => this.buildHsTermUpdatePayload(term))
            .filter(payload => Object.keys(payload).length > 4);

          if (payloads.length) {
            await Promise.all(payloads.map(payload => this.hsTermsUpdate(payload)));
          }

          await this.loadTerms();
          this.selectedTermId = this.selectedTerm._id;
          this.applySelectedTerm(this.termsData.find(term => term._id === this.selectedTermId));
          this.closeBulkModal();
          alert("Bulk update complete.");
        } catch (err) {
          console.error(err);
          alert(this.getSaveErrorMessage(err));
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
        const studentId = String(this.userId || "");
        if (!studentId) return [];

        return window.loadIndividualReportHSGradeCourses(studentId, ({ message, progress }) => {
          this.loadingMessage = message;
          this.loadingProgress = progress;
        });
      },

      updateDatesToSelectedTerm() {
        const term = this.termsData.find(t => t._id === this.selectedTermId);
        if (!term) return;

        this.applySelectedTerm(term);
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
        this.termCreditsRequired = this.savedTermCreditsRequired;
        this.termCreditsManuallyEdited = this.savedTermCreditsHasOverride;
        this.refreshIncludedAssignments();
      },

      onDateRangeChange() {
        if (!this.termCreditsManuallyEdited) {
          this.termCreditsRequired = this.calculatedTermCreditsRequired;
        }
        this.refreshIncludedAssignments();
      },

      onTermCreditsRequiredInput() {
        this.termCreditsManuallyEdited = true;
        this.calcGradesFromIncludedAssignments();
      },

      scaleGradeByCredits(grade, requiredCredits) {
        const neededCredits = Number(requiredCredits) || 0;
        const creditsCompleted = this.sumCreditsCompleted();
        let adjustedGrade = grade;

        if (
          creditsCompleted < neededCredits &&
          neededCredits !== 0 &&
          creditsCompleted !== 0
        ) {
          adjustedGrade *= creditsCompleted / neededCredits;
        }

        const output = Number(adjustedGrade.toFixed(2));
        return isNaN(output) ? 0 : output;
      },


      sumProgressBetweenDates() {
        return this.courses.reduce((sum, course) => {
          const courseId = course.course_id ?? course.id;
          return sum + (this.progressBetweenDates[courseId] || 0);
        }, 0);
      },
      sumCreditsCompleted() {
        let sum = 0;
        this.courses.forEach(course => {
          const progress = this.progressBetweenDates[course.course_id];
          const credits = Number(course.hours) > 0 ? course.hours / 30 : 0;
          if (progress > 0 && credits > 0) {
            sum += Math.round(progress * credits) * 0.01;
          }
        });
        return parseFloat(sum.toFixed(2)) ?? 0;
      },

      parseDate(dateString) {
        return parseDateValue(dateString);
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
        const credits = Math.round((completed / 30) * 100) / 100;
        return credits;
      },

      buildIncludedAssignmentsForCourse(course, startDate, endDate) {
        const courseId = course.course_id;
        const includedCourse = {
          name: course.name,
          id: courseId,
          include: true,
          groups: {}
        };
        const submissions = this.submissionData[courseId];
        if (!submissions) return includedCourse;

        const submissionsByAssignmentId = submissions.reduce((map, submission) => {
          if (submission.score !== null) {
            map[submission.assignmentId] = submission;
          }
          return map;
        }, {});
        const assignmentGroups = this.courseAssignmentGroups[courseId] || [];
        const sumWeights = assignmentGroups.reduce((sum, group) => sum + group.groupWeight, 0);

        assignmentGroups.forEach((group, index) => {
          includedCourse.groups[index] = {
            name: group.name,
            id: group.id,
            groupWeight: group.groupWeight,
            include: true,
            assignments: {}
          };

          if (!(group.groupWeight > 0 || sumWeights === 0)) return;

          group.assignments.forEach(assignment => {
            const assignmentId = parseInt(assignment._id);
            const submission = submissionsByAssignmentId[assignmentId];
            if (!assignment.published || !submission) return;

            const submissionDate = submission.submittedAt || submission.gradedAt;
            const include = submissionDate
              ? new Date(submissionDate) >= startDate && new Date(submissionDate) <= endDate
              : false;

            includedCourse.groups[index].assignments[assignmentId] = {
              include,
              id: assignmentId,
              name: assignment.name,
              score: submission.score,
              points_possible: assignment.pointsPossible,
              sub: submission.id,
              date: submissionDate
            };
          });
        });

        return includedCourse;
      },

      refreshIncludedAssignments() {
        const startDate = this.parseDate(this.submissionDatesStart);
        const endDate = this.parseDate(this.submissionDatesEnd);
        if (startDate === undefined || endDate === undefined) return;

        const includedAssignments = this.courses.reduce((map, course) => {
          map[course.course_id] = this.buildIncludedAssignmentsForCourse(course, startDate, endDate);
          return map;
        }, {});

        this.includedAssignments = deepClone(includedAssignments);
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
        this.gradesBetweenDates = deepClone(gradesBetweenDates);
        this.progressBetweenDates = deepClone(progressBetweenDates);
        //this value can be edited by the instructor
        let estimatedCreditsRequired = Math.round(Number(this.termCreditsRequired) * midtermPercentCompleted * 100) / 100;
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
        return toHtmlDate(date);
      },
    }
  });
})();
