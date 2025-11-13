<template>
  <div class="btech-modal btech-canvas-report" style="display:inline-block;">
    <div class="btech-modal-content">
      <div class="btech-modal-content-inner">
        <span class="btech-close" v-on:click="close()">&times;</span>

        <!-- Title -->
        <div class="btech-row" style="align-items:center; margin-bottom:6px;">
          <h3 class="btech-card-title" style="margin:0; width:100%; text-align:center;">
            {{ currentReportMeta.title }}
          </h3>
        </div>

        <!-- Report Mode Tabs -->
        <div
          role="tablist"
          aria-label="Report type"
          style="
            display:flex; gap:8px; justify-content:center; align-items:center;
            padding:6px; border-radius:10px; background:#f3f4f6; margin-bottom:10px;
          "
        >
          <button
            v-for="rt in reportTypes"
            :key="rt.value"
            role="tab"
            :aria-selected="settings.reportType === rt.value ? 'true' : 'false'"
            :tabindex="settings.reportType === rt.value ? 0 : -1"
            @click="settings.reportType = rt.value; onReportChange()"
            style="
              border:1px solid #e5e7eb;
              border-radius:12px;
              padding:6px 12px;
              font-weight:600;
              font-size:12px;
              background: white;
              cursor:pointer;
              transition: box-shadow .15s ease, background .15s ease;
            "
            :style="settings.reportType === rt.value
              ? 'background:#111827; color:#fff; border-color:#111827; box-shadow:0 1px 4px rgba(0,0,0,.15);'
              : 'background:#fff; color:#111827;'"
          >
            {{ rt.label }}
          </button>
        </div>
        <div>
        <ind-header-credits
          :colors="colors"
          :user="user"
          :degree="currentDegree"
          :tree="tree"
          :settings="settings"
        ></ind-header-credits> 
      </div>
        <div v-show="settings.reportType === 'student-courses'">
          <student-courses-report
            :user="user"
            :degree="currentDegree"
            :settings="settings"
            :tree="tree"
          ></student-courses-report>
        </div>
        <div v-show="settings.reportType === 'student-grades'">
          <grades-between-dates
            v-if="enrollmentData != undefined"
            :user="user"
            :enrollments="enrollmentData"
            :user-id="userId"
            :terms="user.hs_terms"
            :IS-TEACHER="IS_TEACHER"
          ></grades-between-dates>
        </div>
      </div>
    </div>
  </div>
</template>