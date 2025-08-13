<template>
    <div class='btech-modal btech-canvas-report' style='display: inline-block;'>
        <div class='btech-modal-content'>
            <div class='btech-modal-content-inner'>
                <span class='btech-close' v-on:click='close()'>&times;</span>
                <h3 style='text-align: center;'>Instructor Report</h3>
                <div
                    style="display: inline-block;"
                >
                    <label>Course Source</label>
                    <select 
                        v-model="settings.account" 
                        @change="
                        saveSettings(settings); 
                        loadCourses();
                        "
                    >
                        <option v-for="account in accounts" :value="account.id">{{ (settings.anonymous && account.id != 0) ? ('ACCOUNT ' + account.id) : account.name }}</option>
                    </select>
                    <label>Year</label>
                    <select 
                        v-model="settings.filters.year" 
                        @change="
                        saveSettings(settings);
                        loadCourses();
                        "
                    >
                        <option
                            v-for="year in Array.from({ length: 5}, (_, i) => new Date().getFullYear() - i)"
                            :key="year"
                            :value="year"
                        >
                        {{ year }}
                        </option>
                    </select>
                </div>
                <div
                style="display: inline-block;"
                >
                </div>
                <div>
                    <!-- Grading Card -->
<div
  style="
    display:block;
    width:100%;
    box-sizing:border-box;
    background:#fff;
    border:1px solid #e6e6e6;
    border-radius:12px;
    padding:16px;
    margin:12px 0;
    box-shadow:0 1px 2px rgba(0,0,0,0.06);
  "
  v-if="grading"
  aria-label="Grading overview card"
