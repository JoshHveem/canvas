<template>
    <div class='btech-modal btech-canvas-report' style='display: inline-block;'>
        <div class='btech-modal-content'>
            <div class='btech-modal-content-inner'>
                <span class='btech-close' v-on:click='close()'>&times;</span>
                <h3 style='text-align: center;'>Instructor Report</h3>
                <div
                    style="display: inline-block;"
                >
                    <label>Year</label>
                    <select 
                        v-model="settings.filters.year" 
                        @change="
                        saveSettings(settings);
                        "
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
                <div
                style="display: inline-block;"
                >
                </div>
                <div>
                    <instructor-metrics-grading v-if="grading" :support-hours="support_hours" :grading="grading" :year="settings.filters.year"></instructor-metrics-grading>
                    <instructor-metrics-interactions v-if="interactions" :interactions="interactions" :year="settings.filters.year"></instructor-metrics-interactions>
                    <instructor-metrics-surveys v-if="surveys" :surveys="surveys" :year="settings.filters.year"></instructor-metrics-surveys>
                </div>
            </div>
        </div>
    </div>
</template>