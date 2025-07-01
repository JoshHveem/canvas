$(document).ready(async function () {
    function extractYear(termName) {
        const yearMatch = termName.match(/\b(20\d{2})\b/);
        return yearMatch ? yearMatch[1] : null;
    }
    async function getGraphiCourseAssignments(courseId) {
        const results = [];
        const courseData = {};

        const fetchPage = async (after = null) => {
            const query = `{
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
                            assignmentsConnection(first: 100${after ? `, after: "${after}"` : ""}) {
                                pageInfo {
                                    hasNextPage
                                    endCursor
                                }
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
            const res = await $.post(`/api/graphql`, { query });
            const course = res.data.course;
            courseData.name = course.name;
            courseData.course_code = course.courseCode;
            courseData.term_name = course.term.name
            const assignmentGroups = course.assignmentGroupsConnection.nodes;

            // Push current assignmentGroups to results (deep merge may be needed depending on structure)
            results.push(...assignmentGroups);

            // Check for pagination in any group
            const groupWithMorePages = assignmentGroups.find(group =>
                group.assignmentsConnection.pageInfo.hasNextPage
            );

            if (groupWithMorePages) {
                const endCursor = groupWithMorePages.assignmentsConnection.pageInfo.endCursor;
                // Recursive call to fetch next page of that group
                await fetchPage(endCursor);
            }

            } catch (error) {
                console.error("Error fetching assignment groups:", error);
            }
        };

        await fetchPage(); // start initial fetch
        courseData.assignment_groups = results;
        return courseData;
    }
    async function getAssignmentsData(courseId) {
        let assignmentsDict = {};
        let modulesDict = {};

        try {
            let data = await getGraphiCourseAssignments(courseId);
            let courseCode = data.course_code;
            let year = extractYear(data.term_name);
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
            let assignmentGroups = data.assignment_groups.filter(group => group.state == 'available').map(group => {
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
    console.log(data);

    if (data.course_credits > 0) {
        let totalCredits = 0;
        let sortedModuleKeys = Object.keys(data.modules).sort((a, b) => 
            data.modules[a].position - data.modules[b].position
        );

        console.log(sortedModuleKeys);

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
                style="position: relative; width: 100%; height: 28px; background-color: #E2E2E2;"
            >
                
                
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
                style="position: relative; z-index: 2; text-align: center; line-height: 28px;">
                    <span style="background-color: rgba(255, 255, 255, 0.8); padding: 0px 8px; border-radius: 8px;">${Math.round(coursePercentage * 100)}% (${Math.ceil(credits * 10) / 10} Crdt)&emsp;&emsp;Total: ${Math.round(totalcoursePercentage * 100)}% (${Math.ceil(totalCredits * 10) / 10} Crdt)</span>
                </div>
            </div>
            `);
        }
    }
});