>
  <!-- Header -->
  <div
    style="
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      margin-bottom:12px;
    "
  >
    <h4 style="margin:0; font-size:16px; font-weight:700; color:#1f2937;">
      Grading Overview
    </h4>
    <span
      style="
        display:inline-block;
        padding:4px 8px;
        font-size:12px;
        line-height:1;
        color:#374151;
        background:#f3f4f6;
        border:1px solid #e5e7eb;
        border-radius:999px;
        white-space:nowrap;
      "
      :title="'Filters: ' + (settings.filters?.year || '')"
    >
      {{ settings.filters?.year || '—' }}
    </span>
  </div>

  <!-- KPI Tiles -->
  <div
    style="
      display:grid;
      grid-template-columns:repeat(3, minmax(0,1fr));
      gap:12px;
      margin-bottom:12px;
    "
  >
    <!-- Assignments Graded -->
    <div
      style="
        border:1px solid #eef2f7;
        border-radius:10px;
        padding:10px;
        background:#fafafa;
      "
      title="Total number of submissions graded"
    >
      <div style="font-size:11px; color:#6b7280; margin-bottom:6px;">Assignments Graded</div>
      <div style="font-size:20px; font-weight:800; color:#111827;">
        {{ (grading.assignments_graded || 0).toLocaleString() }}
      </div>
    </div>

    <!-- Avg Score -->
    <div
      style="
        border:1px solid #eef2f7;
        border-radius:10px;
        padding:10px;
        background:#fafafa;
      "
      title="Average score across graded submissions"
    >
      <div style="font-size:11px; color:#6b7280; margin-bottom:6px;">Average Score</div>
      <div style="font-size:20px; font-weight:800; color:#111827;">
        {{ Number(grading.average_score || 0).toFixed(1) }}
        <span style="font-size:11px; color:#6b7280;">pts</span>
      </div>
    </div>

    <!-- Days to Grade -->
    <div
      style="
        border:1px solid #eef2f7;
        border-radius:10px;
        padding:10px;
        background:#fafafa;
      "
      title="Median days to return a grade"
    >
      <div style="font-size:11px; color:#6b7280; margin-bottom:6px;">Days to Grade</div>
      <div style="font-size:20px; font-weight:800; color:#111827;">
        {{ Number(grading.days_to_grade || 0).toFixed(1) }}
        <span style="font-size:11px; color:#6b7280;">days</span>
      </div>
    </div>

    <!-- Avg Attempts -->
    <div
      style="
        border:1px solid #eef2f7;
        border-radius:10px;
        padding:10px;
        background:#fafafa;
      "
      title="Average attempts students make before passing"
    >
      <div style="font-size:11px; color:#6b7280; margin-bottom:6px;">Average Attempts</div>
      <div style="font-size:20px; font-weight:800; color:#111827;">
        {{ Number(grading.average_attempts || 0).toFixed(2) }}
        <span style="font-size:11px; color:#6b7280;">per student</span>
      </div>
    </div>

    <!-- Comments per Submission -->
    <div
      style="
        border:1px solid #eef2f7;
        border-radius:10px;
        padding:10px;
        background:#fafafa;
      "
      title="Average number of comments per graded submission"
    >
      <div style="font-size:11px; color:#6b7280; margin-bottom:6px;">Comments / Submission</div>
      <div style="font-size:20px; font-weight:800; color:#111827;">
        {{ Number(grading.comments_per_submission_graded || 0).toFixed(2) }}
      </div>
    </div>

    <!-- Attempts: Pass Hurdle (derived helper shown as % needing >1 attempt) -->
    <div
      style="
        border:1px solid #eef2f7;
        border-radius:10px;
        padding:10px;
        background:#fafafa;
      "
      title="Share of students needing more than one attempt (approximation)"
    >
      <div style="font-size:11px; color:#6b7280; margin-bottom:6px;">>1 Attempt (est.)</div>
      <div style="font-size:20px; font-weight:800; color:#111827;">
        {{
          Math.max(
            0,
            Math.min(100, Math.round(((Number(grading.average_attempts || 0) - 1) * 100)))
          )
        }}<span style="font-size:11px; color:#6b7280;">%</span>
      </div>
    </div>
  </div>

  <!-- Percent Bars Grouped -->
  <div
    style="
      display:grid;
      grid-template-columns:repeat(2, minmax(0,1fr));
      gap:12px;
      margin-bottom:8px;
    "
  >
    <!-- Dept Contribution -->
    <div style="padding:8px; border:1px solid #eef2f7; border-radius:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <div style="font-size:12px; color:#374151; font-weight:600;">Department Contribution</div>
        <div style="font-size:12px; color:#111827; font-weight:700;">
          {{ Number(grading.perc_department_assignments_graded || 0).toFixed(0) }}%
        </div>
      </div>
      <div style="height:8px; background:#f3f4f6; border-radius:999px; overflow:hidden;">
        <div
          :style="{
            width: Math.max(0, Math.min(100, Number(grading.perc_department_assignments_graded || 0))) + '%',
            height: '100%',
            background: '#2563eb'
          }"
          role="progressbar"
          :aria-valuenow="Number(grading.perc_department_assignments_graded || 0)"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="'Department contribution ' + (grading.perc_department_assignments_graded || 0) + '%'"
        ></div>
      </div>
      <div style="font-size:11px; color:#6b7280; margin-top:6px;">
        Share of all department grading handled by this instructor.
      </div>
    </div>

    <!-- Rubric Usage -->
    <div style="padding:8px; border:1px solid #eef2f7; border-radius:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <div style="font-size:12px; color:#374151; font-weight:600;">Graded with Rubric</div>
        <div style="font-size:12px; color:#111827; font-weight:700;">
          {{ (Number(grading.perc_graded_with_rubric || 0) * 100).toFixed(0) }}%
        </div>
      </div>
      <div style="height:8px; background:#f3f4f6; border-radius:999px; overflow:hidden;">
        <div
          :style="{
            width: Math.max(0, Math.min(100, Number(grading.perc_graded_with_rubric * 100 || 0))) + '%',
            height: '100%',
            background: '#10b981'
          }"
          role="progressbar"
          :aria-valuenow="Number(grading.perc_graded_with_rubric * 100 || 0)"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="'Rubric usage ' + (grading.perc_graded_with_rubric * 100 || 0) + '%'"
        ></div>
      </div>
      <div style="font-size:11px; color:#6b7280; margin-top:6px;">
        Target: 100% of graded items should use a rubric.
      </div>
    </div>
  </div>

  <!-- Tiny Legend / Footnotes -->
  <div style="font-size:11px; color:#6b7280;">
    <span style="display:inline-block; margin-right:8px;">▲ Higher is better</span>
    <span style="display:inline-block; margin-right:8px;">• Average Attempts reflects student retakes</span>
  </div>
</div>

<!-- Optional: Empty State if grading is missing -->
<div
  v-else
  style="
    display:block;
    width:100%;
    box-sizing:border-box;
    background:#fff;
    border:1px dashed #e5e7eb;
    border-radius:12px;
    padding:16px;
    margin:12px 0;
    color:#6b7280;
    text-align:center;
  "
>
  No grading data yet.
</div>

                </div>
            </div>
        </div>
    </div>
</template>