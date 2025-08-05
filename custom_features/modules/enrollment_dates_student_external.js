/*
  OVERVIEW
    This script has two elements, the progress bar and the countdown timer
    Both elements use the difference between the enrollment end_at variable and the enrollment start_at variables
    If either start_at or end_at doesn't exist, the script checks various other dates to find a next best date

  PROGRESS BAR
    The progress bar has two elements. The course progress and the recommended Progress
    Course Progress 
    REQUIRES: nothing, it can figure out progress based on existing data 
    This calculates progress based on final_score / current_score
      This formula is the simplest way of calculating progress because it takes into account assignment group weighting
      CAVEAT: It assumes weighted points are equivalent to progres. e.g. An assignment worth 10% of the grade = 10% of the student's progress in the course
  RECOMMENDED PROGRESS 
    REQUIRES: start date and end date. Start date should always exist, end date may not
    This will be placed behind the Course Progress bar so a student will only see the recommded progress if they're behind.


  COUNTDOWN TIMER 
    REQUIRES: end date
    This will create a bunch of cards that show the time remaining. Shows days unless they've reached final_countdown_days, then shows hours, minutes, seconds to increase urgency

  HOW TO IMPORT
    Copy and paste the following 3 lines of code into your custom_canvas.js file

  (async function() {
    await $.getScript("https://bridgetools.dev/canvas/custom_features/modules/enrollment_dates_student_external.js");
  })()
    
*/
(async function() {
  // load tweenmax, used for the countdown timer
  await $.getScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/latest/TweenMax.min.js");
  console.log("LIBRARY LOADED");

  // add in style
  function loadStyle() {

    $('#btech-countdown').css({
      width: '100%',
      margin: '0 auto',
      textAlign: 'center'
    });

    $('#btech-countdown .bloc-time').css({
      margin: '0 0.5rem',
      minWidth: '5rem',
      textAlign: 'center',
      display: 'inline-block'
    });

    $('#btech-countdown .bloc-time:last-child').css({
      marginRight: '0'
    });

    $('#btech-countdown .count-title').css({
      display: 'block',
      marginBottom: '1rem',
      font: "normal 1rem 'Lato'",
      color: '#1a1a1a',
      textTransform: 'uppercase'
    });

    $('#btech-countdown .figure').css({
      position: 'relative',
      display: 'inline-block',
      height: '2rem',
      width: '1.5rem',
      backgroundColor: 'var(--btech-countdown-back)',
      borderRadius: '0.5rem',
      boxShadow: '0 3px 4px 0 rgba(0, 0, 0, .2), inset 2px 4px 0 0 rgba(255, 255, 255, .08)'
    });

    $('#btech-countdown .figure:last-child').css({
      marginRight: '0'
    });

    $('#btech-countdown .figure > span').css({
      position: 'absolute',
      left: '0',
      right: '0',
      margin: 'auto',
      font: "normal 1.75rem 'Lato'",
      fontWeight: '700',
      color: 'var(--btech-countdown-font)'
    });

    $('#btech-countdown .figure .top:after, #btech-countdown .figure .bottom-back:after').css({
      content: '""',
      position: 'absolute',
      zIndex: '-1',
      left: '0',
      bottom: '0',
      width: '100%',
      height: '100%',
      borderBottom: '1px solid rgba(0, 0, 0, .1)'
    });

    $('#btech-countdown .figure .top').css({
      zIndex: '3',
      backgroundColor: 'var(--btech-countdown-back)',
      transformOrigin: '50% 100%',
      borderTopLeftRadius: '10px',
      borderTopRightRadius: '10px',
      transform: 'perspective(200px)'
    });

    $('#btech-countdown .figure .bottom').css({
      zIndex: '1'
    });

    $('#btech-countdown .figure .bottom:before').css({
      content: '""',
      position: 'absolute',
      display: 'block',
      top: '0',
      left: '0',
      width: '100%',
      height: '50%',
      backgroundColor: 'rgba(0, 0, 0, .02)'
    });

    $('#btech-countdown .figure .bottom-back').css({
      zIndex: '2',
      top: '0',
      height: '50%',
      overflow: 'hidden',
      backgroundColor: 'var(--btech-countdown-back)',
      borderTopLeftRadius: '10px',
      borderTopRightRadius: '10px'
    });

    $('#btech-countdown .figure .bottom-back span').css({
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      margin: 'auto'
    });

    $('#btech-countdown .figure .top, #btech-countdown .figure .top-back').css({
      height: '50%',
      overflow: 'hidden',
      backfaceVisibility: 'hidden'
    });

    $('#btech-countdown .figure .top-back').css({
      zIndex: '4',
      bottom: '0',
      backgroundColor: 'var(--btech-countdown-back)',
      transformOrigin: '50% 0',
      transform: 'perspective(200px) rotateX(180deg)',
      borderBottomLeftRadius: '10px',
      borderBottomRightRadius: '10px'
    });

    $('#btech-countdown .figure .top-back span').css({
      position: 'absolute',
      top: '-100%',
      left: '0',
      right: '0',
      margin: 'auto'
    });

    $('#btech-student-progress-bar').css({
      textAlign: 'center',
      marginBottom: '1rem'
    });

    $('#btech-student-end-date').css({
      textAlign: 'center',
      marginBottom: '1rem'
    });

    $('#btech-student-progress-bar .background').css({
      color: '#000',
      maxWidth: '500px',
      width: '100%',
      height: '1rem',
      display: 'inline-block',
      position: 'relative'
    });

    $('#btech-student-progress-bar .fill').css({
      color: '#fff',
      maxWidth: '500px',
      minWidth: '2rem',
      position: 'absolute',
      userSelect: 'none',
      cursor: 'help',
      textAlign: 'left',
      paddingLeft: '1rem'
    });
  }



  // Create object to manage progress bar and countdown timer
  var Countdown = {
    enrollment: {},
    countdown_interval: null,
    final_countdown_days: 7, // when the timer reaches this number of days remaining, it will show the hours, minutes, seconds to be a more urgent coutndown. otherwise it just shows the days
    els: {},
    /*
      This is a starting point for a calcEndDate script for institutions outside of Bridgerland Technical College
      How you handle figuring out end dates may vary by institution
      This one simply checks enrollment, seciton, course, and finally term to see if an end date exists
    */
    calcEndDate: async function() {
      let section, course, term;
      if (!this.enrollment?.end_at) {
        let sectionURL = `/api/v1/courses/${ENV.COURSE_ID}/sections/${this.enrollment.course_section_id}`;
        section = (await $.get(sectionURL))
        this.enrollment.end_at = section.end_at;
        return;
      }

      // cs and still no end_at, check the course end date
      if (!this.enrollment?.end_at) {
        let courseURL = `/api/v1/courses/${ENV.COURSE_ID}`;
        course = (await $.get(courseURL));
        this.enrollment.end_at = course.end_at;
        return;
      }


      // if STILL no end_at, get the term end at
      if (!this.enrollment?.end_at) {
        let termURL = `/api/v1/accounts/3/terms/${course.enrollment_term_id}`;
        term = (await $.get(termURL));
        this.enrollment.end_at = term.end_at;
        return;
      }

      return;
    },

    /*
      Entry point for the whole thing
    */
    init: async function() {
      if (!ENV.current_user_is_student) return; //only show this for students

      // get the enrollment data using the api
      this.enrollment = (await $.get(`/api/v1/courses/${ENV.COURSE_ID}/enrollments?user_id=self&type[]=StudentEnrollment`))[0];
      // sometimes there's a created_at date but not a start_at date. But if both exist
      //// start_at takes priority because sometimes enrollments are created before the student has the chance to do anything in the course
      if (this.enrollment.start_at == undefined) this.enrollment.start_at = this.enrollment.created_at;

      // Try and find an end_at date if one hasn't been set
      this.calcEndDate();

      // Do we have dates needed for the progress bar and the countdown to work?
      let checkValidDates = (this.enrollment.start_at != undefined && this.enrollment.end_at != undefined);

      this.initProgress();
      loadStyle();
      if (!checkValidDates) return;
      this.initCountdown();

      // Animate countdown to the end 
      this.count();    
      loadStyle();
    },
    
    /*
      Initialize the countdown  
    */
    calcProgress: function() {
      let grades = this.enrollment.grades;
      let progress = (grades.current_score ? (grades.final_score / grades.current_score) : 0);
      return progress;
    },

    /*
      calculate progress, calculate recommended progress, create the html element for the progress bar
    */
    initProgress: function() {
      let progress = Math.round(this.calcProgress() * 100);
      let recommendedProgress = Math.round(this.calcRecommendedProgress() * 100);
      let el = $(`
        <div class="background">
          <div class="fill" style="width: 100%; background-color: #f1f1f1;">0</div>
          <div class="fill" title="Recommended progress (${recommendedProgress}%) based on enrollment dates." style="width: ${recommendedProgress}%; background-color: #05989D;">${recommendedProgress}%</div>
          <div class="fill" title="Percentage of course graded (${progress}%)" style="width: ${progress}%; background-color: #B30B0F;">${progress}%</div>
        </div> 
      `);
      $("#btech-student-progress-bar").append(el);

      if (this.enrollment.end_at) {
        console.log(this.enrollment.end_at);
        $("#btech-student-end-date").append(`<div>${bridgetools.dateToString(this.enrollment.end_at)}</div>`);
      }
    },

    /*
      create the html element for the countdown timer
    */
    initCountdown: function() {
      let groups = [
        'DAYS',
        'HOURS',
        'MINUTES',
        // 'SECONDS'
      ];
      let vals = this.calcTimeVals();
      if (vals.days > this.final_countdown_days) {
        groups = ['DAYS'];
      }

      groups.forEach((capName) => {
        let name = capName.toLowerCase();
        let el = $(`
          <div id="countdown-block-${name}" class="bloc-time">
            <div class="figure part1">
              <span class="top"></span>
              <span class="top-back"><span></span></span>
              <span class="bottom"></span>
              <span class="bottom-back"><span></span></span>
            </div>
            <div class="figure part2">
              <span class="top"></span>
              <span class="top-back"><span></span></span>
              <span class="bottom"></span>
              <span class="bottom-back"><span></span></span>
            </div>
            <div class="figure part3">
              <span class="top"></span>
              <span class="top-back"><span></span></span>
              <span class="bottom"></span>
              <span class="bottom-back"><span></span></span>
            </div>
            <span class="count-title">${capName}</span>
          </div>
        `);
        el.find(".part3").hide();
        this.els[name] = el;
        $("#btech-countdown").append(el);
      })
    },


    /*
      calculate the recommended progress if there is an end date
    */
    calcRecommendedProgress: function() {
      let recommendedProgress = 0;
      try {
        let endAt = Date.parse(this.enrollment.end_at);
        let startAt = Date.parse(this.enrollment.start_at);
        var now = new Date().getTime();
        let totalTime = endAt - startAt;
        let currentTime = now - startAt;
        if (totalTime == 0) return 0;
        recommendedProgress = currentTime / totalTime;
      } catch (err) {

      }
      return recommendedProgress;
    },

    /*
      calculate the ammount of time remaining between now and the enrollment end date
    */
    calcTimeRemaining: function () {
      let data = this.enrollment; 
      let endAt = Date.parse(data.end_at);
      // Get today's date and time
      var now = new Date().getTime();
      
      // Find the distance between now and the count down date
      var days = endAt - now;
      return days;
    },

    /*
      see if there's any time left on the timer.
    */
    calcTimeVals: function() {
      let time = this.calcTimeRemaining();
      // If the count down is finished, write some text
      if (time < 0) {
        clearInterval(x);
        document.getElementById("btech-countdown").innerHTML = "You have no more time in this enrollment. Please speak with your instructor.";
        return
      }
      // If still time left, return the pieces of the time in days, horus, minutes, seconds for the countdown
      return {
        days: Math.floor(time / (1000 * 60 * 60 * 24)),
        hours: Math.floor((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((time % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((time % (1000 * 60)) / 1000)
      }
    },
    
    count: function() {
      this.countdown_interval = setInterval(async () => {
        let vals = this.calcTimeVals();
        for (let time in this.els) {
          this.checkCards(
            vals[time],
            this.els[time]
          )
        }
        
      }, 1000);    
    },
    
    /*
      the card flip animation
    */
    animateFigure: function($el, value) {
      let $top         = $el.find('.top');
      let $bottom      = $el.find('.bottom');
      let $back_top    = $el.find('.top-back');
      let $back_bottom = $el.find('.bottom-back');

      // Before we begin, change the back value
      $back_top.find('span').html(value);

      // Also change the back bottom value
      $back_bottom.find('span').html(value);

      // Then animate
      TweenMax.to($top, 0.8, {
          rotationX           : '-180deg',
          transformPerspective: 300,
          ease                : Quart.easeOut,
          onComplete          : function() {

              $top.html(value);

              $bottom.html(value);

              TweenMax.set($top, { rotationX: 0 });
          }
      });

      TweenMax.to($back_top, 0.8, { 
          rotationX           : 0,
          transformPerspective: 300,
          ease                : Quart.easeOut, 
          clearProps          : 'all' 
      });    
    },
    
    /*
      get string values for each time piece and then run the card flip if needed 
    */
    checkCards: function(value, $els) {
      let $el_1 = $els.find(".part1");
      let $el_2 = $els.find(".part2");
      let $el_3 = $els.find(".part3");
      let fig_1_value = $el_1.find('.top').html();
      let fig_2_value = $el_2.find('.top').html();
      let fig_3_value = $el_3.find('.top').html();

      // patch a 0 at the beginning where needed to make size the same
      if (value > 99) {
        value = '' + value;
        $el_3.show();
      } else {
        value = ('0' + value).slice(-2);
        $el_3.hide();
      }


      // Animate only if the figure has changed
      if(fig_1_value !== value.charAt(0)) this.animateFigure($el_1, value.charAt(0));
      if(fig_2_value !== value.charAt(1)) this.animateFigure($el_2, value.charAt(1));
      if(fig_3_value !== value.charAt(2)) this.animateFigure($el_3, value.charAt(2));
    }
  };

  // Only run on the course modules page or home  page
  if (/^\/courses\/[0-9]+(\/modules){0,1}$/.test(window.location.pathname)) {
    // Add containers for the different elements to the modules header bar
    $(".header-bar").after("<div id='btech-countdown'></div>");
    $(".header-bar").after("<div id='btech-student-end-date'></div>");
    $(".header-bar").after("<div id='btech-student-progress-bar'></div>");
    $(".header-bar-right").css("width", "100%");
    // start it off
    Countdown.init();
  }
})();