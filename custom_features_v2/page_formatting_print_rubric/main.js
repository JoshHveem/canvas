(async function() {
  window.addEventListener('load', async function() {
      let printButton = $(".btech-print-assignment");
      printButton.addClass("btn");
      printButton.css({
          "cursor": "pointer",

      });
      printButton.click(printAssignment);
      async function printAssignment() {
          let assignment = await $.get("/api/v1/courses/" + ENV.COURSE_ID + "/assignments/"+ ENV.ASSIGNMENT_ID);
          let criteria = assignment.rubric;
          let iframe =  $('<iframe width="100%" height="800px"></iframe>');
          $("#content-wrapper").append(iframe);
          //$("body").append(iframe);
          let contentWindow = iframe[0].contentWindow;
          let body = $(contentWindow.document.getElementsByTagName('body')[0]);
          body.append(assignment.description);
          body.append("<h1 style='text-align: center; page-break-before: always;'>Rubric</h1>");
          let rubricContainer = $("<div style='display: inline-block; width: 100%;'></div>");
          body.append(rubricContainer);
          for (let c in criteria) {
              let criterion = criteria[c];
              let bWidth = 0;
              if (c != 0) bWidth = 1;
              let criterionRow = $(`<div style='display: flex; width: 100%; padding: .5rem; align-items: stretch; border-top: `+bWidth+`px solid #000;'></div>`);
              rubricContainer.append(criterionRow);
              criterionRow.append("<div style='width: 20%; vertical-align: center; padding: .25rem; border-right: 1px solid #000;'>" + criterion.description + "</div>");
              for (let r in criterion.ratings) {
                  let rating = criterion.ratings[r];
                  criterionRow.append(`<div style='display: inline-block; vertical-align: top; padding: .25rem; width: ` + (75 / criterion.ratings.length) + `%;'>
              <p style='text-align: center;'><b>` + rating.description + `</b></p>
              <p style='text-align: center; font-size: 2rem; margin: 0;'><b>` + rating.points + `</b></p>
              <p>`+rating.long_description+`</p>
              </div>`);
              }
          }
          body.append("<p>Enter any additional comments in the space below and on the back of this page.</p><div style='width: 100%; height: 10rem; border-top: 1px solid #000;'></div>");
          body.find(".btech-print-assignment").remove();
          window.location.pathname.match(/assignments\/([0-9]+)/);
          contentWindow.focus();
          contentWindow.print();
          $(".btech-print-assignment").show();
      }
});
  // Your code here...
})();