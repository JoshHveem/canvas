const route = source => ({ source, flags: '' });

export const locations = [
  ['dashboard', 'Global', 'Dashboard', '^\\/$'],
  ['inbox', 'Global', 'Inbox', '^\\/conversations$'],
  ['user_profile', 'Global', 'User profile', '^\\/users\\/[0-9]+$'],
  ['account', 'Account', 'Account overview', '^\\/accounts\\/[0-9]+$'],
  ['account_user', 'Account', 'Account user profile', '^\\/accounts\\/[0-9]+\\/users\\/[0-9]+$'],
  ['any_user', 'Account', 'Any user profile', '^\\/(?:accounts\\/[0-9]+\\/)?users\\/[0-9]+'],
  ['course_any', 'Course', 'Course', '^\\/courses\\/[0-9]+(?:\\/.*)?$'],
  ['modules', 'Course', 'Modules', '^\\/courses\\/[0-9]+(?:\\/modules)?$', 'course_any'],
  ['content_any', 'Course', 'Content', '^\\/courses\\/[0-9]+\\/(pages|assignments|quizzes|discussion_topics)', 'course_any'],
  ['content_edit', 'Course content', 'Content editor', '^\\/courses\\/[0-9]+\\/(pages|assignments|quizzes|discussion_topics)\\/.+?\\/edit', 'content_any'],
  ['content_view', 'Course content', 'Content view (not editor)', '^\\/courses\\/[0-9]+\\/(pages|assignments|quizzes|discussion_topics)\\/(?!.+?\\/edit$).+', 'content_any'],
  ['assignments', 'Course', 'Assignments', '^\\/courses\\/[0-9]+\\/assignments', 'course_any'],
  ['assignment_submission', 'Course', 'Assignment submission', '^\\/courses\\/[0-9]+\\/assignments\\/[0-9]+\\/submissions\\/[0-9]+', 'assignments'],
  ['files', 'Course', 'Files', '^\\/courses\\/[0-9]+\\/files', 'course_any'],
  ['grades', 'Course', 'Grades', '^\\/courses\\/[0-9]+\\/grades(?:\\/[0-9]+)?$', 'course_any'],
  ['student_grades', 'Course', 'Individual student grades', '^\\/courses\\/[0-9]+\\/grades\\/[0-9]+', 'grades'],
  ['gradebook', 'Course', 'Gradebook', '^\\/courses\\/[0-9]+\\/gradebook$', 'course_any'],
  ['gradebook_user', 'Course', 'Individual gradebook user', '^\\/courses\\/[0-9]+\\/gradebook\\/[0-9]+', 'gradebook'],
  ['speed_grader', 'Course', 'SpeedGrader', '^\\/courses\\/[0-9]+\\/gradebook\\/speed_grader', 'gradebook'],
  ['quiz', 'Course', 'Quiz', '^\\/courses\\/[0-9]+\\/quizzes\\/[0-9]+', 'course_any'],
  ['quiz_edit', 'Course', 'Quiz editor', '^\\/courses\\/[0-9]+\\/quizzes\\/[0-9]+\\/edit', 'quiz'],
  ['quiz_take', 'Course', 'Take quiz', '^\\/courses\\/[0-9]+\\/quizzes\\/[0-9]+\\/take', 'quiz'],
  ['quiz_statistics', 'Course', 'Quiz statistics', '^\\/courses\\/[0-9]+\\/quizzes\\/[0-9]+\\/statistics', 'quiz'],
  ['rubrics', 'Course', 'Rubrics', '^\\/courses\\/[0-9]+\\/rubrics$', 'course_any'],
  ['sections', 'Course', 'Section', '^\\/courses\\/[0-9]+\\/sections\\/[0-9]+', 'course_any'],
  ['settings', 'Course', 'Settings', '^\\/courses\\/[0-9]+\\/settings', 'course_any'],
  ['people', 'Course', 'People', '^\\/courses\\/[0-9]+\\/users$', 'course_any'],
  ['course_user', 'Course', 'Course user profile', '^\\/courses\\/[0-9]+\\/users\\/[0-9]+$', 'people'],
  ['question_banks', 'Course', 'Question banks', '\\/courses\\/([0-9]+)\\/question_banks$', 'course_any'],
  ['question_bank', 'Course', 'Question bank', '\\/courses\\/([0-9]+)\\/question_banks\\/([0-9]+)', 'question_banks'],
  ['external_tool', 'Course', 'External tool', '^\\/courses\\/([0-9]+)\\/external_tools\\/([0-9]+)', 'course_any']
].map(([id, group, label, source, parent]) => ({ id, group, label, route: route(source), parent }));

const byId = new Map(locations.map(item => [item.id, item]));
const byRoute = new Map(locations.map(item => [`${item.route.source}/${item.route.flags}`, item.id]));

export function routesForLocations(ids = []) {
  return ids.map(id => byId.get(id)?.route).filter(Boolean).map(item => ({ ...item }));
}

export function splitRoutePresets(routes) {
  const list = routes ? (Array.isArray(routes) ? routes : [routes]) : [];
  const locations = [];
  const custom = [];
  for (const item of list) {
    const id = byRoute.get(`${item.source}/${item.flags || ''}`);
    if (id) locations.push(id); else custom.push(item);
  }
  return { locations, custom: custom.length === 1 ? custom[0] : custom.length ? custom : undefined };
}
