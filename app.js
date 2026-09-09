const DEFAULT_COURSE = {
  id: "future-tech-speaking",
  title: "Future Technology Speaking",
  description: "처음 보는 답변부터 단어 조립과 부분 회상을 거쳐 실전 전체 회상까지 단계별로 학습",
  builtIn: true,
  items: [
    { id: "q1", cue: "What specific future technology...", question: "What specific future technology or innovation are you most interested in exploring, and why?", answer: "I am interested in AI because it can make our lives easier.", meaning: "" },
    { id: "q2", cue: "How has a specific piece...", question: "How has a specific piece of modern technology significantly changed your daily routine or habits?", answer: "My smartphone changed my daily life because it makes many things easier.", meaning: "" },
    { id: "q3", cue: "Do you think technological advancements...", question: "Do you think technological advancements make human connections stronger or more isolated?", answer: "I think technology makes human connections stronger because we can communicate more easily.", meaning: "" },
    { id: "q4", cue: "In what ways do you think automation...", question: "In what ways do you think automation and AI will impact the future job market?", answer: "I think AI will replace some jobs, but it will also create new jobs.", meaning: "" },
    { id: "q5", cue: "What is the most serious ethical...", question: "What is the most serious ethical concern regarding the rapid development of biotechnology or AI?", answer: "The biggest problem is that AI may use personal information without permission.", meaning: "" },
    { id: "q6", cue: "How can society address the digital...", question: "How can society address the digital divide between generations or different economic classes?", answer: "Society should give free digital lessons and cheaper devices to everyone.", meaning: "" },
    { id: "q7", cue: "How does this technological issue...", question: "How does this technological issue relate to your future academic major or dream career?", answer: "This issue relates to my future computer science major because I want to build useful technology.", meaning: "" },
    { id: "q8", cue: "If you become a professional...", question: "If you become a professional in your field, what innovative solution would you like to introduce?", answer: "If I become a software engineer, I want to create safe AI tools for everyone.", meaning: "" },
    { id: "q9", cue: "What interdisciplinary knowledge...", question: "What interdisciplinary knowledge do you think is necessary to tackle complex modern technology problems?", answer: "We need knowledge of technology, science, math, and communication to solve problems.", meaning: "" },
    { id: "q10", cue: "Are you generally optimistic or pessimistic...", question: "Are you generally optimistic or pessimistic about living in a heavily tech-driven future society?", answer: "I am optimistic because technology can make our lives easier and better.", meaning: "" },
    { id: "q11", cue: "What is your final message...", question: "What is your final message on how humans should coexist with advanced technology?", answer: "Humans should use advanced technology wisely and always keep people in control.", meaning: "" },
  ],
};

const STORE = {
  courses: "recallRushCoursesV2",
  activeCourse: "recallRushActiveCourseV2",
  settings: "recallRushSettingsV3",
  progress: "recallRushProgressV3",
  xp: "recallRushXp",
  activity: "recallRushActivity",
  sessions: "recallRushSessions",
};

const TYPE_META = {
  expose: { label: "STEP 1 · 익히기", instruction: "먼저 정답 문장을 눈에 익혀봐", stage: 1, xp: 2 },
  choose: { label: "STEP 2 · 고르기", instruction: "질문에 맞는 정답 문장을 골라봐", stage: 1, xp: 4 },
  order: { label: "STEP 3 · 단어 조립", instruction: "단어 카드를 눌러 문장을 순서대로 만들어봐", stage: 2, xp: 6 },
  cloze: { label: "STEP 4 · 빈칸", instruction: "빠진 단어만 골라 문장을 완성해봐", stage: 3, xp: 7 },
  typePart: { label: "STEP 5 · 부분 회상", instruction: "앞부분을 보고 나머지를 직접 입력해봐", stage: 4, xp: 9 },
  recall: { label: "STEP 6 · 전체 회상", instruction: "이제 질문 힌트만 보고 정답 전체를 써봐", stage: 5, xp: 12 },
};

