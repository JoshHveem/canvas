$(document).ready(async function () {
    function extractYear(termName) {
        const yearMatch = termName.match(/\b(20\d{2})\b/);
        return yearMatch ? yearMatch[1] : null;
    }
    async function getAssignmentsData(courseId) {
        let assignmentsDict = {};
        let modulesDict = {};

        let query = `{
        course(id: "${courseId}") {
            _id
            name
            courseCode
            term {
            name
            }
            assignmentGroupsConnection {
            nodes {
                _id
                name
                groupWeight
                state
                assignmentsConnection {
                nodes {
                    _id
                    name
                    published
                    pointsPossible
                    modules {
                    _id
                    position
                    }
                    quiz {
                    modules {
                        _id
                        position
                    }
                    }
                }
                }
            }
            }
        }
        }`;
        try {
        let res = await $.post(`/api/graphql`, {
            query: query
        });
        let data = res.data.course;
        let courseCode = data.courseCode;
            let year = extractYear(data.term.name);
            let hours = 0;
            if (year !== null) {
            hours = COURSE_HOURS?.[courseCode]?.hours ?? 0;
            //Check to see if a previous year can be found if current year doesn't work
            for (let i = 1; i < 5; i++) {
                if (hours == undefined) hours = COURSE_HOURS?.[courseCode].hours;
            }
            if (hours === undefined) hours = 0;
            }
            console.log(hours);
            let credits = hours / 30;
            let assignmentGroups = data.assignmentGroupsConnection.nodes.filter(group => group.state == 'available').map(group => {
                group.assignments = group.assignmentsConnection.nodes;
                group.points_possible = 0;
                group.credits = (group.groupWeight / 100) * credits;
                for (let assignment of group.assignments) {
                    if (assignment.published) group.points_possible += assignment.pointsPossible;
                    let modules = assignment?.quiz?.modules ?? assignment?.modules;
                    for (let module of modules) {
                        if (modulesDict[module._id] == undefined) modulesDict[module._id] = { position: module.position, assignments: [] };
                        modulesDict[module._id].assignments.push(assignment._id);
                    }
                }
                group.credits_per_point = 0;
                if (group.points_possible > 0) group.credits_per_point = group.credits / group.points_possible;
            return group;
            });
            for (let group of assignmentGroups) {
                for (let assignment of group.assignments) {
                    assignmentsDict[assignment._id] = {
                        id: assignment._id,
                        points_possible: assignment.published ? assignment.pointsPossible : 0,
                        credits: group.credits_per_point * (assignment.published ? assignment.pointsPossible : 0)
                    }
                }
            }
            console.log(assignmentGroups);
        return { assignments: assignmentsDict, modules: modulesDict, course_credits: credits};
        } catch (err) {
        console.error(err);
        return {};

        }
    }
    let data = await getAssignmentsData(ENV.COURSE_ID);

    if (data.course_credits > 0) {
        let totalCredits = 0;
        let sortedModuleKeys = Object.keys(data.modules).sort((a, b) => 
            data.modules[a].position - data.modules[b].position
        );

        for (let mid of sortedModuleKeys) {
            let module = data.modules[mid];
            $(`.ig-subheader#sub-${mid}`).remove();
            let credits = 0;
            for (let aid of module.assignments) {
                let assignment = data.assignments[aid];
                credits += assignment.credits;
                totalCredits += assignment.credits;
                // console.log(assignment);
            }
            let coursePercentage = credits / data.course_credits;
            let totalcoursePercentage = totalCredits / data.course_credits;
            $(`.ig-header#${mid}`).after(`
            <div 
                class="progress-bar-container ig-subheader"
                id="sub-${mid}"
                style="position: relative; width: 100%; height: 24px; background-color: #F2F2F2
                ;">
                
                
                <!-- totalcoursePercentage -->
                <div 
                    class="total-progress" 
                    style="position: absolute; top: 0; left: 0; height: 100%; width: ${totalcoursePercentage * 100}%; background-color: #55CFCB;">
                </div>
                <!-- coursePercentage -->
                <div 
                class="course-progress" 
                style="position: absolute; top: 0; left: 0; height: 100%; width: ${(totalcoursePercentage - coursePercentage) * 100}%; background-color: #05989D;">
                </div>
                
                
                <!-- Text overlay -->
                <div 
                class="progress-text" 
                style="position: relative; z-index: 2; text-align: center; line-height: 24px; text-shadow: -1px -1px 0 #FFF, 1px -1px 0 #FFF, -1px 1px 0 #FFF, 1px 1px 0 #FFF;">
                    <span style="background-color: rgba(255, 255, 255, 0.75); padding: 0px 8px; border-radius: 8px;">${Math.round(coursePercentage * 100)}% (${Math.ceil(credits * 10) / 10} Crdt) Total: ${Math.round(totalcoursePercentage * 100)}% (${Math.ceil(totalCredits * 10) / 10} Crdt)</span>
                </div>
            </div>
            `);
        }
    }
})();