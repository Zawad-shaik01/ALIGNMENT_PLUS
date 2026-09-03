const routineCondition = document.getElementById("routineCondition");
const routineCounter = document.getElementById("routineCounter");

const exerciseImage = document.getElementById("exerciseImage");
const exerciseLevel = document.getElementById("exerciseLevel");
const exerciseTitle = document.getElementById("exerciseTitle");
const exerciseDesc = document.getElementById("exerciseDesc");
const exerciseDuration = document.getElementById("exerciseDuration");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const finishBtn = document.getElementById("finishBtn");

const instructionsList = document.getElementById("instructionsList");
const focusList = document.getElementById("focusList");
const mistakesList = document.getElementById("mistakesList");
const breathingList = document.getElementById("breathingList");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");

const completeModal = document.getElementById("completeModal");
const restartRoutine = document.getElementById("restartRoutine");

/* ======================================================
   Routine Data
   The Exercise Plan page is the single source for the
   routine that is launched. It stores the selected routine
   in sessionStorage under "routineData".
====================================================== */

function readRoutineData() {
  try {
    const storedRoutine = sessionStorage.getItem("routineData");

    if (storedRoutine) {
      const parsedRoutine = JSON.parse(storedRoutine);

      if (parsedRoutine && Array.isArray(parsedRoutine.exercises)) {
        return parsedRoutine;
      }
    }
  } catch (error) {
    console.error("Unable to read routineData from Exercise Plan:", error);
  }

  return { condition: "Scoliosis", exercises: [] };
}

function normalizeExercise(exercise, index) {
  const breathing = Array.isArray(exercise.breathing)
    ? exercise.breathing
    : exercise.breathing
      ? [exercise.breathing]
      : ["Breathe slowly and normally throughout the exercise."];

  return {
    id: exercise.id ?? index + 1,
    title: exercise.title || exercise.name || `Exercise ${index + 1}`,
    shortDesc: exercise.shortDesc || exercise.description || "Follow the exercise with controlled movement.",
    duration: exercise.duration || "30 sec",
    level: exercise.level || "Beginner",
    gif: exercise.gif || exercise.image || "",
    instructions: Array.isArray(exercise.instructions) && exercise.instructions.length
      ? exercise.instructions
      : ["Maintain proper posture and perform the movement slowly and with control."],
    focus: Array.isArray(exercise.focus) && exercise.focus.length
      ? exercise.focus
      : ["Posture", "Mobility"],
    mistakes: Array.isArray(exercise.mistakes) && exercise.mistakes.length
      ? exercise.mistakes
      : ["Avoid sudden or uncontrolled movements.", "Stop if you experience sharp pain."],
    breathing
  };
}

const routineData = readRoutineData();
const activeRoutineCondition = routineData.condition || "Scoliosis";
const activeRoutineExercises = routineData.exercises.map(normalizeExercise);

let currentIndex = 0;
let isRunning = false;
let isReadyScreen = false;
let isResting = false;
let timerInterval = null;
let remainingSeconds = 0;

const READY_SECONDS = 15;
const REST_SECONDS = 25;

