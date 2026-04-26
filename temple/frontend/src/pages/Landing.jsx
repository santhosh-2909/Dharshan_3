import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import useScrollReveal from "../hooks/useScrollReveal.js";

import IntroVideo from "../components/IntroVideo.jsx";
import Hero from "../components/landing/Hero.jsx";
import Strip from "../components/landing/Strip.jsx";
import DashboardPreview from "../components/landing/DashboardPreview.jsx";
import Features from "../components/landing/Features.jsx";
import CrowdHighlight from "../components/landing/CrowdHighlight.jsx";
import Gallery from "../components/landing/Gallery.jsx";
import Testimonials from "../components/landing/Testimonials.jsx";
import FAQTeaser from "../components/landing/FAQTeaser.jsx";
import CTA from "../components/landing/CTA.jsx";
import SiteFooter from "../components/landing/SiteFooter.jsx";

export default function Landing() {
  const [stats, setStats] = useState(null);
  const [crowd, setCrowd] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [faq, setFaq] = useState([]);

  useEffect(() => {
    Promise.allSettled([api.landingStats(), api.crowd(), api.feedbackList(), api.faq()])
      .then(([s, c, f, q]) => {
        if (s.status === "fulfilled") setStats(s.value);
        if (c.status === "fulfilled") setCrowd(c.value);
        if (f.status === "fulfilled") setFeedback(f.value);
        if (q.status === "fulfilled") setFaq(q.value);
      });
  }, []);

  useScrollReveal();

  return (
    <div className="landing">
      <IntroVideo />
      <Hero stats={stats} />
      <Strip />
      <DashboardPreview stats={stats} crowd={crowd} />
      <Features />
      <CrowdHighlight crowd={crowd} />
      <Gallery />
      <Testimonials items={feedback} />
      <FAQTeaser items={faq} />
      <CTA />
      <SiteFooter />
    </div>
  );
}
