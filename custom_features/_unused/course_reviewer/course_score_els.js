$("<style>@media print { #btech-detailed-evaluation-button { display: none !important; } }</style>").appendTo("head");

function updateReviewProgress(data) {
  if (data.processed < 0) data.processed = 1;
  let color = {
    'quizzes': '#1e65A7',
    'new_quizzes': '#192E5B',
    'assignments': '#25B396',
    'pages': '#70CED0',
    'other': '#00743F',
    'unused_yellow': '#F1A104',
    // temp color
    'processed': '#1e65A7'
  };
  // Set dimensions and radius
  let fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  let paddingSize = fontSize * 0.25;
  let barSize = 6;
  const size = (2.75 * fontSize) + (paddingSize * 2) + (barSize * 2); // Convert rem to pixels (assuming 1rem = 16px)
  const radius = size / 2; // Adjust radius to fit within the container

  const svg = d3.select('#btech-detailed-evaluation-button')
      .html('') // Clear any existing content
      .append('svg')
      .attr('class', 'btech-reviewer-progress-circle') // Set the class here
      .attr('width', size)
      .attr('height', size)
      .style('margin-left', `-${ paddingSize + barSize }px`) // -4 to cover padding of parent, -
      .style('margin-top', `-${ paddingSize + barSize }px`) // -4 to cover padding of parent, -
      .append('g')
      .attr('transform', `translate(${size / 2},${size / 2}) rotate(0)`); // Center and rotate to start from the top

  // Create an arc generator
  const arc = d3.arc()
      .outerRadius(radius)
      .innerRadius(radius - barSize); // Adjust this value to control the size of the hole

  // Create a label arc generator
  const labelArc = d3.arc()
      .outerRadius(radius)
      .innerRadius(radius);

  // Create a pie generator
  const pie = d3.pie()
      .sort(null)
      .value(d => d[1]);
  const g = svg.selectAll(".arc")
    .data(pie(Object.entries(data)))
    .enter().append("g")
    .attr("class", "arc");

  // Append path elements for each slice
  g.append("path")
    .attr("d", arc)
    .style("fill", d => color?.[d.data[0]] ?? 'none');
  return svg;
}

