const storedName = localStorage.getItem("alignmentUserName") || "ALIGNMENT+ User";
const storedEmail = localStorage.getItem("alignmentUserEmail") || "user@example.com";

document.getElementById("profileName").textContent = storedName;
document.getElementById("profileEmail").textContent = storedEmail;
document.getElementById("name").value = storedName;
document.getElementById("email").value = storedEmail;
document.getElementById("avatar").textContent = storedName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "A+";
