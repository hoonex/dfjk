const DEFAULT_COURSE = {
  id: "future-tech-speaking",
  title: "Future Technology Speaking",
  description: "질문 앞부분을 보고 답변을 정확하게 떠올리는 연습",
  builtIn: true,
  items: [
    { id: "q1", cue: "What specific future technology...", question: "What specific future technology or innovation are you most interested in exploring, and why?", answer: "I am interested in AI because it can make our lives easier." },
    { id: "q2", cue: "How has a specific piece...", question: "How has a specific piece of modern technology significantly changed your daily routine or habits?", answer: "My smartphone changed my daily life because it makes many things easier." },
    { id: "q3", cue: "Do you think technological advancements...", question: "Do you think technological advancements make human connections stronger or more isolated?", answer: "I think technology makes human connections stronger because we can communicate more easily." },
    { id: "q4", cue: "In what ways do you think automation...", question: "In what ways do you think automation and AI will impact the future job market?", answer: "I think AI will replace some jobs, but it will also create new jobs." },
    { id: "q5", cue: "What is the most serious ethical...", question: "What is the most serious ethical concern regarding the rapid development of biotechnology or AI?", answer: "The biggest problem is that AI may use personal information without permission." },
    { id: "q6", cue: "How can society address the digital...", question: "How can society address the digital divide between generations or different economic classes?", answer: "Society should give free digital lessons and cheaper devices to everyone." },
    { id: "q7", cue: "How does this technological issue...", question: "How does this technological issue relate to your future academic major or dream career?", answer: "This issue relates to my future computer science major because I want to build useful technology." },
    { id: "q8", cue: "If you become a professional...", question: "If you become a professional in your field, what innovative solution would you like to introduce?", answer: "If I become a software engineer, I want to create safe AI tools for everyone." },
    { id: "q9", cue: "What interdisciplinary knowledge...", question: "What interdisciplinary knowledge do you think is necessary to tackle complex modern technology problems?", answer: "We need knowledge of technology, science, math, and communication to solve problems." },
    { id: "q10", cue: "Are you generally optimistic or pessimistic...", question: "Are you generally optimistic or pessimistic about living in a heavily tech-driven future society?", answer: "I am optimistic because technology can make our lives easier and better." },
    { id: "q11", cue: "What is your final message...", question: "What is your final message on how humans should coexist with advanced technology?", answer: "Humans should use advanced technology wisely and always keep people in control." },
  ],
};

const STORE = {
  courses: "recallRushCoursesV2",
  activeCourse: "recallRushActiveCourseV2",
  settings: "recallRushSettingsV2",
  progress: "recallRushProgressV2",
  xp: "recallRushXp",
  activity: "recallRushActivity",
  sessions: "recallRushSessions",
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const clone = (value) => JSON.parse(JSON.stringify(value));
const safeJson = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
};
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
})[char]);

const state = {
  courses: [],
  activeCourseId: null,
  settings: { orderMode: "original", chunkSize: 3 },
  progressByCourse: {},
  path: [],
  selectedLessonId: null,
  editingCourseId: null,
  editorItems: [],
  session: null,
  lastResult: null,
};

function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function loadState() {
  const storedCourses = safeJson(localStorage.getItem(STORE.courses), []);
  state.courses = [clone(DEFAULT_COURSE), ...storedCourses.filter((course) => course && course.id !== DEFAULT_COURSE.id)];
  state.activeCourseId = localStorage.getItem(STORE.activeCourse) || DEFAULT_COURSE.id;
  if (!state.courses.some((course) => course.id === state.activeCourseId)) state.activeCourseId = DEFAULT_COURSE.id;
  state.settings = { ...state.settings, ...safeJson(localStorage.getItem(STORE.settings), {}) };
  state.progressByCourse = safeJson(localStorage.getItem(STORE.progress), {});
  ensureCourseProgress(activeCourse().id);
}

function persistCourses() {
  localStorage.setItem(STORE.courses, JSON.stringify(state.courses.filter((course) => course.id !== DEFAULT_COURSE.id)));
}

function persistProgress() {
  localStorage.setItem(STORE.progress, JSON.stringify(state.progressByCourse));
}

function persistSettings() {
  localStorage.setItem(STORE.settings, JSON.stringify(state.settings));
}

function activeCourse() {
  return state.courses.find((course) => course.id === state.activeCourseId) || state.courses[0];
}

function ensureCourseProgress(courseId) {
  if (!state.progressByCourse[courseId]) {
    state.progressByCourse[courseId] = { completedLessons: [], weak: {}, attempts: {}, mastered: {}, daily: {} };
  }
  const progress = state.progressByCourse[courseId];
  progress.completedLessons ||= [];
  progress.weak ||= {};
  progress.attempts ||= {};
  progress.mastered ||= {};
  progress.daily ||= {};
  return progress;
}

function getCourseProgress() {
  return ensureCourseProgress(activeCourse().id);
}

function getGlobalStats() {
  const totalXp = Number(localStorage.getItem(STORE.xp) || 0);
  const activity = safeJson(localStorage.getItem(STORE.activity), {});
  const today = localDateKey();
  const yesterday = localDateKey(new Date(Date.now() - 86400000));
  let streak = Number(activity.streak || 0);
  if (activity.lastDate && activity.lastDate !== today && activity.lastDate !== yesterday) streak = 0;
  return { totalXp, streak };
}

