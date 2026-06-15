import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const lang = i18n.resolvedLanguage || i18n.language || "en";

  return (
    <>
      <PageHeader
        kicker={t("settings.kicker")}
        title={t("settings.title")}
      />

      <div className="grid grid-2">
        <section className="card">
          <h3>{t("settings.appearance")}</h3>
          <p style={{ marginTop: 8 }}>{t("settings.appearanceLede")}</p>
          <div className="settings-options">
            {[
              { id: "light", label: t("theme.light") },
              { id: "dark", label: t("theme.dark") },
            ].map((tt) => (
              <button
                key={tt.id}
                type="button"
                className={"btn " + (theme === tt.id ? "btn-primary" : "btn-ghost")}
                onClick={() => setTheme(tt.id)}
              >
                {tt.label}
              </button>
            ))}
          </div>

          <hr className="divider" />

          <h3>{t("settings.language")}</h3>
          <p style={{ marginTop: 8 }}>{t("settings.languageLede")}</p>
          <div className="settings-options">
            {[
              { id: "en", label: t("lang.english") },
              { id: "ta", label: t("lang.tamil") },
            ].map((l) => (
              <button
                key={l.id}
                type="button"
                className={"btn " + (lang === l.id ? "btn-primary" : "btn-ghost")}
                onClick={() => i18n.changeLanguage(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>{t("settings.account")}</h3>
          {user ? (
            <>
              <dl className="kv" style={{ marginTop: 12 }}>
                <dt>{t("settings.fieldName")}</dt><dd>{user.name}</dd>
                <dt>{t("settings.fieldEmail")}</dt><dd>{user.email}</dd>
                <dt>{t("settings.fieldRole")}</dt>
                <dd>{user.is_admin ? t("settings.roleAdmin") : t("settings.roleDevotee")}</dd>
              </dl>
              <button className="btn btn-outline" type="button" onClick={logout} style={{ marginTop: 16 }}>
                {t("settings.signOut")}
              </button>
            </>
          ) : (
            <p style={{ marginTop: 8 }}>{t("settings.signInPrompt")}</p>
          )}
        </section>
      </div>
    </>
  );
}
