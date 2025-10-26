import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { tarotFacts } from "../data/tarotFacts";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
};

function ThinkingAnimation() {
  const { t, language } = useLanguage();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const playButtonRef = useRef(null);
  const factRef = useRef(null);

  // Get facts in current language
  const facts = tarotFacts[language] || tarotFacts.en;

  // Initialize with a random fact on mount
  useEffect(() => {
    setCurrentFactIndex(Math.floor(Math.random() * facts.length));
  }, [facts.length]);

  // Auto-focus the play button when component mounts
  useEffect(() => {
    if (playButtonRef.current) {
      playButtonRef.current.focus();
    }
  }, []);

  // Show random facts every 4 seconds when playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentFactIndex((prevIndex) => {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * facts.length);
        } while (newIndex === prevIndex && facts.length > 1); // Avoid showing same fact twice
        return newIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, facts.length]);

  // Update ARIA live region when fact changes
  useEffect(() => {
    if (factRef.current && facts[currentFactIndex]) {
      // Announce the new fact to screen readers
      const announcement = facts[currentFactIndex];
      factRef.current.textContent = announcement;
    }
  }, [currentFactIndex, facts]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.div
      className="thinking-container"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springTransition}
    >
      {/* Apple Intelligence Style Animation */}
      <div
        className="apple-intelligence-animation"
        style={{
          width: "140px",
          height: "140px",
          margin: "0 auto 2rem",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Main gradient orb with glow */}
        <motion.div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 30%, #e0aaff, #9d4edd, #7c3aed)",
            boxShadow: `
              0 0 60px rgba(157, 78, 221, 0.6),
              0 0 100px rgba(224, 170, 255, 0.4),
              0 0 140px rgba(124, 58, 237, 0.3),
              inset 0 0 40px rgba(255, 255, 255, 0.1)
            `,
            position: "relative",
          }}
          animate={{
            scale: [1, 1.08, 1],
            boxShadow: [
              "0 0 60px rgba(157, 78, 221, 0.6), 0 0 100px rgba(224, 170, 255, 0.4), 0 0 140px rgba(124, 58, 237, 0.3)",
              "0 0 90px rgba(157, 78, 221, 0.8), 0 0 140px rgba(224, 170, 255, 0.6), 0 0 180px rgba(124, 58, 237, 0.5)",
              "0 0 60px rgba(157, 78, 221, 0.6), 0 0 100px rgba(224, 170, 255, 0.4), 0 0 140px rgba(124, 58, 237, 0.3)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden="true"
        >
          {/* Inner highlight */}
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "20%",
              width: "40%",
              height: "40%",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255, 255, 255, 0.4), transparent)",
              filter: "blur(8px)",
            }}
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h3
          className="thinking-text"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {t("thinkingTitle")}
        </motion.h3>
        <p className="thinking-subtext">{t("thinkingSubtext")}</p>

        {/* Play/Pause Button for Screen Readers */}
        <button
          ref={playButtonRef}
          onClick={togglePlayPause}
          className="play-pause-button"
          aria-label={isPlaying ? t("pauseFacts") : t("playFacts")}
          aria-pressed={isPlaying}
          style={{
            padding: "0.6rem 1.2rem",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "2px solid var(--accent-primary)",
            borderRadius: "8px",
            fontSize: "0.9rem",
            fontFamily: "Playfair Display, serif",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "1.5rem",
            marginBottom: "1.5rem",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 4px 12px var(--shadow)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "none";
          }}
        >
          {isPlaying ? "⏸️ " + t("pauseFacts") : "▶️ " + t("playFacts")}
        </button>

        {/* Rotating facts */}
        <div
          className="facts-container"
          role="region"
          aria-label={t("factContainer")}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFactIndex}
              className="fact-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              💫 {facts[currentFactIndex]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Hidden element for screen reader announcements */}
        <div
          ref={factRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          style={{
            position: "absolute",
            left: "-10000px",
            width: "1px",
            height: "1px",
            overflow: "hidden",
          }}
        >
          {facts[currentFactIndex]}
        </div>

        {/* AI Caution */}
        <p
          style={{
            marginTop: "2rem",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            fontStyle: "italic",
            textAlign: "center",
            lineHeight: "1.5",
          }}
        >
          {t("aiCaution")}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default ThinkingAnimation;
