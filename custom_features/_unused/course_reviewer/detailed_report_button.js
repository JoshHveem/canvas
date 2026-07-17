$("<style>@media print { #btech-detailed-evaluation-button { display: none !important; } }</style>").appendTo("head");

// jQuery easing functions (if not included already)
$.easing.easeInOutQuad = function (x, t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t + b;
    return -c / 2 * ((--t) * (t - 2) - 1) + b;
};

$.easing.easeOutQuad = function (x, t, b, c, d) {
    return -c * (t /= d) * (t - 2) + b;
};

function initModal() {
  $("body").append(`
    <div class='btech-modal' style='display: inline-block;'>
      <!-- ERASE THE DISPLAY PIECE BEFORE GOING LIVE -->
      <div id="btech-course-reviewer-detailed-report" class='btech-modal-content' style='max-width: 800px; border-radius: 0.25rem; background-color: #EEE;'></div>
      </div>
    </div>
  `);
  let $modalContent = $('body #btech-course-reviewer-detailed-report');
  let $modal = $modalContent.parent();
  $modal.on("click", function(event) {
    // Check if the clicked element is the modal, and not its content
    if ($(event.target).is($modal)) {
      $modal.hide();  // hide the modal
    }
  });
  $modal.hide();
  return $modal;
}

// add button
function addDetailedReportButton($vueApp) {
  let $button = $('<div></div>').attr('id', 'btech-detailed-evaluation-button');
  // Create the icon element

  // Apply inline styles
  $button.css({
    'position': 'fixed',
    'cursor': 'pointer',
    'bottom': '25px',
    'right': '20px',
    'width': '2.75rem',
    'height': '2.75rem',
    'padding': '0.25rem',
    'font-size': '2rem',
    'text-align': 'center',
    'background-color': '#E8E8E8',
    'border': '1px solid #888',
    'border-radius': '50%',
    'z-index': '1000', // Ensure it is above other elements
  });

  // Append the icon to the body
  $('body').append($button);

  // Smooth bounce animation using jQuery
  $button.animate({bottom: '50px'}, 200, 'easeInOutQuad', function() {
      $button.animate({bottom: '15px'}, 220, 'easeInOutQuad', function() {
          $button.animate({bottom: '40px'}, 180, 'easeInOutQuad', function() {
              $button.animate({bottom: '20px'}, 200, 'easeInOutQuad', function() {    
                  $button.animate({bottom: '25px'}, 100, 'easeInOutQuad', function() {
                  });
              });
          });
      });
  });

  // Ensure the icon stays in the bottom right corner on scroll
  $(window).scroll(function() {
      $button.css({
          'bottom': '25px',
          'right': '20px'
      });
  });


  $button.click(async function () {
    let $modalContent = $('body #btech-course-reviewer-detailed-report');
    let $modal = $modalContent.parent();
    $vueApp.menuCurrent = 'main';
    $modal.show();
  });
  return $button;
}
