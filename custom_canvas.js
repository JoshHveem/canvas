//THIS MUST BE UPDATED IN THE THEMES SECTION OF CANVAS
//check for custom theme info, will probably only run on pages, quizzes, and assignments, but who knows
//Might be worth moving all of this into the custom-settings page instead of an individual div on each page, then wait to load any of the features involving this custom settings until after that page has loaded
var themeParent = $('#btech-theme-parent');
if (themeParent.length === 1) {
  let header = themeParent.find('.btech-theme-header');
  if (header.length === 1) {
    document.documentElement.style.setProperty('--btech-theme-header-background-color', header.css('background-color'));
    document.documentElement.style.setProperty('--btech-theme-header-color', header.css('color'));
  }

  let headerHover = themeParent.find('.btech-theme-header-hover');
  if (headerHover.length === 1) {
    document.documentElement.style.setProperty('--btech-theme-header-hover-background-color', headerHover.css('background-color'));
    document.documentElement.style.setProperty('--btech-theme-header-hover-color', headerHover.css('color'));
  }
}

var BETA = false;
if (window.location.href.includes("btech.beta.instructure.com")) {
  BETA = true;
} else {
  BETA = false;
}
var CDDIDS = [
  1893418, //Josh 
  1864953, //Danni
  1891741, //Katie
  1638854, //Mason
  1922029, //Makenzie
  1807337, //Jon
  1869288, //Alan
  2000557, //Charlotte
];

var CURRENT_COURSE_ID = null;
var CURRENT_DEPARTMENT_ID = null;
var CURRENT_COURSE_HOURS = null;
var IS_BLUEPRINT = null;
var IS_TEACHER = null;
var IS_ME = false;
var COURSE_HOURS, COURSE_LIST;
//Now, if testing in beta, will pull from beta instance of all these tools
//Should start experimenting with branching in github
var SOURCE_URL = 'https://jhveem.xyz/canvas'
if (BETA) {
  SOURCE_URL = 'https://jhveem.xyz/canvas-beta'
}
if (ENV.current_user_roles !== null) {
  IS_TEACHER = (ENV.current_user_roles.includes("teacher") || ENV.current_user_roles.includes("admin"));
}

var FEATURES = {};
var IMPORTED_FEATURE = {};

var MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

async function delay(ms) {
  // return await for better async stack trace support in case of errors.
  return await new Promise(resolve => setTimeout(resolve, ms));
}

async function getElement(selectorText, iframe = "") {
  let element;
  if (iframe === "") {
    element = $(selectorText);
  } else {
    element = $(iframe).contents().find(selectorText);
  }
  if (element.length > 0 && element.html().trim() !== "") {
    return element;
  } else {
    await delay(250);
    return getElement(selectorText, iframe);
  }
}

function genId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function add_javascript_library(url) {
  var s = document.createElement("script");
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('src', url);
  document.getElementsByTagName('head')[0].appendChild(s);
}

function add_css_library(url) {
  var s = document.createElement("link");
  s.setAttribute('rel', 'stylesheet');
  s.setAttribute('href', url);
  document.getElementsByTagName('head')[0].appendChild(s);
}

function toPrecision(number, numberAfterDecimal) {
  return parseFloat(number.toFixed(numberAfterDecimal));
}

function feature(f, data = {}, regex = "") {
  //feature is the name of the feature file without .js, if it's in a subfolder, include that too
  //potentially flesh out these files so they're objects with methods. Then call an init function on load with the data variable having all the custom variables needed for each department
  //if you go this route, you could save each feature in a dict with the string provided here as the key and then in the feature itself, store itself in the dict
  //reset IMPORTED_FEATURE;
  let check = false;
  if (regex === "") {
    check = true;
  } else {
    if (!Array.isArray(regex)) regex = [regex];
    for (var i = 0; i < regex.length; i++) {
      let reg = regex[i];
      if (reg.test(window.location.pathname)) {
        check = true;
      }
    }
  }
  if (check) {
    $.getScript(SOURCE_URL + "/custom_features/" + f + ".js").done(function () {
      if (!$.isEmptyObject(IMPORTED_FEATURE)) {
        if (!(f in FEATURES)) {
          FEATURES[f] = IMPORTED_FEATURE;
        }
      }
      if (f in FEATURES) {
        let feature = FEATURES[f];
        //make sure it hasn't already been called to avoid messing up the page
        if (feature.initiated === false) {
          feature.initiated = true;
          feature._init(data);
        }
      }
    });
  }
}

