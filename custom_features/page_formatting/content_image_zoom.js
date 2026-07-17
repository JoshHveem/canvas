(function() {
  $(document).ready(function() {
    $("#content").on("click", "img:not(.btech-zoomed-image-modal-content)", function() {
      if ($(this).parent().is("a")) {
        return; // Exit the function if the parent is an <a> tag
      }
      let src = $(this).attr("src");
      let srcs = [];
      $('#content img').each(function () {
        srcs.push($(this).attr('src'));
      });
      let srcIndex = srcs.indexOf(src);
      if ($("#btech-zoomed-image-modal-img").length > 0) return;
      let modal = $(`
        <div class="btech-zoomed-image-modal-bg">
          <div style="display: block;" class="btech-zoomed-image-modal">
            <span class="btech-zoomed-image-modal-close">&times;</span>
            <span class="btech-zoomed-image-modal-content-scroll-left" style="position: absolute; left: 10px; top: 50%; cursor: pointer; user-select: none;">&#9664;</span>
            <div style="text-align: center; position: relative;">
              <img class="btech-zoomed-image-modal-content" id="btech-zoomed-image-modal-img" src="${src}">
            </div>
            <span class="btech-zoomed-image-modal-content-scroll-right" style="position: absolute; right: 10px; top: 50%; cursor: pointer; user-select: none;">&#9654;</span>
          </div>
        </div>
      `);
      
      $('#content').append(modal);

      modal.on("click", function(event) {
        if ($(event.target).is(modal)) {
            modal.remove();
        }
      });

      $(".btech-zoomed-image-modal-close").click(function(e) {
        e.preventDefault();
        modal.remove();
        e.stopPropagation();
      });
      modal.find('.btech-zoomed-image-modal-close').click(function(e) {
        modal.remove();
        e.stopPropagation();
      });

      $('.btech-zoomed-image-modal-content-scroll-left').click(function(e) {
        e.preventDefault();
        srcIndex -= 1;
        if (srcIndex < 0) srcIndex = srcs.length - 1;
        $('#btech-zoomed-image-modal-img').attr('src', srcs[srcIndex]);
        e.stopPropagation();
      });

      $('.btech-zoomed-image-modal-content-scroll-right').click(function(e) {
        e.preventDefault();
        srcIndex += 1;
        if (srcIndex >= srcs.length) srcIndex = 0;
        $('#btech-zoomed-image-modal-img').attr('src', srcs[srcIndex]);
        e.stopPropagation();
      });

    });
  });
})();