async function checkReviewProgress (
  courseReviewData, criteria
) {
  let reviewerProgressData = { processed: 0, remaining: 0};
  try {
    let course = await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/courses/${ENV.COURSE_ID}`);

    // place holder until more robust data is available
    reviewerProgressData.processed = Math.round((course.current_update_progress ?? 1) * 100); // Example increment
    reviewerProgressData.remaining = 100 - reviewerProgressData.processed; // Example decrement


    $('#btech-detailed-evaluation-button').html('');
    if (course.current_update_progress <= 1 && reviewerProgressData.remaining > 0) {
      updateReviewProgress(reviewerProgressData);
    }
    let courseScore = calcCourseScore(
      courseReviewData, criteria
    );
    let emoji = calcEmoji(courseScore);
    $('#btech-detailed-evaluation-button').append(  `<span style="padding: 0.25rem; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 2rem; z-index: 1001;">${emoji}</span>`);
  } catch (error) {
    console.error('Error fetching course data:', error);
  }
  return reviewerProgressData;
}
async function initReviewProgressInterval(
  courseReviewData, criteria
) {
  // Run the updateProgress function every 10 seconds
  let intervalId = setInterval(function () {
    checkReviewProgress(
      courseReviewData, criteria
    )
  }, 10000);
}

// do we have a review?
function generateDetailedCourseContent(
    courseReviewData
    , courseCode
    , year
    , criteria
    , objectivesData
    , objectivesCounts
    , externalContentCounts
    , totalContentCounts
    , bloomsCounts
  ) {
    let html = `
      <div style="background-color: white; font-weight: bold; padding: 0.5rem; border: 1px solid #AAA;">
        <span style="display: inline-block; font-size: 1.5rem;">Course Evaluation</span>
        <span style="display: inline-block; color: #AAA; font-size: 1rem;">Last Update: {{(new Date(courseReviewData.last_update)).toLocaleDateString()}}</span></div>
      <div style="background-color: white; border-bottom: 1px solid #AAA;">
        <div 
          v-for="(menu, m) in menuOptions" :key="m"
          :style="{
            'color': menuCurrent == menu ? '${bridgetools.colors.blue}' : (loadingMenus.includes(menu) ? '#AAA' : '#000'),
            'background-color': menuCurrent == menu ? '#F0F0F0' : '',
            'font-weight': menuCurrent == menu ? 'bold' : 'normal'
          }"
          style="
            text-align: center;
            display: inline-block;
            padding: 0.25rem 1rem;
            font-weight: bold;
            font-size: 1rem;
            cursor: pointer;
            user-select: none;
            "
          @click="setMenu(menu)"
        >{{menu.toUpperCase()}}</div>
      </div>
      <div v-if="menuCurrent == 'main'">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr);">
          <div class="btech-course-evaluator-content-box">
            <h2>Objectives</h2>
            <div v-for="(objective, o) in objectivesData" :key="o" style="display: flex; align-items: center;">
              <span 
                style="display: inline-block;"
                :title="(isNaN(objective.usage) ? 0 : objective.usage) + '% of content aligns to this objective.'"
              >
                <div 
                  style="position: relative; width: 1.5rem; height: 1.5rem; border-radius: 50%;" 
                  :style="{
                    'background': 'conic-gradient(${bridgetools.colors.green} 0% ' + (isNaN(objective.usage) ? 0 : objective.usage) + '%, lightgray ' + (isNaN(objective.usage) ? 0 : objective.usage) + '% 100%)'
                  }"
                ></div>
              </span>
              <span style="margin-left: 0.5rem;">{{objective.objective_text.trim()}}</span>
            </div>
            
            <div @click="menuCurrent = 'unaligned'" style="display: flex; align-items: center; margin-top: 1rem;">
              <span 
                :title="(Math.round((objectivesCounts['n/a'] / (courseReviewData.assignments.length + courseReviewData.quizzes.length)) * 1000) / 10) + '% of content is NOT aligned to an objective.'"
                style="display: inline-block;"
              >
                <div 
                  style="position: relative; width: 1.5rem; height: 1.5rem; border-radius: 50%;" 
                  :style="{
                    'background': 'conic-gradient(${bridgetools.colors.red} 0% ' + (objectivesCounts['n/a'] / (courseReviewData.assignments.length + courseReviewData.quizzes.length)) * 100 + '%, lightgray ' + (objectivesCounts['n/a'] / (courseReviewData.assignments.length + courseReviewData.quizzes.length)) * 100 + '% 100%)'
                  }"
                ></div>
              </span>
              <span style="margin-left: 0.5rem;">
                <i>No Objectives</i>
              </span>
            </div>
          </div>
          <div class="btech-course-evaluator-content-box">
            <h2>Blooms</h2>
            <div style="display: flex; align-items: center;" class="blooms-chart-container">
              <svg style="width: 150px; height: 150px; margin-right: 20px;" class="blooms-chart"></svg>
              <div style="display: flex; flex-direction: column; justify-content: center;" class="blooms-chart-key"></div>
            </div>
          </div>
        </div>
        <div class="btech-course-evaluator-content-box">
          <h2>Contracted Courseware</h2>
          <div>3rd Party Items: {{externalContentCounts}} Item(s) ({{Math.round((externalContentCounts / totalContentCounts) * 1000) / 10}}%)</div>
        </div>
        <div class="btech-course-evaluator-content-box">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <course-content
              :type="'Assignments'"
              :criteria="criteria.Assignments"
              :reviews="courseReviewData.assignments"
              :calc-counts="calcCourseContentCounts"
            ></course-content>
            <course-content
              :type="'Quizzes'"
              :criteria="criteria.Quizzes"
              :reviews="courseReviewData.quizzes"
              :calc-counts="calcCourseContentCounts"
            ></course-content>
            <course-content
              :type="'Pages'"
              :criteria="criteria.Pages"
              :reviews="courseReviewData.pages"
              :calc-counts="calcCourseContentCounts"
            ></course-content>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <course-content
              :type="'Rubrics'"
              :criteria="criteria.Rubrics"
              :reviews="courseReviewData.rubrics"
              :calc-counts="calcCourseContentCounts"
            ></course-content>
            <course-content
              :type="'Modules'"
              :criteria="criteria.Modules"
              :reviews="courseReviewData.modules"
              :calc-counts="calcCourseContentCounts"
            ></course-content>
          </div>
        </div>
      </div>
      <!-- SURVEYS -->
      <course-surveys 
        v-if="menuCurrent == 'surveys'"
        :surveys='surveys'
        :course='course'
        ></course-surveys>

      <!-- ASSIGNMENTS NOT ALIGNED TO OBJECTIVES -->
      <div v-if="menuCurrent == 'unaligned'">
        <div class="btech-course-evaluator-content-box">
          <h2>Unaligned Assignments</h2>
          <div v-for="(assignment, a) in courseReviewData.assignments.filter(assignment => (assignment?.objectives ?? []).length == 0 && !assignment.ignore)" :key="a"><a :href="'https://btech.instructure.com/courses/' + assignment.course_id + '/assignments/' + assignment.assignment_id">{{assignment.name}}</a></div>
        </div>
        <div class="btech-course-evaluator-content-box">
          <h2>Unaligned Quizzes</h2>
          <div v-for="(quiz, q) in courseReviewData.quizzes.filter(quiz => (quiz?.objectives ?? []).length == 0 && !quiz.ignore)" :key="q"><a :href="'https://btech.instructure.com/courses/' + quiz.course_id + '/quizzes/' + quiz.quiz_id">{{quiz.name}}</a></div>
        </div>
        <div class="btech-course-evaluator-content-box">
          <h2>Unaligned Pages</h2>
          <div v-for="(page, p) in courseReviewData.pages.filter(page => (page?.objectives ?? []).length == 0 && !page.ignore)" :key="p"><a :href="'https://btech.instructure.com/courses/' + page.course_id + '/pages/' + page.page_id">{{page.name}}</a></div>
        </div>
      </div>

      <!-- WHAT ASSIGNMENTS COULD BE CONSIDERED CONTRACTED COURSEWARE -->
      <div v-if="menuCurrent == '3rd party'">
        <div class="btech-course-evaluator-content-box">
          Coming Soon
        </div>
      </div>

      <div v-if="menuCurrent == 'summary'">
        <div class="btech-course-evaluator-content-box">
          <h2>Suggestions Summary</h2>
          <div 
            v-if="!loadingSummary"
            v-html="courseReviewData?.suggestions?.summary ?? ''"></div>
          <div
            v-else>Loading...</div>
          <button
              @click="generateSummary();"
            >Generate Summary</button>
        </div>
      </div>

      <!-- ASK A QUESTION ABOUT THE CURRICULUM -->
      <div v-if="menuCurrent == 'query'">
        <div class="btech-course-evaluator-content-box">
          <input 
            v-model="query"
            @keyup.enter="submitQuery"
            style="width: 100%; height: 3rem; box-sizing: border-box;" type="text">
        </div>
        <div 
          class="btech-course-evaluator-content-box"
          v-html="queryResponse"
        >
        </div>
        <div 
          class="btech-course-evaluator-content-box"
          v-if="querySources.length > 0"
        >
          <div v-for="source in querySources"><a :href="getQuerySourceURL(source)">{{ source.name }} ({{source.type}})</a></div>
        </div>
      </div>

      <!-- Evaluate proposed objectives -->
      <div v-if="menuCurrent == 'objectives'">
        <div class="btech-course-evaluator-content-box">
          <textarea 
            v-model="objectivesQuery"
            @input="adjustHeight($event)"
            style="width: 100%; box-sizing: border-box; overflow: hidden; resize: none;"
            rows="1"
          ></textarea>
          <div>
            <button
              @click="submitObjectivesQuery"
            >Submit</button>
          </div>
        </div>
          
        <div 
          class="btech-course-evaluator-content-box"
          v-if="objectivesEvaluatorResponse.length > 0"
          v-for="response in objectivesEvaluatorResponse"
        >
          <div><b>Proposed:</b> {{response.objective}}</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <div style="padding: 8px 0;">
              <h2>Criteria</h2>
              <div title="">
                <span style="width: 6rem; display: inline-block;">Strong Verb</span><span>{{ response.verb_concision ? emojiTF[1] : emojiTF[0] }}</span>
              </div>
              <div title="">
                <span style="width: 6rem; display: inline-block;">Relevant</span><span>{{ response.course_relevance ? emojiTF[1] : emojiTF[0] }}</span>
              </div>
              <div title="">
                <span style="width: 6rem; display: inline-block;">Specific</span><span>{{ response.specificity ? emojiTF[1] : emojiTF[0] }}</span>
              </div>
              <div title="">
                <span style="width: 6rem; display: inline-block;">Concise</span><span>{{ response.concision ? emojiTF[1] : emojiTF[0] }}</span>
              </div>
              <div title="">
                <span style="width: 6rem; display: inline-block;">Measurable</span><span>{{ response.measurability ? emojiTF[1] : emojiTF[0] }}</span>
              </div>
            </div>
            <div style="padding: 8px 0; grid-column: span 2;">
              <h2>Feedback</h2>
              <div v-if="response?.feedback_list?.length > 0">
                <ul>
                  <li v-for="suggestion in response.feedback_list">{{suggestion}}</li>
                </ul>
              </div>
              <div v-else>
                {{response?.feedback ?? ""}}
              </div>
            </div>
          </div>
          <div><b>Recommended:</b> {{response.recommendation}}</div>
        </div>
      </div>
      <div v-if="menuCurrent == 'settings'">
        <settings></settings>
      </div>
      <div v-if="menuCurrent == 'individual'">
        <content-detailed
          :type="individualContent.type"
          :objectives-data="objectivesData"
          :content-data="individualContent.contentData"
          :content-criteria="individualContent.contentCriteria"
          :rubric-data="individualContent.rubricData"
          :rubric-criteria="individualContent.rubricCriteria"
          :emoji="emoji"
          :emojitf="emojiTF"
        ></content-detailed>
      </div>
  `;
  $("#btech-course-reviewer-detailed-report").append(html);

  let APP = new Vue({
    el: '#btech-course-reviewer-detailed-report',
    created: async function () {
      this.loadSurveys();
      let num = this.courseReviewData.assignments.length + this.courseReviewData.quizzes.length;
      for (let o in this.objectivesData) {
        let objective = this.objectivesData[o];
        let usage = Math.round((this.objectivesCounts[objective.objective_id] / (num)) * 1000) / 10;
        this.objectivesData[o].usage = usage;
      }
      this.setMenu('main');
      if (this.year !== this.courseReviewData.year) {
        await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/courses/${this.courseId}`, {course_code: this.courseCode, year: this.year}, 'POST');
      }
      // this.getSummary();
    },
    data: function () {
      return {
        courseId: ENV.COURSE_ID,
        course: courseReviewData,
        courseCode: courseCode,
        year: year,
        menuCurrent: 'main',
        menuOptions: [
          'main',
          'summary',
          'surveys',
          'unaligned',
          '3rd party',
          // 'query',
          'objectives',
          'settings'
        ],
        loadingMenus: [
          'surveys'
        ],
        loadingSummary: false,
        courseReviewData: courseReviewData,
        criteria: criteria,
        objectivesData: objectivesData,
        objectivesCounts: objectivesCounts,
        externalContentCounts: externalContentCounts,
        totalContentCounts: totalContentCounts,
        genBloomsChart: genBloomsChart,
        bloomsCounts: bloomsCounts,
        query: "",
        queryResponse: "",
        querySources: [],
        surveys: {},
        surveysLoaded: false,
        objectivesQuery: '',
        objectivesEvaluatorResponse: [],
        emoji: emoji,
        emojiTF: emojiTF,
        individualContent: {},
        calcCourseContentCounts: calcCourseContentCounts
      }
    },
    methods: {
      async generateSummary() {
        this.loadingSummary = true;
        let suggestions = await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${this.courseId}/summarize_suggestions`, {}, 'POST');
        this.course.suggestions = suggestions;
        this.loadingSummary = false;
      },
      removeLoadingElement(menuName) {
        let index = this.loadingMenus.indexOf(menuName);
        this.loadingMenus.splice(index, 1);
      },
      async loadSurveys() {
        let surveys = await bridgetoolsReq('https://surveys.bridgetools.dev/api/survey_data', {
            course_id: this.courseId
        }, 'POST');
        this.surveys = surveys;
        this.removeLoadingElement('surveys');
      },
      adjustHeight(event) {
        const textarea = event.target;
        textarea.style.height = 'auto'; // Reset height to auto
        textarea.style.height = `${textarea.scrollHeight}px`; // Set height to scrollHeight
      },
      setMenu(menu) {
        if (!this.loadingMenus.includes(menu)) {
          this.menuCurrent = menu;
          this.genBloomsChart(this.bloomsCounts);
        }
      },
      async submitObjectivesQuery() {
        let query = this.objectivesQuery;
        this.objectivesEvaluatorResponse = [];
        let response = await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/objectives/evaluate`, {course_code: this.courseCode, text: query}, 'POST');
        this.objectivesEvaluatorResponse = response;
      },
      async submitQuery() {
        let query = this.query;
        this.query = "";
        this.queryResponse = "";
        this.querySources = [];
        let response = await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/courses/${ENV.COURSE_ID}/query`, {query: query}, 'POST');
        this.queryResponse = response.response;
        this.querySources = response.sources;
      },
      getQuerySourceURL(source) {
        let type = source.type;
        if (type == 'quiz') type = 'quizzes';
        else type += 's';
        let url = '/courses/' + ENV.COURSE_ID + '/' + type + '/' + source.id;
        return url;
      },

      getSummary: async function () {
        let assignmentSummary = ``;
        for (let criterion in this.assignmentCounts) {
          if (criterion != 'num_reviews') {
            let score = this.assignmentCounts[criterion];
            if (criterion == 'clarity') score /= 2;
            let perc = Math.round((score / this.assignmentCounts.num_reviews) * 1000) / 10;
            assignmentSummary += `<${criterion}>${perc}% of ${this.assignmentCounts.num_reviews} assignments met this criterion.<${criterion}/>`
          }
        }

        let quizSummary = ``;
        for (let criterion in this.quizCounts) {
          if (criterion != 'num_reviews') {
            let score = this.quizCounts[criterion];
            if (criterion == 'clarity') score /= 2;
            let perc = Math.round((score / this.quizCounts.num_reviews) * 1000) / 10;
            quizSummary+= `<${criterion}>${perc}% of ${this.quizCounts.num_reviews} quizzes met this criterion.<${criterion}/>`
          }
        }

        let surveySummary = ``;
        /*
        for (let q in this.surveyQuestions) {
          let question = this.surveyQuestions[q];
          if (question.type !== 'Rating' && question.type !== 'Text') continue;
          surveySummary += `<question>${question.question}</question>`;
          if (question.type === 'Rating') {
            surveySummary += `<results>${question.agree_perc}% of users agree with this statement.</results>`
          } else if (question.type === 'Text') {
            let comments = ``;
            question.comments.forEach(comment => comments += `<student_comment>${comment}</student_comment>`);
            surveySummary += `<comments>${comments}</comments>`
          }
        }
        */
        let summary = `
        <assignment_reviews>${assignmentSummary}</assignment_reviews>
        <quiz_reviews>${quizSummary}</quiz_reviews>
        <student_survey_results>${surveySummary}</student_survey_results>
        `
      },

    }
  });
  return APP;
}