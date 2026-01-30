(async function() {
    let unenrollButton = $('<a class="btn button-sidebar-wide" id="canvas-unenroll-button">Unenroll User</a>');
    $("#right-side div").first().append(unenrollButton);
    unenrollButton.click(async function() {
        let loadBar = $(`
        <div class='btech-modal' style='display: inline-block;'>
            <!-- ERASE THE DISPLAY PIECE BEFORE GOING LIVE -->
            <div class='btech-modal-content' style='max-width: 500px;'>
                <div class='btech-modal-content-inner'>
                    <div id="unenroll-progress-message"></div>
                    <div id="unenroll-progress-bar">You are about to unenroll this user from all courses in which they are a Teacher or a TA. Are you sure this is what you want to do?</div>
                    <div id='unenroll-progress-bar-buttons' style='width: 100%; text-align: center;'><button class='yes btn button-sidebar-wide'>Yes</button><button class='no btn button-sidebar-wide'>No</button></div>
                </div>
            </div>
        </div>
        `);

        $("body").append(loadBar);
        $("#unenroll-progress-bar-buttons button.no").click(async function() {
            $(loadBar).remove();
        });
        $("#unenroll-progress-bar-buttons button.yes").click(async function() {
            $("#unenroll-progress-bar").empty();
            $("#unenroll-progress-bar-buttons").remove();
            $("#unenroll-progress-bar").progressbar({
                value: 0
            });
            let enrollments = await canvasGet("/api/v1/users/" + ENV.USER_ID + "/enrollments?state[]=active&state[]=inactive&state[]=invited&state[]=rejected&state[]=completed&type[]=TeacherEnrollment&type[]=TaEnrollment");
            let adminRights = await canvasGet("/api/v1/manageable_accounts?as_user_id=" + ENV.USER_ID);
            let finishedCount = 0;
            let totalCount = enrollments.length + adminRights.length;
            $("#unenroll-progress-message").html("Unenrolling user. Do <strong>NOT</strong> close the page.")
            for (let e in enrollments) {
                let enrollment = enrollments[e];
                try {
                  await $.delete("/api/v1/courses/" + enrollment.course_id + "/enrollments/" + enrollment.id +"?task=deactivate");
                } catch(err) {
                  console.error(err);
                }
                finishedCount += 1;
                $("#unenroll-progress-bar").progressbar({
                    value: (finishedCount / totalCount) * 100
                })
            }

            $("#unenroll-progress-message").html("Removing admin access. Do <strong>NOT</strong> close the page.")
            for (let a in adminRights) {
              let account = adminRights[a].id;
              try {
                await $.delete(`/api/v1/accounts/${account}/admins/${ENV.USER_ID}`);
              } catch(e) {
                console.error(`Probably not really in this account ${account}`);
              }
              finishedCount += 1;
              $("#unenroll-progress-bar").progressbar({
                  value: (finishedCount / totalCount) * 100
              })
            }
            $.post("/api/v1/conversations", {
                recipients: [1893418],
                body: "I have unenrolled user " + ENV.CONTEXT_USER_DISPLAY_NAME + " (" + ENV.USER_ID + ") from all Teacher and TA enrollments."
            })
            loadBar.remove();
        });
    });
})();