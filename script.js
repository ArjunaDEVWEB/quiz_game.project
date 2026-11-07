// Quiz Game JavaScript
// made by: ArjunaDEVWEB (github.com/ArjunaDEVWEB)
// version: 1.0
// date: 2024-06-15
// This script handles the quiz game logic, including question management, user interactions, and result calculations.
//feel free to modify and use this code for your own quiz game projects.

const QUIZ_QUESTION_COUNT = 25;

//false this configuration if you want to keep the original order of questions and options
const SHUFFLE_QUESTIONS = true;
const SHUFFLE_OPTIONS = true;

// fisher–Yates shuffle algorithm
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

function shuffleQuestionOptions(q) {
  const paired = q.options.map((text, idx) => ({
    text: text,
    isCorrect: idx === q.correctIndex,
  }));
  shuffleArray(paired);
  return {
    question: q.question,
    category: q.category,
    options: paired.map((item) => item.text),
    correctIndex: paired.findIndex((item) => item.isCorrect),
    explanation: q.explanation,
  };
}

function buildShuffledQuiz() {
  const quiz = QUESTION_BANK.map((q) =>
    SHUFFLE_OPTIONS
      ? shuffleQuestionOptions(q)
      : {
          question: q.question,
          category: q.category,
          options: [...q.options],
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        },
  );
  if (SHUFFLE_QUESTIONS) shuffleArray(quiz);
  return quiz.slice(0, QUIZ_QUESTION_COUNT);
}

let activeQuestions = [];

const TOTAL_QUESTIONS = QUIZ_QUESTION_COUNT;
const TOTAL_TIME = 25 * 60;
const POINTS_PER_QUESTION = 4;
const ANSWER_LETTERS = ["A", "B", "C", "D", "E"];

let currentQuestionIndex = 0;
let userAnswers = Array(TOTAL_QUESTIONS).fill(null);
let markedQuestions = new Set();
let isSubmitted = false;
let timeRemaining = TOTAL_TIME;
let timerInterval = null;
let notificationTimeout = null;

const el = (id) => document.getElementById(id);

const currentScoreEl = el("current-score");
const quizTimerEl = el("quiz-timer");
const totalQuestionsEl = el("total-questions");
const answeredCountEl = el("answered-count");
const remainingCountEl = el("remaining-count");

const progressPercentageEl = el("progress-percentage");
const progressContainerEl = el("progress-container");
const progressBarEl = el("progress-bar");

const questionNumberEl = document.querySelector(".question-number");
const questionStatusEl = el("question-status");
const markQuestionBtn = el("mark-question-btn");
const questionTitleEl = el("question-title");
const questionDescriptionEl = el("question-description");

const answerButtons = [
  el("answer-1"),
  el("answer-2"),
  el("answer-3"),
  el("answer-4"),
  el("answer-5"),
];
const answerTextEls = [
  el("answer-text-1"),
  el("answer-text-2"),
  el("answer-text-3"),
  el("answer-text-4"),
  el("answer-text-5"),
];

const feedbackMessageEl = el("feedback-message");

const prevBtn = el("previous-question-btn");
const clearAnswerBtn = el("clear-answer-btn");
const nextBtn = el("next-question-btn");

const togglePaletteBtn = el("toggle-palette-btn");
const questionPaletteEl = el("question-palette");
const paletteButtons = document.querySelectorAll(".question-nav-item");

const restartQuizBtn = el("restart-quiz-btn");
const submitQuizBtn = el("submit-quiz-btn");

const submitDialog = el("submit-confirmation");
const confirmationMessageEl = el("confirmation-message");
const unansweredWarningEl = el("unanswered-warning");
const cancelSubmitBtn = el("cancel-submit-btn");
const confirmSubmitBtn = el("confirm-submit-btn");

const resultContainerEl = el("result-container");
const resultMessageEl = el("result-message");
const finalScoreEl = el("final-score");
const finalPercentageEl = el("final-percentage");
const gradeLabelEl = el("grade-label");
const correctCountEl = el("correct-count");
const incorrectCountEl = el("incorrect-count");
const finalUnansweredCountEl = el("final-unanswered-count");
const finalTotalQuestionsEl = el("final-total-questions");
const totalTimeTakenEl = el("total-time-taken");
const averageTimeEl = el("average-time");
const reviewAnswersBtn = el("review-answers-btn");
const playAgainBtn = el("play-again-btn");

