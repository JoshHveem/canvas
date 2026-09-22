IMPORTED_FEATURE = {};
async function hoverByClass(classname,colorover,colorout="transparent"){
    let comments = await getElement("." + classname);
    comments.each(function() {
        $(this).mouseover(function() {
            $("." + classname + "").each(function() {
                $(this).css("background-color", colorover);
            });
        });
        $(this).mouseout(function() {
            $("." + classname + "").each(function() {
                $(this).css("background-color", "transparent");
            });
        });
    });
}

async function prepComments(commentSelector) {
    let comments = await getElement(commentSelector);
    let dates = [];
    comments.each(function() {
    let postedAtElement = $(this).find("span.posted_at");
    if (postedAtElement.length === 1) {
        let postedAtGroups = postedAtElement.text().match(/^([A-Z][a-z]+ [0-9]+)/);
        if (postedAtGroups !== null) {
            let postedAt = postedAtGroups[1].replace(" ", "-");
            let classname = "comment-date-" + postedAt;
            $(this).addClass(classname);
            if (!dates.includes(classname)) {
                dates.push(classname);
            }
        }
    }
    });
    for (var d = 0; d < dates.length; d++) {
        let date = dates[d];
        hoverByClass(date, "#FFC");
    }
}

if (/^\/courses\/[0-9]+\/gradebook\/speed_grader/.test(window.location.pathname)) {
  prepComments("div.comment");
}

if (/^\/courses\/[0-9]+\/assignments\/[0-9]+\/submissions\/[0-9]+/.test(window.location.pathname)) {
  prepComments("div.comment_list div.comment");
}