(async function () {

    if (IS_TEACHER) {
        let pieces = window.location.pathname.match(/^\/courses\/([0-9]+)\/assignments\/([0-9]+)\/submissions\/([0-9]+)/);
        let speed_grader_link = '<div style="text-align: right;"><a class="assess_submission_link Button Button--small Button--link" href="/courses/' + pieces[1] + '/gradebook/speed_grader?assignment_id=' + pieces[2] + '&student_id=' + pieces[3] + '"><i class="icon-rubric" aria-hidden="true"></i> Speed Grader</a></div>';
        $($(".submission-details-header div")[0]).after(speed_grader_link);
    } else {
        let attempts = (await $.get(`/api/v1/courses/${ENV.current_context.id}/students/submissions?assignment_ids[]=${ENV.SUBMISSION.assignment_id}&student_ids[]=${ENV.SUBMISSION.user_id}&include[]=submission_history`))[0].submission_history;
        let div = $(`<div></div>`);
        for (let a in attempts) {
            let attempt = attempts[a];
            div.append(`<div><a href="${attempt.preview_url}" target="_blank">Attempt ${parseInt(a) + 1}</a>: <span style="width: 3rem; display: inline-block;">${attempt.grade ? attempt.grade + '%' : 'N/A'}</span> Submitted: ${attempt.submitted_at ?? attempt.posted_at ?? attempt.graded_at}</div>`);
        }
        $(`.ic-Action-header`).after(div);;
    }
})();