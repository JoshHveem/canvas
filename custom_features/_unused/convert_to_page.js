(async function () {
  async function convertAssignmentToPage(courseId, moduleId, item) {
    // event.preventDefault();
    let itemId = item.find("div.ig-admin span").attr("data-content-id");
    let moduleItemId = item.find("div.ig-admin span").attr("data-module-item-id");
    let oldModuleItemData = await $.get("/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items/" + moduleItemId);
    let assignment = await $.get("/api/v1/courses/" + courseId + "/assignments/" + itemId);
    let page = await $.post("/api/v1/courses/" + courseId + "/pages", {
      wiki_page: {
        title: assignment.name,
        body: assignment.description,
        published: oldModuleItemData.published
      }
    });
    await $.post("/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items", {
      module_item: {
        title: page.title,
        type: 'Page',
        position: oldModuleItemData.position,
        indent: oldModuleItemData.indent,
        page_url: page.url
      }
    });
    await $.delete("/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items/" + moduleItemId);
    await $.delete("/api/v1/courses/" + courseId + "/assignments/" + oldModuleItemData.content_id);
    location.reload(true);
  }
  async function convertQuizToPage(courseId, moduleId, item) {
    // event.preventDefault();
    let itemId = item.find("div.ig-admin span").attr("data-content-id");
    let moduleItemId = item.find("div.ig-admin span").attr("data-module-item-id");
    let oldModuleItemData = await $.get("/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items/" + moduleItemId);
    let quiz = await $.get("/api/v1/courses/" + courseId + "/quizzes/" + itemId);
    let page = await $.post("/api/v1/courses/" + courseId + "/pages", {
      wiki_page: {
        title: quiz.title,
        body: quiz.description,
        published: oldModuleItemData.published
      }
    });
    await $.post("/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items", {
      module_item: {
        title: page.title,
        type: 'Page',
        position: oldModuleItemData.position,
        indent: oldModuleItemData.indent,
        page_url: page.url
      }
    });
    await $.delete("/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items/" + moduleItemId);
    await $.delete("/api/v1/courses/" + courseId + "/quizzes/" + oldModuleItemData.content_id);
    location.reload(true);
  }
  async function convertTextItemsToPage(courseId, moduleId, item) {
    // event.preventDefault();
    let itemId = item.find("div.ig-admin span").attr("data-content-id");
    let moduleItemId = item.find("div.ig-admin span").attr("data-module-item-id");
    let oldModuleItemData = await $.get("/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items/" + moduleItemId);
    let questions = await canvasGet(`/api/v1/courses/${courseId}/quizzes/${itemId}/questions`);
    for (let q in questions) {
        let question = questions[q];
        if (question.question_type != "text_only_question") continue;
        let pageTitle = question.question_name;
        if (pageTitle == "Question") pageTitle = oldModuleItemData.title;
        let pageBody = question.question_text;
        let page = await $.post("/api/v1/courses/" + courseId + "/pages", {
          wiki_page: {
            title: pageTitle,
            body: pageBody,
            published: oldModuleItemData.published
          }
        });
        await $.post("/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items", {
          module_item: {
            title: page.title,
            type: 'Page',
            position: oldModuleItemData.position++, // ++ increments it after setting it so the next one will be one greater
            indent: oldModuleItemData.indent,
            page_url: page.url
          }
        });
    }
    await $.delete("/api/v1/courses/" + courseId + "/modules/" + moduleId + "/items/" + moduleItemId);
    await $.delete("/api/v1/courses/" + courseId + "/quizzes/" + oldModuleItemData.content_id);
    location.reload(true);
  }

  addToModuleItemMenu("Convert To Page", "Remove this item from the module", convertAssignmentToPage, "Assignment");
  addToModuleItemMenu("Convert To Page", "Remove this item from the module", convertQuizToPage, "Quiz");
  // addToModuleItemMenu("Convert Text Items to Page", "Remove this item from the module", convertTextItemsToPage, "Quiz");
})();