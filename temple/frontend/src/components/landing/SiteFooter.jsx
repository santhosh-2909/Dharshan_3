import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="l-footer">
      <img
        className="l-footer-decor"
        src="/images/gajalakshmi-mural.jpeg"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <div className="container">
        <div className="l-footer-grid">
          <div className="l-foot-brand">
            <strong>{t("brand.name")}</strong>
            <p>{t("footer.brand")}</p>
          </div>
          <div>
            <h4>{t("footer.devotee")}</h4>
            <ul>
              <li><Link to="/about">{t("footer.aboutLink")}</Link></li>
              <li><Link to="/events">{t("footer.festivals")}</Link></li>
              <li><Link to="/bookings">{t("footer.bookSeva")}</Link></li>
              <li><Link to="/donations">{t("footer.donationsLink")}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t("footer.operators")}</h4>
            <ul>
              <li><Link to="/dashboard">{t("footer.liveDashboard")}</Link></li>
              <li><Link to="/faq">{t("footer.faqLink")}</Link></li>
              <li><Link to="/feedback">{t("footer.feedbackLink")}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t("footer.account")}</h4>
            <ul>
              <li><Link to="/login">{t("nav.signIn")}</Link></li>
              <li><Link to="/login?mode=register">{t("footer.createAccount")}</Link></li>
              <li><Link to="/settings">{t("footer.settingsLink")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="l-footer-bot">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <span className="tamil">{t("footer.blessing")}</span>
        </div>
      </div>
    </footer>
  );
}
