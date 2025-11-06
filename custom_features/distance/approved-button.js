(async function() {

  //html for icon - can be replaced with any icon you'd like, just make sure style on the svg element is:
  ////style="width: 1.5rem; height: auto; vertical-align: middle;"
  let workFromHomeIcon = `
    <svg 
      aria-label="work from home icon"
      style="width: 1.5rem; height: auto; vertical-align: middle;"
      id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 1060.44 1004.85" enable-background="new 0 0 1060.44 1004.85" >
      <g id="Layer_1-2" data-name="Layer 1">
        <path class="cls-1" d="M1058.21,512.58c5.1-13.19,1.26-28.93-9.57-39.15h0L559.21,11.51c-16.26-15.34-41.73-15.34-57.99,0L11.8,473.43c-10.83,10.22-14.68,25.95-9.57,39.15,5.29,13.68,18.19,22.52,32.85,22.52h86.47v445.07c0,13.63,11.05,24.67,24.67,24.67h243.72c13.63,0,24.67-11.05,24.67-24.67v-281.25c0-13.36,10.83-24.2,24.2-24.2h179.12c13.36,0,24.2,10.83,24.2,24.2v281.25c0,13.63,11.05,24.67,24.67,24.67h243.72c13.63,0,24.67-11.05,24.67-24.67v-445.07h90.16c14.66,0,27.55-8.84,32.85-22.52Z"/>
      </g>
    </svg>
  `;


  //api call to get list of distance approved module items
  let approvals = [];
  try {
    await $.get("https://distance.bridgetools.dev/api/courses/" + ENV.COURSE_ID + "/approval", data => {approvals = data});
  } catch (err) {
    console.log("NO APPROVALS")
  }

  //get all module items in current course
  let modules = await canvasGet('/api/v1/courses/' + ENV.COURSE_ID + '/modules?include[]=items&include[]=content_details');
  //set colors
  let contentNotApprovedColor = bridgetools.colors.darkGray;
  let contentApprovedColor = bridgetools.colors.canvasGreen;


  //clear away any distance approved icons on the chance this gets run more than once on a page
  $('.ig-distance-approved').each(function () {
    $(this).remove();
  });

  //iterate over each module item and add the icon if it's in the list of approved items
  for (let m = 0; m < modules.length; m++) {
      let module = modules[m];
      for (let i = 0; i < module.items.length; i++) {
          let item = module.items[i];

          //module item actually has something
          if (item.type == 'Page') item.content_id = item.id;
          if (item.url !== undefined && item.content_id > 0) {
              //get page element using element id
              let itemLiElId = "context_module_item_" + item.id;
              let titleEl = $("#" + itemLiElId + " div.ig-info");
              let approved = false;
              //see if it's approved
              for (let a = 0; a < approvals.length; a++) {
                  let approval = approvals[a];
                  if (approval.type == item.type && approval.content_id == item.content_id) {
                      approved = approval.approved;
                  }
              }

              //default to not approved
              let color = contentNotApprovedColor;
              // made it black to be more obvious
              if (approved) color = bridgetools.colors.black;
              if (IS_ISD && approved) color = contentApprovedColor;
              let distanceApprovedButton = $(`<span class="ig-distance-approved" style="cursor: pointer; float: right;"></span>`);
              let icon = $(workFromHomeIcon);
              icon.css("fill", color);
              distanceApprovedButton.append(icon);

              //allow for toggling of approved state if ISD
              if (IS_ISD) {
                  distanceApprovedButton.click(function() {
                      let currentColor = icon.css("fill");
                      let approved = (currentColor == contentApprovedColor);
                      approved = !approved;
                      if (approved) icon.css("fill", contentApprovedColor);
                      if (!approved) icon.css("fill", contentNotApprovedColor);
                      // SHOULD ADD A CATCH TO EITHER REVERT COLOR OR RESEND REQUEST IF THIS REQUEST RETURNS A FAIL
                      $.post("https://distance.bridgetools.dev/api/courses/" + ENV.COURSE_ID + "/approval", {
                          title: item.title,
                          type: item.type,
                          content_id: item.content_id,
                          approved: approved
                      });
                  });
              }

              //only show if approved or if ISD so they can toggle it to be approved
              if (approved || IS_ISD) {
                titleEl.after(distanceApprovedButton);
              }
          }
      }
  }
})();