const reviewContainerEl = el("review-container");
const reviewCorrectTotalEl = el("review-correct-total");
const reviewIncorrectTotalEl = el("review-incorrect-total");
const reviewListEl = el("review-list");
const backToResultsBtn = el("back-to-results-btn");

const restartDialog = el("restart-confirmation");
const cancelRestartBtn = el("cancel-restart-btn");
const confirmRestartBtn = el("confirm-restart-btn");

const notificationContainerEl = el("notification-container");
const notificationMessageEl = el("notification-message");

const quizContainerEl = el("quiz-container");
const quizInformationEl = el("quiz-information");
const progressSectionEl = el("progress-section");
const questionPaletteSectionEl = el("question-palette-section");
const quizControlsEl = el("quiz-controls");

function formatTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return (
    String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0")
  );
}

function getAnsweredCount() {
  return userAnswers.filter((a) => a !== null).length;
}

function getCorrectCount() {
  return activeQuestions.reduce((total, q, i) => {
    return total + (userAnswers[i] === q.correctIndex ? 1 : 0);
  }, 0);
}

function getIncorrectCount() {
  return activeQuestions.reduce((total, q, i) => {
    if (userAnswers[i] === null) return total;
    return total + (userAnswers[i] !== q.correctIndex ? 1 : 0);
  }, 0);
}

function showNotification(message, duration = 3000) {
  if (!notificationMessageEl) return;
  notificationMessageEl.textContent = message;
  if (notificationContainerEl) {
    notificationContainerEl.classList.add("show", "notification-show");
  }
  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    if (notificationContainerEl) {
      notificationContainerEl.classList.remove("show", "notification-show");
    }
    notificationMessageEl.textContent = "";
  }, duration);
}

function openDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.showModal === "function") {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === "function" && dialog.open) {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}

