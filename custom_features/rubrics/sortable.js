IMPORTED_FEATURE = {};
if (window.location.pathname.includes("/rubrics") === true || window.location.pathname.includes("/assignments/") === true) {
  IMPORTED_FEATURE = {
    initiated: false,
    async _init() {
      await getElement("#add_learning_outcome_link");
      this.makeSortable(); 
      //this.attachButton();
    },

    pastToPresent(verb) {
      let newVerb = '';
      let vowels = ['a', 'e', 'i', 'o', 'u'];
      if (verb === 'did') {
        newVerb = 'do';
      } else if (verb ==='took') {
        newVerb = 'take';
      } else {
        newVerb = verb.replace("ed", "");
        if (newVerb !== verb) {
          let prepenultimateChar = newVerb.charAt(newVerb.length - 3);
          let penultimateChar = newVerb.charAt(newVerb.length - 2);
          let ultimateChar = newVerb.charAt(newVerb.length - 1);
          if (vowels.includes(penultimateChar) && !vowels.includes(prepenultimateChar) && ultimateChar !== 'l') {
            newVerb += 'e';
          }
        }
      }
      return newVerb;
    },

    trimCriteria(criteria) {
      criteria = criteria.replace(" properly","");
      criteria = criteria.replace(" correctly","");
      return criteria;
    },

    getVerb(pos) {
    },

    createSkilled(original) {
      let pos = original.indexOf('tudent') + 7;
      let output = [original.slice(0, pos), 'correctly ', original.slice(pos)].join('');
      output = original;
      return output;
    },

    createModeratelySkilled(original) {
      let pos = original.indexOf('tudent') + 7;
      let trimmed = this.trimCriteria(original);
      let verbEndPos = trimmed.indexOf(' ', pos);
      let verb = trimmed.substring(pos, verbEndPos);
      let newVerb = this.pastToPresent(verb);
      trimmed = trimmed.replace(verb, newVerb);
      let output = [trimmed.slice(0, pos), 'needed some prompting to ', trimmed.slice(pos)].join('');
      return output;
    },

    createTryAgain(original) {
      let pos = original.indexOf('tudent') + 7;
      let trimmed = this.trimCriteria(original);
      let verbEndPos = trimmed.indexOf(' ', pos);
      let verb = trimmed.substring(pos, verbEndPos);
      let newVerb = this.pastToPresent(verb);
      trimmed = trimmed.replace(verb, newVerb);
      let output = [trimmed.slice(0, pos), 'was unable to ', trimmed.slice(pos)].join('');
      return output;
    },

    makeSortable() {
      $('table.rubric_table tbody').sortable();
    },

    attachButton() {
      //only line needed to make rubrics sortable
      //Everything below this is only for Instructional Designers. It adds stuff to auto fill rubrics but is not useful for most courses.
      $('table.rubric_table tbody').children('tr').each(function(element) {
        let toolList = $(this).find('td.criterion_description div.editing');
        let criteriaDescription = $(this).find('td.criterion_description span.description_title').text();
        toolList.find('button.fill_ratings').remove();
        let deleteIcon = toolList.find("a.delete_criterion_link");
        deleteIcon.after('<button class="fill_ratings">+</button>');
        toolList.find('.fill_ratings').click({parent: this, criteria: criteriaDescription}, function(event) {
          let parent = event.data.parent;
          let criteriaDescription = event.data.criteria;
          if (criteriaDescription.indexOf(' ') === -1 || criteriaDescription === "Description of criterion") {
            criteriaDescription = "Student did a task";
            $(parent).find('td.criterion_description span.description_title').text(criteriaDescription);
          }
          let cells = $(parent).find('table.ratings').find("td");
          let skilled = cells.get(0);
          $(skilled).find('.rating_long_description').text(createSkilled(criteriaDescription));
          $(skilled).find('.rating_description_value').text("Skilled");
          let moderatelySkilled = cells.get(1);
          $(moderatelySkilled).find('.rating_long_description').text(createModeratelySkilled(criteriaDescription));
          $(moderatelySkilled).find('.rating_description_value').text("Moderately Skilled");
          if (cells.get(2) !== undefined) {
            let tryAgain = cells.get(2);
            $(tryAgain).find('.rating_long_description').text(createTryAgain(criteriaDescription));
            $(tryAgain).find('.rating_description_value').text("Try Again");
          }
        });
      });
    }
  }
}