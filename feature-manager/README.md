# Canvas Feature Manager

This local Node application discovers v2 features from `custom_features_v2/**/main.js`. `features.json` stores only the loading settings for those folders.

## Use

Double-click `Launch Canvas Feature Manager.bat`. It installs dependencies when needed, starts the local server, and opens `http://localhost:4173`.

Alternatively:

1. Run `npm install` once from this folder.
2. Run `npm run import:v2` once to seed `features.json` from the current `scripts_v2.js` registry.
3. Run `npm start`, then open `http://localhost:4173`.
4. Save changes, then choose **Build loaders**.

Create a feature by adding `custom_features_v2/<feature-name>/main.js`. It appears in the manager automatically the next time the manager is opened. The build writes both `../scripts_v2.generated.js` (readable) and `../scripts_v2.min.js` (production). `custom_canvas_v2.js` loads the minified file.

Some folders have more than one loading rule, such as separate teacher and student variants. The manager shows each rule separately while keeping them under that folder's settings.

The manager never commits or pushes. Review the generated changes and use the existing Git workflow to deploy them.
