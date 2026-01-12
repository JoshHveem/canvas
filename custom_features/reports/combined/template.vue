<template>
  <div class="btech-modal btech-canvas-report" style="display:inline-block;">
    <div class="btech-modal-content" style="overflow:visible;">
      <div class="btech-modal-content-inner" style="overflow:visible;">
        <span class="btech-close" v-on:click="close()">&times;</span>

        <!-- Title -->
        <div class="btech-row" style="align-items:center; margin-bottom:6px;">
          <h3 class="btech-card-title" style="margin:0; width:100%; text-align:center;">
            {{ currentReportMeta.title }}
          </h3>
        </div>

        <!-- Report Mode Tabs (top level) -->
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
              : 'background:#fff; color:#111827; border-color: #C1C8D7;'"
          >
            {{ rt.label }}
          </button>
        </div>

        <!-- Sub-menu Tabs (per report) -->
        <div
          v-if="currentSubMenus && currentSubMenus.length"
          role="tablist"
          aria-label="Report view"
          style="
            display:inline-flex;
            gap:0;
            justify-content:center;
            align-items:center;
            padding:0;
            border-radius:999px;
            background:#ffffff;
            margin:0 auto 12px auto;
            width: 100%;
          "
        >
          <button
            v-for="(sm, idx) in currentSubMenus"
            :key="sm.value"
            role="tab"
            :aria-selected="currentSubKey === sm.value ? 'true' : 'false'"
            :tabindex="currentSubKey === sm.value ? 0 : -1"
            @click="setSubMenu(sm.value)"
            :style="
              `
              border:0;
              border-right:1px solid #C0C0D0;
              padding:4px 14px;
              font-size:11px;
              background:${currentSubKey === sm.value ? '#606060' : '#ffffff'};
              color:${currentSubKey === sm.value ? '#ffffff' : '#111827'};
              border:1px solid #C0C0D0;
              cursor:pointer;
              transition:all .15s ease;
              position:relative;
              z-index:${currentSubKey === sm.value ? 2 : 1};

              border-top-left-radius:${idx === 0 ? '999px' : '0'};
              border-bottom-left-radius:${idx === 0 ? '999px' : '0'};
              border-top-right-radius:${idx === currentSubMenus.length - 1 ? '999px' : '0'};
              border-bottom-right-radius:${idx === currentSubMenus.length - 1 ? '999px' : '0'};

              ${idx === currentSubMenus.length - 1 ? 'border-right:none;' : ''}
              `
            "
          >
            {{ sm.label }}
          </button>
        </div>

        <!-- Filters Row -->
        <div
          class="btech-row"
          style="align-items:flex-start; gap:12px; justify-content:center; margin-bottom:12px; flex-wrap:wrap;"
        >
          <!-- Account -->
          <div style="display:inline-block; min-width:200px;">
            <label class="btech-muted" style="display:block; font-size:12px; margin-bottom:4px;">Account</label>
            <select
              v-model="settings.account"
              aria-label="Select account"
              @change="saveSettings(settings)"
              style="width:100%; padding:6px 8px; border:1px solid #d1d5db; border-radius:6px; background:#fff;"
            >
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
            </select>
          </div>

          <!-- Year -->
          <div style="display:inline-block; min-width:120px;">
            <label class="btech-muted" style="display:block; font-size:12px; margin-bottom:4px;">Year</label>
            <select
              v-model="settings.filters.year"
              aria-label="Select year"
              @change="saveSettings(settings)"
              style="width:100%; padding:6px 8px; border:1px solid #d1d5db; border-radius:6px; background:#fff;"
            >
              <option
                v-for="year in Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)"
                :key="year"
                :value="year"
              >{{ year }}</option>
            </select>
          </div>

          <!-- Instructor selector (only when enabled) -->
          <div v-if="currentSelectors.includes('instructor')" style="display:inline-block; min-width:220px;">
            <label class="btech-muted" style="display:block; font-size:12px; margin-bottom:4px;">Instructor</label>
            <select
              v-model="settings.filters.instructor"
              @change="saveSettings(settings)"
              style="width:100%; padding:6px 8px; border:1px solid #d1d5db; border-radius:6px; background:#fff;"
            >
              <option value="">All</option>
              <option
                v-for="i in instructorsRaw"
                :key="i.canvas_id"
                :value="'' + i.canvas_id"
              >
                {{ (i.last_name || '') + ', ' + (i.first_name || '') }}
              </option>
            </select>
          </div>

          <!-- Course selector (only when enabled) -->
          <div v-if="currentSelectors.includes('course')" style="display:inline-block; min-width:240px;">
            <label class="btech-muted" style="display:block; font-size:12px; margin-bottom:4px;">Course</label>
            <select
              v-model="settings.filters.course"
              @change="saveSettings(settings)"
              style="width:100%; padding:6px 8px; border:1px solid #d1d5db; border-radius:6px; background:#fff;"
            >
              <option value="">All</option>
              <option
                v-for="c in sortedCoursesRaw"
                :key="c.id || c.course_id || c.canvas_course_id"
                :value="'' + (c.id || c.course_id || c.canvas_course_id)"
              >
                {{ (c.course_code + ' - ' + c.name) }}
              </option>
            </select>
          </div>

          <!-- Course Tags (compact dropdown) -->
           <!-- Course Tags (compact dropdown) -->