function saveGlobalCompletion(xp) {
  localStorage.setItem(STORE.xp, String(Number(localStorage.getItem(STORE.xp) || 0) + xp));
  localStorage.setItem(STORE.sessions, String(Number(localStorage.getItem(STORE.sessions) || 0) + 1));
  const activity = safeJson(localStorage.getItem(STORE.activity), {});
  const today = localDateKey();
  const yesterday = localDateKey(new Date(Date.now() - 86400000));
  let streak = Number(activity.streak || 0);
  if (activity.lastDate !== today) streak = activity.lastDate === yesterday ? streak + 1 : 1;
  localStorage.setItem(STORE.activity, JSON.stringify({ lastDate: today, streak }));
}

function makeCue(question) {
  const words = String(question || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  return `${words.slice(0, Math.min(5, words.length)).join(" ")}${words.length > 5 ? "..." : ""}`;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function weakScore(itemId) {
  return Number(getCourseProgress().weak[itemId] || 0);
}

function orderItems(items, mode = state.settings.orderMode) {
  const copy = [...items];
  if (mode === "random") return shuffle(copy);
  if (mode === "weak") return copy.sort((a, b) => weakScore(b.id) - weakScore(a.id));
  return copy;
}

function pathSignature(ids) {
  let hash = 2166136261;
  for (const char of ids.join("|")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function buildPath(course = activeCourse()) {
  const items = course.items || [];
  const chunkSize = Math.max(2, Math.min(4, Number(state.settings.chunkSize) || 3));
  const lessons = [];
  const learned = [];
  let lessonNumber = 1;

  for (let start = 0; start < items.length; start += chunkSize) {
    const chunk = items.slice(start, start + chunkSize);
    const ids = chunk.map((item) => item.id);
    const signature = pathSignature(ids);

    lessons.push({
      id: `learn-${chunkSize}-${start}-${signature}`,
      kind: "learn",
      color: "green",
      icon: "star",
      overline: `LESSON ${lessonNumber++}`,
      title: `새 문장 ${start + 1}–${start + chunk.length}`,
      description: "새 질문과 답을 처음 연결하는 단계.",
      itemIds: ids,
      xpPerItem: 10,
    });

    learned.push(...ids);
    lessons.push({
      id: `review-${chunkSize}-${start}-${signature}`,
      kind: "review",
      color: "blue",
      icon: "bolt",
      overline: `LESSON ${lessonNumber++}`,
      title: `복습 ${start + 1}–${start + chunk.length}`,
      description: "방금 배운 문장을 순서 없이 다시 꺼내기.",
      itemIds: [...ids],
      xpPerItem: 12,
    });

    const checkpointBoundary = start + chunkSize < items.length
      && learned.length >= chunkSize * 2
      && learned.length % (chunkSize * 2) === 0;
    if (checkpointBoundary) {
      lessons.push({
        id: `checkpoint-${chunkSize}-${start}-${pathSignature(learned)}`,
        kind: "checkpoint",
        color: "purple",
        icon: "check",
        overline: "CHECKPOINT",
        title: `${learned.length}문장 중간 점검`,
        description: "지금까지 배운 문장을 섞어서 확인.",
        itemIds: [...learned],
        maxItems: Math.min(6, learned.length),
        xpPerItem: 14,
      });
    }
  }

  if (items.length) {
    lessons.push({
      id: `final-${pathSignature(items.map((item) => item.id))}`,
      kind: "final",
      color: "gold",
      icon: "star",
      overline: "FINAL TEST",
      title: `실전 랜덤 ${Math.min(5, items.length)}`,
      description: "전체 문장에서 랜덤으로 뽑는 최종 점검.",
      itemIds: items.map((item) => item.id),
      maxItems: Math.min(5, items.length),
      xpPerItem: 16,
    });
  }

  return lessons;
}

function lessonItems(lesson) {
  const course = activeCourse();
  let items = lesson.itemIds.map((id) => course.items.find((item) => item.id === id)).filter(Boolean);
  const shouldMix = ["review", "checkpoint", "final"].includes(lesson.kind);
  const mode = shouldMix && state.settings.orderMode === "original" ? "random" : state.settings.orderMode;
  items = orderItems(items, mode);
  if (lesson.maxItems && items.length > lesson.maxItems) return items.slice(0, lesson.maxItems);
  return items;
}

function validCompletedLessonIds() {
  const valid = new Set(state.path.map((lesson) => lesson.id));
  return getCourseProgress().completedLessons.filter((id) => valid.has(id));
}

function completedSet() {
  return new Set(validCompletedLessonIds());
}

function firstIncompleteIndex() {
  const completed = completedSet();
  const index = state.path.findIndex((lesson) => !completed.has(lesson.id));
  return index === -1 ? Math.max(0, state.path.length - 1) : index;
}

function isLessonUnlocked(index) {
  if (index === 0) return true;
  const completed = completedSet();
  return completed.has(state.path[index - 1].id) || completed.has(state.path[index].id);
}

function renderHome() {
  const course = activeCourse();
  ensureCourseProgress(course.id);
  state.path = buildPath(course);
  $("#courseTitle").textContent = course.title;
  $("#courseDescription").textContent = course.description || `${course.items.length}개 문장을 단계별로 암기`;
  $("#courseLabel").textContent = course.builtIn ? "STARTER COURSE" : "MY COURSE";
  $("#mobileCourseTitle").textContent = course.title;
  $("#mobileCourseInitial").textContent = (course.title.trim()[0] || "R").toUpperCase();
  $("#courseSentenceCount").textContent = course.items.length;
  renderPath();
  renderStats();
}

function renderPath() {
  const stage = $("#pathStage");
  stage.innerHTML = "";

  if (!state.path.length) {
    stage.innerHTML = `<div class="empty-path"><strong>아직 문장이 없음</strong><p>문장 세트에서 Q / CUE / A를 추가하면 단계별 학습 경로가 자동으로 만들어짐.</p><button class="primary-button" id="emptyAddCourse" type="button">문장 세트 편집</button></div>`;
    $("#emptyAddCourse").addEventListener("click", () => openCourseEditor(activeCourse().id));
    return;
  }

  const completed = completedSet();
  const current = firstIncompleteIndex();
  state.path.forEach((lesson, index) => {
    if (lesson.kind === "checkpoint") {
      const divider = document.createElement("div");
      divider.className = "checkpoint-divider";
      divider.textContent = "중간 점검";
      stage.appendChild(divider);
    }

    if (index === Math.ceil(state.path.length / 2)) {
      const mascot = document.createElement("div");
      mascot.className = "path-mascot-row";
      mascot.innerHTML = `<img src="assets/mori.svg" alt="모리" class="path-mascot"><div class="mascot-note">한 단계씩 잠금이 풀림. 틀린 문장은 다음 복습에서 더 우선해서 볼 수 있음.</div>`;
      stage.appendChild(mascot);
    }

    const unlocked = isLessonUnlocked(index);
    const isCompleted = completed.has(lesson.id);
    const row = document.createElement("div");
    const icon = unlocked ? (lesson.icon === "bolt" ? "i-bolt" : lesson.icon === "check" ? "i-check" : "i-star") : "i-lock";
    row.className = `path-row pos-${index % 4}`;
    row.innerHTML = `<button class="lesson-node ${lesson.color !== "green" ? lesson.color : ""} ${isCompleted ? "completed" : ""} ${index === current && unlocked ? "current" : ""} ${unlocked ? "" : "locked"}" data-lesson-id="${lesson.id}" type="button" ${unlocked ? "" : "disabled"}><span class="node-shadow"></span><span class="node-face"><svg><use href="#${icon}"/></svg></span></button><div class="node-caption"><strong>${escapeHtml(lesson.title)}</strong><span>${isCompleted ? "완료" : unlocked ? lesson.overline : "이전 단계 완료 후 열림"}</span></div>`;
    stage.appendChild(row);
  });

  $$(".lesson-node[data-lesson-id]").forEach((button) => {
    button.addEventListener("click", () => openLessonSheet(button.dataset.lessonId));
  });
}

function renderStats() {
  const { totalXp, streak } = getGlobalStats();
  $("#totalXp").textContent = totalXp;
  $("#totalXpMobile").textContent = totalXp;
  $("#streakDays").textContent = streak;
  $("#streakDaysMobile").textContent = streak;

  const progress = getCourseProgress();
  const completed = validCompletedLessonIds().length;
  const total = state.path.length;
  const percent = total ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  $("#completedLessonCount").textContent = completed;
  $("#weakCount").textContent = Object.values(progress.weak).filter((value) => Number(value) > 0).length;
  $("#masteryPercent").textContent = `${percent}%`;
  $("#masteryRingText").textContent = `${percent}%`;
  $(".mastery-ring").style.setProperty("--progress", `${percent * 3.6}deg`);
  $("#masteryLabel").textContent = percent === 100 ? "코스 완료" : percent >= 50 ? "절반 이상" : percent > 0 ? "진행 중" : "시작 전";

  const today = localDateKey();
  const daily = Number(progress.daily[today] || 0);
  $("#dailyGoalCount").textContent = `${Math.min(2, daily)}/2`;
  $("#dailyGoalBar").style.width = `${Math.min(100, (daily / 2) * 100)}%`;
  $("#dailyGoalCopy").textContent = daily >= 2 ? "오늘 목표 완료. 더 하면 보너스 복습." : `레슨 ${2 - daily}개만 더 끝내면 오늘 목표 완료.`;
}

function openDialog(dialog) {
  if (dialog && typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
}

function closeDialog(dialog) {
  if (dialog?.open) dialog.close();
}

function openLessonSheet(lessonId) {
  const lesson = state.path.find((item) => item.id === lessonId);
  if (!lesson) return;
  state.selectedLessonId = lessonId;
  const items = lessonItems(lesson);
  $("#lessonSheetOverline").textContent = lesson.overline;
  $("#lessonSheetTitle").textContent = lesson.title;
  $("#lessonSheetDescription").textContent = lesson.description;
  $("#lessonSheetCount").textContent = `${items.length}문장`;
  $("#lessonSheetXp").textContent = `최대 ${items.length * lesson.xpPerItem} XP`;
  const icon = $("#lessonSheetIcon");
  icon.className = `lesson-sheet-icon ${lesson.color === "green" ? "" : lesson.color}`;
  icon.innerHTML = `<svg><use href="#${lesson.icon === "bolt" ? "i-bolt" : lesson.icon === "check" ? "i-check" : "i-star"}"/></svg>`;
  openDialog($("#lessonSheet"));
}

function startSelectedLesson() {
  const lesson = state.path.find((item) => item.id === state.selectedLessonId);
  if (!lesson) return;
  closeDialog($("#lessonSheet"));
  startLesson(lesson, lessonItems(lesson));
}

function switchScreen(target) {
  [$("#homeScreen"), $("#lessonScreen"), $("#resultScreen")].forEach((screen) => screen.classList.toggle("is-hidden", screen !== target));
  window.scrollTo({ top: 0, behavior: "instant" });
}

function startLesson(lesson, items) {
  if (!items.length) return;
  state.session = {
    lesson,
    queue: items.map((item) => ({ ...item, review: false })),
    originalCount: items.length,
    position: 0,
    current: null,
    firstTryCorrect: 0,
    sessionXp: 0,
    lives: 5,
    feedbackOpen: false,
    currentHadHelp: false,
    missedIds: new Set(),
  };
  switchScreen($("#lessonScreen"));
  $("#lessonKindLabel").textContent = lesson.overline;
  $("#lessonTitle").textContent = lesson.title;
  renderQuestion();
}

function renderQuestion() {
  const session = state.session;
  if (!session || session.position >= session.queue.length) return finishLesson();
  session.current = session.queue[session.position];
  session.feedbackOpen = false;
  session.currentHadHelp = false;
  $("#answerInput").value = "";
  $("#answerInput").disabled = false;
  $("#hintBox").classList.add("is-hidden");
  $("#fullQuestion").classList.add("is-hidden");
  $("#fullQuestionToggle").textContent = "전체 질문 보기";
  $("#feedback").classList.add("is-hidden");
  $("#lessonFooter").classList.remove("correct", "incorrect");
  $("#checkButton").disabled = true;
  $("#checkButton").textContent = "확인";
  $("#hintButton").disabled = false;
  $("#revealButton").disabled = false;
  $("#questionCue").textContent = session.current.cue || makeCue(session.current.question);
  $("#fullQuestion").textContent = session.current.question;
  $("#questionCounter").textContent = `${Math.min(session.position + 1, session.originalCount)} / ${session.originalCount}${session.current.review ? " · 다시" : ""}`;
  $("#lessonLives").textContent = session.lives;
  $("#progressBar").style.width = `${session.originalCount ? (Math.min(session.position, session.originalCount) / session.originalCount) * 100 : 0}%`;
  setTimeout(() => $("#answerInput").focus({ preventScroll: true }), 60);
}

function normalize(text) {
  return String(text)
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, index) => [index]);
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
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return 0;
  return 1 - (levenshtein(left, right) / Math.max(left.length, right.length));
}

function trackAttempt(itemId, correct) {
  const progress = getCourseProgress();
  progress.attempts[itemId] = Number(progress.attempts[itemId] || 0) + 1;
  if (correct) {
    progress.mastered[itemId] = Number(progress.mastered[itemId] || 0) + 1;
    progress.weak[itemId] = Math.max(0, Number(progress.weak[itemId] || 0) - 1);
  } else {
    progress.weak[itemId] = Number(progress.weak[itemId] || 0) + 2;
  }
  persistProgress();
}

function checkAnswer() {
  const session = state.session;
  if (!session) return;
  if (session.feedbackOpen) return nextQuestion();
  const typed = $("#answerInput").value.trim();
  if (!typed) return;
  const score = similarity(typed, session.current.answer);
  const exact = normalize(typed) === normalize(session.current.answer);
  if (exact || score >= 0.93) handleCorrect(exact, score);
  else handleIncorrect(score);
}

function handleCorrect(exact, score) {
  const session = state.session;
  session.feedbackOpen = true;
  const clean = !session.current.review && !session.currentHadHelp && !session.missedIds.has(session.current.id);
  if (clean) session.firstTryCorrect += 1;
  const earned = session.currentHadHelp ? 5 : session.current.review ? 8 : session.lesson.xpPerItem;
  session.sessionXp += earned;
  trackAttempt(session.current.id, true);
  showFeedback(
    "correct",
    !exact && score < 0.985 ? "거의 정확해!" : "정답!",
    !exact && score < 0.985 ? `기준 답변: ${session.current.answer}` : `+${earned} XP · 그대로 다음 문제로 연결.`,
  );
  lockExercise("계속");
  animateMascot("celebrate");
}

function handleIncorrect(score) {
  const session = state.session;
  session.feedbackOpen = true;
  session.lives = Math.max(0, session.lives - 1);
  $("#lessonLives").textContent = session.lives;
  session.missedIds.add(session.current.id);
  ensureReviewQueued(session.current);
  trackAttempt(session.current.id, false);
  showFeedback("incorrect", "다시 연결하자", `${Math.max(0, Math.round(score * 100))}% 일치 · ${session.current.answer}`);
  lockExercise("계속");
  animateMascot("oops");
}

function ensureReviewQueued(item) {
  const session = state.session;
  const exists = session.queue.slice(session.position + 1).some((queued) => queued.id === item.id && queued.review);
  if (!exists) session.queue.push({ ...item, review: true });
}

function showFeedback(type, title, text) {
  $("#feedback").classList.remove("is-hidden");
  $("#lessonFooter").classList.remove("correct", "incorrect");
  $("#lessonFooter").classList.add(type);
  $("#feedbackTitle").textContent = title;
  $("#feedbackText").textContent = text;
  $(".feedback-icon").textContent = type === "correct" ? "✓" : "×";
}

function lockExercise(label) {
  $("#answerInput").disabled = true;
  $("#checkButton").disabled = false;
  $("#checkButton").textContent = label;
  $("#hintButton").disabled = true;
  $("#revealButton").disabled = true;
}

function nextQuestion() {
  state.session.position += 1;
  renderQuestion();
}

function revealHint() {
  const session = state.session;
  if (!session?.current || session.feedbackOpen) return;
  session.currentHadHelp = true;
  const words = session.current.answer.replace(/[.,]/g, "").split(/\s+/);
  const amount = Math.min(4, Math.max(2, Math.ceil(words.length * 0.22)));
  $("#hintBox").textContent = `시작 힌트: ${words.slice(0, amount).join(" ")} ...`;
  $("#hintBox").classList.remove("is-hidden");
}

function revealAnswer() {
  const session = state.session;
  if (!session?.current || session.feedbackOpen) return;
  session.currentHadHelp = true;
  session.missedIds.add(session.current.id);
  ensureReviewQueued(session.current);
  trackAttempt(session.current.id, false);
  $("#answerInput").value = session.current.answer;
  session.feedbackOpen = true;
  showFeedback("incorrect", "정답을 보고 다시 외워", session.current.answer);
  lockExercise("외웠으면 계속");
  animateMascot("oops");
}

function animateMascot(className) {
  const mascot = $("#lessonMascot");
  mascot.classList.remove("celebrate", "oops");
  void mascot.offsetWidth;
  mascot.classList.add(className);
  setTimeout(() => mascot.classList.remove(className), 600);
}

function finishLesson() {
  const session = state.session;
  const progress = getCourseProgress();
  const isPathLesson = state.path.some((lesson) => lesson.id === session.lesson.id);
  if (isPathLesson && !progress.completedLessons.includes(session.lesson.id)) {
    progress.completedLessons.push(session.lesson.id);
  }
  const today = localDateKey();
  progress.daily[today] = Number(progress.daily[today] || 0) + 1;
  persistProgress();
  saveGlobalCompletion(session.sessionXp);

  const course = activeCourse();
  const missed = course.items.filter((item) => session.missedIds.has(item.id));
  const accuracy = session.originalCount ? Math.round((session.firstTryCorrect / session.originalCount) * 100) : 0;
  state.lastResult = { lessonId: session.lesson.id, missedIds: missed.map((item) => item.id), accuracy, xp: session.sessionXp, isPathLesson };

  $("#xpStat").textContent = session.sessionXp;
  $("#accuracyStat").textContent = `${accuracy}%`;
  $("#missedStat").textContent = missed.length;
  $("#resultMessage").textContent = accuracy === 100
    ? "완벽하게 연결됨. 다음 단계로 넘어가도 됨."
    : accuracy >= 80
      ? "거의 끝. 막힌 문장만 복습하면 됨."
      : accuracy >= 50
        ? "기억 연결이 생김. 바로 다음 복습 단계에서 다시 굳히자."
        : "아직 약한 문장이 많음. 틀린 문장부터 한 번 더 돌리는 게 빠름.";

  const list = $("#missedList");
  list.innerHTML = "";
  missed.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "missed-item";
    row.innerHTML = `<span class="missed-index">${index + 1}</span><div><strong>${escapeHtml(item.cue || makeCue(item.question))}</strong><p>${escapeHtml(item.answer)}</p></div>`;
    list.appendChild(row);
  });
  $("#missedPanel").classList.toggle("is-hidden", !missed.length);
  $("#retryMissed").classList.toggle("is-hidden", !missed.length);
  $("#continuePath").textContent = isPathLesson ? "다음 단계" : "학습 경로로";
  switchScreen($("#resultScreen"));
}

function retryMissed() {
  const ids = state.lastResult?.missedIds || [];
  if (!ids.length) return;
  const lesson = {
    id: `retry-${Date.now()}`,
    kind: "review",
    color: "blue",
    icon: "bolt",
    overline: "REVIEW",
    title: "틀린 문장 다시",
    description: "방금 막힌 문장만 다시 확인.",
    itemIds: ids,
    xpPerItem: 8,
  };
  startLesson(lesson, lessonItems(lesson));
}

function continuePath() {
  if (!state.lastResult?.isPathLesson) {
    switchScreen($("#homeScreen"));
    renderHome();
    return;
  }
  const index = state.path.findIndex((lesson) => lesson.id === state.lastResult.lessonId);
  const next = state.path[index + 1];
  switchScreen($("#homeScreen"));
  renderHome();
  if (next) setTimeout(() => openLessonSheet(next.id), 80);
}

function quickPractice() {
  const course = activeCourse();
  if (!course.items.length) return;
  const progress = getCourseProgress();
  const completed = completedSet();
  const learned = new Set();
  state.path.forEach((lesson) => {
    if (completed.has(lesson.id)) lesson.itemIds.forEach((id) => learned.add(id));
  });
  let pool = course.items.filter((item) => learned.has(item.id));
  if (!pool.length) pool = course.items.slice(0, Math.min(5, course.items.length));
  const mode = Object.values(progress.weak).some((value) => Number(value) > 0) ? "weak" : "random";
  pool = orderItems(pool, mode).slice(0, Math.min(5, pool.length));
  const lesson = {
    id: `quick-${Date.now()}`,
    kind: "review",
    color: "blue",
    icon: "bolt",
    overline: "QUICK PRACTICE",
    title: "빠른 복습",
    description: "배운 문장 중 짧게 확인.",
    itemIds: pool.map((item) => item.id),
    xpPerItem: 8,
  };
  startLesson(lesson, pool);
}

function openCourseLibrary() {
  renderCourseLibrary();
  openDialog($("#courseLibraryDialog"));
}

function renderCourseLibrary() {
  const list = $("#courseList");
  list.innerHTML = "";
  state.courses.forEach((course) => {
    const item = document.createElement("div");
    item.className = `course-list-item ${course.id === state.activeCourseId ? "is-active" : ""}`;
    item.innerHTML = `<div class="course-avatar">${escapeHtml((course.title.trim()[0] || "R").toUpperCase())}</div><div class="course-list-copy"><strong>${escapeHtml(course.title)}</strong><span>${course.items.length}문장 · ${course.builtIn ? "기본 제공" : "내 세트"}</span></div><div class="course-list-actions"><button class="activate-course" data-course-id="${course.id}" type="button">${course.id === state.activeCourseId ? "사용 중" : "선택"}</button><button class="edit-course" data-course-id="${course.id}" type="button">편집</button></div>`;
    list.appendChild(item);
  });
  $$(".activate-course").forEach((button) => button.addEventListener("click", () => activateCourse(button.dataset.courseId)));
  $$(".edit-course").forEach((button) => button.addEventListener("click", () => openCourseEditor(button.dataset.courseId)));
}

function activateCourse(courseId) {
  if (!state.courses.some((course) => course.id === courseId)) return;
  state.activeCourseId = courseId;
  localStorage.setItem(STORE.activeCourse, courseId);
  ensureCourseProgress(courseId);
  closeDialog($("#courseLibraryDialog"));
  renderHome();
}

function openCourseEditor(courseId = null) {
  const source = courseId ? state.courses.find((course) => course.id === courseId) : null;
  state.editingCourseId = courseId;
  state.editorItems = source ? clone(source.items) : [{ id: uid("item"), cue: "", question: "", answer: "" }];
  $("#editorHeading").textContent = source ? "문장 세트 편집" : "문장 세트 만들기";
  $("#courseTitleInput").value = source?.title || "";
  $("#courseDescriptionInput").value = source?.description || "";
  $("#deleteCourseButton").classList.toggle("is-hidden", !source || source.builtIn);
  $("#editorError").classList.add("is-hidden");
  setEditorTab("cards");
  renderSentenceEditor();
  closeDialog($("#courseLibraryDialog"));
  openDialog($("#courseEditorDialog"));
}

function renderSentenceEditor() {
  const list = $("#sentenceEditorList");
  list.innerHTML = "";
  state.editorItems.forEach((item, index) => {
    const card = document.createElement("section");
    card.className = "sentence-editor-card";
    card.dataset.itemId = item.id;
    card.innerHTML = `<div class="sentence-card-head"><span class="sentence-number">${index + 1}</span><strong>문장 ${index + 1}</strong><button class="move-button move-up" type="button" ${index === 0 ? "disabled" : ""}>↑</button><button class="move-button move-down" type="button" ${index === state.editorItems.length - 1 ? "disabled" : ""}>↓</button><button class="remove-sentence" type="button">×</button></div><div class="sentence-fields"><label>Q · 전체 질문<textarea data-field="question" placeholder="시험에서 보게 될 전체 질문">${escapeHtml(item.question)}</textarea></label><label class="cue-field">CUE · 구분용 앞부분<textarea data-field="cue" placeholder="비워두면 질문 앞 5단어로 자동 생성">${escapeHtml(item.cue)}</textarea></label><label>A · 외울 답변<textarea data-field="answer" placeholder="정확히 외울 답변">${escapeHtml(item.answer)}</textarea></label></div>`;
    list.appendChild(card);
  });

  list.querySelectorAll("textarea[data-field]").forEach((textarea) => textarea.addEventListener("input", (event) => updateEditorItem(event.currentTarget)));
  list.querySelectorAll(".move-up").forEach((button) => button.addEventListener("click", () => moveEditorItem(button.closest(".sentence-editor-card").dataset.itemId, -1)));
  list.querySelectorAll(".move-down").forEach((button) => button.addEventListener("click", () => moveEditorItem(button.closest(".sentence-editor-card").dataset.itemId, 1)));
  list.querySelectorAll(".remove-sentence").forEach((button) => button.addEventListener("click", () => removeEditorItem(button.closest(".sentence-editor-card").dataset.itemId)));
}

function updateEditorItem(textarea) {
  const card = textarea.closest(".sentence-editor-card");
  const item = state.editorItems.find((candidate) => candidate.id === card.dataset.itemId);
  if (item) item[textarea.dataset.field] = textarea.value;
}

function moveEditorItem(itemId, delta) {
  const index = state.editorItems.findIndex((item) => item.id === itemId);
  const nextIndex = index + delta;
  if (index < 0 || nextIndex < 0 || nextIndex >= state.editorItems.length) return;
  [state.editorItems[index], state.editorItems[nextIndex]] = [state.editorItems[nextIndex], state.editorItems[index]];
  renderSentenceEditor();
}

function removeEditorItem(itemId) {
  if (state.editorItems.length === 1) return;
  state.editorItems = state.editorItems.filter((item) => item.id !== itemId);
  renderSentenceEditor();
}

function addEditorItem() {
  state.editorItems.push({ id: uid("item"), cue: "", question: "", answer: "" });
  renderSentenceEditor();
  const cards = $$(".sentence-editor-card");
  cards[cards.length - 1]?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function setEditorTab(tab) {
  $$(".editor-tab").forEach((button) => button.classList.toggle("is-active", button.dataset.editorTab === tab));
  $("#cardsEditorPanel").classList.toggle("is-hidden", tab !== "cards");
  $("#bulkEditorPanel").classList.toggle("is-hidden", tab !== "bulk");
  if (tab === "bulk") $("#bulkInput").value = serializeBulk(state.editorItems);
}

function serializeBulk(items) {
  return items.map((item) => `Q: ${item.question}\nCUE: ${item.cue || makeCue(item.question)}\nA: ${item.answer}`).join("\n---\n");
}

function parseBulk(text) {
  const blocks = text.split(/^\s*---\s*$/m).map((block) => block.trim()).filter(Boolean);
  if (!blocks.length) throw new Error("입력된 문장이 없음.");
  return blocks.map((block, index) => {
    const data = { question: "", cue: "", answer: "" };
    let current = null;
    block.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*(Q|QUESTION|CUE|A|ANSWER)\s*:\s*(.*)$/i);
      if (match) {
        const key = match[1].toUpperCase();
        current = key === "Q" || key === "QUESTION" ? "question" : key === "CUE" ? "cue" : "answer";
        data[current] = match[2].trim();
      } else if (current && line.trim()) {
        data[current] += `${data[current] ? " " : ""}${line.trim()}`;
      }
    });
    if (!data.question || !data.answer) throw new Error(`${index + 1}번째 블록에 Q 또는 A가 비어 있음.`);
    if (!data.cue) data.cue = makeCue(data.question);
    return { id: uid("item"), ...data };
  });
}

