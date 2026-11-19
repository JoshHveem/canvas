# Custom Features v2

This is the canonical implementation of Canvas features. Both `custom_canvas.js` and `custom_canvas_v2.js` enter the v2 loader; the legacy `custom_features/` tree and `scripts.js` are retained for reference and are no longer loaded by the theme.

Each feature registered in `feature-manager/features.json` has one entry module here:

```text
custom_features_v2/<feature_name>/main.js
```

`main.js` is the source entry point. Add feature-local modules beside it and import them with standard relative imports, for example:

```js
import { initialise } from './ui.js';

initialise();
```

The feature manager bundles each feature to `main.bundle.js` when it builds the v2 loader. Canvas loads that classic bundle, preserving compatibility with Bridgetools' cross-origin asset host while still allowing standard imports in source files. Do not edit `main.bundle.js` directly.

The combined reports feature also builds `components/report-mixins.js` and `components/report-table-shell.js` from their `.entry.js` sources. The table shell bundles its required anonymization mixin so it can load alongside a cached main bundle. Edit the entry sources and rebuild; do not edit these generated files directly.

Feature folders are always direct children of `custom_features_v2`. `shared/` holds modules imported by features and has no `main.js`, so it is not registered as a feature. Import shared utilities explicitly; features must not rely on helpers from the legacy loader. The editor toolbar bundles its core, formatting, image, and header modules under `editor_toolbar/`.

Make feature changes only in this tree and rebuild through `npm run build` in `feature-manager/`. Keep feature loading rules in `feature-manager/features.json`; preserve disabled features and existing role/course restrictions. The v2 loader owns `canvasGet` and the jQuery mutation helpers. DOM readiness, ID generation, number formatting, and module-menu utilities live in `shared/`.
