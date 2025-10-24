import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { tarotCards } from "../data/tarotCards";
import { useLanguage } from "../contexts/LanguageContext";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  shuffling: {
    opacity: 1,
    scale: [1, 1.1, 0.9, 1.05, 1],
    rotate: [0, 5, -3, 2, 0],
    y: [0, -10, 5, -5, 0],
    transition: {
      duration: 0.4,
      ease: "easeInOut",
    },
  },
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

function CardSelection({
  selectedCards,
  onCardSelect,
  onBack,
  onSubmit,
  maxCards = 3,
}) {
  const { t } = useLanguage();
  const [shuffledCards, setShuffledCards] = useState([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [isInitializing, setIsInitializing] = useState(true);
  const [showQuickSelectModal, setShowQuickSelectModal] = useState(false);
  const [quickSelectInput, setQuickSelectInput] = useState("");
  const modalRef = useRef(null);

  // Focus trapping effect
  useEffect(() => {
    if (showQuickSelectModal && modalRef.current) {
      const modal = modalRef.current;
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleKeyDown = (e) => {
        // Prevent Tab navigation outside modal
        if (e.key === "Tab") {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }

        // Prevent Escape key from closing modal (optional)
        if (e.key === "Escape") {
          e.preventDefault();
        }
      };

      // Prevent focus from going to background elements
      const preventFocus = (e) => {
        if (!modal.contains(e.target)) {
          e.preventDefault();
          firstElement?.focus();
        }
      };

      // Focus first element when modal opens
      setTimeout(() => firstElement?.focus(), 100);

      // Add event listeners
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("focusin", preventFocus);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("focusin", preventFocus);
      };
    }
  }, [showQuickSelectModal]);

  useEffect(() => {
    // Initialize with simple shuffle animation on component mount
    const initializeCards = () => {
      // First shuffle
      const firstShuffle = shuffleArray(tarotCards);
      setShuffledCards(firstShuffle);

      setTimeout(() => {
        // Second shuffle
        const secondShuffle = shuffleArray(tarotCards);
        setShuffledCards(secondShuffle);

        setTimeout(() => {
          // Final shuffle
          const finalShuffle = shuffleArray(tarotCards);
          setShuffledCards(finalShuffle);

          setTimeout(() => {
            setIsInitializing(false);
          }, 200);
        }, 150);
      }, 150);
    };

    initializeCards();
  }, []);

  const handleCardClick = (card) => {
    const isSelected = selectedCards.find((c) => c.id === card.id);
    const isDisabled = !isSelected && selectedCards.length >= maxCards;

    // Don't allow any interaction if disabled
    if (isDisabled) {
      return;
    }

    // Toggle flip state
    const newFlippedCards = new Set(flippedCards);
    if (flippedCards.has(card.id)) {
      newFlippedCards.delete(card.id);
    } else {
      newFlippedCards.add(card.id);
    }
    setFlippedCards(newFlippedCards);

    // Handle selection
    if (isSelected) {
      // Deselect the card
      onCardSelect(selectedCards.filter((c) => c.id !== card.id));
    } else if (selectedCards.length < maxCards) {
      // Select the card only if under limit
      onCardSelect([...selectedCards, card]);
    } else {
      // Already at limit, don't select
      console.log("Already selected maximum cards:", maxCards);
    }
  };

  const handleQuickSelect = (position) => {
    const card = shuffledCards[position - 1]; // position is 1-based, array is 0-based
    if (card) {
      // Toggle selection (same as clicking the card)
      if (selectedCards.find((c) => c.id === card.id)) {
        // Remove from selection
        onCardSelect(selectedCards.filter((c) => c.id !== card.id));
        // Also flip it back
        const newFlippedCards = new Set(flippedCards);
        newFlippedCards.delete(card.id);
        setFlippedCards(newFlippedCards);
      } else if (selectedCards.length < maxCards) {
        // Add to selection
        onCardSelect([...selectedCards, card]);
        // Also flip it
        const newFlippedCards = new Set(flippedCards);
        newFlippedCards.add(card.id);
        setFlippedCards(newFlippedCards);
      }
    }
    setQuickSelectInput("");
    // Don't close the modal
  };

  const handleQuickSelectSubmit = () => {
    const number = parseInt(quickSelectInput);
    if (!isNaN(number) && number >= 1 && number <= shuffledCards.length) {
      handleQuickSelect(number);
    }
  };

  const handleQuickSelectCancel = () => {
    setQuickSelectInput("");
    setShowQuickSelectModal(false);
  };

  const handleShuffle = () => {
    setIsShuffling(true);
    onCardSelect([]); // Clear selection
    setFlippedCards(new Set()); // Clear flipped cards

    // Simple shuffle - just reorder the cards
    setShuffledCards(shuffleArray(tarotCards));

    // Brief loading state
    setTimeout(() => {
      setIsShuffling(false);
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

      <motion.div
        className="step-navigation"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...springTransition }}
        style={{ marginBottom: "2rem" }}
      >
        <motion.button
          className="back-button"
          onClick={handleShuffle}
          whileHover={{ scale: isShuffling ? 1 : 1.05 }}
          whileTap={{ scale: isShuffling ? 1 : 0.95 }}
          disabled={isShuffling}
          aria-label={isShuffling ? t("shuffling") : t("shuffleButton")}
          aria-disabled={isShuffling}
          style={{
            opacity: isShuffling ? 0.7 : 1,
            cursor: isShuffling ? "not-allowed" : "pointer",
          }}
        >
          {isShuffling ? `🔄 ${t("shuffling")}` : t("shuffleButton")}
        </motion.button>

        <motion.button
          className="back-button"
          onClick={() => setShowQuickSelectModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={t("quickSelectPlaceholder")}
        >
          🎯 {t("quickSelectPlaceholder")}
        </motion.button>
      </motion.div>

      <div className="cards-grid">
        {shuffledCards.map((card, index) => {
          const isSelected = selectedCards.find((c) => c.id === card.id);
          const isFlipped = flippedCards.has(card.id);
          const isDisabled = !isSelected && selectedCards.length >= maxCards;

          return (
            <motion.div
              key={card.id}
              className={`card ${isSelected ? "selected" : ""} ${
                isFlipped ? "flipped" : ""
              } ${isDisabled ? "disabled" : ""}`}
              onClick={() => handleCardClick(card)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(card);
                }
              }}
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              aria-label={`${t("cardLabelWithRow", {
                position: index + 1,
                row: Math.floor(index / 13) + 1,
                totalRows: Math.ceil(shuffledCards.length / 13),
                name: card.name,
                status: isSelected ? t("selected") : t("unselected"),
                disabled: isDisabled ? t("disabled") : "",
              })}`}
              aria-pressed={isSelected}
              aria-disabled={isDisabled}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate={isInitializing ? "shuffling" : "visible"}
              whileHover={{
                scale: 1.05,
                y: -8,
                transition: {
                  duration: 0.05,
                  ease: "linear",
                },
              }}
              whileTap={{ scale: 0.95 }}
              transition={{
                duration: 0.05,
                ease: "linear",
              }}
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              <motion.div
                className="card-inner"
                animate={{
                  rotateY: isFlipped ? 180 : 0,
                }}
                transition={{
                  duration: 0.6,
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
                style={{
                  transformStyle: "preserve-3d",
                  width: "100%",
                  height: "100%",
                  position: "relative",
                }}
              >
                {/* Card Back */}
                <div
                  className="card-back"
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backfaceVisibility: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #9d4edd 0%, #7b2cbf 100%)",
                    color: "white",
                    fontSize: "2rem",
                  }}
                >
                  <div className="card-back-symbol">✦</div>
                </div>

                {/* Card Front */}
                <div
                  className="card-front"
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    borderRadius: "12px",
                    background: "white",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.5rem",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                  }}
                >
                  <img
                    src={card.image}
                    alt={card.name}
                    style={{
                      width: "100%",
                      height: "70%",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "0.25rem",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <div
                    style={{
                      display: "none",
                      fontSize: "2rem",
                      color: "#9d4edd",
                    }}
                  >
                    🃏
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      color: "#333",
                      textAlign: "center",
                      lineHeight: "1.2",
                    }}
                  >
                    {card.name}
                  </div>
                </div>
              </motion.div>
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

      {/* Navigation buttons */}
      <motion.div
        className="step-navigation"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ...springTransition }}
      >
        <motion.button
          className="back-button"
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={t("backToQuestion")}
        >
          ← {t("backToQuestion")}
        </motion.button>

        <motion.button
          className="reveal-button"
          onClick={onSubmit}
          disabled={selectedCards.length !== maxCards}
          whileHover={{ scale: selectedCards.length === maxCards ? 1.05 : 1 }}
          whileTap={{ scale: selectedCards.length === maxCards ? 0.95 : 1 }}
          aria-label={t("revealReading")}
          aria-disabled={selectedCards.length !== maxCards}
        >
          {t("revealReading")}
        </motion.button>
      </motion.div>

      {/* Quick Select Modal */}
      {showQuickSelectModal && (
        <div
          className="modal-overlay"
          onClick={handleQuickSelectCancel}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
          }}
        >
          <div
            className="modal-center-wrapper"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              ref={modalRef}
              className="confirmation-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <h3>🎯 {t("quickSelectPlaceholder")}</h3>
              <p>
                {t("quickSelectDescription", { count: shuffledCards.length })}
              </p>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.5rem",
                }}
              >
                {t("quickSelectInstructions")}
              </p>

              <div style={{ marginBottom: "1.5rem" }}>
                <input
                  type="number"
                  min="1"
                  max={shuffledCards.length}
                  placeholder={t("inputPlaceholder")}
                  value={quickSelectInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setQuickSelectInput(value);
                  }}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleQuickSelectSubmit()
                  }
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "2px solid var(--accent-primary)",
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    fontSize: "1rem",
                    fontFamily: "Playfair Display, serif",
                    fontWeight: "600",
                    outline: "none",
                    marginBottom: "1rem",
                  }}
                />

                {/* Selected Cards Display */}
                {selectedCards.length > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ marginBottom: "0.5rem", fontWeight: "600" }}>
                      {t("selectedPositions", {
                        positions: selectedCards
                          .map((card) => {
                            const position =
                              shuffledCards.findIndex((c) => c.id === card.id) +
                              1;
                            return `${position}: ${card.name}`;
                          })
                          .join(", "),
                      })}
                    </p>
                  </div>
                )}

                {/* Dropdown to remove selected cards */}
                {selectedCards.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      htmlFor="card-remove-select"
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                      }}
                    >
                      {t("removeCardLabel")}
                    </label>
                    <select
                      id="card-remove-select"
                      tabIndex="0"
                      onChange={(e) => {
                        if (e.target.value) {
                          const cardId = parseInt(e.target.value);
                          const card = selectedCards.find(
                            (c) => c.id === cardId
                          );
                          if (card) {
                            // Remove from selection
                            onCardSelect(
                              selectedCards.filter((c) => c.id !== card.id)
                            );
                            // Also flip it back
                            const newFlippedCards = new Set(flippedCards);
                            newFlippedCards.delete(card.id);
                            setFlippedCards(newFlippedCards);
                          }
                          e.target.value = ""; // Reset dropdown
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        border: "2px solid var(--accent-primary)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        fontSize: "1rem",
                        fontFamily: "Playfair Display, serif",
                        fontWeight: "600",
                        outline: "none",
                        appearance: "none",
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23808080' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 0.7rem center",
                        backgroundSize: "1rem",
                        paddingRight: "2.5rem",
                      }}
                    >
                      <option value="">{t("selectCardToRemove")}</option>
                      {selectedCards.map((card) => {
                        const position =
                          shuffledCards.findIndex((c) => c.id === card.id) + 1;
                        return (
                          <option key={card.id} value={card.id}>
                            {t("positionLabel", { position, name: card.name })}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-buttons">
                <button
                  className="confirm-button"
                  onClick={handleQuickSelectSubmit}
                  disabled={
                    !quickSelectInput ||
                    quickSelectInput.trim() === "" ||
                    quickSelectInput === "" ||
                    isNaN(parseInt(quickSelectInput)) ||
                    parseInt(quickSelectInput) < 1 ||
                    parseInt(quickSelectInput) > shuffledCards.length
                  }
                  aria-label={t("selectButton")}
                  aria-disabled={
                    !quickSelectInput ||
                    quickSelectInput.trim() === "" ||
                    quickSelectInput === "" ||
                    isNaN(parseInt(quickSelectInput)) ||
                    parseInt(quickSelectInput) < 1 ||
                    parseInt(quickSelectInput) > shuffledCards.length
                  }
                  style={{
                    opacity:
                      !quickSelectInput ||
                      quickSelectInput.trim() === "" ||
                      quickSelectInput === "" ||
                      isNaN(parseInt(quickSelectInput)) ||
                      parseInt(quickSelectInput) < 1 ||
                      parseInt(quickSelectInput) > shuffledCards.length
                        ? 0.5
                        : 1,
                    cursor:
                      !quickSelectInput ||
                      quickSelectInput.trim() === "" ||
                      quickSelectInput === "" ||
                      isNaN(parseInt(quickSelectInput)) ||
                      parseInt(quickSelectInput) < 1 ||
                      parseInt(quickSelectInput) > shuffledCards.length
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {t("selectButton")}
                </button>
                <button
                  className="cancel-button"
                  onClick={() => setShowQuickSelectModal(false)}
                  aria-label={t("doneButton")}
                >
                  {t("doneButton")}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardSelection;
