(()=>{if(/^\/courses\/[0-9]+\/grades\/[0-9]+$/.test(window.location.pathname)){let o=function(i,t="#C00",l="Below minium required score"){$(i.find(".assignment_score .score_holder")).append(`
      <span 
        title="${l}"
        class="unread_dot grade_dot" 
        style="background-color: ${t}; cursor: help;"
      >&nbsp;</span>
    `)};C=o;let e={},f=ENV.submissions;for(let i in f){let t=f[i];e[t.assignment_id]=t}let b=ENV.assignment_groups;for(let i in b){let l=b[i].assignments;for(let N in l){let n=l[N];if(e!=null&&e[n.id]){let a=$(`#submission_${n.id}`),p=e[n.id],u=p.score;if(p.workflow_state=="submitted"&&u==null){o(a,"#FC0","Needs to be graded");continue}let w=n.points_possible,k=u/w;if(u!=null)if(a.find("div.context").text()==="Skills Pass-Off"){let c={},g=ENV.rubric_assessments;for(let s in g){let r=g[s];r.rubric_association.association_id==n.id&&(c=r)}let d={},_=ENV.rubrics;for(let s in _){let r=_[s];if(r.id==c.rubric_id){d=r;break}}let m=0;for(let s in d.data)c.data[s].points<d.data[s].points&&(m+=1);m>0&&o(a,"#C00","Did not meet competency in "+m+" areas")}else k<.8&&o(a,"#C00")}}}}var C;})();
