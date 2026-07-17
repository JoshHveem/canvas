(async function() {
  Vue.component('rce-information-box', {
    template: ` 
      <i
        @click="create"
        class="icon-unmuted"
        title="Create an information box that uses the selected color."
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
      create: function () {
        let editor = tinymce.activeEditor;
        let selection = editor.selection;
        let color = this.color;
        let content = selection.getContent();
        if (content == "") content = "Information Box Content"
        editor.execCommand("mceReplaceContent", false, `
          <table class="btech-example-table" style="width: 90%; border-collapse: collapse; border-color: gray; margin-left: auto; margin-right: auto; height: 62px;" border="0" cellpadding="10">
            <tbody>
              <tr style="background-color: ` + color + `;">
                <td style="width: 1%; height: 32px;"><span style="font-size: 14pt;"><strong><span style="color: #ffffff;">&nbsp;</span></strong></span></td>
                <td style="width: 98%; height: 32px;"><span style="font-size: 14pt;"><strong><span style="color: #ffffff;">&nbsp;Title</span></strong></span></td>
                <td style="width: 1%; height: 32px;"><span style="font-size: 14pt;"><strong><span style="color: #ffffff;">&nbsp;</span></strong></span></td>
              </tr>
              <tr style="height: 30px; background-color: #fff; color: #000;">
                <td style="height: 30px;"><span>&nbsp;</span></td>
                <td style="height: 30px;">
                  ${content}
                </td>
                <td style="height: 30px;"><span>&nbsp;</span></td>
              </tr>
            </tbody>
          </table>
        `);
      },
    },

    destroyed: function () {}
  });
})();