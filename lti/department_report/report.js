//Courses w/ 0% progress but still enrolled are showing as gray. Have something other than 0% progress when no enrollment is found.


//include a last updated list
//SHOW STUDENT STATUS FROM JENZABAR, IE ACTIVE, ON HOLD, DROPPED, GRADUATED, ETC.
//SHOW DATE OF SUBMISSIONS WHEN YOU HOVER OVER SUBMISSION BAR GRAPH BAR. MAYBE ALSO SHOW DAYS SINCE LAST SUBMISSION SOMEWHERE ON THAT REPORT

//HS VERSION OF REPORT
////MAYBE MAKE IT IT'S OWN DROP DOWN IN ADDITION TO DIFFERENT DEPARTMENTS. NO TREES, JUST WHATEVER THEY'RE IN RIGHT NOW
////OR COULD HAVE THEM ALL IN CURRENT TREE FOR THAT DEPARTMENT
//EXCLUDE COURSES COMPLETED AS HS STUDENT WHEN CALCULATING ENROLLED/COMPLETED HOURS

//SETTINGS TAB
////SHOW DOT GRAPH INSTEAD OF BAR
////SHOW ONLY STUDENTS ACTIVE IN A COURSE RIGHT NOW
////SHOW ONLY STUDENTS BEHIND ON SUBMISSIONS
////CHANGE DIFFERENT INDICATORS (SAVE THESE IN USER DATA)
//////IE CHANGE GRADE FLAGS, DAYS IN COURSE FLAGS, AND DAYS SINCE LAST SUBMISSION FLAGS
////TOGGLE ON THE FEATURE TO PARTIALLY FILL A BAR DEPENDING ON PROGRESS IN THAT COURSE. MAKE BACKGROUND BLACK AND THEN PARTIALLY SHADE, DEFAULT IS OFF THOUGH
////TOGGLE BETWEEN FIRST NAME AND LAST NAME FIRST, RESORT ON TOGGLE
////Add an anonymize option that gives students random names. This way the tool can be demoed without showing student name data

