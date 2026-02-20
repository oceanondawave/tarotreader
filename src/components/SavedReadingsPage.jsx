import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Trash2, Search, X, Calendar, Globe, HelpCircle,
  Layers, BookOpen, Eye
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import googleDriveService from "../services/googleDriveService";

// Helper function to parse markdown for display
// Simplified for older Safari compatibility
const parseMarkdown = (text) => {
  if (!text) return text;

  // Check if browser supports lookbehind assertions
  let supportsLookbehind = false;
  try {
    new RegExp("(?<=test)");
    supportsLookbehind = true;
  } catch (e) {
    supportsLookbehind = false;
  }

  // For browsers without lookbehind support, use simpler parsing
  if (!supportsLookbehind) {
    // Simple bold replacement only (no JSX for compatibility)
    return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  // Original parsing for modern browsers
  try {
    const parts = [];

    // Find all markdown patterns
    const patterns = [
      { regex: /\*\*(.*?)\*\*/g, type: "bold" },
      { regex: /(?<!\*)\*([^*]+?)\*(?!\*)/g, type: "italic" },
      { regex: /~~(.*?)~~/g, type: "strikethrough" },
      { regex: /`(.*?)`/g, type: "code" },
    ];

    let allMatches = [];
    patterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        allMatches.push({
          index: match.index,
          length: match[0].length,
          text: match[1],
          type,
        });
      }
    });

    // Sort matches by index
    allMatches.sort((a, b) => a.index - b.index);

    // Build result
    let lastIndex = 0;
    for (let i = 0; i < allMatches.length; i++) {
      const match = allMatches[i];

      // Add text before this match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add the formatted content
      switch (match.type) {
        case "bold":
          parts.push(<strong key={parts.length}>{match.text}</strong>);
          break;
        case "italic":
          parts.push(<em key={parts.length}>{match.text}</em>);
          break;
        case "strikethrough":
          parts.push(
            <del key={parts.length} className="markdown-del">
              {match.text}
            </del>
          );
          break;
        case "code":
          parts.push(
            <code key={parts.length} className="markdown-code">
              {match.text}
            </code>
          );
          break;
      }

      lastIndex = match.index + match.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  } catch (e) {
    // Fallback to simple text if parsing fails
    return text;
  }
};

// Helper function to remove markdown from text
const removeMarkdown = (text) => {
  if (!text) return text;

  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
    .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, "$1") // Italic (not bold)
    .replace(/~~(.*?)~~/g, "$1") // Strikethrough
    .replace(/`(.*?)`/g, "$1") // Inline code
    .replace(/^#{1,6}\s+(.*)/gm, "$1") // Headers
    .replace(/^[-*]\s+/gm, "• ") // Bullet points to simple bullet
    .replace(/^\d+\.\s+/gm, "") // Remove numbered list markers
    .replace(/^>\s+(.*)$/gm, "$1") // Block quotes
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Links (keep text only)
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, "") // Images (remove entirely)
    .replace(/^---+$/gm, "") // Horizontal rules (remove)
    .replace(/\n{3,}/g, "\n\n") // Multiple line breaks to double
    .trim();
};

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

