let syncButton = $(`<span class="btn"><span>Sync</span></span>`);
$(".buttons").prepend(syncButton);
syncButton.click(async () => {
    function dupStyle(to, from) {
        to.attr('style', from.attr('style'));
        to.attr('border', from.attr('border'));
        to.attr('cellspacing', from.attr('cellspacing'));
        to.attr('cellpadding', from.attr('cellpadding'));
    }
    
    
    let loadBar = $(`
        <div class='btech-modal' style='display: inline-block;'>
            <!-- ERASE THE DISPLAY PIECE BEFORE GOING LIVE -->
            <div class='btech-modal-content' style='max-width: 500px;'>
                <div class='btech-modal-content-inner'>
                    <div>Updating all references to Parts List. Please do not leave the page until this is complete.</div>
                    <div id="update-parts-list-progress-bar"></div>
                </div>
            </div>
        </div>
    `);
    
    $("body").append(loadBar);
    $("#update-parts-list-progress-bar").progressbar({
        value: 0
    });
    
    let rowRef = {};
    let sourceTable;
    $.get(`/api/v1/courses/${ENV.COURSE_ID}/pages/parts-list-master`, function (data) {
          let pBody = $('<div class=".page-body">' + data.body + '</div>');
          sourceTable = pBody.find('table');
        //set style of new table to style of source table
        sourceRows = sourceTable.find('tbody tr');
        sourceRows.each(function () {
            let row = $(this);
            let key = $(row.find('td')[0]).text().toLowerCase();
            rowRef[key] = row;
        });
    })
    let pages = await canvasGet(`/api/v1/courses/${ENV.COURSE_ID}/pages`);
    for (let p in pages) {
        let pData = pages[p];
        let page = (await $.get(`/api/v1/courses/${ENV.COURSE_ID}/pages/${pData.url}`));
        let html = `<div>${page.body}</div>`;
        let body = $(html);
        let tables = body.find(`table.btech-table-from-page-source-parts-list-master`);
        if (tables.length > 0) {
            let childTable = $(tables[0]);
            let newTable = $('<table class="btech-table-from-page-source-parts-list-master"></table>');
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
            await $.put(`/api/v1/courses/${ENV.COURSE_ID}/pages/${page.url}`, {
                wiki_page: {
                    body: body[0].innerHTML
                }
            });
            body.remove();
        }
        $("#update-parts-list-progress-bar").progressbar({
            value: (p / pages.length) * 100
        })
        if (p == pages.length - 1) {
            loadBar.remove();
        }
    }
});