function updateTimerDisplay() {
  if (quizTimerEl) quizTimerEl.textContent = formatTime(timeRemaining);

  if (quizTimerEl) {
    quizTimerEl.classList.toggle("timer-low", timeRemaining <= 60);
    quizTimerEl.classList.toggle(
      "timer-warning",
      timeRemaining <= 300 && timeRemaining > 60,
    );
  }
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    if (isSubmitted) {
      stopTimer();
      return;
    }
    timeRemaining -= 1;
    updateTimerDisplay();

    if (timeRemaining <= 0) {
      timeRemaining = 0;
      updateTimerDisplay();
      stopTimer();
      showNotification("Time is up! Your answers have been submitted automatically.");
      submitQuiz(true);
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateStats() {
  const answered = getAnsweredCount();
  const remaining = TOTAL_QUESTIONS - answered;
  const correct = getCorrectCount();
  const liveScore = correct * POINTS_PER_QUESTION;

  if (totalQuestionsEl) totalQuestionsEl.textContent = TOTAL_QUESTIONS;
  if (answeredCountEl) answeredCountEl.textContent = answered;
  if (remainingCountEl) remainingCountEl.textContent = remaining;
  if (currentScoreEl) currentScoreEl.textContent = liveScore;

  const percentage = Math.round((answered / TOTAL_QUESTIONS) * 100);
  if (progressPercentageEl) progressPercentageEl.textContent = percentage + "%";
  if (progressBarEl) progressBarEl.style.width = percentage + "%";
  if (progressContainerEl) {
    progressContainerEl.setAttribute("aria-valuenow", String(answered));
    progressContainerEl.setAttribute("aria-valuemax", String(TOTAL_QUESTIONS));
  }
}

function updatePalette() {
  paletteButtons.forEach((btn) => {
    const qNum = Number(btn.dataset.question);
    const idx = qNum - 1;
    const isCurrent = idx === currentQuestionIndex;
    const isAnswered = userAnswers[idx] !== null;
    const isMarked = markedQuestions.has(idx);

    btn.classList.remove(
      "current",
      "current-question",
      "answered",
      "marked",
      "unanswered",
      "answered-marked",
    );
    btn.classList.toggle("current", isCurrent);
    btn.classList.toggle("current-question", isCurrent);

    if (isAnswered && isMarked) {
      btn.classList.add("answered", "marked", "answered-marked");
    } else if (isAnswered) {
      btn.classList.add("answered");
    } else if (isMarked) {
      btn.classList.add("marked");
    } else {
      btn.classList.add("unanswered");
    }

    btn.setAttribute("aria-current", isCurrent ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      "Go to question " +
        qNum +
        (isAnswered ? " (answered)" : " (unanswered)") +
          (isMarked ? " (marked for review)" : ""),
    );
  });
}

function renderQuestion() {
  const q = activeQuestions[currentQuestionIndex];
  const selected = userAnswers[currentQuestionIndex];
  const isMarked = markedQuestions.has(currentQuestionIndex);

  if (questionNumberEl) {
    questionNumberEl.textContent =
      currentQuestionIndex + 1 + "/" + TOTAL_QUESTIONS;
  }

  if (questionTitleEl) questionTitleEl.textContent = q.question;
  if (questionDescriptionEl) {
    questionDescriptionEl.textContent =
      q.category + " • Choose one of the five answers below.";
  }

  answerButtons.forEach((btn, i) => {
    if (answerTextEls[i]) answerTextEls[i].textContent = q.options[i];
    btn.classList.toggle("selected", selected === i);
    btn.classList.toggle("active", selected === i);
    btn.setAttribute("aria-pressed", selected === i ? "true" : "false");
    btn.disabled = false;
  });

  if (questionStatusEl) {
    let status = "Not Answered";
    if (selected !== null && isMarked) status = "Answered & Marked";
    else if (selected !== null) status = "Answered";
    else if (isMarked) status = "Marked";
    questionStatusEl.textContent = status;
    questionStatusEl.classList.toggle("status-answered", selected !== null);
    questionStatusEl.classList.toggle("status-marked", isMarked);
  }

  if (markQuestionBtn) {
    markQuestionBtn.textContent = isMarked
      ? "Unmark Question"
      : "Mark for Review";
    markQuestionBtn.classList.toggle("marked", isMarked);
    markQuestionBtn.setAttribute("aria-pressed", isMarked ? "true" : "false");
  }

  if (feedbackMessageEl) {
    if (selected !== null) {
      feedbackMessageEl.textContent =
        "Answer " +
        ANSWER_LETTERS[selected] +
        " saved. You can still change it before submitting.";
    } else {
      feedbackMessageEl.textContent = "";
    }
  }

  if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
  if (nextBtn) {
    nextBtn.disabled = currentQuestionIndex === TOTAL_QUESTIONS - 1;
    nextBtn.textContent =
      currentQuestionIndex === TOTAL_QUESTIONS - 1 ? "Last Question" : "Next";
  }
  if (clearAnswerBtn) clearAnswerBtn.disabled = selected === null;

  updateStats();
  updatePalette();
}

function selectAnswer(answerIndex) {
  if (isSubmitted) return;
  userAnswers[currentQuestionIndex] = answerIndex;

  answerButtons.forEach((btn, i) => {
    btn.classList.toggle("selected", i === answerIndex);
    btn.classList.toggle("active", i === answerIndex);
    btn.setAttribute("aria-pressed", i === answerIndex ? "true" : "false");
  });

  if (feedbackMessageEl) {
    feedbackMessageEl.textContent =
      "Answer " +
      ANSWER_LETTERS[answerIndex] +
      " saved. You can still change it before submitting.";
  }

  updateStats();

  if (questionStatusEl) {
    const isMarked = markedQuestions.has(currentQuestionIndex);
    questionStatusEl.textContent = isMarked ? "Answered & Marked" : "Answered";
  }
  if (clearAnswerBtn) clearAnswerBtn.disabled = false;

  showNotification(
    "Answer " +
      ANSWER_LETTERS[answerIndex] +
    " saved for question " +
      (currentQuestionIndex + 1) +
      ".",
    1500,
  );
}

function clearAnswer() {
  if (isSubmitted) return;
  if (userAnswers[currentQuestionIndex] === null) {
    showNotification("This question has not been answered.");
    return;
  }
  userAnswers[currentQuestionIndex] = null;
  renderQuestion();
  if (feedbackMessageEl)
    feedbackMessageEl.textContent =
      "Answer cleared. Please choose another answer.";
  showNotification("Answer to question " + (currentQuestionIndex + 1) + " cleared.");
}

function goToQuestion(index) {
  if (index < 0 || index >= TOTAL_QUESTIONS) return;
  currentQuestionIndex = index;
  renderQuestion();

  if (quizContainerEl)
    quizContainerEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function goToNext() {
  if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
    goToQuestion(currentQuestionIndex + 1);
  }
}

function goToPrevious() {
  if (currentQuestionIndex > 0) {
    goToQuestion(currentQuestionIndex - 1);
  }
}

function toggleMark() {
  if (isSubmitted) return;
  if (markedQuestions.has(currentQuestionIndex)) {
    markedQuestions.delete(currentQuestionIndex);
    showNotification(
      "Review mark removed from question " + (currentQuestionIndex + 1) + ".",
    );
  } else {
    markedQuestions.add(currentQuestionIndex);
    showNotification(
      "Question " + (currentQuestionIndex + 1) + " marked for review.",
    );
  }
  renderQuestion();
}

function togglePalette() {
  const isHidden = questionPaletteEl.style.display === "none";
  if (isHidden) {
    questionPaletteEl.style.display = "";
    questionPaletteEl.classList.remove("palette-hidden", "collapsed");
    togglePaletteBtn.textContent = "Toggle Navigator";
    togglePaletteBtn.setAttribute("aria-expanded", "true");
  } else {
    questionPaletteEl.style.display = "none";
    questionPaletteEl.classList.add("palette-hidden", "collapsed");
    togglePaletteBtn.textContent = "Show Navigator";
    togglePaletteBtn.setAttribute("aria-expanded", "false");
  }
}

function openSubmitConfirmation() {
  const answered = getAnsweredCount();
  const unanswered = TOTAL_QUESTIONS - answered;

  if (confirmationMessageEl) {
    confirmationMessageEl.textContent =
      "You have answered " +
      answered +
      " out of " +
      TOTAL_QUESTIONS +
      " questions. " +
      "Are you sure you want to submit your answers?";
  }

  if (unansweredWarningEl) {
    if (unanswered > 0) {
      unansweredWarningEl.textContent =
        "You still have " + unanswered + " unanswered question(s).";
      unansweredWarningEl.style.display = "";
      unansweredWarningEl.hidden = false;
    } else {
      unansweredWarningEl.textContent = "All questions have been answered. Great!";
      unansweredWarningEl.style.display = "";
      unansweredWarningEl.hidden = false;
    }
  }

  openDialog(submitDialog);
}

function getGrade(percentage) {
  if (percentage >= 90)
    return {
      label: "A - Excellent!",
      message: "Excellent! You have mastered this material.",
    };
  if (percentage >= 80)
    return {
      label: "B - Very Good",
      message: "Great work! You're just a little short of a perfect score.",
    };
  if (percentage >= 70)
    return {
      label: "C - Good",
      message: "Well done! You understand most of the material.",
    };
  if (percentage >= 60)
    return {
      label: "D - Fair",
      message: "Not bad. Review the answers you got wrong.",
    };
  return {
    label: "E - Needs Improvement",
    message: "Don't give up! Review your answers and try again.",
  };
}

function submitQuiz(isAutoSubmit = false) {
  if (isSubmitted) return;
  isSubmitted = true;
  stopTimer();
  closeDialog(submitDialog);

  const correct = getCorrectCount();
  const incorrect = getIncorrectCount();
  const answered = getAnsweredCount();
  const unanswered = TOTAL_QUESTIONS - answered;
  const finalScore = correct * POINTS_PER_QUESTION;
  const percentage = Math.round((correct / TOTAL_QUESTIONS) * 100);
  const grade = getGrade(percentage);

  const timeTakenSeconds = TOTAL_TIME - timeRemaining;
  const avgSeconds =
    TOTAL_QUESTIONS > 0 ? Math.round(timeTakenSeconds / TOTAL_QUESTIONS) : 0;

  if (resultMessageEl) resultMessageEl.textContent = grade.message;
  if (finalScoreEl) finalScoreEl.textContent = finalScore;
  if (finalPercentageEl) finalPercentageEl.textContent = percentage + "%";
  if (gradeLabelEl) gradeLabelEl.textContent = grade.label;
  if (correctCountEl) correctCountEl.textContent = correct;
  if (incorrectCountEl) incorrectCountEl.textContent = incorrect;
  if (finalUnansweredCountEl) finalUnansweredCountEl.textContent = unanswered;
  if (finalTotalQuestionsEl)
    finalTotalQuestionsEl.textContent = TOTAL_QUESTIONS;
  if (totalTimeTakenEl)
    totalTimeTakenEl.textContent = formatTime(timeTakenSeconds);
  if (averageTimeEl) averageTimeEl.textContent = formatTime(avgSeconds);

  if (currentScoreEl) currentScoreEl.textContent = finalScore;

  if (quizContainerEl) quizContainerEl.hidden = true;
  if (quizInformationEl) quizInformationEl.hidden = true;
  if (progressSectionEl) progressSectionEl.hidden = true;
  if (questionPaletteSectionEl) questionPaletteSectionEl.hidden = true;
  if (quizControlsEl) quizControlsEl.hidden = true;
  if (reviewContainerEl) reviewContainerEl.hidden = true;
  if (resultContainerEl) {
    resultContainerEl.hidden = false;
    resultContainerEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  answerButtons.forEach((btn) => (btn.disabled = true));
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = true;
  if (clearAnswerBtn) clearAnswerBtn.disabled = true;
  if (markQuestionBtn) markQuestionBtn.disabled = true;

  showNotification(
    isAutoSubmit
      ? "Time is up. The quiz was submitted automatically. Your score: " +
          finalScore +
          " (" +
          percentage +
          "%)."
      : "Quiz submitted successfully! Your score: " +
          finalScore +
          " (" +
          percentage +
          "%).",
  );
}

function renderReview() {
  if (!reviewListEl) return;
  reviewListEl.innerHTML = "";

  const correct = getCorrectCount();
  const incorrect = getIncorrectCount();

  if (reviewCorrectTotalEl)
    reviewCorrectTotalEl.textContent = "Correct: " + correct;
  if (reviewIncorrectTotalEl)
    reviewIncorrectTotalEl.textContent = "Incorrect: " + incorrect;

  activeQuestions.forEach((q, i) => {
    const user = userAnswers[i];
    const isCorrect = user === q.correctIndex;
    const isUnanswered = user === null;

    const item = document.createElement("article");
    item.className =
      "review-item" +
      (isUnanswered
        ? " review-unanswered"
        : isCorrect
          ? " review-correct"
          : " review-incorrect");

    const title = document.createElement("h3");
    title.className = "review-question-title";
    title.textContent = "Question " + (i + 1) + ": " + q.question;

    const cat = document.createElement("p");
    cat.className = "review-category";
    cat.textContent = q.category;

    const list = document.createElement("ul");
    list.className = "review-options";

    q.options.forEach((opt, optIdx) => {
      const li = document.createElement("li");
      li.className = "review-option";
      let label = ANSWER_LETTERS[optIdx] + ". " + opt;

      if (optIdx === q.correctIndex) {
        li.classList.add("review-option-correct");
        label += " ✓ (Correct answer)";
      }
      if (user !== null && optIdx === user && user !== q.correctIndex) {
        li.classList.add("review-option-wrong");
        label += " ✗ (Your answer)";
      }
      if (user !== null && optIdx === user && user === q.correctIndex) {
        label += " ✓ (Your answer)";
      }
      li.textContent = label;
      list.appendChild(li);
    });

    const status = document.createElement("p");
    status.className = "review-status";
    if (isUnanswered) {
      status.textContent =
        "Status: Unanswered — Correct answer: " +
        ANSWER_LETTERS[q.correctIndex];
    } else if (isCorrect) {
      status.textContent = "Status: Correct ✓";
    } else {
      status.textContent =
        "Status: Incorrect ✗ — Your answer: " +
        ANSWER_LETTERS[user] +
        ", Correct answer: " +
        ANSWER_LETTERS[q.correctIndex];
    }

    const expl = document.createElement("p");
    expl.className = "review-explanation";
    expl.textContent = "Explanation: " + q.explanation;

    item.appendChild(title);
    item.appendChild(cat);
    item.appendChild(list);
    item.appendChild(status);
    item.appendChild(expl);
    reviewListEl.appendChild(item);
  });
}

function showReview() {
  if (!isSubmitted) return;
  renderReview();
  if (resultContainerEl) resultContainerEl.hidden = true;
  if (reviewContainerEl) {
    reviewContainerEl.hidden = false;
    reviewContainerEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function backToResults() {
  if (reviewContainerEl) reviewContainerEl.hidden = true;
  if (resultContainerEl) {
    resultContainerEl.hidden = false;
    resultContainerEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function resetQuiz() {
  activeQuestions = buildShuffledQuiz();
  currentQuestionIndex = 0;
  userAnswers = Array(TOTAL_QUESTIONS).fill(null);
  markedQuestions.clear();
  isSubmitted = false;
  timeRemaining = TOTAL_TIME;

  closeDialog(submitDialog);
  closeDialog(restartDialog);

  if (quizContainerEl) quizContainerEl.hidden = false;
  if (quizInformationEl) quizInformationEl.hidden = false;
  if (progressSectionEl) progressSectionEl.hidden = false;
  if (questionPaletteSectionEl) questionPaletteSectionEl.hidden = false;
  if (quizControlsEl) quizControlsEl.hidden = false;
  if (resultContainerEl) resultContainerEl.hidden = true;
  if (reviewContainerEl) reviewContainerEl.hidden = true;

  if (questionPaletteEl) {
    questionPaletteEl.style.display = "";
    questionPaletteEl.classList.remove("palette-hidden", "collapsed");
  }
  if (togglePaletteBtn) {
    togglePaletteBtn.textContent = "Toggle Navigator";
    togglePaletteBtn.setAttribute("aria-expanded", "true");
  }

  if (markQuestionBtn) markQuestionBtn.disabled = false;
  if (clearAnswerBtn) clearAnswerBtn.disabled = false;

  if (reviewListEl) reviewListEl.innerHTML = "";

  updateTimerDisplay();
  renderQuestion();
  startTimer();
  showNotification("Questions shuffled for a new attempt. Good luck!");

  if (quizContainerEl)
    quizContainerEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function initEventListeners() {
  answerButtons.forEach((btn, i) => {
    btn.addEventListener("click", () => selectAnswer(i));
  });

  if (prevBtn) prevBtn.addEventListener("click", goToPrevious);
  if (nextBtn) nextBtn.addEventListener("click", goToNext);
  if (clearAnswerBtn) clearAnswerBtn.addEventListener("click", clearAnswer);

  if (markQuestionBtn) markQuestionBtn.addEventListener("click", toggleMark);

  paletteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const num = Number(btn.dataset.question);
      goToQuestion(num - 1);
    });
  });

  if (togglePaletteBtn)
    togglePaletteBtn.addEventListener("click", togglePalette);

  if (submitQuizBtn)
    submitQuizBtn.addEventListener("click", openSubmitConfirmation);
  if (cancelSubmitBtn)
    cancelSubmitBtn.addEventListener("click", () => closeDialog(submitDialog));
  if (confirmSubmitBtn)
    confirmSubmitBtn.addEventListener("click", () => submitQuiz(false));

  if (restartQuizBtn)
    restartQuizBtn.addEventListener("click", () => openDialog(restartDialog));
  if (cancelRestartBtn)
    cancelRestartBtn.addEventListener("click", () =>
      closeDialog(restartDialog),
    );
  if (confirmRestartBtn) confirmRestartBtn.addEventListener("click", resetQuiz);

  if (reviewAnswersBtn) reviewAnswersBtn.addEventListener("click", showReview);
  if (playAgainBtn) playAgainBtn.addEventListener("click", resetQuiz);

  if (backToResultsBtn)
    backToResultsBtn.addEventListener("click", backToResults);

  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    if (isSubmitted) return;
    if (submitDialog && submitDialog.open) return;
    if (restartDialog && restartDialog.open) return;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      goToNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goToPrevious();
    } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
      selectAnswer(Number(e.key) - 1);
    } else if (
      ["a", "b", "c", "d", "e", "A", "B", "C", "D", "E"].includes(e.key)
    ) {
      const idx = ANSWER_LETTERS.indexOf(e.key.toUpperCase());
      selectAnswer(idx);
    }
  });

  [submitDialog, restartDialog].forEach((dlg) => {
    if (!dlg) return;
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) closeDialog(dlg);
    });
  });
}

function initQuiz() {
  activeQuestions = buildShuffledQuiz();
  if (totalQuestionsEl) totalQuestionsEl.textContent = TOTAL_QUESTIONS;
  if (finalTotalQuestionsEl)
    finalTotalQuestionsEl.textContent = TOTAL_QUESTIONS;

  updateTimerDisplay();
  initEventListeners();
  renderQuestion();
  startTimer();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initQuiz);
} else {
  initQuiz();
}
