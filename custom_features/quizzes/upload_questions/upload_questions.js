let upload = $(`
  <button class="upload_bank_link btn button-sidebar-wide"><i class="icon-upload"></i> Upload Question Bank</button>
`);
let uploadQuestionBankButtonObserver = null;

function stopUploadQuestionBankButtonWatcher() {
  if (uploadQuestionBankButtonObserver) {
    uploadQuestionBankButtonObserver.disconnect();
    uploadQuestionBankButtonObserver = null;
  }
}

function insertUploadQuestionBankButton() {
  if ($(".upload_bank_link").length) return;

  const anchor = $(".see_bookmarked_banks");
  if (anchor.length) {
    anchor.after(upload);
    stopUploadQuestionBankButtonWatcher();
    console.log("upload_questions: upload button inserted after .see_bookmarked_banks");
    return true;
  }

  return false;
}

function watchForUploadQuestionBankButton() {
  if (insertUploadQuestionBankButton()) return;

  let attempts = 0;
  const maxAttempts = 80;
  const intervalId = window.setInterval(() => {
    attempts += 1;
    if (insertUploadQuestionBankButton()) {
      window.clearInterval(intervalId);
      return;
    }

    if (attempts >= maxAttempts) {
      window.clearInterval(intervalId);
      stopUploadQuestionBankButtonWatcher();
      console.warn("upload_questions: .see_bookmarked_banks not found; upload button was not inserted");
    }
  }, 250);

  if (window.MutationObserver && document.body) {
    uploadQuestionBankButtonObserver = new MutationObserver(() => {
      if (insertUploadQuestionBankButton()) {
        window.clearInterval(intervalId);
      }
    });

    uploadQuestionBankButtonObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}
$("body").append(`
  <div 
    class='btech-modal'
    id='canvas-question-bank-uploader-vue'
    style='display:none; position: fixed; inset: 0; background: rgba(0,0,0,0.45); justify-content: center; align-items: center; z-index: 9999; padding: 16px;'
  >
    <div class='btech-modal-content' style='background:#ffffff; width:min(100%,620px); max-width:620px; border-radius:18px; box-shadow:0 24px 80px rgba(0,0,0,0.18); overflow:hidden; font-family:Arial,Helvetica,sans-serif;'>
      <div style='padding:20px 24px 12px 24px; display:flex; justify-content:space-between; align-items:flex-start; gap:12px; background:#f5f8ff; border-bottom:1px solid #e7edf7;'>
        <div>
          <div style='font-size:20px; font-weight:700; color:#14213d; margin-bottom:6px;'>Upload Question Bank</div>
          <div style='font-size:14px; color:#4a5568; line-height:1.5;'>Use AI to create a Canvas-ready JSON question bank, then upload the JSON file here.</div>
        </div>
        <button id='canvas-question-bank-uploader-close' style='border:none; background:transparent; color:#334155; font-size:26px; line-height:1; cursor:pointer;'>×</button>
      </div>
      <div class='btech-modal-body' style='padding:24px;'>
        <div class='btech-modal-content-inner upload-state'>
          <div style='margin-bottom:18px;'>
            <div style='font-size:15px; font-weight:700; color:#0f172a; margin-bottom:6px;'>Choose Your Starting Point</div>
            <div style='font-size:13px; color:#4a5568; line-height:1.45; margin-bottom:12px;'>Select an option to copy the matching AI prompt. Both use the same Canvas JSON rules.</div>
            <div style='display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px;'>
              <button type='button' data-canvas-prompt-type='create' style='text-align:left; padding:14px 16px; background:#ffffff; color:#0f172a; border:1px solid #cbd5e1; border-radius:12px; cursor:pointer;'>
                <span style='display:block; font-size:14px; font-weight:700; margin-bottom:4px;'>Write a quiz from scratch</span>
                <span style='display:block; font-size:12px; color:#64748b; line-height:1.35;'>Start with a topic, objectives, and supported question types.</span>
              </button>
              <button type='button' data-canvas-prompt-type='convert' style='text-align:left; padding:14px 16px; background:#ffffff; color:#0f172a; border:1px solid #cbd5e1; border-radius:12px; cursor:pointer;'>
                <span style='display:block; font-size:14px; font-weight:700; margin-bottom:4px;'>I already have a quiz</span>
                <span style='display:block; font-size:12px; color:#64748b; line-height:1.35;'>Convert a Word doc, textbook quiz, or pasted source text.</span>
              </button>
            </div>
          </div>
          <div style='display:flex; flex-wrap:wrap; gap:12px; margin-bottom:18px;'>
            <input type="file" id="fileInput" accept=".json,application/json" multiple style='flex:1 1 240px; min-width:200px; padding:12px 14px; border:1px solid #cbd5e1; border-radius:12px; background:#f8fafc; color:#0f172a;' />
            <button id='canvas-question-bank-uploader-upload' style='padding:12px 18px; background:#2563eb; color:#fff; border:none; border-radius:12px; cursor:pointer; transition: transform .15s ease; box-shadow:0 12px 28px rgba(37,99,235,0.18);'>Upload JSON</button>
          </div>
          <div id='canvas-question-bank-copy-status' style='font-size:13px; min-height:18px; color:#334155;'></div>
        </div>
        <div class='btech-modal-content-inner uploading-state' style='display:none;'>
          <div style='font-size:16px; font-weight:700; color:#0f172a; margin-bottom:14px;'>Uploading quiz bank(s)...</div>
          <div id='canvas-question-bank-progress-list'></div>
        </div>
      </div>
    </div>
  </div>
`);
console.log("upload_questions: modal HTML appended, binding Vue root id #canvas-question-bank-uploader-vue");
const CANVAS_PROMPT_PATHS = {
  convert: "/custom_features/quizzes/upload_questions/convert_existing_quiz_prompt.md",
  create: "/custom_features/quizzes/upload_questions/create_new_quiz_prompt.md",
  shared: "/custom_features/quizzes/upload_questions/shared_canvas_format_rules.md"
};
let CANVAS_PROMPT_CACHE = {};

function getSourceUrl() {
  if (typeof SOURCE_URL !== 'undefined') {
    return SOURCE_URL;
  }

  return '';
}

function getCanvasPromptUrl(promptPath) {
  const url = getSourceUrl() + promptPath;
  return window.btechAssetUrl ? window.btechAssetUrl(url) : url;
}

async function loadCanvasPromptFile(promptPath) {
  if (CANVAS_PROMPT_CACHE[promptPath]) return CANVAS_PROMPT_CACHE[promptPath];

  const response = await fetch(getCanvasPromptUrl(promptPath), { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Could not load Canvas prompt. Status: ' + response.status);
  }

  CANVAS_PROMPT_CACHE[promptPath] = (await response.text()).trim();
  return CANVAS_PROMPT_CACHE[promptPath];
}

async function buildCanvasPrompt(promptType) {
  const intentPath = CANVAS_PROMPT_PATHS[promptType];
  if (!intentPath) {
    throw new Error('Unknown Canvas prompt type: ' + promptType);
  }

  const intentPrompt = await loadCanvasPromptFile(intentPath);
  const sharedRules = await loadCanvasPromptFile(CANVAS_PROMPT_PATHS.shared);
  return [intentPrompt, sharedRules].join("\n\n---\n\n");
}

function getChoiceAnswerMarkers(text) {
  return Array.from(String(text || "").matchAll(/(\*?[A-Z][.)])\s*/g));
}

function startsWithQuestionPrefix(line) {
  return /^(MC\.|MA\.|EQ\.|TF\.|MT\.|TX\.|FB\.|FU\.|Q?[0-9]+\.)\s*/i.test(line);
}

function startsWithAnswerOrFeedback(line) {
  return /^(\*?[A-Z][.)]|\?{1,2}\.)\s*/.test(line);
}

