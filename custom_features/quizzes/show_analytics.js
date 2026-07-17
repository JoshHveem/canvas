let list = $(".page-action-list");
if (list.find(".icon-stats").length == 0) {
  let listItem = $(`<li>
    <a href="/courses/${ENV.COURSE_ID}/quizzes/${ENV.QUIZ.id}/statistics">
      <i class="icon-stats"><span class="screenreader-only">Quiz Statistics</span></i> Quiz Statistics
    </a>
  </li>`);
  list.find("h2").after(listItem);
}