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
            role="tab"
            :aria-selected="settings.reportType === 'student-courses' ? 'true' : 'false'"
            :tabindex="settings.reportType === 'student-courses' ? 0 : -1"
            @click="settings.reportType = 'student-courses'; onReportChange()"
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
            :style="settings.reportType === 'student-courses'
              ? 'background:#111827; color:#fff; border-color:#111827; box-shadow:0 1px 4px rgba(0,0,0,.15);'
              : 'background:#fff; color:#111827;'"
          >
            Courses
          </button>
          <button
            role="tab"
            :aria-selected="settings.reportType === 'employment-skills' ? 'true' : 'false'"
            :tabindex="settings.reportType === 'employment-skills' ? 0 : -1"
            @click="settings.reportType = 'employment-skills'; onReportChange()"
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
            :style="settings.reportType === 'employment-skills'
              ? 'background:#111827; color:#fff; border-color:#111827; box-shadow:0 1px 4px rgba(0,0,0,.15);'
              : 'background:#fff; color:#111827;'"
          >
            Employment Skills
          </button>
          <button
            role="tab"
            :aria-selected="settings.reportType === 'hs-grades' ? 'true' : 'false'"
            :tabindex="settings.reportType === 'hs-grades' ? 0 : -1"
            @click="settings.reportType = 'hs-grades'; onReportChange()"
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
            :style="settings.reportType === 'hs-grades'
              ? 'background:#111827; color:#fff; border-color:#111827; box-shadow:0 1px 4px rgba(0,0,0,.15);'
              : 'background:#fff; color:#111827;'"
          >
            HS Grades
          </button>
          <button
            role="tab"
            :aria-selected="settings.reportType === 'hs-grades-old' ? 'true' : 'false'"
            :tabindex="settings.reportType === 'hs-grades-old' ? 0 : -1"
            @click="settings.reportType = 'hs-grades-old'; onReportChange()"
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
            :style="settings.reportType === 'hs-grades-old'
              ? 'background:#111827; color:#fff; border-color:#111827; box-shadow:0 1px 4px rgba(0,0,0,.15);'
              : 'background:#fff; color:#111827;'"
          >
            HS Grades (Old)
          </button>
        </div>

        <div
          v-if="loading"
          style="
            margin:12px 0 10px 0;
            padding:14px;
            border:1px solid #e5e7eb;
            border-radius:12px;
            background:#f9fafb;
          "
        >
          <div style="display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:8px;">
            <strong style="font-size:13px;">Loading Courses</strong>
            <span style="font-size:12px; color:#6b7280;">{{ Math.round(loadingProgress) }}%</span>
          </div>
          <div
            style="
              width:100%;
              height:10px;
              border-radius:999px;
              background:#e5e7eb;
              overflow:hidden;
              margin-bottom:8px;
            "
          >
            <div
              :style="`
                width:${loadingProgress}%;
                height:100%;
                background:linear-gradient(90deg, #b20b0f 0%, #d97706 100%);
                transition:width .2s ease;
              `"
            ></div>
          </div>
          <div style="font-size:12px; color:#4b5563;">
            {{ loadingMessage }}
          </div>
        </div>

        <!-- Degree selector sub-menu -->
        <div
          v-if="!loading && user.majors.length"
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

        <div v-if="!loading">
          <ind-header-credits
            :colors="colors"
            :user="user"
            :major="currentMajor"
            :settings="settings"
            :key="'header-' + selectedMajorIndex"
          ></ind-header-credits> 
        </div>


        
        <div v-if="!loading && settings.reportType === 'student-courses'">
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
        <div v-if="!loading && settings.reportType === 'employment-skills'">
          <employment-skills-report
            :user="user"
            :major="currentMajor"
            :settings="settings"
            :key="'employment-skills-' + selectedMajorIndex"
          ></employment-skills-report>
        </div>
        <div v-if="!loading && settings.reportType === 'student-grades'">
          <show-student-grades
            :user="user"
          ></show-student-grades>
        </div>
        <div v-if="!loading && settings.reportType === 'hs-grades'">
          <grades-between-dates
            v-if="userId"
            :user="user"
            :user-id="userId"
            :colors="colors"
            :IS-TEACHER="IS_TEACHER"
          ></grades-between-dates>
        </div>
        <div v-if="!loading && settings.reportType === 'hs-grades-old'">
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
