(async function () {
  //If possible, figure out a way to narrow this down because as is it checks every click on the body, which is pretty much every click
  $('body').on('click', '.bcs__row__associations button', async function (e) {
    rows = await getElement(".bca-associations-table tr");
    rows.each(function () {
      let spans = $(this).find("td span");
      if (spans.length > 0) {
        let courseId = $(this).attr("id").replace("course_", "");
        //set to go to settings page because if it goes to main page it'll sometimes cross list. This seems to only happen for non-admins
        $(spans[0]).wrapInner("<a href='/courses/" + courseId + "/settings' target='#'></a>");
      }
    });
  });
})();