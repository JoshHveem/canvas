(()=>{var s=$(".page-action-list");if(s.find(".icon-stats").length==0){let i=$(`<li>
    <a href="/courses/${ENV.COURSE_ID}/quizzes/${ENV.QUIZ.id}/statistics">
      <i class="icon-stats"><span class="screenreader-only">Quiz Statistics</span></i> Quiz Statistics
    </a>
  </li>`);s.find("h2").after(i)}})();
