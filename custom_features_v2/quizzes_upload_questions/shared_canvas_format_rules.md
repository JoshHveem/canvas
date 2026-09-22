Canvas question-bank JSON rules:

- Before creating the JSON file, scan the quiz for question types that are not supported by this uploader.
- Supported output question types are only: multiple choice, multiple answers, essay, true/false, matching, text-only, fill in multiple blanks, and file upload.
- Unsupported question types include ordering, ranking, sequencing, hotspot/image-click, drag-and-drop, formula questions, numeric questions, Likert/survey scales, or any question where the required interaction cannot be represented by the supported output types.
- If any unsupported question type appears, do not create the JSON file yet.
- Instead, stop and tell the user: "I found one or more question types this uploader cannot create yet."
- List the unsupported question number(s), briefly explain why each one is unsupported, and ask whether each should be converted to a supported type such as multiple choice, multiple answers, matching, essay, or text-only.
- Do not silently convert an unsupported question type into a different type without asking first.

Required JSON output:

- Create a real `.json` file and return it as a downloadable attachment.
- Do not paste the JSON into chat unless you are asking about unsupported questions.
- The response must consist of the file attachment only when creating the JSON file.
- The JSON must be strict valid JSON:
  - double quotes for all keys and string values
  - no comments
  - no trailing commas
  - no Markdown fences
- Use this top-level structure:

```json
{
  "title": "Quiz Title",
  "questions": []
}
```

Supported question object schemas:

Multiple choice:

```json
{
  "type": "multiple_choice",
  "prompt": "What is the powerhouse of the cell?",
  "answers": [
    { "text": "Nucleus", "correct": false },
    { "text": "Mitochondria", "correct": true },
    { "text": "Ribosome", "correct": false },
    { "text": "Vacuole", "correct": false }
  ],
  "feedback": ""
}
```

Multiple answers:

```json
{
  "type": "multiple_answers",
  "prompt": "Select all nucleotide bases.",
  "answers": [
    { "text": "Adenine", "correct": true },
    { "text": "Guanine", "correct": true },
    { "text": "Glucose", "correct": false },
    { "text": "Thymine", "correct": true }
  ],
  "feedback": ""
}
```

True/false:

```json
{
  "type": "true_false",
  "prompt": "Mitochondria are the powerhouse of the cell.",
  "correct_answer": true,
  "feedback": ""
}
```

Essay:

```json
{
  "type": "essay",
  "prompt": "Explain how mitochondria produce energy.",
  "feedback": ""
}
```

Matching:

```json
{
  "type": "matching",
  "prompt": "Match each term with its definition.",
  "pairs": [
    { "left": "Mitochondria", "right": "Powerhouse of the cell" },
    { "left": "Nucleus", "right": "Control center" }
  ],
  "feedback": ""
}
```

Text-only:

```json
{
  "type": "text_only",
  "prompt": "Use the following passage to answer the next three questions.",
  "feedback": ""
}
```

Fill in multiple blanks:

```json
{
  "type": "fill_in_multiple_blanks",
  "prompt": "Roses are [color1] and violets are [color2].",
  "blanks": [
    { "id": "color1", "answers": ["red", "Red"] },
    { "id": "color2", "answers": ["blue", "Blue"] }
  ],
  "feedback": ""
}
```

File upload:

```json
{
  "type": "file_upload",
  "prompt": "Upload your completed worksheet.",
  "feedback": ""
}
```

Answer and validation rules:

- `title` is required.
- `questions` must be a non-empty array.
- Every question must have `type` and `prompt`.
- Do not use unsupported type names.
- Multiple choice questions must have exactly one answer with `"correct": true`.
- Multiple answers questions must have two or more answers with `"correct": true`.
- True/false questions must use `"correct_answer": true` or `"correct_answer": false`.
- Matching questions must use `pairs`, and every pair must have `left` and `right`.
- Fill-in-multiple-blanks questions must use `blanks`, and every blank must have an `id` and at least one accepted answer.
- For fill-in-multiple-blanks, each `id` must appear in the prompt inside square brackets, such as `[color1]`.
- If the source includes a `Correct Answer:` or `Correct Answers:` section, use that section to set the correct booleans.
- Do not copy `Correct Answer:` or `Correct Answers:` headings into the JSON.
- Preserve the original quiz content as closely as possible during conversion.
- Do not invent answers, explanations, comments, or feedback during conversion.
- If the original quiz does not include feedback, use an empty string for `feedback`.

Multiple-answer conversion example:

Source:

Multiple Answer (Select all that apply) Which factors contributed to the defeat of the Spanish Armada?
[ ] English fire ships disrupted the Spanish formation.
[ ] Severe storms damaged many Spanish ships.
[ ] The English navy used faster, more maneuverable ships.
[ ] Spain surrendered before leaving port.
[ ] English long-range naval tactics proved effective.
Correct Answers:
[correct] English fire ships disrupted the Spanish formation.
[correct] Severe storms damaged many Spanish ships.
[correct] The English navy used faster, more maneuverable ships.
[correct] English long-range naval tactics proved effective.

Correct JSON:

```json
{
  "type": "multiple_answers",
  "prompt": "Which factors contributed to the defeat of the Spanish Armada?",
  "answers": [
    { "text": "English fire ships disrupted the Spanish formation.", "correct": true },
    { "text": "Severe storms damaged many Spanish ships.", "correct": true },
    { "text": "The English navy used faster, more maneuverable ships.", "correct": true },
    { "text": "Spain surrendered before leaving port.", "correct": false },
    { "text": "English long-range naval tactics proved effective.", "correct": true }
  ],
  "feedback": ""
}
```

Final check before creating the file:

- The file extension is `.json`.
- The file contains only valid JSON.
- The top-level object has `title` and `questions`.
- Every question uses one of the supported type values.
- MC questions have exactly one correct answer.
- MA questions have two or more correct answers.
- True/false questions use a boolean `correct_answer`.
- Matching questions use valid `pairs`.
- Fill-in-multiple-blanks questions use valid `blanks`.

After the file is created:

- Do not put these instructions inside the JSON file.
- Tell the user:
  "You're all set!
  - Download the JSON file, then open your Canvas course.
  - In the left-hand course menu, open Quizzes.
  - Click the three dots in the top right corner, choose Manage Question Banks.
  - Select Upload Question Bank.
  - Upload the JSON file. Happy quizzing!"
