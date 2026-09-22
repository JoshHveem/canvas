(function () {
  let originalTables = $(".btech-expandable-table");
  originalTables.each(function () {
    let originalTable = $(this);
    let newTable = $("<div class='btech-expandable-container btech-expandable'></div>");
    let rows = originalTable.find("> tbody > tr");
    let data = {};
    let caption = originalTable.find("caption").html();
    if (caption !== null) {
      newTable.prepend("<div style='width: 100%; text-align: center;'>" + caption + "</div><br>");
    }
    rows.each(function () {
      let row = $(this);
      let cells = row.find("td");
      if (cells.length > 0) {
        let tab = $(cells[0]).html();
        let h3 = $("<h3 class='btech-toggler'>" + tab + "</h3>");
        data[tab] = $(cells[1]).html();
        newTable.append(h3);
        let content = $("<div></div>");
        content.append(data[tab]);
        content.hide();
        h3.after(content);
        h3.click(function () {
          content.toggle();
        });
      }
    });
    originalTable.before(newTable);
    //set up custom themes from theme parent if needed
    let themeParent = $('#btech-theme-parent');
    if (themeParent.length === 1) {
      //newTableTabs.css({'background-color': themeParent.css('background-color')});
    }
    //newTableContent.hide();
    originalTable.hide();
  });
})();