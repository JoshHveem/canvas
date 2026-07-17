let main = $("#content-wrapper");
main.prepend(`
  <div
    class="btech-banner-slides-container"
  >
    <div
      class="btech-banner-slide"
    >
      <a href="/courses/480103" target="_blank">
        <img src="` + SOURCE_URL + `/media/small_orientation_banner.png">
      </a>
    </div>
  </div>
`);
var slideIndex = 1;
showSlide();

function plusDivs(n) {
  slideIndex += n;
  showSlide();
}

function showSlide() {
  let x = document.getElementsByClassName("btech-banner-slide");
  for (let i = 0; i < x.length; i++) {
    x[i].style.display = "none";
  }
  if (slideIndex > x.length) {slideIndex = 1}
  if (slideIndex < 0) {x.length - 1}
  x[slideIndex-1].style.display = "block";
  if (IS_ISD)
  setTimeout(() => { slideIndex += 1; showSlide(); }, 5000); // Change image every 2 seconds
}
