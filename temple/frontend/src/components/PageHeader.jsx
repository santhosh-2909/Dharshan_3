import { useTranslation } from "react-i18next";

export default function PageHeader({ kicker, title, lede, children }) {
  const { t } = useTranslation();
  return (
    <header className="page-header">
      {kicker && <p className="kicker">{kicker}</p>}
      <h1>{title}</h1>
      {lede && <p className="page-header-lede">{lede}</p>}
      {children}
    </header>
  );
}
