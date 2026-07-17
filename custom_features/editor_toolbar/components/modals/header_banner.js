(async function() {
  Vue.component('rce-modal-header-banner', {
    template: ` 
      <rce-editor-icon
        @click="create"
        title="Create a banner image."
        :icon="'EditorIcon_HeaderRightText_.png'"
      ></rce-editor-icon>
      <i
        @click="create"
        class="icon-text"
        title="Create a banner image with a text header."
      ></i>
    `,
    props: {
      color: {
        type: String,
        default: "#FFFFFF"
      },
      defaultimg: {
        type: String,
        default: ""
      },
      initFormattedContent: {
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
        let body = editor.getBody();
        this.initFormattedContent();
        let wrapper = $($(body).find('.btech-formatted-content-wrapper')[0]);
        wrapper.prepend(`
          <div
            class="
              btech-formatted-content-modal
              btech-formatted-content-banner-wrapper
            "
            style="
              width: 100%;
            " 
          >
            <div
              style="
                width: 100%;
                height: 10rem;
                overflow: hidden;
                position: relative;
                z-index: 1;
              " 
            >
              <img 
                style="
                  width:100%;
                "
                src="${this.defaultimg}"
              >
            </div>

            <h2
              style="
                margin-top: -2rem;
                background-color: ${this.color};
                color: #FFFFFF;
                position: relative;
                z-index: 2;
                font-size: 2rem;
                display: inline-block;
                margin-left: -2rem;
                padding-left: 3rem;
                width: 90%;
                border: 0.25rem solid #FFFFFF;
              " 
            ><strong>HEADER</strong></h2>
          </div>
        `);
      },
    },

    destroyed: function () {}
  });
})();
