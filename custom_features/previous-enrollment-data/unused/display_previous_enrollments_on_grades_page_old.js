
if (/^\/courses\/[0-9]+\/grades\/[0-9]+/.test(window.location.pathname)) {
  //talk to alex and get the adding of data on conclusion to the jenzabar code. SHOULD be just a single line or two of code
  function getPreviousEnrollmentGrades() {
      let regex = /courses\/([0-9]+)\/grades\/([0-9]+)/;
      let courseId = parseInt(window.location.pathname.match(regex)[1]);
      let userId = parseInt(window.location.pathname.match(regex)[2]);
      let score = 100;
      let dates = [];
      //get current grade info
      let url = "/api/v1/courses/"+courseId+"/enrollments?user_id=" + userId;
      $.get(url, function(data) {
          let grades = null;
          let current_score = null;
          let current_final_score = null;
          if (data.length > 0) {
              grades = data[0].grades;
              current_score = grades.current_score;
              current_final_score = grades.final_score;
          }
          //Once you've got the grades, get historic data
          let url = "/api/v1/users/"+userId+"/custom_data/previous-enrollments/"+courseId+"/enrollments?ns=edu.btech";
          $.get(url, function(data) {
              let enrollments = data.data;
              for (let dateString in enrollments) {
                  let enrollment = enrollments[dateString];
                  let score = enrollment["current_grade"];
                  let final_score = enrollment["final_grade"];
                  let datePieces = dateString.split('-');
                  let date = new Date(datePieces[2], parseInt(datePieces[1]) - 1, datePieces[0]);
                  dates.push({"date": date, "score": score, "final_score": final_score});
              }
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
                      if (d > 0) {
                          prevScore = dates[d-1].score;
                          prevFinalScore = dates[d-1].final_score;
                          prevProgress = prevFinalScore / prevScore;
                      }
                      let enrollmentTermScore = (finalScore - prevFinalScore).toFixed(2) / (progress - prevProgress).toFixed(2);
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
          });
      });
  }
  getPreviousEnrollmentGrades();
}