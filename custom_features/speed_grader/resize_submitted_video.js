
function resizeVideo() {
    let container = $("#speedgrader_iframe").contents().find("#media_recording_box");
        container.width("100%");
        let videoDiv = $("#speedgrader_iframe").contents().find(".mejs-video");
        videoDiv.width("100%");
        let width = videoDiv.width();
        videoDiv.height(videoDiv.width() * .66);
        let videoEl = $("#speedgrader_iframe").contents().find("video");
        videoEl.width(width);
        videoEl.height(videoEl.width() * .66);
        videoEl.css({
            "width": videoEl.width(),
            "height": videoEl.height()
        });
        let layers = videoDiv.find(".mejs-layer");
        layers.each(function() {
            let el = $(this);
            el.width(width);
            el.height($(this).width() * .66);
            el.css({
                "width": el.width(),
                "height": el.height()
            });
        });
    }
    let left = $("#left_side")[0];
    let resizeObserver = new ResizeObserver(() => { 
        resizeVideo();
    }); 
      
    resizeObserver.observe(left);