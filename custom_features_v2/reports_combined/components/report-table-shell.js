// Generated from report-table-shell.entry.js. Do not edit directly.
(()=>{var d={inject:{reportAnonymization:{default:null}},computed:{isAnonymized(){var e;return!!((e=this.reportAnonymization)!=null&&e.enabled)}},methods:{displayName(e,t,n){return!this.isAnonymized||!String(e!=null?e:"").trim()?e:this.reportAnonymization.alias(t,e,n)},displayFilterOption(e,t,n){var r;return e.value===""||e.value===null||e.value===void 0||!this.isAnonymized?e.label:this.displayName((r=e.nameValue)!=null?r:e.label,t,n)},anonymizeEmail(e){return!this.isAnonymized||!String(e!=null?e:"").trim()?e:`${this.reportAnonymization.alias("email",String(e).trim().toLowerCase(),"Email").replace("Email #","email")}@example.invalid`},prepareReportData(e){if(!this.isAnonymized)return e;let t={first_name:"First Name",last_name:"Last Name",full_name__instructor:"Instructor",user_name:"User",name:"Name",course_name:"Course",department_name:"Department",program_name:"Program",campus_name:"Campus",stage_name:"Focus Stage"},n=new WeakMap,r=i=>{if(!i||typeof i!="object"||Object.prototype.toString.call(i)!=="[object Object]"&&!Array.isArray(i))return i;if(n.has(i))return n.get(i);let a=Array.isArray(i)?[]:{};n.set(i,a);for(let[l,o]of Object.entries(i)){let s=l==="upcoming_course_name"?"course_name":l,m=s!=="academic_standing_name"&&(s==="name"||s.includes("_name")),c=/(^|_)email(?:_|$)/i.test(l);a[l]=c&&typeof o=="string"?this.anonymizeEmail(o):m&&typeof o=="string"?this.displayName(o,s,t[s]||"Name"):r(o)}return a};return r(e)}}};Vue.component("report-table-shell",{mixins:[d],props:{titleHtml:{type:String,default:""},table:{type:Object,required:!0},rows:{type:Array,default:()=>[]},loading:{type:Boolean,default:!1},loadError:{type:String,default:""},loadingText:{type:String,default:"Loading..."},rowKeyFn:{type:Function,default:null},rowClickable:{type:Boolean,default:!1},embedded:{type:Boolean,default:!1}},data(){return{tableTick:0}},computed:{preparedRows(){return this.prepareReportData(this.rows)},rowCount(){return Array.isArray(this.rows)?this.rows.length:0},columnsWidthString(){var e;return(e=this.table)!=null&&e.getColumnsWidthsString?this.table.getColumnsWidthsString():""},visibleColumns(){var e;return(e=this.table)!=null&&e.getVisibleColumns?this.table.getVisibleColumns():[]},shellStyle(){return{padding:"12px",marginTop:this.embedded?"0":"12px",display:"flex",flexDirection:"column",flex:"1 1 auto",minHeight:"0",height:this.embedded?"auto":"100%",overflow:"hidden"}}},methods:{setSortColumn(e){var t;(t=this.table)!=null&&t.setSortColumn&&(this.table.setSortColumn(e),this.tableTick+=1)},getRowKey(e,t){var n;return typeof this.rowKeyFn=="function"?this.rowKeyFn(e,t):(n=e==null?void 0:e.id)!=null?n:t},onRowClick(e,t){this.rowClickable&&this.$emit("row-click",e,t)},getCellComponentProps(e,t){return typeof(e==null?void 0:e.cellProps)=="function"?e.cellProps(t):{}}},template:`
  <div class="btech-card btech-theme" :style="shellStyle">
    <div style="flex:0 0 auto; background:#fff; padding-bottom:8px;">
      <div class="btech-row" style="align-items:center; margin-bottom:8px;">
        <h4 class="btech-card-title" style="margin:0;" v-html="titleHtml"></h4>
        <div style="flex:1;"></div>
        <span class="btech-pill">Rows: {{ rowCount }}</span>
      </div>

      <div v-if="$slots.description" class="btech-muted" style="font-size:.8rem; margin-bottom:8px;">
        <slot name="description"></slot>
      </div>

      <div v-if="$slots.filters" class="btech-row" style="gap:.75rem; margin-bottom:8px; align-items:center; justify-content:flex-start; flex-wrap:wrap;">
        <slot name="filters"></slot>
      </div>
    </div>

    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px; flex:1 1 auto; overflow:auto;">
      {{ loadingText }}
    </div>

    <div v-else-if="loadError" class="btech-muted" style="text-align:center; padding:10px; flex:1 1 auto; overflow:auto;">
      {{ loadError }}
    </div>

    <div v-else style="flex:1 1 auto; min-height:0; overflow:auto; max-width:100%;">
      <div style="min-width:100%; width:max-content;">
        <div
          style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none; position:sticky; top:0; z-index:2; background:#fff;"
          :style="{ 'grid-template-columns': columnsWidthString }"
        >
          <div
            v-for="col in visibleColumns"
            :key="col.name"
            :title="col.description"
            style="display:inline-block; cursor:pointer;"
            @click="!col.hideHeader && setSortColumn(col.name)"
          >
            <span v-if="!col.hideHeader"><b>{{ col.name }}</b></span>
            <span v-if="!col.hideHeader" style="margin-left:.25rem;">
              <svg style="width:.75rem;height:.75rem;" viewBox="0 0 490 490" aria-hidden="true">
                <g>
                  <polygon :style="{ fill: col.sort_state < 0 ? '#000' : '#E0E0E0' }"
                    points="85.877,154.014 85.877,428.309 131.706,428.309 131.706,154.014 180.497,221.213 217.584,194.27 108.792,44.46 0,194.27 37.087,221.213"/>
                  <polygon :style="{ fill: col.sort_state > 0 ? '#000' : '#E0E0E0' }"
                    points="404.13,335.988 404.13,61.691 358.301,61.691 358.301,335.99 309.503,268.787 272.416,295.73 381.216,445.54 490,295.715 452.913,268.802"/>
                </g>
              </svg>
            </span>
          </div>
        </div>

        <div
          v-for="(row, index) in preparedRows"
          :key="getRowKey(row, index)"
          @click="onRowClick(rows[index], index)"
          style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.5rem;"
          :style="{
            'grid-template-columns': columnsWidthString,
            'background-color': (index % 2) ? 'white' : '#F8F8F8',
            'cursor': rowClickable ? 'pointer' : 'default'
          }"
        >
          <div
            v-for="col in visibleColumns"
            :key="col.name"
            :style="col.wrap
              ? 'display:block; overflow:visible; white-space:normal; text-overflow:clip; line-height:1.2rem; padding:.125rem 0;'
              : 'display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;'"
          >
            <component
              v-if="col.cellComponent"
              :is="col.cellComponent"
              v-bind="getCellComponentProps(col, row)"
            ></component>
            <span
              v-else
              :class="col.style_formula ? 'btech-pill-text' : ''"
              :style="col.wrap
                ? Object.assign({}, col.get_style(row), { display: 'block', whiteSpace: 'normal' })
                : col.get_style(row)"
              v-html="col.getContent(row)"
            ></span>
          </div>
        </div>
      </div>
    </div>
  </div>
  `});})();
