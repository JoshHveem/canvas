(async function() {
  Vue.component('rce-callout-header', {
    template: ` 
      <rce-editor-icon
        @click="create"
        title="Create a gray, centered callout box with a header."
        :icon="'CalloutHeader.png'"
      ></rce-editor-icon>
    `,
    props: {
      color: {
        type: String,
        default: '#FFFFFF'
      }
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
      create: function () {
        let editor = tinymce.activeEditor;
        let selection = editor.selection;
        let selectionContent = selection.getContent();
        let innerContent = "Callout Content";
        if (selectionContent !== "") {
          innerContent = selectionContent;
        }
        let content = `
            <div 
              style="
                background-color: #F6F6F6;
                padding: 0.5rem;
                margin: 0.5rem auto 1rem auto;;
                width: 80%;
                max-width: 70ch;
                border: 1px solid #DDD;
              "
            >
            <h3 style="
              margin-top: -1.5rem; 
              text-align: center; 
              font-size: 1.5rem;"
            >
              <span style="
                background-color: ${this.color};
                color: #ffffff; 
                z-index: 2; 
                display: inline-block; 
                margin: auto; 
                width: 90%;
                "
              >
                <strong>Callout Header</strong>
              </span>
            </h3>
            <p>${innerContent}</p>
            </div>
          `
        if (selectionContent !== "") {
          editor.execCommand("mceReplaceContent", false, content);
        } else {
          editor.selection.select(editor.selection.getNode(), false);
          editor.selection.collapse(false);
          editor.execCommand("mceInsertContent", false, content);
        }
      },
    },

    destroyed: function () {}
  });
})();
