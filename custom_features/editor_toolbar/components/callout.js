(async function() {
  Vue.component('rce-callout', {
    template: ` 
      <rce-editor-icon
        @click="create"
        title="Create a gray, centered callout box."
        :icon="'Callout.png'"
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
        if (selectionContent !== "") {
          editor.execCommand("mceReplaceContent", false, `
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
             <p>${selectionContent}</p>
            </div>
          `);
        } else {
          editor.selection.select(editor.selection.getNode(), false);
          editor.selection.collapse(false);
          editor.execCommand("mceInsertContent", false, `
            <div 
              style="
                background-color: #F6F6F6;
                padding: 0.5rem;
                margin: 0.5rem auto 1rem auto;;
                width: 90%;
                max-width: 60ch;
                border: 1px solid #DDD;
              "
            >
              <p>Callout Content</p>
            </div>
          `);
        }
      },
    },

    destroyed: function () {}
  });
})();