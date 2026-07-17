(async function () {
  async function delay(ms) {
    // return await for better async stack trace support in case of errors.
    return await new Promise(resolve => setTimeout(resolve, ms));
  }
  async function getElement(selectorText, iframe = "") {
    let element;
    if (iframe === "") {
      element = $(selectorText);
    } else {
      element = $(iframe).contents().find(selectorText);
    }
    if (element.length > 0 && element.html().trim() !== "") {
      return element;
    } else {
      await delay(1000);
      return getElement(selectorText, iframe);
    }
  }
  async function checkElementGone(selectorText, iframe = "") {
    let element;
    if (iframe === "") {
      element = $(selectorText);
    } else {
      element = $(iframe).contents().find(selectorText);
    }
    if (element.length == 0 || element.html().trim() === "") {
      return;
    } else {
      await delay(1000);
      return getElement(selectorText, iframe);
    }
  }
  let criteria = [
    "Canvas or Other LMS Experience",
    "General ID Experience",
    "Extensive ID Experience (3+ years)",
    "Desired Skill Experience",
    "Extensive Skill Experience (3+ years)",
    "Relevant Degree",
    "Concrete Example of Competency",
    "Project Management",
    "Other (include note)",
    "Other (include note)",
    "Other (include note)"
  ];
  let flags = [
    "Spelling/Grammar",
    "Portfolio Shows Poor Skill",
    "Lacks Experience in Desired Skill",
    "Other (include note)",
    "Other (include note)",
    "Other (include note)"
  ];
  async function preparePopup() {
    //Get container
    let container = await getElement("#lb");
    //Add container for btech ratings
    container.find("div.applicants-rating-popup").after("<div id='btech-criteria'></div>");
    //create checkboxes
    $("#btech-criteria").append("<div>Criteria</div>");
    for (let i = 0; i < criteria.length; i++) {
      let criterion = criteria[i];
      $("#btech-criteria").append("<div><input style='background-color: blue;' class='btech-criterion btech-checkbox' type='checkbox'><label> " + criterion + "</label></div>");
    }
    $("#btech-criteria").append("<br>");
    $("#btech-criteria").append("<div>Flags</div>");
    for (let i = 0; i < flags.length; i++) {
      let flag = flags[i];
      $("#btech-criteria").append("<div><input style='background-color: red;' class='btech-flag btech-checkbox' type='checkbox'><label> " + flag + "</label></div>");
    }
    //handle selecting check boxes
    $("#btech-criteria .btech-checkbox").each(function () {
      $(this).click(function () {
        let sum = $(".btech-criterion:checkbox:checked").length - $(".btech-flag:checkbox:checked").length;
        if (sum < 1) sum = 1;
        else if (sum > 5) sum = 5;
        container.find(".applicant-rating > span").each(async function () {
          let star = $(this);
          let rating = parseInt(star.attr('data-rating'));
          star.removeClass('blue');
          if (rating <= sum) {
            star.addClass('blue');
          }
        });
      });
    });

    //create and set up save button
    //This is probably unnecessary since we can just hijack the star click
    /*
    $("#btech-criteria").append("<button>Save</button>");
    $("#btech-criteria button").click(function() {

        //calculate score
        let sum = $(".btech-criterion:checkbox:checked").length - $(".btech-flag:checkbox:checked").length;
        if (sum < 1) sum = 1;
        else if (sum > 5) sum = 5;
        //find the right star and click on it
        container.find(".applicant-rating > span").each(async function() {
            let rating = $(this).attr('data-rating');
            if (rating == sum) {
                $(this).trigger("click");
            }
        });
    });
    */

    //If click on any stars and comment is not blank, close window and open up comment box and prefill
    container.find(".applicant-rating > span").each(async function () {
      $(this).click(async function () {
        //create comment
        let positives = "";
        $(".btech-criterion").each(function () {
          if ($(this).prop("checked")) {
            positives += ("<div>" + $(this).parent().text() + "</div>");
          }
        });
        if (positives !== "") {
          comment += "<div>-Positives-</div>";
          comment += positives;
          comment += "<br>";
        }

        let flags = "";
        $(".btech-flag").each(function () {
          if ($(this).prop("checked")) {
            flags += ("<div>" + $(this).parent().text() + "</div>");
          }
        });
        if (flags !== "") {
          comment += "<div>-Red Flags-</div>";
          comment += flags;
        }

        if (comment !== "") {
          //handle various clicks to close the ratings box and open the notes box
          $("#lb input.lb-close").trigger("click");
          await checkElementGone("#lb");
          $("#lb input.lb-close").trigger("click");
          $("#add_note").trigger("click");
        }
      });
    });

  }

  //set up clicks on the preexisting applicant pro buttons
  let comment = "";
  $(".applicants-rating-popup").click(preparePopup);
  $("#add_note").click(async function () {
    if (comment !== "") {
      let div = await getElement("#add_note_div");
      let commentBox = $("#addNote");
      commentBox.html(comment);
      comment = "";
    }
  });
})();