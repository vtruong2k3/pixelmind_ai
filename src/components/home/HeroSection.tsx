"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { AIFeature } from "@/types/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeroSectionProps {
  topFeatures?: AIFeature[];
}

const CAROUSEL_SCENES = [
  "EXPLORATION",
  "JUNGLE",
  "UNDERWATER",
  "MOUNTAIN"
];

const SCENE_IMAGES: Record<string, string> = {
  "EXPLORATION": "/bfl_banner_background.webp", // Giả lập, có thể thêm ảnh khác sau
  "JUNGLE": "/bfl_banner_background.webp",
  "UNDERWATER": "/bfl_banner_background.webp",
  "MOUNTAIN": "/bfl_banner_background.webp",
};

export default function HeroSection({ topFeatures = [] }: HeroSectionProps) {
  const [currentScene, setCurrentScene] = useState(2); // Default to UNDERWATER

  return (
    <section className="relative w-full h-[100svh] min-h-[700px] overflow-hidden bg-black flex flex-col items-center justify-center">
      
      {/* Background Image Sequence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene}
          initial={{ opacity: 0.8, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.8 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${SCENE_IMAGES[CAROUSEL_SCENES[currentScene]]})` }}
        />
      </AnimatePresence>

      {/* Dark Overlay for readability using gradient */}
      <div className="absolute inset-0 z-0 bg-black/30 pointer-events-none" />

      {/* Navbar overlay (optional gradient to top if Navbar is absolute) */}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 w-full pt-10">
        
        {/* Top Tagline */}
        <p className="font-mono text-sm sm:text-base text-white/90 mb-4 tracking-tighter" style={{ wordSpacing: "2px" }}>
          The frontier AI studio for visual intelligence.
        </p>
        
        {/* Main Heading */}
        <h1 
          className="font-medium text-white mb-2 tracking-tighter"
          style={{ fontSize: "clamp(48px, 8vw, 110px)", lineHeight: "1", letterSpacing: "-0.05em" }}
        >
          Introducing PixelMind
        </h1>
        
        {/* Tags */}
        <div className="font-mono text-xl sm:text-3xl text-white/80 mb-6 flex gap-2 sm:gap-4 tracking-tight">
          <span>[studio]</span>
          <span>[gallery]</span>
          <span>[api]</span>
          <span>[community]</span>
        </div>
        
        {/* Subtitle / Description */}
        <p className="text-white/90 text-sm sm:text-base max-w-xl mb-10 leading-relaxed font-medium">
          Production-grade AI image generation and editing platform with 4MP photorealistic output and multi-reference control
        </p>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-3 w-full sm:w-auto px-4 sm:px-0">
          <Link
            href="/#features"
            className="flex-1 sm:flex-none w-full sm:w-[180px] h-[52px] flex items-center justify-center text-[15px] font-medium transition-colors"
            style={{ backgroundColor: "#697266", color: "#ffffff", borderRadius: "4px" }}
          >
            Learn More
          </Link>
          <Link
            href="/studio"
            className="flex-1 sm:flex-none w-full sm:w-[220px] h-[52px] flex items-center justify-center text-[15px] font-semibold transition-colors hover:opacity-90"
            style={{ backgroundColor: "#cbbddf", color: "#111111", borderRadius: "4px" }}
          >
            Try PixelMind.AI free
          </Link>
        </div>
        
        {/* Underlined link */}
        <Link href="/gallery" className="text-xs text-white/70 hover:text-white underline underline-offset-[6px] decoration-white/40 transition-colors tracking-widest uppercase font-mono mt-4">
          Explore Gallery &rarr;
        </Link>
      </div>

      {/* Bottom Floating Carousel Selector */}
      <div className="absolute bottom-[40px] z-20 w-full flex justify-center px-4">
        <div 
          className="flex items-center gap-2 sm:gap-6 px-4 py-2"
          style={{ 
            backgroundColor: "rgba(10, 15, 12, 0.85)", 
            backdropFilter: "blur(10px)",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.05)"
          }}
        >
          <button 
            onClick={() => setCurrentScene(prev => (prev === 0 ? CAROUSEL_SCENES.length - 1 : prev - 1))}
            className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1 sm:gap-4 overflow-hidden" style={{ minWidth: "220px", justifyContent: "center" }}>
            {CAROUSEL_SCENES.map((scene, idx) => (
              <button
                key={scene}
                onClick={() => setCurrentScene(idx)}
                className={`font-mono text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-colors px-2 py-1 rounded
                  ${idx === currentScene ? "text-white" : "text-white/40 hover:text-white/70"}
                `}
              >
                {scene}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setCurrentScene(prev => (prev + 1) % CAROUSEL_SCENES.length)}
            className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </section>
  );
}
