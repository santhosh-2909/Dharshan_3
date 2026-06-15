import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client.js";
import Loader from "../components/Loader.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Alert from "../components/Alert.jsx";

export default function FAQ() {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === "ta";
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.faq().then(setItems).catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert type="error">{t("common.error", { message: error })}</Alert>;
  if (!items) return <Loader />;

  return (
    <>
      <PageHeader
        kicker={t("faqPage.kicker")}
        title={t("faqPage.title")}
      />
      <div className="faq-list">
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
