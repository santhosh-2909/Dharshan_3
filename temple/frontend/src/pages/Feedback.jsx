import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import Stars from "../components/Stars.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Alert from "../components/Alert.jsx";
import EmptyState from "../components/EmptyState.jsx";
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
      <PageHeader
        kicker={t("feedback.kicker")}
        title={t("feedback.title")}
        lede={t("feedback.lede")}
      />

      <div className="grid grid-2">
        <section className="card">
          <h2>{t("feedback.share")}</h2>
          <Alert type="error">{error}</Alert>
          <Alert type="success">{success}</Alert>
          <form className="form" onSubmit={submit}>
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
          <div className="form">
            {!list ? (
              <Loader />
            ) : list.length === 0 ? (
              <EmptyState message={t("feedback.noneYet")} />
            ) : (
              list.map((f) => (
                <article key={f.id} className="feedback-item">
                  <div className="feedback-item-head">
                    <strong>{f.name}</strong>
                    <Stars value={f.rating} />
                  </div>
                  <p>{f.message}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
