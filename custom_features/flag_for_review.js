CANVAS_FLAGS = {};
(async function () {
  return;
  let canvasbody = $("#application");
  /*
  lots of options for sorting / filtering flags
  to do list on the front page organized by department or course?


-short term
--default to previous
-long term
--replace button with drop down


https://jsfiddle.net/tng9r8j3/
Look into quill editor
<script src="https://cdn.quilljs.com/1.3.4/quill.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vue"></script>
<!-- Quill JS Vue -->
<script src="https://cdn.jsdelivr.net/npm/vue-quill-editor@3.0.4/dist/vue-quill-editor.js"></script>
<!-- Include stylesheet -->
<link href="https://cdn.quilljs.com/1.3.4/quill.core.css" rel="stylesheet">
<link href="https://cdn.quilljs.com/1.3.4/quill.snow.css" rel="stylesheet">
<link href="https://cdn.quilljs.com/1.3.4/quill.bubble.css" rel="stylesheet">
*/
  let vueString = `
<div>
  <!--THIS IS THE BUTTON FOR OPENING THE FLAGS INTERFACE-->
  <div 
    v-if='unresolvedCount > 0' 
    class="btech-flags-number-circle" 
    style='
      z-index: 1000001;
    '
    :style="{
      position: 'fixed',
      top: (Math.round((button.offset()).top +  - ($('#header').offset()).top + (button.height() * .75)) + 'px'),
      left: (Math.round((button.offset()).left + (button.width() * .75)) + 'px')
    }"
  >
    {{unresolvedCount}}
  </div>

  <!--THIS IS THE MENU TO REVIEW FLAGS-->
  <div
    v-if='showFlags' 
    id='btech-flags-container'
    style='
      overflow-y: scroll;
    '
    :style="{
      'margin-left': ($('#menu').width()) + 'px'
    }"
  >
    <div
      v-if='pageType=="item"'
      style='
        width: 100%;
        background-color: #49e;
        color: #fff;
        padding: 2px;
        text-align: center;
        cursor: pointer;
      '
      @click='openSubmit()'
    >
      <i class='fas fa-flag'></i>New
    </div>
    <div v-if=showFilters>
      <div v-for='setting in settings'>
        <input @change='updateSettings();' type='checkbox' v-model='setting.set'><label>{{setting.text}}</label>
      </div>
    </div>
    <div 
      v-for='flag in filteredFlags'
    >
      <div 
        class='btech-flags-item'
        v-if='checkDisplayFlag(flag) && (name(flag.createdBy) !== undefined && name(flag.createdBy) !== null)'>
        <div style='text-align: center;' v-if='loadedCourses[flag.courseId] !== undefined && loadedCourses[flag.courseId] !== null'><a :href='flag.item_url'>{{loadedCourses[flag.courseId]}}</a></div>
        <div>
          <strong>{{flag.flagType}}. </strong>
          <textarea
            :ref='"edit_comment_" + flag._id'
            v-show='flag.editing'
            @blur='saveFlagEdits(flag, "comment");'
            v-model='flag.comment'
          >
          </textarea>
          <span
            v-show='!flag.editing'
            @click='flag.editing = true; $nextTick(() => {$refs["edit_comment_" + flag._id][0].focus();});'
          >
            {{flag.comment}}
          </span>
        </div>
        <div style='text-align: right;'><i>-{{name(flag.createdBy)}}</i></div>
        <div style='text-align: right;'>
          <i class='far fa-share-square'></i>
          <select v-model='flag.assignedTo[0]' @change='saveFlagEdits(flag, "assignedTo")'>
            <option value='' selected disabled>-Assign To-</option>
            <option v-for='(name, id) in loadedNames' :value='id'>
              {{name}}
            </option>
          </select>
        </div>
        <div style='width: 100%;'>
          <i @click='deleteFlag(flag);' class='icon-trash'></i>
          <i v-if='flag.resolved' @click='resolveFlag(flag);' class='icon-publish icon-Solid' style='color: #0f0;'></i>
          <i v-else @click='resolveFlag(flag);' class='icon-publish' style='color: #f00;'></i>
        </div>
      </div>
    </div>
  </div>

  <!--THIS IS THE MODAL TO SUBMIT FLAGS-->
  <div 
    v-if='showSubmit' 
    class='btech-modal' 
    style='display: inline-block; z-index: 1000001;'
  >
    <div 
      class='btech-modal-content' 
      style='left: 25%; top: 10%; height: 80%; width: 50%; position: absolute; box-sizing: border-box;'
    >
      <div class="btech-tabs" >
        <ul>
          <li style='float: right;' v-on:click='close()'>X</li>
        </ul>
      </div>
      <div class='btech-modal-content-inner'
        style='height: 100%; position: relative;'
        @mousemove="onMouseMove($event)"
      >
        <h2 style='text-align: center;'>Flag Submission Form</h2>
        <select v-model='flagType'>
          <option value='' selected disabled>-Flag Topic-</option>
          <option v-for='option in flagOptions' :value='option'>{{option}}</option>
        </select>
        <select v-model='flagAssigned'>
          <option value='' selected disabled>-Assign To-</option>
          <option v-for='id in CDDIDS' :value='id'>{{name(id)}}</option>
        </select>
        <br>
        <div style='width: 100%; float: left; box-sizing: border-box;'>
          <textarea v-model='flagComment' rows='6' style='width: 100%; max-width: 100%; box-sizing: border-box;'></textarea>
        </div>
        <br>
        <button @click='submitFlag();'>Submit</button>
      </div>
    </div>
  </div>
</div>
`;
  //height is set to 0 so it doesn't make a giant empty div at the bottom of the page. There's probably a better way to do this.
  canvasbody.after('<div id="btech-flags-vue" style="height: 0px;"></div>');
  $("#btech-flags-vue").append(vueString);
  CANVAS_FLAGS = new Vue({
    el: '#btech-flags-vue',
    mounted: async function () {
      let app = this;
      app.loadCDDNames();
      app.loadSettings();
      $('.ic-app-header__menu-list-item ').each(function () {
        $(this).click(function () {
          app.showFlags = false;
        });
      });
      app.button = $(`
        <li class="ic-app-header__menu-list-item">
          <a id="global_nav_flag_link" role="button" class="ic-app-header__menu-list-link" data-track-category="flag system" data-track-label="flag button" href="javascript:void(0);">
            <div class="menu-item-icon-container" role="presentation">
              <i style="font-size: 1.5em;" class="fal fa-flag" aria-hidden="true"></i>
            </div>
            <div class="menu-item__text">
                Flag
            </div>
          </a>
        </li>
      `)
      app.button.click(function () {
        let button = $(this);
        app.showFlags = !app.showFlags;
        if (app.showFlags === false) {
          button.removeClass('ic-app-header__menu-list-item--active');
        } else {
          button.addClass('ic-app-header__menu-list-item--active');
        }
      })
      $("#menu").append(app.button);

      let url = window.location.pathname.replace(/edit$/, '');
      let rItem = /^\/courses\/([0-9]+)\/(pages|assignments|quizzes|discussion_topics)\/(.*)$/;
      let rInCourse = /^\/courses\/([0-9]+)/;

      //in a page/quiz/assignment
      if (rItem.test(url)) {
        app.pageType = 'item';
        $(document).bind('keydown', 'ctrl+shift+f', function () {
          app.openSubmit();
        });
        let flags = [];
        let match = url.match(rItem);
        app.courseId = match[1];
        app.itemType = match[2];
        app.itemId = match[3];
        await $.get("https://jhveem.xyz/api/flags/courses/" + app.courseId + "/" + app.itemType + "/" + app.itemId, function (data) {
          for (let i = 0; i < data.length; i++) {
            let flag = data[i];
            flag = app.initFlag(flag);
            flags.push(flag);
          }
        });
        app.flags = flags;
      }

      //For modules page
      else if (rInCourse.test(url)) {
        app.pageType = 'course';
        let flags = [];
        let match = url.match(rInCourse);
        app.courseId = match[1];
        await $.get("https://jhveem.xyz/api/flags/courses/" + app.courseId, function (data) {
          for (let i = 0; i < data.length; i++) {
            let flag = data[i];
            flag = app.initFlag(flag);
            flags.push(flag);
          }
        });
        app.flags = flags;
        app.displayModuleFlags();
      }

      //any other page, not in a specific course
      else {
        app.pageType = 'other';
        let flags = [];
        await $.get("https://jhveem.xyz/api/flags", function (data) {
          for (let i = 0; i < data.length; i++) {
            let flag = data[i];
            flag = app.initFlag(flag);
            flags.push(flag);
          }
        });
        app.flags = flags;
      }

    },
    data: function () {
      return {
        //Filters
        showFilters: true,
        settings: {
          displayResolved: {
            set: false,
            text: 'Include Resolved'
          },
          displayOnlyCreatedByMe: {
            set: false,
            text: 'Created By Me'
          },
          displayOnlyAssignedToMe: {
            set: false,
            text: 'Assigned To Me'
          }
        },

        button: null,
        departments: {},
        topics: [],
        currentEl: null,
        currentData: null,
        buttonX: 0,
        showFlags: false,
        showSubmit: false,
        moving: false,
        firstClick: null,
        xOffset: null,
        yOffset: null,
        flags: [],
        flagOptions: [
          'Video',
          'Copyright',
          'Spelling/Grammar',
          'Missing Content',
          'Other'
        ],
        courseId: null,
        itemType: null,
        itemId: null,
        flagType: '',
        flagAssigned: '',
        flagComment: '',
        flagTags: [],
        pageType: '',
        cddInfo: [],
        loadedNames: {},
        loadedCourses: {},
        rModules: /^\/courses\/([0-9]+)(\/modules){0,1}$/,
        url: window.location.pathname.replace(/edit$/, '')

        //qol
      }
    },
    computed: {
      filteredFlags: function () {
        let app = this;
        return app.flags;
      },
      unresolvedCount: function () {
        let app = this;
        let count = 0;
        for (let i = 0; i < app.filteredFlags.length; i++) {
          let flag = app.filteredFlags[i];
          if (flag.resolved === false && app.checkDisplayFlag(flag)) count += 1;
        }
        return count;
      }
    },
    methods: {
      async displayModuleFlags() {
        let app = this;
        if (app.rModules.test(app.url)) {
          //clear away flags

          //Get module items and set up flags
          await $.get('/api/v1/courses/' + app.courseId + '/modules?include[]=items&include[]=content_details', function (data) {
            $('.ig-flag').each(function () {
              $(this).remove();
            })
            for (let m = 0; m < data.length; m++) {
              let module = data[m];
              for (let i = 0; i < module.items.length; i++) {
                let item = module.items[i];
                if (item.url !== undefined) {
                  let item_url = item.url.replace('/api/v1', '');
                  for (let f = 0; f < app.flags.length; f++) {
                    let flag = app.flags[f];
                    if (item_url === flag.item_url && flag.resolved === false) {
                      let li = $('li#context_module_item_' + item.id);
                      //Clicking on this icon should do something and/or hovering should give info about the flag.
                      li.find('div.ig-row div.ig-info').after('<div class="ig-flag"><i class="fas fa-flag" aria-hidden="true"></i></div>');
                    }
                  }
                }
              }
            }
          })
        }
      },
      checkDisplayFlag(flag) {
        let app = this;
        //do not include the check on if the name is loaded here because it messes up the flag count displayed before the menu opens
        let checkResolved = (app.settings.displayResolved.set || !flag.resolved);
        let checkFilterCreator = (!app.settings.displayOnlyCreatedByMe.set || (ENV.current_user_id === flag.createdBy));
        //Make this more robust so you have a drop down instead of a checkmark to choose who to see. Can also see all or unassigned.
        let checkFilterAssigned = (!app.settings.displayOnlyAssignedToMe.set || (flag.assignedTo.includes(ENV.current_user_id)));
        return checkResolved && checkFilterCreator && checkFilterAssigned;
        s
      },
      loadName(userId) {
        let app = this;
        if (app.loadedNames[userId] === undefined) {
          app.loadedNames[userId] = null;
          $.get('/api/v1/users/' + userId, function (data) {
            app.loadedNames[userId] = data.name;
          });
        }
      },
      prepareSettingsPacket() {
        let app = this;
        let settings = {};
        for (let s in app.settings) {
          let setting = app.settings[s];
          settings[s] = setting.set;
        }
        return settings;
      },
      loadSettings() {
        let app = this;
        $.get("https://jhveem.xyz/api/flag_settings/" + ENV.current_user_id, function (data) {
          if (data.length === 0) {
            let settings = app.prepareSettingsPacket();
            $.post("https://jhveem.xyz/api/flag_settings/" + ENV.current_user_id, {
              settings: JSON.stringify(settings)
            }, function (data) {
              console.log(data);
            });
          } else {
            if (data[0].settings === undefined) {
              $.delete("https://jhveem.xyz/api/flag_settings/" + data[0]._id)
            } else {
              let settings = JSON.parse(data[0].settings);
              for (let s in settings) {
                app.settings[s].set = settings[s];
              }
            }
          }
        })
      },
      updateSettings() {
        let app = this;
        let settings = app.prepareSettingsPacket();
        $.put("https://jhveem.xyz/api/flag_settings/" + ENV.current_user_id, {
          settings: JSON.stringify(settings)
        }, function (data) {
          console.log(data);
        });
      },
      loadCDDNames() {
        let app = this;
        for (let i in CDDIDS) {
          let id = CDDIDS[i];
          app.loadName(id);
        }
      },
      name(id) {
        let app = this;
        return app.loadedNames[id];
      },
      initFlag(flag) {
        let app = this;
        let flagUrl = 'https://btech.instructure.com/courses/' + flag.courseId + '/' + flag.itemType + '/' + flag.itemId;
        flag.item_url = flagUrl;
        flag.editing = false;
        app.loadName(flag.createdBy);
        //get the name of the course to which it belongs
        if (app.loadedCourses[flag.courseId] === undefined) {
          app.loadedCourses[flag.courseId] = null;
          $.get('/api/v1/courses/' + flag.courseId, function (data) {
            app.loadedCourses[flag.courseId] = data.name;
          });
        }
        return flag;
      },
      async submitFlag() {
        let app = this;
        $.post('https://jhveem.xyz/api/flags', {
          'courseId': app.courseId,
          'createdBy': ENV.current_user_id,
          'assignedTo': JSON.stringify([app.flagAssigned]),
          'itemType': app.itemType,
          'itemId': app.itemId,
          'flagType': app.flagType,
          'tags': app.flagTags,
          'comment': app.flagComment
        }, function (flag) {
          //need to append this flag to list of flags
          flag = app.initFlag(flag);
          app.flags.push(flag);
        });
        app.flagComment = '';
        app.flagTags = [];
        app.close();
      },
      async deleteFlag(flag) {
        let app = this;
        await $.delete('https://jhveem.xyz/api/flags/' + flag._id);
        let ind = app.flags.indexOf(flag);
        if (ind > -1) {
          app.flags.splice(ind, 1);
        }
      },
      //this is not an api call, but what is called when edits are made in the user interface, will probably also initiate an api call though
      async saveFlagEdits(flag, flagPropName) {
        let app = this;
        let saveData = {};
        saveData[flagPropName] = flag[flagPropName];
        if (flagPropName === 'assignedTo') saveData[flagPropName] = JSON.stringify(saveData[flagPropName]);
        flag.editing = false;
        app.updateFlag(flag, saveData);
      },
      async updateFlag(flag, changes) {
        let app = this;
        await $.put('https://jhveem.xyz/api/flags/' + flag._id, changes);
      },
      async editFlag(flag) {
        let app = this;
        //maybe throw in a check that closes any other flags being edited and throw a "save other flag?" prompt
        flag.editing = true;
        let refId = 'edit_comment_' + flag._id;
        app.$refs[refId].$el.focus();
      },
      async resolveFlag(flag) {
        let app = this;
        flag.resolved = !flag.resolved
        app.updateFlag(flag, {
          'resolved': flag.resolved
        });
        app.displayModuleFlags();
      },

      async assignFlag(flag) {

      },

      openSubmit() {
        let app = this;
        app.flagComment = '';
        app.flagTags = [];
        app.showSubmit = true
      },
      async createDepartmentElement(department) {
        let departmentId = department.data.id;
        $.post("https://jhveem.xyz/api/departments", {
          departmentId: departmentId,
          elX: department.elX,
          elY: department.elY
        });
      },
      async saveDepartmentElement(department) {
        let departmentId = department.data.id;
        $.put("https://jhveem.xyz/api/departments/" + departmentId, {
          departmentId: departmentId,
          elX: department.elX,
          elY: department.elY
        });
      },
      async saveTopicElement(topic) {
        let topicId = topic._id;
        $.put("https://jhveem.xyz/api/topics/" + topicId, {
          title: topic.title,
          elX: topic.elX,
          elY: topic.elY
        });
      },
      removeNewLines(str) {
        return str.replace(/\n/g, " ");
      },
      close() {
        this.showSubmit = false;
      },
      grabElement(e, data) {
        let app = this;
        if (data.editing === false) {
          let el = e.target;
          if (e.target !== $("#btech-course-status-vue .btech-modal-content-inner")[0]) {

            app.xOffset = e.pageX - $(el).offset().left;
            app.yOffset = e.pageY - $(el).offset().top;
            if (this.currentEl == null) {
              this.currentEl = el;
              this.currentData = data;
            }
            if (!this.moving) {
              if (this.firstClick == el) {
                if (data.type === 'topic') {
                  data.editing = true;
                  setTimeout(function () {
                    $(el).find("input").focus();
                  }, 100);
                }
              }
            }
            this.firstClick = el;
            setTimeout(function () {
              if (app.firstClick == el) {
                app.firstClick = null;
              }
            }, 1000);
          }
        }
      },
      dropElement(e) {
        let app = this;
        if (app.moving === true) {
          app.firstClick = null;
        }
        app.moving = false;
        if (app.currentData !== null) {
          if (app.currentData.type === 'department') {
            app.saveDepartmentElement(app.currentData);
          }
          if (app.currentData.type === 'topic') {
            app.saveTopicElement(app.currentData);
          }
        }
        app.currentEl = null;
        app.currentData = null;
      },
      onMouseMove(e) {
        if (this.currentEl !== null && this.currentData !== null) {
          this.moving = true;
          var container = $("#btech-course-status-vue .btech-modal-content-inner");
          var containerOffset = container.offset();
          var relX = e.pageX - containerOffset.left;
          var relY = e.pageY - containerOffset.top;
          let percX = (relX / container.width() * 100).toFixed(2);
          if (percX > 0 && percX <= 100) this.currentData.elX = percX;
          let percY = (relY / container.height() * 100).toFixed(2);
          if (percY > 0 && percY <= 100) this.currentData.elY = percY;
        }
      }
    }
  });
})();