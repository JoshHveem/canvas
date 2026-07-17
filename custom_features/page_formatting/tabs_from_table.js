(function () {
  let originalTables = $(".btech-tabs-table");
  originalTables.each(function () {
    let originalTable = $(this);
    let newTable = $("<div class='btech-tabs-container'></div>");
    let newTableTabsContainer = $("<div class='btech-tabs'></div>");
    let newTableTabs = $("<ul style='list-style-type:none;'></ul>");
    let newTableContent = $("<div style='padding: 10px; background-color: #fff;' ></div>");
    let rows = originalTable.find("> tbody > tr");
    let data = {};
    let optionHeader = "";
    let valueHeader = "";
    let caption = originalTable.find("caption").html();
    if (caption !== null) {
      newTable.prepend("<div style='width: 100%; text-align: center;'>" + caption + "</div><br>");
    }
    let checkFirst = false;
    rows.each(function () {
      let row = $(this);
      let cells = row.find("td");
      if (cells.length > 0) {
        let tab = $(cells[0]).text();
        let li = $("<li>" + tab + "</li>");
        data[tab] = $(cells[1]).html();
        if (checkFirst === false) {
          newTableContent.html(data[tab]);
          li.addClass("active");
          checkFirst = true;
        }
        li.click(function () {
          newTableContent.html(data[tab]);
          newTableContent.show();
          newTableTabs.find('li').each(function () {
            $(this).removeClass("active");
          });
          $(this).addClass("active");
        });
        newTableTabs.append(li);
      }
      cells = row.find("th");
      if (cells.length > 0) {
        optionHeader = $(cells[0]).text();
        valueHeader = $(cells[1]).text();
      }
    });
    originalTable.before(newTable);
    newTableTabsContainer.append(newTableTabs);
    newTable.append(newTableTabsContainer);
    newTable.append(newTableContent);
    //set up custom themes from theme parent if needed
    let themeParent = $('#btech-theme-parent');
    if (themeParent.length === 1) {
      //newTableTabs.css({'background-color': themeParent.css('background-color')});
    }
    //newTableContent.hide();
    originalTable.hide();
  });
})();