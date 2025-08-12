<template>
    <div class='btech-modal btech-canvas-report' style='display: inline-block;'>
        <div class='btech-modal-content'>
            <div class='btech-modal-content-inner'>
                <span class='btech-close' v-on:click='close()'>&times;</span>
                <h3 style='text-align: center;'>Instructor Report</h3>
                <div
                    style="display: inline-block;"
                >
                    <label>Course Source</label>
                    <select 
                        v-model="settings.account" 
                        @change="
                        saveSettings(settings); 
                        loadCourses();
                        "
                    >
                        <option v-for="account in accounts" :value="account.id">{{ (settings.anonymous && account.id != 0) ? ('ACCOUNT ' + account.id) : account.name }}</option>
                    </select>
                    <label>Year</label>
                    <select 
                        v-model="settings.filters.year" 
                        @change="
                        saveSettings(settings);
                        loadCourses();
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
                    <div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>