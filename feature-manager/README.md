# Canvas Feature Manager

This local Node application makes `features.json` the v2 feature registry's source of truth.

## Use

Double-click `Launch Canvas Feature Manager.bat`. It installs dependencies when needed, starts the local server, and opens `http://localhost:4173`.

Alternatively:

1. Run `npm install` once from this folder.
2. Run `npm run import:v2` once to seed `features.json` from the current `scripts_v2.js` registry.
3. Run `npm start`, then open `http://localhost:4173`.
4. Save changes, then choose **Build loaders**.

The build writes both `../scripts_v2.generated.js` (readable) and `../scripts_v2.min.js` (production). `custom_canvas_v2.js` loads the minified file.

Each feature's routes are stored as JSON regular-expression objects. Advanced settings holds all other feature controls, including role flags, course and department IDs, dependencies, and priority.

The manager never commits or pushes. Review the generated changes and use the existing Git workflow to deploy them.
