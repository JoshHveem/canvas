//HIDE ALL INACTIVE STUDENTS
//More Details https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
// select the target node
var target = document.querySelector('.v-gutter')
// create an observer instance
var observer = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		$(".rosterUser").each(function() {
			let row = $(this);
			let cell = $(row.find('td')[1]);
			if (cell.find('span.label').text()==='inactive') row.hide();
		});  
	})
});
// configuration of the observer:
var config = { childList: true, characterData: true, subtree: true };
// pass in the target node, as well as the observer options
observer.observe(target, config);
