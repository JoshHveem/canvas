(()=>{(async function(){IMPORTED_FEATURE={};let g=/^\/courses\/([0-9]+)\/assignments\/([0-9]+)\/submissions\/([0-9]+)/,p=/^\/courses\/([0-9]+)\/assignments\/([0-9]+)\/submissions\/([0-9]+)/,v=!1;window.location.pathname.includes("speed_grader")&&(g=/^\/courses\/([0-9]+)\/gradebook\/speed_grader\?assignment_id=([0-9]+)&student_id=([0-9]+)/,p=/^\/courses\/([0-9]+)\/gradebook\/speed_grader\?assignment_id=([0-9]+)/,v=!0),p.test(window.location.pathname+window.location.search)&&ENV.current_user_roles.includes("teacher")&&(IMPORTED_FEATURE={initiated:!1,oldHref:"",async _init(w={}){let n=this;if(v){n.oldHref=document.location.href,await getElement("#right_side");var f=document.querySelector("#right_side"),_=new MutationObserver(function(c){c.forEach(function(e){n.oldHref!==document.location.href&&(n.oldHref=document.location.href,n.createApp())})}),u={childList:!0,subtree:!0};_.observe(f,u)}n.createApp()},async createApp(){let w=`
            <div style="padding:10px;" id='app-hs-courses'>
              <div class="btech-tabs-container">
                <div class="btech-tabs">
                <ul>
                  <li v-for="menuName, key in menus" :class="{active: menu==menuName}" @click="menu=menuName">{{menuName}}</li>
                  <li v-if="flaggedDates.length > 0" :class="{active: menu=='flagged'}" @click="menu='flagged'">flagged dates</li>
                </ul>
                </div>
                <div style="padding: 10px;">

                  <div v-if="menu == 'courses'">
                    <div v-if="loading==true">Loading Content...</div>
                    <div v-else>
                      <h3>Select a course, enter the grade, and submit to add the course to the list of courses to be averaged for this term.</h3>
                      <select v-model="selectedCourse" @change="onCourseSelect()">
                        <option value="" disabled>-Select Course-</option>
                        <option v-for="course in courses" :value="course.course_id">{{course.name}} ({{course.term}})</option>
                      </select>
                      <br>
                      <span>Grade </span><input style="width: 3em;" maxlength="5" type="text" v-model="selectedGrade"><span>%</span>
                      <br>
                      <div v-on:click="submitCourseGrade()" class="Button">Submit</div>
                    </div>
                  </div>

                  <div v-if="menu == 'completed'">
                    <div v-for="course in courseGrades">
                      <p><b>{{course.name}}:</b> {{course.grade}}%<i @click="removeCourse(course)" style="float: right;" class="icon-end"></i></p>
                      <p style="font-size:.66rem;">{{course.term}}</p>
                    </div>
                    <br>
                    <div v-if="courseGrades.length > 0"><b>Average:</b> {{averageScore()}}%</div>
                  </div>

                </div>
              </div>
            </div>`,n=(window.location.pathname+window.location.search).match(p),f=parseInt(n[1]),_=parseInt(n[2]),u="";if(await $.get("/api/v1/courses/"+f+"/assignments/"+_,function(c){u=c.description}),u.includes("btech-hs-courses")&&g.test(window.location.pathname+window.location.search)){let c;v?c=await getElement("#submissions_container"):c=await getElement("div.submission-details-frame"),c.prepend(w),new Vue({el:"#app-hs-courses",data:function(){return{menu:"courses",menus:["courses","completed"],loading:!0,courseid:0,assignmetnId:0,studentId:0,comments:[],services:{},courses:[],courseGrades:[],completedServices:[],criteria:{},selectedCourse:"",selectedGrade:"",completedCriterionDate:"",dates:[],flaggedDates:[]}},mounted:async function(){let e=this,t=(window.location.pathname+window.location.search).match(g);e.courseId=parseInt(t[1]),e.studentId=parseInt(t[3]),e.assignmentId=parseInt(t[2]);let r=window.location.origin+"/users/"+e.studentId,s=[],o=(await canvasGet("/api/v1/accounts/3/terms"))[0].enrollment_terms,l={};for(let d in o){let a=o[d];l[a.id]=a}let m=await bridgetools.req3("reports",{canvas_user_id:e.studentId},{dataset:"canvas_enrollments"});for(let d in m){let a=m[d];try{let h=(await canvasGet("/api/v1/courses/"+a.canvas_course_id))[0];s.push({name:h.name,grade:a==null?void 0:a.current_score,term:l[h.enrollment_term_id].name,course_id:h.id})}catch(h){console.error("ERROR PULLING COURSE "+a.course_id)}}e.courses=s,this.comments=await this.getComments(),this.processComments(this.comments),this.loading=!1,$("#app-hs-courses").css("display","block")},computed:{},methods:{removeCourse:async function(e){for(let t=0;t<this.courseGrades.length;t++)this.courseGrades[t].course===e.course&&(await $.delete(window.location.origin+"/submission_comments/"+this.courseGrades[t].comment_id),this.courseGrades.splice(t,1))},onCourseSelect:function(){let e=this,r="/api/v1/courses/"+this.selectedCourse+"/users?user_ids[]="+this.studentId+"&enrollment_state[]=active&enrollment_state[]=completed&enrollment_state[]=inactive&include[]=enrollments";$.get(r).done(function(s){e.selectedGrade=s[0].enrollments[0].grades.current_score})},averageScore:function(){let e=0,t=this.courseGrades.length;for(let s=0;s<t;s++){let i=this.courseGrades[s];e+=parseFloat(i.grade)}return(Math.round(e/t*10)/10).toFixed(1)},minToHoursString:function(e){let t=Math.floor(e/60);return e=e-t*60,t+"h "+e+"m"},hoursSubmittedInDate:function(e,t=""){let r=0;for(var s=0;s<this.services.length;s++){let i=this.services[s];(i.service==t||t=="")&&(e==""||this.dateToString(e)==this.dateToString(i.canvas_data.created_at))&&(r+=this.criteria[i.service].average_time)}return r},createComment(e,t,r){for(let i=0;i<this.courses.length;i++)this.courses[i].course_id==e&&(name=this.courses[i].name,term=this.courses[i].term);return"COURSE: "+e+`
NAME: `+name+`
TERM: `+term+`
GRADE: `+t},dateToString(e){return e=new Date(Date.parse(e)),e.getFullYear()+"-"+(e.getMonth()+1)+"-"+e.getDate()},async submitCourseGrade(){let e=""+this.selectedCourse,t=this.selectedGrade,r=!1;if(e!=""&&t!=""){for(let o=0;o<this.courseGrades.length;o++)""+this.courseGrades[o].course===e&&(this.courseGrades[o].grade=t,r=!0,await $.delete(window.location.origin+"/submission_comments/"+this.courseGrades[o].comment_id));r||this.courseGrades.push({grade:t});let s=this.averageScore();this.loading=!0;let i="/api/v1/courses/"+this.courseId+"/assignments/"+this.assignmentId+"/submissions/"+this.studentId;await $.put(i,{comment:{text_comment:this.createComment(e,t)},submission:{posted_grade:s}}),location.reload(!0)}},async getComments(){let e="/api/v1/courses/"+this.courseId+"/assignments/"+this.assignmentId+"/submissions/"+this.studentId+"?include[]=submission_comments",t=[];return await $.get(e,function(r){t=r.submission_comments}),t},getCommentData(e,t){let r=new RegExp(t+":[ ]*(.+)"),s=e.match(r);return s!==null?s=s[1]:s="",s},processComments(e){this.completedServices=[],this.rejectedServices=[],this.pendingServices=[],courseGrades=[];for(let t=0;t<e.length;t++){let r=e[t].comment,s=e[t].author,i=this.dateToString(e[t].created_at);if(s.id!==this.studentId){let o=this.getCommentData(r,"COURSE");if(o!==""&&o!=="undefined"){let l=this.getCommentData(r,"TERM"),m=this.getCommentData(r,"GRADE"),d=this.getCommentData(r,"NAME");courseGrades.push({course:o,grade:m,term:l,name:d,author_data:s,canvas_data:e[t],comment_id:e[t].id}),this.dates.includes(i)||this.dates.push(i)}}}this.courseGrades=courseGrades}}})}}})})();})();
