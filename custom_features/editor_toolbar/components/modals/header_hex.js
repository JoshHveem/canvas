(async function() {
  Vue.component('rce-modal-header-hex', {
    template: ` 
      <i
        @click="create"
        class="icon-image"
        title=""
      ></i>
    `,
    props: {
      deafultimg: {
        type: String,
        default: ""
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
        let container = this.getContainer($(editor.selection.getNode()));
        container.after(`
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
                height: 5rem;
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
                background-color: var(--colors-primary);
                color: var(--colors-font);
                position: relative;
                z-index: 2;
                font-size: 2rem;
                display: inline-block;
                margin-left: 10%;
                padding-right: 3rem;
                width: 90%;
                border: 0.25rem solid #FFFFFF;
                text-align: right;
              " 
            ><strong>HEADER</strong></h2>
          </div>
        `);
      },
    },

    destroyed: function () {}
  });
})();
