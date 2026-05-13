<template>
  <div class="btech-canvas-report" style="padding:24px 16px 32px;">
    <div style="max-width:1600px; margin:0 auto; display:flex; gap:24px; align-items:flex-start; flex-wrap:wrap;">
      <aside class="btech-card btech-theme" style="padding:16px; width:260px; flex:0 0 260px;">
        <div style="margin-bottom:16px;">
          <label
            class="btech-muted"
            for="report-group-select"
            style="display:block; font-size:12px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.04em;"
          >
            Report Group
          </label>
          <select
            id="report-group-select"
            :value="settings.reportType"
            @change="settings.reportType = $event.target.value; onReportChange()"
            style="width:100%; padding:7px 8px; border:1px solid #d1d5db; border-radius:6px; background:#fff;"
          >
            <option
              v-for="report in reportTypes"
              :key="report.value"
              :value="report.value"
            >
              {{ report.label }}
            </option>
          </select>
        </div>

        <div class="btech-muted" style="font-size:12px; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.04em;">
          Reports
        </div>
        <div
          role="tablist"
          aria-label="Reports"
          style="display:flex; flex-direction:column; gap:8px;"
        >
          <button
            v-for="subMenu in currentSubMenus"
            :key="subMenu.value"
            type="button"
            role="tab"
            :aria-selected="currentSubKey === subMenu.value ? 'true' : 'false'"
            @click="setSubMenu(subMenu.value)"
            :style="currentSubKey === subMenu.value
              ? 'width:100%; text-align:left; border:1px solid #111827; background:#111827; color:#fff; border-radius:12px; padding:10px 12px; cursor:pointer; font-weight:600;'
              : 'width:100%; text-align:left; border:1px solid #cbd5e1; background:#fff; color:#0f172a; border-radius:12px; padding:10px 12px; cursor:pointer; font-weight:600;'"
          >
            {{ subMenu.label }}
          </button>
        </div>
      </aside>

      <div style="flex:1 1 960px; min-width:0;">
        <div style="max-width:1400px; margin:0 auto 20px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:16px; flex-wrap:wrap;">
            <div>
              <h3 class="btech-card-title" style="margin:0 0 6px 0;">
                {{ currentSubMenuMeta.label || currentReportMeta.title || 'Reporting V3' }}
              </h3>
              <div class="btech-muted" style="font-size:13px;">
                {{ currentReportMeta.title || currentReportMeta.label }}
              </div>
            </div>
          </div>

          <div
            v-if="currentViews.length"
            role="tablist"
            aria-label="Report view"
            style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:16px;"
          >
            <button
              v-for="view in currentViews"
              :key="view.value"
              type="button"
              role="tab"
              :aria-selected="currentViewKey === view.value ? 'true' : 'false'"
              @click="setView(view.value)"
              :style="currentViewKey === view.value
                ? 'border:1px solid #475569; background:#475569; color:#fff; border-radius:999px; padding:6px 12px; cursor:pointer;'
                : 'border:1px solid #cbd5e1; background:#f8fafc; color:#334155; border-radius:999px; padding:6px 12px; cursor:pointer;'"
            >
              {{ view.label }}
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
    </div>
  </div>
</template>
