<template>
  <div class="btech-modal btech-canvas-report" style="display:inline-block;">
    <div class="btech-modal-content" style="overflow:visible;">
      <div class="btech-modal-content-inner" style="overflow:visible; max-width:1100px;">
        <span class="btech-close" @click="close()">&times;</span>

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
          style="margin-bottom:16px; padding:12px 14px; border:1px solid #e2e8f0; border-radius:12px; background:#fff;"
        >
          <div style="font-weight:600; margin-bottom:4px;">Shell Notes</div>
          <div class="btech-muted">
            Add report-specific selectors, datasets, and components incrementally from here instead of carrying over v2 assumptions.
          </div>
        </div>

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
