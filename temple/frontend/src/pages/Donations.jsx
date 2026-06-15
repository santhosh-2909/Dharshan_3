import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Alert from "../components/Alert.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Donations() {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === "ta";
  const { user } = useAuth();
  const [causes, setCauses] = useState(null);
  const [recent, setRecent] = useState([]);
  const [form, setForm] = useState({ donor_name: "", purpose: "", amount_inr: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    Promise.all([api.causes(), api.recentDonations()])
      .then(([c, r]) => {
        setCauses(c);
        setRecent(r);
        setForm((f) => ({ ...f, donor_name: user?.name || "", purpose: c[0]?.name_en || "" }));
      })
      .catch((e) => setError(e.message));
  }, [user]);

  if (!causes) return <Loader />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const donation = await api.donate({
        donor_name: form.donor_name,
        purpose: form.purpose,
        amount_inr: Number(form.amount_inr),
      });
      const intent = await api.donationCheckout(donation.id);
      setSuccess(
        t("donations.successFmt", {
          name: donation.donor_name,
          ref: donation.reference,
          order: intent.provider_order_id,
        })
      );
      setRecent(await api.recentDonations());
      setForm({ ...form, amount_inr: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker={t("donations.kicker")}
        title={t("donations.title")}
        lede={t("donations.lede")}
      />

      <div className="grid grid-2">
        <section className="card">
          <h2>{t("donations.make")}</h2>
          <Alert type="error">{error}</Alert>
          <Alert type="success">{success}</Alert>
          <form className="form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="donor">{t("donations.name")}</label>
              <input
                id="donor"
                type="text"
                className="input"
                required
                value={form.donor_name}
                onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="cause">{t("donations.cause")}</label>
              <select
                id="cause"
                className="select"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              >
                {causes.map((c) => (
                  <option key={c.id} value={c.name_en}>
                    {isTa ? c.name_ta : c.name_en} — {t("donations.from", { min: c.min_inr })}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="amount">{t("donations.amount")}</label>
              <input
                id="amount"
                type="number"
                min="1"
                step="1"
                className="input"
                required
                value={form.amount_inr}
                onChange={(e) => setForm({ ...form, amount_inr: e.target.value })}
              />
            </div>
            <div className="quick-amounts">
              {[101, 251, 501, 1001].map((v) => (
                <button
                  key={v}
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setForm({ ...form, amount_inr: String(v) })}
                >
                  ₹{v.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? t("donations.submitting") : t("donations.submit")}
            </button>
            <p className="cause-item-sub" style={{ fontSize: "0.85rem" }}>
              {t("donations.razorpayNote")}
            </p>
          </form>
        </section>

        <section className="card">
          <h2>{t("donations.where")}</h2>
          <div className="form">
            {causes.map((c) => (
              <div key={c.id} className="cause-item">
                <strong>{isTa ? c.name_ta : c.name_en}</strong>
                <div className={`cause-item-sub ${isTa ? "" : "tamil"}`}>
                  {isTa ? c.name_en : c.name_ta}
                </div>
                <div className="card-meta">{t("donations.from", { min: c.min_inr })}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="section">
        <div className="section-head">
          <p className="kicker">{t("donations.recent")}</p>
        </div>
        <div className="card">
          {recent.length === 0 ? (
            <EmptyState message={t("donations.noneYet")} />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("donations.tableDonor")}</th>
                    <th>{t("donations.tableCause")}</th>
                    <th>{t("donations.tableAmount")}</th>
                    <th>{t("donations.tableRef")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((d) => (
                    <tr key={d.id}>
                      <td>{d.donor_name}</td>
                      <td>{d.purpose}</td>
                      <td>₹{d.amount_inr.toLocaleString("en-IN")}</td>
                      <td>{d.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
