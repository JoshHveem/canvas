IMPORTED_FEATURE = {};
if (/^\/courses\/[0-9]+\/quizzes\/[0-9]+\/edit/.test(window.location.pathname)) {
  IMPORTED_FEATURE = {
    initiated: false,
    bank_ids: [],
    _init: async function() {
      let feature = this;
      // load the bank data
      await feature.initBankIds();

      // init question searcher filter 
      let bankQuestionList = $("#find_question_dialog table.side_tabs_table td.left ul.bank_list");
      var questionObserver = new MutationObserver(function() {
        if (bankQuestionList.find("li").length > 1) {
          bankObserver.disconnect();
          feature.addFilterButton();
        }
      });
      questionObserver.observe(bankQuestionList[0], {'childList': true});

      // init bank searcher filter 
      let bankList = $("#find_bank_dialog ul.bank_list");
      bankList.before("<table><tbody><tr id='btech-banks-table'><td style='vertical-align: top;'><ul style='position: -webkit-sticky; position:sticky; top: 0;' class='btech-question-banks-sorter' id='btech-bank-courses'></ul></td><td id='btech-bank-display'></td></tr></tbody></table>");
      var bankObserver = new MutationObserver(function() {
        if (bankList.find("li").length > 1) {
          bankObserver.disconnect();
          feature.sortList();
        }
      });
      bankObserver.observe(bankList[0], {'childList': true});
    },

    addFilterButton: function() {
      let filterButton = $(`<a href="javascript:void(0)">This Course</a>`);
      let showButton = $(`<a href="javascript:void(0)">All Courses</a>`);
      let filterButtonContainer = $('<div style="display: inline-block; float: left; padding-right: 5px; line-height: 2.5em;"></div>');
      filterButtonContainer.append(filterButton);
      filterButtonContainer.append(showButton);
      showButton.hide();
      filterButton.click(() => {
        this.filterQuestionList();
        filterButton.hide();
        showButton.show();
      });
      showButton.click(() => {
        this.showAllQuestionsList();
        filterButton.show();
        showButton.hide();
      });
      $("#find_question_dialog").prepend(filterButtonContainer);
    },

    getBanks: async function() {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: `https://btech.instructure.com/courses/${ENV.COURSE_ID}/question_banks?inherited=1&page=1`,
          method: "GET",
          headers: {
            "accept": "application/json, text/javascript, application/json+canvas-string-ids, */*; q=0.01",
          },
          xhrFields: {
            withCredentials: true // Includes cookies in the request
          },
          referrerPolicy: "no-referrer-when-downgrade",
          success: function(response) {
            resolve(response);
          },
          error: function(jqXHR, textStatus, errorThrown) {
            reject(`AJAX Request Failed: ${textStatus}, ${errorThrown}`);
          }
        });
      });
    },

    getBankIds: async function() {
      let banks = await this.getBanks();
      let bankIds = banks.map(item => item.assessment_question_bank.id);
      return bankIds;
    },
    
    initBankIds: async function() {
      this.bank_ids = await this.getBankIds();
    },

    showAllQuestionsList: function() {
      let lis = $("#find_question_dialog table.side_tabs_table td.left ul.bank_list li.bank");
      lis.each(function() {
        let li = $(this);
        let id = li.find('.id').text().trim(); // get the id text and trim whitespace
        if (id != '') li.show();
      });
    },

   filterQuestionList: function() {
      let bankIds = this.bank_ids; // Assuming `this.bank_ids` is defined and is an array of IDs
      let lis = $("#find_question_dialog table.side_tabs_table td.left ul.bank_list li.bank");
      
      lis.each(function() {
        let li = $(this);
        let id = li.find('.id').text().trim(); // get the id text and trim whitespace
        if (!bankIds.includes(id)) {
          li.hide();
        }
      });
    },

    sortList: function() {
      let courseList = $("#btech-bank-courses");
      let displayLists = $("#btech-bank-display");
      let bankList = $("#find_bank_dialog ul.bank_list");
      bankList.attr('id', 'btech-banks-original');
      bankList.hide();
      let courseNames = [];
      let courseNamesToId = {};
      let bankItems = bankList.find("li.bank");
      bankItems.each(function () {
        let courseName = $(this).find("div.sub_content span.cached_context_short_name").text().trim();
        if (courseName !== "") {
          let courseId = $(this).data().context_id;
          let courseBankSelectorId = "btech-bank-course-" + courseId;
          let courseBankListId = "btech-bank-list-" + courseId;
          if (!courseNames.includes(courseName)) {
            courseNames.push(courseName);
            courseNamesToId[courseName] = courseId
            courseList.append("<li class='btech-bank-course' id='"+courseBankSelectorId+"'>"+courseName+"</li>");
            let courseBankSelector = $("#"+courseBankSelectorId);

            displayLists.append("<ul class='btech-question-banks-sorter' id='"+courseBankListId+"'></ul>");
            let courseBankList= $("#"+courseBankListId);
            courseBankList.hide();

            courseBankSelector.on("click", function() {
              $(courseList).find("li").each(function() {
                $(this).removeClass("selected");
              });
              $(this).addClass("selected");
              $(displayLists).find("ul").each(function() {
                $(this).hide();
              });
              let listId = $(this).attr("id").replace("btech-bank-course", "btech-bank-list");
              $("#"+listId).show();
            });
          }
          $("#"+courseBankListId).append($(this));
        }
      });
      courseNames.sort();
      let currentCourseName = $($("#breadcrumbs li")[1]).find(".ellipsible").text().trim();
      for (let i = 0; i < courseNames.length; i++) {
        let courseName = courseNames[i];
        let courseId = courseNamesToId[courseName];
        let courseBankSelectorId = "btech-bank-course-"+ courseId;
        let courseBankSelector = $("#"+courseBankSelectorId);
        if (courseName === currentCourseName) {
          courseList.prepend(courseBankSelector);
          courseBankSelector.after("<li></li>");
        } else {
          courseList.append(courseBankSelector);
        }
      }
    }
  }
}