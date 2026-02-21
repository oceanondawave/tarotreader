import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const springTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.4,
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: { duration: 0.2 },
  },
};

function QuestionModal({
  isOpen,
  question,
  selectedCards,
  onQuestionChange,
  onConfirm,
  onCancel,
}) {
  const { t, language } = useLanguage();
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = () => {
    if (question.trim()) {
      onConfirm();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onCancel}
        >
          <motion.div
            ref={modalRef}
            className="modal-content"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 id="question-modal-title" className="modal-title">{t("modalTitle")}</h2>
              <p className="modal-subtitle">{t("modalSubtitle")}</p>
            </motion.div>

            <motion.div
              className="modal-cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3>{t("selectedCardsTitle")}</h3>
              <div className="modal-cards-grid">
                {selectedCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    className="modal-card-reveal"
                    initial={{ opacity: 0, rotateY: -90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    transition={{
                      delay: 0.4 + index * 0.2,
                      ...springTransition,
                    }}
                  >
                    <div className="modal-card-image-container">
                      <img
                        src={card.image}
                        alt={language === "vi" && card.name_vi ? `${card.name_vi} (${card.name})` : card.name}
                        className="modal-card-image"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.target.style.display = "none";
                          e.target.parentElement.classList.add("image-error");
                        }}
                      />
                      <div className="modal-card-overlay">
                        <span className="modal-card-number">{index + 1}</span>
                      </div>
                    </div>
                    <div className="modal-card-name">{language === "vi" && card.name_vi ? `${card.name_vi} (${card.name})` : card.name}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="modal-question"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h3>{t("yourQuestion")}</h3>
              <textarea
                className="modal-question-input"
                value={question}
                onChange={(e) => onQuestionChange(e.target.value)}
                placeholder={t("questionPlaceholder")}
                autoFocus
                rows={4}
              />
            </motion.div>

            <motion.button
              className="modal-confirm-button"
              onClick={handleSubmit}
              disabled={!question.trim()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, ...springTransition }}
              whileHover={{
                scale: question.trim() ? 1.05 : 1,
                transition: { ...springTransition, stiffness: 400 },
              }}
              whileTap={{ scale: question.trim() ? 0.95 : 1 }}
            >
              {t("revealButton")}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default QuestionModal;
