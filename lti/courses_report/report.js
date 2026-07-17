//Average retakes, how many people are dropping and retaking, so doesn't count as a full drop, but still shows there may be some concern
//Quiz analytics
//rubric breakdown
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
    el: '#canvas-courses-report-vue',
    mounted: async function () {
      $('#canvas-courses-report-vue').css({
        visibility: 'visible'
      });
      let app = this;
      let dept = '' + CURRENT_DEPARTMENT;
      await app.loadJsonFile('canv_acct_name');
      await app.loadJsonFile('dept_data/3820');
      app.loading = false;
    },

    computed: {},

    updated: function () {},

    data: function () {
      return {
        currentDepartmentId: '3820',
        currentDepartment: {},
        loading: true,
        json: {},
        showCourse: 'all',
        minEnrollments: 5,
        minProgress: 10,
        colors: {
          base: '#334',
          black: '#000000',
          white: '#ffffff',
          red: 'rgb(217, 83, 79)',
          orange: 'rgb(229, 128, 79)',
          yellow: 'rgb(240, 173, 78)',
          green: 'rgb(92, 184, 92)',
          blue: 'rgb(91, 192, 222)',
          purple: 'rgb(170, 90, 185)',
          gray: '#E0E0E0',
          noProgress: '#E0E0E0',
          complete: '#5BC0DE',
          badDate: '#D9534F',
          warningDate: '#F0AD4E',
          goodDate: '#5CB85C',
        },
        scrollTop: 0, //used to save the scroll location of the main screen before going into the student report
      }
    },
    methods: {
      async loadDepartmentCourses() {
        let app = this;
        console.log(app.currentDepartmentId);
        await app.loadJsonFile('dept_data/' + app.currentDepartmentId);
        app
      },
      async loadJsonFile(name) {
        let app = this;
        let jsonUrl = 'https://jhveem.xyz/lti/report_data/' + name;
        let jsonData = {};
        await $.post(jsonUrl, function (data) {
          jsonData = data;
        });
        if (name.includes('dept_data')) {
          name = 'courses_data'
          console.log(jsonData);
          app.currentDepartment = jsonData;
        }
        app.json[name] = jsonData;
        return jsonData;
      },

      getBGColor(val, groups) {
        let app = this;
        if (val < groups[0]) return app.colors.red;
        if (val < groups[1]) return app.colors.yellow;
        return app.colors.green;
      },

      openCourseReport() {
        let app = this;
        app.$nextTick(() => {
          let graph = new SubmissionsGraphBar();
          graph._init();
        });
      },

      closeCourseReport() {
        let app = this;
        app.showCourse = 'all';
      },

      formatTime(time) {
        time = Math.round(time);
        let hours = Math.floor(time / 3600)
        time -= (hours * 3600);
        let minutes = Math.floor(time / 60);
        time -= (minutes * 60);
        let seconds = time;
        if (hours < 10) hours = "0" + hours;
        if (minutes < 10) minutes = "0" + minutes;
        if (seconds < 10) seconds = "0" + seconds;
        return hours + ":" + minutes + ":" + seconds;
      },

      calcAverageQuizAlpha(quiz) {
        let questions = quiz.question_statistics;
        let sum = 0;
        let count = 0;
        for (let q = 0; q < questions.length; q++) {
          let stats = questions[q];
          if (stats.alpha !== null && stats.alpha !== undefined) sum += (stats.alpha * stats.answered_student_count);
          count += stats.answered_student_count;
        }
        if (count > 0) return Math.round(sum / count * 100) / 100;
        return "N/A";
      },

      calcAverageQuizDifficulty(quiz) {
        let questions = quiz.question_statistics;
        let sum = 0;
        let count = 0;
        for (let q = 0; q < questions.length; q++) {
          let stats = questions[q];
          if (stats.difficulty_index !== null && stats.difficulty_index !== undefined) sum += stats.difficulty_index;
          count += 1;
        }
        if (count > 0) return Math.round(sum / count * 100) / 100;
        return "N/A";
      },

      sumEnrollments(course) {
        let enrollments = course.enrollments;
        let all = [];
        for (let type in enrollments) {
          let enrollmentGroup = enrollments[type];
          for (let e = 0; e < enrollmentGroup.length; e++) {
            let id = enrollmentGroup[e];
            if (!(id in all)) all.push(id);
          }
        }
        return all.length;
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

    getData() {
      let app = this.app;
      let moduleAssignments = app.showCourse.module_assignments;
      let moduleItems = [];
      for (let a = 0; a < moduleAssignments.length; a++) {
        let moduleAssignment = moduleAssignments[a];
        let submittedUsers = moduleAssignment.submitted_users;
        let moduleItemData = {
          name: a + '. ' + moduleAssignment.name,
          active: 0,
          completed: 0,
          dropped: 0,
          completed_hs: 0
        };
        let enrollmentStates = ['completed', 'active', 'dropped', 'completed_hs'];
        for (let s = 0; s < submittedUsers.length; s++) {
          let userId = submittedUsers[s];
          for (let t = 0; t < enrollmentStates.length; t++) {
            let type = enrollmentStates[t];
            let enrollments = app.showCourse.enrollments[type];
            let brk = false;
            for (let e = 0; e < enrollments.length; e++) {
              let enrollmentUserId = enrollments[e];
              if (enrollmentUserId === userId) {
                moduleItemData[type] += 1;
                brk = true;
                break;
              }
            }
            if (brk) break;
          }
        }
        moduleItems.push(
          moduleItemData
        );
      }
      let data = moduleItems;
      // data.columns = ['name', 'active', 'completed', 'dropped'];
      // ['active', 'completed', 'dropped'];
      return data;
    }

    _initAlt(app = APP, graphElId = 'btech-department-report-student-submissions-graph', w = 800, h = 240) {
      this.app = app;
      let graph = this;
      // List of subgroups = header of the csv files = soil condition here
      var margin = {
          top: 10,
          right: 30,
          bottom: 20,
          left: 50
        },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

      // append the svg object to the body of the page
      var svg = d3.select("#" + graphElId)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

      let data = graph.getData();
      var stackdata = ['active', 'completed', 'dropped', 'completed_hs'].map(function (c) {
        return data.map(function (d, i) {
          return {
            x: i,
            y: d[c]
          }
        })
      })

      // Set up stack method
      var stack = d3.stack()
      // Data, stacked
      stack(stackdata)
      // gold silver colors
      var colors = ['active', 'completed', 'dropped', 'completed_hs'];
      // Add a group for each row of data
      var groups = svg.selectAll("g")
        .data(stackdata)
        .enter()
        .append("g")
        .style("fill", function (d, i) {
          return colors[i]
        })
      // Add a rect for each data value
      var rects = groups.selectAll("rect")
        .data(function (d) {
          return d
        })
        .enter()
        .append("rect")
        .attr("x", function (d, i) {
          return i * 28
        })
        .attr("y", function (d) {
          return d.y0
        })
        .attr("height", function (d) {
          return d.y
        })
        .attr("width", 24)
    }

    sumSubmissions(item) {
      return item.active + item.dropped + item.completed;
    }

    async _init(app = APP, graphElId = 'btech-department-report-student-submissions-graph', w = 800, h = 240) {
      this.app = app;
      let graph = this;

      //Set margins
      graph.graphSettings.margin = {
        top: 30,
        bottom: 40,
        left: 50,
        right: 20,
      };

      let subgroups = Object.keys(app.showCourse.enrollments);
      let sumEnrollments = app.sumEnrollments(app.showCourse);
      let data = graph.getData();
      let groups = data.map(function (d) {
        return d.name;
      });

      //Begin setting up the graph
      let barColor = graph.getBarColor();
      let el = $('#' + graphElId);
      el.empty();

      var width = w - graph.graphSettings.margin.left - graph.graphSettings.margin.right;
      var height = h - graph.graphSettings.margin.top - graph.graphSettings.margin.bottom;

      var x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding(0.1);

      var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, sumEnrollments]);

      graph.svg = d3.select('#' + graphElId).append('svg')
        .attr('width', w)
        .attr('height', h * 1.5)
        .append('g')
        .attr("transform", "translate(" + graph.graphSettings.margin.left + ", " + graph.graphSettings.margin.top + ")");



      graph.graphSettings.barWidth = 5;

      //ADD IN A HOVER OPTION TO SHOW EXACT COUNT
      graph.svg
        .selectAll("whatever")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function (d) {
          return graph.xPlot(d, x)
        })
        .attr("width", x.bandwidth())
        .attr("y", function (d) {
          return graph.yPlot(d, y, ['dropped']);
        })
        .attr("height", function (d) {
          return height - graph.yPlot(d, y, ['dropped']);
        })
        .attr("fill", app.colors.red);

      graph.svg
        .selectAll("whatever")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function (d) {
          return graph.xPlot(d, x)
        })
        .attr("width", x.bandwidth())
        .attr("y", function (d) {
          return graph.yPlot(d, y, ['active', 'dropped']);
        })
        .attr("height", function (d) {
          return height - graph.yPlot(d, y, ['active']);
        })
        .attr("fill", app.colors.green);

      graph.svg
        .selectAll("whatever")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function (d) {
          return graph.xPlot(d, x)
        })
        .attr("width", x.bandwidth())
        .attr("y", function (d) {
          return graph.yPlot(d, y, ['completed', 'active', 'dropped']);
        })
        .attr("height", function (d) {
          return height - graph.yPlot(d, y, ['completed']);
        })
        .attr("fill", app.colors.blue);

      graph.svg
        .selectAll("whatever")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function (d) {
          return graph.xPlot(d, x)
        })
        .attr("width", x.bandwidth())
        .attr("y", function (d) {
          return graph.yPlot(d, y, ['completed_hs', 'completed', 'active', 'dropped']);
        })
        .attr("height", function (d) {
          return height - graph.yPlot(d, y, ['completed_hs']);
        })
        .attr("fill", app.colors.purple);

      //labels
      graph.svg.append('g')
        .attr("transform", "translate(0, " + height + ")")
        .call(
          d3.axisBottom(x)
        )
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(75)")
        .style("text-anchor", "start");;

      graph.svg.append('g')
        .call(d3.axisLeft(y));

      /*
      graph.svg.append("text")
        .attr("transform", "translate(" + (w / 2) + " ," + (h) + ")")
        .style("text-anchor", "middle")
        */

        /*
      graph.svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x", 0 - ((height + graph.graphSettings.margin.top) / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Number of Submissions");
        */
    }

    getBarColor() {
      let app = this.app;
      let graph = this;
      let barColor = app.colors.green;
      return barColor;
    }

    xPlot(d, x) {
      let app = this.app;
      let graph = this;
      let xVal = x(d.name);
      return xVal;
    }

    yPlot(d, y, types) {
      let app = this.app;
      let graph = this;
      let sum = 0;
      for (let t = 0; t < types.length; t++) {
        let type = types[t];
        sum += d[type];
      }
      let yVal = y(sum);
      return yVal;
    }
  }

})();