function externalFeature(url, regex) {
  let check = false;
  if (regex === "") {
    check = true;
  } else {
    if (!Array.isArray(regex)) regex = [regex];
    for (var i = 0; i < regex.length; i++) {
      let reg = regex[i];
      if (reg.test(window.location.pathname)) {
        check = true;
      }
    }
  }
  if (check) {
    $.getScript(url);
  }
}

function featureBeta(f, data = {}, regex = "") {
  if (BETA) feature(f, data, regex);
}

//USED TO TEST IN A SINGLE COURSE
function featurePilot(f, courseId = 0, pilotCourseIds = 0, data = {}, regex = "") {
  if (courseId !== 0) { //Make sure you didn't forget to put a course Id in
    //set individual pilotCourseId to array
    if (!Array.isArray(pilotCourseIds)) pilotCourseIds = [pilotCourseIds];
    //check if current course is in array
    if (pilotCourseIds.includes(courseId)) feature(f, data, regex);
  }
}

function featureCDD(f, data = {}, regex) {
  let userId = parseInt(ENV.current_user.id);
  if (CDDIDS.includes(userId)) feature(f, data, regex);
}

function addToModuleItemMenu(name, description, func, type = "all") {
  let courseId = ENV.COURSE_ID;
  $("div.context_module").each(function () {
    let module = $(this);
    let moduleId = $(this).attr("data-module-id");
    module.find("li.context_module_item").each(function () {
      let item = $(this);
      let itemType = item.find(".type_icon").attr("title");
      if (itemType === type || type === "all") {
        let menu = item.find("ul.al-options");
        let liTag = $("<li></li>");
        let aTag = $(`<a href="" title="` + description + `"><i class="icon-forward"></i>` + name + `</a>`);
        liTag.append(aTag);
        menu.append(liTag);
        aTag.click(function () {
          func(courseId, moduleId, item)
        });
      }
    });
  });
}

function addToModuleMenu(name, description, func, icon = "icon-plus") {
  let courseId = ENV.COURSE_ID;
  $("div.context_module").each(function () {
    let module = $(this);
    let moduleId = $(this).attr("data-module-id");
    module.find("div.ig-header-admin").each(function () {
      let item = $(this);
      let rTitle = /Module ([0-9]+)/;
      let title = item.find('.name').text();
      let titleMatch = title.match(rTitle);
      if (titleMatch !== null) {
        let modTitle = "Module " + titleMatch[1];
        let menu = item.find("ul.al-options");
        let liTag = $("<li></li>");
        let aTag = $(`<a href="" title="` + description + `"><i class="` + icon + `"></i>` + name + `</a>`);
        liTag.append(aTag);
        menu.append(liTag);
        aTag.click(function () {
          func(courseId, moduleId, item, modTitle)
        });
      }
    });
  });
}

async function canvasGet(url, reqData = {}, page = "1", resData = []) {
  let nextPage = "";
  reqData.per_page = 100;
  reqData.page = page;
  await $.get(url, reqData, function (data, status, xhr) {
    //add assignments to the list
    resData = resData.concat(data);
    //see if there's another page to get
    let rNext = /<([^>]*)>; rel="next"/;
    let header = xhr.getResponseHeader("Link");
    if (header !== null) {
      let nextMatch = header.match(rNext);
      if (nextMatch !== null) {
        let next = nextMatch[1];
        nextPage = next.match(/page=(.*?)&/)[1];
      }
    }
  });
  if (nextPage !== "") {
    return await canvasGet(url, reqData, nextPage, resData);
  }
  return resData;
}

