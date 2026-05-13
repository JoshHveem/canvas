<template>
  <div class="btech-canvas-report" style="padding:24px 16px 32px;">
    <div style="max-width:1600px; margin:0 auto; display:flex; gap:24px; align-items:flex-start; flex-wrap:wrap;">
      <aside class="btech-card btech-theme" style="padding:16px; width:208px; flex:0 0 208px; position:sticky; top:16px; align-self:flex-start; max-height:calc(100vh - 32px); overflow:auto;">
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
            v-if="allFilterControls.length"
            style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap; margin-bottom:16px;"
          >
            <div
              v-for="filter in allFilterControls"
              :key="filter.key"
              style="display:inline-block; min-width:240px; position:relative;"
            >
              <label
                class="btech-muted"
                :for="`report-filter-${filter.key}`"
                style="display:block; font-size:12px; margin-bottom:4px;"
              >
                {{ filter.label }}
              </label>
              <select
                v-if="filter.type !== 'multiselect'"
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

              <div v-else>
                <button
                  type="button"
                  :id="`report-filter-${filter.key}`"
                  :disabled="filter.disabled"
                  :aria-expanded="isMultiFilterOpen(filter.key) ? 'true' : 'false'"
                  @click="toggleMultiFilter(filter.key)"
                  style="width:100%; display:flex; justify-content:space-between; align-items:center; gap:10px; padding:6px 8px; border:1px solid #d1d5db; border-radius:6px; background:#fff; color:#111827; cursor:pointer;"
                >
                  <span>{{ multiFilterLabel(filter) }}</span>
                  <span>{{ isMultiFilterOpen(filter.key) ? '^' : 'v' }}</span>
                </button>

                <div
                  v-if="isMultiFilterOpen(filter.key)"
                  style="position:absolute; top:100%; left:0; right:0; z-index:40; margin-top:4px; border:1px solid #cbd5e1; border-radius:8px; background:#fff; box-shadow:0 12px 24px rgba(15,23,42,0.14); overflow:hidden;"
                >
                  <div style="max-height:260px; overflow:auto; padding:6px;">
                    <label
                      v-for="option in filter.options"
                      :key="option.value"
                      style="display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px; cursor:pointer; font-size:12px;"
                    >
                      <input
                        type="checkbox"
                        :checked="isMultiFilterOptionSelected(filter, option.value)"
                        @change="updateMultiFilterValue(filter.key, option.value, $event.target.checked)"
                      >
                      <span style="flex:1 1 auto; white-space:normal;">{{ option.label }}</span>
                    </label>

                    <div
                      v-if="!filter.options.length"
                      class="btech-muted"
                      style="padding:8px; font-size:12px;"
                    >
                      No options available.
                    </div>
                  </div>

                  <div style="display:flex; justify-content:flex-end; padding:8px; border-top:1px solid #e2e8f0; background:#f8fafc;">
                    <button
                      type="button"
                      @click="clearMultiFilterValue(filter.key)"
                      style="border:1px solid #cbd5e1; background:#fff; color:#334155; border-radius:6px; padding:5px 8px; cursor:pointer; font-size:12px;"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
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
                @filter-controls-change="setViewFilterControls"
              />
            </keep-alive>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
