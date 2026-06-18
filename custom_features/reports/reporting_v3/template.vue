<template>
  <div
    ref="reportShell"
    class="btech-canvas-report"
    :style="{ width: reportShellWidth, maxWidth: reportShellWidth, height: reportShellHeight, overflow: 'hidden', boxSizing: 'border-box', padding: '16px 12px 0 0' }"
  >
    <div style="width:100%; height:100%; min-height:0; display:flex; gap:24px; align-items:flex-start; flex-wrap:nowrap; overflow:hidden;">
      <aside class="btech-card btech-theme" style="padding:12px; width:208px; flex:0 0 208px; align-self:flex-start; overflow:visible;">
        <div role="tablist" aria-label="Sidebar sections" style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-bottom:14px;">
          <button
            type="button"
            role="tab"
            :aria-selected="sidebarTab === 'reports' ? 'true' : 'false'"
            @click="sidebarTab = 'reports'"
            :style="sidebarTab === 'reports'
              ? 'border:1px solid #111827; background:#111827; color:#fff; border-radius:6px; padding:7px 8px; cursor:pointer; font-weight:600;'
              : 'border:1px solid #cbd5e1; background:#fff; color:#334155; border-radius:6px; padding:7px 8px; cursor:pointer; font-weight:600;'"
          >
            Reports
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="sidebarTab === 'filters' ? 'true' : 'false'"
            @click="sidebarTab = 'filters'"
            :style="sidebarTab === 'filters'
              ? 'border:1px solid #111827; background:#111827; color:#fff; border-radius:6px; padding:7px 8px; cursor:pointer; font-weight:600;'
              : 'border:1px solid #cbd5e1; background:#fff; color:#334155; border-radius:6px; padding:7px 8px; cursor:pointer; font-weight:600;'"
          >
            Filters
          </button>
        </div>

        <div v-if="sidebarTab === 'reports'">
          <div style="margin-bottom:14px;">
            <label
              class="btech-muted"
              for="report-group-select"
              style="display:block; font-size:12px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.04em;"
            >
              Group
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

          <div style="margin-bottom:16px;">
            <label
              class="btech-muted"
              for="report-select"
              style="display:block; font-size:12px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.04em;"
            >
              Report
            </label>
            <select
              id="report-select"
              :value="currentSubKey"
              @change="setSubMenu($event.target.value)"
              style="width:100%; padding:7px 8px; border:1px solid #d1d5db; border-radius:6px; background:#fff;"
            >
              <option
                v-for="subMenu in currentSubMenus"
                :key="subMenu.value"
                :value="subMenu.value"
              >
                {{ subMenu.label }}
              </option>
            </select>
          </div>

          <div
            v-if="currentViews.length"
            role="tablist"
            aria-label="Report views"
            style="display:flex; flex-direction:column; gap:8px;"
          >
            <div class="btech-muted" style="font-size:12px; text-transform:uppercase; letter-spacing:0.04em;">
              Views
            </div>
            <button
              v-for="view in currentViews"
              :key="view.value"
              type="button"
              role="tab"
              :aria-selected="currentViewKey === view.value ? 'true' : 'false'"
              @click="setView(view.value)"
              :style="currentViewKey === view.value
                ? 'width:100%; text-align:left; border:1px solid #475569; background:#475569; color:#fff; border-radius:8px; padding:8px 10px; cursor:pointer;'
                : 'width:100%; text-align:left; border:1px solid #cbd5e1; background:#f8fafc; color:#334155; border-radius:8px; padding:8px 10px; cursor:pointer;'"
            >
              {{ view.label }}
            </button>
          </div>
        </div>

        <div v-else>
          <div
            v-if="allFilterControls.length"
            style="display:flex; flex-direction:column; gap:12px;"
          >
            <div
              v-for="filter in allFilterControls"
              :key="filter.key"
              class="report-filter-control"
              :data-filter-key="filter.key"
              style="position:relative;"
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
                class="report-filter-input"
                :id="`report-filter-${filter.key}`"
                :name="`report-filter-${filter.key}`"
                :data-filter-key="filter.key"
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
                  class="report-filter-input report-filter-multiselect-trigger"
                  :id="`report-filter-${filter.key}`"
                  :name="`report-filter-${filter.key}`"
                  :data-filter-key="filter.key"
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

          <div v-else class="btech-muted" style="font-size:12px;">
            No filters for this view.
          </div>
        </div>
      </aside>

      <div style="flex:1 1 960px; min-width:0; height:100%; min-height:0; display:flex; flex-direction:column; overflow:hidden;">
        <div style="max-width:1400px; width:100%; margin:0 auto 16px; display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; flex:0 0 auto;">
          <h3 class="btech-card-title" style="margin:0; font-size:24px;">
            {{ currentSubMenuMeta.label || currentReportMeta.title || 'Reporting V3' }}
          </h3>
          <div class="btech-muted" style="font-size:14px; font-weight:600;">
            {{ currentViewMeta.label || 'View' }}
          </div>
        </div>

        <div style="flex:1 1 auto; min-height:0; min-width:0; overflow:auto;">
          <div style="display:block; min-width:100%; padding-bottom:12px;">
            <div style="display:inline-block; min-width:100%;">
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
  </div>
</template>
