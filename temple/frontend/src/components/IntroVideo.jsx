import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const SEEN_KEY = "aalayam.intro.seen";
const MAX_SECONDS = 30;

const SOURCES = [
  "https://videos.pexels.com/video-files/8164379/8164379-uhd_2160_3840_30fps.mp4",
  "https://videos.pexels.com/video-files/3124111/3124111-uhd_2560_1440_30fps.mp4",
];

export default function IntroVideo() {
  const { t } = useTranslation();
  const [active, setActive] = useState(() => sessionStorage.getItem(SEEN_KEY) !== "1");
  const [muted, setMuted] = useState(true);
  const [srcIndex, setSrcIndex] = useState(0);
  const videoRef = useRef(null);
  const sectionRef = useRef(null);

  function dismiss() {
    sessionStorage.setItem(SEEN_KEY, "1");
    if (sectionRef.current) sectionRef.current.classList.add("intro-leave");
    setTimeout(() => setActive(false), 600);
  }

  useEffect(() => {
    if (!active) return;
    document.body.style.overflow = "hidden";
    const autoDismiss = setTimeout(dismiss, MAX_SECONDS * 1000 + 200);
    return () => {
      document.body.style.overflow = "";
      clearTimeout(autoDismiss);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    function onWheel(e) { if (e.deltaY > 4) dismiss(); }
    function onKey(e) {
      if (["ArrowDown", "PageDown", "Escape", " "].includes(e.key)) dismiss();
    }
    let touchStart = 0;
    function onTouchStart(e) { touchStart = e.touches[0].clientY; }
    function onTouchMove(e) {
      if (touchStart - e.touches[0].clientY > 24) dismiss();
    }
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [active]);

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (v && v.currentTime >= MAX_SECONDS) dismiss();
  }

  function handleError() {
    if (srcIndex < SOURCES.length - 1) setSrcIndex((i) => i + 1);
    else dismiss();
  }

  if (!active) return null;

  return (
    <section
      ref={sectionRef}
      className="intro"
      role="dialog"
      aria-label={t("intro.ariaLabel")}
    >
      <video
        ref={videoRef}
        key={SOURCES[srcIndex]}
        className="intro-video"
        src={SOURCES[srcIndex]}
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
      >
        <track kind="captions" srcLang="en" label="No dialogue" default />
      </video>
      <div className="intro-overlay" />
      <div className="intro-content">
        <p className="kicker">{t("intro.kicker")}</p>
        <h1 className="intro-title">{t("intro.title")}</h1>
        <p className="intro-sub tamil">{t("intro.subtitle")}</p>
        <div className="intro-actions">
          <button type="button" className="btn btn-primary" onClick={dismiss}>
            {t("intro.enter")}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              v.muted = !v.muted;
              setMuted(v.muted);
            }}
          >
            {muted ? t("intro.unmute") : t("intro.mute")}
          </button>
        </div>
        <p className="intro-hint">{t("intro.hint")}</p>
      </div>
      <button type="button" className="intro-skip" onClick={dismiss} aria-label={t("intro.skip")}>
        {t("intro.skip")}
      </button>
    </section>
  );
}
