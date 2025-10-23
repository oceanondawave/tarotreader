import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <motion.button
      className="language-switcher"
      onClick={toggleLanguage}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, ...springTransition }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="language-flag">{language === "vi" ? "🇻🇳" : "🇬🇧"}</span>
      <span className="language-text">{language === "vi" ? "VI" : "EN"}</span>
    </motion.button>
  );
}

export default LanguageSwitcher;