function splitInlineChoiceQuestion(prefix, questionText) {
  const markers = getChoiceAnswerMarkers(questionText);
  if (markers.length < 2) return null;

  const normalized = [];
  const prompt = questionText.slice(0, markers[0].index).trim();
  normalized.push(prefix.toUpperCase() + " " + prompt);

  markers.forEach((marker, index) => {
    const label = marker[1].replace(")", ".");
    const answerStart = marker.index + marker[0].length;
    const answerEnd = index + 1 < markers.length ? markers[index + 1].index : questionText.length;
    const answerText = questionText.slice(answerStart, answerEnd).trim();
    if (answerText) normalized.push(label + " " + answerText);
  });

  return normalized.length > 1 ? normalized : null;
}

function normalizeQuizTextLines(text) {
  const rawLines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
  const normalizedLines = [];

  for (let index = 0; index < rawLines.length; index++) {
    const line = rawLines[index].trim();
    const promptMatch = line.match(/^(MC\.|MA\.|TF\.)\s*(.*)/i);

    if (!promptMatch) {
      normalizedLines.push(line);
      continue;
    }

    const prefix = promptMatch[1];
    let questionText = promptMatch[2].trim();
    let markers = getChoiceAnswerMarkers(questionText);

    while (
      markers.length < 2 &&
      index + 1 < rawLines.length &&
      rawLines[index + 1].trim() &&
      !startsWithQuestionPrefix(rawLines[index + 1].trim()) &&
      !startsWithAnswerOrFeedback(rawLines[index + 1].trim())
    ) {
      index += 1;
      questionText += " " + rawLines[index].trim();
      markers = getChoiceAnswerMarkers(questionText);
    }

    const splitLines = splitInlineChoiceQuestion(prefix, questionText);
    if (splitLines) {
      normalizedLines.push(...splitLines);
    } else {
      normalizedLines.push(line);
    }
  }

  return normalizedLines;
}

