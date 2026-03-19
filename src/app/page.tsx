/**
 * src/app/page.tsx
 * Home page — Deevid.ai-inspired design
 * Keeps: Navbar + HeroSection (banner)
 * Replaces: Everything else with deevid.ai-style sections
 */
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import {
  AIIntroSection,
  AllShowcases,
  PopularTemplates,
  AIModelsSection,
  SafetySection,
  FAQSection,
  FinalCTA,
  DeevidFooter,
  BlinkStyle,
} from "@/components/home/DeevidSections";

export default async function HomePage() {
  return (
    <div style={{ background: "#000" }}>
      <BlinkStyle />
      <Navbar transparent={true} />

      {/* Section 1 — Hero (keep original) */}
      <HeroSection />

      {/* Section 2 — AI Intro with typing prompt */}
      <AIIntroSection />

      {/* Section 3, 4, 5 — Tool Showcases (self-contained) */}
      <AllShowcases />

      {/* Section 6 — Popular Templates */}
      <PopularTemplates />

      {/* Section 7 — AI Models */}
      <AIModelsSection />

      {/* Section 8 — Safety */}
      <SafetySection />

      {/* Section 9 — FAQ */}
      <FAQSection />

      {/* Section 10 — Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <DeevidFooter />
    </div>
  );
}
