# Reporting V3

This folder contains the frontend for the Canvas Reporting V3 experience.

The current structure is:

- `Groups` -> top-level report categories such as `programs` and `avps`
- `Reports` -> submenu entries within a group such as `evaluations`, `cpl`, or `canvas-course-readiness`
- `Views` -> one or more renderable views within a report

At a high level, the system is registry-driven through `reports.json`, mounted by `main.js`, and rendered through Vue components in `reports/`.

## Folder Layout

- [`main.js`](./main.js)  
  App bootstrap. Loads utilities, the JSON registry, shared components, report scripts, and mounts the root Vue instance.

- [`reports.json`](./reports.json)  
  The report registry. Defines groups, reports, views, data source metadata, and filter metadata.

- [`template.vue`](./template.vue)  
  The main app shell template. Provides the sidebar UI for Groups, Reports, Views, and Filters.

- [`utils.js`](./utils.js)  
  Shared helpers for loading scripts, loading settings, normalizing settings, and resolving views.

- [`reports/`](./reports/)  
  Group shell components and view components.

- [`components/`](./components/)  
  Shared UI components used by views, such as the table component.

## Runtime Structure

### 1. `reports.json` is the source of truth

The app starts by loading `reports.json`, which contains a `reportTypes` array.

Each entry in `reportTypes` represents a `Group`. Example:

- `programs`
- `avps`

Each group can define:

- `value`
- `label`
- `title`
- `component`
- `source` (optional group-level default)
- `filters`
- `subMenus`

Each `subMenu` represents a `Report`. Example:

- `evaluations`
- `canvas-course-readiness`
- `placements`

Each report can define:

- `value`
- `label`
- `filter_by_year`
- `filters`
- `source`
- `include`
- `views`

Each `view` represents a specific renderable screen within a report. Example:

- `course-evaluations`
- `course-recommendations`
- `course-recommendation-tags`
- `initial`

Each view can define:

- `value`
- `label`
- `component`
- `source`
- `include`
- `filters`
- `required_filters`
- `filter_by_year`

## How Navigation Works

The left sidebar in `template.vue` is driven by the current selection state:

1. `Group` is selected from `reportTypes`
2. `Report` is selected from that group's `subMenus`
3. `View` is selected from that report's `views`

The selected values are stored in user settings and restored on load.

Settings shape:

```js
{
  reportType: "programs",
  subMenuByType: {
    programs: "evaluations"
  },
  viewByReport: {
    "programs::evaluations": "course-recommendations"
  },
  filters: {
    academic_year: "2026",
    programs: "ABC"
  }
}
```

## How Components Are Organized

There are two kinds of report components:

### 1. Group shell components

These are the top-level Vue components for a group:

- [`reports/reporting-v3-programs.js`](./reports/reporting-v3-programs.js)
- [`reports/reporting-v3-avps.js`](./reports/reporting-v3-avps.js)

These components:

- receive the current group/report/view metadata
- determine the active report and active view
- build request filters
- request data from `bridgetools.req3(...)`
- track loading/error state
- pass rows down into the active view component

Important: **the group shell owns the data fetch for the active view**.  
The view component usually receives already-fetched rows as props.

### 2. View components

These are the actual renderers for a specific view. Examples:

- [`reports/programs/reports-v3-programs--canvas-course-readiness--initial.js`](./reports/programs/reports-v3-programs--canvas-course-readiness--initial.js)
- [`reports/programs/reports-v3-programs--evaluations--course-recommendations.js`](./reports/programs/reports-v3-programs--evaluations--course-recommendations.js)
- [`reports/programs/reports-v3-programs--evaluations--course-recommendation-tags.js`](./reports/programs/reports-v3-programs--evaluations--course-recommendation-tags.js)

These components usually:

- accept `rows` and/or group-specific aliases like `programs` or `avps`
- normalize backend row data into display-friendly objects
- define table columns
- optionally emit additional view-level filter controls

## Data Source Model

The current data-source model is:

- a view points to a `source`
- a view may also point to an `include`