$.put = function (url, data) {
  return $.ajax({
    url: url,
    data: data,
    type: 'PUT'
  });
}

$.delete = function (url, data) {
  return $.ajax({
    url: url,
    data: data,
    type: 'DELETE'
  });
}

if (window.self === window.top) { //Make sure this is only run on main page, and not every single iframe on the page. For example, Kaltura videos all load in a Canvas iframe
  let currentUser = parseInt(ENV.current_user.id);
  IS_ME = (currentUser === 1893418);
  const IS_CDD = (CDDIDS.includes(currentUser))
  /*
  https://btech.instructure.com/accounts/3/theme_editor
  */
  feature("login_page", {}, /^\/login/);

  let rCheckInCourse = /^\/courses\/([0-9]+)/;
  //FEATURES THAT DON'T NEED ALL THE EXTRA STUFF LIKE HOURS AND DEPT DATA
  if (rCheckInCourse.test(window.location.pathname)) {
    feature('modules/course_features');
  }
  add_javascript_library(SOURCE_URL + "/custom_canvas_import.js");
  $.getScript("https://cdn.jsdelivr.net/npm/vue").done(function () {
    $.getScript(SOURCE_URL + "/custom_features/editor_toolbar/toolbar.js").done(() => {
      $.getScript(SOURCE_URL + "/course_data/course_list.js").done(() => {
        $.getScript(SOURCE_URL + "/course_data/course_hours.js").done(() => {
          //GENERAL FEATURES
          if (!IS_TEACHER) {
            feature("reports/individual_page/report", {}, [/^\/$/]);
          }
          if (IS_TEACHER) {
            feature("reports/grades_page/report", {}, /^\/courses\/[0-9]+\/gradebook$/);
            feature("hs/enroll", {}, /^\/accounts\/[0-9]+\/enrollhs$/);
            feature("reports/individual_page/report", {}, [
              /^\/courses\/[0-9]+\/users\/[0-9]+$/,
              /^\/accounts\/[0-9]+\/users\/[0-9]+$/,
              /^\/users\/[0-9]+$/,
              /^\/courses\/[0-9]+\/grades\/[0-9]+/
            ]);
          }
          let rCheckInDepartment = /^\/accounts\/([0-9]+)/;
          if (rCheckInDepartment.test(window.location.pathname)) {
            console.log(window.location.pathname);
            CURRENT_DEPARTMENT_ID = parseInt(window.location.pathname.match(rCheckInDepartment)[1]);
          }
          let rCheckInCourse = /^\/courses\/([0-9]+)/;
          if (rCheckInCourse.test(window.location.pathname)) {
            IS_BLUEPRINT = !(ENV.BLUEPRINT_COURSES_DATA === undefined)
            CURRENT_COURSE_ID = parseInt(window.location.pathname.match(rCheckInCourse)[1]);
            let courseData = null;
            $.get('/api/v1/courses/' + CURRENT_COURSE_ID, function (data) {
              courseData = data;
              let year = null;
              let dateData = courseData.start_at;

              if (dateData !== null) {

                let yearData = dateData.trim().match(/^(2[0-9]{3})-([0-9]+)/);
                if (yearData != null) {
                  year = parseInt(yearData[1]);
                  month = parseInt(yearData[2]);
                  if (month < 6) {
                    year -= 1;
                  }
                  let crsCode = courseData.course_code;
                  CURRENT_COURSE_HOURS = COURSE_HOURS[year][crsCode];
                }
              }
            })

            //AVAILABLE TO EVERYONE
            feature("editor_toolbar/basics", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)\/(.+?)\/edit/);
            feature("editor_toolbar/syllabi", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
            feature('page_formatting/dropdown_from_table', {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
            feature('page_formatting/tabs_from_table', {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
            feature('page_formatting/expandable_from_table', {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
            feature('page_formatting/google_sheets_table', {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
            feature('page_formatting/table_from_page', {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
            feature("page_formatting/tinymce_font_size", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)\/(.+?)\/edit/);
            feature("page_formatting/image_map", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
            feature("page_formatting/image_formatting", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
            feature("quizzes/duplicate_bank_item", {}, /\/courses\/([0-9]+)\/question_banks\/([0-9]+)/);
            feature('speed_grader/next_submitted_assignment', {}, /^\/courses\/([0-9]+)\/gradebook\/speed_grader/);
            feature("rubrics/sortable", {}, [/\/rubrics/, /\/assignments\//]);
            feature("survey/survey", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
            if (IS_BLUEPRINT) feature('blueprint_association_links');
            feature('modules/convert_to_page');

            featureBeta('rubrics/gen_comment');
            // feature('instructional/glossary');
            let courseId = CURRENT_COURSE_ID;
            //COURSE SPECIFIC FEATURES
            featurePilot("rubrics/gen_comment", courseId, [489089]); //Micro Controllers I
            featurePilot("previous-enrollment-data/previous_enrollment_period_grades", courseId, [511596]); //Business High School Summer
            //DEPARTMENT SPECIFIC IMPORTS
            let departmentId = 0;
            //DETERMINE CURRENT DEPARTMENT FROM DEPARTMENT LIST
            for (let d in COURSE_LIST) {
              if (COURSE_LIST[d].includes(courseId)) {
                departmentId = parseInt(d);
                break;
              }
            }
            CURRENT_DEPARTMENT_ID = departmentId;
            if (departmentId === 3824) { // DENTAL
              console.log("DENTAL");
              feature("highlighted_grades_page_items", {}, /^\/courses\/[0-9]+\/grades\/[0-9]+/);
              feature("rubrics/attempts_data", {}, [/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/, /^\/courses\/[0-9]+\/gradebook\/speed_grader/]);
              feature("rubrics/gen_comment", {}, [/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/, /^\/courses\/[0-9]+\/gradebook\/speed_grader/]);
              feature("highlight_comments_same_date", {}, [/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/, /^\/courses\/[0-9]+\/gradebook\/speed_grader/]);
              //This is currently disabled because it was decided it might be more confusing for students to see a grade that was only part of their final grade.
              // feature("previous-enrollment-data/previous_enrollment_period_grades", {}, /^\/courses\/[0-9]+\/grades/);
              if (IS_TEACHER) {
                feature("speed_grader/split_screen", {}, /^\/courses\/[0-9]+\/gradebook\/speed_grader/);
              }
            }
            if (departmentId === 3833) { //business
              feature("department_specific/business_hs");
              feature("previous-enrollment-data/previous_enrollment_period_grades");
            }
            if (departmentId === 3819 || departmentId === 3832) { // AMAR && ELEC
              feature("modules/points_to_hours_header");
              feature("speed_grader/resize_submitted_video");
              feature("department_specific/amar_elec_add_module_items", {}, /^\/courses\/[0-9]+\/gradebook\/speed_grader/);
            }
            if (departmentId === 3847) { //meats
              feature("previous-enrollment-data/previous_enrollment_period_grades", {}, /^\/courses\/[0-9]+\/grades\/[0-9]+/);
              feature("speed_grader/split_screen", {}, /^\/courses\/[0-9]+\/gradebook\/speed_grader/);
            }
            if (departmentId === 3837) { //auto collision
              feature("speed_grader/split_screen", {}, /^\/courses\/[0-9]+\/gradebook\/speed_grader/);
              feature("rubrics/self_graded", {}, [/^\/courses\/[0-9]+\/gradebook\/speed_grader/, /courses\/([0-9]+)\/assignments\/([0-9]+)/]);
            }
            if (departmentId === 3840 || departmentId === 3839) { //media design & drafting
            }
            if (departmentId === 3841 || departmentId === 3947) { //cosmetology && master esthetics
              feature("department_specific/esthetics_cosmetology_services");
            }
            if (departmentId === 3848) { //Interior Design
            }
            if (departmentId === 3820) { //Web & Mobile
              externalFeature("https://bridgerland-web-dev.github.io/html_practice/html_practice.js", /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/)
            }
          }

          //CDD ONLY
          feature("quizzes/question_bank_sorter", {}, /^\/courses\/[0-9]+\/quizzes\/[0-9]+\/edit/);
          //featureCDD("previous-enrollment-data/previous_enrollment_period_grades");
          // featureCDD("help_tab");
          featureCDD("rubrics/add_criteria_from_csv", {}, new RegExp('/(rubrics|assignments\/)'));
          featureCDD("rubrics/create_rubric_from_csv", {}, new RegExp('^/(course|account)s/([0-9]+)/rubrics$'));
          featureCDD("editor_toolbar/images", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
          featureCDD("editor_toolbar/tables", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
          featureCDD("modules/show_hours", {}, /^\/courses\/[0-9]+(\/modules){0,1}$/);
          featureCDD("editor_toolbar/image_map", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
          // featureCDD('date_display/add_current_year_speed_grader', {}, /^\/courses\/[0-9]+\/gradebook\/speed_grader/);
          feature('date_display/add_current_year', {}, [/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/, /^\/courses\/[0-9]+\/gradebook\/speed_grader/]);
          if (IS_ME) {
            feature('reports/accredidation', {}, /^\/courses\/([0-9]+)\/external_tools\/([0-9]+)/);
          } else {
            feature('reports/accredidation', {}, /^\/courses\/([0-9]+)\/external_tools\/([0-9]+)/);
          }
          // featureCDD('department_progress');
          featureCDD('flag_for_review');

          // if (IS_ME) $.getScript("https://jhveem.xyz/collaborator/import.js");
          //featureCDD("transfer_sections", {}, /^\/courses\/[0-9]+\/users/);
          feature("welcome_banner", {}, /^\/$/);

          //Survey
          if (currentUser === 1507313) { //Lisa Balling
            feature("survey/survey", {}, /^\/courses\/[0-9]+\/(pages|assignments|quizzes|discussion_topics)/);
          }
        });
      });
    });
  });
}

//FROM https://github.com/jeresig/jquery.hotkeys
/*jslint browser: true*/
/*jslint jquery: true*/

/*
 * jQuery Hotkeys Plugin
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Based upon the plugin by Tzury Bar Yochay:
 * https://github.com/tzuryby/jquery.hotkeys
 *
 * Original idea by:
 * Binny V A, http://www.openjs.com/scripts/events/keyboard_shortcuts/
 */

/*
 * One small change is: now keys are passed by object { keys: '...' }
 * Might be useful, when you want to pass some other data to your handler
 */


/*
 * CURRENTLY IN USE
 * ctrl+shift+f : opens the create new flag modal in the flags feature
 * 
 */

(function (jQuery) {

  jQuery.hotkeys = {
    version: "0.2.0",

    specialKeys: {
      8: "backspace",
      9: "tab",
      10: "return",
      13: "return",
      16: "shift",
      17: "ctrl",
      18: "alt",
      19: "pause",
      20: "capslock",
      27: "esc",
      32: "space",
      33: "pageup",
      34: "pagedown",
      35: "end",
      36: "home",
      37: "left",
      38: "up",
      39: "right",
      40: "down",
      45: "insert",
      46: "del",
      59: ";",
      61: "=",
      96: "0",
      97: "1",
      98: "2",
      99: "3",
      100: "4",
      101: "5",
      102: "6",
      103: "7",
      104: "8",
      105: "9",
      106: "*",
      107: "+",
      109: "-",
      110: ".",
      111: "/",
      112: "f1",
      113: "f2",
      114: "f3",
      115: "f4",
      116: "f5",
      117: "f6",
      118: "f7",
      119: "f8",
      120: "f9",
      121: "f10",
      122: "f11",
      123: "f12",
      144: "numlock",
      145: "scroll",
      173: "-",
      186: ";",
      187: "=",
      188: ",",
      189: "-",
      190: ".",
      191: "/",
      192: "`",
      219: "[",
      220: "\\",
      221: "]",
      222: "'"
    },

    shiftNums: {
      "`": "~",
      "1": "!",
      "2": "@",
      "3": "#",
      "4": "$",
      "5": "%",
      "6": "^",
      "7": "&",
      "8": "*",
      "9": "(",
      "0": ")",
      "-": "_",
      "=": "+",
      ";": ": ",
      "'": "\"",
      ",": "<",
      ".": ">",
      "/": "?",
      "\\": "|"
    },

    // excludes: button, checkbox, file, hidden, image, password, radio, reset, search, submit, url
    textAcceptingInputTypes: [
      "text", "password", "number", "email", "url", "range", "date", "month", "week", "time", "datetime",
      "datetime-local", "search", "color", "tel"
    ],

    // default input types not to bind to unless bound directly
    textInputTypes: /textarea|input|select/i,

    options: {
      filterInputAcceptingElements: true,
      filterTextInputs: true,
      filterContentEditable: true
    }
  };

  function keyHandler(handleObj) {
    if (typeof handleObj.data === "string") {
      handleObj.data = {
        keys: handleObj.data
      };
    }

    // Only care when a possible input has been specified
    if (!handleObj.data || !handleObj.data.keys || typeof handleObj.data.keys !== "string") {
      return;
    }

    var origHandler = handleObj.handler,
      keys = handleObj.data.keys.toLowerCase().split(" ");

    handleObj.handler = function (event) {
      //      Don't fire in text-accepting inputs that we didn't directly bind to
      if (this !== event.target &&
        (jQuery.hotkeys.options.filterInputAcceptingElements &&
          jQuery.hotkeys.textInputTypes.test(event.target.nodeName) ||
          (jQuery.hotkeys.options.filterContentEditable && jQuery(event.target).attr('contenteditable')) ||
          (jQuery.hotkeys.options.filterTextInputs &&
            jQuery.inArray(event.target.type, jQuery.hotkeys.textAcceptingInputTypes) > -1))) {
        return;
      }

      var special = event.type !== "keypress" && jQuery.hotkeys.specialKeys[event.which],
        character = String.fromCharCode(event.which).toLowerCase(),
        modif = "",
        possible = {};

      jQuery.each(["alt", "ctrl", "shift"], function (index, specialKey) {

        if (event[specialKey + 'Key'] && special !== specialKey) {
          modif += specialKey + '+';
        }
      });

      // metaKey is triggered off ctrlKey erronously
      if (event.metaKey && !event.ctrlKey && special !== "meta") {
        modif += "meta+";
      }

      if (event.metaKey && special !== "meta" && modif.indexOf("alt+ctrl+shift+") > -1) {
        modif = modif.replace("alt+ctrl+shift+", "hyper+");
      }

      if (special) {
        possible[modif + special] = true;
      } else {
        possible[modif + character] = true;
        possible[modif + jQuery.hotkeys.shiftNums[character]] = true;

        // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
        if (modif === "shift+") {
          possible[jQuery.hotkeys.shiftNums[character]] = true;
        }
      }

      for (var i = 0, l = keys.length; i < l; i++) {
        if (possible[keys[i]]) {
          return origHandler.apply(this, arguments);
        }
      }
    };
  }

  jQuery.each(["keydown", "keyup", "keypress"], function () {
    jQuery.event.special[this] = {
      add: keyHandler
    };
  });

})(jQuery || this.jQuery || window.jQuery);