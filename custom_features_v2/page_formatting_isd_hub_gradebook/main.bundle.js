(()=>{(async function(){$("#content").empty();let u=[4496,4491,4492],m=(await Promise.all(u.map(e=>canvasGet(`/api/v1/accounts/${e}/courses?published=true&include[]=course_image&include[]=banner_image&per_page=100`)))).flat(),b=await canvasGet(`/api/v1/users/${ENV.student_id}/enrollments?type[]=StudentEnrollment&per_page=100`),s={};b.forEach(e=>{s[e.course_id]=e});function h(e){let t=s[e.id];return t?t.enrollment_state==="completed"||t.workflow_state==="completed"||t.completed_at?"earned":"current":"available"}function x(e){if(!e||!e.grades)return 0;let t=Number(e.grades.final_score),n=Number(e.grades.current_score);return!Number.isFinite(t)||!Number.isFinite(n)||n<=0?0:Math.max(0,Math.min(100,t/n*100))}let o={current:[],earned:[],available:[]};m.forEach(e=>{let t=h(e);o[t].push(e)});let p=$(`
    <div id="badge-course-interface" style="
      margin: 32px 24px;
      padding: 20px;
      border-top: 1px solid #ddd;
      font-family: inherit;
    ">
      <h2 style="
        margin: 0 0 20px 0;
        font-size: 22px;
        font-weight: 600;
      ">Badges</h2>

      <div data-badge-section="current"></div>
      <div data-badge-section="earned"></div>
      <div data-badge-section="available"></div>
    </div>
  `);function l(e,t,n){let g=$(`
      <div style="margin-bottom: 28px;">
        <h3 style="
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
        ">
          ${t}
          <span style="
            color: #777;
            font-weight: 400;
            font-size: 13px;
          ">(${n.length})</span>
        </h3>

        <div class="badge-course-grid" style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        "></div>
      </div>
    `),v=g.find(".badge-course-grid");n.forEach(a=>{let y=s[a.id],r=a.image_download_url||a.banner_image_download_url||"",f=x(y),c=1;e==="current"?c=.28:e==="available"&&(c=.22);let i=$(`
        <div class="badge-course-item" style="
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        ">
          <div class="badge-course-image-wrap" style="
            position: relative;
            width: 64px;
            height: 64px;
            max-width: 64px;
            max-height: 64px;
            flex: 0 0 64px;
            background: #f5f5f5;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          "></div>

          <div class="badge-course-info" style="min-width: 0;">
            <div class="badge-course-title" style="
              font-weight: 600;
              line-height: 1.25;
              overflow: hidden;
              text-overflow: ellipsis;
            "></div>

            <div class="badge-course-code" style="
              margin-top: 3px;
              font-size: 13px;
              color: #666;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            "></div>

            <div class="badge-course-status" style="
              margin-top: 4px;
              font-size: 12px;
              color: #777;
            "></div>
          </div>
        </div>
      `),d=i.find(".badge-course-image-wrap");r?d.append(`
          <img src="${r}" alt="" style="
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
            opacity: ${c};
          ">
        `):d.append(`
          <span style="
            font-size: 11px;
            color: #777;
            text-align: center;
          ">No image</span>
        `),e==="current"&&d.append(`
          <div style="
            position: absolute;
            left: 0;
            bottom: 0;
            width: 100%;
            height: ${f}%;
            overflow: hidden;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            pointer-events: none;
          ">
            ${r?`<img src="${r}" alt="" style="
                    position: absolute;
                    left: 0;
                    bottom: 0;
                    width: 64px;
                    height: 64px;
                    object-fit: contain;
                    display: block;
                  ">`:""}
          </div>
        `),e==="earned"&&d.append(`
          <div style="
            position: absolute;
            right: 2px;
            bottom: 2px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #2e7d32;
            color: white;
            font-size: 12px;
            line-height: 18px;
            text-align: center;
            font-weight: 700;
          ">\u2713</div>
        `),i.find(".badge-course-title").text(a.name||"Untitled course"),i.find(".badge-course-code").text(a.course_code||""),e==="current"?i.find(".badge-course-status").text(`${Math.round(f)}% complete`):e==="earned"?i.find(".badge-course-status").text("Earned"):i.find(".badge-course-status").text("Available"),v.append(i)}),p.find(`[data-badge-section="${e}"]`).append(g)}l("current","Current",o.current),l("earned","Earned",o.earned),l("available","Available",o.available),$("#content").empty().append(p)})();})();
