# AI Hub Plan

## Summary
Create a planning record for the AI Hub editor before implementation begins. This document preserves the current architecture and product decisions while leaving `ai_hub.js` untouched for now.

## Architecture
The AI Hub editor should use one master editor shell with three compartmentalized editors:

- Courses
- Featured Resources
- Upcoming Events

The master shell owns shared editor concerns:

- Permission checks
- Overlay open and close behavior
- Loading and saving the hidden JSON model
- Preview updates
- Validation summary
- Canvas API save flow
- Local backup and recovery support

Each section editor should focus only on collecting structured data for its own section. Styling, insertion, and Canvas persistence should live outside the editor UI.

## Layer Separation
Keep the implementation split into clear layers:

- Editor modules collect structured data.
- Model functions update the hidden JSON source of truth.
- Renderer functions generate Canvas-safe inline HTML.
- Canvas API functions save the generated managed region back to the Canvas page.

The editor should call functions such as `addCourse(courseData)`, `addFeaturedResource(resourceData)`, and `addEvent(eventData)`. Those functions update the model, then the renderer regenerates the managed HTML.

## Product Decisions
- Gate the feature by the shared course id config from `window.AIHubConfig.courseId`, Canvas `ENV.COURSE_ID`, or the current `/courses/[id]` URL.
- Show the editor only on pages that contain the AI Hub managed-region marker.
- Restrict editing to AI/admin users.
- Store the editable source of truth as hidden JSON inside the Canvas page.
- Use a manual Save button; field changes may update the preview, but should not auto-save to Canvas.
- Save a local backup of the previous page body before writing changes.
- Do not add image controls in v1.

## Section Requirements
### Courses
Editors can add, edit, delete, and reorder course cards.

Course fields:

- Emoji/icon selected from an approved list
- Title with character count
- One-sentence description with character count
- Format: Self-Paced or Live Cohort
- External Canvas/course link

Courses are links to course content outside this Canvas course.

### Featured Resources
Editors can add, edit, delete, and reorder featured resource cards.

Featured resource fields:

- Emoji/icon selected from an approved list
- Title with character count
- One-sentence description with character count
- Resource/document link

Creating a featured resource should also create a Canvas page from a template. The resource card should link to the generated Canvas page so context, an instructional video, and the linked resource can live there.

### Upcoming Events
Editors can add, edit, delete, and reorder upcoming events.

Event fields:

- Date selected with a calendar/date picker UI
- Title
- Time
- Location type: Online or room number
- Booking/calendar link

Events should archive automatically after the event date passes.

## Phased TODOs
Work slowly and verify each phase before moving to the next one.

### Phase 1: Console Prototype
- [ ] Build temporary console snippets that can locate the AI Hub page content in the DOM.
- [ ] Identify the exact managed-region marker and rendered-content container strategy.
- [ ] Test DOM organization helpers from the console, including selecting the rendered hub, reading hidden JSON, and replacing only the rendered region.
- [ ] Prototype simple editor tab markup in the DOM from the console so we can evaluate how the editing UI should attach to the page.
- [ ] Confirm the editor shell can be added and removed without damaging the Canvas page content.

### Phase 2: API Save Spike
- [ ] From the console, identify the current course ID and page slug/API URL.
- [ ] Fetch the Canvas page body through the Canvas API.
- [ ] Replace only the AI Hub managed region in the fetched HTML.
- [ ] Save the updated body back through the Canvas API.
- [ ] Verify a reload shows the updated managed region and preserves unrelated page content.
- [ ] Add a local backup step for the previous page body before saving.

### Phase 3: Minimal Repo Harness
- [ ] Move only the proven console helpers into `ai_hub.js`.
- [ ] Keep the first repo version small: feature gate, permission gate, managed-region detection, basic overlay shell, and save helper.
- [ ] Add no section-specific editors yet.
- [ ] Verify the loaded feature behaves the same as the console prototype.

### Phase 4: Courses Editor
- [ ] Add the Courses tab inside the shared editor shell.
- [ ] Support add, edit, delete, and reorder for course cards.
- [ ] Add emoji/icon selection from an approved list.
- [ ] Add title and one-sentence description fields with character counts.
- [ ] Add format selection for Self-Paced or Live Cohort.
- [ ] Add external Canvas/course link validation.
- [ ] Update the model through course-specific functions, then let the renderer rebuild the courses section.

### Phase 5: Upcoming Events Editor
- [ ] Add the Upcoming Events tab inside the shared editor shell.
- [ ] Support add, edit, delete, and reorder for events.
- [ ] Add date picker/calendar UI.
- [ ] Add title, time, location type, room number or online location, and booking/calendar link fields.
- [ ] Archive events automatically after the event date passes.
- [ ] Keep archived events out of the rendered upcoming events section unless a later phase adds archive display controls.

### Phase 6: Featured Resources Editor
- [ ] Add the Featured Resources tab inside the shared editor shell.
- [ ] Support add, edit, delete, and reorder for resource cards.
- [ ] Add emoji/icon selection, title, one-sentence description, and resource/document link fields.
- [ ] Create a Canvas page from a resource template when a new featured resource is created.
- [ ] Store the generated Canvas page URL in the resource model.
- [ ] Render the resource card so it links to the generated Canvas page.

### Phase 7: Polish and Guardrails
- [ ] Add clear validation messages before save.
- [ ] Add save status states: unsaved, saving, saved, and failed.
- [ ] Add restore/copy backup affordance if a save goes wrong.
- [ ] Confirm unauthorized users never see editor controls.
- [ ] Confirm saved Canvas content still contains inline HTML only, with no saved JavaScript or external CSS dependency inside the managed region.

## Assumptions
- This file is planning documentation only.
- Implementation will happen later in `ai_hub.js` and any supporting files.
- The managed Canvas page will remain static inline HTML with no saved JavaScript and no external CSS dependency inside the managed region.
