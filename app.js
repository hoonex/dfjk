const QUESTIONS = [
  {
    id: 1,
    cue: "What specific future technology...",
    question: "What specific future technology or innovation are you most interested in exploring, and why?",
    answer: "I am interested in AI because it can make our lives easier."
  },
  {
    id: 2,
    cue: "How has a specific piece...",
    question: "How has a specific piece of modern technology significantly changed your daily routine or habits?",
    answer: "My smartphone changed my daily life because it makes many things easier."
  },
  {
    id: 3,
    cue: "Do you think technological advancements...",
    question: "Do you think technological advancements make human connections stronger or more isolated?",
    answer: "I think technology makes human connections stronger because we can communicate more easily."
  },
  {
    id: 4,
    cue: "In what ways do you think automation...",
    question: "In what ways do you think automation and AI will impact the future job market?",
    answer: "I think AI will replace some jobs, but it will also create new jobs."
  },
  {
    id: 5,
    cue: "What is the most serious ethical...",
    question: "What is the most serious ethical concern regarding the rapid development of biotechnology or AI?",
    answer: "The biggest problem is that AI may use personal information without permission."
  },
  {
    id: 6,
    cue: "How can society address the digital...",
    question: "How can society address the digital divide between generations or different economic classes?",
    answer: "Society should give free digital lessons and cheaper devices to everyone."
  },
  {
    id: 7,
    cue: "How does this technological issue...",
    question: "How does this technological issue relate to your future academic major or dream career?",
    answer: "This issue relates to my future computer science major because I want to build useful technology."
  },
  {
    id: 8,
    cue: "If you become a professional...",
    question: "If you become a professional in your field, what innovative solution would you like to introduce?",
    answer: "If I become a software engineer, I want to create safe AI tools for everyone."
  },
  {
    id: 9,
    cue: "What interdisciplinary knowledge...",
    question: "What interdisciplinary knowledge do you think is necessary to tackle complex modern technology problems?",
    answer: "We need knowledge of technology, science, math, and communication to solve problems."
  },
  {
    id: 10,
    cue: "Are you generally optimistic or pessimistic...",
    question: "Are you generally optimistic or pessimistic about living in a heavily tech-driven future society?",
    answer: "I am optimistic because technology can make our lives easier and better."
  },
  {
    id: 11,
    cue: "What is your final message...",
    question: "What is your final message on how humans should coexist with advanced technology?",
    answer: "Humans should use advanced technology wisely and always keep people in control."
  }
];

const $ = (selector) => document.querySelector(selector);
const homeScreen = $("#homeScreen");
const lessonScreen = $("#lessonScreen");
const resultScreen = $("#resultScreen");
const answerInput = $("#answerInput");
const checkButton = $("#checkButton");
const feedback = $("#feedback");
const lessonFooter = $("#lessonFooter");
const lessonMascot = $("#lessonMascot");

const state = {
  queue: [],
  originalCount: 0,
  position: 0,
  current: null,
  sessionXp: 0,
  firstTryCorrect: 0,
  attempts: 0,
  missedIds: new Set(),
  revealedIds: new Set(),
  feedbackOpen: false,
  currentWasCorrect: false,
  currentHadHelp: false,
  mode: "random"
};

function loadStats() {
  const totalXp = Number(localStorage.getItem("recallRushXp") || 0);
  const activity = JSON.parse(localStorage.getItem("recallRushActivity") || "{}");
  const today = localDateKey(new Date());
  let streak = Number(activity.streak || 0);
  const yesterday = localDateKey(new Date(Date.now() - 86400000));
  if (activity.lastDate && activity.lastDate !== today && activity.lastDate !== yesterday) streak = 0;
  $("#totalXp").textContent = totalXp;
  $("#streakDays").textContent = streak;
}

