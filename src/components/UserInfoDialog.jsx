import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import { User, Check, Book, BarChart2, X } from "lucide-react";
import googleDriveService from "../services/googleDriveService";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

function UserInfoDialog({
  isOpen,
  onClose,
  onViewSavedReadings,
  onSignOut,
  userInfo,
}) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
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

        // Arrow key navigation for screen readers
        const focusableArray = Array.from(focusableElements).filter(
          (el) => !el.disabled && el.offsetParent !== null
        );
        const currentIndex = focusableArray.indexOf(document.activeElement);

        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % focusableArray.length;
          focusableArray[nextIndex].focus();
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          const nextIndex =
            currentIndex - 1 < 0 ? focusableArray.length - 1 : currentIndex - 1;
          focusableArray[nextIndex].focus();
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

  const handleViewSavedReadings = () => {
    onViewSavedReadings();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="modal-center-wrapper">
            <motion.div
              ref={modalRef}
              className="user-info-dialog"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springTransition}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dialog-header">
                <h2><User className="icon-inline" size={24} /> {t("userInfo")}</h2>
                <button
                  className="close-button"
                  onClick={onClose}
                  aria-label={t("close")}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="dialog-content">
                <div className="user-profile">
                  <div className="user-avatar-large">
                    {userInfo?.picture ? (
                      <img
                        src={userInfo.picture}
                        alt={userInfo.name}
                        className="avatar-image"
                      />
                    ) : (
                      <span className="avatar-placeholder">
                        {userInfo?.name?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                  <div className="user-details">
                    <h3>{userInfo?.name || "User"}</h3>
                    <p>{userInfo?.email || ""}</p>
                  </div>
                  <div className="drive-status">
                    <Check className="status-indicator icon-inline" size={16} />
                    <span>{t("driveConnected")}</span>
                  </div>
                </div>

                <div className="dialog-actions-top">
                  <button
                    className="view-readings-button"
                    onClick={handleViewSavedReadings}
                  >
                    <Book className="google-icon" size={18} />
                    {t("viewSavedReadings")}
                  </button>
                </div>

                <div className="drive-info">
                  <h4>{t("yourDriveFiles")}</h4>
                  <div className="drive-caution">{t("driveCaution")}</div>
                  <div className="file-links">
                    <div className="file-link">
                      <BarChart2 className="link-icon" size={18} />
                      <div>
                        <strong>{t("spreadsheetCreated")}:</strong>
                        <a
                          href={googleDriveService.getSpreadsheetUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {googleDriveService.getDriveInfo().spreadsheetName}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default UserInfoDialog;