const LESSON_META = {
  discover: { color: "green", icon: "book", title: "익히기", description: "정답을 먼저 보고, 보기 중에서 고르며 질문과 문장을 연결함.", flow: ["정답 보기", "정답 고르기"] },
  build: { color: "blue", icon: "blocks", title: "조립하기", description: "통째로 쓰지 않고 단어 카드를 조립하고 빈칸을 채우며 문장 구조를 익힘.", flow: ["단어 조립", "빈칸 채우기"] },
  recall: { color: "purple", icon: "keyboard", title: "꺼내기", description: "문장 앞부분의 도움을 점점 줄이고 마지막에는 질문만 보고 전체를 회상함.", flow: ["부분 입력", "전체 회상"] },
  checkpoint: { color: "gold", icon: "check", title: "중간 점검", description: "지금까지 배운 문장을 여러 문제 유형으로 섞어서 확인함.", flow: ["조립", "빈칸", "부분 입력", "회상"] },
  final: { color: "gold", icon: "star", title: "최종 점검", description: "실전처럼 질문 힌트만 보고 정답을 처음부터 끝까지 직접 회상함.", flow: ["전체 회상"] },
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
  settings: { orderMode: "original", chunkSize: 2, learningMode: "beginner" },
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

function normalizeCourse(course) {
  return {
    ...course,
    items: (course.items || []).map((item) => ({ meaning: "", cue: "", question: "", answer: "", ...item })),
  };
}

function loadState() {
  const storedCourses = safeJson(localStorage.getItem(STORE.courses), []);
  state.courses = [clone(DEFAULT_COURSE), ...storedCourses.filter((course) => course && course.id !== DEFAULT_COURSE.id).map(normalizeCourse)];
  state.activeCourseId = localStorage.getItem(STORE.activeCourse) || DEFAULT_COURSE.id;
  if (!state.courses.some((course) => course.id === state.activeCourseId)) state.activeCourseId = DEFAULT_COURSE.id;
  state.settings = { ...state.settings, ...safeJson(localStorage.getItem(STORE.settings), {}) };
  state.settings.chunkSize = Math.max(2, Math.min(4, Number(state.settings.chunkSize) || 2));
  state.settings.learningMode = state.settings.learningMode === "fast" ? "fast" : "beginner";
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
    state.progressByCourse[courseId] = { completedLessons: [], weak: {}, attempts: {}, mastered: {}, stage: {}, daily: {} };
  }
  const progress = state.progressByCourse[courseId];
  progress.completedLessons ||= [];
  progress.weak ||= {};
  progress.attempts ||= {};
  progress.mastered ||= {};
  progress.stage ||= {};
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

function wordsOf(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
  const chunkSize = Math.max(2, Math.min(4, Number(state.settings.chunkSize) || 2));
  const beginner = state.settings.learningMode !== "fast";
  const lessons = [];
  const learned = [];
  let lessonNumber = 1;
  let group = 0;

  for (let start = 0; start < items.length; start += chunkSize) {
    const chunk = items.slice(start, start + chunkSize);
    const ids = chunk.map((item) => item.id);
    const signature = pathSignature(ids);
    group += 1;

    if (beginner) {
      lessons.push({
        id: `discover-${chunkSize}-${start}-${signature}`,
        kind: "discover",
        group,
        color: "green",
        icon: "book",
        overline: `LESSON ${lessonNumber++}`,
        title: `문장 ${start + 1}–${start + chunk.length} · 익히기`,
        description: LESSON_META.discover.description,
        itemIds: ids,
      });
    }

    lessons.push({
      id: `build-${chunkSize}-${start}-${signature}-${beginner ? "b" : "f"}`,
      kind: "build",
      group,
      color: "blue",
      icon: "blocks",
      overline: `LESSON ${lessonNumber++}`,
      title: `문장 ${start + 1}–${start + chunk.length} · 조립`,
      description: LESSON_META.build.description,
      itemIds: ids,
    });

    lessons.push({
      id: `recall-${chunkSize}-${start}-${signature}-${beginner ? "b" : "f"}`,
      kind: "recall",
      group,
      color: "purple",
      icon: "keyboard",
      overline: `LESSON ${lessonNumber++}`,
      title: `문장 ${start + 1}–${start + chunk.length} · 회상`,
      description: LESSON_META.recall.description,
      itemIds: ids,
    });

    learned.push(...ids);
    const hasMore = start + chunkSize < items.length;
    const checkpointBoundary = hasMore && group % 2 === 0;
    if (checkpointBoundary) {
      lessons.push({
        id: `checkpoint-${chunkSize}-${group}-${pathSignature(learned)}`,
        kind: "checkpoint",
        group: `checkpoint-${group}`,
        color: "gold",
        icon: "check",
        overline: "CHECKPOINT",
        title: `${learned.length}문장 중간 점검`,
        description: LESSON_META.checkpoint.description,
        itemIds: [...learned],
        maxItems: Math.min(6, learned.length),
      });
    }
  }

  if (items.length) {
    lessons.push({
      id: `final-${pathSignature(items.map((item) => item.id))}`,
      kind: "final",
      group: "final",
      color: "gold",
      icon: "star",
      overline: "FINAL TEST",
      title: `실전 랜덤 ${Math.min(5, items.length)}`,
      description: LESSON_META.final.description,
      itemIds: items.map((item) => item.id),
      maxItems: Math.min(5, items.length),
    });
  }
  return lessons;
}

function lessonItems(lesson) {
  const course = activeCourse();
  let items = lesson.itemIds.map((id) => course.items.find((item) => item.id === id)).filter(Boolean);
  const shouldMix = ["checkpoint", "final", "practice"].includes(lesson.kind);
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
  $("#courseDescription").textContent = course.description || `${course.items.length}개 문장을 쉬운 문제부터 단계별로 학습`;
  $("#courseLabel").textContent = course.builtIn ? "STARTER COURSE" : "MY COURSE";
  $("#mobileCourseTitle").textContent = course.title;
  $("#mobileCourseInitial").textContent = (course.title.trim()[0] || "R").toUpperCase();
  $("#courseSentenceCount").textContent = course.items.length;
  renderPath();
  renderStats();
}

function iconForLesson(lesson, unlocked) {
  if (!unlocked) return "i-lock";
  if (lesson.icon === "book") return "i-book";
  if (lesson.icon === "blocks") return "i-blocks";
  if (lesson.icon === "keyboard") return "i-keyboard";
  if (lesson.icon === "check") return "i-check";
  return "i-star";
}

function renderPath() {
  const stage = $("#pathStage");
  stage.innerHTML = "";
  if (!state.path.length) {
    stage.innerHTML = `<div class="empty-path"><strong>아직 문장이 없음</strong><p>문장 세트에 화면에 보여줄 질문과 최종 정답을 넣으면 익히기부터 전체 회상까지 학습 경로가 자동으로 만들어짐.</p><button class="primary-button" id="emptyAddCourse" type="button">문장 세트 편집</button></div>`;
    $("#emptyAddCourse").addEventListener("click", () => openCourseEditor(activeCourse().id));
    return;
  }

  const completed = completedSet();
  const current = firstIncompleteIndex();
  let lastGroup = null;
  state.path.forEach((lesson, index) => {
    if (lesson.group !== lastGroup && typeof lesson.group === "number") {
      const divider = document.createElement("div");
      divider.className = "chapter-divider";
      divider.textContent = `문장 묶음 ${lesson.group}`;
      stage.appendChild(divider);
      lastGroup = lesson.group;
    }
    if (lesson.kind === "checkpoint") {
      const divider = document.createElement("div");
      divider.className = "checkpoint-divider";
      divider.textContent = "누적 복습";
      stage.appendChild(divider);
      lastGroup = lesson.group;
    }
    if (lesson.kind === "final") {
      const divider = document.createElement("div");
      divider.className = "checkpoint-divider";
      divider.textContent = "실전 점검";
      stage.appendChild(divider);
      lastGroup = lesson.group;
    }
    if (index === Math.ceil(state.path.length / 2)) {
      const mascot = document.createElement("div");
      mascot.className = "path-mascot-row";
      mascot.innerHTML = `<img src="assets/mori.svg" alt="모리" class="path-mascot"><div class="mascot-note">처음에는 정답을 보여주고 시작함. 전체 문장을 직접 쓰는 건 회상 단계까지 올라간 뒤에 나옴.</div>`;
      stage.appendChild(mascot);
    }
    const unlocked = isLessonUnlocked(index);
    const isCompleted = completed.has(lesson.id);
    const row = document.createElement("div");
    row.className = `path-row pos-${index % 4}`;
    row.innerHTML = `<button class="lesson-node ${lesson.color !== "green" ? lesson.color : ""} ${isCompleted ? "completed" : ""} ${index === current && unlocked ? "current" : ""} ${unlocked ? "" : "locked"}" data-lesson-id="${lesson.id}" type="button" ${unlocked ? "" : "disabled"}><span class="node-shadow"></span><span class="node-face"><svg><use href="#${iconForLesson(lesson, unlocked)}"/></svg></span></button><div class="node-caption"><strong>${escapeHtml(lesson.title)}</strong><span>${isCompleted ? "완료 · 다시 연습 가능" : unlocked ? LESSON_META[lesson.kind].flow.join(" → ") : "이전 단계 완료 후 열림"}</span></div>`;
    stage.appendChild(row);
  });
  $$(".lesson-node[data-lesson-id]").forEach((button) => button.addEventListener("click", () => openLessonSheet(button.dataset.lessonId)));
}

function renderStats() {
  const { totalXp, streak } = getGlobalStats();
  $("#totalXpMobile").textContent = totalXp;
  $("#streakDaysMobile").textContent = streak;
  const progress = getCourseProgress();
  const completed = validCompletedLessonIds().length;
  const total = state.path.length;
  const percent = total ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  $("#completedLessonCount").textContent = completed;
  $("#weakCount").textContent = Object.values(progress.weak).filter((value) => Number(value) > 0).length;
  $("#masteryRingText").textContent = `${percent}%`;
  $(".mastery-ring").style.setProperty("--progress", `${percent * 3.6}deg`);
  $("#masteryLabel").textContent = percent === 100 ? "코스 완료" : percent >= 50 ? "절반 이상" : percent > 0 ? "진행 중" : "시작 전";
  const today = localDateKey();
  const daily = Number(progress.daily[today] || 0);
  $("#dailyGoalCount").textContent = `${Math.min(2, daily)}/2`;
  $("#dailyGoalBar").style.width = `${Math.min(100, (daily / 2) * 100)}%`;
  $("#dailyGoalCopy").textContent = daily >= 2 ? "오늘 목표 완료. 원하는 문제 유형으로 더 복습해도 됨." : `레슨 ${2 - daily}개만 더 끝내면 오늘 목표 완료.`;
}

function openDialog(dialog) {
  if (dialog && typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
}

function closeDialog(dialog) {
  if (dialog?.open) dialog.close();
}

function flowForLesson(lesson) {
  if (lesson.kind === "practice") {
    if (lesson.practiceType === "order") return ["단어 조립"];
    if (lesson.practiceType === "cloze") return ["빈칸 채우기"];
    if (lesson.practiceType === "recall") return ["전체 회상"];
    return ["약점 맞춤"];
  }
  return LESSON_META[lesson.kind]?.flow || [];
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
  const estimatedExercises = generateExercises(lesson, items).length;
  $("#lessonSheetXp").textContent = `${estimatedExercises}문제`;
  const flow = $("#lessonSheetFlow");
  flow.innerHTML = flowForLesson(lesson).map((label) => `<span>${escapeHtml(label)}</span>`).join("");
  const icon = $("#lessonSheetIcon");
  icon.className = `lesson-sheet-icon ${lesson.color === "green" ? "" : lesson.color}`;
  icon.innerHTML = `<svg><use href="#${iconForLesson(lesson, true)}"/></svg>`;
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

function makeExercise(type, item, depth = 0) {
  return { id: uid("ex"), type, itemId: item.id, item, depth };
}

function adaptiveType(item) {
  const stage = Number(getCourseProgress().stage[item.id] || 0);
  const weak = Number(getCourseProgress().weak[item.id] || 0);
  if (stage <= 1) return weak > 2 ? "choose" : "order";
  if (stage === 2) return "cloze";
  if (stage === 3) return "typePart";
  return weak >= 3 ? "typePart" : "recall";
}

function generateExercises(lesson, items) {
  const exercises = [];
  if (lesson.kind === "discover") {
    items.forEach((item) => exercises.push(makeExercise("expose", item), makeExercise("choose", item)));
  } else if (lesson.kind === "build") {
    items.forEach((item) => exercises.push(makeExercise("order", item), makeExercise("cloze", item)));
  } else if (lesson.kind === "recall") {
    items.forEach((item) => exercises.push(makeExercise("typePart", item), makeExercise("recall", item)));
  } else if (lesson.kind === "checkpoint") {
    const types = ["order", "cloze", "typePart", "recall"];
    items.forEach((item, index) => exercises.push(makeExercise(types[index % types.length], item)));
  } else if (lesson.kind === "final") {
    items.forEach((item) => exercises.push(makeExercise("recall", item)));
  } else if (lesson.kind === "practice") {
    items.forEach((item) => exercises.push(makeExercise(lesson.practiceType === "weak" ? adaptiveType(item) : lesson.practiceType, item)));
  }
  return exercises;
}

function startLesson(lesson, items) {
  if (!items.length) return;
  const exercises = generateExercises(lesson, items);
  const initialGradedCount = exercises.filter((exercise) => exercise.type !== "expose").length;
  state.session = {
    lesson,
    queue: exercises,
    position: 0,
    current: null,
    initialGradedCount,
    firstTryCorrect: 0,
    sessionXp: 0,
    lives: 5,
    feedbackOpen: false,
    currentHadHelp: false,
    missedIds: new Set(),
    remediationKeys: new Set(),
    ui: {},
  };
  switchScreen($("#lessonScreen"));
  $("#lessonKindLabel").textContent = lesson.overline || "PRACTICE";
  $("#lessonTitle").textContent = lesson.title;
  renderExercise();
}

function renderExercise() {
  const session = state.session;
  if (!session || session.position >= session.queue.length) return finishLesson();
  const exercise = session.queue[session.position];
  session.current = exercise;
  session.feedbackOpen = false;
  session.currentHadHelp = false;
  session.ui = {};
  $("#feedback").classList.add("is-hidden");
  $("#lessonFooter").classList.remove("correct", "incorrect");
  $("#hintBox").classList.add("is-hidden");
  $("#hintBox").textContent = "";
  $("#fullQuestion").classList.add("is-hidden");
  $("#fullQuestionToggle").textContent = "전체 질문 보기";
  $("#questionCue").textContent = exercise.item.cue || makeCue(exercise.item.question);
  $("#fullQuestion").textContent = exercise.item.question;
  $("#exerciseTypeLabel").textContent = TYPE_META[exercise.type].label;
  $("#exerciseInstruction").textContent = TYPE_META[exercise.type].instruction;
  $("#questionCounter").textContent = `${Math.min(session.position + 1, session.queue.length)} / ${session.queue.length}${exercise.depth ? " · 다시" : ""}`;
  $("#lessonLives").textContent = session.lives;
  $("#progressBar").style.width = `${session.queue.length ? (session.position / session.queue.length) * 100 : 0}%`;
  $("#exerciseHelpers").classList.toggle("is-hidden", exercise.type === "expose");
  $("#hintButton").disabled = false;
  $("#revealButton").disabled = false;
  $("#checkButton").textContent = exercise.type === "expose" ? "알겠어" : "확인";
  $("#checkButton").disabled = exercise.type !== "expose";
  renderExerciseBody(exercise);
}

function renderExerciseBody(exercise) {
  const body = $("#exerciseBody");
  body.innerHTML = "";
  if (exercise.type === "expose") return renderExpose(exercise, body);
  if (exercise.type === "choose") return renderChoose(exercise, body);
  if (exercise.type === "order") return setupOrder(exercise, body);
  if (exercise.type === "cloze") return setupCloze(exercise, body);
  if (exercise.type === "typePart") return renderTypePart(exercise, body);
  return renderRecall(exercise, body);
}

function renderExpose(exercise, body) {
  const words = wordsOf(exercise.item.answer);
  body.innerHTML = `<div class="study-card"><span class="target-label">TARGET SENTENCE</span><div class="study-sentence">${escapeHtml(exercise.item.answer)}</div>${exercise.item.meaning ? `<div class="study-meaning">${escapeHtml(exercise.item.meaning)}</div>` : ""}<div class="study-chunks">${words.map((word) => `<span>${escapeHtml(word)}</span>`).join("")}</div></div>`;
}

function chooseOptions(item) {
  const others = shuffle(activeCourse().items.filter((candidate) => candidate.id !== item.id).map((candidate) => candidate.answer)).slice(0, 2);
  if (!others.length) {
    const words = wordsOf(item.answer);
    if (words.length > 3) others.push([...words].reverse().join(" "));
    else others.push(`${item.answer} ...`);
  }
  return shuffle([item.answer, ...others]).slice(0, 3);
}

function renderChoose(exercise, body) {
  state.session.ui.options = chooseOptions(exercise.item);
  state.session.ui.selected = null;
  const draw = () => {
    body.innerHTML = `<div class="option-list">${state.session.ui.options.map((option, index) => `<button class="lesson-option ${state.session.ui.selected === index ? "is-selected" : ""}" data-option-index="${index}" type="button"><span class="option-key">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(option)}</span></button>`).join("")}</div>`;
    body.querySelectorAll(".lesson-option").forEach((button) => button.addEventListener("click", () => {
      state.session.ui.selected = Number(button.dataset.optionIndex);
      $("#checkButton").disabled = false;
      draw();
    }));
  };
  draw();
}

function makeTokenBank(answer, prefix) {
  return wordsOf(answer).map((text, index) => ({ id: `${prefix}-${index}-${uid("t")}`, index, text }));
}

function setupOrder(exercise, body) {
  const target = makeTokenBank(exercise.item.answer, "order");
  state.session.ui.targetTokens = target;
  state.session.ui.bank = shuffle(target.map((token) => ({ ...token })));
  state.session.ui.selected = [];
  renderOrderBoard(body);
}

function renderOrderBoard(body = $("#exerciseBody")) {
  const ui = state.session.ui;
  const selectedTokens = ui.selected.map((id) => ui.bank.find((token) => token.id === id)).filter(Boolean);
  body.innerHTML = `<div class="build-board"><div class="answer-slot ${selectedTokens.length ? "" : "is-empty"}">${selectedTokens.map((token) => `<button class="selected-chip" data-token-id="${token.id}" type="button">${escapeHtml(token.text)}</button>`).join("")}</div><div class="word-bank">${ui.bank.map((token) => `<button class="word-chip ${ui.selected.includes(token.id) ? "is-used" : ""}" data-token-id="${token.id}" type="button">${escapeHtml(token.text)}</button>`).join("")}</div></div>`;
  body.querySelectorAll(".word-chip").forEach((button) => button.addEventListener("click", () => {
    if (!ui.selected.includes(button.dataset.tokenId)) ui.selected.push(button.dataset.tokenId);
    $("#checkButton").disabled = ui.selected.length !== ui.targetTokens.length;
    renderOrderBoard(body);
  }));
  body.querySelectorAll(".selected-chip").forEach((button) => button.addEventListener("click", () => {
    ui.selected = ui.selected.filter((id) => id !== button.dataset.tokenId);
    $("#checkButton").disabled = true;
    renderOrderBoard(body);
  }));
}

function hiddenIndicesFor(words) {
  const count = words.length <= 3 ? 1 : Math.min(4, Math.max(2, Math.ceil(words.length * 0.3)));
  const indices = [...words.keys()];
  const preferred = indices.filter((index) => index > 0 || words.length <= 3);
  return shuffle(preferred.length >= count ? preferred : indices).slice(0, count).sort((a, b) => a - b);
}

function setupCloze(exercise, body) {
  const words = wordsOf(exercise.item.answer);
  const hiddenIndices = hiddenIndicesFor(words);
  const bank = shuffle(hiddenIndices.map((index) => ({ id: `cloze-${index}-${uid("t")}`, index, text: words[index] })));
  state.session.ui.words = words;
  state.session.ui.hiddenIndices = hiddenIndices;
  state.session.ui.bank = bank;
  state.session.ui.selected = [];
  renderClozeBoard(body);
}

function renderClozeBoard(body = $("#exerciseBody")) {
  const ui = state.session.ui;
  const selectedTokens = ui.selected.map((id) => ui.bank.find((token) => token.id === id)).filter(Boolean);
  const blankByIndex = new Map(ui.hiddenIndices.map((wordIndex, slot) => [wordIndex, selectedTokens[slot] || null]));
  body.innerHTML = `<div class="build-board"><div class="cloze-line">${ui.words.map((word, index) => blankByIndex.has(index) ? `<button class="cloze-blank ${blankByIndex.get(index) ? "filled" : ""}" data-blank-index="${index}" type="button">${blankByIndex.get(index) ? escapeHtml(blankByIndex.get(index).text) : "_____"}</button>` : `<span class="cloze-word">${escapeHtml(word)}</span>`).join("")}</div><div class="word-bank">${ui.bank.map((token) => `<button class="word-chip ${ui.selected.includes(token.id) ? "is-used" : ""}" data-token-id="${token.id}" type="button">${escapeHtml(token.text)}</button>`).join("")}</div></div>`;
  body.querySelectorAll(".word-chip").forEach((button) => button.addEventListener("click", () => {
    if (ui.selected.length < ui.hiddenIndices.length && !ui.selected.includes(button.dataset.tokenId)) ui.selected.push(button.dataset.tokenId);
    $("#checkButton").disabled = ui.selected.length !== ui.hiddenIndices.length;
    renderClozeBoard(body);
  }));
  body.querySelectorAll(".cloze-blank.filled").forEach((button) => button.addEventListener("click", () => {
    const wordIndex = Number(button.dataset.blankIndex);
    const slot = ui.hiddenIndices.indexOf(wordIndex);
    if (slot >= 0) ui.selected.splice(slot, 1);
    $("#checkButton").disabled = true;
    renderClozeBoard(body);
  }));
}

function renderTypePart(exercise, body) {
  const words = wordsOf(exercise.item.answer);
  const split = Math.max(1, Math.min(words.length - 1, Math.floor(words.length * 0.45)));
  if (words.length < 2) return renderRecall(exercise, body);
  state.session.ui.prefix = words.slice(0, split).join(" ");
  state.session.ui.expected = words.slice(split).join(" ");
  body.innerHTML = `<div class="partial-wrap"><div class="partial-prefix">${escapeHtml(state.session.ui.prefix)} <span>…</span></div><textarea id="dynamicInput" class="typing-input" rows="4" placeholder="나머지 문장만 입력"></textarea></div>`;
  const input = $("#dynamicInput");
  input.addEventListener("input", () => { $("#checkButton").disabled = !input.value.trim(); });
  setTimeout(() => input.focus({ preventScroll: true }), 50);
}

function renderRecall(exercise, body) {
  state.session.ui.expected = exercise.item.answer;
  body.innerHTML = `<textarea id="dynamicInput" class="typing-input" rows="5" placeholder="정답 문장 전체를 입력"></textarea>`;
  const input = $("#dynamicInput");
  input.addEventListener("input", () => { $("#checkButton").disabled = !input.value.trim(); });
  setTimeout(() => input.focus({ preventScroll: true }), 50);
}

function responseForCurrent() {
  const exercise = state.session.current;
  const ui = state.session.ui;
  if (exercise.type === "expose") return exercise.item.answer;
  if (exercise.type === "choose") return ui.options?.[ui.selected] || "";
  if (exercise.type === "order") return ui.selected.map((id) => ui.bank.find((token) => token.id === id)?.text || "").join(" ");
  if (exercise.type === "cloze") {
    const result = [...ui.words];
    ui.hiddenIndices.forEach((wordIndex, slot) => {
      const token = ui.bank.find((candidate) => candidate.id === ui.selected[slot]);
      if (token) result[wordIndex] = token.text;
    });
    return result.join(" ");
  }
  const typed = $("#dynamicInput")?.value.trim() || "";
  if (exercise.type === "typePart") return `${ui.prefix} ${typed}`.trim();
  return typed;
}

function markExposure(itemId) {
  const progress = getCourseProgress();
  progress.stage[itemId] = Math.max(1, Number(progress.stage[itemId] || 0));
  persistProgress();
}

function trackAttempt(itemId, correct, type) {
  const progress = getCourseProgress();
  const stage = TYPE_META[type]?.stage || 1;
  progress.attempts[itemId] = Number(progress.attempts[itemId] || 0) + 1;
  if (correct) {
    progress.stage[itemId] = Math.max(stage, Number(progress.stage[itemId] || 0));
    progress.mastered[itemId] = Number(progress.mastered[itemId] || 0) + (stage >= 4 ? 1 : 0);
    progress.weak[itemId] = Math.max(0, Number(progress.weak[itemId] || 0) - (stage >= 4 ? 2 : 1));
  } else {
    progress.weak[itemId] = Number(progress.weak[itemId] || 0) + (stage >= 4 ? 2 : 1);
  }
  persistProgress();
}

function checkCurrentExercise() {
  const session = state.session;
  if (!session) return;
  if (session.feedbackOpen) return nextExercise();
  const exercise = session.current;
  if (exercise.type === "expose") {
    markExposure(exercise.itemId);
    session.sessionXp += TYPE_META.expose.xp;
    session.feedbackOpen = true;
    showFeedback("correct", "좋아, 이제 가볍게 확인해보자", `+${TYPE_META.expose.xp} XP · 다음 문제에서는 정답을 직접 고르게 됨.`);
    lockCurrent("계속");
    return;
  }
  const response = responseForCurrent();
  if (!response) return;
  const target = exercise.item.answer;
  const score = similarity(response, target);
  const correct = exercise.type === "choose" || exercise.type === "order" || exercise.type === "cloze" ? normalize(response) === normalize(target) : score >= 0.93;
  if (correct) handleCorrect(score);
  else handleIncorrect(score);
}

function handleCorrect(score) {
  const session = state.session;
  const exercise = session.current;
  session.feedbackOpen = true;
  const cleanFirstTry = exercise.depth === 0 && !session.currentHadHelp;
  if (cleanFirstTry) session.firstTryCorrect += 1;
  const baseXp = TYPE_META[exercise.type].xp;
  const earned = session.currentHadHelp ? Math.max(1, Math.floor(baseXp / 2)) : baseXp;
  session.sessionXp += earned;
  trackAttempt(exercise.itemId, true, exercise.type);
  const near = score < 0.985 && ["typePart", "recall"].includes(exercise.type);
  showFeedback("correct", near ? "거의 정확해!" : exercise.type === "recall" ? "완전히 떠올렸어!" : "정답!", near ? `기준 문장: ${exercise.item.answer}` : `+${earned} XP · 다음 단계로.`);
  lockCurrent("계속");
  animateMascot("celebrate");
}

function remediationType(type) {
  if (type === "recall") return "typePart";
  if (type === "typePart") return "cloze";
  if (type === "cloze") return "order";
  if (type === "order") return "choose";
  return "expose";
}

function queueRemediation(exercise) {
  if (exercise.depth >= 1) return;
  const easier = remediationType(exercise.type);
  const key = `${exercise.itemId}-${exercise.type}-${easier}`;
  if (state.session.remediationKeys.has(key)) return;
  state.session.remediationKeys.add(key);
  state.session.queue.push(makeExercise(easier, exercise.item, 1));
}

function handleIncorrect(score) {
  const session = state.session;
  const exercise = session.current;
  session.feedbackOpen = true;
  session.lives = Math.max(0, session.lives - 1);
  $("#lessonLives").textContent = session.lives;
  session.missedIds.add(exercise.itemId);
  trackAttempt(exercise.itemId, false, exercise.type);
  queueRemediation(exercise);
  const percent = Math.max(0, Math.round(score * 100));
  showFeedback("incorrect", "괜찮아, 한 단계 쉽게 다시 나옴", `${exercise.type === "choose" ? "정답" : `${percent}% 일치`} · ${exercise.item.answer}`);
  lockCurrent("계속");
  animateMascot("oops");
}

function showFeedback(type, title, text) {
  $("#feedback").classList.remove("is-hidden");
  $("#lessonFooter").classList.remove("correct", "incorrect");
  $("#lessonFooter").classList.add(type);
  $("#feedbackTitle").textContent = title;
  $("#feedbackText").textContent = text;
  $(".feedback-icon").textContent = type === "correct" ? "✓" : "×";
}

function lockCurrent(label) {
  $("#checkButton").disabled = false;
  $("#checkButton").textContent = label;
  $("#hintButton").disabled = true;
  $("#revealButton").disabled = true;
  $("#exerciseBody").querySelectorAll("button,textarea").forEach((control) => { control.disabled = true; });
}

function nextExercise() {
  state.session.position += 1;
  renderExercise();
}

function fillOrderHint() {
  const ui = state.session.ui;
  const desiredIndex = ui.selected.length;
  if (desiredIndex >= ui.targetTokens.length) return;
  const desiredText = ui.targetTokens[desiredIndex].text;
  const candidate = ui.bank.find((token) => token.text === desiredText && !ui.selected.includes(token.id));
  if (candidate) ui.selected.push(candidate.id);
  $("#checkButton").disabled = ui.selected.length !== ui.targetTokens.length;
  renderOrderBoard();
}

function fillClozeHint() {
  const ui = state.session.ui;
  const slot = ui.selected.length;
  if (slot >= ui.hiddenIndices.length) return;
  const wordIndex = ui.hiddenIndices[slot];
  const desiredText = ui.words[wordIndex];
  const candidate = ui.bank.find((token) => token.text === desiredText && !ui.selected.includes(token.id));
  if (candidate) ui.selected.push(candidate.id);
  $("#checkButton").disabled = ui.selected.length !== ui.hiddenIndices.length;
  renderClozeBoard();
}

function revealHint() {
  const session = state.session;
  if (!session?.current || session.feedbackOpen) return;
  session.currentHadHelp = true;
  const exercise = session.current;
  if (exercise.type === "order") {
    fillOrderHint();
    $("#hintBox").textContent = "문장 맨 앞에서부터 맞는 단어 하나를 넣어줬음.";
  } else if (exercise.type === "cloze") {
    fillClozeHint();
    $("#hintBox").textContent = "다음 빈칸에 들어갈 단어 하나를 넣어줬음.";
  } else if (exercise.type === "choose") {
    const firstWords = wordsOf(exercise.item.answer).slice(0, 3).join(" ");
    $("#hintBox").textContent = `정답은 “${firstWords} ...”로 시작함.`;
  } else if (exercise.type === "typePart") {
    $("#hintBox").textContent = `입력할 부분 시작: ${wordsOf(state.session.ui.expected).slice(0, 2).join(" ")} ...`;
  } else {
    $("#hintBox").textContent = `정답 시작: ${wordsOf(exercise.item.answer).slice(0, 3).join(" ")} ...`;
  }
  $("#hintBox").classList.remove("is-hidden");
}

function revealAnswer() {
  const session = state.session;
  if (!session?.current || session.feedbackOpen) return;
  const exercise = session.current;
  session.currentHadHelp = true;
  session.missedIds.add(exercise.itemId);
  trackAttempt(exercise.itemId, false, exercise.type);
  queueRemediation(exercise);
  session.feedbackOpen = true;
  showFeedback("incorrect", "정답을 보고 한 번 더 익혀", exercise.item.answer);
  lockCurrent("봤으면 계속");
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
  if (isPathLesson && !progress.completedLessons.includes(session.lesson.id)) progress.completedLessons.push(session.lesson.id);
  const today = localDateKey();
  progress.daily[today] = Number(progress.daily[today] || 0) + 1;
  persistProgress();
  saveGlobalCompletion(session.sessionXp);
  const course = activeCourse();
  const missed = course.items.filter((item) => session.missedIds.has(item.id));
  const accuracy = session.initialGradedCount ? Math.round((session.firstTryCorrect / session.initialGradedCount) * 100) : 100;
  state.lastResult = { lessonId: session.lesson.id, missedIds: missed.map((item) => item.id), accuracy, xp: session.sessionXp, isPathLesson };
  $("#xpStat").textContent = session.sessionXp;
  $("#accuracyStat").textContent = `${accuracy}%`;
  $("#missedStat").textContent = missed.length;
  $("#resultMessage").textContent = accuracy === 100 ? "이번 단계는 완벽함. 다음 단계에서는 도움을 더 줄여도 됨." : accuracy >= 75 ? "거의 됐음. 틀린 문장은 더 쉬운 유형으로 한 번 더 복습했음." : "아직 어려운 부분은 정상임. 다음 레슨에서도 같은 문장이 다른 방식으로 다시 나옴.";
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
  $("#progressBar").style.width = "100%";
  switchScreen($("#resultScreen"));
}

function retryMissed() {
  const ids = state.lastResult?.missedIds || [];
  if (!ids.length) return;
  const items = activeCourse().items.filter((item) => ids.includes(item.id));
  const lesson = { id: `retry-${Date.now()}`, kind: "practice", practiceType: "weak", color: "blue", icon: "bolt", overline: "REVIEW", title: "막힌 문장 다시", description: "현재 숙련도보다 한 단계 쉬운 문제부터 다시 연결.", itemIds: ids };
  startLesson(lesson, items);
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

function learnedPracticePool() {
  const course = activeCourse();
  const progress = getCourseProgress();
  const learned = course.items.filter((item) => Number(progress.stage[item.id] || 0) > 0);
  return learned.length ? learned : course.items.slice(0, Math.min(state.settings.chunkSize, course.items.length));
}

function openPracticeHub() {
  if (!activeCourse().items.length) return;
  openDialog($("#practiceDialog"));
}

function startPractice(type) {
  closeDialog($("#practiceDialog"));
  let pool = learnedPracticePool();
  if (type === "weak") {
    pool = [...pool].sort((a, b) => weakScore(b.id) - weakScore(a.id));
  } else {
    pool = orderItems(pool, state.settings.orderMode === "original" ? "random" : state.settings.orderMode);
  }
  pool = pool.slice(0, Math.min(5, pool.length));
  const titles = { order: "단어 조립 연습", cloze: "빈칸 연습", recall: "전체 회상 연습", weak: "약한 문장 맞춤 복습" };
  const lesson = { id: `practice-${type}-${Date.now()}`, kind: "practice", practiceType: type, color: "blue", icon: "bolt", overline: "PRACTICE", title: titles[type], description: "학습 경로와 별개로 원하는 문제 유형을 집중 연습.", itemIds: pool.map((item) => item.id) };
  startLesson(lesson, pool);
}

function quickPractice() {
  openPracticeHub();
}

function openCourseLibrary() {
  renderCourseLibrary();
  openDialog($("#courseLibraryDialog"));
}

function renderCourseLibrary() {
  const list = $("#courseList");
  list.innerHTML = "";
  state.courses.forEach((course) => {
    const progress = ensureCourseProgress(course.id);
    const learned = course.items.filter((item) => Number(progress.stage[item.id] || 0) > 0).length;
    const item = document.createElement("div");
    item.className = `course-list-item ${course.id === state.activeCourseId ? "is-active" : ""}`;
    item.innerHTML = `<div class="course-avatar">${escapeHtml((course.title.trim()[0] || "R").toUpperCase())}</div><div class="course-list-copy"><strong>${escapeHtml(course.title)}</strong><span>${course.items.length}문장 · ${learned}개 학습 시작 · ${course.builtIn ? "기본 제공" : "내 세트"}</span></div><div class="course-list-actions"><button class="activate-course" data-course-id="${course.id}" type="button">${course.id === state.activeCourseId ? "사용 중" : "선택"}</button><button class="edit-course" data-course-id="${course.id}" type="button">편집</button></div>`;
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
  state.editorItems = source ? clone(source.items) : [{ id: uid("item"), cue: "", question: "", answer: "", meaning: "" }];
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
    card.innerHTML = `<div class="sentence-card-head"><span class="sentence-number">${index + 1}</span><strong>문장 ${index + 1}</strong><button class="move-button move-up" type="button" ${index === 0 ? "disabled" : ""}>↑</button><button class="move-button move-down" type="button" ${index === state.editorItems.length - 1 ? "disabled" : ""}>↓</button><button class="remove-sentence" type="button">×</button></div><div class="sentence-fields"><label>화면에 보여줄 질문<textarea data-field="question" placeholder="예: What technology are you interested in?">${escapeHtml(item.question)}</textarea></label><label>짧은 힌트 · 선택<textarea data-field="cue" placeholder="비우면 질문 앞 5단어 자동 생성">${escapeHtml(item.cue || "")}</textarea></label><label>뜻 / 추가 설명 · 선택<textarea data-field="meaning" placeholder="처음 익힐 때 함께 보여줄 설명">${escapeHtml(item.meaning || "")}</textarea></label><label>최종적으로 외울 문장<textarea data-field="answer" placeholder="학습자가 마지막 단계에서 직접 회상할 정답">${escapeHtml(item.answer)}</textarea></label></div>`;
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
  state.editorItems.push({ id: uid("item"), cue: "", question: "", answer: "", meaning: "" });
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
  return items.map((item) => [`Q: ${item.question}`, `CUE: ${item.cue || makeCue(item.question)}`, `A: ${item.answer}`, item.meaning ? `MEANING: ${item.meaning}` : ""].filter(Boolean).join("\n")).join("\n---\n");
}

function parseBulk(text) {
  const blocks = text.split(/^\s*---\s*$/m).map((block) => block.trim()).filter(Boolean);
  if (!blocks.length) throw new Error("입력된 문장이 없음.");
  return blocks.map((block, index) => {
    const data = { question: "", cue: "", answer: "", meaning: "" };
    let current = null;
    block.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*(Q|QUESTION|CUE|A|ANSWER|M|MEANING)\s*:\s*(.*)$/i);
      if (match) {
        const key = match[1].toUpperCase();
        current = key === "Q" || key === "QUESTION" ? "question" : key === "CUE" ? "cue" : key === "M" || key === "MEANING" ? "meaning" : "answer";
        data[current] = match[2].trim();
      } else if (current && line.trim()) {
        data[current] += `${data[current] ? " " : ""}${line.trim()}`;
      }
    });
    if (!data.question || !data.answer) throw new Error(`${index + 1}번째 블록에 질문(Q) 또는 정답(A)이 비어 있음.`);
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
    meaning: (item.meaning || "").trim(),
  }));
  if (!title) return showEditorError("세트 이름을 입력해야 함.");
  if (!items.length || items.some((item) => !item.question || !item.answer)) return showEditorError("모든 문장에 화면에 보여줄 질문과 최종 정답이 필요함.");
  const existing = state.courses.find((course) => course.id === state.editingCourseId);
  if (existing?.builtIn) {
    const course = { id: uid("course"), title: `${title} 복사본`, description, builtIn: false, items: items.map((item) => ({ ...item, id: uid("item") })) };
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
  $$("input[name='learningMode']").forEach((input) => { input.checked = input.value === state.settings.learningMode; });
  $$("input[name='orderMode']").forEach((input) => { input.checked = input.value === state.settings.orderMode; });
  $$("input[name='chunkSize']").forEach((input) => { input.checked = Number(input.value) === Number(state.settings.chunkSize); });
  openDialog($("#orderDialog"));
}

function saveOrderSettings() {
  state.settings = {
    learningMode: $("input[name='learningMode']:checked")?.value || "beginner",
    orderMode: $("input[name='orderMode']:checked")?.value || "original",
    chunkSize: Number($("input[name='chunkSize']:checked")?.value || 2),
  };
  persistSettings();
  closeDialog($("#orderDialog"));
  renderHome();
}

function stageLabel(stage) {
  if (stage >= 5) return "전체 회상";
  if (stage === 4) return "부분 회상";
  if (stage === 3) return "빈칸 가능";
  if (stage === 2) return "조립 가능";
  if (stage === 1) return "익히는 중";
  return "미학습";
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
    const weak = Number(progress.weak[item.id] || 0);
    const stage = Number(progress.stage[item.id] || 0);
    const row = document.createElement("div");
    row.className = `sentence-stat-row ${weak > 0 ? "weak" : stage >= 4 ? "mastered" : ""}`;
    row.innerHTML = `<span class="status-dot">${index + 1}</span><div><strong>${escapeHtml(item.cue || makeCue(item.question))}</strong><small>${stageLabel(stage)} · ${attempts ? `${attempts}회 채점` : "아직 채점 전"}</small></div><span class="sentence-stat-score">${weak > 0 ? `약함 ${weak}` : stage >= 5 ? "✓ 실전" : stage ? `Lv.${stage}` : "—"}</span>`;
    list.appendChild(row);
  });
  openDialog($("#statsDialog"));
}

