<template>
  <div class='btech-modal btech-canvas-report' style='display: inline-block;'>
    <!-- ERASE THE DISPLAY PIECE BEFORE GOING LIVE -->
    <div class='btech-modal-content'>
      <div class='btech-modal-content-inner'>
        <span class='btech-close' v-on:click='close()'>&times;</span>
        <h3 style='text-align: center;'>Progress Report</h3>
        <div
          style="display: inline-block;"
          v-if="!courseId"
        >
          <label>Course Source</label>
          <select 
            v-model="settings.account" 
            @change="saveSettings(settings); 
            loadCourseEnrollments();"
            >
            <option v-for="account in accounts" :value="account.id">{{ (settings.anonymous && account.id != 0) ? ('ACCOUNT ' + account.id) : account.name }}</option>
          </select>
        </div>
        <div
          style="display: inline-block;"
        >
          <label>Filter by Section</label>
          <select v-model="settings.filters.section" @change="saveSettings(settings)">
            <option v-for="section_name in section_names" :value="section_name">{{section_name}}</option>
          </select>
        </div>
        <div
          style="display: inline-block;"
        >
          <span>
            <label>Hide Missing End Date</label>
            <input type="checkbox" v-model="settings.filters.hide_missing_end_date" @change="saveSettings(settings)">
          </span>
          <span>
            <label>Hide Past End Date</label>
            <input type="checkbox" v-model="settings.filters.hide_past_end_date" @change="saveSettings(settings)">
          </span>
          <span>
              <label>anonymous</label>
              <input type="checkbox" v-model="settings.anonymous" @change="saveSettings(settings)">
          </span>
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
              style="display:flex; align-items:center; gap:0.35rem; min-width:0;"
              :key='column.name' 
              :title='column.description'
              @click="sortColumn(column.name)"
            >
              <span style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                <b>{{column.name}}</b>
              </span>
              <span
                aria-hidden="true"
                style="
                  display:inline-flex;
                  flex-direction:column;
                  align-items:center;
                  justify-content:center;
                  line-height:0.7;
                  font-size:0.65rem;
                  color:#9ca3af;
                  flex:0 0 auto;
                "
              >
                <span :style="{ color: column.sort_state < 0 ? '#111827' : '#d1d5db' }">▲</span>
                <span :style="{ color: column.sort_state > 0 ? '#111827' : '#d1d5db' }">▼</span>
              </span>
            </div>
          </div>
          <div v-if="loading" style="text-align: center;">Loading Data...</div>
          <div
            v-for='(student, i) in visibleRows' 
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
                <course-progress-bar-ind
                  v-if="column.name == 'Progress'"
                  :progress="calcProgress(student)"
                  :barwidth="9"
                  :colors="colors"
                ></course-progress-bar-ind>
                <span v-else-if="column.name == 'User Name'"><a :href="`/courses/${student.course_id}/users/${student.user_id}`" target="_blank">{{settings.anonymous ? 'STUDENT ' + student.user_id : student.user_name}} </a>
                (<a :href="`/courses/${student.course_id}/grades/${student.user_id}`" target="_blank">grades</a>)</span>
                <span
                  v-else
                  :class="column.style_formula ? 'btech-pill-text' : ''" 
                  :style="column.get_style(student)"
                >
                  {{ column.getContent(student) }}
                </span>
              </div>
             
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
