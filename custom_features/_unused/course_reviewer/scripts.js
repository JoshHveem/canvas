function dateToString(date) {
  date = new Date(Date.parse(date));
  return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
}
const emoji = [
    '🥉',
    '🥈',
    '🥇'
];

const emojiTF = [
  '❌',
  '✔️'
];

var courseReviewerSettings = {};

async function getCourseReviewerSettings() {
  let userId = ENV.current_user_id;
  let settings = {};
  try {
    await $.get(`/api/v1/users/${userId}/custom_data/course_reviewer?ns=edu.btech.canvas`, (data) => {
      settings.show_scores = data.data.show_scores == 'true';
    });
  } catch (err) {
    settings = {
      show_scores: false
    }
    await $.put(`/api/v1/users/${userId}/custom_data/course_reviewer?ns=edu.btech.canvas`, {
      data: settings
    });
  }
  return settings;
}

async function updateCourseReviewerSettings(settings) {
  let userId = ENV.current_user_id;
  await $.put(`/api/v1/users/${userId}/custom_data/course_reviewer?ns=edu.btech.canvas`, {
    data: settings
  });
}

function criterionNameToVariable(name) {
  return name
    .toLowerCase()                            // Convert to lowercase
    .replace(/[^a-z0-9 ]/g, '')               // Remove non-alphanumeric characters except spaces
    .replace(/\s+/g, '_');                    // Replace spaces with underscores
}

async function getCriteria(reqType = null) {
  let criteriaGrouped = {};
  if (reqType === null) criteriaGrouped = (await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/criteria/grouped`))
  else criteriaGrouped[reqType] = (await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/criteria/type/${reqType}`));
  let criteria = {};
  for (let groupType in criteriaGrouped) {
    let criteriaData = criteriaGrouped[groupType];
    criteria[groupType] = {};
    for (let c in criteriaData) {
      let criterion = criteriaData[c];
      let name = criterionNameToVariable(criterion.name);
      criteria[groupType][name] = criterion;
    }
  }
  return criteria;
}

function sortCriteria(criteria) {
  // Get the sorted keys based on the custom sorting logic
  let sortedKeys = Object.keys(criteria).sort((a, b) => {
    let typeA = criteria[a].score_type;
    let typeB = criteria[b].score_type;
    
    // Sort by score_type first (number before boolean)
    if (typeA === 'number' && typeB !== 'number') return -1;
    if (typeA !== 'number' && typeB === 'number') return 1;
    
    // If score_type is the same, sort alphabetically by name
    return criteria[a].name.localeCompare(criteria[b].name);
  });

  // Create a new object with the sorted keys
  let sortedCriteria = {};
  sortedKeys.forEach(key => {
    sortedCriteria[key] = criteria[key];
  });

  return sortedCriteria;
}

function generateCriteriaHTML(criteria, data, cssclass='') {
  let criteriaHTML = ``;

  // Convert the object into an array and sort by score_type and name

  // Generate HTML for the sorted criteria
  for (let name of sortedCriteria) {
    let criterion = criteria[name];
    let val = data?.criteria?.[name] ?? 0;
    criteriaHTML += `<div title="${criterion.description}"><span style="font-size: 0.75rem; width: 8rem; display: inline-block;">${criterion.name}</span>`;
    
    if (criterion.score_type == 'boolean') {
      criteriaHTML += `<span>${val ? emojiTF[1] : emojiTF[0]}</span>`;
    }
    if (criterion.score_type == 'number') {
      criteriaHTML += `<span>${emoji?.[val] ?? ''}</span>`;
    }
    
    criteriaHTML += `</div>`;
  }
  if (data?.objectives) {
    criteriaHTML += `
      <div title="The content is aligned to the course objectives.">
        <span style="font-size: 0.75rem; width: 8rem; display: inline-block;">Alignment</span><span>${ (data?.objectives ?? []) > 0 ? emojiTF[1] : emojiTF[0]}</span>
      </div>
    `
  }

  return `<div class="${cssclass}">${criteriaHTML}</div>`;
}


