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
  const [showManualSelectModal, setShowManualSelectModal] = useState(false);
  const [quickSelectInput, setQuickSelectInput] = useState("");
  const modalRef = useRef(null);
  const quickSelectInputRef = useRef(null);
  const selectedCardsDisplayRef = useRef(null);

  // Initialize cards on mount
  useEffect(() => {
    const initializeCards = () => {
      const firstShuffle = shuffleArray(tarotCards);
      setShuffledCards(firstShuffle);

      setTimeout(() => {
        const secondShuffle = shuffleArray(tarotCards);
        setShuffledCards(secondShuffle);

        setTimeout(() => {
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

  // Sync flippedCards with selectedCards
  useEffect(() => {
    if (selectedCards.length === 0) {
      // Clear flipped cards when selection is cleared
      setFlippedCards(new Set());
    } else {
      // Only keep flipped state for currently selected cards
      const newFlippedCards = new Set();
      selectedCards.forEach((card) => {
        if (flippedCards.has(card.id)) {
          newFlippedCards.add(card.id);
        }
      });
      setFlippedCards(newFlippedCards);
    }
  }, [selectedCards]);

  // Arrow key navigation for screen readers
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle if a modal is open
      if (!showQuickSelectModal && !showManualSelectModal) return;

      // Don't interfere with native select element keyboard interactions
      if (document.activeElement.tagName === "SELECT") {
        // Always allow select element to handle its own keyboard events
        // Don't intercept Space, Enter, or any other keys
        return;
      }

      // Get all focusable elements in the modal
      const modalElement = modalRef.current;
      if (!modalElement) return;

      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const focusableArray = Array.from(focusableElements).filter(
        (el) => !el.disabled && el.offsetParent !== null
      );

      if (focusableArray.length === 0) return;

      const currentIndex = focusableArray.indexOf(document.activeElement);

      // Only handle arrow keys, nothing else
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        const nextIndex = (currentIndex + 1) % focusableArray.length;
        focusableArray[nextIndex].focus();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        const nextIndex =
          currentIndex - 1 < 0 ? focusableArray.length - 1 : currentIndex - 1;
        focusableArray[nextIndex].focus();
      }
    };

    if (showQuickSelectModal || showManualSelectModal) {
      document.addEventListener("keydown", handleKeyDown, true); // Use capture phase
      return () => document.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [showQuickSelectModal, showManualSelectModal]);

  // Focus trapping effect for modals
  useEffect(() => {
    if ((showQuickSelectModal || showManualSelectModal) && modalRef.current) {
      const modal = modalRef.current;
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleKeyDown = (e) => {
        // Don't interfere with native select element keyboard interactions
        if (document.activeElement.tagName === "SELECT") {
          return;
        }

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
        if (e.key === "Escape") {
          if (showQuickSelectModal) setShowQuickSelectModal(false);
          if (showManualSelectModal) setShowManualSelectModal(false);
        }
      };

      const preventFocus = (e) => {
        if (!modal.contains(e.target)) {
          e.preventDefault();
          firstElement?.focus();
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("focusin", preventFocus);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("focusin", preventFocus);
      };
    }
  }, [showQuickSelectModal, showManualSelectModal]);

  const handleCardClick = (card) => {
    const isSelected = selectedCards.find((c) => c.id === card.id);
    const isDisabled = !isSelected && selectedCards.length >= maxCards;

    if (isDisabled) {
      return;
    }

    const newFlippedCards = new Set(flippedCards);
    if (flippedCards.has(card.id)) {
      newFlippedCards.delete(card.id);
    } else {
      newFlippedCards.add(card.id);
    }
    setFlippedCards(newFlippedCards);

    if (isSelected) {
      onCardSelect(selectedCards.filter((c) => c.id !== card.id));
    } else if (selectedCards.length < maxCards) {
      onCardSelect([...selectedCards, card]);
    }
  };

  const handleQuickSelect = (number) => {
    const position = parseInt(number);
    if (position < 1 || position > shuffledCards.length) {
      return;
    }

    const card = shuffledCards[position - 1];
    const isSelected = selectedCards.find((c) => c.id === card.id);

    // Update flipped cards set
    const newFlippedCards = new Set(flippedCards);

    if (isSelected) {
      // Deselect: remove from selection and flip back
      onCardSelect(selectedCards.filter((c) => c.id !== card.id));
      newFlippedCards.delete(card.id);
    } else if (selectedCards.length < maxCards) {
      // Select: add to selection and flip
      onCardSelect([...selectedCards, card]);
      newFlippedCards.add(card.id);
    }

    setFlippedCards(newFlippedCards);
    setQuickSelectInput("");
  };

  const handleQuickSelectSubmit = () => {
    if (!quickSelectInput) return;
    const number = parseInt(quickSelectInput);
    if (isNaN(number) || number < 1 || number > shuffledCards.length) {
      return;
    }
    handleQuickSelect(number);
    // Clear input and keep focus on it
    setQuickSelectInput("");
    // Use setTimeout to ensure the input ref is updated
    setTimeout(() => {
      if (quickSelectInputRef.current) {
        quickSelectInputRef.current.focus();
      }
    }, 0);
  };

  const handleShuffle = () => {
    setIsShuffling(true);
    onCardSelect([]);
    setFlippedCards(new Set());
    setShuffledCards(shuffleArray(tarotCards));

    setTimeout(() => {
      setIsShuffling(false);
    }, 300);
  };

  const handleManualDone = () => {
    // Close the modal
    setShowManualSelectModal(false);
    // Focus on the selected cards display element in the menu screen
    setTimeout(() => {
      if (selectedCardsDisplayRef.current) {
        selectedCardsDisplayRef.current.focus();
      }
    }, 100);
  };

  const handleQuickSelectDone = () => {
    // Close the modal
    setShowQuickSelectModal(false);
    // Focus on the selected cards display element in the menu screen
    setTimeout(() => {
      if (selectedCardsDisplayRef.current) {
        selectedCardsDisplayRef.current.focus();
      }
    }, 100);
  };

  // Show menu screen if no modal is open
  if (!showQuickSelectModal && !showManualSelectModal) {
    return (
      <div className="card-selection">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
        >
          {t("chooseCards", { count: maxCards })}
        </motion.h2>

        <motion.div
          className="selection-menu"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...springTransition }}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            maxWidth: "500px",
            margin: "2rem auto",
          }}
        >
          <motion.button
            className="selection-button"
            onClick={() => setShowManualSelectModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: "1.5rem 2rem",
              background: "linear-gradient(135deg, #9d4edd 0%, #7b2cbf 100%)",
              color: "white",
              border: "2px solid var(--accent-primary)",
              borderRadius: "15px",
              fontSize: "1.2rem",
              fontWeight: "600",
              fontFamily: "Playfair Display, serif",
              boxShadow: "0 4px 20px var(--shadow)",
              cursor: "pointer",
            }}
          >
            🃏 {t("manualSelection")}
          </motion.button>

          <motion.button
            className="selection-button"
            onClick={() => setShowQuickSelectModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: "1.5rem 2rem",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "2px solid var(--accent-primary)",
              borderRadius: "15px",
              fontSize: "1.2rem",
              fontWeight: "600",
              fontFamily: "Playfair Display, serif",
              boxShadow: "0 4px 20px var(--shadow)",
              cursor: "pointer",
            }}
          >
            🎯 {t("quickSelection")}
          </motion.button>

          {selectedCards.length > 0 && (
            <motion.div
              ref={selectedCardsDisplayRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              tabIndex={0}
              role="status"
              aria-live="polite"
              aria-label={t("cardsSelected", {
                selected: selectedCards.length,
                total: maxCards,
              })}
              style={{
                background: "var(--bg-subtle)",
                padding: "1rem",
                borderRadius: "10px",
                textAlign: "center",
              }}
            >
              <p>
                {t("cardsSelected", {
                  selected: selectedCards.length,
                  total: maxCards,
                })}
              </p>
            </motion.div>
          )}

          <motion.div
            className="menu-navigation"
            style={{
              display: "flex",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            <motion.button
              className="back-button"
              onClick={onBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← {t("backToQuestion")}
            </motion.button>

            <motion.button
              className="reveal-button"
              onClick={onSubmit}
              disabled={selectedCards.length !== maxCards}
              whileHover={{
                scale: selectedCards.length === maxCards ? 1.05 : 1,
              }}
              whileTap={{ scale: selectedCards.length === maxCards ? 0.95 : 1 }}
            >
              {t("revealReading")}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Quick Select Modal
  if (showQuickSelectModal) {
    return (
      <div
        className="modal-overlay"
        onClick={() => setShowQuickSelectModal(false)}
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

            <motion.button
              onClick={handleShuffle}
              disabled={isShuffling}
              whileHover={{ scale: isShuffling ? 1 : 1.05 }}
              whileTap={{ scale: isShuffling ? 1 : 0.95 }}
              style={{
                marginTop: "1rem",
                marginBottom: "1.5rem",
                padding: "0.75rem 1.5rem",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "2px solid var(--accent-primary)",
                borderRadius: "12px",
                fontSize: "1rem",
                fontFamily: "Playfair Display, serif",
                fontWeight: "600",
                cursor: isShuffling ? "not-allowed" : "pointer",
                opacity: isShuffling ? 0.7 : 1,
              }}
              aria-label={isShuffling ? t("shuffling") : t("shuffleButton")}
            >
              {isShuffling ? `🔄 ${t("shuffling")}` : t("shuffleButton")}
            </motion.button>

            <div style={{ marginBottom: "1.5rem" }}>
              <input
                ref={quickSelectInputRef}
                type="number"
                min="1"
                max={shuffledCards.length}
                placeholder={t("inputPlaceholder")}
                value={quickSelectInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  setQuickSelectInput(value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleQuickSelectSubmit();
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
                    aria-label={t("removeCardLabel")}
                    onChange={(e) => {
                      if (e.target.value) {
                        const cardId = parseInt(e.target.value);
                        const card = selectedCards.find((c) => c.id === cardId);
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
                onClick={handleQuickSelectDone}
                aria-label={t("doneButton")}
              >
                {t("doneButton")}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Manual Selection Modal
  if (showManualSelectModal) {
    return (
      <div
        className="modal-overlay"
        onClick={() => setShowManualSelectModal(false)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
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
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ flexShrink: 0, marginBottom: "1rem" }}>
              <h3>🃏 {t("manualSelection")}</h3>
              <p>
                {t("manualSelectionDescription", {
                  count: maxCards,
                })}
              </p>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.5rem",
                }}
              >
                {t("manualSelectionInstructions")}
              </p>
              <motion.button
                onClick={handleShuffle}
                disabled={isShuffling}
                whileHover={{ scale: isShuffling ? 1 : 1.05 }}
                whileTap={{ scale: isShuffling ? 1 : 0.95 }}
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1.5rem",
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "2px solid var(--accent-primary)",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontFamily: "Playfair Display, serif",
                  fontWeight: "600",
                  cursor: isShuffling ? "not-allowed" : "pointer",
                  opacity: isShuffling ? 0.7 : 1,
                }}
                aria-label={isShuffling ? t("shuffling") : t("shuffleButton")}
              >
                {isShuffling ? `🔄 ${t("shuffling")}` : t("shuffleButton")}
              </motion.button>
            </div>

            <div
              style={{
                overflowY: "auto",
                flex: 1,
                marginBottom: "1rem",
                paddingRight: "0.5rem",
                padding: "1rem",
              }}
            >
              <div
                className="cards-grid"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                  gap: "1rem",
                  maxWidth: "100%",
                  padding: "0.75rem",
                }}
              >
                {shuffledCards.map((card, index) => {
                  const isSelected = selectedCards.find(
                    (c) => c.id === card.id
                  );
                  const isFlipped = flippedCards.has(card.id);
                  const isDisabled =
                    !isSelected && selectedCards.length >= maxCards;

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
                            padding: "0.4rem",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                          }}
                        >
                          <img
                            src={card.image}
                            alt={card.name}
                            style={{
                              width: "100%",
                              height: "72%",
                              objectFit: "cover",
                              borderRadius: "6px",
                              marginBottom: "0.15rem",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "block";
                            }}
                          />
                          <div
                            style={{
                              display: "none",
                              fontSize: "1.5rem",
                              color: "#9d4edd",
                            }}
                          >
                            🃏
                          </div>
                          <div
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: "600",
                              color: "#333",
                              textAlign: "center",
                              lineHeight: "1.2",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              maxHeight: "28%",
                              padding: "0 0.1rem",
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
            </div>

            <div className="modal-buttons" style={{ flexShrink: 0 }}>
              <button
                className="cancel-button"
                onClick={handleManualDone}
                aria-label={t("doneButton")}
              >
                {t("doneButton")}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return null; // Should not be reached
}

export default CardSelection;