(async function () {
  async function delay(ms) {
    // return await for better async stack trace support in case of errors.
    return await new Promise(resolve => setTimeout(resolve, ms));
  }
  async function getElement(selectorText, iframe = "") {
    let element;
    if (iframe === "") {
      element = $(selectorText);
    } else {
      element = $(iframe).contents().find(selectorText);
    }
    if (element.length > 0 && element.html().trim() !== "") {
      return element;
    } else {
      await delay(250);
      return getElement(selectorText, iframe);
    }
  }
  this.APP = new Vue({
    el: '#canvas-department-report-vue',
    mounted: async function () {
      $('#canvas-department-report-vue').css({
        visibility: 'visible'
      });
      let app = this;
      let dept = '' + CURRENT_DEPARTMENT;

      //import json files
      await app.loadJsonFile('users');
      await app.loadJsonFile('trees');
      await app.loadJsonFile('canv_dept_to_jenz');
      await app.loadJsonFile('dept_code_to_name');
      await app.loadJsonFile('submissions');
      for (let userId in app.json.submissions) {
        let submissions = {};
        app.userSubmissionDates[userId] = {
          'list': [],
          'last': null
        };
        let userSubmissionDates = app.json.submissions[userId];
        for (let i in userSubmissionDates) {
          let dateString = userSubmissionDates[i];
          let longDate = new Date(dateString);
          let date = new Date(longDate.getFullYear(), longDate.getMonth(), longDate.getDate());
          if (app.userSubmissionDates[userId]['last'] === null) {
            app.userSubmissionDates[userId]['last'] = date;
          } else if (app.userSubmissionDates[userId]['last'] < date) {
            app.userSubmissionDates[userId]['last'] = date;
          }
          if (!(date in submissions)) {
            submissions[date] = 0;
          }
          submissions[date] += 1;
        }
        for (let dateString in submissions) {
          let count = submissions[dateString];
          app.userSubmissionDates[userId]['list'].push({
            'date': dateString,
            'count': count
          })
        }
      }

      //get list of departments available to this sub account
      let availableDepartments = [];
      for (let i in app.json.canv_dept_to_jenz[dept]) {
        let departmentCode = app.json.canv_dept_to_jenz[dept][i];
        if (departmentCode in app.json.trees) {
          availableDepartments.push(departmentCode);
        }
      }

      //Sort departments alphabetically
      availableDepartments.sort(function (a, b) {
        let deptNameA = app.json.dept_code_to_name[a].name;
        let deptNameB = app.json.dept_code_to_name[b].name;
        return deptNameA.localeCompare(deptNameB);
      });
      app.availableDepartments = availableDepartments;
      app.currentDepartment = app.availableDepartments[0];

      app.loadDepartmentUsers();
      app.loading = false;
    },

    computed: {
      electiveCourses: function () {},
      coreCourses: function () {}
    },

    updated: function () {},

    data: function () {
      return {
        showProgressRatio: true,
        loading: true,
        showStudent: 'all',
        loadingStudentSubmissionsInProgress: false,
        json: {},
        usersByYear: {},
        userSubmissionDates: {},
        currentDepartment: '',
        coreCourses: [],
        electiveCourses: [],
        availableDepartments: [],
        svg: null,
        enrollments: {}, //or submission data or student data or somewhere else to hold all of the data pulling from canvas and saving it for reuse.
        colors: {
          base: '#334',
          black: '#000000',
          white: '#ffffff',
          red: 'rgb(217, 83, 79)',
          orange: 'rgb(229, 128, 79)',
          yellow: 'rgb(240, 173, 78)',
          green: 'rgb(92, 184, 92)',
          blue: 'rgb(91, 192, 222)',
          gray: '#E0E0E0',
          noProgress: '#E0E0E0',
          complete: '#5BC0DE',
          badDate: '#D9534F',
          warningDate: '#F0AD4E',
          goodDate: '#5CB85C',
        },
        loadingStudentReport: false,
        courseTypes: ['core', 'elective', 'other'],
        scrollTop: 0, //used to save the scroll location of the main screen before going into the student report
        previousScreen: 'all'
      }
    },
    methods: {
      getCourseProgressBarColor(user, course, courseCode, courseType) {
        let app = this;
        let progress;
        if (courseCode in app.json.users[user.id].courses) {
          progress = app.json.users[user.id].courses[courseCode].progress;
        } else {
          return app.colors.gray;
        }
        if (progress >= 100) return app.colors.complete;
        // let start = course.start;
        let userCourseData = app.json.users[user.id].courses[courseCode];
        let start = new Date();
        if (userCourseData.start !== null) {
          start = new Date(userCourseData.start);
        }

        let diffDays = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
        if (diffDays <= 90) return app.colors.green;
        if (diffDays <= 180) return app.colors.yellow;
        return app.colors.red;
      },

      loadDepartmentUsers() {
        let app = this;
        let usersByYear = {};
        for (let year in app.json['trees'][app.currentDepartment]) {
          let program = app.json['trees'][app.currentDepartment][year];
          let users = program['users'];
          let userList = [];
          for (let i in users) {
            let sis_id = users[i];
            if (sis_id in app.json['users']) {
              let user = app.json['users'][sis_id]
              let name = user.sortable_name;
              let avatarUrl = user.avatar_url;
              console.log(user);
              if (name !== '') {
                let courses = user.courses;
                let entryDate = new Date(user.entry_date);
                let core = [];
                let elective = [];
                let other = [];
                // let completedHours = user.graded_hours;
                let enrolledHours = user.enrolled_hours;
                let completedHours = 0;
                for (let courseCode in courses) {
                  let course = courses[courseCode];
                  if (course.registered_hours !== undefined) {
                    // enrolledHours += course.registered_hours;
                    if (course.progress >= 100) {
                      completedHours += course.hours;
                    } else {
                      let courseCompletedHours = course.hours * (course.progress * .01);
                      completedHours += courseCompletedHours;
                    }
                  }

                  let courseData = {
                    'code': courseCode,
                    'course_id': course.course_id,
                    'last_activity': course.last_activity,
                    'progress': course.progress,
                    'start': course.start,
                    'hours': course.hours
                  }
                  if (courseCode in program.courses.core) {
                    core.push(courseData);
                  } else if (courseCode in program.courses.elective) {
                    elective.push(courseData);
                  } else {
                    other.push(courseData);
                  }

                }
                userList.push({
                  'name': name,
                  'id': sis_id,
                  'avatar_url': avatarUrl,
                  'core': core,
                  'elective': elective,
                  'other': other,
                  'enrolledHours': Math.round(enrolledHours),
                  'completedHours': Math.round(completedHours)
                });
              }
            }
          }

          userList.sort(function (a, b) {
            let aName = a.name;
            if (aName != undefined) aName = aName.toLowerCase();
            else aName = '';

            let bName = b.name;
            if (bName != undefined) bName = bName.toLowerCase();
            else bName = '';

            return aName.localeCompare(bName);
          });

          usersByYear[year] = userList;
        }
        app.usersByYear = usersByYear;

        //Don't want to start multiple of these
        if (app.loadingStudentSubmissionsInProgress === false) {
          // app.loadNextStudentSubmissionData();
        }
        app.initGraphs();
      },

      calcDepartmentTimeText(user) {
        let app = this;
        if (user.completedHours === undefined || user.completedHours === 0) return "N/A";
        return Math.round((user.enrolledHours / user.completedHours) * 100) + "%";
      },

      calcDepartmentTimeColorBg(user) {
        let app = this;
        if (user.completedHours === undefined || user.completedHours === 0) return app.colors.gray;
        let timePerc = Math.round((user.enrolledHours / user.completedHours) * 100);
        if (timePerc <= 100) return app.colors.green;
        if (timePerc <= 150) return app.colors.yellow;
        return app.colors.red;
      },

      calcDepartmentScoreText(user) {
        let app = this;
        let averageScore = app.json.users[user.id].average_score;
        if (averageScore === undefined) return "N/A";
        return Math.round(averageScore * 100) + "%";
      },

      calcDepartmentScoreColorBg(user) {
        let app = this;
        let averageScore = app.json.users[user.id].average_score;
        if (averageScore === undefined) return app.colors.gray;
        let score = Math.round(averageScore * 100);
        if (score < 60) return app.colors.red;
        if (score < 80) return app.colors.yellow;
        return app.colors.green;
      },

      calcDepartmentScoreColorFont(user) {
        let app = this;
        let averageScore = app.json.users[user.id].average_score;
        if (averageScore === undefined) return "#000000";
        return "#FFFFFF";
      },

      //Specifically set up to be used when a new section is selected.
      //Cycles through all users, sees if any info has been loaded and a graph doesn't exist, if yes, create the graph for it.
      initGraphs() {
        let app = this;
        app.loadingStudentSubmissionsInProgress = true;
        let usersByYear = app.usersByYear;
        for (let year in usersByYear) {
          let users = usersByYear[year];
          for (let i in users) {
            let user = users[i];
            let sisId = user.id;
            let userId = app.json.users[sisId].canvas_id;
            if (app.userSubmissionDates[sisId] != undefined) {
              let graph = new SubmissionsGraphBar();
              graph._initSmall(app, userId, sisId, "btech-user-submission-summary-" + userId);
            }
          }
        }
      },


      async openStudentReport(userId, sisId) {
        let app = this;
        let graph = new SubmissionsGraphBar();
        document.title = app.showStudent.name + " Summary"
        graph._init(app, userId, sisId);
        let donut = new ProgressGraphDonut();
        donut._init(app, userId, sisId);
        app.scrollTop = $(window).scrollTop();
        $(window).scrollTop(0);
      },

      closeStudentReport() {
        document.title = "Department Report"
        let app = this;
        app.showStudent = 'all';
        app.$nextTick(function () {
          $(window).scrollTop(app.scrollTop);
        })
      },

      async loadJsonFile(name) {
        let app = this;
        let jsonUrl = 'https://jhveem.xyz'+ROUTE_PATH+'/report_data/' + name;
        let jsonData = {};
        await $.post(jsonUrl, function (data) {
          jsonData = data;
        });
        app.json[name] = jsonData;
      },

      getCourseURL(user, courseCode) {
        let app = this;
        let userData = app.json.users[user.id];
        let courseData = userData.courses[courseCode];
        if (courseData === undefined) return "/";
        return 'https://btech.instructure.com/courses/' + courseData.canvas_id + '/grades/' + userData.canvas_id
      },

      getUserCourseProgress(userId, courseCode) {
        let app = this;
        let user = app.json.users[userId];
        if (courseCode in user.courses) {
          return user.courses[courseCode].progress;
        }
        return 0;
      },

      checkIncludeCourse(courseType, courseCodeInCourses) {
        if (courseType === 'core' || courseCodeInCourses) return "inline-block";
        return "none";
      }
    }
  })

  class SubmissionsGraphBar {
    constructor() {
      let graph = this;
      graph.app = {};
      graph.graphSettings = {
        months: 6,
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        endDate: new Date(),
        x: null,
        y: null,
        barWidth: 1,
        maxY: 25,
        margin: {}
      }
    }
    async _initSmall(app, userId, sisId, graphElId, w = 240, h = 24) {
      this.app = app;
      let graph = this;
      graph.userId = userId;
      graph.sisId = sisId;

      //set graph settings 
      graph.graphSettings.months = 6;
      graph.graphSettings.startDate = new Date(new Date().setMonth(new Date().getMonth() - graph.graphSettings.months));
      graph.graphSettings.endDate = new Date();
      graph.graphSettings.barWidth = 1;
      graph.graphSettings.maxY = 5;
      graph.graphSettings.margin = {
        top: 1,
        bottom: 1,
        left: 1,
        right: 1,
      };

      let submissions = app.userSubmissionDates[sisId]['list'].filter(date => new Date(date.date) >= graph.graphSettings.startDate);
      app.loadingStudentReport = false;

      //Begin setting up the graph
      let barColor = graph.getBarColor();
      let el = await getElement("#" + graphElId);
      el.empty();
      h = d3.select('#' + graphElId).node().parentNode.getBoundingClientRect().height;

      var width = w - graph.graphSettings.margin.left - graph.graphSettings.margin.right;
      var height = h - graph.graphSettings.margin.top - graph.graphSettings.margin.bottom;

      var x = d3.scaleTime()
        .domain([graph.graphSettings.startDate, graph.graphSettings.endDate])
        .range([0, width]);
      graph.graphSettings.x = x;

      var y = d3.scaleLinear()
        .domain([0, graph.graphSettings.maxY])
        .range([height, 0]);

      graph.graphSettings.y = y;


      graph.svg = d3.select('#' + graphElId).append('svg')
        .attr('class', 'chart')
        .attr("style", "vertical-align: top;")
        .attr('width', w)
        .attr('height', h);


      var chart = graph.svg.append('g')
        .classed('graph', true)
        .attr('transform', 'translate(' + graph.graphSettings.margin.left + ',' + graph.graphSettings.margin.top + ')');



      chart.append('g')
        .classed('x axis', true)
        .attr("transform", "translate(0, " + height + ")")
        .call(
          d3.axisBottom(x)
          .tickFormat("")
          .tickSize(0)
          .ticks(d3.timeMonth.every(1))
        );

      chart.append('g')
        .classed('y axis', true)
        .call(d3.axisLeft(y)
          .tickFormat("")
          .tickSize(0)
          .ticks(graph.graphSettings.maxY)
        );

      graph.graphSettings.barWidth = Math.floor(w / (graph.graphSettings.months * 30)) + 1;

      graph.svg
        .selectAll("whatever")
        .data(submissions)
        .enter()
        .append("rect")
        .attr("x", function (d) {
          return graph.xPlot(d, x)
        })
        .attr("width", graph.graphSettings.barWidth)
        .attr("y", function (d) {
          return graph.yPlot(d, y);
        })
        .attr("height", function (d) {
          return height - graph.yPlot(d, y) + graph.graphSettings.margin.top;
        })
        .attr("fill", barColor);

      return;
    }

    async _init(app, userId, sisId, graphElId = 'btech-department-report-student-submissions-graph', w = 800, h = 240) {
      this.app = app;
      let graph = this;
      graph.userId = userId;
      graph.sisId = sisId;
      //Set margins
      graph.graphSettings.months = 6;
      graph.graphSettings.startDate = new Date(new Date().setMonth(new Date().getMonth() - graph.graphSettings.months));
      graph.graphSettings.endDate = new Date();
      graph.graphSettings.barWidth = 1;
      graph.graphSettings.maxY = 15;
      graph.graphSettings.margin = {
        top: 30,
        bottom: 40,
        left: 50,
        right: 20,
      };

      let submissions = app.userSubmissionDates[sisId]['list'].filter(date => new Date(date.date) >= graph.graphSettings.startDate);
      app.loadingStudentReport = false;

      //Begin setting up the graph
      let barColor = graph.getBarColor();
      let el = $('#' + graphElId);
      el.empty();

      var width = w - graph.graphSettings.margin.left - graph.graphSettings.margin.right;
      var height = h - graph.graphSettings.margin.top - graph.graphSettings.margin.bottom;

      var x = d3.scaleTime()
        .domain([graph.graphSettings.startDate, graph.graphSettings.endDate])
        .range([0, width]);
      graph.graphSettings.x = x;

      var y = d3.scaleLinear()
        .domain([0, graph.graphSettings.maxY])
        .range([height, 0]);

      graph.graphSettings.y = y;


      graph.svg = d3.select('#' + graphElId).append('svg')
        .attr('class', 'chart')
        .attr('width', w)
        .attr('height', h);

      var chart = graph.svg.append('g')
        .classed('graph', true)
        .attr('transform', 'translate(' + graph.graphSettings.margin.left + ',' + graph.graphSettings.margin.top + ')');


      chart.append('g')
        .classed('x axis', true)
        .attr("transform", "translate(0, " + height + ")")
        .call(
          d3.axisBottom(x)
          .tickFormat(d3.timeFormat("%Y-%m"))
          .ticks(d3.timeMonth.every(1))
        );

      chart.append('g')
        .classed('y axis', true)
        .call(d3.axisLeft(y)
          .ticks(graph.graphSettings.maxY));

      graph.graphSettings.barWidth = Math.floor(w / (graph.graphSettings.months * 30)) + 1;

      graph.svg
        .selectAll("whatever")
        .data(submissions)
        .enter()
        .append("rect")
        .attr("x", function (d) {
          return graph.xPlot(d, x)
        })
        .attr("width", graph.graphSettings.barWidth)
        .attr("y", function (d) {
          return graph.yPlot(d, y);
        })
        .attr("height", function (d) {
          return height - graph.yPlot(d, y) + graph.graphSettings.margin.top;
        })
        .attr("fill", barColor);

      graph.svg.append("text")
        .attr("transform", "translate(" + (w / 2) + " ," + (h) + ")")
        .style("text-anchor", "middle")
        .text("Date Submitted");

      graph.svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x", 0 - ((height + graph.graphSettings.margin.top) / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Number of Submissions");
    }

    getBarColor() {
      let app = this.app;
      let graph = this;
      let userId = graph.userId;
      let sisId = graph.sisId;
      let barColor = app.colors.green;
      let daysSinceLastSubmission = Math.floor((new Date() - new Date(app.userSubmissionDates[sisId]['last'])) / (1000 * 60 * 60 * 24));
      if (daysSinceLastSubmission >= 7) barColor = app.colors.yellow;
      if (daysSinceLastSubmission >= 10) barColor = app.colors.red;
      return barColor;
    }

    // Create Event Handlers for mouse
    handleMouseOver(mouse, submission) { // Add interactivity
      let app = this.app;
      let graph = this;
      if (submission.id === undefined) {
        submission.id = genId();
      }
      // Use D3 to select element, change color and size
      d3.select(mouse.target)
        .attr("fill", "#1C91A4");

      // Specify where to put label of text
      graph.svg.append("text")
        .attr("id", "t-" + submission.id) // Create an id for text so we can select it later for removing on mouseout
        .attr("x", function () {
          return graph.xPlot(submission, graph.graphSettings.x);
        })
        .attr("y", function () {
          return graph.yPlot(submission, graph.graphSettings.y);
        })
        .text(function () {
          return submission.assignment.name; // Value of the text
        });
    }

    handleMouseOut(mouse, submission) {
      let app = this.app;
      let graph = this;
      // Use D3 to select element, change color back to normal
      d3.select(mouse.target)
        .attr("fill", app.colors.complete);

      // Select text by id and then remove
      d3.select("#t-" + submission.id).remove(); // Remove text location
    }

    handleMouseClick(mouse, submission) {
      let app = this.app;
      let graph = this;
      var newWindow = window.open(submission.preview_url);
    }
    xPlot(d, x) {
      let app = this.app;
      let graph = this;
      let xVal = x(new Date(d.date)) + graph.graphSettings.margin.left;
      return xVal;
    }

    yPlot(d, y) {
      let app = this.app;
      let graph = this;
      let yVal = y(d.count);
      return yVal;
    }
  }

  class ProgressGraphDonut {
    constructor() {
      let graph = this;
      graph.app = {};
      graph.graphSettings = {
        width: 0,
        height: 0,
        fillTime: 2000,
      }
    }
    fillCertificateHours(graphElId, certificateHours) {
      let graph = this;
      const svg = d3.select("#" + graphElId).append("svg").attr("width", graph.width).attr("height", graph.height);
      const g = svg.append("g").attr("transform", `translate(${graph.width / 2}, ${graph.height / 2})`);
      const data = [certificateHours]
      const radius = Math.min(graph.width, graph.height) / 2;
      const colors = [graph.app.colors.gray];

      const arc = d3
        .arc()
        .outerRadius(radius - 10)
        .innerRadius(radius / 2);

      const pie = d3.pie();

      const pied_data = pie(data);

      const arcs = g
        .selectAll(".arc")
        .data(pied_data)
        .join((enter) => enter.append("path").attr("class", "arc").style("stroke", "white"));
      arcs.attr("d", arc).style("fill", (d, i) => {
        return colors[i];
      });
    }

    fillEnrolledHours(graphElId, certificateHours, enrolledHours, completedHours) {
      let graph = this;
      const svg = d3.select("#" + graphElId).append("svg").attr("width", graph.width).attr("height", graph.height).style("position", "absolute").style("left", "0");
      const g = svg.append("g").attr("transform", `translate(${graph.width / 2}, ${graph.height / 2})`);
      //make sure you don't fill more than the certificate has hours
      let fillHours = certificateHours;
      if (enrolledHours < certificateHours) fillHours = enrolledHours;

      const data = [fillHours]
      const radius = Math.min(graph.width, graph.height) / 2;
      const colors = [graph.app.colors.red];

      let innerRadius = radius / 2;
      // if (enrolledHours < completedHours) innerRadius -= 5;
      innerRadius -= 5;
      const arc = d3
        .arc()
        .outerRadius(radius - 10)
        .innerRadius(innerRadius);

      const pie = d3.pie();

      const pied_data = pie(data);
      pied_data[0].endAngle = Math.PI * 2 * (fillHours / certificateHours);

      const arcs = g
        .selectAll(".arc")
        .data(pied_data)
        .join((enter) => enter.append("path").attr("class", "arc").style("stroke", "white"));

      let generator = d3.pie();
      let angleInterpolation = d3.interpolate(generator.startAngle()(), generator.endAngle()());

      let initCompleted = false;
      //animate fill
      arcs.transition()
        .duration(graph.graphSettings.fillTime * (fillHours / certificateHours))
        .attrTween("d", d => {
          let originalEnd = d.endAngle;
          return t => {
            let currentAngle = angleInterpolation(t);
            if (currentAngle < d.startAngle) {
              return "";
            }

            d.endAngle = Math.min(currentAngle, originalEnd);
            if (!initCompleted && (currentAngle > (originalEnd / 2))) {
              initCompleted = true;
              graph.fillCompletedHours(graphElId, certificateHours, completedHours);
            }

            return arc(d);
          };
        })
        .on("end", function () {
          // graph.fillCompletedHours(graphElId, certificateHours, completedHours);
        });
      arcs.attr("d", arc).style("fill", (d, i) => {
        return colors[i];
      });
    }

    fillCompletedHours(graphElId, certificateHours, completedHours) {
      let graph = this;
      const svg = d3.select("#" + graphElId).append("svg").attr("width", graph.width).attr("height", graph.height).style("position", "absolute").style("left", "0");
      const g = svg.append("g").attr("transform", `translate(${graph.width / 2}, ${graph.height / 2})`);
      //make sure you don't fill more than the certificate has hours
      let fillHours = certificateHours;
      if (completedHours < certificateHours) fillHours = completedHours;

      const data = [fillHours]
      const radius = Math.min(graph.width, graph.height) / 2;
      const colors = [graph.app.colors.blue];

      let innerRadius = radius / 2;
      const arc = d3
        .arc()
        .outerRadius(radius - 10)
        .innerRadius(innerRadius);

      const pie = d3.pie();

      const pied_data = pie(data);
      pied_data[0].endAngle = Math.PI * 2 * (fillHours / certificateHours);

      const arcs = g
        .selectAll(".arc")
        .data(pied_data)
        .join((enter) => enter.append("path").attr("class", "arc").style("stroke", "white"));

      let generator = d3.pie();
      let angleInterpolation = d3.interpolate(generator.startAngle()(), generator.endAngle()());

      //animate fill
      arcs.transition()
        .duration(graph.graphSettings.fillTime * (fillHours / certificateHours))
        .attrTween("d", d => {
          let originalEnd = d.endAngle;
          return t => {
            let currentAngle = angleInterpolation(t);
            if (currentAngle < d.startAngle) {
              return "";
            }

            d.endAngle = Math.min(currentAngle, originalEnd);

            return arc(d);
          };
        })
      arcs.attr("d", arc).style("fill", (d, i) => {
        return colors[i];
      });
    }

    async _init(app, userId, sisId, graphElId = 'btech-department-report-student-progress-donut', w = 200, h = 200) {
      let graph = this;
      graph.app = app;
      graph.width = w;
      graph.height = h;
      let student = app.showStudent;
      //THIS NUMBER IS WRONG! IT'S ASSUMING CERT HOURS ARE SAME FOR ALL TREES IN A DEPARTMENT...
      let certificateHours = app.json.dept_code_to_name[app.currentDepartment].hours;
      let enrolledHours = student.enrolledHours;
      let completedHours = student.completedHours;
      let uncompletedEnrolledHours = 0;
      //enrolled is not always less than completed, so check to see if red should even show
      if (enrolledHours > completedHours) uncompletedEnrolledHours = enrolledHours - completedHours;
      //check which number should be used for gray
      let unenrolledHours = certificateHours - enrolledHours;
      let uncompletedHours = certificateHours - completedHours;
      let grayHours = unenrolledHours;
      if (uncompletedHours > unenrolledHours) grayHours = uncompletedHours;

      // Creates sources <svg> element
      $('#' + graphElId).empty();
      graph.fillCertificateHours(graphElId, certificateHours);
      graph.fillEnrolledHours(graphElId, certificateHours, enrolledHours, completedHours);
      /*
      const svg = d3.select("#" + graphElId).append("svg").attr("width", graph.width).attr("height", graph.height);

      const g = svg.append("g").attr("transform", `translate(${width.width / 2}, ${graph.height / 2})`);

      const data = [grayHours, uncompletedEnrolledHours, completedHours];

      const radius = Math.min(graph.width, graph.height) / 2;

      const colors = [app.colors.gray, app.colors.red, app.colors.blue];

      const arc = d3
        .arc()
        .outerRadius(radius - 10)
        .innerRadius(radius / 2);

      const pie = d3.pie();

      const pied_data = pie(data);

      let generator = d3.pie().sort(null);
      let angleInterpolation = d3.interpolate(generator.startAngle()(), generator.endAngle()());

      const arcs = g
        .selectAll(".arc")
        .data(pied_data)
        .join((enter) => enter.append("path").attr("class", "arc").style("stroke", "white"));

        arcs.transition()
        .duration(1000)
        .attrTween("d", d => {
          let originalEnd = d.endAngle;
          return t => {
            let currentAngle = angleInterpolation(t);
            if (currentAngle < d.startAngle) {
              return "";
            }
    
            d.endAngle = Math.min(currentAngle, originalEnd);
    
            return arc(d);
          };
        });

      arcs.attr("d", arc).style("fill", (d, i) => {return colors[i];});
      */
    }
  }
})();