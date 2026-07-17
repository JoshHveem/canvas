(async function() {
  Vue.component('rce-modal-header-left', {
    template: ` 
      <rce-editor-icon
        @click="create"
        title="Create a left aligned header at the top of the current modal."
        :icon="'HeaderLeftText.png'"
      ></rce-editor-icon>
    `,
    props: {
      defaultimg: {
        type: String,
        default: ""
      },
      getContainer: {
        type: Function,
        default: () => {}
      },
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
        editor.selection.select(editor.selection.getNode(), true);
        editor.selection.collapse(true);
        tinymce.activeEditor.execCommand('mceInsertContent', false, `
          <div style="background-color: #FFFFFF; margin-top: 1rem; padding: 0.5rem;">
            <h2
              style="
                margin-top: -2rem;
                background-color: ${this.color};
                color: #FFFFFF;
                position: relative;
                z-index: 2;
                font-size: 2rem;
                display: inline-block;
                margin-left: -1rem;
                padding-left: 2rem;
                width: calc(90% - 1rem);
              " 
            ><strong>HEADER</strong></h2>
            <div>
              <p>CONTENT</p>
            </div>
          </div>
          <p>&nbsp;</p>
        `)
      },
    },

    destroyed: function () {}
  });
})();
