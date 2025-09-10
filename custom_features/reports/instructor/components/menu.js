
Vue.component('department-report', {
  props: ['year'],
  template: `
    <div class="btech-card btech-theme">
      <h4 class="btech-card-title">Department Report</h4>
      <div class="btech-muted">Year: {{ year }}</div>
      <!-- TODO -->
    </div>
  `
});
Vue.component('course-report', { props: ['year'], template: `<div class="btech-card btech-theme"><h4 class="btech-card-title">Course Report</h4><div class="btech-muted">Year: {{ year }}</div></div>` });
Vue.component('student-report', { props: ['year'], template: `<div class="btech-card btech-theme"><h4 class="btech-card-title">Student Report</h4><div class="btech-muted">Year: {{ year }}</div></div>` });
