(function () {
  //EDIT THIS ONCE THE GOOGLE LINKED SURVEYS ARE SET UP TO AUTO CREATE AN PROPERLY FORMATTED ASSIGNMENT WITH THE SURVEY EMBEDDED IN IT
  IMPORTED_FEATURE = {};
  if (true) {
    IMPORTED_FEATURE = {
      initiated: false,
      _init(params = {}) {
        addToModuleMenu("Add Course Survey", "Add a link to the course survey.", this.addSurvey);
      },
      addSurvey() {
        console.log("add survey");
      }
    }
  }
})();