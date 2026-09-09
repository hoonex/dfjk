const QUESTIONS = [
  { id: 1, cue: "What specific future technology...", question: "What specific future technology or innovation are you most interested in exploring, and why?", answer: "I am interested in AI because it can make our lives easier." },
  { id: 2, cue: "How has a specific piece...", question: "How has a specific piece of modern technology significantly changed your daily routine or habits?", answer: "My smartphone changed my daily life because it makes many things easier." },
  { id: 3, cue: "Do you think technological advancements...", question: "Do you think technological advancements make human connections stronger or more isolated?", answer: "I think technology makes human connections stronger because we can communicate more easily." },
  { id: 4, cue: "In what ways do you think automation...", question: "In what ways do you think automation and AI will impact the future job market?", answer: "I think AI will replace some jobs, but it will also create new jobs." },
  { id: 5, cue: "What is the most serious ethical...", question: "What is the most serious ethical concern regarding the rapid development of biotechnology or AI?", answer: "The biggest problem is that AI may use personal information without permission." },
  { id: 6, cue: "How can society address the digital...", question: "How can society address the digital divide between generations or different economic classes?", answer: "Society should give free digital lessons and cheaper devices to everyone." },
  { id: 7, cue: "How does this technological issue...", question: "How does this technological issue relate to your future academic major or dream career?", answer: "This issue relates to my future computer science major because I want to build useful technology." },
  { id: 8, cue: "If you become a professional...", question: "If you become a professional in your field, what innovative solution would you like to introduce?", answer: "If I become a software engineer, I want to create safe AI tools for everyone." },
  { id: 9, cue: "What interdisciplinary knowledge...", question: "What interdisciplinary knowledge do you think is necessary to tackle complex modern technology problems?", answer: "We need knowledge of technology, science, math, and communication to solve problems." },
  { id: 10, cue: "Are you generally optimistic or pessimistic...", question: "Are you generally optimistic or pessimistic about living in a heavily tech-driven future society?", answer: "I am optimistic because technology can make our lives easier and better." },
  { id: 11, cue: "What is your final message...", question: "What is your final message on how humans should coexist with advanced technology?", answer: "Humans should use advanced technology wisely and always keep people in control." }
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
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
  missedIds: new Set(),
  feedbackOpen: false,
  currentHadHelp: false,
  mode: "random",
  lives: 5
};

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function loadStats() {
  const totalXp = Number(localStorage.getItem("recallRushXp") || 0);
  const activity = safeJson(localStorage.getItem("recallRushActivity"), {});
  const today = localDateKey(new Date());
  const yesterday = localDateKey(new Date(Date.now() - 86400000));
  let streak = Number(activity.streak || 0);
  if (activity.lastDate && activity.lastDate !== today && activity.lastDate !== yesterday) streak = 0;
  $("#totalXp").textContent = totalXp;
  $("#streakDays").textContent = streak;
  const mastery = Math.min(100, Math.round(totalXp / 3));
  $("#masteryPercent").textContent = `${mastery}%`;
  $("#goalRingValue").textContent = Math.min(5, Number(localStorage.getItem("recallRushSessions") || 0));
}