function generateTopicTagsEl(data) {
  let el = $(`
    <div>
      <h2>Key Topics</h2>
    </div>
  `);
  for (let i in data.topic_tags) {
    let topic = data.topic_tags[i];
    let topicEl = $(`<span style="padding: 0.25rem; background-color: black; color: white; border-radius: 0.25rem; margin: 0 0.25rem;">${topic}</span>`);
    el.append(topicEl);
  }
  return el
}
// do we have a review?
async function generateDetailedContent(type, contentData, rubricData, contentCriteria, rubricCriteria, objectivesData) {
  let html = `
  <div style="background-color: white; font-weight: bold; padding: 0.5rem; border: 1px solid #AAA;">
    <span style="display: inline-block; font-size: 1.5rem;">Course Evaluation</span>
    <span style="display: inline-block; color: #AAA; font-size: 1rem;">Last Update: {{(new Date(contentData.last_update)).toLocaleDateString()}}</span></div>
  <div style="background-color: white; border-bottom: 1px solid #AAA;">
  <div style="background-color: white; border-bottom: 1px solid #AAA;">
    <div 
      v-for="(menu, m) in menuOptions" :key="m"
      :style="{
        'color': menuCurrent == menu ? '${bridgetools.colors.blue}' : '',
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
    <content-detailed
      :type="'${type}'"
      :objectives-data="objectivesData"
      :content-data="contentData"
      :content-criteria="contentCriteria"
      :rubric-data="rubricData"
      :rubric-criteria="rubricCriteria"
      :emoji="emoji"
      :emojitf="emojiTF"
    ></content-detailed>
  </div>
  <div v-if="menuCurrent == 'settings'">
    <settings></settings>
  </div>
  `;
  $("#btech-course-reviewer-detailed-report").append(html);
  let APP = new Vue({
    el: '#btech-course-reviewer-detailed-report',
    created: async function () {
      this.contentCriteria = sortCriteria(this.contentCriteria);
      this.rubricCriteria = sortCriteria(this.rubricCriteria);
    },
    data: function () {
      return {
        emoji: emoji,
        emojiTF: emojiTF,
        bloomsColors: bloomsColors,
        // genBloomsChart: genBloomsChart,
        sortCriteria: sortCriteria,
        courseId: ENV.COURSE_ID,
        objectivesData: objectivesData,
        contentData: contentData,
        rubricData: rubricData,
        contentCriteria: contentCriteria,
        rubricCriteria: rubricCriteria ?? {},
        courseCode: courseCode,
        year: year,
        menuCurrent: 'main',
        menuOptions: [
          'main',
          'settings'
        ],
      }
    },
    methods: {
      setMenu(menu) {
        this.menuCurrent = menu;
      },
      calcEmojiFromData(data, criteria, criterionName) {
        let criterion = criteria[criterionName];
        let val = data?.criteria?.[criterionName] ?? 0;
        if (criterion.score_type == 'boolean') {
          return (val ? emojiTF[1] : emojiTF[0]);
        }
        if (criterion.score_type == 'number') {
          return (emoji?.[val] ?? '');
        }
        return '';
      }
    }
  });
  return APP;
}

function generateRelevantObjectivesEl(data, objectivesData) {
  let objectives = [];
  for (let o in objectivesData) {
    let objective = objectivesData[o];
    objectives[objective.objective_id] = objective;
  }

  let relevantObjectivesString = ``;
  for (let i = 1; i < objectives.length; i++) {
    let objective = objectives[i];
    let isRelevant = data.objectives.includes(objective.objective_id);
    relevantObjectivesString += `<div style="${isRelevant ? '' : 'color: #CCC;'}"><span style="width: 1rem; display: inline-block;">${isRelevant ? '&#10003;' : ''}</span>${objective.objective_text}</div>`;
  }
  let relevantObjectivesEl = $(`
    <div class="btech-course-evaluator-content-box">
      <h2>Relevant Objectives</h2>
      ${relevantObjectivesString}
    </div>
    `);
  return relevantObjectivesEl;
}