function getSecondsFromDuration(duration) {
  const lower = duration.toLowerCase();

  if (lower.includes("sec")) {
    const match = lower.match(/\d+/);
    return match ? Number(match[0]) : 30;
  }

  if (lower.includes("breath")) {
    return 30;
  }

  if (lower.includes("rep")) {
    return 30;
  }

  return 30;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function renderList(container, items, isPill = false) {
  container.innerHTML = "";

  items.forEach((item) => {
    if (isPill) {
      const span = document.createElement("span");
      span.textContent = item;
      container.appendChild(span);
    } else {
      const li = document.createElement("li");
      li.textContent = item;
      container.appendChild(li);
    }
  });
}
function isRepBased(duration) {
  const lower = duration.toLowerCase();
  return lower.includes("rep") || lower.includes("x") || lower.includes("×");
}

function getRepText(duration) {
  

  const numberMatch = duration.match(/\d+/);

  if (numberMatch) {
    return `×${numberMatch[0]}`;
  }

  return duration;
}

function loadExercise(index) {
  const exercise = activeRoutineExercises[index];

  if (!exercise) {
    exerciseTitle.textContent = "No exercise found";
    exerciseDesc.textContent = "Please go back and start the routine again.";
    return;
  }

  clearInterval(timerInterval);

  isRunning = false;
  isReadyScreen = false;
  isResting = false;

  routineCondition.textContent = `${activeRoutineCondition} Routine`;
  routineCounter.textContent = `Exercise ${index + 1} of ${activeRoutineExercises.length}`;

  exerciseImage.src = exercise.gif;
  exerciseImage.alt = exercise.title;

  exerciseLevel.textContent = exercise.level;
  exerciseTitle.textContent = exercise.title;
  exerciseDesc.textContent = exercise.shortDesc;

  renderList(instructionsList, exercise.instructions);
  renderList(focusList, exercise.focus, true);
  renderList(mistakesList, exercise.mistakes);
  renderList(breathingList, exercise.breathing);

  if (isRepBased(exercise.duration)) {
    exerciseDuration.textContent = getRepText(exercise.duration);
    playPauseBtn.textContent = currentIndex === 0 ? "Start Routine" : "Done";
  } else {
    remainingSeconds = getSecondsFromDuration(exercise.duration);
    exerciseDuration.textContent = formatTime(remainingSeconds);
    playPauseBtn.textContent = currentIndex === 0 ? "Start Routine" : "Start";
  }

  updateProgress();
}
function updateProgress() {
  const total = activeRoutineExercises.length;
  const percent = total > 0 ? Math.round((currentIndex / total) * 100) : 0;

  progressText.textContent = `Progress: ${currentIndex + 1} / ${total}`;
  progressPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
}

function showReadyScreen() {
  const exercise = activeRoutineExercises[currentIndex];
  if (!exercise) return;

  clearInterval(timerInterval);

  isReadyScreen = true;
  isResting = false;
  isRunning = true;
  remainingSeconds = READY_SECONDS;

  routineCounter.textContent = `Get Ready · Exercise ${currentIndex + 1} of ${activeRoutineExercises.length}`;
  exerciseImage.src = exercise.gif;
  exerciseImage.alt = exercise.title;

  exerciseLevel.textContent = "Ready";
  exerciseTitle.textContent = "Ready to Go!";
  exerciseDesc.textContent = `Next exercise: ${exercise.title}`;
  exerciseDuration.textContent = formatTime(remainingSeconds);
  playPauseBtn.textContent = "Skip Ready";

  instructionsList.innerHTML = `
    <li>Prepare your position safely.</li>
    <li>Keep your body relaxed.</li>
    <li>Start only when you feel ready.</li>
  `;

  focusList.innerHTML = `<span>Preparation</span><span>Safety</span><span>Breathing</span>`;
  mistakesList.innerHTML = `<li>Do not rush into the exercise without correct posture.</li>`;
  breathingList.innerHTML = `<li>Take slow breaths before starting.</li>`;

  timerInterval = setInterval(() => {
    remainingSeconds--;
    exerciseDuration.textContent = formatTime(remainingSeconds);

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      loadExercise(currentIndex);
      startExerciseTimer();
    }
  }, 1000);
}

function startExerciseTimer() {
  const exercise = activeRoutineExercises[currentIndex];
  if (!exercise) return;

  clearInterval(timerInterval);

  isReadyScreen = false;
  isResting = false;
  isRunning = true;

  if (isRepBased(exercise.duration)) {
    exerciseDuration.textContent = getRepText(exercise.duration);
    playPauseBtn.textContent = "✓ Done";
    return;
  }

  remainingSeconds = getSecondsFromDuration(exercise.duration);
  exerciseDuration.textContent = formatTime(remainingSeconds);
  playPauseBtn.textContent = "Pause";

  timerInterval = setInterval(() => {
    remainingSeconds--;
    exerciseDuration.textContent = formatTime(remainingSeconds);

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      showRestGap();
    }
  }, 1000);
}

