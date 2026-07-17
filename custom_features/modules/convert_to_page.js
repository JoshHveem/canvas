(function () {
  function convertAssignmentToPage(courseId, moduleId, item) {
    event.preventDefault();
    let itemId = item.find("div.ig-admin span").attr("data-content-id");
    let moduleItemId = item.find("div.ig-admin span").attr("data-module-item-id");
    $.get("/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items/" + moduleItemId, function (data) {
      let oldModuleItemData = data;
      $.get("/api/v1/courses/" + courseId + "/assignments/" + itemId, function (data) {
        $.post("/api/v1/courses/" + courseId + "/pages", {
          wiki_page: {
            title: data.name,
            body: data.description,
            published: oldModuleItemData.published
          }
        }, function (data) {
          $.post("/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items", {
            module_item: {
              title: data.title,
              type: 'Page',
              position: oldModuleItemData.position,
              indent: oldModuleItemData.indent,
              page_url: data.url
            }
          }, function (data) {
            $.delete("/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items/" + moduleItemId).done(function () {
              $.delete("/api/v1/courses/" + courseId + "/assignments/" + oldModuleItemData.content_id).done(function () {
                location.reload(true);
              });
            });
          });
        });
      });
    });
  }
  addToModuleItemMenu("Convert To Page", "Remove this item from the module", convertAssignmentToPage, "Assignment");
})();