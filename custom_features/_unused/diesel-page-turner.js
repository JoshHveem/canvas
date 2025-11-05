(async function () {
  $(document).ready(function() {
    let imgs = $("#content img");
    imgs.each(function () {
      let img = $(this);
      let src = img.attr('src');
      let reg = /(cdxsite\.com|cdxmedia\.info).*?([0-9]{4})\.jpg/;
      let numPieces = src.match(reg);

      if (numPieces) {
        img.click(function (e) {
          var pWidth = $(this).innerWidth(); //use .outerWidth() if you want borders
          var pOffset = $(this).offset();
          let quart = pWidth / 4;
          var x = e.pageX - pOffset.left;

          let src = img.attr('src');
          let numPieces = src.match(reg);
          let pageNumString = numPieces[2];
          let pageNum = parseInt(pageNumString);

          if (pageNum > 1 && x < quart) {
            pageNum -= 1;
          } else if (x > quart * 3) {
            pageNum += 1;
          }
          let newPageNumString = ("0000" + pageNum).slice(-4);
          let newSrc = src.replace(pageNumString, newPageNumString);
          img.attr('src', newSrc);
        });
        img.mousemove(function (e) {
          var pWidth = $(this).innerWidth(); //use .outerWidth() if you want borders
          var pOffset = $(this).offset();
          let quart = pWidth / 4;
          var x = e.pageX - pOffset.left;
          if (x < quart) {
            img.css('cursor', 'url(https://bridgetools.dev/canvas/media/arrow-prev-page-icon.png), auto');
          } else if (x > quart * 3) {
            img.css('cursor', 'url(https://bridgetools.dev/canvas/media/arrow-next-page-icon.png), auto');
          } else {
            img.css('cursor', 'auto');
          }
        });
      }
    });
  });
})();