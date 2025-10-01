/*
  There is not currently a simple way for instructors to restore deleted files.
  This is a workaround that locates all of a given element (located through a query string) and checks a given parameter for a file url
  If it finds a link to a Canvas file, it will check if it is pullable using the api. Currently the api throws an error if a file is deleted.
  If it throws an error, ad a button that instructors can click to restore that file. Refresh.
*/
$(async function () {
  async function checkFileEl(elLocator, linkAttr) {
    $(elLocator).each(async function () {
      const el = $(this);
      const src = el.attr(linkAttr);

      // Match Canvas preview image URL: /courses/{course_id}/files/{file_id}/preview
      const match = src.match(/\/courses\/(\d+)\/files\/(\d+)/);

      if (match) {
        const courseId = match[1];
        const fileId = match[2];
        try {
          let file = await canvasGet(`/api/v1/courses/${courseId}/files/${fileId}`);
        } catch (err) {
          const restoreBtn = $(`
            <button style="margin:5px; background:#ffd; border:1px solid #ccc;" class="canvas-restore-btn" data-course-id="${courseId}" data-file-id="${fileId}">
              🔄 Restore Image
            </button>
          `);

          el.after(restoreBtn);

          restoreBtn.on("click", async function () {
            const courseId = $(this).data("course-id");
            const fileId = $(this).data("file-id");

            // Undelete request
            await $.post(`https://btech.instructure.com/courses/${courseId}/undelete/attachment_${fileId}`);

            // Force element to reload its file
            const oldUrl = el.attr(linkAttr);
            const newUrl = oldUrl + (oldUrl.includes("?") ? "&" : "?") + "t=" + Date.now();
            el.attr(linkAttr, newUrl);

            // Remove the restore button once done
            $(this).remove();
          });

        }
      }
    });
  }
  checkFileEl("img", "src");
  checkFileEl(".file_download_btn", "href");
});