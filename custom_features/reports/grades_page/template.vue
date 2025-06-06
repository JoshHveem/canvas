<template>
  <div class='btech-modal btech-canvas-report' style='display: inline-block;'>
    <!-- ERASE THE DISPLAY PIECE BEFORE GOING LIVE -->
    <div class='btech-modal-content'>
      <div class='btech-modal-content-inner'>
        <span class='btech-close' v-on:click='close()'>&times;</span>
        <h3 style='text-align: center;'>Report</h3>
        <div
          style="display: inline-block;"
        >
          <label>Progress Estimation Method</label>
          <select v-model="progress_method">
            <option value="points_weighted">Points - Weighted (Preferred)</option>
            <option value="points_raw">Points - Raw</option>
            <option value="submissions">Submissions</option>
          </select>
        </div>
        <div
          style="display: inline-block;"
        >
          <label>Filter by Section</label>
          <select v-model="section_filter">
            <option v-for="section_name in section_names" :value="section_name">{{section_name}}</option>
          </select>
        </div>
        <div>
          <div
            style="
              padding: .25rem .5rem;
              display: grid;
              grid-template-columns: auto 10rem 4.5rem 4.5rem 10rem 4rem 4rem 4rem;
              align-items: center;
              font-size: 0.75rem;
              cursor: help;
              user-select: none;
            "
          >
            <div 
              v-for='column in visibleColumns' 
              style="display: inline-block; grid-template-columns: auto 1rem;"
              :key='column.name' 
              :title='column.description'
              @click="sortColumn(column.name)"
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
                    :style"{
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
          <div
            v-for='student, i in enrollments' 
            :key='student.user_id'
          >
            {{ student }}
            <div 
              v-if="section_filter == 'All' || section_filter == student.section"
              style="
                padding: .25rem .5rem;
                display: grid;
                grid-template-columns: auto 10rem 4.5rem 4.5rem 10rem 4rem 4rem 4rem;
                align-items: center;
                font-size: 0.75rem;
              "
              :style="{
                'background-color': (i % 2) ? 'white' : '#F8F8F8'
              }"
            >
              <!--Name-->
              <div 
                style="display: inline-block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;"
              >
                <a :href="`/courses/${student.course_id}/users/${student.user_id}`" target="_blank">{{student.name}} </a>
                (<a :href="`/courses/${student.course_id}/grades/${student.user_id}`" target="_blank">grades</a>)
              </div>
              <div 
                style="display: inline-block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;"
              >
                {{student.section}}
              </div>
              <div 
                style="display: inline-block;"
              >
                <span 
                  class="btech-pill-text" 
                  :style="{
                    'background-color': (student.to_date < 60) ? colors.red : (student.to_date < 80 ? colors.yellow : colors.green),
                    'color': colors.white,
                  }">
                  {{student.to_date}}%
                </span>
              </div>
              <div 
                style="display: inline-block;"
              >
                <span 
                  class="btech-pill-text" 
                  :style="{
                    'background-color': (student.final < 60) ? colors.red : (student.final < 80 ? colors.yellow : colors.green),
                    'color': colors.white,
                  }">
                  {{student.final}}%
                </span>
              </div>
              <div 
                style="display: inline-block"
              >
                <course-progress-bar-ind
                  :progress="student[columnNameToCode(progress_method)]"
                  :barwidth="9"
                  :colors="colors"
                ></course-progress-bar-ind>
              </div>
              <div 
                style="display: inline-block;"
              >
                <span 
                  v-if="student.last_submit !== undefined"
                  class="btech-pill-text" 
                  :style="{
                    'background-color': (student.last_submit >= 10) ? colors.red : (student.last_submit >= 7 ? colors.yellow : colors.green),
                    'color': colors.white,
                  }">
                  {{student.last_submit}}
                </span>
              </div>
              <div 
                style="display: inline-block;"
              >
                {{student.in_course}}
              </div>
              <div 
                style="display: inline-block;"
              >
                <span 
                  class="btech-pill-text" 
                  v-if="student.days_remaining"
                  :style="{
                    'background-color': (student.days_remaining < 3) ? colors.red : (student.days_remaining < 7 ? colors.yellow : colors.green),
                    'color': colors.white,
                  }"
                >{{student.days_remaining}}</span>
                <span 
                  v-else
                >n/a</span>
              </div>
            </div>
          </div>
        </div>
      </div>
        {{ enrollments }}
    </div>
  </div>
</template>