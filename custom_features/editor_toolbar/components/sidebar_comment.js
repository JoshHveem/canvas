(async function() {
  Vue.component('rce-sidebar-comment', {
    template: ` 
      <i
        @click="create"
        class="icon-discussion"
        title="Create a callout that moves to the side of the page and highlights selected content."
      ></i>
    `,
    props: {
      color: {
        type: String,
        default: "#FFFFFF"
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
      create() {
        let editor = tinymce.activeEditor;
        let node = $(editor.selection.getNode());
        // need to add in a check to see if there is an existing comment here and delete if there. If no comment exists, then create a comment. 
        // get classes, if btech-sidebar-content exists
        //// then delete that class, get the btech-sidebar-content-<id> and delete that class and use the id to delete the comment div
        // if btech-sidebar-comment is the class, then do nothing, because don't want comments on comments
        // if neither exists, then create the comment
        let commentId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        node.addClass(`btech-sidebar-content-${commentId}`);
        node.addClass('btech-sidebar-content');
        let comment = $(`<div class="btech-sidebar-comment btech-sidebar-comment-${commentId}" style="border: 1px solid ${this.color}; padding: 5px;">comment</div>`);
        node.after(comment);
      }
    },

    destroyed: function () {}
  });
})();