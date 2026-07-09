(async function () {
  $('#content').empty();
  const courses = await canvasGet(
    '/api/v1/accounts/4491/courses?include[]=course_image&include[]=banner_image&per_page=100'
  );

  const enrollments = await canvasGet(
    `/api/v1/users/${ENV.student_id}/enrollments?type[]=StudentEnrollment&per_page=100`
  );

  const enrollmentsByCourseId = {};

  enrollments.forEach(enrollment => {
    enrollmentsByCourseId[enrollment.course_id] = enrollment;
  });

  function getEnrollmentStatus(course) {
    const enrollment = enrollmentsByCourseId[course.id];

    if (!enrollment) {
      return 'available';
    }

    if (
      enrollment.enrollment_state === 'completed' ||
      enrollment.workflow_state === 'completed' ||
      enrollment.completed_at
    ) {
      return 'earned';
    }

    return 'current';
  }

  function getProgress(enrollment) {
    if (!enrollment || !enrollment.grades) {
      return 0;
    }

    const finalScore = Number(enrollment.grades.final_score);
    const currentScore = Number(enrollment.grades.current_score);

    if (
      !Number.isFinite(finalScore) ||
      !Number.isFinite(currentScore) ||
      currentScore <= 0
    ) {
      return 0;
    }

    return Math.max(0, Math.min(100, (finalScore / currentScore) * 100));
  }

  const groupedCourses = {
    current: [],
    earned: [],
    available: []
  };

  courses.forEach(course => {
    const status = getEnrollmentStatus(course);
    groupedCourses[status].push(course);
  });

  const $container = $(`
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
  `);

  function renderSection(status, title, coursesInSection) {
    const $section = $(`
      <div style="margin-bottom: 28px;">
        <h3 style="
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
        ">
          ${title}
          <span style="
            color: #777;
            font-weight: 400;
            font-size: 13px;
          ">(${coursesInSection.length})</span>
        </h3>

        <div class="badge-course-grid" style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        "></div>
      </div>
    `);

    const $grid = $section.find('.badge-course-grid');

    coursesInSection.forEach(course => {
      const enrollment = enrollmentsByCourseId[course.id];
      const imageUrl = course.image_download_url || course.banner_image_download_url || '';
      const progress = getProgress(enrollment);

      let imageOpacity = 1;

      if (status === 'current') {
        imageOpacity = 0.28;
      } else if (status === 'available') {
        imageOpacity = 0.22;
      }

      const $badge = $(`
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
      `);

      const $imageWrap = $badge.find('.badge-course-image-wrap');

      if (imageUrl) {
        $imageWrap.append(`
          <img src="${imageUrl}" alt="" style="
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
            opacity: ${imageOpacity};
          ">
        `);
      } else {
        $imageWrap.append(`
          <span style="
            font-size: 11px;
            color: #777;
            text-align: center;
          ">No image</span>
        `);
      }

      if (status === 'current') {
        $imageWrap.append(`
          <div style="
            position: absolute;
            left: 0;
            bottom: 0;
            width: 100%;
            height: ${progress}%;
            overflow: hidden;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            pointer-events: none;
          ">
            ${
              imageUrl
                ? `<img src="${imageUrl}" alt="" style="
                    position: absolute;
                    left: 0;
                    bottom: 0;
                    width: 64px;
                    height: 64px;
                    object-fit: contain;
                    display: block;
                  ">`
                : ''
            }
          </div>
        `);
      }

      if (status === 'earned') {
        $imageWrap.append(`
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
          ">✓</div>
        `);
      }

      $badge.find('.badge-course-title').text(course.name || 'Untitled course');
      $badge.find('.badge-course-code').text(course.course_code || '');

      if (status === 'current') {
        $badge.find('.badge-course-status').text(`${Math.round(progress)}% complete`);
      } else if (status === 'earned') {
        $badge.find('.badge-course-status').text('Earned');
      } else {
        $badge.find('.badge-course-status').text('Available');
      }

      $grid.append($badge);
    });

    $container.find(`[data-badge-section="${status}"]`).append($section);
  }

  renderSection('current', 'Current', groupedCourses.current);
  renderSection('earned', 'Earned', groupedCourses.earned);
  renderSection('available', 'Available', groupedCourses.available);

  $('#content').empty().append($container);
})();