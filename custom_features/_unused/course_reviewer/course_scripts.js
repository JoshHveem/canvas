function calcCourseAssignmentCounts(assignmentReviews) {
  let counts = {
    includes_outcomes: 0,
    chunked_content: 0,
    career_relevance: 0,
    provides_feedback: 0,
    modeling: 0,
    clarity: 0,
    aligned_to_objectives: 0,
    num_reviews: 0,
  };
  for (let a in assignmentReviews) {
    let assignment = assignmentReviews[a];
    if (assignment.ignore) continue;

    // other scores
    if (assignment.includes_outcomes !== undefined) counts.includes_outcomes += assignment.includes_outcomes ? 1 : 0;
    if (assignment.chunked_content !== undefined) counts.chunked_content += assignment.chunked_content ? 1 : 0;
    if (assignment.career_relevance !== undefined) counts.career_relevance += assignment.career_relevance? 1 : 0;
    if (assignment.provides_feedback !== undefined) counts.provides_feedback += assignment.provides_feedback? 1 : 0;
    if (assignment.modeling !== undefined) counts.modeling += assignment.modeling ? 1 : 0;
    if (assignment.clarity !== undefined) counts.clarity += assignment.clarity;
    if (assignment?.objectives ?? [] > 0) counts.aligned_to_objectives += 1;
    counts.num_reviews += 1;
  }
  return counts;
}

function calcCourseAssignmentScore(counts) {
  let total = counts.clarity 
    + counts.chunked_content 
    + counts.includes_outcomes 
    + counts.career_relevance 
    + counts.provides_feedback 
    + counts.modeling
    + counts.aligned_to_objectives
  ;
  total /= (8 * counts.num_reviews);
  return total;
}

function calcCourseRubricCounts(rubricReviews) {
  let counts = {
    criteria: 0,
    granularity: 0,
    grading_levels: 0,
    writing_quality: 0,
    num_reviews: 0,
  };
  for (let r in rubricReviews) {
    let rubric = rubricReviews[r];
    if (rubric.ignore) continue;

    // other scores
    if (rubric.criteria !== undefined) counts.criteria += rubric.criteria;
    if (rubric.granularity !== undefined) counts.granularity += rubric.granularity ;
    if (rubric.grading_levels !== undefined) counts.grading_levels += rubric.grading_levels;
    if (rubric.writing_quality !== undefined) counts.writing_quality += rubric.writing_quality;
    counts.num_reviews += 1;
  }
  return counts;
}

function calcCourseRubricScore(counts) {
  let total = counts.criteria
    + counts.granularity 
    + counts.grading_levels
    + counts.writing_quality;
  total /= (8 * counts.num_reviews);
  return total;
}

function calcCoursePageCounts(pageReviews) {
  let counts = {
    includes_outcomes: 0,
    chunked_content: 0,
    career_relevance: 0,
    supporting_media: 0,
    clarity: 0,
    aligned_to_objectives: 0,
    num_reviews: 0 
  }
  for (let o in pageReviews) {
    let page = pageReviews[o];
    if (page.ignore) continue;
    // other scores
    if (page.includes_outcomes !== undefined) counts.includes_outcomes += page.includes_outcomes ? 1 : 0;
    if (page.chunked_content !== undefined) counts.chunked_content += page.chunked_content ? 1 : 0;
    if (page.career_relevance !== undefined) counts.career_relevance += page.career_relevance? 1 : 0;
    if (page.supporting_media !== undefined) counts.supporting_media += page.supporting_media? 1 : 0;
    if (page.clarity !== undefined) counts.clarity += page.clarity;
    if (page?.objectives ?? [] > 0) counts.aligned_to_objectives += 1;
    counts.num_reviews += 1;
  }
  return counts;
}

function calcCoursePageScore(counts) {
  let total = counts.clarity 
    + counts.chunked_content 
    + counts.includes_outcomes 
    + counts.career_relevance 
    + counts.supporting_media
    + counts.aligned_to_objectives
  ;
  total /= (7 * counts.num_reviews);
  return total;
}

function calcCourseCriteriaCounts(data) {
  let counts = {
    num_reviews: 0,
  };
  for (let criterion in data.criteria) {
    let val = data.criteria.criterion;
    if (counts?.[criterion] == undefined) counts[criterion] = 0;
    if (typeof val == 'boolean') counts[criterion] += val ? 1 : 0;
    if (typeof val == 'number') counts[criterion] +=  val;
  }
}

