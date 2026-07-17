<template>
  <div class='btech-modal' style='display: inline-block;'>
    <!-- ERASE THE DISPLAY PIECE BEFORE GOING LIVE -->
    <div class='btech-modal-content'>
      <div class='btech-modal-content-inner'>
        <span class='btech-close' v-on:click='close()'>&times;</span>
        <h3 style='text-align: center;'>Report</h3>
        <h5 style='text-align: center;'>Click on column headers to sort by that column.</h5>
        <h5 style='text-align: center;'>Hover over column headers for a description of the information displayed in that
          column.</h5>
        <div class='btech-report-columns-toggle'>
          <div class='btech-report-column-toggle' style='display: inline-block;' v-for='column in columns'
            :key='column.name'>
            <div v-if="column.hideable">
              <input type="checkbox" v-model="column.visible"><label>{{column.name}}</label>
            </div>
          </div>
        </div>
        <table class='btech-report-table' border='1'>
          <thead border='1'>
            <tr>
              <th v-for='column in visibleColumns' :key='column.name' :class='column.sortable_type'
                @click="sortColumn(column.name)">{{column.name}}</th>
            </tr>
          </thead>
          <tbody border='1'>
            <tr v-if="loading">
              <td :colspan='visibleColumns.length'>Loading Results...</td>
            </tr>
            <tr v-for='student in students' :key='student.user_id'>
              <td v-for='column in visibleColumns' :key='column.name'
                v-bind:style="{'background-color': getBackgroundColor(column.name, student[column.name.toLowerCase().replace(/ /g, '_')])}">
                <span v-html="getColumnText(column, student)"></span>
              </td>
            </tr>
          </tbody>
          <tfoot border='1'>

          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>