const checkboxes = document.querySelectorAll('.condition-card input[type="checkbox"]');
const selectedList = document.getElementById("selectedList");
const continueBtn = document.getElementById("continueBtn");
const errorMessage = document.getElementById("errorMessage");

const modal = document.getElementById("conditionModal");
const closeModal = document.getElementById("closeModal");
const infoButtons = document.querySelectorAll(".info-btn");

const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalFocus = document.getElementById("modalFocus");
const modalDevice = document.getElementById("modalDevice");

function updateSelectedList() {
  const selectedConditions = [];

  checkboxes.forEach((checkbox) => {
    const card = checkbox.closest(".condition-card");

    if (checkbox.checked) {
      selectedConditions.push(checkbox.value);
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });

  function loadSummary() {
  conditionSummary.innerHTML = "";

  if (selectedConditions.length === 0) {
    conditionSummary.innerHTML = "<li>No condition selected. Please go back and select a condition.</li>";
  } else {
    selectedConditions.forEach(condition => {
      const li = document.createElement("li");
      li.textContent = condition;
      conditionSummary.appendChild(li);
    });
  }

  severitySummary.textContent = selectedSeverity;
}

  selectedList.innerHTML = "";

  if (selectedConditions.length === 0) {
    selectedList.innerHTML = "<li>No condition selected yet.</li>";
  } else {
    selectedConditions.forEach((condition) => {
      const li = document.createElement("li");
      li.textContent = condition;
      selectedList.appendChild(li);
    });
  }
}

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", updateSelectedList);
});

infoButtons.forEach((button) => {
  button.addEventListener("click", () => {
    modalTitle.textContent = button.dataset.title;
    modalDescription.textContent = button.dataset.description;
    modalFocus.textContent = button.dataset.focus;
    modalDevice.textContent = button.dataset.device;

    modal.classList.add("active");
  });
});

closeModal.addEventListener("click", () => {
  modal.classList.remove("active");
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.classList.remove("active");
  }
});



continueBtn.addEventListener("click", () => {
  const selectedConditions = [];
  const selectedSeverity = document.querySelector('input[name="severity"]:checked');
  const severityBox = document.querySelector(".severity-box");

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      selectedConditions.push(checkbox.value);
    }
  });

  errorMessage.textContent = "";
  errorMessage.classList.remove("warning-message");
  severityBox.classList.remove("error-box");

  if (selectedConditions.length === 0) {
    errorMessage.textContent = "Please select at least one condition.";
    severityBox.classList.remove("error-box");
    return;
  }

  if (!selectedSeverity) {
    errorMessage.textContent = "Please select a severity level before continuing.";
    severityBox.classList.add("error-box");
    return;
  }

  if (selectedSeverity.value === "Severe") {
    errorMessage.textContent =
      "Severe condition selected. Please continue only if this condition has been reviewed by a qualified doctor or physiotherapist.";
    errorMessage.classList.add("warning-message");

    localStorage.setItem("selectedConditions", JSON.stringify(selectedConditions));
    localStorage.setItem("selectedSeverity", selectedSeverity.value);

    setTimeout(() => {
      window.location.href = "../ExercisePlanPage/exercise-plan.html";
    }, 1800);

    return;
  }

  localStorage.setItem("selectedConditions", JSON.stringify(selectedConditions));
  localStorage.setItem("selectedSeverity", selectedSeverity.value);

  window.location.href = "../ExercisePlanPage/exercise-plan.html";
});

const severityInputs = document.querySelectorAll('input[name="severity"]');

severityInputs.forEach((input) => {
  input.addEventListener("change", () => {
    const severityBox = document.querySelector(".severity-box");

    severityBox.classList.remove("error-box");
    errorMessage.textContent = "";
    errorMessage.classList.remove("warning-message");
  });
});