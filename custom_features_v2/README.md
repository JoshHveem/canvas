# Custom Features v2

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

Feature folders are always direct children of `custom_features_v2`; nested feature folders are not used. The initial migration is a parallel copy of the existing feature implementations. The legacy `custom_features/` tree remains available to the existing loader and to any v2 feature that still has legacy asset URLs.
