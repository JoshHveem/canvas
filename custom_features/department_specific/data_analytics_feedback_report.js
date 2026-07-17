(async function() {
  function addBackground(remove) {
    let bg = $(`
      <div style="
        overflow: auto; 
        position: fixed; 
        background-color: rgba(0, 0, 0, 0.5); 
        width: 100%; 
        height: 100%; 
        left: 0; 
        top: 0; 
        z-index:1000;
      ">
        <div id='background-container' style='
          width: 500px;
          left: 50%;
          transform: translate(-50%, -50%);
          position:fixed;
          top: 50%;
          z-index:1000;
          transition: 0.5s;
          background-color: #FFF;
          border: 2px solid #888;
          padding: 10px 20px;
          color: #000;
          border-radius: 5px;
        '>
        </div>
      </div>
      `);
    $("body").append(bg);
    if (remove) addBackgroundClosing(bg);
    return bg;
  }

  function addBackgroundClosing(bg) {
    bg.click(function (e) {
      if (e.target !== this)
        return;
      $(this).remove();
    });
  }

  let button = $(`<button class="btn">DATA Feedback</button>`);
  $(".header-bar-right__buttons").prepend(button);
  button.click(async function() {
    let background = addBackground(true);
    let container = background.find("#background-container");
    container.append("Loading");
    let report = $("<div></div>");
    let assignments = await canvasGet(`/api/v1/courses/${ENV.course_id}/assignments`);
    assignments.sort(function(a, b) {
        var textA = a.name.toUpperCase();
        var textB = b.name.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
    for (let a in assignments) {
        let assignment = assignments[a];
        if (assignment.name.match(/Module [0-9]+ Feedback/)) {
            report.append(`<h2>${assignment.name}</h2>`);
            let list = $("<ul></ul>");
            let submissions = await canvasGet(`/api/v1/courses/${ENV.course_id}/assignments/${assignment.id}/submissions`);
            for (let s in submissions) {
                let submission = submissions[s];
                if (submission.body != null) {
                    list.append(`<li>${submission.body}</li>`);
                }
            }
            report.append(list);
        }
    }
    container.empty();
    container.append(report.html());
    $("#background-container").css({"overflow-y": "scroll", "height": "90vh", "width": "90vw"});
  });
})();