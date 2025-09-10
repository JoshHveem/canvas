<template>
  <div class="btech-modal btech-canvas-report" style="display:inline-block;">
    <div class="btech-modal-content">
      <div class="btech-modal-content-inner">
        <span class="btech-close" v-on:click="close()">&times;</span>

        <!-- Header / Controls -->
        <div class="btech-row" style="align-items:center; gap:12px; margin-bottom:10px;">
          <h3 class="btech-card-title" style="margin:0; flex:1; text-align:center;">
            {{ currentReportMeta.title }}
          </h3>

          <!-- Report Type -->
          <div style="display:inline-block;">
            <label class="btech-muted" style="display:block; font-size:12px;">Report</label>
            <select
              v-model="settings.reportType"
              aria-label="Select report type"
              @change="onReportChange"
            >
              <option
                v-for="rt in reportTypes"
                :key="rt.value"
                :value="rt.value"
              >
                {{ rt.label }}
              </option>
            </select>
          </div>

          <!-- Account -->
          <div style="display:inline-block;">
            <label class="btech-muted" style="display:block; font-size:12px;">Account</label>
            <select
              v-model="settings.account"
              aria-label="Select account"
              @change="saveSettings(settings)"
            >
              <option
                v-for="acc in accounts"
                :key="acc.id"
                :value="acc.id"
              >
                {{ acc.name }}
              </option>
            </select>
          </div>


          <!-- Year -->
          <div style="display:inline-block;">
            <label class="btech-muted" style="display:block; font-size:12px;">Year</label>
            <select
              v-model="settings.filters.year"
              aria-label="Select year"
              @change="saveSettings(settings)"
            >
              <option
                v-for="year in Array.from({ length: 5}, (_, i) => new Date().getFullYear() - i)"
                :key="year"
                :value="year"
              >
                {{ year }}
              </option>
            </select>
          </div>
        </div>

        <!-- Dynamic report body -->
        <keep-alive>
          <component
            :is="currentReportMeta.component"
            v-bind="currentReportProps"
          />
        </keep-alive>
      </div>
    </div>
  </div>
</template>
