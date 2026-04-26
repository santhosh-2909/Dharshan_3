import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";

const VEHICLE_TYPES = ["car", "bike", "bus", "auto"];

export default function Parking() {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === "ta";

  const [lots, setLots] = useState(null);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({
    lot_id: "",
    vehicle_type: "car",
    vehicle_number: "",
    owner_name: "",
    contact: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const refresh = useCallback(() => {
    Promise.all([api.parkingLots(), api.parkingStats()])
      .then(([ls, st]) => {
        setLots(ls);
        setStats(st);
        setForm((f) => (f.lot_id ? f : { ...f, lot_id: String(ls[0]?.lot.id || "") }));
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (!lots || !stats) return <Loader />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const entry = await api.parkingEntry({
        lot_id: Number(form.lot_id),
        vehicle_type: form.vehicle_type,
        vehicle_number: form.vehicle_number,
        owner_name: form.owner_name,
        contact: form.contact,
      });
      const lot = lots.find((l) => l.lot.id === Number(form.lot_id));
      const lotName = lot ? (isTa ? lot.lot.name_ta : lot.lot.name_en) : "";
      setSuccess(t("parking.successFmt", { ref: entry.reference, lot: lotName }));
      setForm({ ...form, vehicle_number: "", owner_name: "", contact: "" });
      refresh();
    } catch (err) {
      setError(err.message);
    }
    finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header style={{ marginBottom: 24 }}>
        <p className="kicker">{t("parking.kicker")}</p>
        <h1>{t("parking.title")}</h1>
        <p style={{ marginTop: 8, maxWidth: "60ch" }}>{t("parking.lede")}</p>
      </header>

      {/* Two simple top-line numbers — entries + free slots. */}
      <section className="grid grid-2" style={{ marginBottom: 24 }}>
        <article className="stat">
          <div className="label">{t("modules.parkingOps.entered")}</div>
          <div className="value">{stats.vehicles_entered.toLocaleString("en-IN")}</div>
        </article>
        <article className="stat">
          <div className="label">{t("modules.parkingOps.available")}</div>
          <div className="value">{stats.available_slots.toLocaleString("en-IN")}</div>
          <div className="delta">{t("parking.totalCapacity")}: {stats.total_capacity.toLocaleString("en-IN")}</div>
        </article>
      </section>

      <section className="card">
        <h2>{t("parking.registerHeading")}</h2>
        {error && <div className="alert error" style={{ marginTop: 12 }}>{error}</div>}
        {success && <div className="alert success" style={{ marginTop: 12 }}>{success}</div>}
        <form className="form" onSubmit={submit} style={{ marginTop: 16 }}>
          <div className="field">
            <label htmlFor="lot">{t("parking.lotLabel")}</label>
            <select
              id="lot"
              className="select"
              value={form.lot_id}
              onChange={(e) => setForm({ ...form, lot_id: e.target.value })}
              required
            >
              {lots.map((l) => (
                <option key={l.lot.id} value={l.lot.id}>
                  {isTa ? l.lot.name_ta : l.lot.name_en} · {l.total_available} {t("parking.available")}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="vt">{t("parking.vehicleType")}</label>
            <select
              id="vt"
              className="select"
              value={form.vehicle_type}
              onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
              required
            >
              {VEHICLE_TYPES.map((vt) => (
                <option key={vt} value={vt}>{t(`parking.types.${vt}`)}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="vn">{t("parking.vehicleNumber")}</label>
            <input
              id="vn"
              className="input"
              placeholder={t("parking.vehicleNumberPh")}
              required
              value={form.vehicle_number}
              onChange={(e) => setForm({ ...form, vehicle_number: e.target.value.toUpperCase() })}
              style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-serif)" }}
            />
          </div>
          <div className="field">
            <label htmlFor="on">{t("parking.ownerName")}</label>
            <input
              id="on"
              className="input"
              required
              value={form.owner_name}
              onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="ct">{t("parking.contactLabel")}</label>
            <input
              id="ct"
              className="input"
              inputMode="tel"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? t("parking.submitting") : t("parking.submit")}
          </button>
        </form>
      </section>
    </>
  );
}
