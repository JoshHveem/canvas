(function () {
  IMPORTED_FEATURE = {};
  if (/^\/courses\/[0-9]+\/grades\/[0-9]+/.test(window.location.pathname)) {
    IMPORTED_FEATURE = {
      courseId: 0,
      studentId: 0,
      hoursInputHolder: null,
      hoursInput: null,
      hoursButton: null,
      columnId:  0,
      isStudent: true,
      initiated: false,
      async getColumnId() {
        let feature = this;
        await $.get("/api/v1/courses/" + feature.courseId + "/custom_gradebook_columns?include_hidden=true", function (data) {
          for (let i = 0; i < data.length; i++) {
            if (data[i]["title"] === "Hours") {
              feature.columnId = data[i]["id"];
              break;
            }
          }
        });
        if (feature.columnId == 0) {
          await $.post("/api/v1/courses/" + feature.courseId + "/custom_gradebook_columns?column[title]=Hours&column[hidden]=true", function (data) {
            feature.columnId = data.id;
          });
        }
      },

      async setUpElement() {
        let feature = this;
        let wrapper = await getElement("#btech-submissions-between-dates-module");
        let element = wrapper.find("#btech-student-hours");
        let roles = ENV.current_user_roles;
        if (roles.includes('admin') || roles.includes('teacher')) {
          feature.isStudent = false;
        }
        if (feature.isStudent) {
          element.append(`
            <div id='btech-add-hours-hours'>
            </div>
          `);
          feature.studentDisplay = $("#btech-add-hours-hours");
        } else {
          element.append(`
            <div id='btech-add-hours-button'>
              <button>Add Hours</button>
            </div>
            <div id='btech-select-hours' style='display: flex; flex-direction: row;'>
              <span>Daily Hours: </span>
              <input style="height:10px; width:44px;" type="number" step=".5" id="btech-student-hours-input" min="1" max="10"/>
            </div>
          `);
          feature.hoursInputHolder = $("#btech-select-hours");
          feature.hoursInput = $("#btech-student-hours-input");
          feature.hoursButton = $("#btech-add-hours-button");

          feature.hoursButton.on("click", function () {
            feature.hoursInputHolder.show();
            feature.hoursButton.hide();
          });

          feature.hoursInputHolder.hide();
          feature.hoursButton.hide();
          feature.hoursInput.on("change", function () {
            let hours = $(this).val();
            window.STUDENT_HOURS = hours;
            let url = "/api/v1/courses/" + feature.courseId + "/custom_gradebook_columns/" + feature.columnId + "/data/" + feature.studentId;
            $.put(url + "?column_data[content]=" + hours);
          });
        }
      },

      async _init() {
        let feature = this;
        feature.courseId = ENV.courses_with_grades[0].id;
        feature.studentId = ENV.students[0].id;
        await getElement("#btech-submissions-between-dates-module");
        
        feature.setUpElement();

        await feature.getColumnId();
        let url = "/api/v1/courses/" + feature.courseId + "/custom_gradebook_columns/" + feature.columnId + "/data?include_hidden=true";
        try {
          await $.get(url).done(function(data) {
            for (let i = 0; i < data.length; i++) {
              let _id = data[i]["user_id"];
              let _val = parseFloat(data[i]["content"]);
              if (parseInt(_id) === parseInt(feature.studentId)) {
                window.STUDENT_HOURS = _val;
                if (feature.isStudent) {
                  feature.studentDisplay.text(_val);

                } else {
                  feature.hoursInput.val(_val);
                }
              }
            }
          });
        } catch (err) {
          console.log(err);
        }
        if (window.STUDENT_HOURS === 0) {
          feature.hoursInputHolder.hide();
          feature.hoursButton.show();
        } else {
          feature.hoursInputHolder.show();
          feature.hoursButton.hide();
        }
      }
    }
  }
})();