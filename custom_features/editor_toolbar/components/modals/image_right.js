(async function() {
  Vue.component('rce-modal-image-right', {
    template: ` 
      <rce-editor-icon
        @click="create"
        title="Create a content modal with an image on the right and text content on the left."
        :icon="'TextImage.png'"
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
          <div
            class="
              btech-formatted-content-image-right-wrapper
            "
            style="
              display: grid;
              grid-template-columns: 2fr 1fr;
            "
          >
            <div>
              <p>TEXT</p>
            </div>
            <img
              style="width: 100%;"
              src="${this.defaultimg}"
            />
          </div>
        `)
      },
    },

    destroyed: function () {}
  });
})();