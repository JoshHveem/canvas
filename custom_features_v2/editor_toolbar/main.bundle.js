(()=>{window.TOOLBAR_STYLES=window.TOOLBAR_STYLES||{init:async function(){var p,b,l;let o=await $.get("https://bridgetools.dev/canvas/style/rce.css"),i=(l=(b=(p=tinymce.activeEditor)==null?void 0:p.iframeElement)==null?void 0:b.contentDocument)==null?void 0:l.getElementsByTagName("style")[0];i&&!i.textContent.includes(o)&&(i.textContent+=o)}};var q=window.delay||(o=>new Promise(i=>setTimeout(i,o))),L=window.TOOLBAR={selects:{},toolbar:null,initted:!1,async getEditor(){return await this.checkReady(1),tinymce.activeEditor},async checkReady(o=0){var i,p;if(!((p=(i=window==null?void 0:window.tinymce)==null?void 0:i.activeEditor)!=null&&p.initialized)||o===0&&!L.initted)return await q(500),this.checkReady(o)},addBackground(o){let i=$(`
      <div style="
        overflow: auto; 
        position: fixed; 
        background-color: rgba(0, 0, 0, 0.5); 
        width: 100%; 
        height: 100%; 
        left: 0; 
        top: 0; 
        z-index:1000;
      ">
        <div id='background-container' style='
          width: 500px;
          left: 50%;
          transform: translate(-50%, -50%);
          position:fixed;
          top: 50%;
          z-index:1000;
          transition: 0.5s;
          background-color: #FFF;
          border: 2px solid #888;
          padding: 10px 20px;
          color: #000;
          border-radius: 5px;
        '>
        </div>
      </div>
      `);return $("body").append(i),o&&this.addBackgroundClosing(i),i},addBackgroundClosing(o){o.click(function(i){i.target===this&&$(this).remove()})},selectNameToId(o){return"btech-custom-editor-select-"+o.replace(" ","-")},async addSelect(o,i){let p=this;p.selects[o]={};let b=$("#btech-custom-editor-buttons-container"),l=this.selectNameToId(o),s="<select title='"+i+"' id='"+l+"'><option selected disabled>-"+o+" options-</option></select>";return b.append(s),$("#"+l).change(function(){let h=$(this).val(),m=p.selects[o][h];m!==void 0&&m()}),s},async addSelectOption(o,i,p,b,l,s={}){let h=this,m=this.selectNameToId(i);h.selects[i][o]=b;let v=$("#"+m),T=$("<option title='"+p+"' class='"+l+"' value='"+o+"'>"+o+"</option>");for(let S in s)T.attr("data-"+S,s[S]);return v.append(T),T},async addButton(o,i,p=""){let b=$("#btech-custom-editor-buttons-container"),l=$("<a class='btn "+p+"' style='padding: 5px; background-color: #EEE; color: #000; border: 1px solid #AAA; cursor: pointer;'>"+o+"</a>");return l.click(i),b.append(l),l},async addButtonIcon(o,i,p,b,l=""){let s=$("#btech-custom-editor-buttons-container"),h=$(`<div aria-label="${i}" title="${p}" style="padding: 4px 8px; color: #000; cursor: pointer;"><i style="font-size: 1rem;" class="${o} ${l}"></i></a>`);return h.click(b),s.append(h),h},checkEditorPage(){return!!window.location.pathname.includes("edit")},async _init(){await window.TOOLBAR_STYLES.init(),this.editor=await this.getEditor(),$("#btech-custom-editor-buttons-container").length===0&&(L.toolbar=$("<div id='btech-custom-editor-buttons-container'></div>"),$(".tox-editor-header").append(L.toolbar)),L.initted=!0}};L.checkEditorPage()&&L._init();var C=window.TOOLBAR;(async function(){if(!C.checkEditorPage())return;function o(){let t=tinymce.activeEditor,e=t.dom,c=t.selection.getNode(),r=e.getParent(c,"table");if(!r){alert("No table found at the current cursor position.");return}let g=r.cloneNode(!0),u=document.createElement("ol");u.style.listStyleType="decimal",g.querySelectorAll("tr").forEach(w=>{let f=w.querySelectorAll("td");if(f.length<2)return;let y=document.createElement("li");y.className="list-item-image";let x=document.createElement("div");x.style.display="flex",x.style.gap="16px",x.style.alignItems="flex-start",x.style.flexWrap="wrap";let A=document.createElement("div");A.style.flex="1",A.style.minWidth="250px",A.innerHTML=f[0].innerHTML;let R=document.createElement("div");R.style.flex="1",R.style.minWidth="250px",R.innerHTML=f[1].innerHTML,x.appendChild(A),x.appendChild(R),y.appendChild(x);let N=document.createElement("hr");N.style.marginTop="16px",N.style.border="none",N.style.borderTop="1px solid #ddd",y.appendChild(N),u.appendChild(y)}),e.replace(u,r)}async function i(){let t=tinymce.activeEditor,e=t.selection.getContent({format:"html"});if(t.selection.getRng().cloneContents().querySelectorAll("li").length>1){let c=Array.from(t.getBody().querySelectorAll("li")),r=t.selection.getRng();c.forEach(g=>{let u=document.createRange();u.selectNodeContents(g),r.compareBoundaryPoints(Range.START_TO_END,u)>=0&&r.compareBoundaryPoints(Range.END_TO_START,u)<=0&&p(g,t)})}else{let c=t.selection.getNode(),r=t.dom.getParent(c,"li");if(!r){alert("Please place your cursor inside a list item.");return}p(r,t)}}function p(t,e){if(e.dom.hasClass(t,"list-item-image")){let c=t.querySelector('div[style*="min-width: 250px"]:first-child'),r=t.querySelector('div[style*="min-width: 250px"]:nth-child(2)');if(t.innerHTML="",c&&(t.innerHTML+=c.innerHTML.trim()),r){let g=r.querySelector("img");g&&t.appendChild(g)}e.dom.removeClass(t,"list-item-image"),t.removeAttribute("style")}else{let c=document.createElement("div");c.innerHTML=t.innerHTML;let r=c.querySelector("img"),g='<img src="IMAGE" alt="Paste Image Here" style="max-width: 100%; max-width: 33%; height: auto;">';r&&(g=r.outerHTML,r.remove());let u=c.innerHTML.trim(),d=c.querySelector('div[style*="display: flex"]');if(d){let f=d.querySelector("div");f&&(u=f.innerHTML.trim())}let w=t.querySelector("hr")!==null;t.innerHTML=`
      <div style="display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px;">
          ${u}
        </div>
        <div style="flex: 1; min-width: 250px;">
          ${g}
        </div>
      </div>
      ${w?"":'<hr style="margin-top: 16px; border: none; border-top: 1px solid #ddd;">'}
    `,e.dom.addClass(t,"list-item-image"),t.removeAttribute("style")}}async function b(){let t=tinymce.activeEditor,n=t.selection.getContent();n.trim()==""&&(n='<div aria-label="callout-title" style="font-size: 1.2rem; font-weight: bold;"><strong>INSERT TITLE<strong></div><div><p>INSERT TEXT</p></div>'),t.execCommand("mceReplaceContent",!1,`
      <div 
        class="btech-callout-box" 
        style="background-color: #EDEDED; border-radius: 5px; padding: 0.5rem 1.5rem; border: 3px solid #AAA; margin: 1rem auto; width: 70%;"
        role="note" aria-label="callout-box">
          <p>${n}</p>
      </div>
      `)}async function l(){let t=tinymce.activeEditor,n=t.selection.getContent();n.trim()==""&&(n='<div aria-label="callout-title" style="font-size: 1.2rem; font-weight: bold;"><strong>INSERT TITLE<strong></div><div><p>INSERT TEXT</p></div>'),t.execCommand("mceReplaceContent",!1,`
      <div 
        class="btech-callout-box" 
        style="background-color: #F1F1F1; border-radius: 5px; padding: 0.5rem 1.5rem; border: 3px solid #E1E1E1; margin: 1rem auto; width: 70%;"
        role="note" aria-label="callout-box">
      <p>${n}</p>
      </div>
      `)}async function s(){let t=tinymce.activeEditor,n=t.selection.getContent(),c=$("#btech-custom-editor-buttons-color").val(),r="#FFFFFF";n.trim()==""&&(n="INSERT CONTENT"),t.execCommand("mceReplaceContent",!1,`
      <div style="background-color: #ffffff; color: #000000; border: 3px solid ${c}; border-radius: 5px; margin: 1rem auto; width: 70%;" role="note" aria-label="callout-box">
        <div aria-label="callout-title" style="background-color: ${c}; color: #ffffff; font-size: 1.2em; padding: 0.25rem 1.5rem; text-align: left; font-weight: bold;"><strong>INSERT TITLE</strong></div>
        <div style="padding: 0.5rem 1.5rem;">
        <p>${n}</p>
        </div>
      </div>
      `)}function h(t){let e=document.createElement("div");e.textContent=t,Object.assign(e.style,{position:"fixed",bottom:"20px",right:"20px",padding:"10px 14px",borderRadius:"4px",color:"#fff",backgroundColor:"#2e7d32",zIndex:"10000",fontSize:"14px"}),document.body.appendChild(e),setTimeout(()=>e.remove(),2500)}function m(t){let e=document.createElement("div");e.textContent=t,Object.assign(e.style,{position:"fixed",bottom:"20px",right:"20px",padding:"10px 14px",borderRadius:"4px",color:"#fff",backgroundColor:"#c62828",zIndex:"10000",fontSize:"14px"}),document.body.appendChild(e),setTimeout(()=>e.remove(),2500)}function v(){let t=tinymce.activeEditor,e=t.selection,n=t.getBody(),c=".content-box.phpally-ignore",r="content-box phpally-ignore";function g(a){for(;a.firstChild;)a.parentNode.insertBefore(a.firstChild,a);a.remove(),m("Accessibility check enabled")}function u(a){var I;if(!a||a===n||(I=a.closest)!=null&&I.call(a,c))return;let E=document.createElement("div");E.className=r,a.parentNode.insertBefore(E,a),E.appendChild(a),h("Accessibility check disabled")}function d(){let a=e.getSelectedBlocks?Array.from(e.getSelectedBlocks()):[],I=(a.length?a:[e.getNode()]).map(k=>k&&k.nodeType===1?k:k==null?void 0:k.parentElement).filter(Boolean);return Array.from(new Set(I))}function w(a){if(a.length<=1)return a;let E=new Set(a),I=new Set(a.map(B=>B.parentElement).filter(B=>B&&B!==n)),k=new Set,z=new Set;for(let B of I){let F=Array.from(B.children);if(!F.length)continue;F.every(M=>E.has(M))&&(k.add(B),F.forEach(M=>z.add(M)))}return[...k,...a.filter(B=>!z.has(B))]}let f=d();if(!f.length)return;let y=f.filter(a=>{var E;return(E=a.closest)==null?void 0:E.call(a,c)}),x=new Set(y),A=new Set;y.forEach(a=>{let E=a.closest(c);E&&A.add(E)}),A.forEach(g);let R=f.filter(a=>!x.has(a));if(!R.length)return;w(R).forEach(u)}function T(t){let e=tinymce.activeEditor,n=$("#citation-name").val(),c=$("#citation-author-last").val(),r=$("#citation-publisher").val(),g=$("#citation-year-published").val(),u=$("#citation-url").val();if(n!=""&&c!=""){let d="";$(".citation-author").each(function(){let w=$(this),f=w.find(".last-name").val(),y=w.find(".first-name").val();f!==""&&(y!==""?d+=f+", "+y.charAt(0)+". ":d+=f+". ")}),g!==""&&(d+="("+g+"). "),d+="<i>"+n+"</i>. ",r!==""&&(d+=r+". "),u!==""&&(d=`<a href="${u}">${d}</a>`),d="<p class='btech-citation' style='text-align: right;'>"+d+"</p>",e.execCommand("mceReplaceContent",!1,"<p>"+d+"</p>"),t.remove()}}async function S(t){let e=tinymce.activeEditor;$(".citation-information").keypress(function(n){var c=n.keyCode?n.keyCode:n.which;c=="13"&&T(t),n.stopPropagation()})}async function H(){let t=C.addBackground(!1),e=$('<span class="btech-pill-text" style="background-color: black; color: white; cursor: pointer; user-select: none; position: absolute; right: 2rem;">Close</span>');e.click(()=>{t.remove()}),t.find("#background-container").append(e),t.find("#background-container").append(`
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
    `),S(t)}),$("#citation-submit").click(function(){T(t)}),S(t)}function D(){let t=tinyMCE.activeEditor.getBody(),e=$(t).children(),n=-1,c=null,r=!0,g=$("#btech-custom-editor-buttons-color").val();$(t).find(".btech-formatted-content-wrapper").each(function(){$(this).contents().unwrap()}),$(t).find(".btech-sections").each(function(){$(this).contents().unwrap()}),$(t).find(".btech-sections-header").each(function(){$(this).find(".btech-sections-header-content").contents().unwrap(),$(this).removeClass(".btech-sections-header")});for(let d=0;d<e.length;d++){let w=$(e[d])[0];if(c===null&&w.tagName.charAt(0)==="H"&&(c=w.tagName),c!==null&&(w.tagName===c||d===e.length-1)){if(n>-1){let f=[];for(var u=n;u<d;u++)f.push($(e[u])[0]);d===e.length-1&&f.push($(e[d])[0]);let y="#fff";r&&(y="#f6f6f6"),r=!r;let x=$(e[n]);x.css({"text-align":"center"}),x.addClass("btech-sections-header"),x.wrapInner(`<span class='btech-sections-header-content' style="background-color: ${g}; color: #FFFFFF"></span>`),$(f).wrapAll("<div class='btech-sections' style='border: 1px solid #ddd; background-color: "+y+"; padding: 5px; padding-top: 15px; margin-top: 25px;'></div>")}n=d}}}await C.checkReady(0),C.toolbar.prepend(`<input type="color" id="btech-custom-editor-buttons-color" value="#B20B0F" style="width: 48px; padding: 4px; padding-right: 0px;" list="default-colors"/>
    <datalist id="default-colors">
      <option>#B20B0F</option>
      <option>#0f79A2</option>
      <option>#0B810F</option>
      <option>#000000</option>
      <option>#FFFFFF</option>
    </datalist>
    `),C.addButtonIcon("icon-note-light icon-Solid","Callout Box with Colored Title","Insert a callout box with a colored header.",s),$('[aria-label="Callout Box with Colored Title"]').css("color","#B20B0F"),C.addButtonIcon("icon-note-light","Callout Box Gray. Light Border.","Insert a gray callout box with light border. Designed for on white backgrounds.",l),C.addButtonIcon("icon-note-light icon-Solid","Callout Box Gray. Dark Border.","Insert a gray callout box with dark border. Designed for on gray backgrounds.",b),C.addButtonIcon("icon-rubric","List With Image","Toggle list item to contain a right aligned image.",i),C.addButtonIcon("icon-compose","Citation","Insert a citation.",H),C.addButtonIcon("icon-materials-required","Auto Format","Auto format the page to break the page into sections. Sections are determined by the top level heading.",D),C.addButtonIcon("icon-calendar-month","Auto Format Table into List","Auto format a table used for isntructions into an ordered list.",o),IS_ISD&&C.addButtonIcon("icon-eye","Override Accessiblity Tracker","Accessiblity tracker will ignore this content",v)})();var O=window.TOOLBAR;(async function(){let o=["icon-stats","icon-media","icon-rubric","icon-student-view","icon-copy-course","icon-discussion","icon-edit","icon-home","icon-settings","icon-flag","icon-warning","icon-quiz","icon-clock","icon-calendar-month","icon-hour-glass","icon-tag","icon-folder","icon-lti","icon-heart","icon-star","icon-upload","icon-ms-ppt","icon-info","icon-materials-required","icon-check","icon-replied","icon-search","bcon-faucet"];if(!O.checkEditorPage())return;async function i(l){let s=tinymce.activeEditor,h=s.selection,m=$("#btech-custom-editor-buttons-color").val(),v="#000000";s.execCommand("mceReplaceContent",!1,`
    <h2 class="icon-header" style="text-align: center;">
      <span><strong><i class="`+l+`"></i> <i class="btech-hidden">#</i> </strong></span>
    </h2>
    <h2 style="text-align: center;">HEADING</h2>
      `)}function p(l){var s=l.element;let h=$(s).attr("data-icon");return $('<span><i class="'+h+'"></i> '+l.text+"</span>")}await O.checkReady();let b=await O.addSelect("headers","Insert a header with an icon.");for(let l=0;l<o.length;l++){let s=o[l],h=s.replace("icon-","").replace("bcon-","").replace("-"," ");(await O.addSelectOption(h,"headers","",function(){i(s)},"btech-header-insert-option",{icon:s})).attr("id",s+"-option")}$("#"+$(b).attr("id")).select2({templateSelection:p,templateResult:p,allowHTML:!0})})();var P=window.TOOLBAR;(async function(){if(!P.checkEditorPage())return;await P.checkReady();let o=["btech-graphic-image","btech-img-align"];function i(){let s=getComputedStyle(document.documentElement,null).getPropertyValue("--ic-brand-button--secondary-bgd-darkened-5"),h=tinyMCE.activeEditor.selection.getNode(),m=tinyMCE.activeEditor.dom.getParent(h,"img");for(let v=0;v<o.length;v++){let T=o[v],S=T+"-option";$("."+S).css({color:"#000"}),m!==null&&$(m).hasClass(T)&&$("."+S).css({color:s})}}async function p(s){let h=tinyMCE.activeEditor.selection.getNode(),m=tinyMCE.activeEditor.dom.getParent(h,"img");if(m!==null)if($(m).hasClass(s))tinyMCE.activeEditor.dom.removeClass(m,s);else{for(let v=0;v<o.length;v++){let T=o[v];tinyMCE.activeEditor.dom.removeClass(m,T)}tinyMCE.activeEditor.dom.addClass(m,s)}return m}function b(){p("btech-graphic-image")}function l(){p("btech-img-align")}P.addButtonIcon("icon-image icon-Solid","Blur","Blur image with graphic content.",function(){b(),i()},"btech-img-option btech-graphic-image-option"),tinymce.activeEditor.on("click",function(){i()})})();})();
