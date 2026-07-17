(async function() {
  Vue.component('rce-editor-icon', {
    template: ` 
      <div>
        <img
          :src="'https://bridgetools.dev/canvas/media/editor-icons/' + icon"
        ></img>
      </div>
    `,
    props: {
      icon: {
        type: String,
        default: ""
      },
    },
    computed: {},
    data() {
      return {
      } 
    },
    created: async function () {
    },

    methods: {
    },

    destroyed: function () {}
  });
})();

