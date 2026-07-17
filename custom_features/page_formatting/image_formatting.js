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

  $("section.btech-carousel-container .carousel").each(function() {
    let el = $(this);
    el.append(`<span class="carousel-button prev" data-carousel-button="prev">&lArr;</span> <span class="carousel-button next" data-carousel-button="next">&rArr;</span>`)
  })
  const buttons = document.querySelectorAll("[data-carousel-button]")

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const offset = button.dataset.carouselButton === "next" ? 1 : -1
      const slides = button
        .closest("[data-carousel]")
        .querySelector("[data-slides]")

      const activeSlide = slides.querySelector("[data-active]")
      let newIndex = [...slides.children].indexOf(activeSlide) + offset
      if (newIndex < 0) newIndex = slides.children.length - 1
      if (newIndex >= slides.children.length) newIndex = 0

      slides.children[newIndex].dataset.active = true
      delete activeSlide.dataset.active
    })
  })  
})();