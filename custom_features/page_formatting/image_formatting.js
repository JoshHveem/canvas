(function () {
  //handle graphic content blurring
  let imgs = $(".btech-graphic-image");
  imgs.each(function () {
    let img = $(this);
    let wrapper = $("<div class='btech-graphic-image-wrapper'></div>");
    img.wrap(wrapper);
    let button = $("<div class='btech-graphic-image-button'>Reveal</div>")
    img.after(button);
    button.click(function () {
      button.remove();
      img.unwrap();
      img.removeClass('btech-graphic-image');
    })
  });

  //align images on a single row
  $('.btech-img-align').each(function () {
    let img = $(this);
    let prev = img.prev();
    let prevWrapper = prev.hasClass('btech-img-align-wrapper');
    if (prevWrapper === false) {
      img.wrap("<div class='btech-img-align-wrapper' style='display: flex; justify-content: center; align-items: center;'></div>");
    } else {
      prev.append(img);
    }
  });
})();