let main = $("#dashboard");
main.prepend(`
<div class="ic-notification">
  <div class="ic-notification__icon" role="presentation" style="background: #FFF;">
    <img src="` + SOURCE_URL + `/media/btech_logo.png">
    <span class="screenreader-only">
      information
    </span>
  </div>
  <div class="ic-notification__content">
    <div class="ic-notification__message">
      
      <span class="notification_message">
        Welcome to Bridgerland. For help getting started, visit the <a href="/courses/480103" target="_blank" style="color: #000; cursor: pointer; text-decoration: underline;">Student Orientation</a> course.
      </span>
    </div>
    
  </div>
</div>
`);