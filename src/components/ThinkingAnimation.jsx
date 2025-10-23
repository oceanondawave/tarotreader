import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
};

function ThinkingAnimation() {
  const { t } = useLanguage();

  return (
    <motion.div
      className="thinking-container"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springTransition}
    >
      <div className="thinking-animation">
        <motion.div
          className="orb"
          animate={{
            scale: [1, 1.15, 1],
            boxShadow: [
              "0 0 60px rgba(157, 78, 221, 0.3), 0 0 100px rgba(157, 78, 221, 0.2)",
              "0 0 90px rgba(157, 78, 221, 0.6), 0 0 140px rgba(157, 78, 221, 0.4)",
              "0 0 60px rgba(157, 78, 221, 0.3), 0 0 100px rgba(157, 78, 221, 0.2)",
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
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
      </motion.div>

      {/* Floating particles with enhanced animation */}
      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            width: `${4 + Math.random() * 2}px`,
            height: `${4 + Math.random() * 2}px`,
            background: "var(--accent-glow)",
            borderRadius: "50%",
            left: "50%",
            top: "50%",
          }}
          animate={{
            x: [
              0,
              Math.cos((i * 22.5 * Math.PI) / 180) * (120 + Math.random() * 40),
            ],
            y: [
              0,
              Math.sin((i * 22.5 * Math.PI) / 180) * (120 + Math.random() * 40),
            ],
            opacity: [0, 0.8, 0.8, 0],
            scale: [0, 1.2, 1, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.08,
            ease: [0.34, 1.56, 0.64, 1],
          }}
        />
      ))}
    </motion.div>
  );
}

export default ThinkingAnimation;
