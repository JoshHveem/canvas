<template>
    <div class='btech-modal btech-canvas-report' style='display: inline-block;'>
        <div class='btech-modal-content'>
            <div class='btech-modal-content-inner'>
                <span class='btech-close' v-on:click='close()'>&times;</span>
                <h3 style='text-align: center;'>Instructor Report</h3>
                <div
                    style="display: inline-block;"
                >
                    <label>Year</label>
                    <select 
                        v-model="settings.filters.year" 
                        @change="
                        saveSettings(settings);
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
                    <!-- Grading Card (scoped under #canvas-instructor-report-vue) -->
                    <div
                    class="btech-card btech-theme"
                    v-if="grading"
                    aria-label="Grading overview card"
                    >
                    <!-- Header -->
                    <div class="btech-row" style="margin-bottom:12px;">
                        <h4 class="btech-card-title">Grading Overview</h4>
                        <span class="btech-pill" :title="'Filters: ' + (settings.filters?.year || '')">
                        {{ settings.filters?.year || '—' }}
                        </span>
                    </div>

                    <!-- KPI Tiles -->
                    <div class="btech-grid-3" style="margin-bottom:12px;">
                        <div class="btech-tile" title="Total number of submissions graded">
                        <div class="btech-kpi-label">Assignments Graded</div>
                        <div class="btech-kpi-value">{{ (grading.assignments_graded || 0).toLocaleString() }}</div>
                        </div>
                        <div class="btech-tile" title="Average score across graded submissions">
                        <div class="btech-kpi-label">Average Score</div>
                        <div class="btech-kpi-value">{{ Number(grading.average_score || 0).toFixed(1) }} <span class="btech-muted">pts</span></div>
                        </div>
                        <div class="btech-tile" title="Median days to return a grade">
                        <div class="btech-kpi-label">Days to Grade</div>
                        <div class="btech-kpi-value">{{ Number(grading.days_to_grade || 0).toFixed(1) }} <span class="btech-muted">days</span></div>
                        </div>
                        <div class="btech-tile" title="Average attempts students make before passing">
                        <div class="btech-kpi-label">Average Attempts</div>
                        <div class="btech-kpi-value">{{ Number(grading.average_attempts || 0).toFixed(2) }} <span class="btech-muted">per student</span></div>
                        </div>
                        <div class="btech-tile" title="Average number of comments per graded submission">
                        <div class="btech-kpi-label">Comments / Submission</div>
                        <div class="btech-kpi-value">{{ Number(grading.comments_per_submission_graded || 0).toFixed(2) }}</div>
                        </div>
                        <div class="btech-tile" title="Share of students needing more than one attempt (approximate)">
                        <div class="btech-kpi-label">&gt;1 Attempt (est.)</div>
                        <div class="btech-kpi-value">{{ Math.max(0, Math.min(100, Math.round(((Number(grading.average_attempts || 0) - 1) * 100)))) }}<span class="btech-muted">%</span></div>
                        </div>
                    </div>

                    <!-- Progress Bars -->
                    <div class="btech-grid-2" style="margin-bottom:8px;">
                        <div class="btech-tile">
                        <div class="btech-row" style="margin-bottom:6px;">
                            <div style="font-size:12px; color:#374151; font-weight:600;">Department Contribution</div>
                            <div style="font-size:12px; color:#111827; font-weight:700;">{{ Math.round((grading.perc_department_assignments_graded || 0) * 100) }}%</div>
                        </div>
                        <div class="btech-progress" role="presentation">
                            <div
                            class="fill btech-fill-accent"
                            :style="{ width: Math.max(0, Math.min(100, (grading.perc_department_assignments_graded || 0) * 100)) + '%' }"
                            role="progressbar"
                            :aria-valuenow="(grading.perc_department_assignments_graded || 0) * 100"
                            aria-valuemin="0"
                            aria-valuemax="100"
                            :aria-label="'Department contribution ' + Math.round((grading.perc_department_assignments_graded || 0) * 100) + '%'"
                            ></div>
                        </div>
                        <div class="btech-muted" style="margin-top:6px;">Share of all department grading handled by this instructor.</div>
                        </div>

                        <div class="btech-tile">
                        <div class="btech-row" style="margin-bottom:6px;">
                            <div style="font-size:12px; color:#374151; font-weight:600;">Graded with Rubric</div>
                            <div style="font-size:12px; color:#111827; font-weight:700;">{{ Math.round((grading.perc_graded_with_rubric || 0) * 100) }}%</div>
                        </div>
                        <div class="btech-progress" role="presentation">
                            <div
                            class="fill btech-fill-success"
                            :style="{ width: Math.max(0, Math.min(100, (grading.perc_graded_with_rubric || 0) * 100)) + '%' }"
                            role="progressbar"
                            :aria-valuenow="(grading.perc_graded_with_rubric || 0) * 100"
                            aria-valuemin="0"
                            aria-valuemax="100"
                            :aria-label="'Rubric usage ' + Math.round((grading.perc_graded_with_rubric || 0) * 100) + '%'"
                            ></div>
                        </div>
                        <div class="btech-muted" style="margin-top:6px;">Target: 100% of graded items should use a rubric.</div>
                        </div>
                    </div>

                    <!-- Footnote -->
                    <div class="btech-muted">
                        <span style="display:inline-block; margin-right:8px;">▲ Higher is better</span>
                        <span style="display:inline-block; margin-right:8px;">• Average Attempts reflects student retakes</span>
                    </div>
                    </div>

                    <!-- Empty State -->
                    <div class="btech-card btech-theme" v-else>
                    <div class="btech-muted" style="text-align:center;">No grading data yet.</div>
                    </div>


                </div>
            </div>
        </div>
    </div>
</template>