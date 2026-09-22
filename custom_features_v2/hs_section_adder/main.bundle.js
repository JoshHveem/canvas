(()=>{(async function(){let l=window.location.href,S=new URL(l),k=/accounts\/(\d+)/,a=l.match(k),u=a?a[1]:null;if(u!=3){let m=function(){let n=$(`
        <div class='btech-modal' style='display: inline-block;'>
            <!-- ERASE THE DISPLAY PIECE BEFORE GOING LIVE -->
            <div class='btech-modal-content' style='max-width: 500px;'>
                <div class='btech-modal-content-inner'>
                </div>
            </div>
        </div>
      `);return $("body").append(n),n};var y=m;let h=$($("#content").find("[aria-label='Create new course']")[0]).parent(),v=$("<span></span>"),p=$(h.html().replace("Course","HS Sections").replace("Create new course","Add HS sections"));v.append(p),h.after(v);let w=[];p.click(async function(){let n=S.searchParams.get("enrollment_term_id");if(n==null)return;let o=m();$(o.find(".btech-modal-content-inner")[0]).append(`
        <div id="btech-hs-sections-adder-vue">
          <div
            v-if="step == 'courses'"
          >
            <div>Select Course to which you want to add Sections</div>
            <div>
              <div 
                v-for="(course, c) in courses" :key="c"
                >
                <div
                  :style="{
                    'background-color': c % 2 == 0 ? 'white' : '#EEE'
                  }"
                >
                  <input 
                    style="margin-right: 0.5rem;"
                    type="checkbox" 
                    v-model="course.include"
                    @click="handleCheck($event, c, courses)"
                    >
                  <span style="display: inline-block; width: 6rem;">{{ course.course_code }}</span>
                  <span><a :href="'/courses/' + course.id + '/settings#tab-sections'" target="_blank">{{ course.name }}</a></span>
                </div>
              </div>
            </div>
            <div><button @click="step = 'sections'">Select Sections</button></div>
          </div>
          <div
            v-if="step == 'sections'"
          >
            <div>
              Select High Schools to add as sections.
            </div>
            <div>
              <div 
                v-for="(section, s) in sections" :key="s"
                >
                <div
                  :style="{
                    'background-color': s % 2 == 0 ? 'white' : '#EEE'
                  }"
                >
                  <input 
                    style="margin-right: 0.5rem;"
                    type="checkbox" 
                    v-model="section.include"
                    @click="handleCheck($event, s, sections)"
                    >
                  <span>{{ section.name }}</span>
                </div>
              </div>
            </div>
            <div>
              <button @click="step = 'courses'">Back</button>
              <button @click="step = 'confirm'">Add Sections</button>
            </div>
          </div>
          <div
            v-if="step == 'confirm'"
          >
            <div>Do you wish to add {{courses.filter(course => course.include).length}} section(s) to {{sections.filter(section => section.include).length}} course(s)?</div>
            <div>
              <button @click="step = 'sections'">Back</button>
              <button @click="step = 'process'; process();">Confirm</button>
            </div>
          </div>
          <div
            v-if="step == 'process'"
          >
            <div>Progress: {{ Math.round(processProgress * 100)}}%</div>
            <div>Adding Section {{processSection}} to Course {{processCourse}}</div>
          </div>
        </div>
      `);let b=new Vue({el:"#btech-hs-sections-adder-vue",mounted:async function(){let t=await canvasGet(`/api/v1/accounts/${u}/courses?enrollment_term_id=${n}`);t.forEach(s=>s.include=!1),this.courses=t.filter(s=>s.sis_course_id!=null).sort((s,e)=>s.course_code.localeCompare(e.course_code)),this.hs_list.forEach(s=>{this.sections.push({name:s,include:!1})})},data:function(){return{lastChecked:null,step:"courses",courses:[],sections:[],hs_list:["Bear River HS AM","Box Elder HS AM","Green Canyon HS AM","Logan HS AM","Mt Crest HS AM","Rich HS AM","Ridgeline HS AM","Sky View HS AM","Teacher Training","InTech HS AM"],processProgress:0,processCourse:"",processSection:""}},methods:{async process(){let t=this.courses.filter(e=>e.include).sort((e,c)=>e.course_code.localeCompare(c.course_code)),s=this.sections.filter(e=>e.include).sort((e,c)=>e.name.localeCompare(c.name));for(let e in t){let c=t[e];this.processCourse=c.name;let r=await canvasGet(`/api/v1/courses/${c.id}/sections`);for(let d in s){let i=s[d];this.processSection=i.name;let f=!1;for(let C in r){let g=r[C];i.name==g.name&&(f=!0)}if(f)continue;let _=await $.post(`/api/v1/courses/${c.id}/sections`,{course_section:{name:i.name}})}this.processProgress=(parseInt(e)+1)/t.length}},handleCheck(t,s,e){this.$nextTick(()=>{if(t.shiftKey&&this.lastChecked!==null){let c=Math.min(this.lastChecked,s),r=Math.max(this.lastChecked,s),d=e[this.lastChecked].include;for(let i=c;i<=r;i++)e[i].include=d}this.lastChecked=s})}}});o.on("click",function(t){$(t.target).is(o)&&(b.$destroy(),o.remove())})})}})();})();
