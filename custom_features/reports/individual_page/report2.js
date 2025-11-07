/*
  If someone cannot view this report, they needed to be added under the sub-account via:
  Settings->Admins->Add Account Admins
  They only need the View Enrollments level access to be able to see the report.
  Show which tab you're on
*/
(async function () {
  //Confirm with Instructional Team before going live
  function initialize_user_data(user) {
    user.include_hours = []; //list of courses that are counting towards sap
    user.transfer_courses = [];
    user.courses = user.courses ?? {};
    user.entry_date = user.entry_date ? new Date(user.entry_date) : "N/A";
    user.last_login = user.last_login ? new Date(user.last_login) : "N/A";
    user.days_since_last_submission = bridgetools.getDaysSinceLastSubmission(user); 

    user.completed_hours = 0;
    user.graded_hours = 0;
    user.completed_credits = 0;
    user.average_score = 0;

    user.treeCourses = {
      core: [],
      elective: [],
      other: [] 
    }
  }

  function getCourseHours(tree, course, courseCode) {
    let courseHours = course.hours;
    let programCourseData;
    //If no defined hours, check the program tree for hours
    if (courseHours == undefined) {
      if (courseCode in tree.courses.core) programCourseData = tree.courses.core[courseCode];
      else if (courseCode in tree.courses.elective) programCourseData = tree.courses.elective[courseCode];
      if (programCourseData !== undefined) courseHours = programCourseData.hours;
    }
    courseHours = parseInt(courseHours);
    return courseHours;
  }

  function getCourseCredits(tree, course, courseCode) {
    let courseCredits = course.credits;
    let programCourseData;
    //If no defined hours, check the program tree for credits 
    if (courseCredits == undefined) {
      if (courseCode in tree.courses.core) programCourseData = tree.courses.core[courseCode];
      else if (courseCode in tree.courses.elective) programCourseData = tree.courses.elective[courseCode];
      if (programCourseData !== undefined) courseCredits = programCourseData.credits;
    }
    courseCredits = parseInt(courseCredits);
    return courseCredits;
  }

  function updateTreeCourses(user, tree, courseData) {
    //
    if (courseData.is_transfer) user.transfer_courses.push(courseData.code);

    //
    if (courseData.code in tree.courses.core) {
      user.treeCourses.core.push(courseData);
    } else if (courseData.code in tree.courses.elective) {
      user.treeCourses.elective.push(courseData);
    } else {
      user.treeCourses.other.push(courseData);
    }
  }

  function processUserData(user, tree, override) {
    tree.courses = tree.courses ?? {};
    tree.courses.core = tree.courses.core ?? {};
    tree.courses.elective = tree.courses.elective ?? {};


    //current method for calculating start and end date, defaults to today if nothing there
    ////maybe not the best, but it'll have to do
    let userTreeData = {};
    for (let d in user.degrees) {
      let dept = user.degrees[d];
      if (dept.dept == tree.dept_code && dept.year == tree.year) {
        userTreeData = dept;
      }
    }


    user.start = userTreeData?.start ?? "";
    user.start = user.start.replace("Z", "-0600");
    user.start = new Date(user.start);

    user.end = userTreeData?.end ?? "";
    user.end = user.end.replace("Z", "-0600");
    user.end = new Date(user.end);

    initialize_user_data(user);
    for (let courseCode in user.courses) {
      let course = user.courses[courseCode];
      //this is a visual to show which hours are being included in the report. mostly for debugging
      let courseHours = getCourseHours(tree, course, courseCode);
      let courseCredits = getCourseCredits(tree, course, courseCode);
      course.hours = courseHours;
      course.credits = courseCredits;
      let progress = course.progress;
      if (progress >= 100) progress = 100;

      courseEntryDateStr = course?.entry || course.start;
      courseEntryDate = new Date(courseEntryDateStr)
      courseStartDate = new Date(course.start);

      let courseData = {
        'code': courseCode,
        'course_id': course.canvas_id,
        'last_activity': course.last_activity,
        'progress': parseFloat(progress),
        'start': courseStartDate,
        'entry': courseEntryDate,
        'hours': courseHours,
        'credits': courseCredits,
        'include_hours': course.include_hours,
        'is_transfer': course.is_transfer
      }
      updateTreeCourses(user, tree, courseData);

      //Had a don't include if course score is null, but it was excluding courses that should belong. Hopefully this doesn't screw things up
      ////I believe that was to fix the course grade average being off. I've tried a fix
      //In this setup, I'm only averaging grades for courses completed DURING their current enrollment, IE courses counting in their SAP
      //Transfer courses would NOT be included.
      //Whether this is useful will depend on department, and may need to include both averages...
      //If there's an override score, ignore everything else
      let checkValidCourse = bridgetools.checkValidCourse(user, tree, course, courseCode, courseEntryDate);
      let courseCompletedHours = course.hours * progress * .01;
      let courseCompletedCredits = Math.floor(course.credits * progress * .01 * 4) / 4;

      if (course.is_transfer && (courseCode in tree.courses.core || courseCode in tree.courses.elective)) {
        user.transfer_hours += user.completed_hours;
        user.transfer_credits += user.completed_hours;
      }
      if (checkValidCourse) {
        user.include_hours.push(courseCode);
        let score = course.score;
        if (isNaN(score)) {
          score = null;
        }

        if (checkValidCourse) {
          user.completed_hours += courseCompletedHours;
          user.completed_credits += courseCompletedCredits;
        } 

        bridgetools.updateAverages(
          user
          , score
          , checkValidCourse
          , courseCompletedHours
        );

      } else {
        courseEntryDate = undefined;
      }
    }

    user.average_score /= user.graded_hours;
    if (isNaN(user.average_score)) user.average_score = undefined;


    user.enrolled_hours = Math.round(user.enrolled_hours);
    user.unaccrued_hours = user?.unaccrued_hours ?? 0;
    user.completed_hours = Math.round(user.completed_hours);
    user.completed_credits = Math.floor(user.completed_credits * 4) / 4;


    //EGP
    let totalDays = (user.end - user.start) / (24 * 60 * 60 * 1000);
    let today = (new Date().setHours(0,0,0,0));
    let currentDays = (today - user.start) / (24 * 60 * 60 * 1000);
    let perc = (currentDays / totalDays);
    let requiredCredits = Math.ceil((tree.hours * perc * 10)) / 10;
    let lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    let lastDays = (lastDay - user.start) / (24 * 60 * 60 * 1000);
    let lastPerc = (lastDays / totalDays);
    let lastRequiredCredits = Math.ceil(tree.hours * lastPerc);
    user.required_credits = requiredCredits;
    // WITH CREDITS, DOES IT DO ANY GOOD FOR STUDENT TO KNOW REQUIRED CREDITS AT THAT MOMENT? SEEMS LIKE END OF MONTH IS ALL THAT MATTERS
    user.unaccrued_required_credits = lastRequiredCredits - requiredCredits;

    /*
    //need to sort so newest month is first to then grab first entry for sap change
    user.historical_data.sort(function (a, b) {
      return (b.year - a.year) || (b.month - a.month)
    })
    */

    return user;
  }
  async function postLoad() {
    let vueString = '';
    //gen an initial uuid
    await $.get(SOURCE_URL + '/custom_features/reports/individual_page/template2.vue', null, function (html) {
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

    APP = new Vue({
      el: '#canvas-individual-report-vue',
      mounted: async function () {
        this.loadingProgress = 0;
        this.IS_TEACHER = IS_TEACHER;
        // if (!IS_TEACHER) this.menu = 'period';
        if (IS_TEACHER) { //also change this to ref the url and not whether or not is teacher
          let match = window.location.pathname.match(/(users|grades)\/([0-9]+)/);
          this.userId = match[2];
        } else {
          this.userId = ENV.current_user_id;
        }

        this.loadingMessage = "Loading Settings";
        let settings = await this.loadSettings();
        this.settings = settings;
        this.loadingProgress += 10;

        //load data from bridgetools
        this.loadingMessage = "Loading User Data";
        //Pulled enrollment data out of loadUser func because it is ready to use for Grades between dates out of the box and doesn't need to wait on all of the other stuff loadUser does
        let enrollmentData = await bridgetools.req("https://reports.bridgetools.dev/api/students/canvas_enrollments/" + this.userId);
        this.enrollmentData = enrollmentData;

        try {
          let user = await this.loadUser(this.userId);
          console.log(user);
          this.user = user;
        } catch(err) {
          console.log(err);
          this.user = {};
        }
        this.loadingProgress += 10;
        this.loading = false;
        
      },

      data: function () {
        return {
          currentDegree: null,
          enrollmentData:  undefined,
          userId: null,
          user: {},
          canvasUser: {},
          bridgetoolsUser: {},
          tree: {
            other: {}
          },
          goal: undefined,
          colors: bridgetools.colors,
          settings: {},
          terms: [],
          sections: [],
          loading: true,
          loadingMessage: "Loading Results...",
          loadingProgress: 0,
          accessDenied: false,
          settingGoal: false,
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
          let settings = await bridgetools.req("https://reports.bridgetools.dev/api/settings/" + ENV.current_user_id);
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
          }
          return settings;
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

        async loadTree(deptCode, deptYear) {
          let url = "https://reports.bridgetools.dev/api/trees?dept_code=" + deptCode + "&year=" + deptYear;
          let data = await bridgetools.req(url);
          let tree = data[0] ?? {};
          if (tree?.courses === undefined) tree.courses = {};
          if (tree?.courses?.core === undefined) tree.courses.core = {};
          if (tree?.courses?.elective === undefined) tree.courses.elective = {};
          if (tree?.courses?.other === undefined) tree.courses.other = {};

          this.tree = tree;
          return tree;
        },

        async loadUser(userId) {
          let user = {};
          try {
            this.bridgetoolsUser = await bridgetools.req(
              `https://reports.bridgetools.dev/api2/students/${userId}?requester_id=${ENV.current_user_id}`
            );
            this.canvasUser = (await canvasGet(`/api/v1/users/${userId}`))?.[0];

          } catch (err) {
            console.log(err);
            return {};
          }
          console.log(user);
          // Be tolerant of missing degrees
          user.degrees = Array.isArray(bridgetoolsUser?.degrees) ? bridgetoolsUser.degrees : [];
          user.courses = Array.isArray(bridgetoolsUser?.courses) ? bridgetoolsUser.courses: [];

          // Guard degree ops
          const date = new Date();
          let maxyear = date.getFullYear();
          if ((date.getMonth() + 1) <= 6) maxyear -= 1;

          user.degrees = (user.degrees || []).filter(d => Number(d?.year) <= maxyear);

          user.degrees.sort((a, b) => {
            if (a.year === b.year) {
              const ad = String(a.dept || '').toLowerCase();
              const bd = String(b.dept || '').toLowerCase();
              return ad > bd ? 1 : ad < bd ? -1 : 0;
            }
            return a.year > b.year ? -1 : 1;
          });

          this.currentDegree = user?.degrees?.[0] ?? { dept: '', year: '' };

          let tree;
          if (user?.degrees?.[0]) {
            // FIX: depts -> degrees
            tree = await this.loadTree(user.degrees[0].dept, user.degrees[0].year);
          } else {
            tree = { hours: 0, name: "", courses: { core: {}, elective: {}, other: {} } };
          }

          user = this.updateUserCourseInfo(user, tree);
          return user;
        },


        async changeTree(user) {
          let tree = await this.loadTree(this.currentDegree.dept, this.currentDegree.year);
          user = this.updateUserCourseInfo(user, tree);
          this.user = user;
        },

        updateUserCourseInfo(user, tree) {
          user = processUserData(user, tree); 
          return user;
        },

      }
    })
    gen_report_button.click(function () {
      let modal = $('#canvas-individual-report-vue');
      // APP.refreshHSEnrollmentTerms();
      $.post("https://tracking.bridgetools.dev/api/hit", {
        "tool": "reports-individual_page",
        "canvasId": ENV.current_user_id
      });
      modal.show();
    });
  }
  
  

  try {
    console.log(SOURCE_URL);
    await $.put("https://reports.bridgetools.dev/gen_uuid?requester_id=" + ENV.current_user_id);
    //styling
    loadCSS("https://reports.bridgetools.dev/style/main.css");
    loadCSS("https://reports.bridgetools.dev/department_report/style/main.css");
    //libraries
    await $.getScript("https://reports.bridgetools.dev/components/icons/people.js");
    await $.getScript("https://d3js.org/d3.v6.min.js");
    await $.getScript("https://cdnjs.cloudflare.com/ajax/libs/print-js/1.5.0/print.js");
    //icons
    await $.getScript("https://reports.bridgetools.dev/components/icons/alert.js");
    await $.getScript("https://reports.bridgetools.dev/components/icons/distance-approved.js");
    //components
    await $.getScript("https://reports.bridgetools.dev/department_report/components/menuStatus.js");
    await $.getScript("https://reports.bridgetools.dev/department_report/components/menuInfo.js");
    await $.getScript("https://reports.bridgetools.dev/department_report/components/menuFilters.js");
    await $.getScript("https://reports.bridgetools.dev/department_report/components/menuSettings.js");
    await $.getScript(SOURCE_URL + "/custom_features/reports/individual_page/components/courseRowInd.js");
    await $.getScript(SOURCE_URL + "/custom_features/reports/individual_page/components/courseProgressBarInd.js");
    await $.getScript(SOURCE_URL + "/custom_features/reports/individual_page/components/indHeaderCredits.js");
    await $.getScript(SOURCE_URL + "/custom_features/reports/individual_page/components/showStudentIndCredits.js");
    await $.getScript(SOURCE_URL + "/custom_features/reports/individual_page/components/showStudentHours.js");
    await $.getScript(SOURCE_URL + '/custom_features/reports/individual_page/showStudentGrades.js');
    await $.getScript("https://reports.bridgetools.dev/department_report/graphs.js");
    await $.getScript(SOURCE_URL + '/custom_features/reports/individual_page/gradesBetweenDates.js');
    postLoad();
  } catch (err) {
    console.log(err);
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
})();