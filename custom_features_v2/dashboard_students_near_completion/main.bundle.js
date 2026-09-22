(()=>{(async function(){async function b(){var c;let e=await $.post("/api/graphql",{query:`
    {
      allCourses {
        enrollmentsConnection(filter: {types: StudentEnrollment, states: active}) {
          nodes {
            grades {
              finalScore
              currentScore
            }
            user {
              _id
              sortableName
            }
          }
        }
        courseCode
        name
        _id
        term {
          _id
          endAt
        }
      }
    }
    `}),o=Date.now(),i=(((c=e==null?void 0:e.data)==null?void 0:c.allCourses)||[]).filter(t=>{var n,r,a;return(((r=(n=t.enrollmentsConnection)==null?void 0:n.nodes)==null?void 0:r.length)||0)>0&&new Date(((a=t.term)==null?void 0:a.endAt)||0).getTime()>o}).flatMap(t=>{var n;return(((n=t.enrollmentsConnection)==null?void 0:n.nodes)||[]).map(r=>{var p,m;let a=r.grades||{},d=Number(a.currentScore||0),f=Number(a.finalScore||0);if(!d||!isFinite(d))return null;let l=f/d;return l>.95?{course_id:t._id,course_code:t.courseCode||"",user_id:((p=r.user)==null?void 0:p._id)||"",user_name:((m=r.user)==null?void 0:m.sortableName)||"",progress:l}:null}).filter(Boolean)});return i.sort((t,n)=>t.course_code.localeCompare(n.course_code)||t.user_name.localeCompare(n.user_name)),i}async function g(){let s=$(".btech-modal");if(s.length)return s.first().show(),s.first();let e=$('<div class="btech-modal" role="dialog" aria-modal="true" style="display: inline-block;"><div class="btech-modal-content" style="width: 80%;"><div class="btech-modal-content-inner"><h2>Students Near Completion</h2><div class="btech-modal-completed-enrollments">Loading\u2026</div></div></div></div>');e.on("click",o=>{$(o.target).is(e)&&e.remove()}),$("body").append(e);try{let o=await b(),u=$("<div>").addClass("btech-enrollment-container").attr("style","display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px;");o.length?(o.forEach(({course_code:i,course_id:c,user_id:t,user_name:n,progress:r})=>{let a=(r*100).toFixed(1)+"%",d=$("<div>").addClass("btech-enrollment-card").attr("style","border: 1px solid #ddd; padding: 8px; border-radius: 4px; width: 200px; box-sizing: border-box;"),f=$("<div>").addClass("course-code").attr("style","font-weight: bold; margin-bottom: 4px;").text(i),l=$("<div>").addClass("student-name").attr("style","margin-bottom: 4px;"),p=$("<a>").attr({target:"_blank",href:`/courses/${c}/grades/${t}`}).text(n);l.append(p);let m=$("<div>").addClass("progress").text(a);d.append(f,l,m),u.append(d)}),e.find(".btech-modal-completed-enrollments").empty().append(u)):e.find(".btech-modal-completed-enrollments").text("No students are within 95% completion yet.")}catch(o){console.error(o),e.find(".btech-modal-completed-enrollments").text("Error loading data.")}return e}$(function(){let s=$(`
    <a href="javascript:;" class="Button button-sidebar-wide">
      View Students Near Course Completion
    </a>
  `);s.on("click",async e=>{e.preventDefault(),await g()}),$("#right-side").append(s)})})();})();
