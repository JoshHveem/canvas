/*
  If someone cannot view this report, they needed to be added under the sub-account via:
  Settings->Admins->Add Account Admins
  They only need the View Enrollments level access to be able to see the report.
  Show which tab you're on
*/
(async function () {
  //Confirm with Instructional Team before going live
  console.log(CURRENT_DEPARTMENT_ID);
  if (true) {
      if (/[0-9]+\/grades/.test(window.location.pathname)) {
        let loadedWarning = false;
        try {
          let user = await bridgetoolsReq(`https://reports.bridgetools.dev/api/students/${ENV.current_user_id}`);
          if (user?.enrollment_type == 'HS' && CURRENT_DEPARTMENT_ID === 3824) { //Dental testing this
            loadedWarning = true;
            $("#content").prepend(`
              <div style="background-color: white; position:relative; left: 0; bottom: 0;" class="ic-notification ic-notification--danger">
                <div class="ic-notification__icon" role="presentation">
                  <i class="icon-info"></i>
                  <span class="screenreader-only">
                    information
                  </span>
                </div>
                <div class="ic-notification__content">
                  <div class="ic-notification__message">
                    <h4 class="ic-notification__title">
                      High School Students!
                    </h4>
                    <p class="notification_message">The grade here is your course grade, but may <strong>NOT</strong> be your final grade submitted to your high school at the end of the term. Your term grade will be based on only the assignments submitted during the term and may be based on the ammount of work you completed across multiple courses.</p>
                    <p>Contact your instructor if you have any questions about your grade.</p>
                  </div>
                </div>
              </div>
            `);
          }
        } catch(err) {

        }
        if (!loadedWarning) {
        $("#content").prepend(`
          <div style="background-color: white; position:relative; left: 0; bottom: 0;" class="ic-notification ic-notification--danger">
            <div class="ic-notification__icon" role="presentation">
              <i class="icon-info"></i>
              <span class="screenreader-only">
                information
              </span>
            </div>
            <div class="ic-notification__content">
              <div class="ic-notification__message">
                <h4 class="ic-notification__title">
                  Final Grades! 
                </h4>
                <p class="notification_message">The default grade shown by Canvas only takes into account graded items, and may <strong>NOT</strong> reflect the final grade. You may uncheck the box labeled "Calculate based only on graded assignments" to show the actual grade including ungraded assignments. Assignments which show a - by them have not been submitted.</p>
                <p>Contact an instructor if you have any questions about grades.</p>
              </div>
            </div>
          </div>
        `);

        }
      } else {

      }
  }

  async function postLoad() {
    let app = this;
    let vueString = '';
    //gen an initial uuid
    await $.get(SOURCE_URL + '/custom_features/reports/individual_page/template.vue', null, function (html) {
      vueString = html.replace("<template>", "").replace("</template>", "");
    }, 'text');
    let canvasbody = $("#application");
    canvasbody.after('<div id="canvas-individual-report-vue"></div>');
    $("#canvas-individual-report-vue").append(vueString);
    let gen_report_button;
    let menu_bar;
    if (/^\/$/.test(window.location.pathname)) {
      gen_report_button = $('<a class="btn button-sidebar-wide" id="canvas-individual-report-vue-gen"></a>');
      let plannerHeader = $(".PlannerHeader");
      if (plannerHeader.length > 0) {
        menu_bar = plannerHeader;
      } else {
        menu_bar = $("#right-side div").last();
      }
    } else if (/^\/courses\/[0-9]+\/users\/[0-9]+$/.test(window.location.pathname)) {
      gen_report_button = $('<a style="cursor: pointer;" id="canvas-individual-report-vue-gen"></a>');
      menu_bar = $("#right-side div").first();
    } else {
      gen_report_button = $('<a class="btn button-sidebar-wide" id="canvas-individual-report-vue-gen"></a>');
      menu_bar = $("#right-side div").first();
    }
    gen_report_button.append('Student Report');
    gen_report_button.appendTo(menu_bar);
    let modal = $('#canvas-individual-report-vue');
    modal.hide();

    this.APP = new Vue({
      el: '#canvas-individual-report-vue',
      mounted: async function () {
        let app = this;
        app.loadingProgress = 0;
        this.IS_TEACHER = IS_TEACHER;
        // if (!IS_TEACHER) this.menu = 'period';
        if (IS_TEACHER) { //also change this to ref the url and not whether or not is teacher
          let match = window.location.pathname.match(/(users|grades)\/([0-9]+)/);
          this.userId = match[2];
        } else {
          this.userId = ENV.current_user_id;
        }

        this.loadingMessage = "Loading Settings";
        let settings = await app.loadSettings();
        this.settings = settings;
        this.loadingProgress += 10;

        //load data from bridgetools
        this.loadingMessage = "Loading User Data";
        //Pulled enrollment data out of loadUser func because it is ready to use for Grades between dates out of the box and doesn't need to wait on all of the other stuff loadUser does
        let enrollmentData = await bridgetoolsReq("https://reports.bridgetools.dev/api/students/canvas_enrollments/" + this.userId);
        this.enrollmentData = enrollmentData;

        try {
          let user = await app.loadUser(this.userId);
          console.log(user);
          this.user = user;
        } catch(err) {
          console.log(err);
          app.user = {};
        }
        app.loadingProgress += 10;
        this.loading = false;
        
      },

      data: function () {
        return {
          currentDepartment: null,
          enrollmentData:  undefined,
          userId: null,
          user: {},
          tree: {
            other: {}
          },
          colors: bridgetools.colors,
          settings: {},
          terms: [],
          sections: [],
          loading: true,
          loadingMessage: "Loading Results...",
          loadingProgress: 0,
          accessDenied: false,
          menu: 'report',
          IS_TEACHER: false,
          enrollment_tab: {
            managedStudent: {},
            task: 'enroll',
            schools: [
              'Sky View',
              'Cache High',
              'Bear River',
              'Box Elder',
              'Mountain Crest',
              'Green Canyon',
              'Logan High',
              'Ridgeline',
              'Fast Forward',
              'InTech'
            ],
            saveTerm: {},
            studentIdInput: '',
            studentsFound: [],
            studentsNotFound: [],
            dept: '',
          }
        }
      },

      computed: {
        visibleColumns: function () {
          return this.columns.filter(function (c) {
            return c.visible;
          })
        }
      },

      methods: {
        close() {
          let modal = $('#canvas-individual-report-vue');
          modal.hide();
        },
        async loadSettings() {
          let settings = await bridgetoolsReq("https://reports.bridgetools.dev/api/settings/" + ENV.current_user_id);
          if (settings.individualReport == undefined) {
            settings.individualReport = {
            }
          }
          if (settings.individualReport.attendanceCutoffs == undefined) {
            settings.individualReport.attendanceCutoffs = {
              good: 90,
              checkIn: 80,
              critical: 0,
              show: false
            }
            //app.saveSettings("individualReport");
          }
          return settings;
        },

        async refreshHSEnrollmentTerms() {
          let app = this;
          let terms;
          await $.get("https://canvas.bridgetools.dev/api/enroll_hs/" + app.userId, function (data) {
            terms = data;
          });
          app.terms = terms
        },

        async getHSEnrollment() {

        },

        formatDate(date) {
          date = new Date(date);
          date.setDate(date.getDate() + 1);
          let month = '' + (date.getMonth() + 1);
          if (month.length === 1) month = '0' + month;

          let day = '' + date.getDate();
          if (day.length === 1) day = '0' + day;

          let formattedDate = month + "/" + day + "/" + date.getFullYear();
          return formattedDate;
        },
        async deleteHSEnrollmentTerm(term) {
          let app = this;
          await $.delete('https://canvas.bridgetools.dev/api/enroll_hs/' + term._id, {});
          for (let i = 0; i < app.terms.length; i++) {
            if (app.terms[i]._id === term._id) {
              app.terms.splice(i, 1);
              return;
            }
          }
        },

        async enrollHS() {
          let app = this;
          await $.post('https://canvas.bridgetools.dev/api/enroll_hs', {
            'students': JSON.stringify([app.userId]),
            'term_data': JSON.stringify({
              hours: app.enrollment_tab.saveTerm.hours,
              type: app.enrollment_tab.saveTerm.type,
              startDate: app.enrollment_tab.saveTerm.startDate,
              endDate: app.enrollment_tab.saveTerm.endDate,
              school: app.enrollment_tab.saveTerm.school
            }),
          }, function (data) {
            app.refreshHSEnrollmentTerms();
          })
        },


        async loadTree(deptCode, deptYear) {
          let url = "https://reports.bridgetools.dev/api/trees?dept_code=" + deptCode + "&year=" + deptYear;
          let data = await bridgetoolsReq(url);
          let tree = data[0] ?? {};
          if (tree?.courses === undefined) tree.courses = {};
          if (tree?.courses?.core === undefined) tree.courses.core = {};
          if (tree?.courses?.elective === undefined) tree.courses.elective = {};
          if (tree?.courses?.other === undefined) tree.courses.other = {};

          this.tree = tree;
          return tree;
        },

        async loadUser(userId) {
          let user, tree;
          let reqUrl = "/api/v1/users/" + ENV.current_user_id + "/custom_data/btech-reports?ns=dev.bridgetools.reports";
          let authCode = '';
          await $.get(reqUrl, data => {
            authCode = data.data.auth_code;
          });
          await $.get("https://reports.bridgetools.dev/api/students/" + userId + "?requester_id=" + ENV.current_user_id + "&auth_code=" + authCode, function (data) {
            user = data;
          });
          if (user === "") {
            try {
              await $.get("/api/v1/users/" + userId, function (data) {
                user = {
                  name: data.name,
                  sis_id: data.sis_user_id,
                  canvas_id: data.id,
                  enrollment_type: "",
                  last_login: "",
                  enrolled_hours: 0,
                  enrolledHours: 0,
                  completedHours: 0,
                  avatar_url: data.avatar_url,
                  courses: {},
                  treeCourses: {
                    other: []
                  },
                  submissions: [],
                }
              });
            } catch (err) {
              user = {
                name: "",
                sis_id: "",
                canvas_id: this.userId,
                enrollment_type: "",
                last_login: "",
                enrolled_hours: 0,
                enrolledHours: 0,
                completedHours: 0,
                avatar_url: "",
                courses: {},
                treeCourses: {
                  other: []
                },
                submissions: [],
              }
            }

            let enrollmentData = this.enrollmentData;
            for (let e in enrollmentData) {
              let enrollment = enrollmentData[e];
              let courseName = "";
              await $.get("/api/v1/courses/" + enrollment.course_id, function (data) {
                courseName = data.name;
              })
              let final_score = enrollment.grades.final_score;
              if (final_score === undefined || final_score === null) final_score = 0;
              let current_score = enrollment.grades.current_score;
              if (current_score === undefined || current_score === null) current_score = 0;
              let progress = 0;
              if (current_score !== 0) progress = (final_score / current_score) * 100;
              let courseCode = "";
              let courseCodeM = "";
              if (enrollment.sis_course_id != null) {
                courseCodeM = enrollment.sis_course_id.match(/([A-Z]{4} [0-9]{4})/);
                if (courseCodeM) courseCode = courseCodeM[1];
              }
              if (courseCode !== "") {
                let courseData = {
                  code: courseCode,
                  course_id: enrollment.course_id,
                  hours: 0,
                  last_activity: enrollment.last_activity_at,
                  start: enrollment.created_at,
                  progress: progress,
                  state: enrollment.enrollment_state,
                  enabled: true,
                  name: courseName,
                  score: current_score
                }
                user.courses[courseCode] = courseData;
                user.treeCourses.other.push(courseData)
              }
            }
            tree = {
              hours: 0,
              name: "",
              courses: {
                core: {},
                elective: {}
              }
            }
          } else {
            let date = new Date();
            let maxyear = date.getFullYear();
            let month = date.getMonth() + 1;
            if (month <= 6) maxyear -= 1;

            user.depts = user.depts.filter((dept) => dept.year <= maxyear);
            user.depts.sort((a, b) => {
              if (a.year == b.year) {
                return (a.dept.toLowerCase() > b.dept.toLowerCase()) ? 1 : ((a.dept.toLowerCase() < b.dept.toLowerCase()) ? -1 : 0)
              }
              return (a.year > b.year) ? -1 : ((a.year < b.year) ? 1 : 0)
            });
            this.currentDepartment = user.depts[0];
            tree = await this.loadTree(user.depts[0].dept, user.depts[0].year);
          }

          user = this.updateUserCourseInfo(user, tree);
          return user;
        },

        async changeTree(user) {
          let app = this;
          let tree = await app.loadTree(app.currentDepartment.dept, app.currentDepartment.year);
          user = app.updateUserCourseInfo(user, tree);
          app.user = user;
        },

        updateUserCourseInfo(user, tree) {
          user = bridgetools.processUserData(user, tree); 
          return user;
        },

      }
    })
    gen_report_button.click(function () {
      let modal = $('#canvas-individual-report-vue');
      app.APP.refreshHSEnrollmentTerms();
      $.post("https://tracking.bridgetools.dev/api/hit", {
        "tool": "reports-individual_page",
        "canvasId": ENV.current_user_id
      });
      modal.show();
    });
  }
  
  

  await $.put("https://reports.bridgetools.dev/gen_uuid?requester_id=" + ENV.current_user_id);
  loadCSS("https://reports.bridgetools.dev/style/main.css");
  loadCSS("https://reports.bridgetools.dev/department_report/style/main.css");
  $.getScript("https://d3js.org/d3.v6.min.js").done(function () {
    $.getScript("https://cdnjs.cloudflare.com/ajax/libs/print-js/1.5.0/print.js").done(function () {
      $.getScript("https://reports.bridgetools.dev/components/icons/alert.js").done(function () {
        $.getScript("https://reports.bridgetools.dev/components/icons/distance-approved.js").done(function () {
          $.getScript("https://reports.bridgetools.dev/department_report/components/courseRowInd.js").done(function () {
            $.getScript("https://reports.bridgetools.dev/department_report/components/courseProgressBarInd.js").done(function () {
              $.getScript("https://reports.bridgetools.dev/department_report/components/menuStatus.js").done(function () {
                $.getScript("https://reports.bridgetools.dev/department_report/components/menuInfo.js").done(function () {
                  $.getScript("https://reports.bridgetools.dev/department_report/components/menuFilters.js").done(function () {
                    $.getScript("https://reports.bridgetools.dev/department_report/components/menuSettings.js").done(function () {
                      $.getScript("https://reports.bridgetools.dev/department_report/components/individual_report/indGraphs.js").done(function () {
                        $.getScript("https://reports.bridgetools.dev/department_report/components/individual_report/indHeader.js").done(function () {
                          $.getScript("https://reports.bridgetools.dev/department_report/components/individual_report/indHeaderCredits.js").done(function () {
                            $.getScript("https://reports.bridgetools.dev/department_report/components/individual_report/showStudentInd.js").done(function () {
                              $.getScript("https://reports.bridgetools.dev/department_report/components/individual_report/showStudentIndCredits.js").done(function () {
                                $.getScript("https://reports.bridgetools.dev/department_report/components/individual_report/showStudentHours.js").done(function () {
                                  $.getScript("https://reports.bridgetools.dev/department_report/components/individual_report/showStudentEmploymentSkills.js").done(function () {
                                    $.getScript(SOURCE_URL + '/custom_features/reports/individual_page/showStudentGrades.js').done(function () {
                                      $.getScript("https://reports.bridgetools.dev/department_report/graphs.js").done(function () {
                                        $.getScript(SOURCE_URL + '/custom_features/reports/individual_page/gradesBetweenDates.js').done(function () {
                                          postLoad();
                                        });
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
  function loadCSS(url) {
    var style = document.createElement('link'),
      head = document.head || document.getElementsByTagName('head')[0];
    style.href = url;
    style.type = 'text/css';
    style.rel = "stylesheet";
    style.media = "screen,print";
    head.insertBefore(style, head.firstChild);
  }
  async function bridgetoolsReq(url) {
    let reqUrl = "/api/v1/users/" + ENV.current_user_id + "/custom_data/btech-reports?ns=dev.bridgetools.reports";
    let authCode = '';
    await $.get(reqUrl, data => {
      authCode = data.data.auth_code;
    });
    //figure out if any params exist then add autho code depending on set up.
    if (!url.includes("?")) url += "?auth_code=" + authCode + "&requester_id=" + ENV.current_user_id;
    else url += "&auth_code=" + authCode + "&requester_id=" + ENV.current_user_id;
    let output;
    await $.get(url, function (data) {
      output = data;
    });
    return output;
  }
})();