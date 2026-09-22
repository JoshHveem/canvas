(()=>{$(document).ready(async function(){var _;function v(n){let r=n.match(/\b(20\d{2})\b/);return r?r[1]:null}async function b(n){let r=[],s={},l=async(c=null)=>{var a,d,g;let p=`{
                course(id: "${n}") {
                    _id
                    name
                    courseCode
                    term {
                        name
                    }
                    applyGroupWeights
                    assignmentGroupsConnection {
                        nodes {
                            _id
                            name
                            groupWeight
                            state
                            assignmentsConnection(first: 100${c?`, after: "${c}"`:""}) {
                                pageInfo {
                                    hasNextPage
                                    endCursor
                                }
                                nodes {
                                    _id
                                    name
                                    published
                                    pointsPossible
                                    modules {
                                        _id
                                        position
                                    }
                                    quiz {
                                        modules {
                                            _id
                                            position
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }`;try{let u=await $.post("/api/graphql",{query:p}),e=(a=u==null?void 0:u.data)==null?void 0:a.course;if(e==null)return{};s.name=e==null?void 0:e.name,s.course_code=e==null?void 0:e.courseCode,s.term_name=(d=e==null?void 0:e.term)==null?void 0:d.name,s.group_weights=e==null?void 0:e.applyGroupWeights;let i=(g=e==null?void 0:e.assignmentGroupsConnection)==null?void 0:g.nodes;r.push(...i);let m=i.find(t=>t.assignmentsConnection.pageInfo.hasNextPage);if(m){let t=m.assignmentsConnection.pageInfo.endCursor;await l(t)}}catch(u){console.error("Error fetching assignment groups:",u)}};return await l(),s.assignment_groups=r,s}async function y(n){var l,c;let r={},s={};try{if(!((l=window.bridgetools)!=null&&l.req3))throw new Error("API3 client is unavailable");let[p,a]=await Promise.all([b(n),window.bridgetools.req3("reports",{canvas_course_id:`(${n})`},{dataset:"canvas_courses"})]),d=Number((c=a==null?void 0:a[0])==null?void 0:c.credits);if(!Number.isFinite(d)||d<0)throw new Error(`No valid credits found for course ${n}`);let g=0,u=p.assignment_groups.filter(e=>e.state=="available").map(e=>{var i,m;e.points_possible=0,e.assignments=e.assignmentsConnection.nodes;for(let t of e.assignments){t.published&&(e.points_possible+=t.pointsPossible);let C=(m=(i=t==null?void 0:t.quiz)==null?void 0:i.modules)!=null?m:t==null?void 0:t.modules;for(let h of C)s[h._id]==null&&(s[h._id]={position:h.position,assignments:[]}),s[h._id].assignments.push(t._id)}return g+=e.points_possible,e});u=u.map(e=>(e.credits=e.groupWeight/100*d,p.group_weights||(e.credits=d*(e.points_possible/g)),e.credits_per_point=0,e.points_possible>0&&(e.credits_per_point=e.credits/e.points_possible),e));for(let e of u)for(let i of e.assignments)r[i._id]={id:i._id,points_possible:i.published?i.pointsPossible:0,credits:e.credits_per_point*(i.published?i.pointsPossible:0)};return{assignments:r,modules:s,course_credits:d}}catch(p){return console.error(p),{}}}let f=(_=ENV.COURSE_ID)!=null?_:ENV.course_id,o;if(f!==void 0&&(o=await y(f)),(o==null?void 0:o.course_credits)>0){let n=0,r=Object.keys(o.modules).sort((s,l)=>o.modules[s].position-o.modules[l].position);for(let s of r){let l=o.modules[s];$(`.ig-subheader#sub-${s}`).remove();let c=0;for(let d of l.assignments){let g=o.assignments[d];c+=g.credits,n+=g.credits}let p=c/o.course_credits,a=n/o.course_credits;$(`.ig-header#${s}`).after(`
            <div 
                class="progress-bar-container ig-subheader"
                id="sub-${s}"
                style="position: relative; width: 100%; height: 28px; background-color: #E2E2E2;"
            >
                
                
                <!-- totalcoursePercentage -->
                <div 
                    class="total-progress" 
                    style="position: absolute; top: 0; left: 0; height: 100%; width: ${a*100}%; background-color: #55CFCB;">
                </div>
                <!-- coursePercentage -->
                <div 
                class="course-progress" 
                style="position: absolute; top: 0; left: 0; height: 100%; width: ${(a-p)*100}%; background-color: #05989D;">
                </div>
                
                
                <!-- Text overlay -->
                <div 
                class="progress-text" 
                style="position: relative; z-index: 2; text-align: center; line-height: 28px;">
                    <span style="background-color: rgba(255, 255, 255, 0.8); padding: 0px 8px; border-radius: 8px;">${Math.round(p*100)}% (${Math.ceil(c*10)/10} Crdt)&emsp;&emsp;Total: ${Math.round(a*100)}% (${Math.ceil(n*10)/10} Crdt)</span>
                </div>
            </div>
            `)}}});})();
