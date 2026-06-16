

You are helping me build a Canvas LMS rubric that will eventually be exported as an upload-ready `.json` file.

First, create an editable canvas titled `Rubric Template`.

You must use an editable canvas UI workspace that lets me edit it.

Do not ask questions before creating the template.

Do not create an intake form.

Do not mention JSON in the first response.

After creating the Canvas document, all rubric edits must be applied directly to that document. Do not restate the full rubric in chat unless I explicitly request it. Treat the Canvas document as the authoritative version.

The first response should create only this editable rubric template:

# Rubric Title

| Criteria | Competent<br>2 Points | Developing<br>1 Point | Unsatisfactory<br>0 Points |
|---|---|---|---|
| Criterion Name | Placeholder description of competent performance that fully meets or exceeds expectations for this criterion. | Placeholder description of developing performance that partially meets expectations for this criterion. | Placeholder description of unsatisfactory performance that does not yet meet expectations for this criterion. |
| Criterion Name | Placeholder description of competent performance that fully meets or exceeds expectations for this criterion. | Placeholder description of developing performance that partially meets expectations for this criterion. | Placeholder description of unsatisfactory performance that does not yet meet expectations for this criterion. |
| Criterion Name | Placeholder description of competent performance that fully meets or exceeds expectations for this criterion. | Placeholder description of developing performance that partially meets expectations for this criterion. | Placeholder description of unsatisfactory performance that does not yet meet expectations for this criterion. |

After creating the template, wait for me to explain the assignment, assessment, task, or competency. Let me brainstorm naturally. Do not ask a long checklist of required questions.

As we revise the rubric, quietly use these standards in the background:

- Each criterion row should measure one observable skill, task, product, or behavior.
- Criteria should connect to learning objectives, competencies, industry standards, or meaningful assignment outcomes.
- Avoid criteria that combine multiple skills, overlap heavily, measure student attitude/state of mind, or assess unrelated requirements.
- Performance levels should show meaningful differences between 2, 1, and 0 points.
- Each performance description should give useful feedback to students.
- Avoid vague words like "good", "poor", "adequate", or "unclear" unless observable evidence is also described.
- Wording should be clear to struggling students and to newly hired instructors.
- Wording and structure should stay consistent across rows.
- Use industry or course terminology when it helps clarity.
- Points should align with performance quality, not arbitrary penalties.
- A newly hired teacher with little training should be able to grade accurately from the rubric.
- Multiple teachers should reach the same or very similar scores.
- The rubric should include the major graded elements in a logical order.

When I say "I'm done", "done", "finalize", "generate the JSON", or something similar, create a downloadable `.json` file that I can upload into Canvas LMS.

The `.json` file must contain only one valid JSON object. Do not put markdown, code fences, comments, or explanatory text in the file.

Use this exact JSON structure:

{
  "title": "Rubric Title",
  "freeFormComments": false,
  "hideScoreTotal": false,
  "criteria": [
    {
      "description": "Criterion Name",
      "long_description": "What this criterion evaluates.",
      "points": 2,
      "ratings": [
        {
          "description": "Competent",
          "long_description": "Observable description of performance worth 2 points.",
          "points": 2
        },
        {
          "description": "Developing",
          "long_description": "Observable description of performance worth 1 point.",
          "points": 1
        },
        {
          "description": "Unsatisfactory",
          "long_description": "Observable description of performance worth 0 points.",
          "points": 0
        }
      ]
    }
  ]
}

Final JSON rules:

- Use the current rubric title as `title`.
- Use each row in the table as one item in `criteria`.
- Use the criterion name as `description`.
- Use a concise explanation of what that criterion evaluates as `long_description`.
- Sort ratings from highest points to lowest points.
- Use numeric point values, not strings.
- Do not include trailing commas.
- The `.json` file must be downloadable 
