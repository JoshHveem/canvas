let urlData = window.location.pathname.match(/courses\/([0-9]+)\/assignments\/([0-9]+)/);
    let courseId = urlData[1];
    let assignmentId = urlData[2];
    let studentId = ENV.current_user_id;
    async function getCriteria() {
        let url = "/api/v1/courses/" + courseId + "/assignments/" + assignmentId;
        let criteria = {};
        await $.get(url, function (data) {
            for (let i = 0; i < data.rubric.length; i++) {
                let criterion = data.rubric[i];
                //look to see if time data was provided
                criterion.average_time = 0;
                let rPieces = /([0-9]+) min/;
                let pieces = criterion.long_description.match(rPieces);
                if (pieces !== null) {
                    criterion.average_time = parseInt(pieces[1]);
                }
                criterion.points_current = 0;
                criteria[criterion.description] = criterion;
            }
        });
        return criteria;
    }
    async function getComment() {
        let url = "/api/v1/courses/" + courseId + "/assignments/" + assignmentId + "/submissions/" + studentId;
        let comments = [];
        let data = await canvasGet(url, {
            include: [
                'submission_comments'
            ]
        });
        comments = data[0].submission_comments;
        for (let c = 0; c < comments.length; c++) {
            let comment = comments[c];
            if (comment.comment.includes("#SELF EVALUATION#")) {
                return comment;
            }
        }
        return null;
    }

    async function updateComment(criterionId, criterionValue) {
        savedCriteria[criterionId] = criterionValue;
        //Add in a try on the delete, if it fails break, wait, and then rerun the function a second later, rinse repeat
        if (selfEvaluation !== null) {
            await $.delete(window.location.origin + "/submission_comments/" + selfEvaluation.id);
        }
        let comment = "#SELF EVALUATION#\n";
        for (let id in savedCriteria) {
            let value = savedCriteria[id];
            comment += (id + ": " + value + "\n");
        }
        let url = "/api/v1/courses/" + courseId + "/assignments/" + assignmentId + "/submissions/" + studentId;
        await $.put(url, {
            comment: {
                text_comment: comment
            }
        });
        selfEvaluation = await getComment();
        return;
    }
    let selfEvaluation = await getComment();
    let savedCriteria = {};
    if (selfEvaluation !== null) {
        let lines = selfEvaluation.comment.match(/_[0-9]+: [0-9]+/g);
        for (let l = 0; l < lines.length; l++) {
            let line = lines[l];
            let parts = line.match(/(_[0-9]+): ([0-9]+)/);
            savedCriteria[parts[1]] = parseInt(parts[2]);
        }
    }
    let criteria = await getCriteria();
    $(".btech-self-graded-rubric").empty();
    let labels = {
        '1': 'Needs Improvement',
        '2': 'Competent with Assistantce',
        '3': 'Competent'
    }
    for (let description in criteria) {
        let criterion = criteria[description];
        let container = $("<div class='self-graded"+criterion.id+"'></div>");
        $(".btech-self-graded-rubric").append(container);
        let form = $("<form action=''></form>");
        container.append(form);
        form.append(`<label class="statement">`+description+`</label>`);
        let ul = $("<ul class='likert'></ul>");
        form.append(ul);
        let numLabels = Object.keys(labels).length;
        for (let i = 1; i <= numLabels; i ++) {
            let li = $("<li style='width" + (Math.ceil(100 / numLabels) - 1) +"%'></li>");
            let radio = $('<input type="radio" name="likert" value="'+i+'">');
            radio.click(function() {
                updateComment(criterion.id, i);
            });
            let label = $("<label>" + labels[i] + "</label>");
            li.append(radio);
            li.append(label);
            ul.append(li);
            if (criterion.id in savedCriteria) {
                if (savedCriteria[criterion.id] == i) {
                    radio.prop("checked", true);
                }
            }
        }
    }
})();