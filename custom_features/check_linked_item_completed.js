//Currently only shows quizzes, need to add assignments
//also are just grabbing the first assignment, need to get all of them and then find most recent.
//Could potentially somehow show the score as well.
$("#content a").each(async function() {
    let el = $(this);
    let href = el.attr("href");
    let quizUrls = href.match(/(courses\/[0-9]+\/quizzes\/[0-9]+)/);
    if  (quizUrls) {
        let quizUrl = quizUrls[1];
        let submissions = (await canvasGet("/api/v1/" + quizUrl + "/submission"))[0].quiz_submissions;
        if (submissions.length > 0) {
            let submission = submissions[0];
            el.after(`<i title="Quiz submitted ${submission.finished_at}" class="icon-publish icon-Solid" style="color: green;"></i>`);
        } else {
            el.after(`<i title="No submission on record" class="icon-warning icon-Solid" style="color: red;"></i>`);
        }
    }
});