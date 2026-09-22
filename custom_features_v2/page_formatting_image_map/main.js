$(window).on("load", function () {
  let img = $(".btech-image-map-image");
  img.wrap("<div class='btech-image-map-container' style='position: relative;'></div>");
  let table = $(".btech-image-map-table");
  let container = $(".btech-image-map-container");
  container.width(img.width());
  container.height(img.height());
  let backdrop = $("<div style='position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.8);'></div>");
  let player = $("<div style='position: absolute; width: 75%; height: 75%; left: 50%; top: 50%; transform: translate(-50%, -50%); background-color: white; padding: 10px;'></div>");
  let closeButton = $('<i class="fa fa-times-circle fa-3x" style="float: right; position: absolute; right: -1.5rem; top: -1.5rem; color: var(--btech-theme-header-background-color); background-color: var(--btech-theme-header-color); border-radius: 100px;"></i>');
  player.append(closeButton);

  backdrop.hide();
  backdrop.click(function () {
    backdrop.hide();
    player.empty();
    player.append(closeButton);
  });
  closeButton.click(function () {
    backdrop.hide();
    player.empty();
    player.append(closeButton);
  });
  let currentRow = null;
  let rows = $(table.find("tbody")[0]).find("tr");
  rows.each(function () {
    let row = $(this);
    let cells = row.find('td');
    let content = $(cells[0]).html();
    let x = parseInt($(cells[1]).text());
    let y = parseInt($(cells[2]).text());
    let imgSrc= SOURCE_URL + "/media/map-marker.jpg";
    let icon = $("<div style='height: 64px; width: 64px; position: absolute; left: calc(" + Math.round(x) + "% - 32px); top: calc(" + Math.round(y) + "% - 32px);'></div>");
    let iconImage = $("<img src='"+imgSrc+"' style=' position: absolute;'>");
    icon.append(iconImage);
    iconImage.css({
      'top': '20px',
      'left': '20px',
      'height': '24px',
      'width': '24px'
    });
    icon.on({
      mouseenter: function () {
        iconImage.css({
          'top': '0px',
          'left': '0px',
          'height': '64px',
          'width': '64px',
          'max-height': '64px',
          'max-width': '64px'
        });
      },
      mouseleave: function () {
        iconImage.css({
          'top': '20px',
          'left': '20px',
          'height': '24px',
          'width': '24px'
        });
      }
    });
    row.on({
      mouseenter: function () {
        iconImage.css({
          'top': '0px',
          'left': '0px',
          'height': '64px',
          'width': '64px',
          'max-height': '64px',
          'max-width': '64px'
        });
      },
      mouseleave: function () {
        iconImage.css({
          'top': '24px',
          'left': '24px',
          'height': '16px',
          'width': '16px'
        });
      }
    });
    icon.click(function () {
      backdrop.show();
      currentRow = row;
      player.html(content);
    });
    container.append(icon);
  });
  backdrop.append(player);
  container.append(backdrop);
});