function applyBulk() {
  try {
    state.editorItems = parseBulk($("#bulkInput").value);
    $("#editorError").classList.add("is-hidden");
    setEditorTab("cards");
    renderSentenceEditor();
  } catch (error) {
    showEditorError(error.message);
  }
}

function showEditorError(message) {
  $("#editorError").textContent = message;
  $("#editorError").classList.remove("is-hidden");
}

function saveCourse() {
  const title = $("#courseTitleInput").value.trim();
  const description = $("#courseDescriptionInput").value.trim();
  const items = state.editorItems.map((item) => ({
    ...item,
    question: item.question.trim(),
    cue: (item.cue || makeCue(item.question)).trim(),
    answer: item.answer.trim(),
  }));

  if (!title) return showEditorError("세트 이름을 입력해야 함.");
  if (!items.length || items.some((item) => !item.question || !item.answer)) return showEditorError("모든 문장에 Q와 A가 필요함.");

  const existing = state.courses.find((course) => course.id === state.editingCourseId);
  if (existing?.builtIn) {
    const course = {
      id: uid("course"),
      title: `${title} 복사본`,
      description,
      builtIn: false,
      items: items.map((item) => ({ ...item, id: uid("item") })),
    };
    state.courses.push(course);
    state.activeCourseId = course.id;
  } else if (existing) {
    existing.title = title;
    existing.description = description;
    existing.items = items;
  } else {
    const course = { id: uid("course"), title, description, builtIn: false, items };
    state.courses.push(course);
    state.activeCourseId = course.id;
  }

  localStorage.setItem(STORE.activeCourse, state.activeCourseId);
  persistCourses();
  ensureCourseProgress(state.activeCourseId);
  closeDialog($("#courseEditorDialog"));
  renderHome();
}

