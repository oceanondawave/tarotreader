import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { tarotCards } from "../data/tarotCards";
import { useLanguage } from "../contexts/LanguageContext";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.02,
      ...springTransition,
    },
  }),
};

// Shuffle function
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function CardSelection({ selectedCards, onCardSelect, maxCards = 3 }) {
  const { t } = useLanguage();
  const [shuffledCards, setShuffledCards] = useState([]);
  const [isShuffling, setIsShuffling] = useState(false);

  useEffect(() => {
    // Shuffle cards on component mount
    setShuffledCards(shuffleArray(tarotCards));
  }, []);

  const handleCardClick = (card) => {
    if (selectedCards.find((c) => c.id === card.id)) {
      onCardSelect(selectedCards.filter((c) => c.id !== card.id));
    } else if (selectedCards.length < maxCards) {
      onCardSelect([...selectedCards, card]);
    }
  };

  const handleShuffle = () => {
    setIsShuffling(true);
    onCardSelect([]); // Clear selection

    // Animate shuffle
    setTimeout(() => {
      setShuffledCards(shuffleArray(tarotCards));
      setTimeout(() => {
        setIsShuffling(false);
      }, 100);
    }, 300);
  };

  return (
    <div className="card-selection">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
      >
        {t("chooseCards", { count: maxCards })}
      </motion.h2>
      <motion.p
        className="instruction-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          textAlign: "center",
          color: "var(--text-secondary)",
          marginBottom: "2rem",
          fontSize: "1.1rem",
        }}
      >
        {t("instruction")}
      </motion.p>

      <motion.button
        className="shuffle-button"
        onClick={handleShuffle}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, ...springTransition }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isShuffling}
      >
        {t("shuffleButton")}
      </motion.button>

      <div className="cards-grid">
        {shuffledCards.map((card, index) => {
          const isSelected = selectedCards.find((c) => c.id === card.id);

          return (
            <motion.div
              key={card.id}
              className={`card ${isSelected ? "selected" : ""}`}
              onClick={() => handleCardClick(card)}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate={isShuffling ? "hidden" : "visible"}
              whileHover={{
                scale: 1.08,
                y: -12,
                transition: { ...springTransition, stiffness: 400 },
              }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Show card back instead of name */}
              <div className="card-back-symbol">✦</div>
            </motion.div>
          );
        })}
      </div>

      {selectedCards.length > 0 && (
        <motion.div
          className="selected-cards"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springTransition}
        >
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {t("cardsSelected", {
              selected: selectedCards.length,
              total: maxCards,
            })}
          </motion.h3>
        </motion.div>
      )}
    </div>
  );
}

export default CardSelection;
