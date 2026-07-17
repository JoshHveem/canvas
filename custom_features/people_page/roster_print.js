(async function() {
  //add button
  let button = $("<div></div>"); //need to update this
  //append the button

  //button functionality
  button.click(async function() {
    //remove any old iterations of the roster element.
    $("#roster-print").remove();
    //create roster element
    let report = $("<div id='roster-print'></div>");
    $("body").append(report);

    //get all sections in the course, iterate over each section and student in those sections. Add corresponding html elements to roster element
    let sections = await canvasGet("/api/v1/courses/" + CURRENT_COURSE_ID + "/sections?include[]=students");
    for (let se in sections) {
        let section = sections[se];
        //new div for each section with page break to keep things organized and make it easy for instructor to exclude sections from printed copy by excluding pages from print
        let sectionDiv = $("<div style='page-break-after: always;'></div>");
        report.append(sectionDiv);
        sectionDiv.append("<h2>" + section.name + "</h2>");
        sectionDiv.append("<h3>Check all present.</h3>");
        let studentList = [];
        for (let st in section.students) {
            let student = section.students[st];
            studentList.push(student.sortable_name);   
        }
        studentList.sort(function(a,b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });
        for (let sn in studentList) {
            sectionDiv.append("<p><span style='display: inline-block; width: 15rem;'>" + studentList[sn] + "</span><span><input type='checkbox' style='width: 1rem; height: 1rem;'></span></p>"); 
        }
    }

    //open a window, add the roster element, print it, then close that window
    var a = window.open('', '', 'height=1200, width=800');
    a.document.write('<html><body>');
    a.document.write(report.html());
    a.document.write('</body></html>');
    a.document.close();
    a.print();
    a.close();
  })
})();