function generateDetailedContentReviewEl(type, criteria, data) {
  let html = ``;
  if (data.minutes_to_complete !== undefined) {
    html += `
      <div class="btech-course-evaluator-content-box">
        <h2>Minutes to Complete</h2>
        <div>
          <span>${data.minutes_to_complete}</span>
        </div>
      </div> 
    `;
  }
  if (data.blooms !== undefined) {
    html += `
    `;
  }
  if (criteria !== undefined) {
    let criteriaHTML = generateCriteriaHTML(criteria, data);
    html += `
      <div class="btech-course-evaluator-content-box">
        ${criteriaHTML}
      </div> 
      <div class="btech-course-evaluator-content-box">
        <div title="Additional feedback generated by the AI reviewer" style="margin-top: 0.5rem; display: inline-block;">
          <h2>AI Feedback</h2>
          <p>${data.feedback}</p>
        </div>
      </div> 
    `;
  }
  let el = $(html);
  return el;
}

function calcEmoji(perc) {
  if (isNaN(perc) || !courseReviewerSettings.show_scores) return '⚪';
  if (perc < 0.5) return emoji[0]; // bronze
  if (perc < 0.8) return emoji[1]; // bronze
  return emoji[2]; // bronze
}


const bloomsColors = {
    'remember': '#F56E74',
    'understand': '#FEB06E',
    'apply': '#FEE06E',
    'analyze': '#B1D983',
    'evaluate': '#88C1E6',
    'create': '#A380C4',
    'n/a': '#C4C4C4'
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        // Generate a random index between 0 and i (inclusive)
        const j = Math.floor(Math.random() * (i + 1));
        // Swap elements array[i] and array[j]
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
  
function genBloomsChart(data) {
    // Set dimensions and radius
    const width = 150;
    const height = 150;
    const radius = Math.min(width, height) / 2;

    // Create an arc generator
    const arc = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    // Create a label arc generator
    const labelArc = d3.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);

    // Create a pie generator
    const pie = d3.pie()
        .sort(null)
        .value(d => d[1]);

    // Select the SVG element and set its dimensions
    const svg = d3.select("svg.blooms-chart")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Bind data to the pie chart
    const g = svg.selectAll(".arc")
        .data(pie(Object.entries(data)))
        .enter().append("g")
        .attr("class", "arc");

    // Append path elements for each slice
    g.append("path")
        .attr("d", arc)
        .style("stroke", "white")
        .style("fill", d => bloomsColors[d.data[0]]);

    // Create key for colors
    const key = d3.select(".blooms-chart-key");
    Object.entries(bloomsColors).forEach(([label, color]) => {
        key.append("div")
            .attr("class", "key-item")
            .style("display", "flex")
            .style("align-items", "center")
            .style("line-height", "1rem")
            .style("margin-bottom", "2px")
            .html(`<div class="key-color" style="background-color: ${color}; width: 1rem; height: 1rem; margin-right: 1rem; display: inline-block;"></div><div style="display: inline-block;">${label}</div>`);
    });
}

function calcCriteriaAverageScore(content, criteria) {
  let points = 0;
  let maxPoints = 0;
  // abort if nothing there
  if (criteria.length == 0) return 0;
  if ((content?.criteria ?? []).length == 0) return 0;
  for (let name in criteria) {
    let criterion = criteria[name];
    if (!criterion.active) continue
    let score = content.criteria[name];
    if (criterion.score_type == 'number') {
      maxPoints += 2; // eventually allow for dynamic max scores with a rubric
      points += score;
    }
    if (criterion.score_type == 'boolean') {
      maxPoints += 1;
      points += score ? 1 : 0;
    }
  }
  for (let name in content.additional_criteria) {
    let score = content.additional_criteria[name];
    maxPoints += 1;
    points += score;
  }
  if (isNaN(points)) points = 0;
  
  let averageScore = (points / maxPoints);
  if (averageScore > 1) averageScore = 1;
  if (averageScore < 0) averageScore = 0;
  return averageScore;
}

