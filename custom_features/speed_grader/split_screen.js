IMPORTED_FEATURE = {};
if (/^\/courses\/[0-9]+\/gradebook\/speed_grader/.test(window.location.pathname)) {
  //Split screen 50/50
  $('div#left_side').css("width", "50%");
  $('div#right_side').css("width", "50%");
}