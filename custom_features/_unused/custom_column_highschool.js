/*
//Need to add in check to see if column exists. If not, create the column using line below
$.post("api/v1/courses/<course id>/custom_gradebook_columns?column[title]=High School&column[hidden]=false");
*/
var hsColumnId = 0;
var courseId = 489751;
var userId = 1897391;
$.get("/api/v1/courses/" + courseId + "/custom_gradebook_columns?include_hidden=true", function(data) {
    for (let i = 0; i < data.length; i++) {
        if (data[i]["title"] === "High School") {
            hsColumnId = data[i]["id"];
            break;
        }
    }
    let url = "/api/v1/courses/" + courseId + "/custom_gradebook_columns/" + hsColumnId + "/data";
    $.get(url, function(data) {
        for (let i = 0; i < data.length; i++) {
            let _id = data[i]["user_id"];
            let _val = data[i]["content"];
            if (_id === userId) {
                $("#btech-hs-dropdown-holder").show();
                $("#btech-hs-dropdown").val(_val).trigger("chosen:updated");
                $("#btech-hs-check").prop("checked", true);
            }
        }
    });
});
var highschoolList = [
    "Unspecified",
    "Bear River",
    "Box Elder",
    "Green Canyon",
    "Logan",
    "Malad",
    "Mountain Crest",
    "Rich",
    "Ridgeline",
    "Sky View",
    "West Campus",
    "Other"
];
$($("#content h1")[0]).append(`
<span id="btech-hs-dropdown-holder">
<select id="btech-hs-dropdown"></select>
</span>
`);
$($("#content h1")[0]).after(`
<input type="checkbox" id="btech-hs-check" value="hs"><span style="font-size: 14px"> Highschool Student?</span>
`);
var dropdown = $("#btech-hs-dropdown");
for (var i = 0; i < highschoolList.length; i++) {
    let name = highschoolList[i];
    dropdown.append('<option value="'+name+'">'+name+'</option>');
}
dropdown.on("change", function() {
    let hs = $(this).find("option:selected").text();
    let url = "/api/v1/courses/" + courseId + "/custom_gradebook_columns/" + hsColumnId + "/data/" + userId;
    $.put(url + "?column_data[content]="+hs);
});

$("#btech-hs-dropdown-holder").hide();
$("#btech-hs-check").on("click", function() {
    let checked = $(this).prop("checked");
    let url = "/api/v1/courses/" + courseId + "/custom_gradebook_columns/" + hsColumnId + "/data/" + userId;
    if (checked) {
        $("#btech-hs-dropdown-holder").show();
        $.put(url + "?column_data[content]=Unspecified");
    } else {
        $("#btech-hs-dropdown-holder").hide();
        $.put(url + "?column_data[content]=");
    }
});
