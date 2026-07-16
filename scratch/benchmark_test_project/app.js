document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const errorBox = document.getElementById("error-box");

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            // Simple validation simulation
            if (email === "admin@deepsift.com" && password === "password123") {
                alert("Login successful!");
                window.location.href = "index.html";
            } else {
                if (errorBox) {
                    errorBox.style.display = "block";
                    errorBox.textContent = "Error: Incorrect email or password.";
                }
            }
        });
    }
});
