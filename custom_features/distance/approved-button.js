(async function() {
  let workFromHomeIcon = `
  <svg 
    style="width: 2rem; height: 2rem;"
    version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve">
    <g>
      <g transform="translate(0.000000,511.000000) scale(0.100000,-0.100000)">
        <path d="M4913.7,4844c-30.7-19.2-1106.3-1087.1-2389-2371.7C-88.6-146.9,103.1,66,103.1-229.3c0-126.6,7.7-172.6,49.9-262.7c151.5-324,542.6-462.1,862.8-301c57.5,26.8,686.4,642.3,2034.3,1988.3L5000,3145.2l1951.8-1949.9C8318.9-169.9,8926.7-766.2,8984.2-794.9c320.2-159.2,713.3-19.2,862.8,302.9c42.2,90.1,49.9,136.1,49.9,262.7c0,295.3,191.7,80.5-2431.2,2711.1c-1380.5,1382.4-2366,2356.4-2402.4,2371.7C4984.7,4888.1,4982.7,4888.1,4913.7,4844z"/>
        <path d="M3086.5,733.2l-1902-1902v-1691.1V-4551l46-53.7l46-53.7H5000h3723.5l46,53.7l46,53.7v1691.1v1691.1L6911.6,735.1c-1045,1045-1905.8,1902-1911.6,1902S4133.4,1780.1,3086.5,733.2z M4210.1-35.7c80.5-42.2,176.4-141.9,210.9-222.4c42.2-97.8,36.4-262.7-11.5-354.7c-78.6-155.3-216.7-239.7-387.3-239.7c-241.6,0-423.7,180.2-427.6,419.9c-1.9,256.9,207.1,454.4,458.2,435.2C4108.4-3.1,4177.5-18.4,4210.1-35.7z M6733.3-261.9c26.8-44.1-191.7-1386.2-233.9-1428.4c-36.4-34.5-118.9-24.9-145.7,17.3c-15.3,24.9,5.8,197.5,92.1,709.4c61.3,372,118.9,692.1,130.4,711.3C6599.1-208.2,6702.6-215.9,6733.3-261.9z M4146.8-1059.5c32.6-21.1,159.1-153.4,283.8-295.3l226.3-258.8l228.2,46c220.5,44.1,232,46,299.1,13.4c134.2-65.2,161-243.5,47.9-339.4c-42.2-34.5-118.9-57.5-310.6-95.9c-377.7-76.7-400.7-72.9-548.4,69l-82.4,78.6v-272.3v-272.2h-268.4h-268.4v571.3c0,504.3,3.8,577.1,34.5,636.6C3857.3-1040.3,4024.1-984.7,4146.8-1059.5z M6725.6-1475.6v-412.2h-47.9h-47.9v197.5c0,207.1,57.5,627,86.3,627C6721.8-1063.3,6725.6-1249.3,6725.6-1475.6z M3297.4-1429.6c90.1-47.9,92-70.9,92-1349.8v-1198.3h-218.6c-297.2,0-377.7,36.4-454.4,201.3c-32.6,70.9-36.4,145.7-36.4,1064.1c0,621.2,7.7,1014.3,19.2,1058.3c24.9,90.1,93.9,172.6,176.4,212.8C2950.4-1404.6,3236.1-1397,3297.4-1429.6z M6946.1-2012.4c0-36.4-15.3-38.3-266.5-44.1c-270.3-5.8-314.4,3.8-293.4,63.3c11.5,24.9,49.9,28.8,285.7,24.9C6930.8-1974.1,6946.1-1976,6946.1-2012.4z M7285.5-2169.7c42.2-38.3,44.1-78.6,1.9-124.6c-28.8-32.6-90.1-34.5-1165.7-34.5c-855.1,0-1138.9,5.7-1156.1,23c-32.6,32.6-28.8,103.5,7.7,138c26.8,26.8,157.2,30.7,1152.3,30.7C7145.5-2137,7252.9-2140.9,7285.5-2169.7z M5224.3-2455.3c28.8-21.1,72.9-69,97.8-103.5c42.2-61.4,42.2-72.9,42.2-665.3v-600.1l-65.2-72.9c-63.3-67.1-72.9-70.9-184.1-70.9c-111.2,0-120.8,3.8-184.1,70.9l-65.2,72.9v450.6c0,366.2-5.7,450.6-26.8,450.6c-19.2,0-28.8,42.2-34.5,159.1c-9.6,157.2-42.2,251.2-99.7,299.1c-65.2,53.7-28.8,63.3,216.7,57.5C5136.1-2415.1,5176.4-2420.8,5224.3-2455.3z M5920.3-3168.6c0-567.5-5.8-768.8-23-786.1c-36.4-36.4-126.5-28.8-149.5,13.4c-11.5,24.9-19.2,306.8-19.2,786.1v749.7h95.9h95.9V-3168.6z M7147.4-3160.9c0-818.7,0-816.8-103.5-816.8c-88.2,0-88.2,3.8-88.2,809.1v763.1h95.9h95.9V-3160.9z M4526.4-2566.5c42.2-21.1,97.8-70.9,124.6-113.1c44.1-67.1,53.7-101.6,57.5-247.3l7.7-168.7h-625h-625.1v289.5v287.6l494.7-5.8C4399.9-2530.1,4461.2-2534,4526.4-2566.5z M4712.4-3529c0-203.3-7.7-350.9-21.1-375.8c-44.1-82.4-117-92-688.3-92h-536.9v402.6v402.6h623.1h623.1V-3529z"/>
      </g>
    </g>
  </svg>`

  let approvals;
  await $.get("https://distance.bridgetools.dev/api/courses/" + ENV.COURSE_ID + "/approval", data => {approvals = data});

  let items = await canvasGet('/api/v1/courses/' + ENV.COURSE_ID + '/modules?include[]=items&include[]=content_details');
  let contentNotApprovedColor = "rgb(76, 88, 96)";
  let contentApprovedColor = "rgb(11, 135, 75)";

  $('.ig-distance-approved').each(function () {
    $(this).remove();
  })
  for (let m = 0; m < items.length; m++) {
      let module = items[m];
      for (let i = 0; i < module.items.length; i++) {
          let item = module.items[i];
          if (item.url !== undefined && item.content_id > 0) {
              let itemLiElId = "context_module_item_" + item.id;
              let titleEl = $("#" + itemLiElId + " div.ig-info");
              let approved = false;
              for (let a = 0; a < approvals.length; a++) {
                  let approval = approvals[a];
                  if (approval.type == item.type && approval.content_id == item.content_id) {
                      approved = approval.approved;
                  }
              }
              let color = contentNotApprovedColor;
              if (IS_CDD && approved) color = contentApprovedColor;
              let distanceApprovedButton = $(`<span class="ig-distance-approved" style="cursor: pointer; float: right;"></span>`);
              let icon = $(workFromHomeIcon);
              icon.css("fill", color);
              distanceApprovedButton.append(icon);
              if (IS_CDD) {
                  distanceApprovedButton.click(function() {
                      let currentColor = icon.css("fill");
                      let approved = (currentColor == contentApprovedColor);
                      approved = !approved;
                      if (approved) icon.css("fill", contentApprovedColor);
                      if (!approved) icon.css("fill", contentNotApprovedColor);
                      $.post("https://distance.bridgetools.dev/api/courses/" + ENV.COURSE_ID + "/approval", {
                          title: item.title,
                          type: item.type,
                          content_id: item.content_id,
                          approved: approved
                      });
                  });
              }
              if (approved || IS_CDD) {
                titleEl.after(distanceApprovedButton);
              }
              let item_url = item.url.replace('/api/v1', '');
          }
      }
  }

})();