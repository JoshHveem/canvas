(async function() {
  // Get the full URL of the current page
  const fullUrl = window.location.href;
  const url = new URL(fullUrl);
  // Define the regex pattern to match 'accounts/<account_id>'
  const regex = /accounts\/(\d+)/;
  // Execute the regex on the URL
  const match = fullUrl.match(regex);
  // Extract the account_id if the regex matched
  const accountId = match ? match[1] : null;
  // Extract the enrollment_term_id from the search parameters
  if (accountId != 3) {
    let createCourseButton = $($("#content").find("[aria-label='Create new course']")[0]).parent();
    let sectionAdderSpan = $('<span></span>');
    let sectionAdderButton = $(createCourseButton.html().replace('Course', 'HS Sections').replace('Create new course', 'Add HS sections'));
    sectionAdderSpan.append(sectionAdderButton);
    createCourseButton.after(sectionAdderSpan);

    const BTECH_HS_LIST = [
    ]
    function createModal() {
      let modal = $(`
        <div class='btech-modal' style='display: inline-block;'>
            <!-- ERASE THE DISPLAY PIECE BEFORE GOING LIVE -->
            <div class='btech-modal-content' style='max-width: 500px;'>
                <div class='btech-modal-content-inner'>
                </div>
            </div>
        </div>
      `);
      // let modalContent = $('body .btech-modal-content-inner');
      $("body").append(modal);
      return modal;
    }

    sectionAdderButton.click(async function() {
      const enrollmentTermId = url.searchParams.get('enrollment_term_id'); // "1110"
      if (enrollmentTermId == undefined) return;
      let modal = createModal();
      let content = $(modal.find('.btech-modal-content-inner')[0]);
      content.append(`
        <div id="btech-hs-sections-adder-vue">
          <div
            v-if="step == 'courses'"
          >
            <div>Select Course to which you want to add Sections</div>
            <div>
              <div 
                v-for="(course, c) in courses" :key="c"
                >
                <div
                  :style="{
                    'background-color': c % 2 == 0 ? 'white' : '#EEE'
                  }"
                >
                  <input 
                    style="margin-right: 0.5rem;"
                    type="checkbox" 
                    v-model="course.include"
                    @click="handleCheck($event, c, courses)"
                    >
                  <span style="display: inline-block; width: 6rem;">{{ course.course_code }}</span>
                  <span><a :href="'/courses/' + course.id + '/settings#tab-sections'" target="_blank">{{ course.name }}</a></span>
                </div>
              </div>
            </div>
            <div><button @click="step = 'sections'">Select Sections</button></div>
          </div>
          <div
            v-if="step == 'sections'"
          >
            <div>
              Select High Schools to add as sections.
            </div>
            <div>
              <div 
                v-for="(section, s) in sections" :key="s"
                >
                <div
                  :style="{
                    'background-color': s % 2 == 0 ? 'white' : '#EEE'
                  }"
                >
                  <input 
                    style="margin-right: 0.5rem;"
                    type="checkbox" 
                    v-model="section.include"
                    @click="handleCheck($event, s, sections)"
                    >
                  <span>{{ section.name }}</span>
                </div>
              </div>
            </div>
            <div>
              <button @click="step = 'courses'">Back</button>
              <button @click="step = 'confirm'">Add Sections</button>
            </div>
          </div>
          <div
            v-if="step == 'confirm'"
          >
            <div>Do you wish to add {{courses.filter(course => course.include).length}} section(s) to {{sections.filter(section => section.include).length}} course(s)?</div>
            <div>
              <button @click="step = 'sections'">Back</button>
              <button @click="step = 'process'; process();">Confirm</button>
            </div>
          </div>
          <div
            v-if="step == 'process'"
          >
            <div>Progress: {{ Math.round(processProgress * 100)}}%</div>
            <div>Adding Section {{processSection}} to Course {{processCourse}}</div>
          </div>
        </div>
      `);

      let app = new Vue({
        el: '#btech-hs-sections-adder-vue',
        mounted: async function () {
          let courses = await canvasGet(`/api/v1/accounts/${accountId}/courses?enrollment_term_id=${enrollmentTermId}`);
          courses.forEach(course => course.include = false);
          this.courses = courses
          .filter(course => {
            return course.sis_course_id != undefined;
          })
          .sort((a, b) => a.course_code.localeCompare(b.course_code));
          this.hs_list.forEach(hs => {
            this.sections.push({
              name: hs,
              include: false
            })
          })

        },
        data: function () {
          return {
            lastChecked: null,
            step: 'courses',
            courses: [],
            sections: [],
            hs_list: [
              "Bear River HS AM",
              "Box Elder HS AM",
              "Green Canyon HS AM",
              "Logan HS AM",
              "Mt Crest HS AM",
              "Rich HS AM",
              "Ridgeline HS AM",
              "Sky View HS AM",
              "Teacher Training",
              "InTech HS AM"
            ],
            processProgress: 0,
            processCourse: '',
            processSection: '',
          };
        },
        methods: {
          async process() {
            let courses = this.courses.filter(course => course.include)
              .sort((a, b) => a.course_code.localeCompare(b.course_code));
            let sections = this.sections.filter(section => section.include)
              .sort((a, b) => a.name.localeCompare(b.name));
            for (let c in courses) {
              let course = courses[c];
              this.processCourse = course.name;
              let existingSections = await canvasGet(`/api/v1/courses/${course.id}/sections`);
              for (let s in sections) {
                let section = sections[s];
                this.processSection = section.name;
                let exists = false;
                for (let es in existingSections) {
                  let existingSection = existingSections[es];
                  if (section.name == existingSection.name) exists = true;
                }
                if (exists) continue;
                let newSec = await $.post(`/api/v1/courses/${course.id}/sections`, {
                  course_section: {
                    name: section.name
                  }
                });
              }
              this.processProgress = (parseInt(c) + 1) / courses.length;
            }
          },
          handleCheck(event, index, list) {
            // Check if the Shift key is held
            this.$nextTick(() => {
              if (event.shiftKey && this.lastChecked !== null) {
                // Wait for the DOM to update
                  let start = Math.min(this.lastChecked, index);
                  let end = Math.max(this.lastChecked, index);

                  // Get the value from the last checked checkbox
                  let include = list[this.lastChecked].include;

                  // Apply the value to all checkboxes between lastChecked and the current one
                  for (let i = start; i <= end; i++) {
                    list[i].include = include;
                  }
              }
              this.lastChecked = index;
            });
          }
        }
      });
      modal.on("click", function(event) {
        if ($(event.target).is(modal)) {
          app.$destroy();
          modal.remove();
        }
      });
    })

  }
})();