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
                        @change="
                        saveSettings(settings); 
                        loadCourses();
                        "
                    >
                        <option v-for="account in accounts" :value="account.id">{{ account.name }}</option>
                    </select>
                </div>
                <div>
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
                <div>
                    <div
                        style="
                        padding: .25rem .5rem;
                        display: grid;
                        align-items: center;
                        font-size: 0.75rem;
                        cursor: help;
                        user-select: none;
                        "
                        :style="{
                        'grid-template-columns': getColumnsWidthsString()
                        }"
                    >
                        <div 
                        v-for='column in visibleColumns' 
                        style="display: inline-block; grid-template-columns: auto 1rem;"
                        :key='column.name' 
                        :title='column.description'
                        @click="settings.sort_column = column.name; saveSettings(settings);"
                        >
                        <span><b>{{column.name}}</b></span>
                        <span>
                            <svg 
                            style="width: .75rem; height: .75rem;" 
                            x="0px" 
                            y="0px"
                            viewBox="0 0 490 490" 
                            style="enable-background:new 0 0 490 490;" 
                            xml:space="preserve">
                            <g>
                            <polygon 
                                :style="{
                                'fill': column.sort_state < 0 ? '#000000' : '#E0E0E0'
                                }"
                                points="85.877,154.014 85.877,428.309 131.706,428.309 131.706,154.014 180.497,221.213 217.584,194.27 108.792,44.46 
                                0,194.27 37.087,221.213 	"/>
                            <polygon 
                                :style="{
                                'fill': column.sort_state > 0 ? '#000000' : '#E0E0E0'
                                }"
                                points="404.13,335.988 404.13,61.691 358.301,61.691 358.301,335.99 309.503,268.787 272.416,295.73 381.216,445.54 
                                490,295.715 452.913,268.802 	"/>
                            </g>
                            </svg>
                        </span>
                        </div>
                    </div>
                    <div v-if="loading" style="text-align: center;">Loading Data...</div>
                    <div
                        v-for='(course, i) in visibleRows' 
                    >
                        <div 
                        style="
                            padding: .25rem .5rem;
                            display: grid;
                            align-items: center;
                            font-size: 0.75rem;
                            line-height: 1.5rem;
                        "
                        :style="{
                        'grid-template-columns': getColumnsWidthsString(),
                            'background-color': (i % 2) ? 'white' : '#F8F8F8'
                        }"
                        >
                        <!--Name-->
                        <div
                            v-for='column in visibleColumns' 
                            :key='column.name' 
                            style="display: inline-block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;"
                        >
                            <span v-if="column.course_name == 'Name'"><a :href="`/courses/${course.course_id}`" target="_blank">{{course.course_name}} </a></span>
                            <span
                                v-else
                                :class="column.style_formula ? 'btech-pill-text' : ''" 
                                :style="column.get_style(course)"
                            >
                            {{ column.getContent(course) }}
                            </span>
                        </div>
                        
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>