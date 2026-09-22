# Custom Features v2

Each feature registered in `feature-manager/features.json` has one entry module here:

```text
custom_features_v2/<feature_name>/main.js
```

The v2 loader loads `main.js` as an ES module. Add feature-local modules beside it and import them with standard relative imports, for example:

```js
import { initialise } from './ui.js';

initialise();
```

Feature folders are always direct children of `custom_features_v2`; nested feature folders are not used. The initial migration is a parallel copy of the existing feature implementations. The legacy `custom_features/` tree remains available to the existing loader and to any v2 feature that still has legacy asset URLs.
