(function () {
  async function addItems(courseId, moduleId, item, modTitle) {
    event.preventDefault();
    await createQuiz(courseId, moduleId, item, modTitle);
    await createDiscussion(courseId, moduleId, item, modTitle);
    location.reload(true);
  }

  async function createQuiz(courseId, moduleId, item, modTitle) {
    let url = "/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items?include[]=content_details";
    let score = 0;
    let quizId, hours;
    let answers = [];
    let firstCheck = false;
    await $.get(url, function (data) {
      for (let i = 0; i < data.length; i++) {
        let content = data[i].content_details;
        if (content.points_possible !== undefined && data[i].published === true) {
          score += content.points_possible;
        }
      }
    });
    hours = Math.floor(score / 10);
    url = "/api/v1/courses/" + courseId + "/quizzes";
    await $.post(url, {
      quiz: {
        title: modTitle + ': Hours Submission',
        message: `<p><span style="font-size: 18pt;"><strong>Submit Your Hours for This Module</strong></span></p>
<p><span>Report on your progress, and be as accurate as possible. This information is not graded. It is used to help the instructor better meet the needs of the student.</span></p>
<p><span>Please be specific when talking about labs or quizzes that took a lot less or a lot more time than listed.</span></p>`,
        'quiz_type': 'assignment',
        'allowed_attempts': -1,
        'question_count': 3,
        'published': false
      }
    }).done(function (data) {
      quizId = data.id;
    });
    url = "/api/v1/courses/" + courseId + "/quizzes/" + quizId + "/questions";
    for (let i = 0; i < 5; i++) {
      let hour = i + hours - 2;
      if (hour > 0) {
        let answerText = "";
        if (firstCheck === false) {
          answerText = "<" + hour + " hours";
          firstCheck = true;
        } else if (i === 4) answerText = ">" + (hour + 1) + " hours";
        else answerText = hour + "-" + (hour + 1) + " hours";
        answers.push({
          'answer_text': answerText,
          'answer_weight': 0
        });
      }
    }
    await $.post(url, {
      question: {
        'question_name': 'Time Spent in Course',
        'question_text': 'Approximately how many hours total have you spent on this module?',
        'question_type': 'multiple_choice_question',
        'points_possible': 0,
        'answers': answers
      }
    });
    await $.post(url, {
      question: {
        'question_name': 'Labs & Quizzes Feedback',
        'question_text': `Were there any labs or quizzes that took longer or shorter than what was listed? If so, which one and why do you think it was shorter/longer than anticipated?`,
        'question_type': 'essay_question',
        'points_possible': 0
      }
    });
    await $.post(url, {
      question: {
        'question_name': 'Biggest Challenge',
        'question_text': `What did you consider to be your biggest challenge in this section?`,
        'question_type': 'essay_question',
        'points_possible': 0
      }
    });
    url = "/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items";
    await $.post(url, {
      module_item: {
        'title': modTitle + ': Hours Submission',
        'type': 'Quiz',
        'content_id': quizId,
        'indent': 0,
        'position': 999
      }
    });
    url = "/api/v1/courses/" + courseId + "/quizzes/" + quizId;
    await $.put(url, {
      quiz: {
        published: true
      }
    })
    return;
  }

  async function createDiscussion(courseId, moduleId, item, modTitle) {
    let url = "/api/v1/courses/" + courseId + "/discussion_topics";
    await $.post(url, {
      title: modTitle + ': Troubleshooting Discussion',
      message: `<p><span style="font-weight: 400;">This is a discussion forum where you can post questions or problems you are experiencing with the module. Any questions you have could help other students working through the class as well.&nbsp;</span></p>
<p><span style="font-weight: 400;">When you encounter a problem, follow these steps:</span></p>
<ol>
<li style="list-style-type: none;">
<ol>
<li><span style="font-weight: 400;">Reread the instructions</span></li>
<li><span style="font-weight: 400;">Ask a friend</span></li>
<li><span style="font-weight: 400;">Post in the module discussion </span></li>
</ol>
</li>
</ol>
<p><span style="font-weight: 400;">You can post photos, videos, or text in the discussion post depending on how you feel will best communicate your question. </span></p>
<p><span style="font-weight: 400;">If you find a question in the discussion helpful to you, please like it so the most helpful questions come to the top. Posts that are irrelevant will be removed.&nbsp;</span></p>`,
      discussion_type: 'threaded',
      published: true,
      pinned: true
    }, function (data) {
      let url = "/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items";
      $.post(url, {
        module_item: {
          'title': data.title,
          'type': 'Discussion',
          'content_id': data.id,
          'indent': 1,
          'position': 1000
        }
      });
    });
    return;
  }

  addToModuleMenu("Add Module Surveys", "Adds a quiz and a discussion to the end of the module as resources.", addItems);
})();