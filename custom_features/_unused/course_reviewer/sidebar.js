// track which pages were reviewed, or have an option to tag the current page as needing review
//// maybe a little flag icon next to each topic that you can flag that page as an example. When you click flag, pop up to leave a comment why flagging.
//// option to delete flags
// need to add comments


(function() {
  $('body').append(`
  <div
    id="btech-course-evaluation-vue"
    :style="{
      'width': width + 'px',
      'right': minimized ? '-' + width + 'px' : '0px'
    }"
    style="
      position: fixed; 
      top: 0;
      overflow: scroll;
      height: 100vh;
      background-color: #e8e8e8;
      box-shadow: -1px 0px 10px 0.5px #aaaaaa;
      z-index: 999999;
    "
  >
    <div
      v-if="minimized"
      @click="maximize"
      style="
        position: fixed;
        top: 2rem;
        right: 0px;
        color: white;
        padding: 0.5rem;
        cursor: pointer;
      "
      :style="{
        'background-color': bridgetools.colors.red
      }"
    >
      <i class="icon-rubric"></i>
    </div>
    <div
      v-else
      :style="{
        color: updating ? bridgetools.colors.gray : 'black'
      }"
    >
      <div 
        style="
          text-align: center;
          background-color: white;
          color: black;
          cursor: pointer;
          user-select: none;
        "
        @click="minimize"
      >
        <b>Course Review</b>
        <b>&#8250;</b>
      </div>
      <div
        :style="{
          'background-color': bridgetools.colors.red,
          'color': 'white'
        }"
        style="
          display: grid;
          grid-template-columns: auto auto auto auto;
          text-align: center;
          user-select: none;
          cursor: pointer;
        "
      >
        <span 
          :style="{
            'background-color': currentMenu == 'history' ? 'white' : '',
            'color': currentMenu == 'history' ? 'black' : '',
          }"
          @click="currentMenu='history'; viewReview = {};">History</span>
        <span 
          :style="{
            'background-color': currentMenu == 'new' ? 'white' : '',
            'color': currentMenu == 'new' ? 'black' : '',
          }"
          @click="
            currentMenu = 'new';
            if (Object.keys(activeReview).length == 0) newReview();
          "
        >{{Object.keys(activeReview).length > 0 ? 'Active' : 'New'}}</span>
        <span
          :style="{
            'background-color': currentMenu == 'data' ? 'white' : '',
            'color': currentMenu == 'data' ? 'black' : '',
          }"
          @click="currentMenu = 'data';"
        >Data</span>
        <span
          :style="{
            'background-color': currentMenu == 'surveys' ? 'white' : '',
            'color': currentMenu == 'surveys' ? 'black' : '',
          }"
          @click="currentMenu = 'surveys'; loadSurveys();"
        >Surveys</span>
      </div>

      <!--Active Review-->
      <div
        v-if="currentMenu == 'new'"
      >
        <!-- MARK AS PROJECT EVALUATION -->
        <div
          style="
            padding: 0.5rem;
            margin: 0.5rem;
            background-color: #FFFFFF;
          "
        >
          <input 
            type="checkbox" 
            :value="activeReview.isd_improvement"
            v-model="activeReview.isd_improvement" 
            @change="setISDImprovement(activeReview._id, activeReview.isd_improvement)" 
          /> ISD Project Evaluation 
        </div>

        <!-- RUBRIC -->
        <div
          v-for="topic in activeReview?.summary?.topics ?? []"
          style="
            padding: 0.5rem;
            margin: 0.5rem;
            background-color: #FFFFFF;
          "
        >
          <h3><strong>{{topic.name}}</strong></h3>
          <div
            v-for="question in topic.questions"
            style="
              margin-bottom: 0.5rem;
            "
          >
            <div>
              <i 
                style="border-radius: 1rem; padding: 0.25rem; color: #FFFFFF;"
                :style="{
                  'background-color': !question.links ? 'white' : question.links == (window.location.origin + window.location.pathname) ? bridgetools.colors.green : 'black', 
                  'color': question.links ? 'white' : 'black'
                }"
                class="icon-pin"
                @click.shift.capture.stop="window.location.replace(question.links);"
                @click="pinURL(question.id, question.links)"
                :title="question.links"
              ></i>
              <strong :title="question.tip">{{question.text}}</strong>
            </div>
            <div
              style="
                width: 100%;
                justify-content: space-around;
                user-select: none;
                border-radius: 1rem;
                border: 1px solid #303030;
                font-size: 0.75rem;
              "
            >
              <span 
                style="
                  display: inline-block;
                  width: 25%;
                  text-align: center;
                  cursor: pointer;
                "
                v-for="i in [1, 2, 3, 4]"
                :style="{
                  'background-color': question.rating >= i ? averageColor(i) : '#FFFFFF',
                  'color' : question.rating >= i ? '#FFFFFF' : '#000000',
                  'border-radius': i == 1 ? ('1rem 0 0 1rem') : (i == 4 ? '0 1rem 1rem 0' : '0')
                }"
                @click="setRating(question.id, i); question.rating = i;"
              >
                <b>{{ratingDescription[i - 1]}}</b>
              </span>
            </div>
            <div>
                <textarea
                  v-model="question.comment"
                  @focus="updating = true;"
                  @blur="event => setComment(question.id, event.target.value)"
                  style="margin-top: 0.5rem; height: 2.5rem; box-sizing: border-box; resize: none; width: 100%;"
                ></textarea>
            </div>
          </div>
        </div>

        
        <!--BUTTONS-->
        <div
          style="
            display:flex;
            justify-content: space-around;
          "
        >
          <span
            style="
              background-color: #FFFFFF;
              color: #000000;
              padding: 0.25rem;
              cursor: pointer;
            "
            @click="discardReview()"
          >Discard</span>
          <span
            :style="{
              'background-color': readyToSubmit ? bridgetools.colors.red : bridgetools.colors.darkGray,
              'color': '#FFFFFF',
              'padding': '0.25rem',
              'cursor': 'pointer'
            }"
            @click="if (readyToSubmit) submitReview();"
          >Submit</span>
        </div>
      </div>

      <!--SUMMARY-->
      <div
        v-if="currentMenu == 'history'"
        style="margin-top: 1rem;"
      >
        <!--PAST REVIEWS-->
        <div
          v-if="Object.keys(viewReview).length == 0"
        >
          <div
            v-for="year in pastReviewsYears"
          >
            <div
              style="
                padding: 0.5rem;
                margin: 0.5rem;
                background-color: #FFFFFF;
                user-select: none; cursor: pointer;
              "
            >
              <h3><strong>{{year > 0 ? year : "Sandbox"}}</strong></h3>
            </div>
            <div
              v-for="review in pastReviews.filter(rev => {
                return rev.year == year;
              })"
              style="
                padding: 0.5rem;
                margin: 0.5rem;
                background-color: #FFFFFF;
                user-select: none; cursor: pointer;
              "
              @click="viewReview = review;"
            >
              <div>
                <span><strong>{{raterNames?.[review.rater_id] ?? ""}}</strong></span>
                <span
                  v-if="raterId == 1893418"
                  style="
                    float: right;
                    cursor: pointer;
                    user-select: none;
                  "
                  @click="deleteReview(review._id)"
                >X</span>
                <span style="float: right; display: inline-block; width: 6rem; font-size: 0.75rem;"><i>{{bridgetools.dateToString(review.date)}}</i></span>
              </div>
              <div
                style="
                  display:flex;
                  justify-content: space-around;
                "
              >
                <span
                  v-for="topic in review.summary?.topics ?? []"
                  style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    height: 2rem;
                    width: 2rem;
                    border-radius: 1rem;
                  "
                  :style="{
                    'background-color': averageColor(topic.average)
                  }"
                >
                  <i 
                    style="
                      color: #FFFFFF;
                    "
                    :class="
                      icons[topic.name]
                    "
                    :title="topic.name + ': ' + topic.average"
                  ></i>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!--SPECIFIC PAST REVIEW-->
        <div
          v-else
        >
          <div>
            <span><strong><a target="_blank" :href="'/courses/' + viewReview.course_id">{{viewReview.course_code}}</a></strong></span>
            <span>{{viewReview.year > 0 ? viewReview.year : "Sandbox"}}</span>
          </div>
          <div
            v-for="topic in (viewReview?.summary.topics ?? [])"
            style="
              padding: 0.5rem;
              margin: 0.5rem;
              background-color: #FFFFFF;
            "
          >
            <h3><strong>{{topic.name}}</strong></h3>
            <div
              v-for="question in topic.questions"
              style="
                margin-bottom: 0.5rem;
              "
            >
              <div
                style="
                  user-select: none;
                "
              >
                <span 
                  style="
                    border: 1px solid #303030;
                    border-radius: 1rem;
                    display: inline-block;
                    width: 2rem;
                    height: 2rem;
                    font-size: 1.5rem;
                    text-align: center;
                    cursor: pointer;
                  "
                  :style="{
                    'background-color': averageColor(question.rating),
                    'color' : '#FFFFFF'
                  }"
                ><b>{{question.rating}}</b></span>
                <strong :title="question.tip">{{question.text}}</strong>
              </div>
              <div
                style="margin-top: 0.5rem; box-sizing: border-box; width: 100%;"
              >
                {{question.comment}}
              </div>
              <div>
                <a 
                  :href="question.links"
                >{{question.links}}</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!--SURVEY DATA-->
      <div
        v-if="currentMenu == 'surveys'"
        style="margin-top: 1rem;"
      >
        <!--RATINGS-->
        <div>
          <div
            v-for="question in surveyRatingsList"
            style="
              padding: 0.5rem;
              margin: 0.5rem;
              background-color: #FFFFFF;
              user-select: none; cursor: pointer;
            "
          >
            <strong>{{question}}</strong>
            <span
              :title="'Out of ' + surveyQuestions[question].count + ' responses.'"
              style="
                display: flex;
                justify-content: center;
                align-items: center;
                text-align: center;
                height: 2rem;
                width: 2rem;
                border-radius: 1rem;
                color: white;
              "
              :style="{
                'background-color': averageColor(surveyQuestions[question].average)
              }"
            >
            {{isNaN(surveyQuestions[question].average) ? "N/A" : Math.round(surveyQuestions[question].average * 2) / 2}}
            </span>
          </div>
        </div>
        <div>
          <div
            v-for="question in surveyTextList"
            style="
              padding: 0.5rem;
              margin: 0.5rem;
              background-color: #FFFFFF;
              user-select: none;
            "
          >
            <strong>{{question}}</strong>
            <div
              v-for="c in surveyCommentsPerPage"
            >
              {{c + (surveyCommentsPerPage * surveyQuestions[question].page)}}. {{surveyQuestions[question].comments[c + (surveyCommentsPerPage * surveyQuestions[question].page) - 1]}}
            </div>
            <div
              style="text-align: center;"
            >
              <span
                style="
                  cursor: pointer;
                "
                :style="{
                  'color': surveyQuestions[question].page > 0 ? bridgetools.colors.black : bridgetools.colors.gray
                }"
                @click="if (surveyQuestions[question].page > 0) surveyQuestions[question].page -= 1;"
              ><b>&#8249;</b></span>
              <span>{{surveyQuestions[question].page + 1}}</span>
              <span
                style="
                  cursor: pointer;
                "
                :style="{
                  'color': surveyQuestions[question].page < surveyQuestions[question].max_pages - 1 ? bridgetools.colors.black : bridgetools.colors.gray
                }"
                @click="if (surveyQuestions[question].page < surveyQuestions[question].max_pages - 1) surveyQuestions[question].page += 1;"
              ><b>&#8250;</b></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `);
  new Vue({
    el: '#btech-course-evaluation-vue',
    mounted: async function () {
      // init context data
      let canvasCourseData = await $.get("/api/v1/courses/" + CURRENT_COURSE_ID);
      // do a check if there's a valid course code. If not, no need to rate :)
      // may be more accurate to pull based on sis course id 
      let sisCourseId = canvasCourseData.sis_course_id;
      if (sisCourseId == undefined) sisCourseId = canvasCourseData.course_code + " - Sandbox"; //don't do anything, no need to rate?

      //if can't set the required data, can't do a review
      try {
        const yearPattern = /(\d{4})[A-Z]{2}$/;
        const courseCodePattern = /[A-Z]{4} \d{4}/;
        let match = sisCourseId.match(yearPattern);

        let year = 0;
        if (match) year = match[1];
        let courseCode = sisCourseId.match(courseCodePattern)[0];

        this.courseCode = courseCode;
        this.courseId = canvasCourseData.id;
        this.raterId = ENV.current_user_id;
        this.year = year;
      } catch (err) {
        console.error(err);
        return;
      }

      this.loadReviews(init=true);

      this.activeUpdater = setInterval(() => {
        if (Object.keys(this.activeReview).length > 0 && !this.minimized && !this.updating) {
          this.loadReviews();
        }
      }, 1000);
    },
    computed: {
      readyToSubmit() {
        let review = this.activeReview;
        // MAKE SURE THERE'S AN ACTIVE REVIEW
        let reviewInProgress = Object.keys(review).length > 0;
        if (!reviewInProgress) return false;

        // FALSE IF ANY SCORES ARE MISSING
        for (let t in review.summary.topics) {
          let topic = review.summary.topics[t];
          for (let q in topic.questions) {
            let question = topic.questions[q];
            let rating = question.rating ?? 0;
            if (rating == 0) return false;
          }
        }

        return true;
      }
    },
    data: function () {
      return {
        ratingDescription: [
          'Never/Seldom'
          , 'Sometimes'
          , 'Consistently'
          , 'Exemplary'
        ],
        minimized: true,
        updating: false,
        currentMenu: 'history',
        width: 500,
        defaultImg: 'https://bridgetools.dev/canvas/media/image-placeholder.png',
        bridgetools: bridgetools,
        activeUpdater: undefined,
        colors: {
          primary: "#B30B0F",
          secondary: "#A10102",
          callout: "#F1F1F1",
          font: "#FFFFFF",
          bodyfont: "#000000",
          bg: "#FFFFFF"
        },
        raterNames: {

        },
        surveyQuestions: {},
        surveyResponses: [],
        surveyRatingsList: [],
        surveyTextList: [],
        surveysLoaded: false,
        surveyCommentsPerPage: 5,
        pastReviewsYears: [],
        pastReviews: [],
        activeReview: {},
        viewReview: {},
        courseCode: "",
        courseId: "",
        icons: {
          'Assessments': 'icon-rubric',
          'Relevance': 'icon-group',
          'Structure': 'icon-copy-course',
          'Clarity': 'icon-edit'
        },
        raterId: ENV.current_user_id
      }
    },
    methods: {
      initReview: function (review) {
        let summary = {
          topicDict: {},
          topics: [],
        };
        for (let s in review.scores) {
          let score = review.scores[s];
          let question = score.question;
          let topic = question.topic;
          summary.topicDict[topic.name] = summary.topicDict?.[topic.name] ?? {
            name: topic.name,
            questions: {},
            order: topic.order,
            average: 0
          };
          let tip = "";
          for (let t in question.tips) {
            tip += question.tips[t] + '\n';
          }
          summary.topicDict[topic.name].questions[question.text] = summary.topicDict[topic.name].questions?.[question.text] ?? {
            tip: tip,
            text: question.text,
            rating: score.rating,
            links: score.links[0],
            comment: score.comment,
            order: question.order,
            id: score._id
          };
        }

        // REORDER TOPICS AND QUESTIONS IN SUMMARY TO MATCH THE ORDER
        for (let t in summary.topicDict) {
          let topic = summary.topicDict[t];
          let questions = [];
          for (let q in topic.questions) {
            questions.push(topic.questions[q]);
          }
          questions.sort((a, b) => {
            return a.order - b.order;
          });
          topic.questions = questions;
          summary.topics.push(topic);
        }
        summary.topics.sort((a, b) => {
          return a.order - b.order;
        });

        // SET UP SUMMARY OBJECT
        review.summary = {
          topics: summary.topics
        };

        for (let t in summary.topics) {
          let topic = summary.topics[t];
          count = 0;
          total = 0;
          for (let text in topic.questions) {
            let question = topic.questions[text];
            let rating = question.rating;
            count += 1;
            total += rating;
          }
          let average = total / count;

          topic.average = average;
        }
      },
      maximize: function () {
        $('#wrapper').css('margin-right', this.width + 'px');
        this.minimized = false;
      },
      minimize: function () {
        $('#wrapper').css('margin-right', '0px');
        this.minimized = true;
      },
      setComment: async function (scoreId, comment) {
        this.updating = true;
        let score = await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/scores/${scoreId}`, {
          comment: comment 
        }, "PUT");
        this.updating = false;
      },
      pinURL: async function (scoreId, currentURL) {
        let url = window.location.origin + window.location.pathname;
        if (currentURL == url) {
          if (window.confirm('Remove pinned URL for this criterion?')) {
            this.setLink(scoreId, '');
          }
        } else if (currentURL) {
          if (window.confirm('Replace existing pinned URL for this criterion?')) {
            this.setLink(scoreId, url);
          }
        } else {
          this.setLink(scoreId, url);
        }
      },
      setLink: async function (scoreId, link) {
        this.updating = true;
        await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/scores/${scoreId}`, {
          links: [link] 
        }, "PUT");
        this.updating = false;
      },
      setRating: async function (scoreId, rating) {
        this.updating = true;
        await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/scores/${scoreId}`, {
          rating: rating
        }, "PUT");
        this.updating = false;
      },
      setISDImprovement: async function (reviewId, isISDImprovement) {
        this.updating = true;
        await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/review/${reviewId}`, {
          isd_improvement: isISDImprovement 
        }, "PUT");
        this.updating = false;

      },
      submitReview: async function () {
        let review = this.activeReview;
        await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/review/${review._id}`, {
          submitted: true 
        }, "PUT");
        this.currentMenu = 'history';
        this.loadReviews();
      },
      newReview: async function () {
        let review = await bridgetools.req(`https://reports.bridgetools.dev/api/reviews/scores/${this.courseCode.replace(" ", "%20")}/new`, {
          year: this.year,
          course_id: this.courseId,
          user_id: this.raterId,
        }, "POST");
        this.initReview(review);
        this.activeReview = review;
      },
      averageColor: function (average) {
        let colors = this.bridgetools.colors;
        if (average == "N/A") return "#000000"
        return (
          average < 2 ? 
            colors.darkOrange: 
            average < 3 ? 
              colors.yellow: 
              average < 3.5 ?
              colors.yellowGreen :
              average < 4 ?
                colors.green:
                colors.green
        )
      },
      deleteReview: async function (reviewId) {
        await bridgetools.req(
            `https://reports.bridgetools.dev/api/reviews/review/${reviewId}`
            , {}
            , "DELETE"
          );
        this.pastReviews = this.pastReviews.filter(function(review) {
            return review._id !== reviewId;
        });
        //pop it out of the list
      },
      discardReview: async function () {
        this.updating = true;
        let reviewId = this.activeReview._id;
        this.activeReview = {};
        await this.deleteReview(reviewId);
        this.currentMenu = 'history';
        this.updating = false;
      },
      loadReviews: async function (init=false) {
        if (this.updating || (this.minimized && !init)) return;
        let reviews = await bridgetools.req("https://reports.bridgetools.dev/api/reviews/scores/" + this.courseCode.replace(" ", "%20"));
        let pastReviews = [];
        this.pastReviewsYears = [];
        let activeFound = false;
        for (let r in reviews) {
          let review = reviews[r];
          let raterId = review.rater_id;
          if (this.raterNames[raterId] == undefined) {
            try {
              let user =(await canvasGet('/api/v1/users/' + raterId))[0];
              this.raterNames[raterId] = user.name;
            } catch (err) {
              console.error("Could not load");
              this.raterNames[raterId] = `Unknown (${raterId})`;
            }
          }
          this.initReview(review);

          if (review.submitted) {
            pastReviews.push(review);
            if (!this.pastReviewsYears.includes(review.year)) {
              this.pastReviewsYears.push(review.year);
            }
          }
          if (!review.submitted && raterId == this.raterId) {
            this.activeReview = review;
            if (init) {
              this.currentMenu = 'new';
            }
            activeFound = true;
            // this.maximize();
          }
        }
        if (!activeFound) this.activeReview = {};
        this.pastReviews = pastReviews;
        this.pastReviewsYears.sort(function(a, b) {
          return b - a;
        });
      },
      loadSurveys: async function () {
        // DON'T WANT TO KEEP LOADING SAME DATA
        if (this.surveysLoaded) return;

        // LOOK UP FOR NUMBERIC RATINGS
        let ratingRef = {
          'Strongly Agree': 4,
          'Agree': 3,
          'Disagree': 2,
          'Strongly Disagree': 1
        }

        // LOAD THE SURVEYS
        let surveys = await this.bridgetools.req('https://surveys.bridgetools.dev/api/survey_data', {
            course_code: this.courseCode 
        }, 'POST');

        // ITERATE OVER EACH QUESTION AND CREATE AN OBJECT FOR THE SUMMARY DATA OF EACH QUESTION (WHAT WILL BE USED IN REPORT)
        let questions = {};
        for (let q in surveys.questions) {
          let question = surveys.questions[q];
          if (question.type == 'Rating') {
            this.surveyRatingsList.push(question.question);
            question.count = 0;
            question.sum = 0;
            question.average = 0;
          }
          else if (question.type == 'Text') {
            this.surveyTextList.push(question.question);
            question.page = 0;
            question.comments = [];
          }
          questions[question.question] = question;
        }

        // GO OVER EACH RESPONSE AND POPULATE SUMMARY DATA
        for (let r in surveys.responses) {
          let response = surveys.responses[r];
          for (let question in response.questions) {
            let questionResponse = response.questions[question];
            let questionData = questions[question];
            if (questionData.type == 'Rating') {
              let val = ratingRef?.[questionResponse];
              if (val !== undefined) {
                questions[question].count += 1;
                questions[question].sum += val;
              }
            }
            else if (questionData.type == 'Text') {
              questions[question].comments.push(questionResponse);
            }
          }
        }

        // SOME CLEAN UP ON QUESTIONS
        for (let question in questions) {
          let data = questions[question];
          if (data.type == 'Rating') {
            if (questions[question].count == 0) questions[question].average = "N/A";
            else questions[question].average = questions[question].sum / questions[question].count
          }
          else if (data.type == 'Text') {
            questions[question].max_pages = Math.ceil(questions[question].comments.length / this.surveyCommentsPerPage)
            questions[question].comments.sort((a, b) => {
              return b.length - a.length;
            })
          }
        }

        this.surveyQuestions = questions;
        this.surveysLoaded = true;
      }
    }
  });
})();