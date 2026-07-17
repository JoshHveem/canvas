async function getSubmissions(page="1", submissions=[]) {
  let feature = this;
  let url = "/api/v1/courses/"+feature.courseId+"/students/submissions";
  let data_obj = {
      "per_page": 100,
      "page": page,
      "student_ids": [feature.studentId]
  };
  let nextPage = "";
  await $.get(url, data_obj, function(data, status, xhr) {
      //add assignments to the list
      submissions = submissions.concat(data);
      //see if there's another page to get
      let rNext = /<([^>]*)>; rel="next"/;
      let nextMatch = xhr.getResponseHeader("Link").match(rNext);
      if (nextMatch !== null) {
          let next = nextMatch[1];
          nextPage = next.match(/page=(.*?)&/)[1];
      }
  });
  if (nextPage !== "") {
      return await feature.getSubmissions(nextPage, submissions);
  }
  return submissions;
}