function setButtonHTML($button, data, criteria, rubricData = null, rubricCriteria = null) {
  if (data.ignore) {
    $button.html('🚫');
    return
  }

  let score = calcCriteriaAverageScore(data, criteria);
  if (rubricData === null) {
    $button.html(`<div class="btech-course-reviewer-score" style="position: absolute;">${calcEmoji(score)}</div>`);
  } else {
    let rubricScore = calcCriteriaAverageScore(rubricData, rubricCriteria);
    $button.html(`<div class="btech-course-reviewer-score-left" style="position: absolute; clip-path: inset(0 50% 0 0);">${calcEmoji(score)}</div><div class="btech-course-reviewer-score-right" style="clip-path: inset(0 0 0 50%);">⚪</div>`);
    $(`.btech-course-reviewer-score-right`).html(
        `${calcEmoji(rubricScore)}`
    );
  }
}

function addTopics(counts, dataList) {
    for (let i in dataList) {
        let data = dataList[i];
        // topic tags
        if (data.topic_tags) {
            for (let t in data?.topic_tags ?? []) {
                let tag = data.topic_tags[t];
                if (counts?.[tag] === undefined) counts[tag] = 0;
                counts[tag]  += 1;
            }
        }
    }
    return counts;
}

function addObjectives(counts, dataList) {
  for (let i in dataList) {
    let data = dataList[i];
    let objectives = data?.objectives ?? [];
    // objectives 
    if (counts['n/a'] == undefined) counts['n/a'] = 0;
    if (objectives.length > 0) {
        for (let o in objectives) {
            let objective = data.objectives[o];
            if (counts?.[objective] === undefined) counts[objective] = 0;
            counts[objective]  += 1;
        }
    } else {
        counts['n/a'] += 1;
    }
  }
  return counts;
}

function getCourseCodeYear(courseData) {
  let regex = /^([A-Z]{4} \d{4}).*(\d{4})(?=[A-Z]{2})/;
  let match = (courseData?.sis_course_id ?? '').match(regex);
  if (match) {
    courseCode = match[1];
    year = match[2];
  } else {
    match = ((courseData.course_code ?? '') + ' 2024XX').match(regex);
    if (match) {
      courseCode = match[1];
      year = match[2];
    } else {
      courseCode = '';
      year = '';
    }
  }
  return {
    courseCode: courseCode,
    year: year
  }
}

async function evaluateAssignment(courseId, courseCode, year, assignmentId, description, rubric, isLTI = false) {
  await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${courseId}/assignments/${assignmentId}/evaluate`, reqdata = {
      courseCode: courseCode,
      year: year,
      description: description,
      rubric: rubric,
      isLTI: isLTI
  }, type="POST");
}

function processQuestionStatistics(questionsList) {
  let hasFeedback = 0;
  for (let q in questionsList) {
    let question = questionsList[q];
    if ((question?.correct_comments?.length ?? 0 > 0) || (question?.incorrect_comments?.length ?? 0 > 0)) hasFeedback += 1;
  }
  let percHasFeedback = hasFeedback / questionsList.length;
  return {
    feedback: percHasFeedback
  }
}

function genQuizQuestionString(questionsList) {
  let questionStrings = [];
  for (let q in questionsList) {
    let question = questionsList[q];
    let questionSimplified = '';
    questionSimplified += `<question_type>${question.question_type}</question_type>`;
    questionSimplified += `<question_prompt>${question.question_text}</question_prompt>`;
    for (let a = 0; a < question.answers.length; a++) {
      let answer = question.answers[a];
      let isCorrect = answer.weight > 0;
      let questionAnswer = answer?.html ?? answer.text;
      if (isCorrect) {questionSimplified += `<answer_correct>${questionAnswer}</answer_correct>`;}
      else {questionSimplified += `<answer_option>${questionAnswer}</answer_option>`;}
    }
    questionStrings.push(`<quiz_item><quesiton_id>${question.id}</quesiton_id>${questionSimplified}</quiz_item>`);
  }
  questionStrings = shuffleArray(questionStrings).slice(0, 25);
  let questionsString= '';
  for (let q in questionStrings) {
      let questionString = questionStrings[q];
      questionsString += questionString;
  }
  return questionsString;
}

async function getQuizBankQuestionData(courseId, quizId) {
  let htmlString = '';
  try {
    htmlString = await $.ajax({
      url: `https://btech.instructure.com/courses/${courseId}/quizzes/${quizId}/edit`,
      method: 'GET',
      headers: {
        'Accept': 'text/html'
      }
    });
  } catch (err) {
    console.error(err);
  }
  // Regex to match the question bank IDs
  const regexGroupId = /groups\/(\d+)/g;

  // Array to store the question bank IDs
  const questionGroupIds = [];
  let match;

  // Loop through all matches in the string
  while ((match = regexGroupId.exec(htmlString)) !== null) {
    // The captured group contains the question bank ID
      if (!questionGroupIds.includes(match[1])) questionGroupIds.push(match[1]);
  }

  let preProcessedBankQuestions = [];
  for (let i in questionGroupIds) {
    let group = await $.get(`https://btech.instructure.com/api/v1/courses/${courseId}/quizzes/${quizId}/groups/${questionGroupIds[i]}`);
    if (group?.assessment_question_bank_id) {
      let bank = await $.get(`https://btech.instructure.com/courses/${courseId}/question_banks/${group.assessment_question_bank_id}/questions?page=1`);
      let questions = shuffleArray(bank.questions).slice(0, group.pick_count);
      preProcessedBankQuestions.push(...questions);
    }
  }

  let bankQuestions = [];
  for (let q in preProcessedBankQuestions) {
    let question = preProcessedBankQuestions[q].assessment_question;
    for (let qd in question.question_data) {
      question[qd] = question.question_data[qd];
    }
    bankQuestions.push(question);
  }
  return bankQuestions;
}

