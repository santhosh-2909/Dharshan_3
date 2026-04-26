import { useTranslation } from "react-i18next";

export default function Loader({ label }) {
  const { t } = useTranslation();
  return (
    <div className="center-row" role="status" aria-live="polite">
      <span className="spinner" />
      <span>{label || t("common.loading")}…</span>
    </div>
  );
}
