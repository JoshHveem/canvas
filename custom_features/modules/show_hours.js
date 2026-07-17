(async function () {
  let checkbox = $('<input type="checkbox"><label>Show Hours</label>');
  checkbox.change(function () {
    let checked = $(this).is(':checked')
    if (checked) addHours();
    else clearHours();
  });
  $("#external-tool-mount-point").append(checkbox);
  let course_id = ENV.course_id;
  async function clearHours() {
    $('.btech-sum-hours').each(function () {
      $(this).remove();
    });
  }
  async function addHours() {
    //get course hours
    let hours = 0;
    await $.get("/api/v1/courses/" + course_id, function (data) {
      let regex = /([A-Z]{4} [0-9]{4}).*?([0-9]{4})(CS|HS|ST)/
      let sis_id = data.sis_course_id;
      if (sis_id != undefined) {
        let match = sis_id.match(regex);
        if (match.length > 0) {
          let course_code = match[1];
          let year = match[2];
          hours = COURSE_HOURS[year][course_code];
        }
      }
    });

    let assignments = {};
    let groups = {};
    let useAssignmentGroupWeights = true;
    let totalPoints = 0;
    await $.get("/api/v1/courses/" + course_id, function (data) {
      let course = data;
      useAssignmentGroupWeights = course.apply_assignment_group_weights;
    })

    let assignmentGroupsData = await canvasGet("/api/v1/courses/" + course_id + "/assignment_groups?include[]=assignments")
    for (let i = 0; i < assignmentGroupsData.length; i++) {
      let group = assignmentGroupsData[i];
      if (group.group_weight > 0 || !useAssignmentGroupWeights) {
        let sum = 0;
        for (let j = 0; j < group.assignments.length; j++) {
          let assignment = group.assignments[j];
          if (assignment.published) {
            sum += assignment.points_possible;
            totalPoints += assignment.points_possible;
            assignment.group_name = group.name;
            assignments[assignment.name] = assignment;
          }
        }
        groups[group.name] = {
          sum: sum,
          weight: group.group_weight
        };
      }
    }

    let sumPointsToHours = 0;
    let modulesData = await canvasGet("/api/v1/courses/" + course_id + "/modules?include[]=items");
    for (let i = 0; i < modulesData.length; i++) {
      let module = modulesData[i];
      for (let j = 0; j < module.items.length; j++) {
        let item = module.items[j];
        if (item.title in assignments) {
          let assignment = assignments[item.title];
          let weightedPoints = assignment.points_possible;
          if (useAssignmentGroupWeights) weightedPoints = (weightedPoints / groups[assignment.group_name].sum) * groups[assignment.group_name].weight * .01;
          else weightedPoints = weightedPoints / totalPoints;
          let pointsToHours = weightedPoints * hours;
          sumPointsToHours += pointsToHours;
          let li = $('#context_module_item_' + item.id);
          li.css({
            'position': 'relative'
          });
          li.prepend('<div class="btech-sum-hours" style="position: absolute; left: -4rem; padding: 4px; border-radius: 10px; font-size: .75rem; background-color: rgb(91, 192, 222); color: #fff;">' + (Math.round(sumPointsToHours * 10) / 10) + ' HRS</div>');
        }
      }
    }
  }
})();