# Generate AI Rubric

This folder owns the Canvas "Generate Rubric with AI" feature.

- `index.js` is the browser entrypoint for the feature UI.
- `examples/` is for strong sample rubrics the AI should learn from.
- `rules.txt` is the canonical rulebook for strict generation rules, policy constraints, and prompt guardrails.

If this feature is enabled from `custom_canvas.js`, load it with:

```js
feature("rubrics/generate_ai_rubric/index", /^\/courses\/[0-9]+\/rubrics/);
```