Examples:

- `source: "programs"`
- `include: "canvas_course_readiness"`
- `source: "programs__course_eval_rec_tags"`
- `include: "ai_summary"`

This means the frontend is generally expecting one of these patterns:

1. A base endpoint such as `programs` or `avps`
2. A source that already represents an extension-style dataset such as `programs__course_eval_rec_tags`
3. An `include` value that requests related/extended fields from the API

In practice, the request flow in the group shell looks like:

```js
const options = include ? { include: [include] } : undefined;
const data = await bridgetools.req3(source, filters, options);
```

## Filter Model

There are currently two kinds of filters:

### 1. Shared shell filters

These are built by `main.js` and shown in the Filters tab of the sidebar.

Examples:

- `academic_year`
- `programs`
- `avps`

These come from metadata on the current group, report, or view.

Priority is:

1. `currentViewMeta.filters`
2. `currentSubMenuMeta.filters`
3. `currentReportMeta.filters`

If a report or view has `filter_by_year`, the `academic_year` filter is automatically included.

### 2. View-level filters

Some views provide their own additional filters by emitting:

```js
this.$emit("filter-controls-change", controls);
```

Example: the course recommendations view emits a multiselect for recommendation tags.

These emitted controls are merged into the sidebar filter list by `main.js`.

## Required Filters

Some views require a filter before loading data.

Example:

- `course-recommendation-tags` requires `programs`

This is declared in `reports.json` with:

```json
"required_filters": ["programs"]
```

The `programs` group shell checks for missing required filters before making the API request. If required filters are missing, it skips the request and returns an empty row set for that view.

## Naming Conventions

The file naming convention mirrors the hierarchy.

Examples:

- `reporting-v3-programs.js`
- `reports-v3-programs--canvas-course-readiness--initial.js`
- `reports-v3-programs--evaluations--course-recommendations.js`

Pattern:

```text
reports-v3-{group}--{report}--{view}.js
```

For group shell files:

```text
reporting-v3-{group}.js
```

This makes it easy to match:

- registry entry in `reports.json`
- Vue component name
- file location on disk

## Component Loading

`main.js` loads component scripts dynamically based on the registry.

It:

1. loads shared utilities
2. loads `reports.json`
3. loads shared UI components
4. loads each group shell component
5. loads each view component referenced in the registry
6. mounts the root Vue instance

The script path for a view is built from:

- the component name
- the group name

That is why view files live in group folders such as:

- `reports/programs/`
- `reports/avps/`

## Data Flow Summary

The current data flow is:

1. `main.js` loads registry and app shell
2. user selects a Group
3. user selects a Report
4. user selects a View
5. root app resolves current metadata and filters
6. root app renders the group's shell component
7. group shell determines the active view's `source` and `include`
8. group shell builds request filters
9. group shell fetches rows from `bridgetools.req3(...)`
10. group shell passes rows, loading state, error state, and selected filters into the view component
11. view component renders the report

## Current Design Notes

This README describes the system **as it currently works**:

- `reports.json` defines the reporting catalog
- group shell components own the fetch lifecycle
- view components mostly focus on presentation and row normalization
- filters are stored in shared user settings and reused across views
- some views can add their own extra filter controls dynamically

## Adding a New View

At the current stage, adding a new view typically means:

1. add the view entry to `reports.json`
2. create the Vue component file in the correct `reports/{group}/` folder
3. register the component with the exact name referenced in `reports.json`
4. define the view's `source`, `include`, and any `filters`
5. if needed, normalize the returned row shape inside the view component

## Quick Reference

- Registry: [`reports.json`](./reports.json)
- App bootstrap: [`main.js`](./main.js)
- Shared helpers: [`utils.js`](./utils.js)
- Shell template: [`template.vue`](./template.vue)
- Programs group shell: [`reports/reporting-v3-programs.js`](./reports/reporting-v3-programs.js)
- AVPs group shell: [`reports/reporting-v3-avps.js`](./reports/reporting-v3-avps.js)

