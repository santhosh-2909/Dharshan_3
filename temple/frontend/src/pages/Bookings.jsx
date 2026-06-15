import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Alert from "../components/Alert.jsx";
import EmptyState from "../components/EmptyState.jsx";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function Bookings() {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === "ta";

  const [sevas, setSevas] = useState(null);
  const [mine, setMine] = useState([]);
  const [form, setForm] = useState({ seva_id: "", booking_date: todayISO(), devotees: 1 });
  const [availability, setAvailability] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    Promise.all([api.sevas(), api.myBookings()])
      .then(([s, m]) => {
        setSevas(s);
        setMine(m);
        if (s.length) setForm((f) => ({ ...f, seva_id: String(s[0].id) }));
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!form.seva_id || !form.booking_date) {
      setAvailability(null);
      return;
    }
    api.availability(form.seva_id, form.booking_date)
      .then(setAvailability)
      .catch(() => setAvailability(null));
  }, [form.seva_id, form.booking_date]);

  if (!sevas) return <Loader />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const booking = await api.createBooking({
        seva_id: Number(form.seva_id),
        booking_date: form.booking_date,
        devotees: Number(form.devotees),
      });
      const intent = await api.bookingCheckout(booking.id);
      setSuccess(
        t("bookings.successFmt", {
          ref: booking.reference,
          amount: booking.amount_inr,
          order: intent.provider_order_id,
        })
      );
      const updated = await api.myBookings();
      setMine(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker={t("bookings.kicker")}
        title={t("bookings.title")}
        lede={t("bookings.lede")}
      />

      <div className="grid grid-2">
        <section className="card">
          <h2>{t("bookings.bookOne")}</h2>
          <Alert type="error">{error}</Alert>
          <Alert type="success">{success}</Alert>
          <form className="form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="seva">{t("bookings.labelSeva")}</label>
              <select
                id="seva"
                className="select"
                value={form.seva_id}
                onChange={(e) => setForm({ ...form, seva_id: e.target.value })}
              >
                {sevas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {(isTa ? s.name_ta : s.name_en)} — ₹{s.price_inr} · {s.starts_at.slice(0, 5)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="date">{t("bookings.labelDate")}</label>
              <input
                id="date"
                type="date"
                className="input"
                min={todayISO()}
                value={form.booking_date}
                onChange={(e) => setForm({ ...form, booking_date: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="devotees">{t("bookings.labelDevotees")}</label>
              <input
                id="devotees"
                type="number"
                min="1"
                max="20"
                className="input"
                value={form.devotees}
                onChange={(e) => setForm({ ...form, devotees: e.target.value })}
              />
            </div>
            {availability && (
              <p className="page-header-lede" style={{ maxWidth: "none" }}>
                {t("bookings.available", {
                  available: availability.available,
                  capacity: availability.capacity,
                })}
              </p>
            )}
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? t("bookings.submitting") : t("bookings.submit")}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>{t("bookings.yours")}</h2>
          {mine.length === 0 ? (
            <EmptyState icon="lotus" message={t("bookings.noneYet")} />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("bookings.tableRef")}</th>
                    <th>{t("bookings.tableDate")}</th>
                    <th>{t("bookings.tableDevotees")}</th>
                    <th>{t("bookings.tableAmount")}</th>
                    <th>{t("bookings.tableStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map((b) => (
                    <tr key={b.id}>
                      <td>{b.reference}</td>
                      <td>{b.booking_date}</td>
                      <td>{b.devotees}</td>
                      <td>₹{b.amount_inr}</td>
                      <td><span className="card-tag">{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="section">
        <div className="section-head">
          <p className="kicker">{t("bookings.availableSevas")}</p>
        </div>
        <div className="grid grid-3">
          {sevas.map((s) => (
            <article key={s.id} className="card hover">
              <h3>{isTa ? s.name_ta : s.name_en}</h3>
              <p className={isTa ? "" : "tamil"} style={{ color: "var(--c-stone)" }}>
                {isTa ? s.name_en : s.name_ta}
              </p>
              <p className="page-header-lede" style={{ maxWidth: "none", marginTop: 12 }}>
                {s.description}
              </p>
              <div className="card-meta">
                <span>🕒 {s.starts_at.slice(0, 5)}</span>
                <span>· {s.duration_min} min</span>
                <span>· ₹{s.price_inr}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
