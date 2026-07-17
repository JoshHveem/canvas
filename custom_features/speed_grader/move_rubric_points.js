IMPORTED_FEATURE = {};
if (/^\/courses\/[0-9]+\/gradebook\/speed_grader/.test(window.location.pathname)) {
  //Move points below Rubric
  let container = $("#grading");
  let points = $("#grade_container");
  container.append(points);
}