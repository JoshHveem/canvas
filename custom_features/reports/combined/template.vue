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
              : 'background:#fff; color:#111827;'"
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
            display:flex; gap:6px; justify-content:center; align-items:center;
            padding:4px 6px; border-radius:8px; background:#f9fafb; margin-bottom:12px;
          "
        >
          <button
            v-for="sm in currentSubMenus"
            :key="sm.value"
            role="tab"
            :aria-selected="currentSubKey === sm.value ? 'true' : 'false'"
            :tabindex="currentSubKey === sm.value ? 0 : -1"
            @click="setSubMenu(sm.value)"
            style="
              border:1px solid #e5e7eb;
              border-radius:999px;
              padding:4px 10px;
              font-size:11px;
              background:white;
              cursor:pointer;
              transition: box-shadow .15s ease, background .15s ease;
            "
            :style="currentSubKey === sm.value
              ? 'background:#2563eb; color:#fff; border-color:#2563eb; box-shadow:0 1px 3px rgba(0,0,0,.12);'
              : 'background:#fff; color:#111827;'"
          >
            {{ sm.label }}
          </button>
        </div>


        <!-- Filters Row -->
        <div
          class="btech-row"
          style="align-items:flex-end; gap:12px; justify-content:center; margin-bottom:12px; flex-wrap:wrap;"
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
        </div>

        <!-- Dynamic report body -->
        <keep-alive>
          <component :is="currentReportMeta.component" v-bind="currentReportProps" />
        </keep-alive>
      </div>
    </div>
  </div>
</template>
