import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import Loader from "../components/Loader.jsx";

export default function Revenue() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.revenueAnalytics().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Loader />;

  const maxMonthly = Math.max(...data.monthly.map((m) => m.total), 1);

  return (
    <>
      <PageHeader kicker="Analytics" title="Revenue Dashboard" />

      <div className="grid grid-3" style={{ marginBottom: "32px" }}>
        <div className="stat">
          <span className="label">Booking Revenue</span>
          <span className="value">{"\u20B9"}{Math.round(data.total_booking_revenue).toLocaleString("en-IN")}</span>
        </div>
        <div className="stat">
          <span className="label">Donation Revenue</span>
          <span className="value">{"\u20B9"}{Math.round(data.total_donation_revenue).toLocaleString("en-IN")}</span>
        </div>
        <div className="stat">
          <span className="label">Grand Total</span>
          <span className="value">{"\u20B9"}{Math.round(data.grand_total).toLocaleString("en-IN")}</span>
        </div>
      </div>

      {data.monthly.length > 0 && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <h3>Monthly Revenue</h3>
          <div className="revenue-chart">
            {data.monthly.map((m) => (
              <div key={m.month} className="revenue-bar-col">
                <div className="revenue-bar-stack" style={{ height: `${(m.total / maxMonthly) * 100}%` }}>
                  <div className="revenue-bar-booking" style={{ flex: m.booking_revenue }} title={`Bookings: \u20B9${Math.round(m.booking_revenue)}`} />
                  <div className="revenue-bar-donation" style={{ flex: m.donation_revenue }} title={`Donations: \u20B9${Math.round(m.donation_revenue)}`} />
                </div>
                <span className="revenue-bar-label">{m.month.slice(5)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "0.82rem" }}>
            <span><span className="revenue-dot revenue-dot-booking" /> Bookings</span>
            <span><span className="revenue-dot revenue-dot-donation" /> Donations</span>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <h3>Top Sevas by Revenue</h3>
          {data.top_sevas.length === 0 ? (
            <p style={{ color: "var(--c-stone)", marginTop: "8px" }}>No booking data yet.</p>
          ) : (
            <div style={{ marginTop: "12px" }}>
              {data.top_sevas.map((s, i) => (
                <div key={s.seva_name} className="revenue-item">
                  <span className="revenue-rank">{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <strong>{s.seva_name}</strong>
                    <div style={{ fontSize: "0.82rem", color: "var(--c-stone)" }}>{s.count} bookings</div>
                  </div>
                  <strong>{"\u20B9"}{Math.round(s.revenue).toLocaleString("en-IN")}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3>Donation Causes</h3>
          {data.top_causes.length === 0 ? (
            <p style={{ color: "var(--c-stone)", marginTop: "8px" }}>No donation data yet.</p>
          ) : (
            <div style={{ marginTop: "12px" }}>
              {data.top_causes.map((c, i) => (
                <div key={c.cause} className="revenue-item">
                  <span className="revenue-rank">{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <strong>{c.cause}</strong>
                    <div style={{ fontSize: "0.82rem", color: "var(--c-stone)" }}>{c.count} donations</div>
                  </div>
                  <strong>{"\u20B9"}{Math.round(c.revenue).toLocaleString("en-IN")}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
