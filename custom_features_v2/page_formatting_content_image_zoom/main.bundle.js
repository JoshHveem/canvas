(()=>{(function(){$(document).ready(function(){$("#content").on("click","img:not(.btech-zoomed-image-modal-content)",function(){if($(this).parent().is("a"))return;let c=$(this).attr("src"),i=[];$("#content img").each(function(){i.push($(this).attr("src"))});let o=i.indexOf(c);if($("#btech-zoomed-image-modal-img").length>0)return;let t=$(`
        <div class="btech-zoomed-image-modal-bg">
          <div style="display: block;" class="btech-zoomed-image-modal">
            <span class="btech-zoomed-image-modal-close">&times;</span>
            <span class="btech-zoomed-image-modal-content-scroll-left" style="position: absolute; left: 10px; top: 50%; cursor: pointer; user-select: none;">&#9664;</span>
            <div style="text-align: center; position: relative;">
              <img class="btech-zoomed-image-modal-content" id="btech-zoomed-image-modal-img" src="${c}">
            </div>
            <span class="btech-zoomed-image-modal-content-scroll-right" style="position: absolute; right: 10px; top: 50%; cursor: pointer; user-select: none;">&#9654;</span>
          </div>
        </div>
      `);$("#content").append(t),t.on("click",function(e){$(e.target).is(t)&&t.remove()}),$(".btech-zoomed-image-modal-close").click(function(e){e.preventDefault(),t.remove(),e.stopPropagation()}),t.find(".btech-zoomed-image-modal-close").click(function(e){t.remove(),e.stopPropagation()}),$(".btech-zoomed-image-modal-content-scroll-left").click(function(e){e.preventDefault(),o-=1,o<0&&(o=i.length-1),$("#btech-zoomed-image-modal-img").attr("src",i[o]),e.stopPropagation()}),$(".btech-zoomed-image-modal-content-scroll-right").click(function(e){e.preventDefault(),o+=1,o>=i.length&&(o=0),$("#btech-zoomed-image-modal-img").attr("src",i[o]),e.stopPropagation()})})})})();})();
