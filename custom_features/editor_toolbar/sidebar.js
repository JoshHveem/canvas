(function() {
  const WIDTH = 200;
  $('body').append(`
  <div 
    id="btech-editor-vue"
    :style="{
      'width': width + 'px',
      'right': minimized ? '-' + width + 'px' : '0px'
    }"
    style="position: fixed; top: 0; height: 100%; background-color: #f1f1f1;"
  >
    <div
      v-if="minimized"
      @click="maximize"
      style="
        position: absolute;
        top: 2rem;
        background-color: #d22232;
        color: white;
        padding: 0.5rem;
        cursor: pointer;
      "
      :style="{
        'right': width + 'px'
      }"
    >
      <i class="icon-edit"></i>
    </div>
    <div
      v-else
    >
      <div 
        style="
          text-align: center;
          background-color: #d22232;
          color: white;
          cursor: pointer;
          user-select: none;
        "
        @click="minimize"
      >
        BTECH Editor
        <b>&#8250;</b>
      </div>

      <!--MODULES-->
      <div>
        <input type="color" id="btech-custom-editor-buttons-color" value="#d22232" style="width: 48px; height: 28px; padding: 4px; padding-right: 0px;" list="default-colors"/>
        <datalist id="default-colors">
          <option>#d22232</option>
          <option>#2232d2</option>
          <option>#1f89e5</option>
          <option>#32A852</option>
          <option>#E2A208</option>
          <option>#000000</option>
          <option>#FFFFFF</option>
        </datalist>
      </div>
      <div>
        <i
          @click="addGradebookModal"
          class="icon-gradebook"
        ></i>
        <i
          @click="addBannerModal"
          class="icon-text"
        ></i>
        <i
          @click="addHeaderBannerModal"
          class="icon-text"
        ></i>
        <i
          @click="addHeaderHexModal"
          class="icon-text"
        ></i>
        <i
          @click="addImageRightModal"
          class="icon-image"
        ></i>
      </div>

      <!--ELEMENTS-->
      <div>
        <i
          @click="addHexImage"
          class="icon-image"
        ></i>
        <i
          @click="addCallout"
          class="icon-note-light"
        ></i>
        <i
          @click="addSidebarComment"
          class="icon-discussion"
        ></i>
      </div>

      <div>
      </div>
    </div>
  </div>
  `);
  new Vue({
    el: '#btech-editor-vue',
    mounted: async function () {
      $('#wrapper').css('margin-right', `${this.width}px`);
    },
    data: function () {
      return {
        minimized: false,
        width: 250,
        defaultImg: 'https://bridgetools.dev/canvas/media/image-placeholder.png',
        colors: {
          primary: "#D22232",
          secondary: "#B11121",
          callout: "#F1F1F1",
          font: "#FFFFFF",
          bodyfont: "#000000",
          bg: "#FFFFFF"
        } 
      }
    },
    methods: {
      setCSSVariables: function () {
        document.querySelector(':root').style.setProperty('--font', 'Roboto');
        for (let color in this.colors) {
          document.querySelector(':root').style.setProperty('--color-' + color, this.colors[color]);
        }
      },
      maximize: function () {
        $('#wrapper').css('margin-right', this.width + 'px');
        this.minimized = false;
      },
      minimize: function () {
        $('#wrapper').css('margin-right', '0px');
        this.minimized = true;
      },
      addGradebookModal: function () {
        let editor = tinymce.activeEditor;
        editor.execCommand("mceInsertContent", false, `
          <p class="btech-grading-scheme btech-hidden" style="border: 1px solid black;">This will be replaced by a table populated with the course Grading Scheme.</p>
        `);
      },
      addHexImage: function() {
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
              src="${this.defaultImg}"
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
      addCallout: function () {
        let editor = tinymce.activeEditor;
        let selection = editor.selection;
        let selectionContent = selection.getContent();
        console.log(selectionContent);
        if (selectionContent !== "") {
          editor.execCommand("mceReplaceContent", false, `
            <div class="btech-callout-box flat">
            ${selectionContent}
            </div>
          `);
        } else {
          editor.execCommand("mceInsertContent", false, `
            <div class="btech-callout-box flat">
              <p>Callout Content</p>
            </div>
          `);
        }
      },


      initFormattedContent: function () {
        let editor = tinymce.activeEditor;
        let body = editor.getBody();
        $(body).find('.btech-formatted-content-wrapper').each(() => {
          $(this).unwrap();
        });
        $(body).contents().wrap(`<div class="btech-formatted-content-wrapper"></div>`);
      },

      getContainer: function (element) {
        let container = element;
        //loop until parent is 
        while (container.parent().prop("tagName") != "body" && !container.parent().hasClass("btech-formatted-content-wrapper")) {
          if (container != $(container.parent())) break;
          container = $(container.parent());
          console.log(container);
        }
        return container;
      },

      addImageLeftModal: function () {
        let editor = tinymce.activeEditor;
        let container = this.getContainer($(editor.selection.getNode()));
        container.after(`
          <div
            class="
              btech-formatted-content-modal
              btech-formatted-content-image-left-wrapper
            "
            style="
              display: grid;
              grid-template-columns: 1fr 2fr;
            "
          >
            <img
              style="width: 100%;"
              src="${this.defaultImg}"
            />
            <div>
              <p>TEXT</p>
            </div>
          </div>
        `)
        console.log(container);
      },
      addImageRightModal: function () {
        let editor = tinymce.activeEditor;
        let container = this.getContainer($(editor.selection.getNode()));
        container.after(`
          <div
            class="
              btech-formatted-content-modal
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
              src="${this.defaultImg}"
            />
          </div>
        `)
        console.log(container);
      },

      addHeaderBannerModal: function () {

      },

      addHeaderHexModal: function () {
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
                src="${this.defaultImg}"
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

      addBannerModal: function () {
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
                src="${this.defaultImg}"
              >
            </div>

            <h2
              style="
                margin-top: -2rem;
                background-color: #D22232;
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

      addSidebarComment () {
        console.log("COMMENT");
        let editor = tinymce.activeEditor;
        let node = $(editor.selection.getNode());
        let commentId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        node.addClass(`btech-sidebar-content-${commentId}`);
        node.addClass('btech-sidebar-content')
        let comment = $(`<div class="btech-sidebar-comment btech-sidebar-comment-${commentId}" style="border: 1px solid #F88; padding: 5px;">comment</div>`);
        node.after(comment);
      }
    }
  });
})();