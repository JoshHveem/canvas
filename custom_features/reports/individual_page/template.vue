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

        <!-- Degree selector sub-menu -->
        <div
          v-if="user.majors.length"
          class="btech-major-switcher"
        >
          <label
            for="btech-major-select"
            class="btech-major-switcher__label"
          >
            Major:
          </label>

          <select
            id="btech-major-select"
            v-model.number="selectedMajorIndex"
            @change="onMajorChange"
            class="btech-major-switcher__select"
          >
            <option
              v-for="(major, idx) in user.majors"
              :key="idx"
              :value="idx"
            >
              {{ major.major_code + ' ' + major.academic_year__major }}
            </option>
          </select>
        </div>

        <div>
          <ind-header-credits
            :colors="colors"
            :user="user"
            :major="currentMajor"
            :settings="settings"
            :key="'header-' + selectedMajorIndex"
          ></ind-header-credits> 
        </div>


        
        <div v-if="settings.reportType === 'student-courses'">
          <student-courses-report
            :user="user"
            :major="currentMajor"
            :core-courses="currentMajor.courses.core"
            :elective-courses="currentMajor.courses.elective"
            :other-courses="currentMajor.courses.other"
            :settings="settings"
            :colors="colors"
            :key="selectedMajorIndex"
          ></student-courses-report>
        </div>
        <div v-if="settings.reportType === 'student-grades'">
          <show-student-grades
            :user="user"
          ></show-student-grades>
        </div>
        <div v-if="settings.reportType === 'hs-grades'">
          <grades-between-dates
            v-if="userId"
            :user="user"
            :user-id="userId"
            :colors="colors"
            :IS-TEACHER="IS_TEACHER"
          ></grades-between-dates>
        </div>
        <div v-if="settings.reportType === 'hs-grades-old'">
          <show-grades-between-dates-old
            v-if="userId"
            :user="user"
            :user-id="userId"
            :terms="user.hs_terms"
            :colors="colors"
            :IS-TEACHER="IS_TEACHER"
          ></show-grades-between-dates-old>
        </div>
      </div>
    </div>
  </div>
</template>
