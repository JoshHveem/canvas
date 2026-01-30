let studentUserId = 1945202;
let instructorUserId = ENV.current_user_id;
let student = (await canvasGet(`/api/v1/users/${studentUserId}/profile`))?.[0];
let studentNamePieces = student.sortable_name.split(',');
let instructor = (await canvasGet(`/api/v1/users/self/profile`))?.[0];
let progressMeetingURL = `https://btech.jotform.com/252595831342965?studentName[first]=${studentNamePieces[1]}&studentName[last]=${studentNamePieces[0]}&sisUserId=${student.sis_user_id}&studentEmail=${student.primary_email}&instructorEmail=${instructor.primary_email}&canvas_user_id=${student.id}&instructor_id=${instructor.id}`;
console.info(progressMeetingURL);
