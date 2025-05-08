(async function() {

    // 1. Your async function that returns the array
    async function getCompletedEnrollments() {
        let completedEnrollments = [];
        let query = `
        {
        allCourses {
            enrollmentsConnection(filter: {types: StudentEnrollment, states: active}) {
            nodes {
                grades {
                finalScore
                currentScore
                }
                user {
                    _id
                sortableName
                }
            }
            }
            courseCode
            name
            _id
            term {
            _id
            endAt
            }
        }
        }
        `
        let res = await $.post(`/api/graphql`, {
            query: query
        });
        console.log(res);
        // capture “now” once, so it’s identical in both filters
        const now = new Date();
        
        const openCourses = res
        .data
            .allCourses
        // only courses you’re actually enrolled in
        .filter(( course ) => course.enrollmentsConnection?.nodes?.length > 0)
        // only courses whose term hasn’t ended yet
        .filter(( course ) => {
            // make sure your GraphQL field name is camelCase:
            const endAt = new Date(course.term.endAt);
            return endAt > now;
        });
        
        for (let course of openCourses) {
            let enrollments = course.enrollmentsConnection.nodes;
            for (enrollment of enrollments) {
                progress = enrollment.grades.finalScore / enrollment.grades.currentScore;
                if (progress > .95) {
                    completedEnrollments.push({
                        course_id: course._id,
                        course_code: course.courseCode,
                        user_id: enrollment.user._id,
                        user_name: enrollment.user.sortableName,
                        progress: progress
                    });
                }
            }
        }
        completedEnrollments
        .sort((a, b) =>
            a.course_code.localeCompare(b.course_code) ||
            a.user_name.localeCompare(b.user_name)
        );
        return completedEnrollments;
    }


    // 2. Modal‐creation (make it async so you can await the data)
    async function createModal() {
    // build the DOM
    const modal = $(`
        <div class="btech-modal" style="display: inline-block;">
        <div class="btech-modal-content" style="width: 80%;">
            <div class="btech-modal-content-inner">
            <h2>Students Near Completion</h2>
            <div class="btech-modal-completed-enrollments">Loading…</div>
            </div>
        </div>
        </div>
    `);

    // close when background clicked
    modal.on("click", e => {
        if ($(e.target).is(modal)) modal.remove();
    });

    $("body").append(modal);

    try {
        const list = await getCompletedEnrollments();
        const $container = $(`
        <div class="btech-enrollment-container" 
            style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px;">
        </div>
        `);

        if (!list.length) {
        modal.find(".btech-modal-completed-enrollments")
            .text("No students are within 95% completion yet.");
        } else {
        list.forEach(({ course_code, course_id, user_id, user_name, progress }) => {
            const pct = (progress * 100).toFixed(1) + "%";

            const $card = $(`
            <div class="btech-enrollment-card" 
                style="border: 1px solid #ddd; padding: 8px; border-radius: 4px;
                        width: 200px; box-sizing: border-box;">
                <div class="course-code" style="font-weight: bold; margin-bottom: 4px;">
                ${course_code}
                </div>
                <div class="student-name" style="margin-bottom: 4px;">
                <a target="_blank" href="/courses/${course_id}/users/${user_id}">
                    ${user_name}
                </a>
                </div>
                <div class="progress">
                ${pct}
                </div>
            </div>
            `);

            $container.append($card);
        });

        modal.find(".btech-modal-completed-enrollments")
            .empty()
            .append($container);
        }
    } catch (err) {
        console.error(err);
        modal.find(".btech-modal-completed-enrollments")
            .text("Error loading data.");
    }

    return modal;
    }


    // 3. Create & hook up the button
    $(function() {
    const button = $(`
        <a href="javascript:;" class="Button button-sidebar-wide">
        View Students Near Completion
        </a>
    `);

    // when clicked, show the modal
    button.on("click", async (e) => {
        e.preventDefault();
        await createModal();
    });

    // append it in the sidebar
    $("#right-side").append(button);
    });

})();