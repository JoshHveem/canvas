IMPORTED_FEATURE = {};
//THIS IS UNTESTED AND NOT INCLUDED WITH ANYTHING. CURRENTLY USING OLD import_pilot FILE.
//PUBLISH THIS BUT MAYBE MAKE A NEW .js FILE
function setPendingIcons() {
  $('.item-group-condensed').each(function(index, value) {
      $(value).find('div.ig-header-admin').append('<span title="checking for completion..." class="ig-type-icon"><i class="icon icon-question"></i></span>');
      let quizzes = $(value).find('li.quiz');
      quizzes.each(function(index, value) {
          $(value).find('.module-item-status-icon').html('<span title="checking for completion..." class="ig-type-icon"><i class="icon icon-question"></i></span>');
      });
      let assignments = $(value).find('li.assignment');
      assignments.each(function(index, value) {
          $(value).find('.module-item-status-icon').html('<span title="checking for completion..." class="ig-type-icon"><i class="icon icon-question"></i></span>');
      });
  });
}

function setAssignmentUnfinished(value, next_page) {
  let span = $(value).find('.module-item-status-icon span.ig-type-icon');
  if (span.find('i.icon-Solid.icon-publish').length === 0) {
      if (next_page === "") {
          span.prop('title', "item incomplete");
          span.html('<i style="color:#000;" class="icon icon-minimize"></i>');
      }
      return true;
  }
  return false;
}

function setUnpublishedItems(next_page) {
  $('.item-group-condensed').each(function(index, value) {
      let checkFinished = true;
      let quizzes = $(value).find('li.quiz');
      quizzes.each(function(index, value) {
          if (setAssignmentUnfinished(value, next_page)) {
              checkFinished = false;
          }
      });
      let assignments = $(value).find('li.assignment');
      assignments.each(function(index, value) {
          if (setAssignmentUnfinished(value, next_page)) {
              checkFinished = false;
          }
      });

      let span = $(value).find('div.ig-header-admin span.ig-type-icon');
      if (checkFinished) {
          span.html('<i style="color:#E71919;" class="icon-Solid icon-publish"></i>');
          span.prop('title', "module complete");
      } else {
          if (next_page === "") {
              span.html('<i style="color:#000;" class="icon icon-minimize"></i>');
              span.prop('title', "module incomplete");
          }
      }
  });
}

async function getSubmittedAssignmentsNew(url="") {
  let userId = ENV.current_user.id;
  let courseId = ENV.COURSE_ID;
  if (url == "") {
      url = "/api/v1/courses/"+courseId+"/students/submissions?include[]=assignment&student_ids[]="+userId+"&per_page=50";
  }
  //let url = "/api/v1/users/"+userId+"/courses/"+courseId+"/assignments?include[]=submission&page="+page+"&per_page=50";
  $.ajax({
      type: "GET",
      url: url,
      success: function(data, status, xhr) {
          let links = xhr.getResponseHeader("link").split(",");
          let next_page = "";
          let current_page = "";
          for (let l in links) {
              let link_data = links[l].split(";");
              let link = link_data[0];
              if (link_data[1].indexOf('current') > -1) {
                  current_page = link.replace("<", "").replace(">", "");
              }
              if (link_data[1].indexOf('next') > -1) {
                  next_page = link.replace("<", "").replace(">", "");
              }
          }
          if (next_page === current_page) {
              next_page = "";
          }
          for (let a = 0; a < data.length; a++) {
              let assignment = data[a].assignment;
              $('div.ig-row').each(function(index, value) {
                  let infoEl = $(value).find('div.ig-info');
                  let aEl = infoEl.find('a');
                  if (aEl.length > 0) {
                      let name = aEl.html().trim();
                      let typeEl = infoEl.find('span.type');
                      let type = typeEl.html();
                      if (name === assignment.name) {
                          //this makes it green, we could play around with potentially other colors, but it's a little trickier than just adding color to the icon and I haven't figured it out yet.
                          let span = $(value).find('.module-item-status-icon span.ig-type-icon');
                          span.html('<i style="color:#E71919;" class="icon-Solid icon-publish"></i>');
                          span.prop('title', "item complete");
                      }
                  }
              });
          }
          if (next_page !== "") {
              getSubmittedAssignmentsNew(next_page);
          }
          setUnpublishedItems(next_page);
      }
  });
}

if (/^\/courses\/[0-9]+\/modules$/.test(window.location.pathname)) {
  if (ENV.course_id === "489058") {
      async function formatSubmittedAssignments() {
          let isStudent = ENV.IS_STUDENT;
          if (isStudent) {
              $(".collapse_module_link").hide();
              $(".expand_module_link").show();
              $(".content").hide();
              setPendingIcons();
              let time_start;
              time_start = Date.now();
              getSubmittedAssignmentsNew().then(() => {
                  let _t = Date.now() - time_start;
              });
          }
      }
      formatSubmittedAssignments();
  }
}



//*///END toggle submitted assignments