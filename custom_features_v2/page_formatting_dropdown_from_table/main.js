/*
  Can only be used in 2 column tables right now.
  The last th row will be used to create header information.
  It will also grab the Caption and put it at the top.
  Simply add the class "btech-dropdown-table" to any table and it'll create a dropdown and hide the original table. 
  Very uninvasive. If it doesn't work, it'll simply use the old table.
*/

(function () {
  let originalTables = $(".btech-dropdown-table");
  originalTables.each(function () {
    let originalTable = $(this);
    let newTable = $("<div></div>");
    let newTableSelect = $("<select style='display: inline-block;'><option style='display:none;' disabled selected value>--select one--</option></select>");
    let newTableContent = $("<div style='padding: 10px; border: 1px solid #000;'></div>");
    let rows = originalTable.find("> tbody > tr");
    let data = {};
    let optionHeader = "";
    let valueHeader = "";
    let caption = originalTable.find("caption").html();
    if (caption !== null) {
      newTable.prepend("<div style='width: 100%; text-align: center;'>" + caption + "</div><br>");
    }
    rows.each(function () {
      let row = $(this);
      let cells = row.find("td");
      if (cells.length > 0) {
        let option = $(cells[0]).text();
        newTableSelect.append("<option value='" + option + "'>" + option + "</option>");
        data[option] = $(cells[1]).html();
      }
      cells = row.find("th");
      if (cells.length > 0) {
        optionHeader = $(cells[0]).text();
        valueHeader = $(cells[1]).text();
      }
    });
    originalTable.before(newTable);
    newTable.append(newTableSelect);
    newTableSelect.before("<label style='padding-right: 5px;'><b>" + optionHeader + " </b> </label>");
    newTableSelect.change(function () {
      var selected = $(this).children("option:selected").val();
      newTableContent.html("<p><b>" + valueHeader + "</b></p><p>" + data[selected] + "</p>");
      newTableContent.show();
    });
    newTable.append(newTableContent);
    newTableContent.hide();
    originalTable.hide();
  });
})();