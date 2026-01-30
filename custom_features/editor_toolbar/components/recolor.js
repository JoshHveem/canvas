(async function() {
  Vue.component('rce-recolor', {
    template: ` 
      <rce-editor-icon
        @click="recolor"
        title="Swap existing colors for new colors."
        :icon="'ColorSwap.png'"
      ></rce-editor-icon>
    `,
    props: {
    },
    computed: {},
    data() {
      return {
      } 
    },
    created: async function () {
    },

    methods: {
      hexToRgb: function (hex) {
        // Remove the hash at the beginning of the hex code if it exists
        hex = hex.replace(/^#/, '');

        // Parse the hex string into integer values for red, green, and blue
        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);

        // Return the RGB representation
        return `rgb(${r}, ${g}, ${b})`;
      },
      // CREATES A COMMENT THAT APPEARS IN THE RIGHT MARGIN (PADDING) OF THE PAGE AND MOVES TO THE TOP OF THE ASSOCIATED ELEMENT EVEN ON PAGE RESIZE
    // FORMATS A CITATION
      recolorSubmit: function (bg) {
        let existingColor = this.hexToRgb($("#btech-recolor-existing-color").val());
        let newColor = this.hexToRgb($("#btech-recolor-new-color").val());
        let content = tinyMCE.activeEditor.getContent();
        let updatedContent = $(`<div>${content}</div>`);
        $(updatedContent).find('*').each(function() {
          // Check each element's CSS properties
          if ($(this).css('color') === existingColor) { 
              $(this).css('color', newColor);
          }
          if ($(this).css('background-color') === existingColor) {
              $(this).css('background-color', newColor);
          }
          if ($(this).css('border-color') === existingColor) {
              $(this).css('border-color', newColor);
          }
        });
       
        tinyMCE.activeEditor.setContent(updatedContent.html())
        bg.remove();
      },

      keypress: async function (bg) {
        $(".citation-information").keypress(function (event) {
          var keycode = (event.keyCode ? event.keyCode : event.which);
          if (keycode == '13') {
            this.recolorSubmit(bg);
          }
          event.stopPropagation();
        });
      },

      recolor: async function () {
        let bg = TOOLBAR.addBackground(false);
        let close = $(`<span class="btech-pill-text" style="background-color: black; color: white; cursor: pointer; user-select: none; position: absolute; right: 2rem;">Close</span>`);
        close.click(() => {bg.remove();});
        bg.find('#background-container').append(close);
        bg.find('#background-container').append(`
        <p>Existing Color</p>
        <input type="color" id="btech-recolor-existing-color" v-model="elColor" style="width: 48px; height: 28px; padding: 4px; padding-right: 0px;" list="existing-colors"/>
        <datalist id="existing-colors">
          <option>#B30B0F</option>
          <option>#2232d2</option>
          <option>#1f89e5</option>
          <option>#32A852</option>
          <option>#E2A208</option>
          <option>#000000</option>
          <option>#FFFFFF</option>
        </datalist>
        <input type="color" id="btech-recolor-new-color" v-model="elColor" style="width: 48px; height: 28px; padding: 4px; padding-right: 0px;" list="new-colors"/>
        <datalist id="new-colors">
          <option>#B30B0F</option>
          <option>#2232d2</option>
          <option>#1f89e5</option>
          <option>#32A852</option>
          <option>#E2A208</option>
          <option>#000000</option>
          <option>#FFFFFF</option>
        </datalist>
        <a class='btn' id="recolor-submit">Recolor</a>
        `);
        let submit = $("#recolor-submit");
        submit.click(() => {
          this.recolorSubmit(bg);
        });
        this.keypress(bg);
      }

    }, 

    destroyed: function () {}
  });
})();

