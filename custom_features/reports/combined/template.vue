<template>
  <div class="btech-modal btech-canvas-report" style="display:inline-block;">
    <div class="btech-modal-content" style="overflow:visible;">
      <div class="btech-modal-content-inner" style="overflow:visible;">
        <span class="btech-close" v-on:click="close()">&times;</span>

        <div class="btech-row" style="align-items:center; margin-bottom:6px;">
          <h3 class="btech-card-title" style="margin:0; width:100%; text-align:center;">
            {{ currentReportMeta.title }}
          </h3>
        </div>

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
              background:white;
              cursor:pointer;
              transition:box-shadow .15s ease, background .15s ease;
            "
            :style="settings.reportType === rt.value
              ? 'background:#111827; color:#fff; border-color:#111827; box-shadow:0 1px 4px rgba(0,0,0,.15);'
              : 'background:#fff; color:#111827; border-color:#C1C8D7;'"
          >
            {{ rt.label }}
          </button>
        </div>

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
            width:100%;
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

        <keep-alive>
          <component
            :is="currentReportMeta.component"
            @drill-report="drillToReport"
            v-bind="currentReportProps"
          />
        </keep-alive>
      </div>
    </div>
  </div>
</template>
