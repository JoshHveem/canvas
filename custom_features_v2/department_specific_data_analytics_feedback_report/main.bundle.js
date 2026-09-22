(()=>{(async function(){function l(o){let t=$(`
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
      `);return $("body").append(t),o&&u(t),t}function u(o){o.click(function(t){t.target===this&&$(this).remove()})}let d=$('<button class="btn">DATA Feedback</button>');$(".header-bar-right__buttons").prepend(d),d.click(async function(){let t=l(!0).find("#background-container");t.append("Loading");let a=$("<div></div>"),s=await canvasGet(`/api/v1/courses/${ENV.course_id}/assignments`);s.sort(function(r,n){var e=r.name.toUpperCase(),i=n.name.toUpperCase();return e<i?-1:e>i?1:0});for(let r in s){let n=s[r];if(n.name.match(/Module [0-9]+ Feedback/)){a.append(`<h2>${n.name}</h2>`);let e=$("<ul></ul>"),i=await canvasGet(`/api/v1/courses/${ENV.course_id}/assignments/${n.id}/submissions`);for(let p in i){let c=i[p];c.body!=null&&e.append(`<li>${c.body}</li>`)}a.append(e)}}t.empty(),t.append(a.html()),$("#background-container").css({"overflow-y":"scroll",height:"90vh",width:"90vw"})})})();})();
