(async function() {
  function createHeader(title) {
    let className = title.toLowerCase().replace(' ', '_');
    let head = $('#grades_summary thead');
    if (head.find('th.' + className).length === 0) head.find('th.assignment_score').after(`<th class="${className}">${title}</th>`);
  }

  if (/^\/courses\/[0-9]+\/grades\/[0-9]+$/.test(window.location.pathname)) {
    let submissions = await canvasGet("/api/v1/courses/" + CURRENT_COURSE_ID + "/students/submissions", {
        'student_ids': [ENV.student_id]
    });
    createHeader("Attempts");
    for (let s in submissions) {
        let sub = submissions[s];
        let row = $("tr#submission_"  + sub.assignment_id);
        let scoreCell = row.find('td.assignment_score');
        // Check if cell already created
        let cellEl = row.find('td.attempts');
        if (cellEl.length === 0) {
            let attempts = '';
            if (typeof sub.attempt === 'number') attempts = sub.attempt;
            scoreCell.after('<td class="possible attempts">' + attempts + '</td>');
        }
    } 
    createHeader("Submitted");
    for (let s in submissions) {
        let sub = submissions[s];
        let row = $("tr#submission_"  + sub.assignment_id);
        let scoreCell = row.find('td.assignment_score');
        let cellEl = row.find('td.submission_date');
        // Check if cell already created
        if (cellEl.length === 0) {
          scoreCell.after(`<td class="submission_date">${bridgetools.dateToString(sub.submitted_at)}</td>`);
        }
        else {
          //Possibly add something like over text to show what all the submission dates are, not just the most recent
        }
    }
  }
})();