<div
  v-if="currentSelectors.includes('course_tags')"
  style="display:inline-block; min-width:240px; position:relative;"
>
  <label class="btech-muted" style="display:block; font-size:12px; margin-bottom:4px;">
    Course Tags
  </label>

  <!-- Trigger -->
  <button
    type="button"
    ref="courseTagsBtn"
    @click="toggleCourseTags()"
    style="
      width:100%;
      text-align:left;
      padding:6px 8px;
      border:1px solid #d1d5db;
      border-radius:6px;
      background:#fff;
      cursor:pointer;
      display:flex;
      align-items:center;
      gap:8px;
      height:34px; /* match select height */
    "
  >
    <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
      {{ courseTagsLabel }}
    </span>
    <span class="btech-pill" style="font-size:11px;">
      {{ (settings.filters.course_tags || []).length }}
    </span>
    <span aria-hidden="true" style="font-size:10px;">▾</span>
  </button>

  <!-- Popup panel (opens BELOW) -->
  <div
    v-if="courseTagsOpen"
    @click.stop
    style="
      position:absolute;
      left:0;
      right:0;
      top:calc(100% + 6px); /* open BELOW so it doesn't clip at top */
      z-index:9999;
      background:#fff;
      border:1px solid #e5e7eb;
      border-radius:8px;
      box-shadow:0 8px 24px rgba(0,0,0,.12);
      padding:8px;
    "
  >
    <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
      <input
        ref="courseTagsSearchInput"
        v-model="courseTagsSearch"
        type="text"
        placeholder="Search tags…"
        style="
          flex:1;
          padding:6px 8px;
          border:1px solid #d1d5db;
          border-radius:6px;
          font-size:12px;
        "
      />
      <button
        type="button"
        @click="clearCourseTags()"
        style="
          padding:6px 8px;
          border:1px solid #d1d5db;
          border-radius:6px;
          background:#fff;
          cursor:pointer;
          font-size:12px;
          white-space:nowrap;
        "
      >
        Clear
      </button>
    </div>

    <div
      v-if="!allCourseTags || !allCourseTags.length"
      class="btech-muted"
      style="padding:6px 2px;"
    >
      No tags available.
    </div>

    <div
      v-else
      ref="courseTagsScroll"
      style="
        max-height:180px;
        overflow:auto;
        border:1px solid #f1f5f9;
        border-radius:6px;
        padding:6px;
      "
    >
      <label
        v-for="t in filteredCourseTags"
        :key="t"
        style="display:flex; gap:8px; align-items:center; font-size:12px; padding:3px 2px;"
      >
        <input
          type="checkbox"
          :value="t"
          v-model="settings.filters.course_tags"
          @change="saveSettings(settings)"
        />
        <span style="flex:1;">{{ t }}</span>
      </label>
    </div>

    <div style="display:flex; justify-content:flex-start; gap:8px; margin-top:8px;">
      <button
        type="button"
        @click="courseTagsOpen = false"
        style="
          padding:6px 10px;
          border-radius:6px;
          border:1px solid #111827;
          background:#111827;
          color:#fff;
          cursor:pointer;
          font-size:12px;
        "
      >
        Done
      </button>
    </div>
  </div>
</div>

        </div>

        <!-- Dynamic report body -->
        <keep-alive>
          <component :is="currentReportMeta.component" v-bind="currentReportProps" />
        </keep-alive>
      </div>
    </div>
  </div>
</template>
