import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";

export default function FAQ() {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === "ta";
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.faq().then(setItems).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert error">{t("common.error", { message: error })}</div>;
  if (!items) return <Loader />;

  return (
    <>
      <header style={{ marginBottom: 24 }}>
        <p className="kicker">{t("faqPage.kicker")}</p>
        <h1>{t("faqPage.title")}</h1>
      </header>
      <div style={{ display: "grid", gap: 12 }}>
        {items.map((f) => (
          <details key={f.id} className="faq">
            <summary>{isTa ? f.question_ta : f.question_en}</summary>
            <div className="faq-body">
              <p>{isTa ? f.answer_ta : f.answer_en}</p>
              <p className={isTa ? "" : "tamil"}>{isTa ? f.answer_en : f.answer_ta}</p>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
