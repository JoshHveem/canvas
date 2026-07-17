(function () {
  //Make it so the suggested score is out of the poitns available for the assignment, not the rubric
  IMPORTED_FEATURE = {};
  let rWindowSpeedGrader = /^\/courses\/[0-9]+\/gradebook\/speed_grader/;
  if (rWindowSpeedGrader.test(window.location.pathname)) {
    IMPORTED_FEATURE = {
      attempts: 0,
      initiated: false,
      courseId: ENV.course_id,
      assignmentId: ENV.assignment_id,
      studentId: "",
      rSpeedgrader: /courses\/([0-9]+)\/gradebook\/speed_grader\?assignment_id=([0-9]+)&student_id=([0-9]+)/,
      setTime: null,
      _init(params = {}) {
        let feature = this;

        feature.insertAttemptsData();
        $(".save_rubric_button").on("click", function () {
          feature.setTime = new Date();
          feature.calcAttemptsData(feature);
        });
      },
      async insertAttemptsData() {
        let feature = this;
        let details;
        if (rWindowSpeedGrader.test(window.location.pathname)) {
          details = await getElement("#grade_container");
        }
        details.after(
          `<tr id="btech-attempts-data" class="content_box">
          <td colspan="3">
          <div id="btech-recorded-attempts"><b>Recorded Attempts:</b> <span id="btech-recorded-attempts-value"></span></div>
          <div id="btech-rubric-score"><b>Rubric Score:</b> <span id="btech-rubric-score-value"></span></div>
          <div id="btech-suggested-score"><b>Suggested Score:</b> <span id="btech-suggested-score-value"></span></div>
          </td>
          </tr>`);
        feature.checkUpdateSpeedgrader(feature.calcAttemptsData);
        feature.calcAttemptsData(feature);
      },
      checkUpdateSpeedgrader(func) {
        let feature = this;
        feature.oldHref = document.location.href;
        window.onload = function () {
          var
            bodyList = document.querySelector("#right_side"),
            observer = new MutationObserver(function (mutations) {
              mutations.forEach(function (mutation) {
                if (feature.oldHref !== document.location.href) {
                  feature.oldHref = document.location.href;
                  //This line is specific to this feature and should be deleted if copied to another
                  feature.setTime = null;
                  func(feature);
                }
              });
            });
          var config = {
            childList: true,
            subtree: true
          };
          observer.observe(bodyList, config);
        };
      },
      checkTimeDif(submissionData) {
        let feature = this;
        feature.attempts = 0;
        comments = submissionData[0].submission_comments;
        let checkTimeDif = (feature.setTime == null);
        for (let c = 0; c < comments.length; c++) {
          let comment = comments[c];
          if (comment.comment.includes("RUBRIC")) {
            feature.attempts += 1;
          }
          if (feature.setTime !== null) {
            let timeDif = feature.setTime - new Date(comment.created_at);
            if (timeDif < 10000) {
              checkTimeDif = true;
            }
          }
        }
        return checkTimeDif;
      },
      async calcAttemptsData(feature) {
        //reset data
        $("#btech-recorded-attempts-value").text("");
        $("#btech-rubric-score-value").text("");
        $("#btech-suggested-score-value").text("");
        //GET URL DATA
        //this is done here because the url changes in speedgrader, so a one time set won't work
        let pageurl = (window.location.pathname + window.location.search);
        let urlData = pageurl.match(feature.rSpeedgrader);
        feature.courseId = urlData[1];
        feature.assignmentId = urlData[2];
        feature.studentId = urlData[3];

        //Get submission data to calculate previous attempts and currents core
        let url = "/api/v1/courses/" + feature.courseId + "/assignments/" + feature.assignmentId + "/submissions/" + feature.studentId;
        let comments = [];
        let data = await canvasGet(url, {
          include: [
            'submission_comments',
            'rubric_assessment'
          ]
        });
      
        //See if the newest comment has been posted. If not, run this again.
        let checkTimeDif = feature.checkTimeDif(data);
        if (checkTimeDif === false) { //if new sub hasn't it, restart
          feature.calcAttemptsData(feature, feature.setTime);
        } else { //do your thing
          if (feature.attempts > 0) {
            rubricTotal = 0;
            for (c in data[0].rubric_assessment) {
              let criterion = data[0].rubric_assessment[c];
              if (!isNaN(criterion.points)) {
                rubricTotal += criterion.points;
              }
            }
            rubricMax = ENV.rubric.points_possible;
            let suggestedScore = Math.round((rubricTotal) * ((11 - feature.attempts) / 10));
            $("#btech-recorded-attempts-value").text(feature.attempts);
            $("#btech-rubric-score-value").text(rubricTotal + " (" + (Math.round((rubricTotal / rubricMax) * 1000) / 10) + "%)");
            $("#btech-suggested-score-value").text(suggestedScore);
          }
        }
      }
    }
  }
})();