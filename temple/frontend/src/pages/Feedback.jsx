import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import Stars from "../components/Stars.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Feedback() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ name: "", rating: 5, message: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    api.feedbackList().then(setList).catch((e) => setError(e.message));
    if (user) setForm((f) => ({ ...f, name: user.name }));
  }, [user]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.submitFeedback({
        name: form.name,
        rating: Number(form.rating),
        message: form.message,
      });
      setSuccess(t("feedback.successMsg"));
      setForm({ ...form, message: "" });
      setList(await api.feedbackList());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header style={{ marginBottom: 24 }}>
        <p className="kicker">{t("feedback.kicker")}</p>
        <h1>{t("feedback.title")}</h1>
        <p style={{ marginTop: 8, maxWidth: "60ch" }}>{t("feedback.lede")}</p>
      </header>

      <div className="grid grid-2">
        <section className="card">
          <h2>{t("feedback.share")}</h2>
          {error && <div className="alert error" style={{ marginTop: 12 }}>{error}</div>}
          {success && <div className="alert success" style={{ marginTop: 12 }}>{success}</div>}
          <form className="form" onSubmit={submit} style={{ marginTop: 16 }}>
            <div className="field">
              <label htmlFor="fb-name">{t("feedback.name")}</label>
              <input
                id="fb-name"
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="fb-rating">{t("feedback.rating")}</label>
              <select
                id="fb-rating"
                className="select"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{"★".repeat(n)} ({n})</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="fb-msg">{t("feedback.message")}</label>
              <textarea
                id="fb-msg"
                className="textarea"
                required
                minLength={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? t("feedback.submitting") : t("feedback.submit")}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>{t("feedback.recent")}</h2>
          <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
            {!list ? (
              <Loader />
            ) : list.length === 0 ? (
              <p>{t("feedback.noneYet")}</p>
            ) : (
              list.map((f) => (
                <article key={f.id} style={{ borderBottom: "1px solid var(--c-border)", paddingBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{f.name}</strong>
                    <Stars value={f.rating} />
                  </div>
                  <p style={{ marginTop: 6 }}>{f.message}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
