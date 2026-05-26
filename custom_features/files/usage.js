// Modal creation function
function createModal() {
  let modal = $(`
    <div class='btech-modal' style='display: inline-block;'>
      <!-- ERASE THE DISPLAY PIECE BEFORE GOING LIVE -->
      <div class='btech-modal-content' style='max-width: 500px;'>
        <div class='btech-modal-content-inner'></div>
      </div>
    </div>
  `);
  
  // Close modal if clicking outside the inner content
  modal.on("click", function(event) {
    if ($(event.target).is(modal)) {
      modal.remove();
    }
  });
  
  $("body").append(modal);
  return modal;
}

// Main function that updates the usage columns and attaches click handlers
async function updateUsageColumns() {
  let fileDict = {};
  let files = await bridgetools.req3('reports', {canvas_course_id: ENV.COURSE_ID}, {dataset: 'canvas_course_file_usage'}) || [];
  
  // Cache files by file_id
  for (let file of files) {
    fileDict[file.file_id] = file;
  }
  
  // Add the header column if it's not already present.
  if ($('.ef-directory-header .ef-usage-col').length === 0) {
    let locationHeaderDiv = $('<div class="ef-usage-col">Usage</div>').css({
      'width': '2rem',
      'text-align': 'center',
      'display': 'inline-block',
      'margin-left': '10px'
    });
    $('.ef-directory-header .ef-size-col').after(locationHeaderDiv);
  }
  
  let rows = $('.ef-item-row');
  
  rows.each(function () {
    let row = $(this);
    
    // Only add the usage column if it doesn't already exist in this row.
    if (row.find('.ef-usage-col').length === 0) {
      // Create the usage div (default value "0") with a pointer cursor.
      let locationDiv = $('<div class="ef-usage-col"> </div>').css({
        'width': '2rem',
        'text-align': 'center',
        'display': 'inline-block',
        'margin-left': '10px',
        'cursor': 'pointer'
      });
      
      row.find('.ef-size-col').after(locationDiv);
      
      // Get the link from the name column and extract the file ID using regex.
      let link = row.find('.ef-name-col a').attr('href');
      if (link) {
        let match = link.match(/files\/(\d+)/);
        if (match) {
          let fileId = match[1];
          let file = fileDict[fileId];
          if (file) {
            locations = file?.locations ?? [];
            // Update the displayed number of uses.
            locationDiv.text(file.locations.length);
            
            // Only attach the click event if there is at least one usage link.
            if (file.locations.length > 0) {
              locationDiv.on('click', function(e) {
                e.preventDefault();
                
                // Get the header text from .ef-name-col for the current row.
                let headerText = row.find('.ef-name-col').text().trim();
                
                // Create the modal.
                let modal = createModal();
                let modalContent = modal.find('.btech-modal-content-inner');
                modalContent.empty(); // Clear any existing content.
                
                // Add a header element with the text from ef-name-col.
                let headerElement = $('<h4 style="font-weight: bold;">').text(headerText);
                modalContent.append(headerElement);
                let subheaderElement = $('<h5 style="font-weight: bold;">').text('Locations Used');
                modalContent.append(subheaderElement);
                
                // Create an unordered list to hold the usage links.
                let ul = $('<div>');
                file.locations.forEach(function(loc) {
                  // Create an anchor for each location, set to open in a new tab.
                  let a = $('<a>')
                    .attr('href', loc)
                    .attr('target', '_blank')
                    .text(loc);
                  ul.append($('<div>').append(a));
                });
                modalContent.append(ul);
              });
            }
          }
        }
      }
    }
  });
}

// Run the update function initially.
updateUsageColumns();

// OPTIONAL: If your content inside div.ef-directory loads dynamically,
// you can set up a MutationObserver to re-run the update function each time it changes.
const targetNode = document.querySelector('div.ef-directory');
if (targetNode) {
  const config = { childList: true, subtree: true };
  const observerCallback = (mutationsList, observer) => {
    updateUsageColumns();
  };
  const observer = new MutationObserver(observerCallback);
  observer.observe(targetNode, config);
}
