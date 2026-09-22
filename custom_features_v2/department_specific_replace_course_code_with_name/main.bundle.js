(()=>{(async function(){let a=await $.get("/api/v1/courses/"+ENV.COURSE_ID);$(`a[href$="/courses/${ENV.COURSE_ID}"] span`).html(a.name)})();})();
