(async function() {
  Vue.component('rce-modal-banner', {
    template: ` 
      <rce-editor-icon
        @click="create"
        title="Create a banner image."
        :icon="'EditorIcon_HeaderRightText_.png'"
      ></rce-editor-icon>
    `,
    props: {
      color: {
        type: String,
        default: "#FFFFFF"
      },
      deafultimg: {
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
        // look into a way to do gradient background colors
        // background-image: linear-gradient(90deg, rgba(154,6,8,1) 0%, rgba(179,11,15,1) 64%,rgba(210,34,50,1)  100%);
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
              " 
            ><strong>HEADER</strong></h2>
          </div>
          <div style="background-color: #ffffff; margin-top: 1rem; padding: 0.5rem;">
            <p>CONTENT</p>
          </div>
        `);
      },
    },

    destroyed: function () {}
  });
})();