function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function saveCompletion(xp) {
  const currentXp = Number(localStorage.getItem("recallRushXp") || 0);
  localStorage.setItem("recallRushXp", String(currentXp + xp));

  const activity = JSON.parse(localStorage.getItem("recallRushActivity") || "{}");
  const today = localDateKey(new Date());
  const yesterday = localDateKey(new Date(Date.now() - 86400000));
  let streak = Number(activity.streak || 0);
  if (activity.lastDate !== today) {
    streak = activity.lastDate === yesterday ? streak + 1 : 1;
  }
  localStorage.setItem("recallRushActivity", JSON.stringify({ lastDate: today, streak }));
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function startSession(mode, customItems = null) {
  state.mode = mode;
  const chosen = customItems || (mode === "random" ? shuffle(QUESTIONS).slice(0, 5) : [...QUESTIONS]);
  state.queue = chosen.map((q) => ({ ...q, review: false }));
  state.originalCount = chosen.length;
  state.position = 0;
  state.current = null;
  state.sessionXp = 0;
  state.firstTryCorrect = 0;
  state.attempts = 0;
  state.missedIds = new Set();
  state.revealedIds = new Set();
  state.feedbackOpen = false;
  state.currentWasCorrect = false;
  state.currentHadHelp = false;

  switchScreen(lessonScreen);
  renderQuestion();
}

function switchScreen(target) {
  [homeScreen, lessonScreen, resultScreen].forEach((screen) => screen.classList.toggle("is-hidden", screen !== target));
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderQuestion() {
  if (state.position >= state.queue.length) {
    finishSession();
    return;
  }

  state.current = state.queue[state.position];
  state.feedbackOpen = false;
  state.currentWasCorrect = false;
  state.currentHadHelp = false;
  answerInput.value = "";
  answerInput.disabled = false;
  $("#hintBox").classList.add("is-hidden");
  $("#hintBox").textContent = "";
  $("#fullQuestion").classList.add("is-hidden");
  $("#fullQuestionToggle").textContent = "전체 질문 보기";
  feedback.classList.add("is-hidden");
  lessonFooter.classList.remove("correct", "incorrect");
  checkButton.textContent = "확인";
  checkButton.disabled = true;
  $("#hintButton").disabled = false;
  $("#revealButton").disabled = false;

  $("#questionCue").textContent = state.current.cue;
  $("#fullQuestion").textContent = state.current.question;
  $("#questionCounter").textContent = `${Math.min(state.position + 1, state.originalCount)} / ${state.originalCount}${state.current.review ? " · 복습" : ""}`;
  $("#sessionXp").textContent = state.sessionXp;
  updateProgress();

  setTimeout(() => answerInput.focus({ preventScroll: true }), 80);
}

function updateProgress() {
  const baseDone = Math.min(state.position, state.originalCount);
  const percent = state.originalCount ? (baseDone / state.originalCount) * 100 : 0;
  $("#progressBar").style.width = `${percent}%`;
}

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  const longest = Math.max(na.length, nb.length);
  return longest === 0 ? 1 : 1 - levenshtein(na, nb) / longest;
}

function checkAnswer() {
  if (state.feedbackOpen) {
    goNext();
    return;
  }

  const typed = answerInput.value.trim();
  if (!typed) return;

  state.attempts += 1;
  const score = similarity(typed, state.current.answer);
  const exact = normalize(typed) === normalize(state.current.answer);
  const accepted = exact || score >= 0.93;

  if (accepted) {
    handleCorrect(exact, score);
  } else {
    handleIncorrect(score);
  }
}

function handleCorrect(exact, score) {
  state.feedbackOpen = true;
  state.currentWasCorrect = true;
  const fresh = !state.current.review && !state.currentHadHelp && !state.missedIds.has(state.current.id);
  if (fresh) state.firstTryCorrect += 1;

  const earned = state.currentHadHelp ? 5 : state.current.review ? 7 : 10;
  state.sessionXp += earned;
  $("#sessionXp").textContent = state.sessionXp;

  const nearly = !exact && score < 0.985;
  showFeedback(
    "correct",
    nearly ? "거의 정확해!" : "정답!",
    nearly ? `시험에서는 이렇게 말하면 돼: ${state.current.answer}` : `+${earned} XP · 이 연결 그대로 기억하면 됨.`
  );
  answerInput.disabled = true;
  checkButton.textContent = "계속";
  $("#hintButton").disabled = true;
  $("#revealButton").disabled = true;
  animateMascot("celebrate");
}

function handleIncorrect(score) {
  state.feedbackOpen = true;
  state.currentWasCorrect = false;
  state.missedIds.add(state.current.id);
  ensureReviewQueued(state.current);

  const percent = Math.max(0, Math.round(score * 100));
  showFeedback("incorrect", "이 문장은 한 번 더", `${percent}% 일치 · 정답: ${state.current.answer}`);
  answerInput.disabled = true;
  checkButton.textContent = "정답 보고 계속";
  $("#hintButton").disabled = true;
  $("#revealButton").disabled = true;
  animateMascot("oops");
}

function showFeedback(type, title, text) {
  feedback.classList.remove("is-hidden");
  lessonFooter.classList.remove("correct", "incorrect");
  lessonFooter.classList.add(type);
  $("#feedbackTitle").textContent = title;
  $("#feedbackText").textContent = text;
  $(".feedback-icon").textContent = type === "correct" ? "✓" : "↻";
}

function ensureReviewQueued(question) {
  const alreadyQueued = state.queue.slice(state.position + 1).some((item) => item.id === question.id && item.review);
  if (!alreadyQueued) state.queue.push({ ...question, review: true });
}

function goNext() {
  state.position += 1;
  renderQuestion();
}

function revealHint() {
  if (!state.current || state.feedbackOpen) return;
  state.currentHadHelp = true;
  const words = state.current.answer.replace(/[.,]/g, "").split(/\s+/);
  const amount = Math.min(4, Math.max(3, Math.ceil(words.length * 0.25)));
  $("#hintBox").textContent = `시작: ${words.slice(0, amount).join(" ")} ...`;
  $("#hintBox").classList.remove("is-hidden");
}

function revealAnswer() {
  if (!state.current || state.feedbackOpen) return;
  state.currentHadHelp = true;
  state.revealedIds.add(state.current.id);
  state.missedIds.add(state.current.id);
  ensureReviewQueued(state.current);
  answerInput.value = state.current.answer;
  answerInput.disabled = true;
  state.feedbackOpen = true;
  state.currentWasCorrect = false;
  showFeedback("incorrect", "정답을 눈에 익혀", state.current.answer);
  checkButton.textContent = "외웠으면 계속";
  $("#hintButton").disabled = true;
  $("#revealButton").disabled = true;
  animateMascot("oops");
}

function animateMascot(className) {
  lessonMascot.classList.remove("celebrate", "oops");
  void lessonMascot.offsetWidth;
  lessonMascot.classList.add(className);
  setTimeout(() => lessonMascot.classList.remove(className), 650);
}

function finishSession() {
  $("#progressBar").style.width = "100%";
  const missed = QUESTIONS.filter((q) => state.missedIds.has(q.id));
  const accuracy = state.originalCount ? Math.round((state.firstTryCorrect / state.originalCount) * 100) : 0;

  $("#accuracyStat").textContent = `${accuracy}%`;
  $("#xpStat").textContent = state.sessionXp;
  $("#missedStat").textContent = missed.length;

  let message = "";
  if (accuracy === 100) message = "5개가 랜덤으로 나와도 바로 연결될 수준. 한 번 더 랜덤으로 굳히면 됨.";
  else if (accuracy >= 80) message = "거의 됐어. 막힌 문장만 한 번 더 돌리면 실전 안정성이 올라감.";
  else if (accuracy >= 50) message = "연결은 만들어지고 있음. 틀린 문장만 다시 돌리는 게 지금 제일 효율적임.";
  else message = "아직 질문→답 연결이 약함. 전체를 다시 보기보다 막힌 문장부터 반복하는 게 빠름.";
  $("#resultMessage").textContent = message;

  const missedPanel = $("#missedPanel");
  const missedList = $("#missedList");
  const retryMissed = $("#retryMissed");
  missedList.innerHTML = "";
  if (missed.length) {
    missed.forEach((q) => {
      const item = document.createElement("div");
      item.className = "missed-item";
      item.innerHTML = `<span class="missed-index">Q${q.id}</span><div><strong>${escapeHtml(q.cue)}</strong><p>${escapeHtml(q.answer)}</p></div>`;
      missedList.appendChild(item);
    });
    missedPanel.classList.remove("is-hidden");
    retryMissed.classList.remove("is-hidden");
    retryMissed.dataset.ids = missed.map((q) => q.id).join(",");
  } else {
    missedPanel.classList.add("is-hidden");
    retryMissed.classList.add("is-hidden");
  }

  saveCompletion(state.sessionXp);
  switchScreen(resultScreen);
  loadStats();
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function toggleFullQuestion() {
  const full = $("#fullQuestion");
  const hidden = full.classList.toggle("is-hidden");
  $("#fullQuestionToggle").textContent = hidden ? "전체 질문 보기" : "전체 질문 숨기기";
}

function openExitDialog() {
  const dialog = $("#exitDialog");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else if (window.confirm("현재 학습을 끝낼까?")) backHome();
}

function backHome() {
  const dialog = $("#exitDialog");
  if (dialog.open) dialog.close();
  switchScreen(homeScreen);
  loadStats();
}

answerInput.addEventListener("input", () => {
  if (!state.feedbackOpen) checkButton.disabled = !answerInput.value.trim();
});

answerInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    checkAnswer();
  }
});

checkButton.addEventListener("click", checkAnswer);
$("#hintButton").addEventListener("click", revealHint);
$("#revealButton").addEventListener("click", revealAnswer);
$("#fullQuestionToggle").addEventListener("click", toggleFullQuestion);
$("#exitLesson").addEventListener("click", openExitDialog);
$("#keepLearning").addEventListener("click", () => $("#exitDialog").close());
$("#confirmExit").addEventListener("click", backHome);
$("#backHome").addEventListener("click", backHome);
$("#newRandom").addEventListener("click", () => startSession("random"));
$("#retryMissed").addEventListener("click", (event) => {
  const ids = event.currentTarget.dataset.ids.split(",").filter(Boolean).map(Number);
  const items = QUESTIONS.filter((q) => ids.includes(q.id));
  startSession("review", items);
});

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => startSession(button.dataset.mode));
});

loadStats();
