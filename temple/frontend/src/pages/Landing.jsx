import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import useScrollReveal from "../hooks/useScrollReveal.js";

import Hero from "../components/landing/Hero.jsx";
import Strip from "../components/landing/Strip.jsx";
import DashboardPreview from "../components/landing/DashboardPreview.jsx";
import Features from "../components/landing/Features.jsx";
import CrowdHighlight from "../components/landing/CrowdHighlight.jsx";
import Gallery from "../components/landing/Gallery.jsx";
import CulturalHeritage from "../components/landing/CulturalHeritage.jsx";
import Testimonials from "../components/landing/Testimonials.jsx";
import FAQTeaser from "../components/landing/FAQTeaser.jsx";
import CTA from "../components/landing/CTA.jsx";
import SiteFooter from "../components/landing/SiteFooter.jsx";

const BG_IMAGES = [
  "/images/gajalakshmi-mural.jpeg",
  "/images/gopuram-sculptures.jpeg",
  "/images/chariot-wheel.jpeg",
  "/images/temple-niches.jpeg",
  "/images/narrative-relief.jpeg",
];

export default function Landing() {
  const [stats, setStats] = useState(null);
  const [crowd, setCrowd] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [faq, setFaq] = useState([]);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    Promise.allSettled([api.landingStats(), api.crowd(), api.feedbackList(), api.faq()])
      .then(([s, c, f, q]) => {
        if (s.status === "fulfilled") setStats(s.value);
        if (c.status === "fulfilled") setCrowd(c.value);
        if (f.status === "fulfilled") setFeedback(f.value);
        if (q.status === "fulfilled") setFaq(q.value);
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BG_IMAGES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useScrollReveal();

  return (
    <div className="landing">
      {/* Crossfading background slideshow */}
      <div className="landing-bg" aria-hidden="true">
        {BG_IMAGES.map((src, i) => (
          <div
            key={src}
            className={`landing-bg-slide${i === bgIndex ? " active" : ""}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className="landing-bg-overlay" />
      </div>

      <Hero stats={stats} />
      <Strip />
      <DashboardPreview stats={stats} crowd={crowd} />
      <Features />
      <CrowdHighlight crowd={crowd} />
      <Gallery />
      <CulturalHeritage />
      <Testimonials items={feedback} />
      <FAQTeaser items={faq} />
      <CTA />
      <SiteFooter />
    </div>
  );
}
