(async function() {
  Vue.component('rce-hex-image', {
    template: ` 
      <i
        @click="create"
        class="icon-image"
        title="Create a hex shaped image."
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
        editor.execCommand("mceInsertContent", false, `
          <div
            class="btech-hex-mask"
            style="
              width: 200px; /* Adjust the size as per your needs */
              height: 230px;
              position: relative;
              margin: 0 auto;
              display: inline-block;
              clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
            "
          >
            <img
              src="${this.defaultimg}"
              style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                transform: rotate(30deg);
              "
            />
          </div>
        `);
      },
    },

    destroyed: function () {}
  });
})();