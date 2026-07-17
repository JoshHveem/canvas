//Grades will NOT import if:
////Student has not accepted their invite to the course
////The section names do not match exactly

//Need to add a button to run this on the alignment page
function alignAssignments(reg="") {
  let noMatchList = [];
  $(".assignment_section table tr").each(function() {
    let titleOriginal = $(this).find("th.title").text()
    let title = titleOriginal.replace(reg, "");
    let select = $(this).find("select");
    let options = select.find("option");
    let found = false;
    options.each(function() {
        let option = $(this);
        let val = option.attr("value");
        let name = option.text().replace(reg, "");
        if (name == title) {
            select.val(val).change();
            found = true;
        }
    });
    if (!found) {
      select.val("ignore").change();
      noMatchList.push(titleOriginal);
    }
  });
}
alignAssignments(/Module [0-9]+\.[0-9]+:\s*/);
