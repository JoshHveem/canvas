<template>
    <div class='btech-modal btech-canvas-report' style='display: inline-block;'>
        <div class='btech-modal-content'>
            <div class='btech-modal-content-inner'>
                <span class='btech-close' v-on:click='close()'>&times;</span>
                <h3 style='text-align: center;'>Report</h3>
                <div
                    style="display: inline-block;"
                >
                    <label>Course Source</label>
                    <select 
                        v-model="settings.account" 
                        @change="saveSettings(settings); 
                        loadCourses();"
                        >
                        <option v-for="account in accounts" :value="account.id">{{ account.name }}</option>
                    </select>
                </div>
                <div>

                </div>
            </div>
        </div>
    </div>
</template>