# Repository Instructions

These instructions apply to the whole repository.

## High-Stakes Files

- Do not change `custom_canvas.js` unless the user explicitly asks for or approves that specific file change.
- Do not bump `window.BTECH_CANVAS_ASSET_VERSION` unless the user explicitly asks for a cache/version bump.
- If a requested feature appears to require `custom_canvas.js`, explain why and wait for explicit permission before editing it.

## Canvas Feature Work

- Prefer feature-specific files under `custom_features/` for behavior, UI, templates, and Canvas API workflows.
- Keep Canvas page/body rendering changes scoped to the owning feature folder when possible.
- Preserve existing Canvas page content unless the user explicitly asks to replace or reseed it.
- When adding feature UI, guard against duplicate insertion with stable IDs, attributes, or existing-element checks.

## Canvas Wiki HTML

- Saved Canvas wiki/page bodies must follow the Canvas HTML Editor allowlist: https://community.instructure.com/en/kb/articles/387066-canvas-html-editor-allowlist
- Do not put `<script>`, external `<link>`, event handler attributes such as `onclick`, or unsupported tags into saved wiki/page bodies.
- Prefer allowlisted semantic HTML with inline `style` attributes for page templates. Keep styles within Canvas-allowed properties.
- Do not rely on `position: fixed` or `position: sticky` in saved Canvas content; Canvas strips those values.
- Arbitrary `data-*` attributes are generally acceptable for managed content markers, but avoid Canvas-stripped Rails-style attributes such as `data-url`, `data-method`, `data-remove`, `data-remote`, `data-confirm`, and `data-disable-with`.
- Treat runtime DOM injected by custom JavaScript and saved wiki body HTML as different surfaces: runtime UI can use richer behavior, but anything persisted to Canvas must survive the allowlist.

## Async And Page Loading

- Wrap feature files in an async IIFE or equivalent scoped initializer so they can `await` Canvas/API readiness without leaking globals.
- Use existing helpers such as `getElement(selector)` when waiting for Canvas-rendered elements that may arrive late.
- For Canvas areas that re-render after navigation, filtering, or tab changes, prefer a scoped `MutationObserver` with duplicate-insertion guards over fixed delays.
- Avoid blind `setTimeout` waits for page readiness. Use timeouts mainly for debouncing, animations, toasts, or retry backoff with a clear stop condition.
- Guard all page-specific behavior by path, course ID, role, and required DOM elements before mutating the page.
- When loading dependent scripts, `await` required libraries before features that use them. Use `window.btechAssetUrl(...)` for cache-aware asset URLs when available.

## Canvas API And Page Updates

- Use Canvas API calls with `credentials: "include"` and include the CSRF token for mutating requests when using `fetch`.
- Handle paginated Canvas API responses when listing modules, pages, users, files, or other potentially long collections.
- For visible Canvas page updates, prefer replacing only the managed section marked by a stable attribute. Back up or preserve existing page body content before full-page replacement.
- When creating related Canvas objects, make saves retry-safe: check for existing pages/module items before creating duplicates.
- Keep destructive behavior conservative. Prefer unpublishing or archiving Canvas content unless the user explicitly asks for deletion.

## Git

- Do not commit or push unless the user explicitly asks.
- Before editing, check the working tree and avoid overwriting unrelated user changes.
