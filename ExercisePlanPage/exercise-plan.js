/* ======================================================
   ALIGNMENT+ Exercise Plan
   Database-backed Exercise Plan
====================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("exerciseContainer");
    const progressRing = document.querySelector(".progress-ring");
    const progressPercent = document.getElementById("progressPercent");
    const progressStatus = document.getElementById("progressStatus");
    const progressCount = document.getElementById("progressCount");
    const startBtn = document.getElementById("startRoutine");
    const completeBtn = document.getElementById("completeRoutine");
    const saveBtn = document.getElementById("saveRoutine");

    const conditionName = document.getElementById("conditionName");
    const conditionDescription = document.getElementById("conditionDescription");
    const heroImage = document.querySelector(".hero-image img");

    const statDuration = document.querySelector(".stats .stat-card:nth-child(1) h3");
    const statExercises = document.querySelector(".stats .stat-card:nth-child(2) h3");
    const statDifficulty = document.querySelector(".stats .stat-card:nth-child(3) h3");

    const focusAreasList = document.querySelector(".sidebar .card:nth-child(2) ul");

    let exercises = [];
    let completed = new Set();

    const radius = 60;
    const circumference = 2 * Math.PI * radius;

    progressRing.style.strokeDasharray = circumference;
    progressRing.style.strokeDashoffset = circumference;

    function getSelectedConditions() {
        try {
            const stored = JSON.parse(localStorage.getItem("selectedConditions") || "[]");

            if (Array.isArray(stored) && stored.length) {
                return stored;
            }
        } catch (error) {
            console.error("Unable to read selected conditions:", error);
        }

        return ["Scoliosis"];
    }

    function formatTotalDuration(items) {
        let minutes = 0;

        items.forEach((exercise) => {
            const match = String(exercise.duration || "").match(/\d+/);
            if (match) {
                minutes += Number(match[0]);
            }
        });

        return minutes > 0 ? `${minutes} min` : "—";
    }

    function renderFocusAreas(conditionRows, items) {
        const areas = [];

        conditionRows.forEach((condition) => {
            if (condition.focus_area) {
                condition.focus_area
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .forEach((item) => areas.push(item));
            }
        });

        if (!areas.length) {
            items.forEach((exercise) => {
                (exercise.focus || []).forEach((item) => areas.push(item));
            });
        }

        const uniqueAreas = [...new Set(areas)];

        focusAreasList.innerHTML = uniqueAreas.length
            ? uniqueAreas.map((area) => `<li>${escapeHtml(area)}</li>`).join("")
            : "<li>Posture & movement</li>";
    }

    function updateProjectDetails(data) {
        const conditionRows = data.conditions || [];
        const conditionLabel = data.condition || "Scoliosis";

        conditionName.textContent = `${conditionLabel} Exercise Plan`;

        const descriptions = conditionRows
            .map((condition) => condition.full_description || condition.short_description)
            .filter(Boolean);

        conditionDescription.textContent = descriptions.length
            ? descriptions.join(" ")
            : "A personalized routine designed to support posture, movement, and healthy exercise habits.";

        if (conditionRows[0]?.image_path) {
            heroImage.src = conditionRows[0].image_path;
            heroImage.alt = conditionRows[0].name;
        }

        statDuration.textContent = formatTotalDuration(exercises);
        statExercises.textContent = exercises.length;

        const levels = [...new Set(exercises.map((exercise) => exercise.level).filter(Boolean))];
        statDifficulty.textContent =
            levels.length === 1 ? levels[0] : (levels.length ? "Mixed" : "—");

        renderFocusAreas(conditionRows, exercises);
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function showDatabaseError(message) {
        container.innerHTML = `
            <div class="exercise-card" style="padding:24px;">
                <div class="exercise-details">
                    <h3>Unable to load your exercise plan</h3>
                    <p>${escapeHtml(message)}</p>
                    <p style="margin-top:10px;">
                        Make sure MySQL is running, the <strong>alignment_plus</strong>
                        database has been imported, and ALIGNMENT+ is being opened
                        through a PHP server such as XAMPP.
                    </p>
                </div>
            </div>
        `;

        startBtn.disabled = true;
        completeBtn.disabled = true;
    }

    async function loadExercisesFromDatabase() {
        const selectedConditions = getSelectedConditions();

        const url = `../api/exercises.php?conditions=${encodeURIComponent(selectedConditions.join(","))}`;

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "The database API returned an error.");
            }

            if (!Array.isArray(data.exercises) || data.exercises.length === 0) {
                throw new Error("No exercises are mapped to the selected condition yet.");
            }

            exercises = data.exercises;

            updateProjectDetails(data);
            loadExercises();
            restoreProgress();
            updateProgress();

        } catch (error) {
            console.error("ALIGNMENT+ database error:", error);
            showDatabaseError(error.message);
        }
    }

    function loadExercises() {
        container.innerHTML = "";

        exercises.forEach((exercise, index) => {
            const card = document.createElement("div");
            card.className = "exercise-card";

            card.innerHTML = `
                <div class="exercise-number">${index + 1}</div>

                <div class="exercise-image">
                    <img src="${escapeHtml(exercise.image || "")}"
                         alt="${escapeHtml(exercise.name)}">
                </div>

                <div class="exercise-details">
                    <h3>${escapeHtml(exercise.name)}</h3>
                    <p>${escapeHtml(exercise.description || "Guided corrective exercise.")}</p>
                </div>

                <div class="exercise-time">
                    ${escapeHtml(exercise.duration || "—")}
                </div>

                <button class="play-btn" aria-label="Mark exercise complete">
                    <i class="fa-solid fa-play"></i>
                </button>
            `;

            const playButton = card.querySelector(".play-btn");

            playButton.addEventListener("click", () => {
                toggleExercise(card, index);
            });

            container.appendChild(card);
        });
    }

    function toggleExercise(card, index) {
        if (completed.has(index)) {
            completed.delete(index);
            card.classList.remove("completed");
            card.querySelector(".play-btn").innerHTML =
                '<i class="fa-solid fa-play"></i>';
        } else {
            completed.add(index);
            card.classList.add("completed");
            card.querySelector(".play-btn").innerHTML =
                '<i class="fa-solid fa-check"></i>';
        }

        updateProgress();
    }

    function updateProgress() {
        const done = completed.size;
        const total = exercises.length;
        const percent = total ? Math.round((done / total) * 100) : 0;

        progressPercent.textContent = percent + "%";
        progressCount.textContent = `${done} / ${total} Completed`;

        if (done === 0) {
            progressStatus.textContent = "Not Started";
        } else if (done === total) {
            progressStatus.textContent = "Completed";
        } else {
            progressStatus.textContent = "In Progress";
        }

        const offset = circumference - (percent / 100) * circumference;
        progressRing.style.strokeDashoffset = offset;
    }

    startBtn.addEventListener("click", () => {
        if (!exercises.length) return;

        const routine = {
            condition: conditionName.textContent.replace(" Exercise Plan", ""),
            exercises: exercises,
            source: "mysql"
        };

        sessionStorage.setItem("routineData", JSON.stringify(routine));

        localStorage.removeItem("activeRoutineExercises");
        localStorage.removeItem("activeRoutineCondition");

        window.location.href = "../routinePage/routine.html";
    });

    completeBtn.addEventListener("click", () => {
        if (!exercises.length) return;

        completed.clear();

        document.querySelectorAll(".exercise-card").forEach((card, index) => {
            completed.add(index);
            card.classList.add("completed");
            card.querySelector(".play-btn").innerHTML =
                '<i class="fa-solid fa-check"></i>';
        });

        updateProgress();
    });

    saveBtn.addEventListener("click", () => {
        localStorage.setItem(
            "alignmentRoutine",
            JSON.stringify([...completed])
        );

        saveBtn.innerHTML =
            '<i class="fa-solid fa-bookmark"></i> Saved';

        setTimeout(() => {
            saveBtn.innerHTML =
                '<i class="fa-regular fa-bookmark"></i> Save';
        }, 1800);
    });

    function restoreProgress() {
        try {
            const saved = JSON.parse(
                localStorage.getItem("alignmentRoutine") || "[]"
            );

            if (!Array.isArray(saved)) return;

            completed = new Set(
                saved.filter((index) => Number.isInteger(index) && index >= 0 && index < exercises.length)
            );

            document.querySelectorAll(".exercise-card").forEach((card, index) => {
                if (completed.has(index)) {
                    card.classList.add("completed");
                    card.querySelector(".play-btn").innerHTML =
                        '<i class="fa-solid fa-check"></i>';
                }
            });
        } catch (error) {
            console.error("Unable to restore saved progress:", error);
        }
    }

    await loadExercisesFromDatabase();
});
