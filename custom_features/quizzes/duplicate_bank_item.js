(async function () {
  let regex = /\/courses\/([0-9]+)\/question_banks\/([0-9]+)/;
  let matches = window.location.pathname.match(regex);
  let courseId = matches[1];
  let bankId = matches[2];
  $("#questions .question_holder").each(function () {
    let question = $(this).find(".question");
    let questionId = (question.attr("id")).replace("question_", "");
    let dupButton = $('<a href="#" class="no-hover" title="Duplicate this Question"><i class="icon-plus standalone-icon"><span class="screenreader-only">Duplicate this Question</span></i></a>');
    dupButton.click(function () {
      duplicateQuestion(questionId);
    });
    question.find(".links").prepend(dupButton);
  });

  async function duplicateQuestion(questionId) {
    let url = window.location.origin + "/courses/" + courseId + "/question_banks/" + bankId + "/move_questions";
    let questions = {};
    questions[questionId] = 1;
    await $.post(url, {
      multiple_questions: 0,
      assessment_question_bank_id: bankId,
      copy: 1,
      move: 0,
      questions: questions
    });
    location.reload();
  }
})();