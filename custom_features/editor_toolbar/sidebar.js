(async function() {
  const WIDTH = 200;
  async function postLoad() {
    let vueString = '';
    await $.get(SOURCE_URL + '/custom_features/editor_toolbar/sidebar.vue', null, function (html) {
      vueString = html.replace("<template>", "").replace("</template>", "");
    }, 'text');
    $('body').append(vueString);
    let app = new Vue({
      el: '#btech-editor-vue',
      mounted: async function () {
        $('#wrapper').css('margin-right', `${this.width}px`);
      },
      data: function () {
        return {
          minimized: false,
          width: 250,
          defaultimg: 'https://bridgetools.dev/canvas/media/image-placeholder.png',
          colors: {
            primary: "#B30B0F",
            secondary: "#A10102",
            callout: "#F6F6F6",
            font: "#FFFFFF",
            bodyfont: "#000000",
            bg: "#FFFFFF"
          } ,
          elColor: "#B30B0F"
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
          }
          return container;
        },
      }
    });
    let toggleMenuButton = $('<span><i style="color: black;" class="icon-edit"></i></span>')
    toggleMenuButton.click(() => {
      app.maximize();
    })
    $('span[title="Editor Statusbar"]').prepend(toggleMenuButton);
  }

  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/editor_icon.js').done(function () {});
  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/sidebar_comment.js').done(function () {});
  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/hex_image.js').done(function () {});
  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/callout.js').done(function () {});
  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/callout_header.js').done(function () {});
  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/citation.js').done(function () {});
  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/information_box.js').done(function () {});
  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/recolor.js').done(function () {});
  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/modals/image_left.js').done(function () {});
  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/modals/image_right.js').done(function () {});
  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/modals/header_banner.js').done(function () {});
  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/modals/modal_header_left.js').done(function () {});
  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/modals/modal_header_right.js').done(function () {});
  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/modals/header_hex.js').done(function () {});
  await $.getScript(SOURCE_URL + '/custom_features/editor_toolbar/components/modals/banner.js').done(function () {});
  postLoad();

})();