(()=>{var l=$("#content-wrapper");l.prepend(`
  <div
    class="btech-banner-slides-container"
  >
    <div
      class="btech-banner-slide"
    >
      <a href="/courses/480103" target="_blank">
        <img src="`+SOURCE_URL+`/media/small_orientation_banner.png">
      </a>
    </div>
  </div>
`);var n=1;t();function t(){let e=document.getElementsByClassName("btech-banner-slide");for(let i=0;i<e.length;i++)e[i].style.display="none";n>e.length&&(n=1),n<0&&e.length-1,e[n-1].style.display="block",IS_ISD&&setTimeout(()=>{n+=1,t()},5e3)}})();
