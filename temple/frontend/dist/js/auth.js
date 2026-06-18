/**
 * Aalayam Auth Module
 * Handles login, register, session management
 */

(function () {
  const { api, tokenStore, userStore } = window.Aalayam;

  function updateAuthUI() {
    const user = userStore.get();
    const loginBtns = document.querySelectorAll(".auth-login-btn");
    const userMenus = document.querySelectorAll(".auth-user-menu");
    const userNames = document.querySelectorAll(".auth-user-name");

    loginBtns.forEach((el) => (el.style.display = user ? "none" : ""));
    userMenus.forEach((el) => (el.style.display = user ? "" : "none"));
    userNames.forEach((el) => {
      if (user) el.textContent = user.name || user.email;
    });
  }

  async function handleLogin(email, password) {
    const data = await api.login({ email, password });
    tokenStore.set(data.access_token);
    userStore.set(data.user);
    updateAuthUI();
    return data.user;
  }

  async function handleRegister(name, email, password) {
    const data = await api.register({ name, email, password });
    tokenStore.set(data.access_token);
    userStore.set(data.user);
    updateAuthUI();
    return data.user;
  }

  function handleLogout() {
    tokenStore.clear();
    userStore.clear();
    updateAuthUI();
    window.location.href = "index.html";
  }

  function requireAuth() {
    const user = userStore.get();
    if (!user) {
      window.location.href = "login.html?next=" + encodeURIComponent(window.location.pathname);
      return false;
    }
    return true;
  }

  // Initialize auth UI on page load
  document.addEventListener("DOMContentLoaded", updateAuthUI);

  // Show login modal
  function showLoginModal() {
    const existing = document.getElementById("auth-modal");
    if (existing) {
      existing.style.display = "flex";
      return;
    }

    const modal = document.createElement("div");
    modal.id = "auth-modal";
    modal.innerHTML = `
      <div class="auth-modal-overlay" onclick="Aalayam.auth.closeModal()"></div>
      <div class="auth-modal-box">
        <button class="auth-modal-close" onclick="Aalayam.auth.closeModal()">&times;</button>
        <h2 id="auth-modal-title">Sign In</h2>
        <div id="auth-error" class="auth-error" style="display:none"></div>
        <form id="auth-form">
          <div id="auth-name-group" style="display:none">
            <label>Full Name</label>
            <input type="text" id="auth-name" placeholder="Your name" autocomplete="name">
          </div>
          <div>
            <label>Email</label>
            <input type="email" id="auth-email" placeholder="you@example.com" required autocomplete="email">
          </div>
          <div>
            <label>Password</label>
            <input type="password" id="auth-password" placeholder="Min 8 characters" required minlength="8" autocomplete="current-password">
          </div>
          <button type="submit" class="btn-primary" style="width:100%;margin-top:8px;" id="auth-submit-btn">Sign In</button>
        </form>
        <div id="auth-demo-block" style="margin-top:12px;padding:12px;background:#F8F6F2;border:1px dashed #D9C9AD;border-radius:8px;text-align:center;">
          <div style="font-size:11px;color:#7A6B5A;margin-bottom:6px;">Try with demo account</div>
          <button type="button" onclick="Aalayam.auth.demoLogin()" style="background:#3A2618;color:#F8F6F2;border:none;padding:8px 24px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:0.5px;transition:background 0.2s;" onmouseover="this.style.background='#5C3A1E'" onmouseout="this.style.background='#3A2618'">Demo Sign In</button>
          <div style="font-size:10px;color:#A6763E;margin-top:6px;">demo@aalayam.in &middot; demo1234</div>
        </div>
        <p class="auth-toggle">
          <span id="auth-toggle-text">Don't have an account?</span>
          <a href="#" id="auth-toggle-link" onclick="Aalayam.auth.toggleMode(event)">Register</a>
        </p>
      </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = "flex";

    document.getElementById("auth-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errEl = document.getElementById("auth-error");
      errEl.style.display = "none";
      const btn = document.getElementById("auth-submit-btn");
      btn.disabled = true;
      btn.textContent = "Please wait...";

      try {
        if (modal.dataset.mode === "register") {
          const name = document.getElementById("auth-name").value;
          const email = document.getElementById("auth-email").value;
          const password = document.getElementById("auth-password").value;
          await handleRegister(name, email, password);
        } else {
          const email = document.getElementById("auth-email").value;
          const password = document.getElementById("auth-password").value;
          await handleLogin(email, password);
        }
        closeModal();
        window.location.reload();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = "block";
        btn.disabled = false;
        btn.textContent = modal.dataset.mode === "register" ? "Create Account" : "Sign In";
      }
    });
  }

  function closeModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) modal.style.display = "none";
  }

  function toggleMode(e) {
    e.preventDefault();
    const modal = document.getElementById("auth-modal");
    const isRegister = modal.dataset.mode === "register";
    modal.dataset.mode = isRegister ? "login" : "register";
    document.getElementById("auth-modal-title").textContent = isRegister ? "Sign In" : "Create Account";
    document.getElementById("auth-name-group").style.display = isRegister ? "none" : "block";
    document.getElementById("auth-submit-btn").textContent = isRegister ? "Sign In" : "Create Account";
    document.getElementById("auth-toggle-text").textContent = isRegister ? "Don't have an account?" : "Already have an account?";
    document.getElementById("auth-toggle-link").textContent = isRegister ? "Register" : "Sign In";
    document.getElementById("auth-error").style.display = "none";
    const demoBlock = document.getElementById("auth-demo-block");
    if (demoBlock) demoBlock.style.display = isRegister ? "block" : "none";
  }

  async function demoLogin() {
    const errEl = document.getElementById("auth-error");
    if (errEl) errEl.style.display = "none";
    const btn = document.getElementById("auth-submit-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Signing in..."; }
    try {
      await handleLogin("demo@aalayam.in", "demo1234");
      closeModal();
      window.location.reload();
    } catch (err) {
      if (errEl) { errEl.textContent = err.message; errEl.style.display = "block"; }
      if (btn) { btn.disabled = false; btn.textContent = "Sign In"; }
    }
  }

  window.Aalayam.auth = {
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    requireAuth,
    updateUI: updateAuthUI,
    showLoginModal,
    closeModal,
    toggleMode,
    demoLogin,
  };
})();
