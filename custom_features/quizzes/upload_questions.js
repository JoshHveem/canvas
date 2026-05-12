let upload = $(`
  <button class="upload_bank_link btn button-sidebar-wide"><i class="icon-upload"></i> Upload Question Bank</button>
`);
$("body").append(`
  <div 
    v-if="show"
    class='btech-modal'
    style="display: inline-block;"
    id='canvas-question-bank-uploader-vue'
  >
    <div class='btech-modal-content'>
      <div 
        v-if="state === 'upload'"
        class='btech-modal-content-inner'
      >
        <button style='float: right;' @click='show=false;'>X</button>
        <div class='btech-modal-content-inner'>
        <input type="file" id="fileInput" multiple>
        <button @click="processUploadedQuizBank()">Upload</button>
      </div>
      </div>
      <div 
        v-if="state === 'uploading'"
        class='btech-modal-content-inner'
      >
        <div v-for="file in files">
          <span>{{file.name}}</span><span>{{Math.round(uploadProgress[file.name] * 100)}}%</span>
        </div>
      </div>
    </div>
  </div>
`);
let VUE_APP = new Vue({
  el: '#canvas-question-bank-uploader-vue',
  mounted: async function () {

  },
  data: function () {
    return {
      show: false,
      state: 'upload',
      files: [],
      uploadProgress: {}
    }
  },
  methods: {
    processUploadedQuizBank: function () {
      const fileInput = document.getElementById('fileInput');
      this.files = fileInput.files;
      this.state = 'uploading';
      
      let filesProcessed = 0;
      for (let i = 0; i < this.files.length; i++) {
        let file = this.files[i];
        this.uploadProgress[file.name] = 0;
        let reader = new FileReader();
        reader.readAsText(file);
        reader.onload = async () => {
          let lines = reader.result.split("\n");
          let name = undefined;
          let bankTitle = file.name.replace(/\.txt$/i, '');
          lines.push(''); // kept having an issue where the last question wasn't being loaded if there's no empty line at the end, so just adding a blank line
          let quiz = [];
          let prompt = '';
          let answers = [];
          let correct = '';
          let comment = '';
          let numCorrect = 0;
          let questionType = null; // MC, MA, FR, or null for catch
          for (l in lines) {
            l = parseInt(l); //need this to be a number for the nextLine 
            let line = lines[l].trim();
            let nextLine = (lines?.[l + 1] ?? '').trim();

            let mName = line.match(/^Title\:(.*)/);
            if (mName) bankTitle = mName[1].trim();

            // Check for new question prefixes: MC., MA., EQ., TF., MT., TX., FB., FU., or fallback Q1.
            let mPrompt = line.match(/^(MC\.|MA\.|EQ\.|TF\.|MT\.|TX\.|FB\.|FU\.|Q?[0-9]+\.)\s*(.*)/);
            if (mPrompt) {
                // Extract type from prefix
                let prefix = mPrompt[1].toUpperCase();
                if (prefix.startsWith('MC.')) questionType = 'MC';
                else if (prefix.startsWith('MA.')) questionType = 'MA';
                else if (prefix.startsWith('EQ.')) questionType = 'EQ';
                else if (prefix.startsWith('TF.')) questionType = 'TF';
                else if (prefix.startsWith('MT.')) questionType = 'MT';
                else if (prefix.startsWith('TX.')) questionType = 'TX';
                else if (prefix.startsWith('FB.')) questionType = 'FB';
                else if (prefix.startsWith('FU.')) questionType = 'FU';
                else questionType = null; // fallback for Q1. etc.
                
                prompt = mPrompt[2];
                continue;
            }
            let mFillBlankAnswer = line.match(/^([A-Za-z][\w-]*)\.\s*(.+)/);
            if (questionType === 'FB' && mFillBlankAnswer) {
              answers.push({
                option: `${mFillBlankAnswer[1]}. ${mFillBlankAnswer[2]}`,
                correct: true,
                comments_html: ''
              });
              continue;
            }

            let mAnswer = line.match(/^\*{0,1}[A-Za-z](\.|\))(.*)/);
            if (mAnswer) {
              let mAnswerComment = nextLine.match(/^\?\?\.(.*)/);
              let answerComment = '';
              if (mAnswerComment) {
                answerComment = mAnswerComment[1];
              }
              answers.push({
                  option: mAnswer[2].trim(),
                  correct: line.charAt(0) == '*',
                  comments_html: answerComment
              });
              if (line.charAt(0) == '*') numCorrect += 1;
            }

            // Special parsing for MT (matching) questions
            if (questionType === 'MT' && line.includes('=') && !line.match(/^\?\./)) {
              let parts = line.split('=').map(s => s.trim());
              if (parts.length === 2) {
                answers.push({
                  option: line, // store full "left = right"
                  correct: false,
                  comments_html: ''
                });
              }
            }

            let mComment = line.match(/^\?\.(.*)/);
            if (mComment) {
                comment = mComment[1];
            }

            // End of question: blank line after answers or no-answer question types.
            let canCloseWithoutAnswers = ['EQ', 'TX', 'FU', 'FR'].includes(questionType);
            if ((answers.length > 0 || canCloseWithoutAnswers) && line == '') {
                let question = {
                  name: name,
                  prompt: prompt,
                  answers: answers,
                  comment: comment,
                  num_correct: numCorrect,
                  type: questionType
                }
                quiz.push(question);
                prompt = "";
                answers = [];
                correct = "";
                numCorrect = 0;
                comment = "";
                questionType = null;
            }

          }

          let bank = await this.createBank(bankTitle);
          for (let q in quiz) {
            let question = quiz[q];
            
            // Route to type-specific function
            if (question.type === 'MC') {
              await this.create_multiplechoice(question, bank, q);
            } else if (question.type === 'MA') {
              await this.create_multipleAnswers(question, bank, q);
            } else if (question.type === 'EQ') {
              await this.create_essay(question, bank, q);
            } else if (question.type === 'TF') {
              await this.create_trueFalse(question, bank, q);
            } else if (question.type === 'MT') {
              await this.create_matching(question, bank, q);
            } else if (question.type === 'TX') {
              await this.create_textOnly(question, bank, q);
            } else if (question.type === 'FB') {
              await this.create_fillBlanks(question, bank, q);
            } else if (question.type === 'FU') {
              await this.create_fileUpload(question, bank, q);
            } else {
              // Catch function for questions without explicit type
              await this.create_catch(question, bank, q);
            }
            
            this.uploadProgress[file.name] = (+q + 1) / quiz.length;
            //trick vue into showing the change
            this.uploadProgress = JSON.parse(JSON.stringify(this.uploadProgress));
          }
          filesProcessed += 1;
          if (filesProcessed == this.files.length) {
            this.show = false;;
          }
        };
      }
    },
    createBank: async function(title) {
      $.ajaxSetup({
          headers:{
              'Accept': 'application/json'
          }
      });
      let bank = await $.post(`https://btech.instructure.com/courses/${CURRENT_COURSE_ID}/question_banks`, {
        assessment_question_bank: {title: title}
      });
      delete $.ajaxSettings.headers['Accept'];
      return bank;
    },
    create_multiplechoice: async function(question, bank, q) {
      let answers = [];
      for (let a in question.answers) {
        let answer = question.answers[a];
        answers.push({
          answer_weight: answer.correct ? 100 : 0,
          numerical_answer_type: "exact_answer",
          answer_text: answer.option,
          comments_html: answer.comments_html
        })
      }
      await $.post(`/courses/${CURRENT_COURSE_ID}/question_banks/${bank.assessment_question_bank.id}/assessment_questions`, {
        question: {
          question_name: question.name ?? "Question " + pad(+q + 1, 3),
          question_type: 'multiple_choice_question',
          points_possible: 1,
          question_text: `<p>${question.prompt}</p>`,
          answers: answers,
          correct_comments: question.comment,
          correct_comments_html: question.comment,
          incorrect_comments: question.comment,
          incorrect_comments_html: question.comment,
          neutral_comments: question.comment,
          neutral_comments_html: question.comment
        }
      });
    },
    create_multipleAnswers: async function(question, bank, q) {
      let answers = [];
      for (let a in question.answers) {
        let answer = question.answers[a];
        answers.push({
          answer_weight: answer.correct ? (100 / question.num_correct) : 0,
          numerical_answer_type: "exact_answer",
          answer_text: answer.option,
          comments_html: answer.comments_html
        })
      }
      await $.post(`/courses/${CURRENT_COURSE_ID}/question_banks/${bank.assessment_question_bank.id}/assessment_questions`, {
        question: {
          question_name: question.name ?? "Question " + pad(+q + 1, 3),
          question_type: 'multiple_answers_question',
          points_possible: 1,
          question_text: `<p>${question.prompt}</p>`,
          answers: answers,
          correct_comments: question.comment,
          correct_comments_html: question.comment,
          incorrect_comments: question.comment,
          incorrect_comments_html: question.comment,
          neutral_comments: question.comment,
          neutral_comments_html: question.comment
        }
      });
    },
    create_essay: async function(question, bank, q) {
      await $.post(`/courses/${CURRENT_COURSE_ID}/question_banks/${bank.assessment_question_bank.id}/assessment_questions`, {
        question: {
          question_name: question.name ?? "Question " + pad(+q + 1, 3),
          question_type: 'essay_question',
          points_possible: 1,
          question_text: `<p>${question.prompt}</p>`,
          correct_comments: question.comment,
          correct_comments_html: question.comment,
          incorrect_comments: question.comment,
          incorrect_comments_html: question.comment,
          neutral_comments: question.comment,
          neutral_comments_html: question.comment
        }
      });
    },
    create_trueFalse: async function(question, bank, q) {
      // For TF, expect exactly two answers: T. and F., with one marked correct
      let trueCorrect = false;
      let falseCorrect = false;
      for (let a in question.answers) {
        let answer = question.answers[a];
        if (answer.option.toLowerCase().startsWith('t')) {
          trueCorrect = answer.correct;
        } else if (answer.option.toLowerCase().startsWith('f')) {
          falseCorrect = answer.correct;
        }
      }
      let answers = [
        {
          answer_weight: trueCorrect ? 100 : 0,
          numerical_answer_type: "exact_answer",
          answer_text: "True",
          comments_html: ""
        },
        {
          answer_weight: falseCorrect ? 100 : 0,
          numerical_answer_type: "exact_answer",
          answer_text: "False",
          comments_html: ""
        }
      ];
      await $.post(`/courses/${CURRENT_COURSE_ID}/question_banks/${bank.assessment_question_bank.id}/assessment_questions`, {
        question: {
          question_name: question.name ?? "Question " + pad(+q + 1, 3),
          question_type: 'true_false_question',
          points_possible: 1,
          question_text: `<p>${question.prompt}</p>`,
          answers: answers,
          correct_comments: question.comment,
          correct_comments_html: question.comment,
          incorrect_comments: question.comment,
          incorrect_comments_html: question.comment,
          neutral_comments: question.comment,
          neutral_comments_html: question.comment
        }
      });
    },
    create_matching: async function(question, bank, q) {
      // For MT, answers are pairs: left = right
      let answers = [];
      for (let a in question.answers) {
        let answer = question.answers[a];
        // Assume answer.option is "left = right"
        let parts = answer.option.split('=').map(s => s.trim());
        if (parts.length === 2) {
          answers.push({
            answer_weight: 100,
            numerical_answer_type: "exact_answer",
            answer_match_left: parts[0],
            answer_match_right: parts[1],
            comments_html: answer.comments_html
          });
        }
      }
      let pointsPossible = answers.length || 1;
      await $.post(`/courses/${CURRENT_COURSE_ID}/question_banks/${bank.assessment_question_bank.id}/assessment_questions`, {
        question: {
          question_name: question.name ?? "Question " + pad(+q + 1, 3),
          question_type: 'matching_question',
          points_possible: pointsPossible,
          question_text: `<p>${question.prompt}</p>`,
          answers: answers,
          correct_comments: question.comment,
          correct_comments_html: question.comment,
          incorrect_comments: question.comment,
          incorrect_comments_html: question.comment,
          neutral_comments: question.comment,
          neutral_comments_html: question.comment
        }
      });
    },
    create_textOnly: async function(question, bank, q) {
      await $.post(`/courses/${CURRENT_COURSE_ID}/question_banks/${bank.assessment_question_bank.id}/assessment_questions`, {
        question: {
          question_name: question.name ?? "Text Block " + pad(+q + 1, 3),
          question_type: 'text_only_question',
          points_possible: 0,
          question_text: `<p>${question.prompt}</p>`,
          correct_comments: question.comment,
          correct_comments_html: question.comment,
          incorrect_comments: question.comment,
          incorrect_comments_html: question.comment,
          neutral_comments: question.comment,
          neutral_comments_html: question.comment
        }
      });
    },
    create_fillBlanks: async function(question, bank, q) {
      // For FB, answers are blankname. answer
      let answers = [];
      for (let a in question.answers) {
        let answer = question.answers[a];
        // Assume answer.option is "blankname. answertext"
        let parts = answer.option.split('.').map(s => s.trim());
        if (parts.length === 2) {
          answers.push({
            answer_weight: 100,
            numerical_answer_type: "exact_answer",
            blank_id: parts[0],
            answer_text: parts[1],
            comments_html: answer.comments_html
          });
        }
      }
      await $.post(`/courses/${CURRENT_COURSE_ID}/question_banks/${bank.assessment_question_bank.id}/assessment_questions`, {
        question: {
          question_name: question.name ?? "Question " + pad(+q + 1, 3),
          question_type: 'fill_in_multiple_blanks_question',
          points_possible: 1,
          question_text: `<p>${question.prompt}</p>`,
          answers: answers,
          correct_comments: question.comment,
          correct_comments_html: question.comment,
          incorrect_comments: question.comment,
          incorrect_comments_html: question.comment,
          neutral_comments: question.comment,
          neutral_comments_html: question.comment
        }
      });
    },
    create_fileUpload: async function(question, bank, q) {
      await $.post(`/courses/${CURRENT_COURSE_ID}/question_banks/${bank.assessment_question_bank.id}/assessment_questions`, {
        question: {
          question_name: question.name ?? "Question " + pad(+q + 1, 3),
          question_type: 'file_upload_question',
          points_possible: 1,
          question_text: `<p>${question.prompt}</p>`,
          correct_comments: question.comment,
          correct_comments_html: question.comment,
          incorrect_comments: question.comment,
          incorrect_comments_html: question.comment,
          neutral_comments: question.comment,
          neutral_comments_html: question.comment
        }
      });
    },
    create_catch: async function(question, bank, q) {
      // Enhanced catch function with keyword and pattern detection
      let prompt = question.prompt.toLowerCase();
      let hasBrackets = /\[([^\]]+)\]/.test(question.prompt);
      let hasEquals = question.answers.some(a => a.option.includes('='));
      let hasDots = question.answers.some(a => /^\w+\./.test(a.option.trim()));
      let hasTF = question.answers.some(a => /^t\.|^f\./i.test(a.option.trim()));
      
      // Check for file upload
      if (prompt.includes('upload') || prompt.includes('submit') || prompt.includes('attach')) {
        await this.create_fileUpload(question, bank, q);
        return;
      }
      
      // Check for matching
      if (prompt.includes('match') || hasEquals) {
        await this.create_matching(question, bank, q);
        return;
      }
      
      // Check for fill blanks
      if (hasBrackets || hasDots) {
        await this.create_fillBlanks(question, bank, q);
        return;
      }
      
      // Check for true/false
      if (hasTF || prompt.includes('true') || prompt.includes('false')) {
        await this.create_trueFalse(question, bank, q);
        return;
      }
      
      // Check for essay
      if (question.answers.length === 0 && (prompt.includes('write') || prompt.includes('explain') || prompt.includes('describe') || prompt.includes('essay'))) {
        await this.create_essay(question, bank, q);
        return;
      }
      
      // Fallback to original logic
      if (question.answers.length === 0) {
        // No answers = essay
        await this.create_essay(question, bank, q);
      } else if (question.num_correct === 1) {
        // One correct = multiple choice
        await this.create_multiplechoice(question, bank, q);
      } else {
        // Multiple correct = multiple answers
        await this.create_multipleAnswers(question, bank, q);
      }
    }
  }
});
function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}


