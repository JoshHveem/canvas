$(document).ready(function() {
  // Add the "Conclude All Students" button to aside#right-side
  $('#right-side').append('<a href="#" id="conclude-all-btn" class="btn button-sidebar-wide"><i class="icon-user"></i> Conclude All Students</a>');

  // Attach click event to the button
  $('#conclude-all-btn').on('click', function(event) {
    event.preventDefault(); // Prevent default link behavior
    concludeAllStudents();  // Trigger the concludeAllStudents function
  });
});

// Function to conclude all students and update button text with progress
async function concludeAllStudents() {
  const students = $('.user_list').find('li').toArray();
  const totalStudents = students.length;
  
  // Update the button text to show initial progress
  updateButtonText(0, totalStudents);

  // Use a for loop to ensure sequential execution of concludeStudent
  for (let i = 0; i < totalStudents; i++) {
    var courseId = CURRENT_COURSE_ID;
    var id = $(students[i]).attr('id');
      if (id) {
          enrollmentId = id.replace('enrollment_', '');
    
    // Await the async function concludeStudent for each enrollment
    
          await concludeStudent(courseId, enrollmentId);
      }

    // Update the button text after each student is concluded
    updateButtonText(i + 1, totalStudents);
  }

  // Once done, revert the button text back
  $('#conclude-all-btn').html('<i class="icon-user"></i> Conclude All Students');
}

// Example async concludeStudent function
async function concludeStudent(courseId, enrollmentId) {
    await $.ajax({
      url: `/api/v1/courses/${courseId}/enrollments/${enrollmentId}`,
      type: 'DELETE',
      data: {
        task: 'conclude'
      }
    });
}

// Function to update the button text with the current progress
function updateButtonText(current, total) {
  $('#conclude-all-btn').html(`Concluding ${current} / ${total} Students`);
}
