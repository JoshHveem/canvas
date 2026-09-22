if (/^\/courses\/[0-9]+\/gradebook\/speed_grader/.test(window.location.pathname)) {
  //Split screen 50/50
  $('div#left_side').css("width", "50%");
  $('div#right_side').css("width", "50%");
}
// $(document).ready(function() {
//     // Create a MutationObserver to watch for the element's appearance and reappearance
//     const observer = new MutationObserver(function(mutations) {
//         mutations.forEach(function(mutation) {
//             // Check if the #enhanced-rubric-assessment-tray element has been added to the DOM
//             const $target = $('#enhanced-rubric-assessment-tray');
//             if ($target.length) {
//                 // Set the width to match the right side width
//                 $target.css('width', $("#right_side").css("width"));

//                 // Check if buttons already exist, if so, skip the addition
//                 if (!$("#btech-enhanced-rubric-assessment-collapse").length && !$("#btech-enhanced-rubric-assessment-expand").length) {
//                     // Create buttons
//                     let $collapseButton = $(`<span id="btech-enhanced-rubric-assessment-collapse" style="cursor: pointer; user-select: none;">▼</span>`);
//                     let $expandButton = $(`<span id="btech-enhanced-rubric-assessment-expand" style="cursor: pointer; user-select: none;">▲</span>`);
//                     $expandButton.hide();

//                     // Collapse button shrinks it and then pushes it to the bottom
//                     $collapseButton.click(() => {
//                         if ($target.length) {
//                             $target.css('height', '4rem');
//                             $target.css('top', `calc(${$("#right_side").css("height")} - 4rem`);
//                             $expandButton.show();
//                             $collapseButton.hide();
//                         }
//                     });

//                     // Expand button resets the tray to its original state
//                     $expandButton.click(() => {
//                         if ($target.length) {
//                             $target.css('height', '');
//                             $target.css('top', ``);
//                             $expandButton.hide();
//                             $collapseButton.show();
//                         }
//                     });

//                     // Insert the buttons before the rubric header
//                     $('div[aria-label="Rubric Assessment Tray"] [data-testid="rubric-assessment-header"]').before($collapseButton);
//                     $('div[aria-label="Rubric Assessment Tray"] [data-testid="rubric-assessment-header"]').before($expandButton);
//                 }
//             }
//         });
//     });

//     // Start observing the document body for changes
//     observer.observe(document.body, { childList: true, subtree: true });
// });