//handling multiple isn't currently working, but add multiple after input 
upload.click(() => {
  VUE_APP.show = true;
  VUE_APP.state = 'upload';
});
$(".see_bookmarked_banks").after(upload);





/*
  FORMATTING

  Convert quiz questions to match the sample format.
  
  QUESTION TYPES:
  - MC. = Multiple Choice (one correct answer)
  - MA. = Multiple Answers (multiple correct answers, use *)
  - EQ. = Essay Question
  - TF. = True/False
  - MT. = Matching
  - TX. = Text Only (informational block)
  - FB. = Fill in Multiple Blanks (use [blankname] in text, no spaces in brackets)
  - FU. = File Upload
  
  EXAMPLE QUIZ FORMAT:
  Title: Biology Quiz
  
  MC. What is the powerhouse of the cell?
  A. Nucleus
  *B. Mitochondria
  C. Ribosome
  D. Vacuole
  ?. General feedback for this question
  
  MA. Select all that apply
  *A. Red
  ??. This feedback shows for option A
  *B. Blue
  C. Green
  
  EQ. Write an essay about mitochondria
  ?. General instructions or feedback
  
  TF. Mitochondria are the powerhouse of the cell.
  *T.
  F.
  ?. True, they produce energy.

  MT. Match the terms with their definitions
  1. Mitochondria = a. Powerhouse of the cell
  2. Nucleus = b. Control center
  ?. Matching helps identify key concepts.
  
  TX. This is an informational text block
  ?. Optional note about the text.
  
  FB. Roses are [color1] violets are [color2]
  color1. Red
  color1. red
  color2. blue
  color2. Blue
  ?. Fill in the blanks with colors.
    
  FU. Upload your assignment file
  ?. Make sure to include all required documents.
  
  RULES:
  - Start with: Title: [Quiz Name]
  - Mark correct MC/MA answers with asterisk: *B. [answer]
  - Comments for specific answers: ??. [comment text] (next line after answer)
  - General question comment: ?. [comment text] (on its own line)
  - IMPORTANT: End each question with a blank line
  - No formatting (bold, italics, etc) - plain text only

*/





