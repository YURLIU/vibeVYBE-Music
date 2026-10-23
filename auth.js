async function getCurrentUser() {
    const { data } = await supabaseClient.auth.getUser();
    return data.user;
}

async function register(email, password) {
    return await supabaseClient.auth.signUp({
        email: email,
        password: password
    });
}

async function login(email, password) {
    return await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });
}

async function logout() {
    return await supabaseClient.auth.signOut();
}

async function updateHeader() {
    const user = await getCurrentUser();
    const loginLink = document.getElementById("loginLink");

    if (!loginLink) {
        return;
    }

    if (user) {
        loginLink.textContent = "My profile";
        loginLink.href = "profile.html";
    } else {
        loginLink.textContent = "Log in";
        loginLink.href = "login.html";
    }
}

updateHeader();

const menuButton = document.getElementById("menuButton");

if (menuButton) {
    menuButton.addEventListener("click", () => {
        document.querySelector(".header nav").classList.toggle("show");
    });
}