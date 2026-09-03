const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const registerSuccess = document.getElementById("registerSuccess");
const tabs = document.querySelectorAll(".tab");

const API_BASE = "../api";

function showLogin() {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");

    tabs[0].classList.add("active");
    tabs[1].classList.remove("active");
}

function showRegister() {
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

    tabs[1].classList.add("active");
    tabs[0].classList.remove("active");
}


// =============================
// LOGIN
// =============================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("loginEmail");
    const password = document.getElementById("loginPassword");

    const emailError = document.getElementById("loginEmailError");
    const passwordError = document.getElementById("loginPasswordError");

    emailError.textContent = "";
    passwordError.textContent = "";

    email.classList.remove("error");
    password.classList.remove("error");

    let isValid = true;

    if (email.value.trim() === "") {
        emailError.textContent = "Email address is required.";
        email.classList.add("error");
        isValid = false;
    }

    else if (!email.value.includes("@") || !email.value.includes(".")) {
        emailError.textContent = "Please enter a valid email address.";
        email.classList.add("error");
        isValid = false;
    }

    if (password.value.trim() === "") {
        passwordError.textContent = "Password is required.";
        password.classList.add("error");
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    try {

        const response = await fetch(`${API_BASE}/login.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email.value.trim(),
                password: password.value
            })
        });

        const result = await response.json();

        if (result.success) {

            window.location.href = "../dashboardPage/dashboard.html";

        } else {

            passwordError.textContent = result.message || "Invalid email or password.";
            password.classList.add("error");

        }

    } catch (error) {

        console.error("Login error:", error);

        passwordError.textContent =
            "Unable to connect to the server. Please try again.";

    }

});


// =============================
// REGISTER
// =============================

registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name = document.getElementById("registerName");
    const email = document.getElementById("registerEmail");
    const age = document.getElementById("registerAge");
    const password = document.getElementById("registerPassword");

    const nameError = document.getElementById("registerNameError");
    const emailError = document.getElementById("registerEmailError");
    const ageError = document.getElementById("registerAgeError");
    const passwordError = document.getElementById("registerPasswordError");

    nameError.textContent = "";
    emailError.textContent = "";
    ageError.textContent = "";
    passwordError.textContent = "";
    registerSuccess.textContent = "";

    name.classList.remove("error");
    email.classList.remove("error");
    age.classList.remove("error");
    password.classList.remove("error");

    let isValid = true;

    if (name.value.trim() === "") {
        nameError.textContent = "Full name is required.";
        name.classList.add("error");
        isValid = false;
    }

    if (email.value.trim() === "") {
        emailError.textContent = "Email address is required.";
        email.classList.add("error");
        isValid = false;
    }

    else if (!email.value.includes("@") || !email.value.includes(".")) {
        emailError.textContent = "Please enter a valid email address.";
        email.classList.add("error");
        isValid = false;
    }

    if (age.value.trim() === "") {
        ageError.textContent = "Age is required.";
        age.classList.add("error");
        isValid = false;
    }

    else if (Number(age.value) < 10 || Number(age.value) > 100) {
        ageError.textContent = "Please enter a valid age.";
        age.classList.add("error");
        isValid = false;
    }

    if (password.value.trim() === "") {
        passwordError.textContent = "Password is required.";
        password.classList.add("error");
        isValid = false;
    }

    else if (password.value.trim().length < 6) {
        passwordError.textContent =
            "Password must be at least 6 characters.";
        password.classList.add("error");
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    try {

        const response = await fetch(`${API_BASE}/register.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name.value.trim(),
                email: email.value.trim(),
                age: Number(age.value),
                password: password.value
            })
        });

        const result = await response.json();

        if (result.success) {

    registerSuccess.textContent =
        "Account created successfully! Redirecting to your dashboard...";

    setTimeout(() => {
        window.location.href = "../dashboardPage/dashboard.html";
    }, 1500);

} else {

    emailError.textContent =
        result.message || "Registration failed.";

    email.classList.add("error");
}

    } catch (error) {

        console.error("Registration error:", error);

        emailError.textContent =
            "Unable to connect to the server. Please try again.";

        email.classList.add("error");

    }

});