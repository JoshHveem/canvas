$(async function () {
  $("img").each(async function () {
    const img = $(this);
    const src = img.attr("src");

    // Match Canvas preview image URL: /courses/{course_id}/files/{file_id}/preview
    const match = src.match(/\/courses\/(\d+)\/files\/(\d+)/);

    if (match) {
      const courseId = match[1];
      const fileId = match[2];
      let file = await canvasGet(`/api/v1/courses/${courseId}/files/${fileId}`);
      console.log(file);

      // Check if the image is broken
      $("<img>")
        .attr("src", src)
        .on("error", function () {
          const restoreBtn = $(`
            <button style="margin:5px; background:#ffd; border:1px solid #ccc;" class="canvas-restore-btn" data-course-id="${courseId}" data-file-id="${fileId}">
              🔄 Restore Image
            </button>
          `);

          img.after(restoreBtn);

          restoreBtn.on("click", function () {
            const courseId = $(this).data("course-id");
            const fileId = $(this).data("file-id");

            $.post(`https://btech.instructure.com/courses/${courseId}/undelete/attachment_${fileId}`);
          });
        });
    }
  });
});