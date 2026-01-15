<template>
<div id="automations-report-root" class="btech-card btech-theme" style="padding:12px;">
    <!-- put your existing report markup here -->
    <h3 class="btech-card-title" style="margin:0 0 10px 0;">Automations</h3>

    <!-- example slot: your table etc -->
    <div v-if="loading" class="btech-muted">Loading…</div>
    <div v-else>
        <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
            <!-- Header / Actions -->
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
                <button
                class="Button"
                @click="viewMode = 'table'"
                :style="viewMode === 'table' ? 'box-shadow: inset 0 0 0 2px #111; font-weight:600;' : ''"
                title="Table view"
                >
                Table
                </button>

                <button
                class="Button"
                @click="viewMode = 'graph'"
                :style="viewMode === 'graph' ? 'box-shadow: inset 0 0 0 2px #111; font-weight:600;' : ''"
                title="Graph view"
                >
                Graph
                </button>

                <button
                class="Button"
                @click="viewMode = 'flagged'"
                :style="viewMode === 'flagged' ? 'box-shadow: inset 0 0 0 2px #111; font-weight:600;' : ''"
                title="Flagged view"
                >
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
                <!-- refresh icon -->
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

            <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
                Loading automations…
            </div>

            <div v-else>
                <div v-show="viewMode === 'table'">
                    <div
                    style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none;"
                    :style="{ 'grid-template-columns': getColumnsWidthsString() }"
                    >
                        <div
                            v-for="col in table.getVisibleColumns()"
                            :key="col.name"
                            :title="col.description"
                            style="display:inline-block; cursor:pointer;"
                            @click="setSortColumn(col.name)"
                        >
                            <span><b>{{ col.name }}</b></span>
                            <span style="margin-left:.25rem;">
                            <svg style="width:.75rem;height:.75rem;" viewBox="0 0 490 490" aria-hidden="true">
                                <g>
                                <polygon :style="{ fill: col.sort_state < 0 ? '#000' : '#E0E0E0' }"
                                    points="85.877,154.014 85.877,428.309 131.706,428.309 131.706,154.014 180.497,221.213 217.584,194.27 108.792,44.46 0,194.27 37.087,221.213"/>
                                <polygon :style="{ fill: col.sort_state > 0 ? '#000' : '#E0E0E0' }"
                                    points="404.13,335.988 404.13,61.691 358.301,61.691 358.301,335.99 309.503,268.787 272.416,295.73 381.216,445.54 490,295.715 452.913,268.802"/>
                                </g>
                            </svg>
                            </span>
                        </div>
                    </div>

                    <!-- Rows -->
                    <div
                    v-for="(row, i) in visibleRows"
                    :key="row.automation_id || i"
                    style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.35rem;"
                    :style="{
                        'grid-template-columns': getColumnsWidthsString(),
                        'background-color': (i % 2) ? 'white' : '#F8F8F8'
                    }"
                    >
                        <div
                            v-for="col in table.getVisibleColumns()"
                            :key="col.name"
                            style="display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;"
                            :title="col.getTooltip(row)"
                        >
                            <span
                            :class="col.style_formula ? 'btech-pill-text' : ''"
                            :style="col.get_style(row)"
                            v-html="col.getContent(row)"
                            ></span>
                        </div>
                    </div>
                </div>
                <div v-show="viewMode === 'graph'">
                    <!-- graph view -->
                    <div v-for="row in visibleRows" :key="row.automation_id"
                        style="display:flex; gap:10px; align-items:center; padding:6px 8px; border-bottom:1px solid #eee;">
                        
                        <div style="width:5rem;">
                        <span class="btech-pill-text" :style="statusStyle(row?._metrics?.status)">
                            {{ row?._metrics?.status }}
                        </span>
                        </div>

                        <div style="width:3rem; font-family:monospace;">
                        {{ row.automation_id }}
                        </div>

                        <div style="width:18rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        {{ row.name }}
                        </div>

                        <div style="flex:1; min-width:260px;">
                        <div :ref="'chart_' + row.automation_id"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>