/*
AI PROMPT FOR FORMATTING QUESTION BANK TEXT FILES:
Copy/paste this prompt into an AI tool, then paste the quiz content after it.

Convert the quiz content I provide into a downloadable .txt file.
You must create and attach the file, not display the contents inline.
Use the Canvas LMS question‑bank uploader format exactly as specified below.
Requirements:

Create a real .txt file and return it as a downloadable attachment.
Do not paste the quiz text into chat.
Do not summarize or explain anything.
The response must consist of the file attachment only.
Preserve all original questions and answers exactly; change formatting only.

I will verify that a download link appears.

REQUIRED FORMAT:
- Preserve the original quiz content as closely as possible. Only change the formatting
  needed to match these rules.
- Do not invent, rewrite, expand, or add new questions, answers, explanations, comments,
  or feedback.
- If the original quiz does not include comments or feedback, do not add any ?. or ??.
- The first line must be: Title: [Quiz Name]
- Put one blank line after the title.
- Every question must start with one of these prefixes:
  MC. = multiple choice, exactly one correct answer
  MA. = multiple answers, more than one correct answer
  EQ. = essay question
  TF. = true/false
  MT. = matching
  TX. = text-only informational block
  FB. = fill in multiple blanks
  FU. = file upload
- End every question with exactly one blank line.
- Use plain text only. Do not use bold, italics, bullets, tables, or HTML.

ANSWER RULES:
- For MC and MA answers, use A. Answer text, B. Answer text, etc.
- Mark each correct answer with an asterisk before the letter, like *B. Answer text.
- MC questions must have exactly one starred answer.
- MA questions must have two or more starred answers.
- Optional answer-specific feedback goes immediately after that answer as:
  ??. Feedback text
- Optional general question feedback goes after all answers as:
  ?. Feedback text

TYPE-SPECIFIC RULES:
- EQ, TX, and FU questions do not need answer lines.
- TF questions must use exactly two answer lines: T. True and F. False.
  Put the asterisk on the correct line.
- MT questions must use one matching pair per line: Term = Matching answer.
  Each matching pair will be worth 1 point.
- If the source question has a matching answer bank, such as A. OSHA, B. CDC,
  followed by prompts with lines like Answer: A, convert the whole block into
  one MT question. Do not make the answer bank or question directions a separate
  TX question.
  Example conversion:
  Source answer bank: A. OSHA
  Source prompt: Workplace safety regulations / Answer: A
  Output pair: OSHA = Workplace safety regulations
- FB questions must put blank IDs in the question text using square brackets.
  Example: Roses are [color1]. Then list accepted answers as: color1. Red.
  Repeat the same blank ID for multiple accepted answers.

EXAMPLE FORMAT:
Title: Biology Quiz

MC. What is the powerhouse of the cell?
A. Nucleus
*B. Mitochondria
C. Ribosome
D. Vacuole

MA. Select all nucleotide bases.
*A. Adenine
*B. Guanine
C. Glucose
*D. Thymine

TF. Mitochondria are the powerhouse of the cell.
*T. True
F. False

FINAL CHECK BEFORE YOU BUILD THE FILE:
- Name the file [quizname].txt based on the title line.
- The file starts with Title:
- The file contains only the formatted quiz text.
- No questions, answers, explanations, comments, or feedback were invented.
- Every question has a blank line after it.
- MC has one starred answer.
- MA has multiple starred answers.
- True/false uses T. True and F. False and has one starred answer.
- Fill-in-the-blank prompts use [blank_id] markers and matching blank_id answer lines.

AFTER THE FILE IS CREATED:
- Do not put these instructions inside the .txt file.
- Tell the user:
  "You're all set! 
  — Download the file, then open your Canvas course.
  — In the left-hand course menu, open Quizzes. 
  — Click the three dots in the top right corner, choose Manage Question Banks. 
  — Select Upload Question Bank.
  — Upload the .txt file. Happy quizzing!"
*/
