import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="container">
        <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
        <span className="tamil">{t("footer.blessing")}</span>
      </div>
    </footer>
  );
}
