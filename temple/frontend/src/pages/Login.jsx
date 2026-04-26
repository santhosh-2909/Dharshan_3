import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState(params.get("mode") === "register" ? "register" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate(params.get("next") || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <p className="kicker">{mode === "login" ? t("auth.welcomeBack") : t("auth.begin")}</p>
        <h1 style={{ marginTop: 8, fontSize: "1.8rem" }}>
          {mode === "login" ? t("auth.signInTitle") : t("auth.registerTitle")}
        </h1>
        <p style={{ marginTop: 8, color: "var(--c-stone)" }}>
          {mode === "login" ? t("auth.demoHint") : t("auth.registerHint")}
        </p>

        {error && <div className="alert error" style={{ marginTop: 16 }}>{error}</div>}

        <form className="form" onSubmit={submit} style={{ marginTop: 20 }}>
          {mode === "register" && (
            <div className="field">
              <label htmlFor="name">{t("auth.name")}</label>
              <input
                id="name"
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">{t("auth.email")}</label>
            <input
              id="email"
              type="email"
              className="input"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="password">{t("auth.password")}</label>
            <input
              id="password"
              type="password"
              className="input"
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? t("auth.wait") : mode === "login" ? t("auth.submitSignIn") : t("auth.submitRegister")}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: "0.9rem" }}>
          {mode === "login" ? (
            <>
              {t("auth.noAccount")}{" "}
              <Link to="#" onClick={(e) => { e.preventDefault(); setMode("register"); }}>
                {t("auth.createOne")}
              </Link>
            </>
          ) : (
            <>
              {t("auth.haveAccount")}{" "}
              <Link to="#" onClick={(e) => { e.preventDefault(); setMode("login"); }}>
                {t("auth.signInLink")}
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