function SavedReadingsPage({ onBack, onViewReading, onSheetNotFound }) {
  const { t, language } = useLanguage();
  const [readings, setReadings] = useState([]);
  const [filteredReadings, setFilteredReadings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingReadingId, setDeletingReadingId] = useState(null); // Track which reading is being deleted

  // Helper function to check auth before any sheet operation
  const checkAuthBeforeOperation = async () => {
    try {
      if (googleDriveService.isAuthenticated) {
        try {
          await googleDriveService.refreshTokenIfNeeded();
        } catch (refreshErr) {
          console.warn("Token refresh note during operation:", refreshErr.message);
          // Don't fail the operation just because the proactive refresh hiccuped
        }
      }

      if (!googleDriveService.isAuthenticated) {
        // Only trigger sheet not found if it explicitly says so, don't use it as a generic auth failure
        return false;
      }
      return true;
    } catch (error) {
      console.error("Auth check failed during operation:", error);
      return false;
    }
  };

  useEffect(() => {
    loadReadings().catch((err) => {
      if (
        err.message &&
        err.message.includes("Sheet not found") &&
        onSheetNotFound
      ) {
        onSheetNotFound();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper function to remove Vietnamese diacritics for easier searching
  const removeVietnameseAccents = (str) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  // Filter readings based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If no search query, show all readings
      setFilteredReadings(readings);
    } else {
      // Normalize query (remove accents for Vietnamese)
      const normalizedQuery = removeVietnameseAccents(searchQuery);

      const filtered = readings.filter((reading) => {
        // Search in date
        if (reading.date?.toLowerCase().includes(searchQuery.toLowerCase()))
          return true;
        // Search in time
        if (reading.time?.toLowerCase().includes(searchQuery.toLowerCase()))
          return true;

        // Search in question (with accent removal for Vietnamese)
        if (
          removeVietnameseAccents(reading.question || "").includes(
            normalizedQuery
          )
        )
          return true;
        // Search in card names (with accent removal for Vietnamese)
        if (
          reading.cards?.some((card) =>
            removeVietnameseAccents(card.name || "").includes(normalizedQuery)
          )
        )
          return true;
        // Search in answer (with accent removal for Vietnamese)
        if (
          removeVietnameseAccents(reading.answer || "").includes(
            normalizedQuery
          )
        )
          return true;
        return false;
      });
      setFilteredReadings(filtered);
    }
  }, [searchQuery, readings]);

  const loadReadings = async () => {
    const isAuthenticated = await checkAuthBeforeOperation();
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const allReadings = await googleDriveService.getAllReadings();

      // Sort readings by date and time (newest first)
      const sortedReadings = allReadings.sort((a, b) => {
        // Parse dates and times to handle different formats consistently
        const parseDateTime = (dateStr, timeStr) => {
          try {
            // Try different date formats
            let date;

            // Handle YYYY-MM-DD format (new consistent format)
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              date = new Date(dateStr);
            }
            // Handle MM/DD/YYYY format
            else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
              const [month, day, year] = dateStr.split("/");
              date = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day)
              );
            }
            // Handle DD/MM/YYYY format
            else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
              const parts = dateStr.split("/");
              // Try to determine which format by checking the first number
              if (parseInt(parts[0]) > 12) {
                // DD/MM/YYYY
                const [day, month, year] = parts;
                date = new Date(
                  parseInt(year),
                  parseInt(month) - 1,
                  parseInt(day)
                );
              } else {
                // MM/DD/YYYY
                const [month, day, year] = parts;
                date = new Date(
                  parseInt(year),
                  parseInt(month) - 1,
                  parseInt(day)
                );
              }
            }
            // Fallback: try to parse as-is
            else {
              date = new Date(dateStr);
            }

            // Parse time
            let hours = 0,
              minutes = 0,
              seconds = 0;

            // Handle HH:MM:SS format (24-hour)
            if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
              [hours, minutes, seconds] = timeStr.split(":").map(Number);
            }
            // Handle HH:MM AM/PM format
            else if (timeStr.match(/^\d{1,2}:\d{2}\s*(AM|PM)$/i)) {
              const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
              hours = parseInt(match[1]);
              minutes = parseInt(match[2]);
              const isPM = match[3].toUpperCase() === "PM";
              if (isPM && hours !== 12) hours += 12;
              if (!isPM && hours === 12) hours = 0;
            }
            // Handle HH:MM:SS AM/PM format
            else if (timeStr.match(/^\d{1,2}:\d{2}:\d{2}\s*(AM|PM)$/i)) {
              const match = timeStr.match(
                /^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i
              );
              hours = parseInt(match[1]);
              minutes = parseInt(match[2]);
              seconds = parseInt(match[3]);
              const isPM = match[4].toUpperCase() === "PM";
              if (isPM && hours !== 12) hours += 12;
              if (!isPM && hours === 12) hours = 0;
            }

            date.setHours(hours, minutes, seconds);
            return date.getTime();
          } catch (e) {
            // Fallback to 0 if parsing fails
            return 0;
          }
        };

        const timeA = parseDateTime(a.date, a.time);
        const timeB = parseDateTime(b.date, b.time);

        // Sort in descending order (newest first)
        return timeB - timeA;
      });

      setReadings(sortedReadings);
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
      <div className="sticky-header-group">
        {/* Header */}
        <div className="page-header">
          <button
            className="back-button"
            onClick={onBack}
            aria-label={t("backToQuestion")}
          >
            <ArrowLeft size={20} /> <span className="button-text">{t("backToQuestion")}</span>
          </button>
          <h1>{t("savedReadings")}</h1>
          <button
            className="cleanup-button"
            onClick={handleCleanupMalformedRows}
            disabled={deletingReadingId !== null} // Disable during deletion
            title={t("cleanupDescription")}
            aria-label={t("cleanupButton")}
          >
            <Trash2 size={18} /> <span className="button-text">{t("cleanupButton")}</span>
          </button>
        </div>

        {/* Search Bar */}
        {readings.length > 0 && (
          <motion.div
            className="search-container"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...springTransition }}
          >
            <input
              type="text"
              className="search-input"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t("searchPlaceholder")}
            />
            {searchQuery && (
              <button
                className="clear-search-button"
                onClick={() => setSearchQuery("")}
                aria-label={t("clear")}
              >
                <X size={16} />
              </button>
            )}
          </motion.div>
        )}
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

        {!isLoading &&
          !error &&
          searchQuery &&
          filteredReadings.length === 0 && (
            <div className="no-results">
              <p>{t("noSearchResults")}</p>
            </div>
          )}

        {!isLoading &&
          !error &&
          readings.length > 0 &&
          filteredReadings.length > 0 && (
            <div className="readings-list">
              {filteredReadings.map((reading, index) => (
                <motion.div
                  key={reading.id}
                  className="reading-item"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <div className="reading-header">
                    <div className="reading-date">
                      <Calendar className="date-icon" size={16} />
                      <span className="time">
                        {reading.date} - {reading.time}
                      </span>
                    </div>
                    <div className="reading-language">
                      <Globe size={16} style={{ marginRight: "4px" }} />
                      {reading.language === "vi" ? "Tiếng Việt" : "English"}
                    </div>
                  </div>

                  <div className="reading-question">
                    <HelpCircle className="question-icon" size={18} />
                    <span>{reading.question}</span>
                  </div>

                  <div className="reading-cards">
                    <Layers className="cards-icon" size={18} />
                    <span>
                      {reading.cards
                        .map((card) => language === "vi" && card.name_vi ? `${card.name_vi} (${card.name})` : card.name)
                        .filter((name) => name)
                        .join(", ")}
                    </span>
                  </div>

                  <div className="reading-preview">
                    <BookOpen className="preview-icon" size={18} />
                    {(() => {
                      const preview = parseMarkdown(
                        reading.answer.substring(0, 100)
                      );
                      return typeof preview === "string" ? (
                        <span
                          dangerouslySetInnerHTML={{ __html: preview + "..." }}
                        />
                      ) : (
                        <span>{preview}...</span>
                      );
                    })()}
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
                          deletingReadingId !== null
                            ? "not-allowed"
                            : "pointer",
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
                          deletingReadingId !== null
                            ? "not-allowed"
                            : "pointer",
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
