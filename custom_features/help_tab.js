(function () {
  if ($("#btech-help").length === 0) {
    $.getScript("https://cdn.jsdelivr.net/npm/vue").done(function() {
      let vueString = `
        <div id="btech-help">
          <div 
            @mouseover="buttonX = 100;"
            @mouseleave="buttonX = 10;"
            @click="showHelp = !showHelp; console.log(showHelp);"
            style='
              width: 110px; 
              margin-right: -140px; 
              position:fixed; 
              bottom: 20px; 
              z-index:1000; 
              transition: 0.5s; 
              background-color: #A00012;
              border: 2px solid #D61310;
              padding: 10px 20px;
              color: #FFF;
              border-radius: 5px; 
              cursor: pointer;
              user-select: none;
            ' 
            :style="{'right': buttonX + 'px'}"
          >
          Need Help?
          </div>
          <div v-if="showHelp">
            <div
              @click.self="showHelp = false;"
              style='
                position: fixed;
                z-index: 100000;
                padding-top: 10px;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: #000;
                background-color: rgb(0, 0, 0, 0.4);
              ' 
            >
            <div
              id="btech-help-modal"
              style='
                position: absolute;
                background-color: rgb(255,255,255);
                color: #000;
                width: 80%;
                height: 80%;
                top: 10%;
                left: 10%;
                z-index: 100001;
                border-radius: 5px;
                box-shadow: 0px 0px 8px 1px #333;
                padding: 10px;
                overflow-y: scroll;
              '
            >
              <div v-for="(topic, key) in topics">
                <help-topic :topic='topic' :name='key'>
                </help-topic>
              </div>
            </div>
            </div>
          </div>
        </div>
      `;
      $('body').append(vueString);
      class Resource {
        constructor(name, target, topic) {
          this.name = name;
          this.target = target;
          this.topic = topic;
          this.url = '';
          this.kalturaId = '';
          this.questions = [];
        }
        addQuestion(question) {
          this.questions.push(question);
        }
      }
      //IMPORTED_FEATURE._init();
      new Vue({
        el: "#btech-help",
        mounted: async function() {
          this.resources = [];
          let r;

          r = new Resource('Manage All Courses', 'teacher', 'Canvas Guides')
          r.url = "https://community.canvaslms.com/docs/DOC-12972-4152719649";
          this.resources.push(r);

          r = new Resource('Advising/Employment Skills Course', 'teacher', 'Bridgerland Resources');
          r.kalturaId = '0_8d0bimgd';
          this.resources.push(r);

          r = new Resource('Student Grades Report', 'teacher', 'Bridgerland Resources');
          r.kalturaId = '0_9y9jibta';
          this.resources.push(r);

          r = new Resource('Using Kaltura to Record Lectures', 'teacher', 'Kaltura');
          r.kalturaId = '0_1q1tshtb';
          this.resources.push(r);

          r = new Resource('Using Kaltura to Submit Assignments', 'teacher', 'Kaltura');
          r.kalturaId = '0_cc5l77wt';
          this.resources.push(r);

          r = new Resource('Password Problems', 'student', 'Canvas Guides');
          r.url = "https://btech.instructure.com/courses/480103/pages/what-if-my-password-doesnt-work?module_item_id=6046368";
          this.resources.push(r);

          for (let r = 0; r < this.resources.length; r++) {
            let resource = this.resources[r];
            if (this.topics[resource.topic] === undefined) {
              this.topics[resource.topic] = [];
            }
            this.topics[resource.topic].push(resource);
          }
        },
        computed: {
        },
        data: function() {
          return {
            buttonX: 10,
            showHelp: false,
            topics: {},
            resources: {
              manage_all_courses: {
                pages: [/^\/$/],
                type: 'canvas',
                questions: [
                  "Where can I manage the courses on my dashboard?",
                  "Where can I see a list of all of my courses?"
                ],
                link: '',
                target: 'teacher',
                topic: ['']
              },
              student_report: {
                pages: [/\/courses\/[0-9]+\/gradebook/, /\/users\/[0-9]+/],
                type: 'video',
                questions: [],
                iframe: '<iframe id="kaltura_player_1569950174" src="https://cdnapisec.kaltura.com/p/1699651/sp/169965100/embedIframeJs/uiconf_id/22825111/partner_id/1699651?iframeembed=true&playerId=kaltura_player_1569950174&entry_id=0_9y9jibta" width="400" height="333" allowfullscreen webkitallowfullscreen mozAllowFullScreen allow="autoplay *; fullscreen *; encrypted-media *" frameborder="0"></iframe>',
                target: 'teacher'
              },
              using_kaltura_to_record_lectures: {
                pages: [/\/courses/],
                type: 'video',
                iframe: '<iframe id="kaltura_player_1584725813" src="https://cdnapisec.kaltura.com/p/1699651/sp/169965100/embedIframeJs/uiconf_id/22825111/partner_id/1699651?iframeembed=true&playerId=kaltura_player_1584725813&entry_id=0_1q1tshtb" width="400" height="333" allowfullscreen webkitallowfullscreen mozAllowFullScreen allow="autoplay *; fullscreen *; encrypted-media *" frameborder="0"></iframe>',
                target: 'teacher'
              },
              using_kaltura_to_submit: {
                pages: [/\/courses/],
                type: 'video',
                iframe: '<iframe id="kaltura_player_1584725889" src="https://cdnapisec.kaltura.com/p/1699651/sp/169965100/embedIframeJs/uiconf_id/22825111/partner_id/1699651?iframeembed=true&playerId=kaltura_player_1584725889&entry_id=0_cc5l77wt" width="400" height="333" allowfullscreen webkitallowfullscreen mozAllowFullScreen allow="autoplay *; fullscreen *; encrypted-media *" frameborder="0"></iframe>',
                target: 'teacher'
              },
              advising_and_employment_skills_course: {
                pages: [/\/$/],
                type: 'video',
                iframe: '<iframe id="kaltura_player_1584726390" src="https://cdnapisec.kaltura.com/p/1699651/sp/169965100/embedIframeJs/uiconf_id/22825111/partner_id/1699651?iframeembed=true&playerId=kaltura_player_1584726390&entry_id=0_8d0bimgd" width="400" height="333" allowfullscreen webkitallowfullscreen mozAllowFullScreen allow="autoplay *; fullscreen *; encrypted-media *" frameborder="0"></iframe>',
                target: 'teacher'
              },
              getting_help: {
                pages: [/\/.*/],
                type: 'canvas',
                questions: [
                  "Don't see your question here? Learn about the Canvas help docs."
                ],
                link: 'https://btech.instructure.com/courses/480103/pages/how-can-i-get-help',
                target: 'student'
              },
              password: {
                pages: [/\/login\/canvas/],
                type: 'canvas',
                questions: [],
                link: 'https://btech.instructure.com/courses/480103/pages/what-if-my-password-doesnt-work?module_item_id=6046368',
                target: ''
              },
            },
          }
        }
      });
      Vue.component('help-topic', {
        template: `
          <div>
            <h2 @click="show = !show" style="
              background-color: #A00012;
              border-radius: 4px;
              color: #FFF;
              cursor: pointer;
              user-select: none;
            ">
              <i v-if="show" class='icon-mini-arrow-down'></i>
              <i v-else class='icon-mini-arrow-right'></i>
              {{name}}
            </h2>
            <div v-show="show" style="padding: 10px;">
              <div v-for="(resource, index) in topic" style="border-bottom: 2px dotted #000">
                <p>
                  <div v-if="resource.url !== ''">
                    <a target="_blank" :href="resource.url">{{resource.name}}</a>
                  </div>
                  <div v-else>
                    {{resource.name}}
                  </div>
                </p>
                <div style="text-align: center;">
                  <iframe v-if="resource.kalturaId !== ''" :src="'https://cdnapisec.kaltura.com/p/1699651/sp/169965100/embedIframeJs/uiconf_id/22825111/partner_id/1699651?iframeembed=true&entry_id='+resource.kalturaId" width="400" height="333" allowfullscreen webkitallowfullscreen mozAllowFullScreen allow="autoplay *; fullscreen *; encrypted-media *" frameborder="0"></iframe>
                </div>
              </div>
            </div>
          </div>
        `,
        data: function() {
          return {
            show: false
          }
        },
        props: [
          'topic',
          'name'
        ]
      });
    });
  }
})();
