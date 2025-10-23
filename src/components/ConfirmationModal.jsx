import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

function ConfirmationModal({ isOpen, onConfirm, onCancel }) {
  const { t } = useLanguage();
  const modalRef = useRef(null);

  // Focus trapping effect
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const modal = modalRef.current;
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleKeyDown = (e) => {
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
      };

      const preventFocus = (e) => {
        if (!modal.contains(e.target)) {
          e.preventDefault();
          firstElement?.focus();
        }
      };

      setTimeout(() => firstElement?.focus(), 100);
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("focusin", preventFocus);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("focusin", preventFocus);
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <div className="modal-center-wrapper">
            <motion.div
              ref={modalRef}
              className="confirmation-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springTransition}
            >
              <h3>{t("confirmResetTitle")}</h3>
              <p>{t("confirmResetMessage")}</p>
              <div className="modal-buttons">
                <motion.button
                  className="cancel-button"
                  onClick={onCancel}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t("cancel")}
                </motion.button>
                <motion.button
                  className="confirm-button"
                  onClick={onConfirm}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t("confirm")}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ConfirmationModal;
