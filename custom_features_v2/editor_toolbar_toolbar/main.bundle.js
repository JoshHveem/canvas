(()=>{TOOLBAR={selects:{},toolbar:null,initted:!1,async getEditor(){return await this.checkReady(1),tinymce.activeEditor},async checkReady(t=0){var e,i;if(!((i=(e=window==null?void 0:window.tinymce)==null?void 0:e.activeEditor)!=null&&i.initialized)||t===0&&!TOOLBAR.initted)return await delay(500),this.checkReady(t)},addBackground(t){let e=$(`
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
      `);return $("body").append(e),t&&this.addBackgroundClosing(e),e},addBackgroundClosing(t){t.click(function(e){e.target===this&&$(this).remove()})},selectNameToId(t){return"btech-custom-editor-select-"+t.replace(" ","-")},async addSelect(t,e){let i=this;i.selects[t]={};let n=$("#btech-custom-editor-buttons-container"),o=this.selectNameToId(t),d="<select title='"+e+"' id='"+o+"'><option selected disabled>-"+t+" options-</option></select>";return n.append(d),$("#"+o).change(function(){let r=$(this).val(),c=i.selects[t][r];c!==void 0&&c()}),d},async addSelectOption(t,e,i,n,o,d={}){let r=this,c=this.selectNameToId(e);r.selects[e][t]=n;let l=$("#"+c),a=$("<option title='"+i+"' class='"+o+"' value='"+t+"'>"+t+"</option>");for(let s in d)a.attr("data-"+s,d[s]);return l.append(a),a},async addButton(t,e,i=""){let n=$("#btech-custom-editor-buttons-container"),o=$("<a class='btn "+i+"' style='padding: 5px; background-color: #EEE; color: #000; border: 1px solid #AAA; cursor: pointer;'>"+t+"</a>");return o.click(e),n.append(o),o},async addButtonIcon(t,e,i,n,o=""){let d=$("#btech-custom-editor-buttons-container"),r=$(`<div aria-label="${e}" title="${i}" style="padding: 4px 8px; color: #000; cursor: pointer;"><i style="font-size: 1rem;" class="${t} ${o}"></i></a>`);return r.click(n),d.append(r),r},checkEditorPage(){return!!window.location.pathname.includes("edit")},async _init(){await TOOLBAR_STYLES.init(),this.editor=await this.getEditor(),$("#btech-custom-editor-buttons-container").length===0&&(TOOLBAR.toolbar=$("<div id='btech-custom-editor-buttons-container'></div>"),$(".tox-editor-header").append(TOOLBAR.toolbar)),TOOLBAR.initted=!0}};TOOLBAR.checkEditorPage()&&TOOLBAR._init();})();
