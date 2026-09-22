(()=>{$(async function(){async function e(i,c){$(i).each(async function(){let t=$(this),s=t.attr(c).match(/\/courses\/(\d+)\/files\/(\d+)/);if(s){let a=s[1],n=s[2];try{let d=await canvasGet(`/api/v1/courses/${a}/files/${n}`)}catch(d){let o=$(`
            <button style="margin:5px; background:#ffd; border:1px solid #ccc;" class="canvas-restore-btn" data-course-id="${a}" data-file-id="${n}">
              \u{1F504} Restore Image
            </button>
          `);t.after(o),o.on("click",async function(){let l=$(this).data("course-id"),u=$(this).data("file-id");await $.post(`https://btech.instructure.com/courses/${l}/undelete/attachment_${u}`);let r=t.attr(c),f=r+(r.includes("?")?"&":"?")+"t="+Date.now();t.attr(c,f),$(this).remove()})}}})}e("img","src"),e(".file_download_btn","href")});})();
