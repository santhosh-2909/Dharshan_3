import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Nav() {
  const { t, i18n } = useTranslation();
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  const links = [
    { to: "/about", label: t("nav.about") },
    { to: "/events", label: t("nav.events") },
    { to: "/bookings", label: t("nav.bookings") },
    { to: "/donations", label: t("nav.donations") },
    { to: "/parking", label: t("nav.parking") },
    { to: "/dashboard", label: t("nav.dashboard") },
  ];

  const lang = i18n.resolvedLanguage || i18n.language || "en";

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSignOut() {
    logout();
    setMenuOpen(false);
    navigate("/");
  }

  function setLang(code) {
    if (i18n.language !== code) i18n.changeLanguage(code);
  }

  return (
    <header className="nav" role="banner">
      <div className="container">
        <div className="nav-row">
          <Link to="/" className="brand" aria-label={t("brand.name")}>
            <span className="brand-mark" aria-hidden="true">அ</span>
            <span className="brand-text">
              <strong>{t("brand.name")}</strong>
              <span>{t("brand.tag")}</span>
            </span>
          </Link>

          <nav className="nav-links" aria-label={t("nav.primary")}>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="nav-actions">
            <fieldset className="lang-toggle">
              <legend className="visually-hidden">{t("lang.switchLabel")}</legend>
              <button
                type="button"
                className={"lang-opt" + (lang === "en" ? " active" : "")}
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
              >
                EN
              </button>
              <span className="lang-sep" aria-hidden="true">|</span>
              <button
                type="button"
                className={"lang-opt" + (lang === "ta" ? " active" : "")}
                onClick={() => setLang("ta")}
                aria-pressed={lang === "ta"}
              >
                தமிழ்
              </button>
            </fieldset>

            <button
              className="icon-btn"
              type="button"
              onClick={toggle}
              aria-label={t("theme.switchLabel")}
              title={theme === "dark" ? t("theme.lightMode") : t("theme.darkMode")}
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>

            <div className="menu" ref={menuRef}>
              <button
                className="icon-btn"
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={t("nav.openMenu")}
                onClick={() => setMenuOpen((v) => !v)}
              >
                ☰
              </button>
              {menuOpen && (
                <div className="menu-panel" role="menu">
                  <Link to="/settings" onClick={() => setMenuOpen(false)}>{t("nav.settings")}</Link>
                  <Link to="/faq" onClick={() => setMenuOpen(false)}>{t("nav.faq")}</Link>
                  <Link to="/feedback" onClick={() => setMenuOpen(false)}>{t("nav.feedback")}</Link>
                  <Link to="/about" onClick={() => setMenuOpen(false)}>{t("nav.aboutTemple")}</Link>
                  <hr />
                  {user ? (
                    <>
                      <span style={{ padding: "8px 12px", fontSize: "0.85rem", color: "var(--c-stone)" }}>
                        {t("nav.signedInAs", { name: user.name })}
                      </span>
                      <button type="button" onClick={handleSignOut}>{t("nav.signOut")}</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMenuOpen(false)}>{t("nav.signIn")}</Link>
                      <Link to="/login?mode=register" onClick={() => setMenuOpen(false)}>{t("nav.createAccount")}</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              className="icon-btn nav-mobile-toggle"
              type="button"
              aria-label={t("nav.toggleNav")}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? "✕" : "≡"}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="nav-mobile" aria-label={t("nav.mobile")}>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink to="/feedback" onClick={() => setMobileOpen(false)}>{t("nav.feedback")}</NavLink>
            <NavLink to="/faq" onClick={() => setMobileOpen(false)}>{t("nav.faq")}</NavLink>
            <NavLink to="/settings" onClick={() => setMobileOpen(false)}>{t("nav.settings")}</NavLink>
          </nav>
        )}
      </div>
    </header>
  );
}
