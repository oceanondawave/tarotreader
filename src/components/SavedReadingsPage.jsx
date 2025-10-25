import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import googleDriveService from "../services/googleDriveService";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

function SavedReadingsPage({ onBack, onViewReading, onSheetNotFound }) {
  const { t } = useLanguage();
  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingReadingId, setDeletingReadingId] = useState(null); // Track which reading is being deleted

  // Helper function to check auth before any sheet operation
  const checkAuthBeforeOperation = async () => {
    try {
      if (googleDriveService.isAuthenticated) {
        await googleDriveService.refreshTokenIfNeeded();
      }

      if (!googleDriveService.isAuthenticated) {
        if (onSheetNotFound) {
          onSheetNotFound();
        }
        return false;
      }
      return true;
    } catch (error) {
      console.error("Auth check failed during operation:", error);
      if (onSheetNotFound) {
        onSheetNotFound();
      }
      return false;
    }
  };

  useEffect(() => {
    loadReadings().catch((err) => {
      if (err.message.includes("Sheet not found") && onSheetNotFound) {
        onSheetNotFound();
      }
    });
  }, []);

  const loadReadings = async () => {
    const isAuthenticated = await checkAuthBeforeOperation();
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const allReadings = await googleDriveService.getAllReadings();
      setReadings(allReadings);
    } catch (err) {
      console.error("Error loading readings:", err);
      setError(err.message);
      // If sheet was deleted, rethrow the error
      if (err.message.includes("Sheet not found")) {
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReading = async (reading) => {
    const isAuthenticated = await checkAuthBeforeOperation();
    if (!isAuthenticated) return;

    onViewReading(reading);
  };

  const handleDeleteReading = async (readingId) => {
    const isAuthenticated = await checkAuthBeforeOperation();
    if (!isAuthenticated) return;

    if (window.confirm(t("confirmDelete"))) {
      try {
        setDeletingReadingId(readingId); // Set loading state for this specific reading
        await googleDriveService.deleteReading(readingId);
        // Reload readings after deletion
        await loadReadings();
      } catch (err) {
        console.error("🗑️ Error deleting reading:", err);
        // If sheet was deleted, call the handler
        if (err.message.includes("Sheet not found") && onSheetNotFound) {
          onSheetNotFound();
          return;
        }
        alert(t("deleteFailed"));
      } finally {
        setDeletingReadingId(null); // Clear loading state
      }
    }
  };

  const handleCleanupMalformedRows = async () => {
    const isAuthenticated = await checkAuthBeforeOperation();
    if (!isAuthenticated) return;

    if (window.confirm(t("cleanupConfirm"))) {
      try {
        setIsLoading(true);
        const result = await googleDriveService.cleanupMalformedRows();
        alert(t("cleanupCompleted", { count: result.cleanedRows }));
        // Reload readings after cleanup
        await loadReadings();
      } catch (err) {
        console.error("🧹 Error during cleanup:", err);
        // If sheet was deleted, call the handler
        if (err.message.includes("Sheet not found") && onSheetNotFound) {
          onSheetNotFound();
          return;
        }
        alert(t("cleanupFailed") + ": " + err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <motion.div
      className="saved-readings-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
    >
      {/* Header */}
      <div className="page-header">
        <button
          className="back-button"
          onClick={onBack}
          aria-label={t("backToQuestion")}
        >
          ← {t("backToQuestion")}
        </button>
        <h1>{t("savedReadings")}</h1>
        <button
          className="cleanup-button"
          onClick={handleCleanupMalformedRows}
          disabled={deletingReadingId !== null} // Disable during deletion
          title={t("cleanupDescription")}
          aria-label={t("cleanupButton")}
        >
          🧹 {t("cleanupButton")}
        </button>
      </div>

      {/* Content */}
      <div className="page-content">
        {isLoading && (
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p>{t("loading")}</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{t("loadFailed")}</p>
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && readings.length === 0 && (
          <div className="no-results">
            <p>{t("noReadings")}</p>
          </div>
        )}

        {!isLoading && !error && readings.length > 0 && (
          <div className="readings-list">
            {readings.map((reading, index) => (
              <motion.div
                key={reading.id}
                className="reading-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.1,
                  ...springTransition,
                }}
              >
                <div className="reading-header">
                  <div className="reading-date">
                    <span className="date-icon">📅</span>
                    <span className="time">
                      {reading.date} - {reading.time}
                    </span>
                  </div>
                  <div className="reading-language">
                    {reading.language === "vi" ? "🇻🇳" : "🇺🇸"}{" "}
                    {reading.language === "vi" ? "Tiếng Việt" : "English"}
                  </div>
                </div>

                <div className="reading-question">
                  <span className="question-icon">❓</span>
                  <span>{reading.question}</span>
                </div>

                <div className="reading-cards">
                  <span className="cards-icon">🃏</span>
                  <span>
                    {reading.cards
                      .map((card) => card.name)
                      .filter((name) => name)
                      .join(", ")}
                  </span>
                </div>

                <div className="reading-preview">
                  <span className="preview-icon">📖</span>
                  <span>{reading.answer.substring(0, 100)}...</span>
                </div>

                <div className="reading-actions">
                  <button
                    className="view-reading-button"
                    onClick={() => handleViewReading(reading)}
                    disabled={deletingReadingId !== null} // Disable if any deletion is in progress
                    aria-label={`${t("viewReading")} - ${reading.question}`}
                    style={{
                      opacity: deletingReadingId !== null ? 0.5 : 1,
                      cursor:
                        deletingReadingId !== null ? "not-allowed" : "pointer",
                    }}
                  >
                    {t("viewReading")}
                  </button>
                  <button
                    className="delete-reading-button"
                    onClick={() => handleDeleteReading(reading.id)}
                    disabled={deletingReadingId !== null} // Disable if any deletion is in progress
                    aria-label={`${t("deleteReading")} - ${reading.question}`}
                    style={{
                      opacity: deletingReadingId !== null ? 0.5 : 1,
                      cursor:
                        deletingReadingId !== null ? "not-allowed" : "pointer",
                    }}
                  >
                    {t("deleteReading")}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default SavedReadingsPage;
