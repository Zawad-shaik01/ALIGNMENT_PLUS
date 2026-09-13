const userName = localStorage.getItem("alignmentUserName");
const selectedConditions = JSON.parse(localStorage.getItem("selectedConditions") || "[]");
const severity = localStorage.getItem("selectedSeverity");

const welcomeTitle = document.getElementById("welcomeTitle");
const conditionCount = document.getElementById("conditionCount");
const conditionOverview = document.getElementById("conditionOverview");

if (userName) {
  welcomeTitle.textContent = `Welcome back, ${userName}`;
}

conditionCount.textContent = String(selectedConditions.length);

if (selectedConditions.length) {
  const severityText = severity ? ` Severity: ${severity}.` : "";
  conditionOverview.textContent = `${selectedConditions.join(", ")}.${severityText}`;
}