function safeJson(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

function saveCompletion(xp) {
  const currentXp = Number(localStorage.getItem("recallRushXp") || 0);
  localStorage.setItem("recallRushXp", String(currentXp + xp));
  localStorage.setItem("recallRushSessions", String(Number(localStorage.getItem("recallRushSessions") || 0) + 1));
  const activity = safeJson(localStorage.getItem("recallRushActivity"), {});
  const today = localDateKey(new Date());
  const yesterday = localDateKey(new Date(Date.now() - 86400000));
  let streak = Number(activity.streak || 0);
  if (activity.lastDate !== today) streak = activity.lastDate === yesterday ? streak + 1 : 1;
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
  const chosen = customItems || (mode === "all" ? [...QUESTIONS] : shuffle(QUESTIONS).slice(0, 5));
  state.queue = chosen.map((q) => ({ ...q, review: false }));
  state.originalCount = chosen.length;
  state.position = 0;
  state.current = null;
  state.sessionXp = 0;
  state.firstTryCorrect = 0;
  state.missedIds = new Set();
  state.feedbackOpen = false;
  state.currentHadHelp = false;
  state.lives = 5;
  switchScreen(lessonScreen);
  renderQuestion();
}

function switchScreen(target) {
  [homeScreen, lessonScreen, resultScreen].forEach((screen) => screen.classList.toggle("is-hidden", screen !== target));
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderQuestion() {
  if (state.position >= state.queue.length) return finishSession();
  state.current = state.queue[state.position];
  state.feedbackOpen = false;
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
  $("#questionCounter").textContent = `${Math.min(state.position + 1, state.originalCount)} / ${state.originalCount}${state.current.review ? " · 다시" : ""}`;
  $("#lessonLives").textContent = state.lives;
  updateProgress();
  setTimeout(() => answerInput.focus({ preventScroll: true }), 70);
}

function updateProgress() {
  const completed = Math.min(state.position, state.originalCount);
  $("#progressBar").style.width = `${state.originalCount ? (completed / state.originalCount) * 100 : 0}%`;
}

function normalize(text) {
  return text.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
}

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  const longest = Math.max(na.length, nb.length);
  return longest ? 1 - levenshtein(na, nb) / longest : 1;
}

function checkAnswer() {
  if (state.feedbackOpen) return goNext();
  const typed = answerInput.value.trim();
  if (!typed) return;
  const score = similarity(typed, state.current.answer);
  const exact = normalize(typed) === normalize(state.current.answer);
  if (exact || score >= 0.93) handleCorrect(exact, score);
  else handleIncorrect(score);
}

function handleCorrect(exact, score) {
  state.feedbackOpen = true;
  const cleanFirstTry = !state.current.review && !state.currentHadHelp && !state.missedIds.has(state.current.id);
  if (cleanFirstTry) state.firstTryCorrect += 1;
  const earned = state.currentHadHelp ? 5 : state.current.review ? 7 : 10;
  state.sessionXp += earned;
  const nearly = !exact && score < 0.985;
  showFeedback("correct", nearly ? "거의 맞았어!" : "잘했어!", nearly ? `실전 답: ${state.current.answer}` : `+${earned} XP · 이 연결 그대로 기억하면 됨.`);
  lockExercise("계속");
  animateMascot("celebrate");
}

function handleIncorrect(score) {
  state.feedbackOpen = true;
  state.lives = Math.max(0, state.lives - 1);
  $("#lessonLives").textContent = state.lives;
  state.missedIds.add(state.current.id);
  ensureReviewQueued(state.current);
  showFeedback("incorrect", "아깝다!", `${Math.max(0, Math.round(score * 100))}% 일치 · 정답: ${state.current.answer}`);
  lockExercise("계속");
  animateMascot("oops");
}

function showFeedback(type, title, text) {
  feedback.classList.remove("is-hidden");
  lessonFooter.classList.remove("correct", "incorrect");
  lessonFooter.classList.add(type);
  $("#feedbackTitle").textContent = title;
  $("#feedbackText").textContent = text;
  $(".feedback-icon").textContent = type === "correct" ? "✓" : "×";
}

function lockExercise(buttonText) {
  answerInput.disabled = true;
  checkButton.disabled = false;
  checkButton.textContent = buttonText;
  $("#hintButton").disabled = true;
  $("#revealButton").disabled = true;
}

function ensureReviewQueued(question) {
  const exists = state.queue.slice(state.position + 1).some((item) => item.id === question.id && item.review);
  if (!exists) state.queue.push({ ...question, review: true });
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
  state.missedIds.add(state.current.id);
  ensureReviewQueued(state.current);
  answerInput.value = state.current.answer;
  state.feedbackOpen = true;
  showFeedback("incorrect", "정답을 눈에 익혀", state.current.answer);
  lockExercise("외웠으면 계속");
  animateMascot("oops");
}

function animateMascot(className) {
  lessonMascot.classList.remove("celebrate", "oops");
  void lessonMascot.offsetWidth;
  lessonMascot.classList.add(className);
  setTimeout(() => lessonMascot.classList.remove(className), 600);
}

function finishSession() {
  $("#progressBar").style.width = "100%";
  const missed = QUESTIONS.filter((q) => state.missedIds.has(q.id));
  const accuracy = state.originalCount ? Math.round((state.firstTryCorrect / state.originalCount) * 100) : 0;
  $("#accuracyStat").textContent = `${accuracy}%`;
  $("#xpStat").textContent = state.sessionXp;
  $("#missedStat").textContent = missed.length;
  let message = "";
  if (accuracy === 100) message = "완벽함. 이제 질문 앞부분만 보여도 답이 바로 연결되는 수준임.";
  else if (accuracy >= 80) message = "거의 끝났음. 막힌 문장만 한 번 더 돌리면 됨.";
  else if (accuracy >= 50) message = "연결은 생겼음. 틀린 문장만 다시 돌리는 게 제일 빠름.";
  else message = "아직 질문→답 연결이 약함. 전체보다 막힌 문장부터 반복하자.";
  $("#resultMessage").textContent = message;

  const list = $("#missedList");
  list.innerHTML = "";
  if (missed.length) {
    missed.forEach((q) => {
      const item = document.createElement("div");
      item.className = "missed-item";
      item.innerHTML = `<span class="missed-index">Q${q.id}</span><div><strong>${escapeHtml(q.cue)}</strong><p>${escapeHtml(q.answer)}</p></div>`;
      list.appendChild(item);
    });
    $("#missedPanel").classList.remove("is-hidden");
    $("#retryMissed").classList.remove("is-hidden");
    $("#retryMissed").dataset.ids = missed.map((q) => q.id).join(",");
  } else {
    $("#missedPanel").classList.add("is-hidden");
    $("#retryMissed").classList.add("is-hidden");
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

function openDialog(selector) {
  const dialog = $(selector);
  if (typeof dialog.showModal === "function") dialog.showModal();
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
$("#exitLesson").addEventListener("click", () => openDialog("#exitDialog"));
$("#keepLearning").addEventListener("click", () => $("#exitDialog").close());
$("#confirmExit").addEventListener("click", backHome);
$("#backHome").addEventListener("click", backHome);
$("#newRandom").addEventListener("click", () => startSession("random"));
$("#retryMissed").addEventListener("click", (event) => {
  const ids = event.currentTarget.dataset.ids.split(",").filter(Boolean).map(Number);
  startSession("review", QUESTIONS.filter((q) => ids.includes(q.id)));
});
$("#unitGuide").addEventListener("click", () => openDialog("#guideDialog"));
$("#closeGuide").addEventListener("click", () => $("#guideDialog").close());
$$('[data-mode]').forEach((button) => button.addEventListener("click", () => startSession(button.dataset.mode)));

loadStats();
