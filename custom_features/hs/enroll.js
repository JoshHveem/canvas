(async function () {
  IMPORTED_FEATURE = {};
  IMPORTED_FEATURE = {
    initiated: false,
    _init(params = {}) {
      if ($('#enrollhs').length > 0) return;
      let content = $('#content');
      content.empty();
      content.html(`
      <div id='enrollhs'>
        <div v-if='task==="enroll"'>
          <div v-if='studentsFound.length === 0' class='locate-student-container'>
            <p>Locate student(s) by thier sis id. Separate students by a comma, newline, or space.</p>
            <textarea v-model='studentIdInput'></textarea>
            <br>
            <input type='button' @click='searchStudentId()' value='search'>
          </div>
          <div v-else>
          <div v-for='student in studentsFound'>
            <span @click='manageStudentEnrollments(student);' style='cursor: pointer;'>{{student.user_name}} ({{student.address}}) ({{student.terms.length}})</span>
          </div>
          <input type='button' @click='resetSearch()' value='reset'>
          </div>
          <br>
          <div class='term-data-container'>
            <span>Start Date</span>
            <input type='date' v-model='saveTerm.startDate'>
            <span>End Date</span>
            <input type='date' v-model='saveTerm.endDate'>
            <br>
            <span>Term Type</span>
            <select v-model='saveTerm.type'>
              <option>Semester</option>
              <option>Trimester</option>
            </select>
            <br>
            <span>Hours: </span>
            <input type='number' min='30' max='300' step='15' v-model='saveTerm.hours'>
            <br>
            <span>School: </span>
            <select v-model='saveTerm.school'>
              <option value='' selected disabled>-select school-</option>
              <option v-for='school in schools' :value='school'>
                {{school}}
              </option>
            </select>
          </div>
          <div class='select-course-container'>
            <span>Select a course to enroll this student.</span>
            <select class='select-course'>
              <option value='' selected disabled>-select initial course-</option>
              <option v-for='course in courses' :value='course.id'>
                {{course.name}} ({{course.term.name}})
              </option>
            </select>
          </div>
          <input type='button' @click='enroll()' value='enroll'>
          <div class='existing-terms'>
            <div v-for='term in  terms'>
              <span>{{term.startDate}}</span>
              <span>{{term.endDate}}</span>
              <span>{{term.hours}}</span>
              <span>{{term.school}}</span>
            </div>
          </div>
        </div>
        <div v-if='task==="manage"'>
          <h2>{{managedStudent.user_name}}</h2>
          <div @click='task="enroll"' style='cursor: pointer;'>Return To Enrollments</div>
          <div v-for='term in managedStudent.terms' style='padding-bottom: 2rem;'>
            <span style='display: inline-block;'>
              <i @click='deleteTerm(term)' style='font-size: 2rem; cursor: pointer;' class='icon-trash'></i>
            </span>
            <span style='display: inline-block;'>
              <span><b>Start Date</b></span>
              <input type='date' v-model='term.startDate'>
              <span><b>End Date</b></span>
              <input type='date' v-model='term.endDate'>
              <br>
              <span><b>School:</b> {{term.school}} <b>Hours:</b> {{term.hours}}</span>
              <br>
            </span>
            <br>
          </div>
        </div>
      </div>
      `)
      new Vue({
        el: "#enrollhs",
        mounted: async function () {
          let app = this;
          app.dept = CURRENT_DEPARTMENT_ID;
          let courses = await canvasGet('/api/v1/accounts/' + app.dept + '/courses', {
            published: true,
            completed: false,
            blueprint: false,
            state: [
              'available'
            ],
            include: ['term']
          });
          app.courses = courses;
        },
        data: function () {
          return {
            managedStudent: {},
            task: 'enroll',
            schools: [
              'Sky View',
              'Cache High',
              'Bear River',
              'Box Elder',
              'Mountain Crest',
              'Green Canyon',
              'Logan High',
              'Ridgeline',
            ],
            terms: [],
            saveTerm: {},
            studentIdInput: '',
            studentsFound: [],
            studentsNotFound: [],
            dept: '',
            courses: [],
          }
        },
        methods: {
          async searchStudentId() {
            let app = this;
            let ids = app.studentIdInput.split(/[\s,]+/);
            app.studentIdInput = '';
            //look up ids in Canvas
            let studentsFound;
            let studentsNotFound;
            await $.post('https://btech.instructure.com/accounts/' + app.dept + '/user_lists.json', {
              "user_list": ids,
              "v2": true,
              "search_type": "unique_id"
            }, function (data) {
              studentsFound = data.users;
              studentsNotFound = data.missing;
            });

            //create list of ids and send it to server to find existing terms for those students
            let studentList = app.studentListFromStudents(studentsFound); 
            await $.post('https://jhveem.xyz/api/enroll_hs/get_list', {
              students: JSON.stringify(studentList)
            }, function (data) {
              let terms = data;
              for (let i = 0; i < studentsFound.length; i++) {
                studentsFound[i].terms = [];
                for (let j = 0; j < terms.length; j++) {
                  let term = terms[j];
                  if (term.student_id === studentsFound[i].user_id) {
                    studentsFound[i].terms.push(term);
                  }
                }
              }
            });
            app.studentsFound = studentsFound;
            app.studentsNotFound = studentsNotFound;
          },
          resetSearch() {
            let app = this;
            app.studentsFound = [];
            app.studentsNotFound = [];
          },
          studentListFromStudents(obj) {
            let studentList = [];
            for (let i = 0; i < obj.length; i++) {
              let student = obj[i];
              let studentId = student.user_id;
              studentList.push(studentId);
            }
            return studentList;
          },
          async manageStudentEnrollments(student) {
            let app = this;
            app.task = 'manage';
            for (let t = 0; t < student.terms.length; t++) {
              student.terms[t].startDate = app.dateToHTMLDate(student.terms[t].startDate);
              student.terms[t].endDate = app.dateToHTMLDate(student.terms[t].endDate);
            }
            app.managedStudent = student;
          },
          async deleteTerm(term) {
            let app = this;
            await $.delete('https://jhveem.xyz/api/enroll_hs/' + term._id, {
            });
            for (let i = 0; i < app.managedStudent.terms.length; i++) {
              if (app.managedStudent.terms[i]._id === term._id) {
                app.managedStudent.terms.splice(i, 1);
                return;
              }
            }
          },
          dateToHTMLDate(date) {
            date = new Date(date);
            let month = '' + (date.getMonth() + 1);
            if (month.length === 1) month = '0' + month;

            let day = '' + (date.getDate() + 1);
            if (day.length === 1) day = '0' + day;

            let htmlDate = date.getFullYear() + "-" + month + "-" + day;
            return htmlDate;
          },
          async enroll() {
            let app = this;
            let studentList = app.studentListFromStudents(app.studentsFound);
            await $.post('https://jhveem.xyz/api/enroll_hs', {
              'students': JSON.stringify(studentList),
              'term_data': JSON.stringify({
                hours: app.saveTerm.hours,
                type: app.saveTerm.type,
                startDate: app.saveTerm.startDate,
                endDate: app.saveTerm.endDate,
                school: app.saveTerm.school
              }),
            }, function (data) {
              console.log(data);
            })
            location.reload();
          }
        }
      });
    },
  }
})();