function showRestGap() {
  if (currentIndex >= activeRoutineExercises.length - 1) {
    finishRoutine();
    return;
  }

  const nextExercise = activeRoutineExercises[currentIndex + 1];

  isReadyScreen = false;
  isResting = true;
  isRunning = true;
  remainingSeconds = REST_SECONDS;

  routineCounter.textContent = `Rest Gap · Next ${currentIndex + 2} of ${activeRoutineExercises.length}`;

  exerciseImage.src = nextExercise.gif;
  exerciseImage.alt = nextExercise.title;

  exerciseLevel.textContent = "Rest";
  exerciseTitle.textContent = "Rest Time";
  exerciseDesc.textContent = `Next exercise: ${nextExercise.title}`;
  exerciseDuration.textContent = formatTime(remainingSeconds);
  playPauseBtn.textContent = "Skip Rest";

  instructionsList.innerHTML = `
    <li>Relax your body.</li>
    <li>Drink water if needed.</li>
    <li>Prepare for the next exercise.</li>
  `;

  focusList.innerHTML = `<span>Recovery</span><span>Breathing</span>`;
  mistakesList.innerHTML = `<li>Do not rush immediately into the next exercise.</li>`;
  breathingList.innerHTML = `<li>Inhale slowly and exhale gently.</li>`;

  timerInterval = setInterval(() => {
    remainingSeconds--;
    exerciseDuration.textContent = formatTime(remainingSeconds);

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      currentIndex++;
      loadExercise(currentIndex);
      startExerciseTimer();
    }
  }, 1000);
}

function handleMainButton() {
  const exercise = activeRoutineExercises[currentIndex];

  if (!exercise) return;

  if (isReadyScreen) {
    clearInterval(timerInterval);
    loadExercise(currentIndex);
    startExerciseTimer();
    return;
  }

  if (isResting) {
    clearInterval(timerInterval);
    currentIndex++;
    loadExercise(currentIndex);
    startExerciseTimer();
    return;
  }

  if (isRepBased(exercise.duration) && isRunning) {
    showRestGap();
    return;
  }

  if (!isRunning) {
    if (currentIndex === 0) {
      showReadyScreen();
    } else {
      startExerciseTimer();
    }
    return;
  }

  clearInterval(timerInterval);
  isRunning = false;
  playPauseBtn.textContent = "Resume";
}
function nextExercise() {
  clearInterval(timerInterval);

  if (currentIndex < activeRoutineExercises.length - 1) {
    currentIndex++;
    loadExercise(currentIndex);
  } else {
    finishRoutine();
  }
}

function previousExercise() {
  clearInterval(timerInterval);

  if (currentIndex > 0) {
    currentIndex--;
    loadExercise(currentIndex);
  }
}

function finishRoutine() {
  clearInterval(timerInterval);

  isRunning = false;
  isReadyScreen = false;
  isResting = false;

  progressFill.style.width = "100%";
  progressPercent.textContent = "100%";

  completeModal.classList.add("active");
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedTab = button.dataset.tab;

    tabButtons.forEach((btn) => btn.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(selectedTab).classList.add("active");
  });
});

prevBtn.addEventListener("click", previousExercise);
nextBtn.addEventListener("click", nextExercise);
playPauseBtn.addEventListener("click", handleMainButton);
finishBtn.addEventListener("click", finishRoutine);

restartRoutine.addEventListener("click", () => {
  currentIndex = 0;
  completeModal.classList.remove("active");
  loadExercise(currentIndex);
});

if (activeRoutineExercises.length === 0) {
  exerciseTitle.textContent = "No routine selected";
  exerciseDesc.textContent = "Please go back to the exercise plan page and start a routine.";
  exerciseDuration.textContent = "--";
  routineCounter.textContent = "Exercise 0 of 0";
} else {
  loadExercise(currentIndex);
}