import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "./Icon.jsx";

export default function Sidebar() {
  const { t } = useTranslation();

  // The five operational modules per the dashboard brief.
  const modules = [
    { to: "/dashboard", end: true, icon: "home", label: t("nav.dashboard") },
    { to: "/dashboard/parking", icon: "parking", label: t("nav.parking") },
    { to: "/dashboard/bookings", icon: "lotus", label: t("nav.booking") },
    { to: "/cctv", icon: "shield", label: t("nav.cctv") },
    { to: "/prediction", icon: "crystal", label: t("nav.prediction") },
    { to: "/final-report", icon: "layers", label: t("nav.finalReport") },
  ];

  return (
    <aside className="dash-side" aria-label={t("nav.dashboard")}>
      <h4>{t("modules.kicker")}</h4>
      <nav className="dash-nav">
        {modules.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="ico"><Icon name={it.icon} size={18} /></span>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Settings pinned to the bottom of the sidebar */}
      <nav className="dash-nav dash-nav-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <span className="ico"><Icon name="settings" size={18} /></span>
          <span>{t("nav.settings")}</span>
        </NavLink>
      </nav>
    </aside>
  );
}
