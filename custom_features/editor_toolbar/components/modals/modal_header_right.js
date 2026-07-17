(async function() {
  Vue.component('rce-modal-header-right', {
    template: ` 
      <rce-editor-icon
        @click="create"
        title="Create a right aligned header at the top of the current modal."
        :icon="'HeaderRightText.png'"
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
        editor.selection.select(editor.selection.getNode(), false);
        editor.selection.collapse(false);
        tinymce.activeEditor.execCommand('mceInsertContent', false, `
          <div style="background-color: #F6F6F6; margin-top: 1rem; border: 1px solid #DDD; padding: 0.5rem;">
            <h2
              style="
                margin-top: -2rem;
                text-align: right;
                background-color: ${this.color};
                color: #FFFFFF;
                position: relative;
                z-index: 2;
                font-size: 2rem;
                display: inline-block;
                padding-right: 2rem;
                width: calc(90% - 1rem);
                margin-left: calc(10%);
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