function handleNav(target) {
  if (target === "sets") return openCourseLibrary();
  if (target === "practice") return openPracticeHub();
  if (target === "stats") return openStats();
  switchScreen($("#homeScreen"));
  renderHome();
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
  $("#openCourseLibrary")?.addEventListener("click", openCourseLibrary);
  $("#courseSwitcherMobile").addEventListener("click", openCourseLibrary);
  $("#courseMenuButton").addEventListener("click", openCourseLibrary);
  $("#openOrderSettings").addEventListener("click", openOrderSettings);
  $("#quickPractice").addEventListener("click", quickPractice);
  $("#railSettings").addEventListener("click", openOrderSettings);
  $$("[data-nav]").forEach((button) => button.addEventListener("click", () => handleNav(button.dataset.nav)));
  $$("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => closeDialog(button.closest("dialog"))));
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
  $$("[data-practice]").forEach((button) => button.addEventListener("click", () => startPractice(button.dataset.practice)));
  $("#checkButton").addEventListener("click", checkCurrentExercise);
  $("#hintButton").addEventListener("click", revealHint);
  $("#revealButton").addEventListener("click", revealAnswer);
  $("#fullQuestionToggle").addEventListener("click", toggleFullQuestion);
  $("#exitLesson").addEventListener("click", () => openDialog($("#exitDialog")));
  $("#keepLearning").addEventListener("click", () => closeDialog($("#exitDialog")));
  $("#confirmExit").addEventListener("click", exitToHome);
  $("#retryMissed").addEventListener("click", retryMissed);
  $("#continuePath").addEventListener("click", continuePath);
  $("#backHome").addEventListener("click", () => { switchScreen($("#homeScreen")); renderHome(); });
}

loadState();
bindEvents();
renderHome();