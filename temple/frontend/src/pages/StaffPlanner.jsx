import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import Loader from "../components/Loader.jsx";

export default function StaffPlanner() {
  const [plan, setPlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    setPlan(null);
    api.staffRecommendations(selectedDate).then(setPlan).catch(() => setPlan(null));
  }, [selectedDate]);

  return (
    <>
      <PageHeader kicker="Operations" title="Staff Deployment Planner" />

      <div style={{ marginBottom: "24px" }}>
        <label className="field">
          <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>Select date</span>
          <input
            type="date"
            className="input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ maxWidth: "220px" }}
          />
        </label>
      </div>

      {!plan ? <Loader /> : (
        <>
          <div className="grid grid-4" style={{ marginBottom: "32px" }}>
            <div className="stat">
              <span className="label">Date</span>
              <span className="value" style={{ fontSize: "1.2rem" }}>{plan.weekday}</span>
            </div>
            <div className="stat">
              <span className="label">Peak Hour</span>
              <span className="value">{plan.peak_hour}:00</span>
            </div>
            <div className="stat">
              <span className="label">Peak Staff</span>
              <span className="value">{plan.peak_staff}</span>
            </div>
            <div className="stat">
              <span className="label">Total Staff-Hours</span>
              <span className="value">{plan.total_staff_hours}</span>
            </div>
          </div>

          <div className="card" style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Hour</th>
                  <th>Expected Visitors</th>
                  <th>Queue Marshals</th>
                  <th>Prasad Staff</th>
                  <th>Parking</th>
                  <th>Security</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {plan.hourly.map((h) => (
                  <tr key={h.hour} className={h.hour === plan.peak_hour ? "staff-peak-row" : ""}>
                    <td><strong>{h.hour}:00</strong></td>
                    <td>{h.expected_visitors}</td>
                    <td>{h.queue_marshals}</td>
                    <td>{h.prasad_staff}</td>
                    <td>{h.parking_attendants}</td>
                    <td>{h.security}</td>
                    <td><strong>{h.total}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
