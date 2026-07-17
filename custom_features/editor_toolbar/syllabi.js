(async function () {
  IMPORTED_FEATURE = {};
  //IF the editor, add the ability to add services
  if (TOOLBAR.checkEditorPage()) {
    await TOOLBAR.checkReady();

    TOOLBAR.addButtonIcon("icon-gradebook", "Grading Scheme", async function () {
      let editor = TOOLBAR.editor;
      editor.execCommand("mceInsertContent", false, `
        <p class="btech-grading-scheme btech-hidden" style="border: 1px solid black;">This will be replaced by a table populated with the course Grading Scheme.</p>
      `);
    });

    TOOLBAR.addButtonIcon("icon-assignment", "Assignment Groups", async function () {
      let editor = TOOLBAR.editor;
      editor.execCommand("mceInsertContent", false, `
        <p class="btech-assignment-groups btech-hidden" style="border: 1px solid black;">This will be replaced by a table populated with the course Assignment Groups.</p>
      `);
    });
  }

  async function genSchemeElements() {
    let iframe = null;
    //if the student, pull their grade scheme data from their grades page, if a teacher, just use the test student page
    //Could use the grade scheme api, but it doens't tell you which is the active scheme, and it takes up to 3 calls to get that, plus the return data might have a slightly different format
    if (IS_TEACHER) {
      await $.get("/api/v1/courses/" + CURRENT_COURSE_ID + "/student_view_student").done(function (data) {
        iframe = $("<iframe style='display: none;' src='/courses/" + CURRENT_COURSE_ID + "/grades/" + data.id + "'></iframe>");
      });
    } else {
      iframe = $("<iframe style='display: none;' src='/courses/" + CURRENT_COURSE_ID + "/grades'></iframe>");
    }
    $('body').append(iframe);
    iframe.load(function () {
      let e = $(this)[0].contentWindow.ENV;
      console.log(e);
      let data = e.grading_scheme;
      $(this).remove();
      let schemeDiv = $(".btech-grading-scheme");
      if (schemeDiv.length > 0) {
        let table = $("<table></table>");
        let rows = [];
        if (data.length > 0) {
          let header = $("<tr><th style='border: 1px solid black; padding: 4px 8px;'>Rating</th><th style='border: 1px solid black; padding: 4px 8px;'>Percent</th></tr>")
          table.append(header);
          //It's possible that there can be more than one grading standard, in which case I'll have to figure out how to find the set one or current one
          //previous cell list for increasing the row span of the previously used cell if the same name
          let pCells = [];
          for (let s = 0; s < data.length; s++) {
            let line = data[s];
            let value = "";
            let row = $("<tr></tr>");
            let names = line[0].split("/");
            for (let i = 0; i < names.length; i++) {
              let name = names[i].trim();
              let cell = $("<td style='border: 1px solid black; padding: 4px 8px;' rowspan='1'>" + name + "</td>");
              if (s === 0) {
                row.append(cell);
              } else {
                //get previous cell, will be empty on first
                let pCell = pCells[i];
                //get the value of the previous cell
                let pName = $(pCell).text().trim();
                // if the previous cell is the same as this cell, just increase the rowspan of the previous cell
                //else add a new cell
                if (pName === name) {
                  let numRows = parseInt($(pCell).attr('rowspan'));
                  $(pCell).attr('rowspan', numRows + 1);
                } else {
                  pCells[i] = cell;
                  row.append(cell);
                }
              }
            }

            if (s == 0) {
              let tds = row.find("td");
              $(header.find("th")[0]).attr("colspan", names.length);
              for (let i = 0; i < tds.length; i++) {
                pCells[i] = tds[i];
              }
              value = "100% - " + (line[1] * 100) + "%";
            } else if (s === data.length - 1) { 
              value = "<" + (data[s - 1][1] * 100) + "%";
            } else {
              value = "<" + (data[s - 1][1] * 100) + "% - " + (line[1] * 100) + "%";
            }
            row.append("<td style='border: 1px solid black; padding: 4px 8px;'>" + value + "</td>");
            rows.push(row);
            table.append(row);
          }
          schemeDiv.each(function () {
            $(this).empty();
            //needs to be cloned or it just keeps moving the table down an element
            $(this).append(table.clone());
            //may want to then remove the original table so it's not taking up space
          });
        }
      }
    });
  }

  async function genAssignmentElements() {
    let groupDiv = $(".btech-assignment-groups");
    let assignmentData = [];
    if (groupDiv.length > 0) {
      await $.get("/api/v1/courses/" + CURRENT_COURSE_ID + "/assignment_groups?per_page=100").done(function (data) {
        assignmentData = data;
      });
      data = assignmentData;
      let table = $("<table></table>");
      groupDiv.append(table);
      table.append("<tr><th style='border: 1px solid black; padding: 4px 8px;'>Submission Type</th><th style='border: 1px solid black; padding: 4px 8px;'>Weight</th></tr>");
      for (let i = 0; i < data.length; i++) {
        let group = data[i];
        if (group.group_weight > 0) {
          table.append("<tr><td style='border: 1px solid black; padding: 4px 8px;'>" + group.name + "</td><td style='border: 1px solid black; padding: 4px 8px;'>" + (group.group_weight) + "%</td>");
        }
      }
      groupDiv.each(function () {
        $(this).empty();
        $(this).append(table.clone());
      });
    }
  }
  let groupDiv = $(".btech-assignment-groups");
  if (groupDiv.length > 0) {
    groupDiv.each(function () {
      $(this).removeAttr("style");
      $(this).removeClass("btech-hidden");
      $(this).empty();
      $(this).html("Loading...");
    });
  }
  let schemeDiv = $(".btech-grading-scheme");
  if (schemeDiv.length > 0) {
    schemeDiv.each(function () {
      $(this).removeAttr("style");
      $(this).removeClass("btech-hidden");
      $(this).empty();
      $(this).html("Loading...");
    });
  }
  genAssignmentElements();
  genSchemeElements();
})();