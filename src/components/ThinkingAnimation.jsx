import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Sparkles, Play, Pause } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { tarotFacts } from "../data/tarotFacts";

const springTransition = {
  type: "tween",
  ease: "easeOut",
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
            background: "linear-gradient(135deg, #e0aaff, #9d4edd)",
            boxShadow: "0 0 40px rgba(157, 78, 221, 0.4)", // Reduced static shadow
            position: "relative",
            willChange: "transform", // Optimize rendering
          }}
          animate={{
            scale: [1, 1.05, 1],
            // Removed complex box-shadow animation
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden="true"
        >
          {/* Inner highlight - Static now */}
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "20%",
              width: "40%",
              height: "40%",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.3)",
              filter: "blur(5px)", // Static blur is okay
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.6rem 1.2rem",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "2px solid var(--accent-primary)",
            borderRadius: "8px",
            fontSize: "0.9rem",
            fontFamily: "Playfair Display, serif",
            fontWeight: "600",
            cursor: "pointer",
            margin: "1.5rem auto",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px var(--shadow)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "none";
          }}
        >
          {isPlaying ? (
            <>
              <Pause className="icon-inline" size={16} /> {t("pauseFacts")}
            </>
          ) : (
            <>
              <Play className="icon-inline" size={16} /> {t("playFacts")}
            </>
          )}
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
                type: "tween",
                ease: "easeOut",
                damping: 30,
              }}
            >
              <Sparkles className="icon-inline" size={18} /> {facts[currentFactIndex]}
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
