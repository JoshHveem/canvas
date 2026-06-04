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
  s.setAttribute('src', window.btechAssetUrl ? window.btechAssetUrl(url) : url);
  document.getElementsByTagName('head')[0].appendChild(s);
}

function add_css_library(url) {
  var s = document.createElement("link");
  s.setAttribute('rel', 'stylesheet');
  s.setAttribute('href', window.btechAssetUrl ? window.btechAssetUrl(url) : url);
  document.getElementsByTagName('head')[0].appendChild(s);
}

function toPrecision(number, numberAfterDecimal) {
  return parseFloat(number.toFixed(numberAfterDecimal));
}

async function feature(f, regex = "") {
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
    await $.getScript((window.btechAssetUrl ? window.btechAssetUrl(SOURCE_URL + "/custom_features/" + f + ".js") : SOURCE_URL + "/custom_features/" + f + ".js"));
  }
}

function externalFeature(url, regex = "") {
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

function featureISD(f, data = {}, regex) {
  let userId = parseInt(ENV.current_user.id);
  if (ISDIDS.includes(userId)) feature(f, data, regex);
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
        let liTag = $(`<li style="cursor: pointer; user-select: none;"></li>`);
        let aTag = $(`<a title="${description}"><i class="icon-forward"></i>${name}</a>`);
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
      let menu = item.find("ul.al-options");
      let liTag = $(`<li role="presentation" class="module_group_menu ui-menu-item"></li>`);
      let aTag = $(`<a title="${description}" class="menu_tray_tool_link ui-corner-all" role="menuitem"><i class="${icon}"></i>${name}</a>`);
      liTag.append(aTag);
      menu.append(liTag);
      aTag.click(function (event) {
        func(event, courseId, moduleId, item)
      });
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
