(()=>{(async function(){if(!TOOLBAR.checkEditorPage())return;function B(){let t=tinymce.activeEditor,e=t.dom,n=t.selection.getNode(),a=e.getParent(n,"table");if(!a){alert("No table found at the current cursor position.");return}let s=a.cloneNode(!0),l=document.createElement("ol");l.style.listStyleType="decimal",s.querySelectorAll("tr").forEach(u=>{let c=u.querySelectorAll("td");if(c.length<2)return;let d=document.createElement("li");d.className="list-item-image";let p=document.createElement("div");p.style.display="flex",p.style.gap="16px",p.style.alignItems="flex-start",p.style.flexWrap="wrap";let g=document.createElement("div");g.style.flex="1",g.style.minWidth="250px",g.innerHTML=c[0].innerHTML;let b=document.createElement("div");b.style.flex="1",b.style.minWidth="250px",b.innerHTML=c[1].innerHTML,p.appendChild(g),p.appendChild(b),d.appendChild(p);let x=document.createElement("hr");x.style.marginTop="16px",x.style.border="none",x.style.borderTop="1px solid #ddd",d.appendChild(x),l.appendChild(d)}),e.replace(l,a)}async function S(){let t=tinymce.activeEditor,e=t.selection.getContent({format:"html"});if(t.selection.getRng().cloneContents().querySelectorAll("li").length>1){let n=Array.from(t.getBody().querySelectorAll("li")),a=t.selection.getRng();n.forEach(s=>{let l=document.createRange();l.selectNodeContents(s),a.compareBoundaryPoints(Range.START_TO_END,l)>=0&&a.compareBoundaryPoints(Range.END_TO_START,l)<=0&&C(s,t)})}else{let n=t.selection.getNode(),a=t.dom.getParent(n,"li");if(!a){alert("Please place your cursor inside a list item.");return}C(a,t)}}function C(t,e){if(e.dom.hasClass(t,"list-item-image")){let n=t.querySelector('div[style*="min-width: 250px"]:first-child'),a=t.querySelector('div[style*="min-width: 250px"]:nth-child(2)');if(t.innerHTML="",n&&(t.innerHTML+=n.innerHTML.trim()),a){let s=a.querySelector("img");s&&t.appendChild(s)}e.dom.removeClass(t,"list-item-image"),t.removeAttribute("style")}else{let n=document.createElement("div");n.innerHTML=t.innerHTML;let a=n.querySelector("img"),s='<img src="IMAGE" alt="Paste Image Here" style="max-width: 100%; max-width: 33%; height: auto;">';a&&(s=a.outerHTML,a.remove());let l=n.innerHTML.trim(),r=n.querySelector('div[style*="display: flex"]');if(r){let c=r.querySelector("div");c&&(l=c.innerHTML.trim())}let u=t.querySelector("hr")!==null;t.innerHTML=`
      <div style="display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px;">
          ${l}
        </div>
        <div style="flex: 1; min-width: 250px;">
          ${s}
        </div>
      </div>
      ${u?"":'<hr style="margin-top: 16px; border: none; border-top: 1px solid #ddd;">'}
    `,e.dom.addClass(t,"list-item-image"),t.removeAttribute("style")}}async function L(){let t=tinymce.activeEditor,o=t.selection.getContent();o.trim()==""&&(o='<div aria-label="callout-title" style="font-size: 1.2rem; font-weight: bold;"><strong>INSERT TITLE<strong></div><div><p>INSERT TEXT</p></div>'),t.execCommand("mceReplaceContent",!1,`
      <div 
        class="btech-callout-box" 
        style="background-color: #EDEDED; border-radius: 5px; padding: 0.5rem 1.5rem; border: 3px solid #AAA; margin: 1rem auto; width: 70%;"
        role="note" aria-label="callout-box">
          <p>${o}</p>
      </div>
      `)}async function R(){let t=tinymce.activeEditor,o=t.selection.getContent();o.trim()==""&&(o='<div aria-label="callout-title" style="font-size: 1.2rem; font-weight: bold;"><strong>INSERT TITLE<strong></div><div><p>INSERT TEXT</p></div>'),t.execCommand("mceReplaceContent",!1,`
      <div 
        class="btech-callout-box" 
        style="background-color: #F1F1F1; border-radius: 5px; padding: 0.5rem 1.5rem; border: 3px solid #E1E1E1; margin: 1rem auto; width: 70%;"
        role="note" aria-label="callout-box">
      <p>${o}</p>
      </div>
      `)}async function k(){let t=tinymce.activeEditor,o=t.selection.getContent(),n=$("#btech-custom-editor-buttons-color").val(),a="#FFFFFF";o.trim()==""&&(o="INSERT CONTENT"),t.execCommand("mceReplaceContent",!1,`
      <div style="background-color: #ffffff; color: #000000; border: 3px solid ${n}; border-radius: 5px; margin: 1rem auto; width: 70%;" role="note" aria-label="callout-box">
        <div aria-label="callout-title" style="background-color: ${n}; color: #ffffff; font-size: 1.2em; padding: 0.25rem 1.5rem; text-align: left; font-weight: bold;"><strong>INSERT TITLE</strong></div>
        <div style="padding: 0.5rem 1.5rem;">
        <p>${o}</p>
        </div>
      </div>
      `)}function O(t){let e=document.createElement("div");e.textContent=t,Object.assign(e.style,{position:"fixed",bottom:"20px",right:"20px",padding:"10px 14px",borderRadius:"4px",color:"#fff",backgroundColor:"#2e7d32",zIndex:"10000",fontSize:"14px"}),document.body.appendChild(e),setTimeout(()=>e.remove(),2500)}function I(t){let e=document.createElement("div");e.textContent=t,Object.assign(e.style,{position:"fixed",bottom:"20px",right:"20px",padding:"10px 14px",borderRadius:"4px",color:"#fff",backgroundColor:"#c62828",zIndex:"10000",fontSize:"14px"}),document.body.appendChild(e),setTimeout(()=>e.remove(),2500)}function N(){let t=tinymce.activeEditor,e=t.selection,o=t.getBody(),n=".content-box.phpally-ignore",a="content-box phpally-ignore";function s(i){for(;i.firstChild;)i.parentNode.insertBefore(i.firstChild,i);i.remove(),I("Accessibility check enabled")}function l(i){var y;if(!i||i===o||(y=i.closest)!=null&&y.call(i,n))return;let h=document.createElement("div");h.className=a,i.parentNode.insertBefore(h,i),h.appendChild(i),O("Accessibility check disabled")}function r(){let i=e.getSelectedBlocks?Array.from(e.getSelectedBlocks()):[],y=(i.length?i:[e.getNode()]).map(m=>m&&m.nodeType===1?m:m==null?void 0:m.parentElement).filter(Boolean);return Array.from(new Set(y))}function u(i){if(i.length<=1)return i;let h=new Set(i),y=new Set(i.map(f=>f.parentElement).filter(f=>f&&f!==o)),m=new Set,A=new Set;for(let f of y){let v=Array.from(f.children);if(!v.length)continue;v.every(T=>h.has(T))&&(m.add(f),v.forEach(T=>A.add(T)))}return[...m,...i.filter(f=>!A.has(f))]}let c=r();if(!c.length)return;let d=c.filter(i=>{var h;return(h=i.closest)==null?void 0:h.call(i,n)}),p=new Set(d),g=new Set;d.forEach(i=>{let h=i.closest(n);h&&g.add(h)}),g.forEach(s);let b=c.filter(i=>!p.has(i));if(!b.length)return;u(b).forEach(l)}function w(t){let e=tinymce.activeEditor,o=$("#citation-name").val(),n=$("#citation-author-last").val(),a=$("#citation-publisher").val(),s=$("#citation-year-published").val(),l=$("#citation-url").val();if(o!=""&&n!=""){let r="";$(".citation-author").each(function(){let u=$(this),c=u.find(".last-name").val(),d=u.find(".first-name").val();c!==""&&(d!==""?r+=c+", "+d.charAt(0)+". ":r+=c+". ")}),s!==""&&(r+="("+s+"). "),r+="<i>"+o+"</i>. ",a!==""&&(r+=a+". "),l!==""&&(r=`<a href="${l}">${r}</a>`),r="<p class='btech-citation' style='text-align: right;'>"+r+"</p>",e.execCommand("mceReplaceContent",!1,"<p>"+r+"</p>"),t.remove()}}async function E(t){let e=tinymce.activeEditor;$(".citation-information").keypress(function(o){var n=o.keyCode?o.keyCode:o.which;n=="13"&&w(t),o.stopPropagation()})}async function F(){let t=TOOLBAR.addBackground(!1),e=$('<span class="btech-pill-text" style="background-color: black; color: white; cursor: pointer; user-select: none; position: absolute; right: 2rem;">Close</span>');e.click(()=>{t.remove()}),t.find("#background-container").append(e),t.find("#background-container").append(`
    <p>Name of Image, Book, Article, Video, etc.*</p>
    <input style='width: 100%; height: 40px; box-sizing: border-box;' type="text" class="citation-information" id="citation-name">
    <p>Author(s)*</p>
    <p>Must include a last name, if unknown, put unkown</p>
    <div id="citation-authors">
      <div class="citation-author">
        <input placeholder="first name" style='width: 49%; height: 40px; box-sizing: border-box;' type="text" class="citation-information first-name" id="citation-author-first">
        <input placeholder="last name" style='width: 49%; height: 40px; box-sizing: border-box;' type="text" class="citation-information last-name" id="citation-author-last">
      </div>
    </div>
    <a class='btn' id="citation-add-author">Add Author</a>
    <p>Year Published</p>
    <input style='width: 100%; height: 40px; box-sizing: border-box;' type="number" class="citation-information" id="citation-year-published">
    <p>Publisher</p>
    <input style='width: 100%; height: 40px; box-sizing: border-box;' type="text" class="citation-information" id="citation-publisher">
    <p>URL (If Applicable)</p>
    <input style='width: 100%; height: 40px; box-sizing: border-box;' type="text" class="citation-information" id="citation-url">
    <a class='btn' id="citation-submit">Create</a>
    `),$("#citation-add-author").click(function(){$("#citation-authors").append(`
    <div class="citation-author">
      <input placeholder="first name" style='width: 49%; height: 40px; box-sizing: border-box;' type="text" class="citation-information first-name">
      <input placeholder="last name" style='width: 49%; height: 40px; box-sizing: border-box;' type="text" class="citation-information last-name">
    </div>
    `),E(t)}),$("#citation-submit").click(function(){w(t)}),E(t)}function M(){let t=tinyMCE.activeEditor.getBody(),e=$(t).children(),o=-1,n=null,a=!0,s=$("#btech-custom-editor-buttons-color").val();$(t).find(".btech-formatted-content-wrapper").each(function(){$(this).contents().unwrap()}),$(t).find(".btech-sections").each(function(){$(this).contents().unwrap()}),$(t).find(".btech-sections-header").each(function(){$(this).find(".btech-sections-header-content").contents().unwrap(),$(this).removeClass(".btech-sections-header")});for(let r=0;r<e.length;r++){let u=$(e[r])[0];if(n===null&&u.tagName.charAt(0)==="H"&&(n=u.tagName),n!==null&&(u.tagName===n||r===e.length-1)){if(o>-1){let c=[];for(var l=o;l<r;l++)c.push($(e[l])[0]);r===e.length-1&&c.push($(e[r])[0]);let d="#fff";a&&(d="#f6f6f6"),a=!a;let p=$(e[o]);p.css({"text-align":"center"}),p.addClass("btech-sections-header"),p.wrapInner(`<span class='btech-sections-header-content' style="background-color: ${s}; color: #FFFFFF"></span>`),$(c).wrapAll("<div class='btech-sections' style='border: 1px solid #ddd; background-color: "+d+"; padding: 5px; padding-top: 15px; margin-top: 25px;'></div>")}o=r}}}await TOOLBAR.checkReady(0),TOOLBAR.toolbar.prepend(`<input type="color" id="btech-custom-editor-buttons-color" value="#B20B0F" style="width: 48px; padding: 4px; padding-right: 0px;" list="default-colors"/>
    <datalist id="default-colors">
      <option>#B20B0F</option>
      <option>#0f79A2</option>
      <option>#0B810F</option>
      <option>#000000</option>
      <option>#FFFFFF</option>
    </datalist>
    `),TOOLBAR.addButtonIcon("icon-note-light icon-Solid","Callout Box with Colored Title","Insert a callout box with a colored header.",k),$('[aria-label="Callout Box with Colored Title"]').css("color","#B20B0F"),TOOLBAR.addButtonIcon("icon-note-light","Callout Box Gray. Light Border.","Insert a gray callout box with light border. Designed for on white backgrounds.",R),TOOLBAR.addButtonIcon("icon-note-light icon-Solid","Callout Box Gray. Dark Border.","Insert a gray callout box with dark border. Designed for on gray backgrounds.",L),TOOLBAR.addButtonIcon("icon-rubric","List With Image","Toggle list item to contain a right aligned image.",S),TOOLBAR.addButtonIcon("icon-compose","Citation","Insert a citation.",F),TOOLBAR.addButtonIcon("icon-materials-required","Auto Format","Auto format the page to break the page into sections. Sections are determined by the top level heading.",M),TOOLBAR.addButtonIcon("icon-calendar-month","Auto Format Table into List","Auto format a table used for isntructions into an ordered list.",B),IS_ISD&&TOOLBAR.addButtonIcon("icon-eye","Override Accessiblity Tracker","Accessiblity tracker will ignore this content",N)})();})();
