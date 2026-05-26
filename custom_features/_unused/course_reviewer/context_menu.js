function addContextMenu($el, menuItems = [], position='fixed') {
  // Add custom menu options
  // Disable default context menu and show custom menu on right-click
  $el.on('contextmenu', function(e) {
    e.preventDefault();
    
    // Dynamically create and show the custom menu
    createCustomMenu(e.clientX, e.clientY);
  });

  // Hide the menu if clicking outside or pressing Esc
  $(document).on('click', function() {
    $('#customMenu').remove(); // Remove the custom menu if clicked elsewhere
  });
  function createCustomMenu(x, y, position='fixed') {
    // Remove any existing custom menu
    $('#customMenu').remove();

    // Create a new context menu element with `position: fixed`
    const $customMenu = $('<ul>', {
      id: 'customMenu',
      css: {
        position: position, // Make it fixed relative to the viewport
        backgroundColor: 'white',
        border: '1px solid #ccc',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        width: '150px',
        listStyle: 'none',
        padding: '0',
        margin: '0'
      }
    });


    // Append each menu item to the custom menu
    menuItems.forEach(item => {
      let $li = $('<li>', {
        id: item.id,
        text: item.text,
        css: {
          padding: '10px',
          cursor: 'pointer'
        },
        hover: function() {
          $(this).css('background-color', '#f0f0f0');
        },
        mouseout: function() {
          $(this).css('background-color', 'white');
        },
        click: function() {
          item.func();
          $customMenu.remove(); // Hide menu after clicking an option
        }
      });
      $li.appendTo($customMenu);
    });

    // Append the custom menu to the body
    $('body').append($customMenu);

    // Get the menu dimensions after it's added to the DOM
    const menuWidth = $customMenu.outerWidth();
    const menuHeight = $customMenu.outerHeight();

    // Get the viewport (window) dimensions
    const windowWidth = $(window).width();
    const windowHeight = $(window).height();

    // Adjust X and Y coordinates to prevent the menu from going off-screen
    let posX = x;
    let posY = y;

    // Check if the menu goes beyond the right edge of the viewport
    if (posX + menuWidth > windowWidth) {
      posX = windowWidth - menuWidth - 10; // Adjust X to keep it inside
    }

    // Check if the menu goes beyond the bottom edge of the viewport
    if (posY + menuHeight > windowHeight) {
      posY = windowHeight - menuHeight - 10; // Adjust Y to keep it inside
    }

    // Apply the final position using fixed coordinates relative to the viewport
    $customMenu.css({
      top: posY + 'px',
      left: posX + 'px'
    });
} 
}