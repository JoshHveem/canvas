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
            padding:6px; border-radius:10px; background:#f3f4f6; margin-bottom:6px;
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
        <div style="font-size: 0.75rem;">
          <strong>Disclaimer:</strong> With the transition to Defined Exit, there have been reports of inaccurate progress information in the original Student Report. This is a Beta version of a new Student Report built on the defined exit structure. However, it is still under active development. HS student data and Grades (grades between dates) in particular are not fully functional. However, the student progress in individual courses here should be more update. Once this tool has reached parity with the original Student Report, we'll shut the old report off.
        </div>

        <!-- Degree selector sub-menu -->
        <div
          v-if="user?.degrees && user.degrees.length"
          class="btech-degree-switcher"
        >
          <label
            for="btech-degree-select"
            class="btech-degree-switcher__label"
          >
            Program:
          </label>

          <select
            id="btech-degree-select"
            v-model="currentDegreeId"
            class="btech-degree-switcher__select"
          >
            <option
              v-for="(deg, idx) in user.degrees"
              :key="deg._id || idx"
              :value="deg._id || idx"
            >
              {{ deg.major_code + ' ' + deg.academic_year }}
            </option>
          </select>
        </div>

        <div>
          <ind-header-credits-2
            :colors="colors"
            :user="user"
            :degree="currentDegree"
            :tree="tree"
            :settings="settings"
          ></ind-header-credits-2> 
        </div>


        
        <div v-show="settings.reportType === 'student-courses'">
          <student-courses-report-2
            :user="user"
            :degree="currentDegree"
            :settings="settings"
            :colors="colors"
            :tree="tree"
          ></student-courses-report-2>
        </div>
        <div v-show="settings.reportType === 'student-grades'">
          <show-student-grades
            v-if="user != undefined"
            :user="user"
          ></show-student-grades>
        </div>
        <div v-show="settings.reportType === 'hs-grades'">
          <grades-between-dates-2
            v-if="enrollmentData != undefined"
            :user="user"
            :enrollments="enrollmentData"
            :user-id="userId"
            :terms="user.hs_terms"
            :colors="colors"
            :IS-TEACHER="IS_TEACHER"
          ></grades-between-dates-2>
        </div>
        <div v-show="settings.reportType === 'hs-grades-old'">
          <show-grades-between-dates
            v-if="enrollmentData != undefined"
            :user="user"
            :enrollments="enrollmentData"
            :user-id="userId"
            :terms="user.hs_terms"
            :colors="colors"
            :IS-TEACHER="IS_TEACHER"
          ></show-grades-between-dates>
        </div>
      </div>
    </div>
  </div>
</template>