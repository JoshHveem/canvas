if (/^\/courses\/[0-9]+\/users\/[0-9]+/.test(window.location.pathname)) {
    $(".conclude_enrollment_link").hide();
    $(".conclude_enrollment_link_holder").append("<div class='pending-data-collection'>Waiting on data</div>");
    $(".unconclude_enrollment_link").on("click", function() {
        async function run() {
            await delay(1000);
            if ($(".conclude_enrollment_link_holder").css("display") === "block") {
                collectEnrollmentData();
            }
        }
        run();
    });

    $(".conclude_enrollment_link").on("click", function() {
        let courseId = ENV.COURSE_ID;
        let userId = ENV.USER_ID;
        async function run() {
            await delay(500);
            if ($(".unconclude_enrollment_link_holder").css("display") === "block") {
                setConcludeData(userId, courseId, customColumnsData, currentColumn);
                //let url = "/api/v1/users/"+userId+"/custom_data/previous-enrollments/"+courseId+"/enrollments/"+DATE+"?ns=edu.btech&data[current_grade]="+STUDENT_CURRENT_SCORE+"&data[final_grade]="+STUDENT_FINAL_SCORE;
                //$.put(url);
            }
        }
        run();
    });

    var STUDENT_CURRENT_SCORE = 0;
    var STUDENT_FINAL_SCORE = 0;
    var DATE = new Date().getDate() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getFullYear();
    var customColumnsData = {"length": 0};
    var currentColumn = -1;

    function collectEnrollmentData() {
        let courseId = ENV.COURSE_ID;
        let userId = ENV.USER_ID;
        let url = "/api/v1/courses/"+courseId+"/users?user_ids[]=" + userId + "&include[]=enrollments";
        $.get(url, function(data) {
            let grades = data[0].enrollments[0].grades;
            STUDENT_CURRENT_SCORE = grades.current_score;
            STUDENT_FINAL_SCORE = grades.final_score;
        });
    }
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
                }
            }
            if (found === true) {
                if (columnNum < customColumnsData.length) {
                    return getColumnData(userId, courseId, customColumnsData, columnNum + 1);
                } else {
                    //create column
                    currentColumn = columnNum + 1;
                    let url = "/api/v1/courses/"+courseId+"/custom_gradebook_columns?column[title]=Prev Enrollment " + currentColumn + "&column[hidden]=true&column[read_only]=true";
                    $.post(url, function(data) {
                        customColumnsData[""+currentColumn]=data;
                        customColumnsData.length = currentColumn;
                        console.log(customColumnsData);
                    });
                    $(".conclude_enrollment_link").show();
                    $(".pending-data-collection").hide();
                    return columnNum + 1;
                }
            } else {
                currentColumn = columnNum;
                $(".conclude_enrollment_link").show();
                $(".pending-data-collection").hide();
                return columnNum;
            }
        });
    }
    async function setConcludeData(userId, courseId, customColumnsData, columnNum=1) {
        let formattedData = "{'current_score':"+STUDENT_CURRENT_SCORE+",'final_score':"+STUDENT_FINAL_SCORE+",'date':'"+DATE+"'}"
        let columnId = customColumnsData[columnNum].id;
        let url = "/api/v1/courses/" + courseId + "/custom_gradebook_columns/" + columnId + "/data/" + userId + "?column_data[content]=" + formattedData;
        $.put(url);
    }
    async function collectCustomGradeColumns() {
        let userId = ENV.USER_ID;
        let courseId = ENV.COURSE_ID;
        let url = "/api/v1/courses/" + courseId + "/custom_gradebook_columns?include_hidden=true";
        let nextId = 1;
        return $.get(url, function(data) {
            for (let d = 0; d < data.length; d++) {
                let column = data[d];
                let rData = /Prev Enrollment ([0-9]+)/;
                let matches = column.title.match(rData);
                if (matches) {
                    customColumnsData[matches[1]] = column;
                    customColumnsData.length += 1;
                }
            }
            console.log(customColumnsData);
            return getColumnData(userId, courseId, customColumnsData);
        });

    }

    collectEnrollmentData();
    collectCustomGradeColumns();
}