function calcCourseQuizCounts(quizReviews) {
  counts = {
    clarity: 0,
    includes_outcomes: 0,
    chunked_content: 0,
    career_relevance: 0,
    instructions: 0,
    preparation: 0,
    aligned_to_objectives: 0,
    num_reviews: 0,
  };
  for (let q in quizReviews) {
    let quiz = quizReviews[q];
    if (quiz.ignore) continue;

    // // other scores
    if (quiz.includes_outcomes !== undefined) counts.includes_outcomes += quiz.includes_outcomes ? 1 : 0;
    if (quiz.chunked_content !== undefined) counts.chunked_content += quiz.chunked_content ? 1 : 0;
    if (quiz.career_relevance !== undefined) counts.career_relevance += quiz.career_relevance ? 1 : 0;
    if (quiz.instructions !== undefined) counts.instructions += quiz.instructions ? 1 : 0;
    if (quiz.preparation !== undefined) counts.preparation += quiz.preparation ? 1 : 0;
    if (quiz.clarity !== undefined) counts.clarity += quiz.clarity;
    if (quiz?.objectives ?? [] > 0) counts.aligned_to_objectives += 1;
    counts.num_reviews += 1;
  }
  return counts;
}

function calcCourseQuizScore(counts) {
  let total = counts.clarity 
    + counts.chunked_content 
    + counts.includes_outcomes 
    + counts.career_relevance 
    + counts.instructions 
    + counts.preparation
    + counts.aligned_to_objectives
  ;
  total /= (8 * counts.num_reviews);
  return total;
}

function calcCourseContentCounts(reviews, criteria) {
  counts = {
    aligned_to_objectives: 0,
    num_reviews: 0
  }
  for (let r in reviews) {
    let review = reviews[r];
    if (review.active) continue;
    let hasScores = false;
    for (let name in review.criteria) {
      let criterion = criteria?.[name];
      let score = review.criteria[name];
      if (score == undefined) continue;
      hasScores = true;
      if (counts?.[name] === undefined) counts[name] = 0;
      if (criterion === undefined) continue;
      if (criterion.score_type === 'boolean') counts[name] += score ? 1 : 0;
      if (criterion.score_type === 'number') counts[name] += score / 2; //get the actual value
    }
    for (let name in review.additional_criteria) {
      let criterion = criteria[name];
      let score = review.criteria[name];
      if (score == undefined) continue;
      hasScores = true;
      if (counts?.[name] === undefined) counts[name] = 0;
      counts[name] += score; //get the actual value
    }
    if (hasScores) {
      if (review?.objectives ?? [] > 0) counts.aligned_to_objectives += 1;
      counts.num_reviews += 1;
    }
  }
  return counts;
}

function calcCourseContentScore(reviews, criteria) {
  let counts = calcCourseContentCounts(reviews, criteria);
  let numReviews = counts.num_reviews;
  let total = 0;
  for (let name in counts) {
    if (name == 'num_reviews') continue;
    let count = counts[name];
    total += count;
  }
  total /= (Object.keys(counts).length * numReviews);
  return total;
}



function calcCourseScore(
  courseReviewData, criteria
) {
  let pageCounts = calcCourseContentCounts(courseReviewData.pages, criteria.Pages);
  let quizCounts = calcCourseContentCounts(courseReviewData.quizzes, criteria.Quizzes);
  let assignmentCounts = calcCourseContentCounts(courseReviewData.assignments, criteria.Assignments);
  let rubricCounts = calcCourseContentCounts(courseReviewData.rubrics, criteria.Rubrics);
  let moduleCounts = calcCourseContentCounts(courseReviewData.modules, criteria.Modules);
  let score = 0;
  let pageScore = pageCounts.num_reviews > 0 ? (calcCourseContentScore(courseReviewData.pages, criteria.Pages) * pageCounts.num_reviews) : 0;
  let quizScore = quizCounts.num_reviews > 0 ? (calcCourseContentScore(courseReviewData.quizzes, criteria.Quizzes) * quizCounts.num_reviews) : 0;
  let assignmentScore = assignmentCounts.num_reviews > 0 ? (calcCourseContentScore(courseReviewData.assignments, criteria.Assignments) * assignmentCounts.num_reviews) : 0;
  let rubricScore = rubricCounts.num_reviews > 0 ? (calcCourseContentScore(courseReviewData.rubrics, criteria.Rubrics) * rubricCounts.num_reviews) : 0;
  let moduleScore = moduleCounts.num_reviews > 0 ? calcCourseContentScore(courseReviewData.modules, criteria.Modules) : 0;
  let totalItems = quizCounts.num_reviews + assignmentCounts.num_reviews + pageCounts.num_reviews;
  let contentScore = totalItems > 0 ? (quizScore + ((assignmentScore + rubricScore) / 2) + pageScore) / totalItems : 0;
  score = (contentScore + moduleScore) / 2
  return score; 
}