function deleteCurrentCourse() {
  const course = state.courses.find((candidate) => candidate.id === state.editingCourseId);
  if (!course || course.builtIn) return;
  state.courses = state.courses.filter((candidate) => candidate.id !== course.id);
  delete state.progressByCourse[course.id];
  if (state.activeCourseId === course.id) state.activeCourseId = DEFAULT_COURSE.id;
  localStorage.setItem(STORE.activeCourse, state.activeCourseId);
  persistCourses();
  persistProgress();
  closeDialog($("#courseEditorDialog"));
  renderHome();
}

function openOrderSettings() {
  $$('input[name="orderMode"]').forEach((input) => { input.checked = input.value === state.settings.orderMode; });
  $$('input[name="chunkSize"]').forEach((input) => { input.checked = Number(input.value) === Number(state.settings.chunkSize); });
  openDialog($("#orderDialog"));
}

function saveOrderSettings() {
  state.settings = {
    orderMode: $('input[name="orderMode"]:checked')?.value || "original",
    chunkSize: Number($('input[name="chunkSize"]:checked')?.value || 3),
  };
  persistSettings();
  closeDialog($("#orderDialog"));
  renderHome();
}

function openStats() {
  const progress = getCourseProgress();
  const course = activeCourse();
  $("#statsCourseName").textContent = course.title;
  $("#statsXp").textContent = getGlobalStats().totalXp;
  $("#statsLessons").textContent = validCompletedLessonIds().length;
  $("#statsWeak").textContent = Object.values(progress.weak).filter((value) => Number(value) > 0).length;
  const list = $("#sentenceStatsList");
  list.innerHTML = "";

  course.items.forEach((item, index) => {
    const attempts = Number(progress.attempts[item.id] || 0);
    const mastered = Number(progress.mastered[item.id] || 0);
    const weak = Number(progress.weak[item.id] || 0);
    const row = document.createElement("div");
    row.className = `sentence-stat-row ${weak > 0 ? "weak" : mastered > 0 ? "mastered" : ""}`;
    row.innerHTML = `<span class="status-dot">${index + 1}</span><div><strong>${escapeHtml(item.cue || makeCue(item.question))}</strong><small>${attempts ? `${attempts}회 시도` : "아직 학습 전"}</small></div><span class="sentence-stat-score">${weak > 0 ? `약함 ${weak}` : mastered > 0 ? `✓ ${mastered}` : "—"}</span>`;
    list.appendChild(row);
  });
  openDialog($("#statsDialog"));
}

