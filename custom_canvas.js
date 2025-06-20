/*
  FOR TESTING: url param for disabling custom js and css
  ?global_includes=0
*/
// https://btech.instructure.com/accounts/3/theme_editor

var ISDIDS= [
  1893418, // Josh 
  1638854, // Mason
  1869288, // Alan
  2048150, // Tiffany
  2074560, // Ryan
  2116084, // Mikaela
  2118711, // Colton
  2147128, // Katie
  2159901, // Celine
  2158921, // Erin
  1547292, // Leann (Student Servies)
  451607,  // Sean (Testing Center)
  451622,  // Karen (Testing Center)
  1842412, // Codi (Testing Center)
  2162497, // Spencer
  2162340, // Cooper
  2188338, // Lindsey 
  2200750, // Lara 
  1575318, // Hannah
  2210696, // Logan
];

function getCSSVar(cssvar) {
    var r = document.querySelector(':root');
    var rs = getComputedStyle(r);
    let val = rs.getPropertyValue(cssvar)
    return val;
}

// Create a function for setting a variable value
function setCSSVar(cssvar, val) {
    var r = document.querySelector(':root');
    r.style.setProperty(cssvar, val);
    getCSSVar(cssvar);
}


let CURRENT_COURSE_ID = null;
var rCheckInCourse = /^\/courses\/([0-9]+)/;
if (rCheckInCourse.test(window.location.pathname)) {
  CURRENT_COURSE_ID = parseInt(window.location.pathname.match(rCheckInCourse)[1]);
}
var CURRENT_DEPARTMENT_ID = null;
var IS_BLUEPRINT = null;
var IS_TEACHER = null;
var IS_ME = false;
var IS_ISD = false;
var COURSE_HOURS;

//Should start experimenting with branching in github
var SOURCE_URL = 'https://bridgetools.dev/canvas'
if (ENV.current_user_roles !== null) {
  IS_TEACHER = (ENV.current_user_roles.includes("teacher") || ENV.current_user_roles.includes("admin"));
}

function getCourseCodeFromEnv() {
  let longName = ENV?.COURSE?.long_name ?? '';
  // Regular expression breakdown:
  // - /-\s*   : Matches a dash followed by any whitespace
  // - ([A-Za-z]{4}\s\d{4}) : Captures exactly 4 letters, a space, and 4 digits (the course code)
  // - $ : Ensures the match happens at the end of the string
  var courseCodeRegex = /-\s*([A-Za-z]{4}\s\d{4})$/;

  var match = longName.match(courseCodeRegex);
  if(match) {
    var courseCode = match[1]; // Captured course code, e.g., "ATTE 1010"
    return courseCode;
  } else {
    return undefined;
  }
}

var FEATURES = {};
var IMPORTED_FEATURE = {};

var MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
(async function() {
  if (window.self === window.top) { //Make sure this is only run on main page, and not every single iframe on the page. For example, Kaltura videos all load in a Canvas iframe
    if (/^\/courses\/[0-9]+(\/modules)?$/.test(window.location.pathname)) {
      let COURSE_CODE = getCourseCodeFromEnv();
      let DEPT_CODE = COURSE_CODE.substring(0, 4);
      let imageUrl = `https://bridgetools.dev/canvas/media/course-banners/${DEPT_CODE}.png`;

      let moduleModal = $(".header-bar");
      let moduleHeader = $("<div></div>").addClass("custom-course-header");
      moduleModal.after(moduleHeader);

      moduleHeader.html(`
        <div class="course-banner-container">
          <div class="course-banner-text">
            <div class="course-banner-title"><strong>${ENV.current_context.name}</strong></div>
          </div>
          <div class="course-banner-image">
            <div class="course-banner-skew"></div>
            <img src="${imageUrl}" onerror="this.style.display='none'" alt="" />
          </div>
        </div>
      `);

      // Inject styling
      const style = document.createElement("style");
      style.innerHTML = `
        .course-banner-container {
          max-width: 1000px;
          height: 150px;
          width: 100%;
          margin: auto;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .course-banner-text {
          flex-shrink: 0;
          min-width: 40%;
          background: #f5f5f5;
          height: 100%;
          display: flex;
          align-items: center;
          z-index: 2;
        }

        .course-banner-title {
          margin-left: calc((150px - 2rem) / 2);
          font-size: 2rem;
          line-height: 2rem;
          max-width: 350px;
          color: #B20B0F;
          font-family: sans-serif;
        }

        .course-banner-image {
          flex-grow: 1;
          position: relative;
          height: 100%;
        }

        .course-banner-skew {
          position: absolute;
          left: -50px;
          top: 0;
          width: 100px;
          height: 100%;
          background: #f5f5f5;
          transform: skewX(-20deg);
          z-index: 1;
        }

        .course-banner-image img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
        }

        /* Mobile styling */
        @media (max-width: 600px) {
          .course-banner-container {
            flex-direction: column;
            height: auto;
          }

          .course-banner-text {
            min-width: 100%;
            height: auto;
            justify-content: center;
            padding: 1rem 0;
          }

          .course-banner-image {
            width: 100%;
            height: 150px;
          }

          .course-banner-title {
            margin-left: 0;
            font-size: 1.5rem;
            text-align: center;
          }

          .course-banner-skew {
            display: none;
          }
        }
      `;
      document.head.appendChild(style);
    }
 
    let currentUser = parseInt(ENV.current_user.id);
    IS_ME = (currentUser === 1893418);
    IS_ISD = (ISDIDS.includes(currentUser));

    await $.getScript("https://bridgetools.dev/canvas/scripts.js");
    await $.getScript("https://reports.bridgetools.dev/scripts.js");
    feature("welcome_banner", {}, /^\/$/);

    feature('modules/enrollment_dates_student_external', {}, /^\/courses\/[0-9]+(\/modules){0,1}$/);
    feature("login_page", {}, /^\/login/);
    // feature("editor_toolbar/manage-settings", {}, /^\/btech-toolbar/);
    // if (IS_ME) feature("editor_toolbar/main", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)\/(.+?)\/edit/);
    feature("page_formatting/content_image_zoom", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)\/(?!.+?\/edit$)(.+?)/);
    feature("img-zoom", {}, /users/);

    //FEATURES THAT DON'T NEED ALL THE EXTRA STUFF LIKE HOURS AND DEPT DATA AND VUE
    featureISD('copy_to_next_year', {}, /^\/accounts\/[0-9]+$/);
    // dashboard level reports that need vue
    $.getScript("https://cdn.jsdelivr.net/npm/vue@2.6.12").done(function () {
      if (IS_TEACHER) feature("dashboard/studentsNearCompletion", {}, /^\/$/);
      if (IS_TEACHER) feature("reports/grades_page/report", {}, /^\/$/);
    });
    if (rCheckInCourse.test(window.location.pathname)) {
      //I'm putting concluding students in here as well vvv
      feature('modules/enrollment_dates_teacher', {}, /^\/courses\/[0-9]+\/users\/[0-9]+$/);
      // feature("external_assignments_fullscreen", {}, /^\/courses\/[0-9]+\/(assignments)/);
      feature("kaltura/showInfo", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
      if (IS_TEACHER) {
        feature('modules/module_weight');
        feature('quizzes/show_analytics', {}, /^\/courses\/[0-9]+\/quizzes\/[0-9]+/);
        feature('quizzes/printing_accessibility', {}, /^\/courses\/[0-9]+\/quizzes\/[0-9]+\/take/);
        feature("modules/show_undelete", {}, /^\/courses\/[0-9]+(\/modules){0,1}$/);
        feature("sections/conclude_all", {}, /^\/courses\/[0-9]+\/sections\/[0-9]+/);
        featureISD('transfer_navigation', {}, /^\/courses\/[0-9]+\/settings/);
      } else {
        // feature("check_linked_item_completed", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
      }
    }

    feature('files/usage', {}, /^\/courses\/[0-9]+\/files/);

    //TOOLBAR FEATURES
    await $.getScript("https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js");
    await feature("page_formatting/tinymce_font_size", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)\/(.+?)\/edit/);
    await feature("editor_toolbar/toolbar", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
    feature("editor_toolbar/basics", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)\/(.+?)\/edit/);
    feature('page_formatting/dropdown_from_table', {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
    feature('page_formatting/tabs_from_table', {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
    feature('page_formatting/expandable_from_table', {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
    feature('page_formatting/google_sheets_table', {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
    feature('page_formatting/table_from_page', {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
    feature("page_formatting/image_map", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
    feature("page_formatting/image_formatting", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
    feature("editor_toolbar/images", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
    feature("editor_toolbar/tables", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
    feature("editor_toolbar/headers", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
    // feature("page_formatting/sidebar_comments", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
    feature("page_formatting/print_rubric", {}, /^\/courses\/[0-9]+\/(assignments)/);

    //OTHER FEATURES
    $.getScript("https://cdn.jsdelivr.net/npm/vue@2.6.12").done(function () {
      featureISD('hs_section_adder', {}, /^\/accounts\/[0-9]+$/);
      // featureISD("editor_toolbar/sidebar", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)\/(.+?)\/edit/);
      // featureISD("course_reviewer/sidebar", {}, /^\/courses\/[0-9]+/);
      featureISD("course_reviewer/assignment_score", {}, /^\/courses\/[0-9]+\/assignments\/[0-9]+/);
      featureISD("course_reviewer/quiz_score", {}, /^\/courses\/[0-9]+\/quizzes\/[0-9]+/);
      featureISD("course_reviewer/discussion_score", {}, /^\/courses\/[0-9]+\/discussion_topics\/[0-9]+/);
      featureISD("course_reviewer/page_score", {}, /^\/courses\/[0-9]+\/pages\/.+/);
      $.getScript(SOURCE_URL + "/course_data/course_hours.js").done(() => {
        //GENERAL FEATURES
        //feature("reports/dashboard/banner-report", {}, /^\/$/);
        if (!IS_TEACHER) {
          feature("reports/individual_page/report", {}, [
            /^\/$/,
            /^\/courses\/[0-9]+\/grades$/,
            /^\/courses\/[0-9]+\/grades\/[0-9]+$/
          ]);
        }
        if (IS_TEACHER) {
          feature("reports/grades_page/report", {}, /^\/courses\/[0-9]+\/gradebook$/);
          feature("hs/enroll", {}, /^\/accounts\/[0-9]+\/enrollhs$/);
          feature("reports/individual_page/report", {}, [
            /^\/courses\/[0-9]+\/users\/[0-9]+$/,
            /^\/accounts\/[0-9]+\/users\/[0-9]+$/,
            /^\/users\/[0-9]+$/,
            /^\/courses\/[0-9]+\/grades\/[0-9]+$/
          ]);
        }
        feature("password_reset", {}, [
          /^\/courses\/[0-9]+\/users\/[0-9]+$/,
          /^\/accounts\/[0-9]+\/users\/[0-9]+$/,
          /^\/users\/[0-9]+$/
        ]);
        let rCheckInDepartment = /^\/accounts\/([0-9]+)/;
        if (rCheckInDepartment.test(window.location.pathname)) {
          CURRENT_DEPARTMENT_ID = parseInt(window.location.pathname.match(rCheckInDepartment)[1]);
        }
        if (rCheckInCourse.test(window.location.pathname)) {
          feature("distance/approved-button", {}, /^\/courses\/[0-9]+(\/modules){0,1}$/);
          $.getScript("https://bridgetools.dev/canvas/external-libraries/d3.v7.js");
          featureISD("course_reviewer/course_score", {}, /^\/courses\/[0-9]+(\/modules){0,1}$/);
          IS_BLUEPRINT = !(ENV.BLUEPRINT_COURSES_DATA === undefined)
          $.get('/api/v1/courses/' + CURRENT_COURSE_ID, function (courseData) {
            CURRENT_DEPARTMENT_ID = courseData.account_id;
            if (CURRENT_DEPARTMENT_ID == 3827) { //NURSING
              feature('department_specific/replace_course_code_with_name', {}, /^\/courses\/[0-9]+/);
            }
            //AVAILABLE TO EVERYONE
            // $.getScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/latest/TweenMax.min.js", function() {
            //   feature('modules/enrollment_dates_student', {}, /^\/courses\/[0-9]+(\/modules){0,1}$/);
            // });
            feature("quizzes/upload_questions", {}, /\/courses\/([0-9]+)\/question_banks$/);
            feature("quizzes/duplicate_bank_item", {}, /\/courses\/([0-9]+)\/question_banks\/([0-9]+)/);
            feature('speed_grader/next_submitted_assignment', {}, /^\/courses\/([0-9]+)\/gradebook\/speed_grader/);
            feature('speed_grader/answer_key', {}, /^\/courses\/([0-9]+)\/gradebook\/speed_grader/);
            feature('speed_grader/assignment_page_link', {}, /^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/)
            feature("rubrics/sortable", {}, [/\/rubrics/, /\/assignments\//]);
            feature("calendar/signup", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
            feature("highlight_comments_same_date", {}, [/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/, /^\/courses\/[0-9]+\/gradebook\/speed_grader/]);
            if (IS_BLUEPRINT) feature("page_formatting/prep_parts_list_for_sharing", {}, /^\/courses\/[0-9]+\/pages\/parts-list-master/);
            if (IS_BLUEPRINT) feature('blueprint_association_links');
            feature('modules/convert_to_page');
            feature("report_broken_content", /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
            //COURSE SPECIFIC FEATURES
            //DEPARTMENT SPECIFIC IMPORTS
            if (IS_TEACHER) {
              feature("speed_grader/split_screen", {}, /^\/courses\/[0-9]+\/gradebook\/speed_grader/);
            }
            feature("grades_page/highlighted_grades_page_items", {}, /^\/courses\/[0-9]+\/grades\/[0-9]+/);
            feature("grades_page/attempts", {}, /^\/courses\/[0-9]+\/grades\/[0-9]+/);

            if (CURRENT_DEPARTMENT_ID == 4218) { // DATA ANALYTICS
              externalFeature("https://cdn.datacamp.com/datacamp-light-latest.min.js", /^\/courses\/([0-9]+)\/(pages|assignments|quizzes|discussion_topics)\/[0-9]+(\?|$)/); //really just available to data analytics
              feature("people_page/sync_start_dates_with_section", {}, /^\/courses\/[0-9]+\/course_pacing/);
              feature("department_specific/data_analytics_feedback_report", {}, /^\/courses\/[0-9]+(\/modules){0,1}$/);
            }
            if (CURRENT_DEPARTMENT_ID === 3824) { // DENTAL
              // feature("grades_page/highlighted_grades_page_items_dental", {}, /^\/courses\/[0-9]+\/grades\/[0-9]+/);
              feature("rubrics/attempts_data", {}, [/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/, /^\/courses\/[0-9]+\/gradebook\/speed_grader/]);
              feature("rubrics/gen_comment", {}, [/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/, /^\/courses\/[0-9]+\/gradebook\/speed_grader/]);
              //This is currently disabled because it was decided it might be more confusing for students to see a grade that was only part of their final grade.
            }
            if (CURRENT_DEPARTMENT_ID === 3833) { //business
              feature("department_specific/business_hs");
              feature("previous-enrollment-data/previous_enrollment_period_grades");
            }
            // if (CURRENT_DEPARTMENT_ID === 3819 || CURRENT_DEPARTMENT_ID === 3832) { // AMAR && ELEC
            //   feature("modules/points_to_hours_header");
            //   // if (IS_ME) feature("speed_grader/resize_submitted_video", {}, /^\/courses\/[0-9]+\/gradebook\/speed_grader/);
            //   // feature("department_specific/amar_elec_add_module_items"); //don't think this is used anymore
            // }
            if (CURRENT_DEPARTMENT_ID === 3820) { //Web & Mobile
              externalFeature("https://static.codepen.io/assets/embed/ei.js", /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
            }
          });
        }

        if (ENV?.current_user_roles?.includes('root_admin')) {
          feature("remove_former_employees", {}, /^\/accounts\/3\/users\/[0-9]+/)
        }

        feature("quizzes/question_bank_sorter", {}, /^\/courses\/[0-9]+\/quizzes\/[0-9]+\/edit/);
        feature("sort_assignment_groups", {}, /assignments$/)
        // feature("rubrics/add_criteria_from_csv", {}, new RegExp('/(rubrics|assignments\/)'));
        // feature("rubrics/create_rubric_from_csv", {}, new RegExp('^/(course|account)s/([0-9]+)/rubrics$'));
        //ISD ONLY
        // featureISD("modules/show_hours", {}, /^\/courses\/[0-9]+(\/modules){0,1}$/);
        featureISD("modules/delete_module_items", {}, /^\/courses\/[0-9]+(\/modules){0,1}$/);

        //Don't turn on flags unless figure out a way to not display the flag tool by default.
        ////Ran into issue where Vue wasn't loading properly so nobody could do anything.
        //if (IS_ISD) externalFeature('https://flags.bridgetools.dev/main.js');

        //this should be working now
        feature('reports/accreditation-2', {}, /^\/courses\/([0-9]+)\/external_tools\/([0-9]+)/);
        // feature('reports/accreditation', {}, /^\/courses\/([0-9]+)\/external_tools\/([0-9]+)/);

        // if (IS_ME) $.getScript("https://bridgetools.dev/collaborator/import.js");
        // featureISD("cleoducktra/main", {}, /^/);
        // if (IS_ME) featureISD("cleoducktra/quiz-questions", {}, /^\/courses\/[0-9]+\/quizzes\/[0-9]+\/edit/);
      });
    });
  }
})();