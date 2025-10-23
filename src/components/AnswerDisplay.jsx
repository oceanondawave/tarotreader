import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

function AnswerDisplay({ cards, answer, question, onNewReading }) {
  const { t } = useLanguage();

  // Simple markdown parser for bold and italic
  const parseMarkdown = (text) => {
    return text.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      } else if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <motion.div
      className="answer-section"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...springTransition, delay: 0.1 }}
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.2 }}
      >
        {t("answerTitle")}
      </motion.h2>

      {/* Display the question */}
      <motion.div
        className="result-question"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...springTransition }}
      >
        <h3>{t("yourQuestion")}</h3>
        <p>"{question}"</p>
      </motion.div>

      {/* Display cards with images */}
      <motion.div
        className="result-cards"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3>{t("selectedCardsTitle")}</h3>
        <div className="result-cards-grid">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className="result-card"
              initial={{ opacity: 0, y: 30, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                delay: 0.5 + index * 0.15,
                ...springTransition,
                stiffness: 250,
              }}
              whileHover={{
                scale: 1.05,
                transition: { ...springTransition, stiffness: 400 },
              }}
            >
              <div className="result-card-image-container">
                <img
                  src={card.image}
                  alt={card.name}
                  className="result-card-image"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.classList.add("image-error");
                  }}
                />
              </div>
              <div className="result-card-name">{card.name}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, ...springTransition }}
      >
        <div className="answer-text">
          {answer.split("\n").map((paragraph, i) => (
            <p key={i} style={{ marginBottom: "1rem" }}>
              {parseMarkdown(paragraph)}
            </p>
          ))}
        </div>
      </motion.div>

      <motion.button
        className="new-reading-button"
        onClick={onNewReading}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, ...springTransition }}
        whileHover={{
          scale: 1.05,
          transition: { ...springTransition, stiffness: 400 },
        }}
        whileTap={{ scale: 0.95 }}
      >
        {t("newReadingButton")}
      </motion.button>
    </motion.div>
  );
}

export default AnswerDisplay;