function normalizeQuestionType(type) {
  const value = String(type || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const typeMap = {
    mc: "MC",
    multiple_choice: "MC",
    multiplechoice: "MC",
    ma: "MA",
    multiple_answers: "MA",
    multiple_answer: "MA",
    multipleanswers: "MA",
    eq: "EQ",
    essay: "EQ",
    essay_question: "EQ",
    tf: "TF",
    true_false: "TF",
    truefalse: "TF",
    mt: "MT",
    matching: "MT",
    matching_question: "MT",
    tx: "TX",
    text_only: "TX",
    text: "TX",
    text_only_question: "TX",
    fb: "FB",
    fill_in_multiple_blanks: "FB",
    fill_multiple_blanks: "FB",
    fill_in_blanks: "FB",
    fu: "FU",
    file_upload: "FU",
    file_upload_question: "FU"
  };

  return typeMap[value] || "";
}

function getFileTitle(fileName) {
  return String(fileName || "Question Bank").replace(/\.(json|txt)$/i, "");
}

function stripJsonCodeFence(text) {
  const trimmed = String(text || "").trim().replace(/^\uFEFF/, "");
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

function getJsonTextValue(value) {
  return String(value || "").trim();
}

function getJsonBooleanValue(value, defaultValue) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  if (typeof value === "number") return value !== 0;
  return defaultValue;
}

function parseJsonQuizBank(rawText, fileName) {
  const parsed = JSON.parse(stripJsonCodeFence(rawText));
  const source = Array.isArray(parsed) ? { title: getFileTitle(fileName), questions: parsed } : parsed;
  const title = getJsonTextValue(source.title || source.quiz_title || source.name) || getFileTitle(fileName);
  const sourceQuestions = Array.isArray(source.questions) ? source.questions : [];

  if (!sourceQuestions.length) {
    throw new Error("JSON quiz file must include a non-empty questions array.");
  }

  const questions = sourceQuestions.map((sourceQuestion, index) => normalizeJsonQuestion(sourceQuestion, index));
  return { title, questions };
}

function normalizeJsonQuestion(sourceQuestion, index) {
  const type = normalizeQuestionType(sourceQuestion.type || sourceQuestion.question_type);
  const prompt = getJsonTextValue(sourceQuestion.prompt || sourceQuestion.question || sourceQuestion.question_text || sourceQuestion.text);
  const questionNumber = index + 1;

  if (!type) {
    throw new Error("Question " + questionNumber + " has an unsupported or missing type.");
  }

  if (!prompt) {
    throw new Error("Question " + questionNumber + " is missing a prompt.");
  }

  const question = {
    name: getJsonTextValue(sourceQuestion.name || sourceQuestion.question_name) || undefined,
    prompt,
    answers: [],
    comment: getJsonTextValue(sourceQuestion.feedback || sourceQuestion.comment || sourceQuestion.general_feedback),
    num_correct: 0,
    type
  };

  if (type === "MC" || type === "MA") {
    question.answers = normalizeJsonChoiceAnswers(sourceQuestion.answers, questionNumber);
    question.num_correct = question.answers.filter(answer => answer.correct).length;

    if (type === "MC" && question.num_correct !== 1) {
      throw new Error("Question " + questionNumber + " must have exactly one correct answer.");
    }

    if (type === "MA" && question.num_correct < 2) {
      throw new Error("Question " + questionNumber + " must have two or more correct answers.");
    }
  }

  if (type === "TF") {
    const correctAnswer = getJsonBooleanValue(sourceQuestion.correct_answer, null);
    if (correctAnswer === null) {
      throw new Error("Question " + questionNumber + " must include correct_answer as true or false.");
    }

    question.answers = [
      { option: "T. True", correct: correctAnswer === true, comments_html: "" },
      { option: "F. False", correct: correctAnswer === false, comments_html: "" }
    ];
    question.num_correct = 1;
  }

  if (type === "MT") {
    question.answers = normalizeJsonMatchingPairs(sourceQuestion.pairs || sourceQuestion.matches || sourceQuestion.answers, questionNumber);
  }

  if (type === "FB") {
    question.answers = normalizeJsonBlankAnswers(sourceQuestion.blanks || sourceQuestion.answers, questionNumber);
  }

  return question;
}

function normalizeJsonChoiceAnswers(sourceAnswers, questionNumber) {
  if (!Array.isArray(sourceAnswers) || !sourceAnswers.length) {
    throw new Error("Question " + questionNumber + " must include an answers array.");
  }

  return sourceAnswers.map((answer, answerIndex) => {
    const text = getJsonTextValue(answer.text || answer.answer || answer.option);
    if (!text) {
      throw new Error("Question " + questionNumber + ", answer " + (answerIndex + 1) + " is missing text.");
    }

    return {
      option: text,
      correct: getJsonBooleanValue(answer.correct, false),
      comments_html: getJsonTextValue(answer.feedback || answer.comments_html || answer.comment)
    };
  });
}

function normalizeJsonMatchingPairs(sourcePairs, questionNumber) {
  if (!Array.isArray(sourcePairs) || !sourcePairs.length) {
    throw new Error("Question " + questionNumber + " must include a pairs array.");
  }

  return sourcePairs.map((pair, pairIndex) => {
    const left = getJsonTextValue(pair.left || pair.term || pair.prompt);
    const right = getJsonTextValue(pair.right || pair.match || pair.answer);
    if (!left || !right) {
      throw new Error("Question " + questionNumber + ", matching pair " + (pairIndex + 1) + " needs left and right values.");
    }

    return {
      option: left + " = " + right,
      correct: true,
      comments_html: getJsonTextValue(pair.feedback || pair.comments_html || pair.comment)
    };
  });
}

function normalizeJsonBlankAnswers(sourceBlanks, questionNumber) {
  if (!Array.isArray(sourceBlanks) || !sourceBlanks.length) {
    throw new Error("Question " + questionNumber + " must include a blanks array.");
  }

  const answers = [];
  sourceBlanks.forEach((blank, blankIndex) => {
    const blankId = getJsonTextValue(blank.id || blank.blank_id || blank.name);
    const acceptedAnswers = Array.isArray(blank.answers) ? blank.answers : [blank.answer];

    if (!blankId) {
      throw new Error("Question " + questionNumber + ", blank " + (blankIndex + 1) + " needs an id.");
    }

    acceptedAnswers.forEach((answer, answerIndex) => {
      const answerText = getJsonTextValue(answer);
      if (!answerText) {
        throw new Error("Question " + questionNumber + ", blank " + blankId + " answer " + (answerIndex + 1) + " is blank.");
      }

      answers.push({
        option: blankId + ". " + answerText,
        correct: true,
        comments_html: getJsonTextValue(blank.feedback || blank.comments_html || blank.comment)
      });
    });
  });

  return answers;
}

function parseLegacyTextQuiz(rawText, fileName) {
  let lines = normalizeQuizTextLines(rawText);
  let name = undefined;
  let bankTitle = getFileTitle(fileName);
  lines.push('');
  let quiz = [];
  let prompt = '';
  let answers = [];
  let comment = '';
  let numCorrect = 0;
  let questionType = null;

  for (let l in lines) {
    l = parseInt(l);
    let line = lines[l].trim();
    let nextLine = (lines?.[l + 1] ?? '').trim();

    let mName = line.match(/^Title\:(.*)/);
    if (mName) bankTitle = mName[1].trim();

    let mPrompt = line.match(/^(MC\.|MA\.|EQ\.|TF\.|MT\.|TX\.|FB\.|FU\.|Q?[0-9]+\.)\s*(.*)/);
    if (mPrompt) {
      let prefix = mPrompt[1].toUpperCase();
      if (prefix.startsWith('MC.')) questionType = 'MC';
      else if (prefix.startsWith('MA.')) questionType = 'MA';
      else if (prefix.startsWith('EQ.')) questionType = 'EQ';
      else if (prefix.startsWith('TF.')) questionType = 'TF';
      else if (prefix.startsWith('MT.')) questionType = 'MT';
      else if (prefix.startsWith('TX.')) questionType = 'TX';
      else if (prefix.startsWith('FB.')) questionType = 'FB';
      else if (prefix.startsWith('FU.')) questionType = 'FU';
      else questionType = null;

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
      if (mAnswerComment) answerComment = mAnswerComment[1];
      answers.push({
        option: mAnswer[2].trim(),
        correct: line.charAt(0) == '*',
        comments_html: answerComment
      });
      if (line.charAt(0) == '*') numCorrect += 1;
    }

    if (questionType === 'MT' && line.includes('=') && !line.match(/^\?\./)) {
      let parts = line.split('=').map(s => s.trim());
      if (parts.length === 2) {
        answers.push({
          option: line,
          correct: false,
          comments_html: ''
        });
      }
    }

    let mComment = line.match(/^\?\.(.*)/);
    if (mComment) comment = mComment[1];

    let canCloseWithoutAnswers = ['EQ', 'TX', 'FU', 'FR'].includes(questionType);
    if ((answers.length > 0 || canCloseWithoutAnswers) && line == '') {
      quiz.push({
        name: name,
        prompt: prompt,
        answers: answers,
        comment: comment,
        num_correct: numCorrect,
        type: questionType
      });
      prompt = "";
      answers = [];
      numCorrect = 0;
      comment = "";
      questionType = null;
    }
  }

  return { title: bankTitle, questions: quiz };
}

function parseUploadedQuizBank(rawText, fileName) {
  try {
    return parseJsonQuizBank(rawText, fileName);
  } catch (jsonError) {
    const looksLikeJson = /\.json$/i.test(fileName) || /^[\s\uFEFF]*[{[]/.test(rawText || "");
    if (looksLikeJson) throw jsonError;
    console.warn("upload_questions: falling back to legacy text parser", jsonError);
    return parseLegacyTextQuiz(rawText, fileName);
  }
}

let VUE_APP = {
  show: false,
  state: 'upload',
  files: [],
  uploadProgress: {},
  mounted: async function () {
    console.log("upload_questions: modal initialized; initial show=", this.show, "state=", this.state);
    initUploadModalEvents();
    Object.keys(this.methods || {}).forEach(key => {
      this[key] = this.methods[key].bind(this);
    });
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
      console.log("upload_questions: processUploadedQuizBank called");
      const fileInput = document.getElementById('fileInput');
      if (!fileInput) {
        console.error("upload_questions: fileInput element not found");
        return;
      }
      if (!fileInput.files || fileInput.files.length === 0) {
        console.warn("upload_questions: no files selected in fileInput");
        return;
      }
      console.log("upload_questions: fileInput found, selected files count=", fileInput.files.length);
      this.files = fileInput.files;
      console.log("upload_questions: storing selected files", this.files);
      this.state = 'uploading';
      console.log("upload_questions: state changed to upload", this.state, "show=", this.show);
      setUploadModalState(true, 'uploading');
      
      let filesProcessed = 0;
      for (let i = 0; i < this.files.length; i++) {
        let file = this.files[i];
        console.log("upload_questions: starting FileReader for file", file.name, "index", i);
        this.uploadProgress[file.name] = 0;
        let reader = new FileReader();
        reader.readAsText(file);
        reader.onload = async () => {
          console.log("upload_questions: FileReader loaded file", file.name, "size", file.size);
          try {
          let parsedQuizBank = parseUploadedQuizBank(reader.result, file.name);
          let bankTitle = parsedQuizBank.title;
          let quiz = parsedQuizBank.questions;

          console.log("upload_questions: parsed quiz", quiz.length, "questions for file", file.name, "bankTitle", bankTitle);
          let bank = await this.createBank(bankTitle);
          console.log("upload_questions: createBank returned", bank);
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
            setUploadModalState(false, 'upload');
            setTimeout(() => window.location.reload(), 700);
          }
          } catch (error) {
            console.error("upload_questions: upload failed", error);
            filesProcessed += 1;
            this.uploadProgress[file.name] = 1;
            this.uploadProgress = JSON.parse(JSON.stringify(this.uploadProgress));
            setUploadModalState(true, 'upload');
            const status = document.getElementById('canvas-question-bank-copy-status');
            if (status) {
              status.textContent = 'Upload failed for ' + file.name + ': ' + error.message;
              status.style.color = '#b91c1c';
            }
          }
        };
      }
    },
    createBank: async function(title) {
      console.log("upload_questions: createBank called with title", title);
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
};

function setUploadModalState(show, state) {
  VUE_APP.show = show;
  VUE_APP.state = state;
  const modal = document.getElementById('canvas-question-bank-uploader-vue');
  if (!modal) return;
  modal.style.display = show ? 'flex' : 'none';
  const uploadSection = modal.querySelector('.upload-state');
  const uploadingSection = modal.querySelector('.uploading-state');
  const status = modal.querySelector('#canvas-question-bank-copy-status');
  if (uploadSection) uploadSection.style.display = state === 'upload' ? 'block' : 'none';
  if (uploadingSection) uploadingSection.style.display = state === 'uploading' ? 'block' : 'none';
  if (state === 'upload') {
    if (status) {
      status.textContent = '';
      status.style.color = '#334155';
    }
  }
  if (state === 'uploading') renderUploadProgress();
}

function renderUploadProgress() {
  const list = document.getElementById('canvas-question-bank-progress-list');
  if (!list) return;
  list.innerHTML = '';
  Object.keys(VUE_APP.uploadProgress).forEach(name => {
    const percent = Math.round((VUE_APP.uploadProgress[name] || 0) * 100);
    const item = document.createElement('div');
    item.textContent = `${name}: ${percent}%`;
    list.appendChild(item);
  });
}

function initUploadModalEvents() {
  const modal = document.getElementById('canvas-question-bank-uploader-vue');
  if (!modal) return;
  const closeBtn = modal.querySelector('#canvas-question-bank-uploader-close');
  const uploadBtn = modal.querySelector('#canvas-question-bank-uploader-upload');
  const copyBtns = modal.querySelectorAll('[data-canvas-prompt-type]');
  if (closeBtn) closeBtn.addEventListener('click', () => setUploadModalState(false, 'upload'));
  if (uploadBtn) uploadBtn.addEventListener('click', () => VUE_APP.processUploadedQuizBank());
  copyBtns.forEach(button => {
    button.addEventListener('click', () => copyCanvasPrompt(button.getAttribute('data-canvas-prompt-type')));
  });
}

async function copyCanvasPrompt(promptType) {
  const status = document.getElementById('canvas-question-bank-copy-status');
  if (!navigator.clipboard) {
    if (status) status.textContent = 'Clipboard API unavailable in this browser.';
    return;
  }

  if (status) {
    status.textContent = 'Loading prompt...';
    status.style.color = '#334155';
  }

  let prompt = '';
  try {
    prompt = await buildCanvasPrompt(promptType);
    await navigator.clipboard.writeText(prompt);
    if (status) {
      status.textContent = 'Prompt copied to clipboard! Paste it into your AI tool.';
      status.style.color = '#166534';
    }
  } catch (error) {
    console.error('upload_questions: copy prompt failed', error);
    if (prompt) {
      const blob = new Blob([prompt], { type: 'text/plain' });
      window.open(URL.createObjectURL(blob), '_blank');
    } else {
      const fallbackPath = CANVAS_PROMPT_PATHS[promptType] || CANVAS_PROMPT_PATHS.shared;
      window.open(getCanvasPromptUrl(fallbackPath), '_blank');
    }
    if (status) {
      status.textContent = 'Unable to copy prompt automatically. The prompt opened in a new tab.';
      status.style.color = '#b91c1c';
    }
  }
}

VUE_APP.mounted();

function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}


//handling multiple isn't currently working, but add multiple after input 
upload.click(() => {
  console.log("upload_questions: upload button clicked");
  setUploadModalState(true, 'upload');
});
watchForUploadQuestionBankButton();


