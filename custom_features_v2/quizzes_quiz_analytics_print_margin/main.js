// Very micro edit that can be gotten rid of as soon as Canvas fixes their print styles.
// Currently if you print on the analytics page it is cut off on th left, so adding a little margin.
console.log('test');
$("<style>", {
  media: "print",
  text: "#content { margin-left: 2rem !important; }"
}).appendTo("head");