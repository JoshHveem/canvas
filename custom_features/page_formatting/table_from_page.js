(function () {
  function dupStyle(to, from) {
    to.attr('style', from.attr('style'));
    to.attr('border', from.attr('border'));
    to.attr('cellspacing', from.attr('cellspacing'));
    to.attr('cellpadding', from.attr('cellpadding'));
  }

  let childTables = $('.btech-table-from-page');
  if (childTables.length > 0) {
    let courseId = ENV.COURSE_ID;
    $.get('/api/v1/courses/' + courseId + '/pages/parts-list-master', function (data) {
      let pBody = $('<div class=".page-body">' + data.body + '</div>');
      let sourceTable = pBody.find('table');
      rowRef = {};
      //set style of new table to style of source table
      sourceRows = sourceTable.find('tbody tr');
      sourceRows.each(function () {
        let row = $(this);
        let key = $(row.find('td')[0]).text().toLowerCase();
        rowRef[key] = row;
      });

      childTables.each(function () {
        //Set up table
        let newTable = $('<table></table>');
        dupStyle(newTable, sourceTable);
        newTable.css('height', '');

        //pull head directly from source
        let thead = sourceTable.find('thead').clone();
        newTable.append(thead);

        //Create a new body and duplicate style from source
        let tbody = $("<tbody></tbody>");
        dupStyle(tbody, sourceTable.find('tbody'));
        newTable.append(tbody);

        //Go row by from and add in same order as what appears on page
        let childTable = $(this);
        let childRows = childTable.find('tbody tr');
        childRows.each(function () {
          let row = $(this);
          let key = $(row.find('td')[0]).text().toLowerCase();
          if (key in rowRef) {
            tbody.append(rowRef[key].clone());
          }
        });

        //add the newly created table to the page
        childTable.after(newTable);
        childTable.remove();
      })
    });
  }
})();