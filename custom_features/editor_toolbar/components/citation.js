(async function() {
  Vue.component('rce-citation', {
    template: ` 
      <rce-editor-icon
        @click="citation"
        title="Create an in text citation."
        :icon="'Quote.png'"
      ></rce-editor-icon>
    `,
    props: {
    },
    computed: {},
    data() {
      return {
      } 
    },
    created: async function () {
    },

    methods: {
      // CREATES A COMMENT THAT APPEARS IN THE RIGHT MARGIN (PADDING) OF THE PAGE AND MOVES TO THE TOP OF THE ASSOCIATED ELEMENT EVEN ON PAGE RESIZE
    // FORMATS A CITATION
      citationInsert: function (bg) {
        let editor = tinymce.activeEditor;
        let name = $("#citation-name").val();
        let authorLast = $("#citation-author-last").val();
        let publisher = $("#citation-publisher").val();
        let date = $("#citation-year-published").val();
        let url = $("#citation-url").val();
        if (name != "" && authorLast != "") {
          let citationString = ""; 
          $(".citation-author").each(function() {
            let authorEl = $(this);
            let last = authorEl.find(".last-name").val();
            let first = authorEl.find(".first-name").val();
            if (last !== "") {
              if (first !== "") {
                citationString += (last + ", " + first.charAt(0) + ". ")
              } else {
                citationString += last + ". "
              }
            }
          })
          if (date !== "") {
            citationString += ("(" + date + "). ");
          }
          
          citationString += ("<i>" +name + "</i>. ");
          if (publisher !== "") {
            citationString += (publisher + ". ")
          }
          if (url !== "") {
            citationString = `<a href="${url}">${citationString}</a>`;
          }
          citationString = "<p class='btech-citation' style='text-align: right;'>" + citationString + "</p>";
          editor.execCommand("mceReplaceContent", false, `<p>`+citationString+`</p>`);
          bg.remove();
        }
      },

      citationKeypress: async function (bg) {
        let editor = tinymce.activeEditor;
        $(".citation-information").keypress(function (event) {
          var keycode = (event.keyCode ? event.keyCode : event.which);
          if (keycode == '13') {
            this.citationInsert(bg);
          }
          event.stopPropagation();
        });
      },

      citation: async function () {
        let bg = TOOLBAR.addBackground(false);
        let close = $(`<span class="btech-pill-text" style="background-color: black; color: white; cursor: pointer; user-select: none; position: absolute; right: 2rem;">Close</span>`);
        close.click(() => {bg.remove();});
        bg.find('#background-container').append(close);
        bg.find('#background-container').append(`
        <p>Name of Image, Book, Article, Video, etc.*</p>
        <input style='width: 100%; height: 40px; box-sizing: border-box;' type="text" class="citation-information" id="citation-name">
        <p>Author(s)*</p>
        <div id="citation-authors">
          <div class="citation-author">
            <input placeholder="first name" style='width: 49%; height: 40px; box-sizing: border-box;' type="text" class="citation-information first-name" id="citation-author-first">
            <input placeholder="last name" style='width: 49%; height: 40px; box-sizing: border-box;' type="text" class="citation-information last-name" id="citation-author-last">
          </div>
        </div>
        <a class='btn' id="citation-add-author">Add Author</a>
        <p>Year Published</p>
        <input style='width: 100%; height: 40px; box-sizing: border-box;' type="number" class="citation-information" id="citation-year-published">
        <p>Publisher</p>
        <input style='width: 100%; height: 40px; box-sizing: border-box;' type="text" class="citation-information" id="citation-publisher">
        <p>URL (If Applicable)</p>
        <input style='width: 100%; height: 40px; box-sizing: border-box;' type="text" class="citation-information" id="citation-url">
        <a class='btn' id="citation-submit">Create</a>
        `);
        let addAuthor = $("#citation-add-author");
        addAuthor.click(() => {
          $("#citation-authors").append(`
        <div class="citation-author">
          <input placeholder="first name" style='width: 49%; height: 40px; box-sizing: border-box;' type="text" class="citation-information first-name">
          <input placeholder="last name" style='width: 49%; height: 40px; box-sizing: border-box;' type="text" class="citation-information last-name">
        </div>
        `);
          this.citationKeypress(bg);
        });
        let submit = $("#citation-submit");
        submit.click(() => {
          this.citationInsert(bg);
        });
        this.citationKeypress(bg);
      }

    }, 

    destroyed: function () {}
  });
})();

