import { formatting, formattingUtils } from './report-formatting.js';
import { tables, tablesUtils } from './report-tables.js';
import { filters } from './report-filters.js';
import { datasets, datasetsUtils } from './report-datasets.js';
import { canvasProfiles } from './report-canvas-profiles.js';
import { requests } from './report-requests.js';
import { departmentScoped } from './report-department-scope.js';
import { programScoped } from './report-program-scope.js';
import { yearSummary } from './report-year-summary.js';
import { evaluationSummary, evaluationDetail } from './report-evaluations.js';
import { students } from './report-students.js';
import { labels } from './report-labels.js';
import { dates } from './report-dates.js';
import { cplMetrics } from './report-cpl-metrics.js';

// Public adapters used by reports registered through dynamically loaded scripts.
// Keep composition here; each module owns one responsibility.
window.ReportUtils = { ...formattingUtils, ...tablesUtils, ...datasetsUtils };
window.ReportMixins = {
  requests,
  formatting,
  tables,
  filters,
  datasets,
  canvasProfiles,
  evaluationSummary,
  evaluationDetail,
  students,
  labels,
  dates,
  cplMetrics,
  departmentScoped,
  programScoped,
  yearSummary
};
