if (/^\/courses\/[0-9]+\/grades\/[0-9]+/.test(window.location.pathname)) {
  //talk to alex and get the adding of data on conclusion to the jenzabar code. SHOULD be just a single line or two of code
  var customColumnsData = {length: 1};
  var dates = [];
  var grades = null;
  var current_score = null;
  var current_final_score = null;
  async function getColumnData(userId, courseId, customColumnsData, columnNum=1) {
      let columnId = customColumnsData[columnNum].id;
      userId = parseInt(userId);
      courseId = parseInt(courseId);
      let url = "/api/v1/courses/"+courseId+"/custom_gradebook_columns/"+columnId+"/data?include_hidden=true";
      return $.get(url, function(data) {
          let found = false;
          for (let d = 0; d < data.length; d++) {
              let id = data[d].user_id;
              if (id == userId) {
                  found = true;
                  let enrollment = JSON.parse(data[d].content.replace(/'/g, '"'));
                  let score = enrollment.current_score;
                  let final_score = enrollment.final_score;
                  let dateString = enrollment.date;
                  let datePieces = dateString.split('-');
                  let date = new Date(datePieces[2], parseInt(datePieces[1]) - 1, datePieces[0]);
                  dates.push({"date": date, "score": score, "final_score": final_score});
                  getColumnData(userId, courseId, customColumnsData, columnNum + 1);
                  break;
              }
          }
          if (!found) {
              console.log(dates);
              processDates();
          }
      });
  }
  function processDates() {
      if (dates.length > 0) {
          $("aside#right-side")
              .append(`<div><br><br><h2>Scores By Enrollment Period:</h2></div>` +
                      `<div id='btech-previous-enrollments'><table class='summary' id='btech-previous-enrollments-table'><tbody><thead><tr><th>End Date</th><th>Grade</th></tr></thead></tbody></table></div>`);
          dates.sort((a, b) => a.date - b.date);
          if (grades !== null) {
              dates.push({"date": "Current", "score": current_score, "final_score": current_final_score});
          }
          for (let d = 0; d < dates.length; d++) {
              let date = dates[d].date;
              let score = dates[d].score;
              let finalScore = dates[d].final_score;
              let progress = finalScore / score;
              let formattedDate = date;
              let prevScore = 0;
              let prevFinalScore = 0;
              let prevProgress = 0;
              console.log("CUR");
              console.log(finalScore);
              console.log(progress);
              if (d > 0) {
                  prevScore = dates[d-1].score;
                  prevFinalScore = dates[d-1].final_score;
                  prevProgress = prevFinalScore / prevScore;
                  console.log("PREV");
                  console.log(prevFinalScore);
                  console.log(prevProgress);
              }
              let difScore = ((finalScore - prevFinalScore));
              let difProgress = (progress - prevProgress);
              if (difProgress == 0) {
                  difProgress = .001;
              }
              console.log(difScore);
              console.log(difProgress);
              let enrollmentTermScore = difScore / difProgress;
              console.log("SURVEY SAYS...");
              console.log(enrollmentTermScore);
              console.log("");
              if (enrollmentTermScore != enrollmentTermScore.toFixed(2)) {
                  enrollmentTermScore = enrollmentTermScore.toFixed(2)
              }
              if (date !== "Current") {
                  formattedDate = MONTH_NAMES_SHORT[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
              }
              let html = `<tr><th scope="row">` + formattedDate + `</th>`;
              if(!isNaN(enrollmentTermScore)) {
                  html += `<td>` + enrollmentTermScore + `%</td>`
              } else {
                  html += `<td>N/A</td>`
              }
              html += `</tr>`;

              $("#btech-previous-enrollments table tbody")
                  .append(html);
          }
      }
  }
  function getPreviousEnrollmentGrades() {
      let regex = /courses\/([0-9]+)\/grades\/([0-9]+)/;
      let courseId = parseInt(window.location.pathname.match(regex)[1]);
      let userId = parseInt(window.location.pathname.match(regex)[2]);
      let score = 100;
      let dates = [];
      //get current grade info
      let url = "/api/v1/courses/"+courseId+"/users?user_ids[]=" + userId + "&include[]=enrollments";
      $.get(url, function(data) {
          console.log(data);
          if (data.length > 0) {
              grades = data[0].enrollments[0].grades;
              current_score = grades.current_score;
              current_final_score = grades.final_score;
          }
          //Onve you've got the grades, get custom columns
          let url = "/api/v1/courses/" + courseId + "/custom_gradebook_columns?include_hidden=true";
          $.get(url, function(data) {
              for (let d = 0; d < data.length; d++) {
                  let column = data[d];
                  let rData = /Prev Enrollment ([0-9]+)/;
                  let matches = column.title.match(rData);
                  if (matches) {
                      customColumnsData[matches[1]] = column;
                      customColumnsData.length += 1;
                  }
              }
              //after collecting customColumnsData, go through each collumn and add lines to the table
              getColumnData(userId, courseId, customColumnsData);
              console.log(customColumnsData);
          });
      });
  }
  getPreviousEnrollmentGrades();
}