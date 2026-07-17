$(".tool_content_wrapper").css("position", "relative");
let expandButton = $(`<i 
    class="icon-student-view"
    data-expanded="false"
    style="position: absolute; right: .5rem; top: .5rem; z-index=999999; font-size=2rem; background-color: #FFFFFF; padding: .25rem; padding-bottom: .125rem; margin: 0px; border-radius: 2rem; cursor: pointer; border: 1px solid black; color: black;">
    </i>`);
$(".tool_content_wrapper").append(expandButton);
expandButton.click(()=> {
    let expanded = expandButton.attr("data-expanded") == 'true';
    if (expanded) {
        $(".tool_content_wrapper").css({
            'position': 'relative',
            'width': '',
            'height': '',
            'left': '',
            'top': '',
            'z-index': ''
        });
    }
    
    if (!expanded) {
        $("#content").css({
            'position': 'relative',
        });
        $(".tool_content_wrapper").css({
            'position': 'fixed',
            'width': 'calc(100% - ' + $(".ic-app-header__main-navigation").width() + 'px)',
            'height': '100%',
            'left': $(".ic-app-header__main-navigation").width() + 'px',
            'top': '0px',
            'z-index': 100000000
        });
    }
    expandButton.attr("data-expanded", !expanded);
});
