<template>
  <div class="btech-canvas-report" style="padding:24px 16px 32px;">
    <div style="max-width:1400px; margin:0 auto 20px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:16px; flex-wrap:wrap;">
        <div>
          <h3 class="btech-card-title" style="margin:0 0 6px 0;">
            {{ currentReportMeta.title || 'Reporting V3' }}
          </h3>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Report type"
        style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:12px;"
      >
        <button
          v-for="report in reportTypes"
          :key="report.value"
          type="button"
          role="tab"
          :aria-selected="settings.reportType === report.value ? 'true' : 'false'"
          @click="settings.reportType = report.value; onReportChange()"
          :style="settings.reportType === report.value
            ? 'border:1px solid #111827; background:#111827; color:#fff; border-radius:999px; padding:8px 14px; cursor:pointer; font-weight:600;'
            : 'border:1px solid #cbd5e1; background:#fff; color:#0f172a; border-radius:999px; padding:8px 14px; cursor:pointer; font-weight:600;'"
        >
          {{ report.label }}
        </button>
      </div>

      <div
        v-if="currentSubMenus.length"
        role="tablist"
        aria-label="Report section"
        style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:16px;"
      >
        <button
          v-for="subMenu in currentSubMenus"
          :key="subMenu.value"
          type="button"
          role="tab"
          :aria-selected="currentSubKey === subMenu.value ? 'true' : 'false'"
          @click="setSubMenu(subMenu.value)"
          :style="currentSubKey === subMenu.value
            ? 'border:1px solid #475569; background:#475569; color:#fff; border-radius:999px; padding:6px 12px; cursor:pointer;'
            : 'border:1px solid #cbd5e1; background:#f8fafc; color:#334155; border-radius:999px; padding:6px 12px; cursor:pointer;'"
        >
          {{ subMenu.label }}
        </button>
      </div>

      <div
        v-if="currentFilterControls.length"
        style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap; margin-bottom:16px;"
      >
        <div
          v-for="filter in currentFilterControls"
          :key="filter.key"
          style="display:inline-block; min-width:240px;"
        >
          <label
            class="btech-muted"
            :for="`report-filter-${filter.key}`"
            style="display:block; font-size:12px; margin-bottom:4px;"
          >
            {{ filter.label }}
          </label>
          <select
            :id="`report-filter-${filter.key}`"
            :value="filter.value"
            :disabled="filter.disabled"
            @change="updateFilterValue(filter.key, $event.target.value)"
            style="width:100%; padding:6px 8px; border:1px solid #d1d5db; border-radius:6px; background:#fff;"
          >
            <option value="">{{ filter.placeholder }}</option>
            <option
              v-for="option in filter.options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div style="display:flex; justify-content:center;">
      <div style="width:fit-content; max-width:min(1400px, 100%);">
        <div v-if="loading" class="btech-card btech-theme" style="padding:20px;">
          <div class="btech-muted">Loading report shell...</div>
        </div>

        <keep-alive v-else>
          <component
            :is="currentReportMeta.component"
            v-bind="currentViewProps"
            @drill-report="drillToReport"
          />
        </keep-alive>
      </div>
    </div>
  </div>
</template>