function handleNav(target) {
  if (target === "sets") return openCourseLibrary();
  if (target === "practice") return quickPractice();
  if (target === "stats") return openStats();
  switchScreen($("#homeScreen"));
}

function toggleFullQuestion() {
  const full = $("#fullQuestion");
  const hidden = full.classList.toggle("is-hidden");
  $("#fullQuestionToggle").textContent = hidden ? "전체 질문 보기" : "전체 질문 숨기기";
}

function exitToHome() {
  closeDialog($("#exitDialog"));
  state.session = null;
  switchScreen($("#homeScreen"));
  renderHome();
}

function bindEvents() {
  $("#openCourseLibrary").addEventListener("click", openCourseLibrary);
  $("#courseSwitcherMobile").addEventListener("click", openCourseLibrary);
  $("#courseMenuButton").addEventListener("click", openCourseLibrary);
  $("#openOrderSettings").addEventListener("click", openOrderSettings);
  $("#quickPractice").addEventListener("click", quickPractice);
  $("#railSettings").addEventListener("click", openOrderSettings);
  $$('[data-nav]').forEach((button) => button.addEventListener("click", () => handleNav(button.dataset.nav)));
  $$('[data-close-dialog]').forEach((button) => button.addEventListener("click", () => closeDialog(button.closest("dialog"))));
  $("#closeLessonSheet").addEventListener("click", () => closeDialog($("#lessonSheet")));
  $("#startLessonFromSheet").addEventListener("click", startSelectedLesson);
  $("#createCourseButton").addEventListener("click", () => openCourseEditor());
  $("#addSentenceButton").addEventListener("click", addEditorItem);
  $$(".editor-tab").forEach((button) => button.addEventListener("click", () => setEditorTab(button.dataset.editorTab)));
  $("#applyBulkButton").addEventListener("click", applyBulk);
  $("#saveCourseButton").addEventListener("click", saveCourse);
  $("#cancelCourseEdit").addEventListener("click", () => closeDialog($("#courseEditorDialog")));
  $("#deleteCourseButton").addEventListener("click", deleteCurrentCourse);
  $("#saveOrderSettings").addEventListener("click", saveOrderSettings);
  $("#answerInput").addEventListener("input", () => {
    if (state.session && !state.session.feedbackOpen) $("#checkButton").disabled = !$("#answerInput").value.trim();
  });
  $("#answerInput").addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      checkAnswer();
    }
  });
  $("#checkButton").addEventListener("click", checkAnswer);
  $("#hintButton").addEventListener("click", revealHint);
  $("#revealButton").addEventListener("click", revealAnswer);
  $("#fullQuestionToggle").addEventListener("click", toggleFullQuestion);
  $("#exitLesson").addEventListener("click", () => openDialog($("#exitDialog")));
  $("#keepLearning").addEventListener("click", () => closeDialog($("#exitDialog")));
  $("#confirmExit").addEventListener("click", exitToHome);
  $("#retryMissed").addEventListener("click", retryMissed);
  $("#continuePath").addEventListener("click", continuePath);
  $("#backHome").addEventListener("click", () => {
    switchScreen($("#homeScreen"));
    renderHome();
  });
}

loadState();
bindEvents();
renderHome();
