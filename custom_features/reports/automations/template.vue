<template>
  <div id="automations-report-root" class="btech-card btech-theme" style="padding:12px;">
    <h3 class="btech-card-title" style="margin:0 0 10px 0;">Automations</h3>

    <div v-if="loading" class="btech-muted">Loading…</div>

    <div v-else>
      <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
        <!-- Header / Actions -->
        <div class="btech-row" style="align-items:flex-start; gap:12px; margin-bottom:12px;">
          <div>
            <h4 class="btech-card-title" style="margin:0;">Automation Status</h4>
            <div class="btech-muted" style="font-size:12px; margin-top:2px;">
              Monitor runs, errors, and ownership at a glance
            </div>
          </div>

          <div style="flex:1;"></div>

          <!-- View buttons -->
          <div class="btech-row" style="gap:8px; align-items:center;">
            <button class="Button"
              @click="viewMode='table'"
              :style="viewMode==='table' ? 'box-shadow: inset 0 0 0 2px #111; font-weight:600;' : ''">
              Table
            </button>

            <button class="Button"
              @click="viewMode='graph'"
              :style="viewMode==='graph' ? 'box-shadow: inset 0 0 0 2px #111; font-weight:600;' : ''">
              Graph
            </button>

            <button class="Button"
              @click="viewMode='flagged'"
              :style="viewMode==='flagged' ? 'box-shadow: inset 0 0 0 2px #111; font-weight:600;' : ''">
              Flagged
            </button>
          </div>

          <!-- Refresh icon button -->
          <button
            class="Button"
            @click="load()"
            :disabled="loading"
            title="Refresh"
            style="margin-left:8px; width:34px; height:34px; padding:0; display:flex; align-items:center; justify-content:center;"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" style="width:18px; height:18px;">
              <path
                fill="currentColor"
                d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 12.65-4.65Z"
              />
            </svg>
          </button>
        </div>

        <div v-if="error" class="btech-muted" style="padding:8px; color:#b20b0f;">
          {{ error }}
        </div>

        <!-- Active view -->
        <component
          :is="activeViewComponent"
          :automations="automations"
          :runs="runs"
          :colors="colors"
          :filters="filters"
          :util="U"
        />
      </div>
    </div>
  </div>
</template>