async function getQuizQuestionData(courseId, quizId) {
  let quizQuestions = await canvasGet(`/api/v1/courses/${courseId}/quizzes/${quizId}/questions`);
  return quizQuestions;
}

async function genQuestionsList(courseId, quizId) {
  let questionsList = []
  let bankQuestionsList = await getQuizBankQuestionData(courseId, quizId);
  questionsList.push(...bankQuestionsList);
  let quizQuestionsList = await getQuizQuestionData(courseId, quizId);
  questionsList.push(...quizQuestionsList);
  return questionsList;
}

async function genNewQuizzesQuestionsList(courseId, quizId) {
  return [];
}

async function evaluateDiscussion(courseId, courseCode, year, discussionId, description, rubric={}) {
  await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${courseId}/discussions/${discussionId}/evaluate`, reqdata = {
      courseCode: courseCode,
      year: year,
      description: description,
      rubric: rubric
  }, type="POST");
}

async function evaluateNewQuiz(courseId, courseCode, year, quizId, description) {
  // let questionsList = await genNewQuizzesQuestionsList(); 
  // let statistics = processQuestionStatistics(questionsList);
  await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${courseId}/quizzes/${quizId}/evaluate`, reqdata={
      courseCode: courseCode,
      year: year,
      description: description,
      questions: '<div>Questions Unavailable for Review</div>',
      // statistics: statistics 
  }, type="POST");
}

async function evaluateQuiz(courseId, courseCode, year, quizId, description) {
  let questionsList = await genQuestionsList(courseId, quizId);
  let statistics = processQuestionStatistics(questionsList);
  let questionsString = genQuizQuestionString(questionsList);
  await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${courseId}/quizzes/${quizId}/evaluate`, reqdata={
      courseCode: courseCode,
      year: year,
      description: description,
      questions: questionsString,
      statistics: statistics 
  }, type="POST");
}

async function ignoreItem(courseId, itemType, itemId, ignore=true) {
  let resp = await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${courseId}/${itemType}/${itemId}`, reqdata={
    ignore: ignore
  }, type="POST");
}

async function evaluatePage(courseId, courseCode, year, pageId, description) {
  await bridgetoolsReq(`https://reports.bridgetools.dev/api/reviews/courses/${courseId}/pages/${pageId}/evaluate`, reqdata={
      courseCode: courseCode,
      year: year,
      description: description,
  }, type="POST");
}

function toTitleCase(str) {
  str = str.replace(/_/g, ' ');
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}
(async function () {
  courseReviewerSettings = await getCourseReviewerSettings();
})();