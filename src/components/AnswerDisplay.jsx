import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import googleDriveService from "../services/googleDriveService";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

function AnswerDisplay({
  cards,
  answer,
  question,
  onNewReading,
  isGoogleSignedIn,
  onReadingSaved,
  isLoadedReading = false, // New prop to prevent auto-save for loaded readings
  savedReadingDate = "",
  savedReadingTime = "",
  onBackToSavedReadings,
}) {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const answerSectionRef = useRef(null);
  const hasAutoSaved = useRef(false);

  // Auto-save to Google Drive when component mounts and user is signed in
  // Skip auto-save if this is a loaded reading to prevent duplicates
  useEffect(() => {
    if (
      isGoogleSignedIn &&
      answer &&
      cards.length > 0 &&
      !hasAutoSaved.current &&
      !isLoadedReading // Don't auto-save loaded readings
    ) {
      handleAutoSave();
      hasAutoSaved.current = true;
    }
  }, [isGoogleSignedIn, answer, cards.length, isLoadedReading]);

  // Reset auto-save flag when component unmounts or when starting a new reading
  useEffect(() => {
    return () => {
      hasAutoSaved.current = false;
    };
  }, []);

  const handleAutoSave = async () => {
    try {
      setSaveError(null);
      const readingData = {
        question: question || "",
        cards: cards,
        answer: answer,
        language: language,
      };

      await googleDriveService.saveReading(readingData);
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 3000);

      // Notify parent that a reading was saved
      if (onReadingSaved) {
        onReadingSaved();
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      setSaveError(error.message || t("saveFailed"));
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

  const handleCopyResult = async () => {
    try {
      // Remove markdown from the answer before copying
      const plainText = removeMarkdown(answer);
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleSaveScreenshot = () => {
    try {
      if (!answerSectionRef.current) return;

      // Create a new window for printing
      const printWindow = window.open("", "_blank");

      // Get the computed styles from the original element to preserve theme
      const computedStyle = getComputedStyle(answerSectionRef.current);
      const answerBgColor = computedStyle.backgroundColor;
      const textColor = computedStyle.color;
      const fontFamily = computedStyle.fontFamily;

      // Try to get the actual page background (check html element or use answer-section background as fallback)
      let pageBgColor = getComputedStyle(
        document.documentElement
      ).backgroundColor;
      // If html is also transparent/transparent, use the answer section background
      if (
        !pageBgColor ||
        pageBgColor === "rgba(0, 0, 0, 0)" ||
        pageBgColor === "transparent"
      ) {
        pageBgColor = answerBgColor;
      }

      // Get the HTML content
      let content = answerSectionRef.current.innerHTML;

      // Remove Framer Motion attributes and inline styles
      content = content
        // Remove all data-framer-* attributes
        .replace(/data-framer-[^=]*="[^"]*"/g, "")
        // Remove initial, animate, transition style attributes
        .replace(/initial="[^"]*"/g, "")
        .replace(/animate="[^"]*"/g, "")
        .replace(/transition="[^"]*"/g, "")
        // Remove inline styles that might have motion values
        .replace(/style="[^"]*transform[^"]*"/g, "")
        .replace(/style="[^"]*opacity[^"]*"/g, "")
        // Clean up any remaining empty style attributes
        .replace(/style=""/g, "")
        .replace(/style=''/g, "");

      // Convert relative image paths to absolute URLs
      content = content.replace(
        /<img([^>]*?)src="([^"]*?)"([^>]*?)>/g,
        (match, before, src, after) => {
          // If it's already an absolute URL (http/https), keep it
          if (src.startsWith("http://") || src.startsWith("https://")) {
            return match;
          }
          // If it's a relative path, make it absolute
          const absoluteSrc = new URL(src, window.location.href).href;
          return `<img${before}src="${absoluteSrc}"${after}>`;
        }
      );

      // Get computed styles
      const styles = Array.from(document.styleSheets)
        .map((styleSheet) => {
          try {
            return Array.from(styleSheet.cssRules)
              .map((rule) => rule.cssText)
              .join("\n");
          } catch (e) {
            // Cross-origin stylesheets will throw error, skip them
            return "";
          }
        })
        .join("\n");

      // Create print-friendly HTML
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Tarot Reading - ${new Date()
              .toISOString()
              .slice(0, 10)}</title>
            <style>
              ${styles}
              * {
                box-sizing: border-box;
              }
              body {
                padding: 20px;
                margin: 0;
                background-color: ${pageBgColor};
                color: ${textColor};
                font-family: ${fontFamily};
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .answer-section {
                width: 100%;
                max-width: 100%;
                background-color: ${answerBgColor};
                color: ${textColor};
              }
              .result-cards {
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
              }
              .result-card {
                flex: 0 0 auto;
              }
              @media print {
                @page {
                  margin: 1.5cm;
                  size: A4;
                }
                body { 
                  margin: 0;
                  padding: 0;
                  display: block !important;
                }
                * {
                  float: none !important;
                  position: static !important;
                }
                .action-buttons, .new-reading-button, .auto-save-status { 
                  display: none !important; 
                }
                h2 {
                  margin-top: 0;
                  page-break-after: avoid;
                  color: var(--accent-glow, #d4a5ff) !important;
                  font-family: "Playfair Display", serif !important;
                }
                h3 {
                  page-break-after: avoid;
                  margin-top: 1em;
                  color: var(--accent-glow, #d4a5ff) !important;
                  font-family: "Playfair Display", serif !important;
                }
                .saved-reading-info {
                  page-break-after: avoid;
                }
                .result-question {
                  page-break-inside: avoid;
                  margin-bottom: 1em;
                }
                .result-cards {
                  page-break-inside: avoid;
                  margin: 1em 0;
                }
                .result-cards-grid {
                  display: grid !important;
                  grid-template-columns: repeat(3, 1fr) !important;
                  gap: 1.5rem !important;
                  max-width: 800px !important;
                  margin: 0 auto !important;
                  page-break-inside: avoid;
                }
                .result-card {
                  display: flex !important;
                  flex-direction: column !important;
                  align-items: center !important;
                  gap: 1rem !important;
                  padding: 1rem !important;
                  border: 2px solid var(--border-color) !important;
                  border-radius: 12px !important;
                  background: var(--bg-card) !important;
                  box-shadow: none !important;
                  page-break-inside: avoid;
                  max-width: none !important;
                }
                .result-card:hover {
                  box-shadow: none !important;
                }
                .result-card-image-container {
                  width: 100% !important;
                  aspect-ratio: 2 / 3 !important;
                  border-radius: 8px !important;
                  overflow: hidden !important;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  position: relative !important;
                }
                .result-card-image {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }
                .result-card-name {
                  font-family: "Playfair Display", serif !important;
                  font-size: 1rem !important;
                  color: var(--accent-glow) !important;
                  text-align: center !important;
                  font-weight: 600 !important;
                }
                .answer-text {
                  margin-top: 1em;
                }
                .answer-text p {
                  margin: 0.5em 0;
                  orphans: 2;
                  widows: 2;
                }
                img {
                  max-width: 100% !important;
                  height: auto !important;
                  display: block;
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);

      printWindow.document.close();

      // Wait for all resources to load
      const waitForImages = () => {
        const images = printWindow.document.querySelectorAll("img");
        let loadedCount = 0;

        if (images.length === 0) {
          // No images, print immediately
          setTimeout(() => {
            printWindow.print();
          }, 300);
          return;
        }

        images.forEach((img) => {
          if (img.complete) {
            loadedCount++;
            if (loadedCount === images.length) {
              setTimeout(() => {
                printWindow.print();
              }, 300);
            }
          } else {
            img.onload = () => {
              loadedCount++;
              if (loadedCount === images.length) {
                setTimeout(() => {
                  printWindow.print();
                }, 300);
              }
            };
            img.onerror = () => {
              // If image fails to load, count it anyway
              loadedCount++;
              if (loadedCount === images.length) {
                setTimeout(() => {
                  printWindow.print();
                }, 300);
              }
            };
          }
        });
      };

      // Wait for window to be ready
      printWindow.onload = () => {
        setTimeout(waitForImages, 200);
      };

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save PDF: ", err);
      alert(
        "Failed to generate PDF. Please try using your browser's print dialog."
      );
    }
  };

  // Enhanced markdown parser for bold, italic, headers, lists, and more
  const parseMarkdown = (text) => {
    if (!text) return text;

    // Split by lines to handle different elements
    const lines = text.split("\n");
    const result = [];
    let listItems = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for bullet point (- or *)
      if (/^\s*[-*]\s+/.test(line)) {
        if (!inList) {
          inList = true;
        }
        const content = line.replace(/^\s*[-*]\s+/, "");
        listItems.push(parseInlineMarkdown(content));
      }
      // Check for numbered list
      else if (/^\s*\d+\.\s+/.test(line)) {
        if (!inList) {
          inList = true;
        }
        const content = line.replace(/^\s*\d+\.\s+/, "");
        listItems.push(parseInlineMarkdown(content));
      }
      // Empty line - close any open list
      else if (line.trim() === "") {
        if (inList && listItems.length > 0) {
          result.push(
            <ul key={`list-${result.length}`} className="markdown-list">
              {listItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        if (result.length > 0 || i < lines.length - 1) {
          result.push(<br key={`br-${i}`} />);
        }
      }
      // Regular line or header
      else {
        // Close any open list
        if (inList && listItems.length > 0) {
          result.push(
            <ul key={`list-${result.length}`} className="markdown-list">
              {listItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }

        // Check for horizontal rule
        if (/^---+$/.test(line.trim())) {
          result.push(<hr key={i} className="markdown-hr" />);
        }
        // Check for block quote
        else if (/^>\s+/.test(line)) {
          const content = line.replace(/^>\s+/, "");
          result.push(
            <blockquote key={i} className="markdown-blockquote">
              {parseInlineMarkdown(content)}
            </blockquote>
          );
        }
        // Check for headers
        else if (line.startsWith("###")) {
          result.push(
            <h3 key={i} className="markdown-h3">
              {parseInlineMarkdown(line.substring(3).trim())}
            </h3>
          );
        } else if (line.startsWith("##")) {
          result.push(
            <h2 key={i} className="markdown-h2">
              {parseInlineMarkdown(line.substring(2).trim())}
            </h2>
          );
        } else if (line.startsWith("#")) {
          result.push(
            <h1 key={i} className="markdown-h1">
              {parseInlineMarkdown(line.substring(1).trim())}
            </h1>
          );
        } else {
          result.push(<span key={i}>{parseInlineMarkdown(line.trim())}</span>);
        }

        // Add line break if not last line and next line is not empty
        if (i < lines.length - 1 && lines[i + 1].trim() !== "") {
          result.push(<br key={`br-after-${i}`} />);
        }
      }
    }

    // Close any remaining list
    if (inList && listItems.length > 0) {
      result.push(
        <ul key={`list-${result.length}`} className="markdown-list">
          {listItems.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
    }

    return result.length > 0 ? result : text;
  };

  // Parse inline markdown (bold, italic, etc.)
  const parseInlineMarkdown = (text) => {
    if (!text) return text;

    // Check if browser supports lookbehind assertions (for older Safari compatibility)
    let supportsLookbehind = false;
    try {
      new RegExp("(?<=test)");
      supportsLookbehind = true;
    } catch (e) {
      supportsLookbehind = false;
    }

    // First pass: handle links and images (these are more complex)
    text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, linkText, url) => {
      return `___LINK_START___${linkText}___LINK_URL___${url}___LINK_END___`;
    });

    text = text.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, (match, alt, src) => {
      return `___IMAGE_START___${
        alt || ""
      }___IMAGE_URL___${src}___IMAGE_END___`;
    });

    // Process the text through multiple passes to handle nested markdown
    const parts = [];
    let currentIndex = 0;

    // Find all markdown patterns (including placeholders for links/images)
    // Use different patterns based on browser support
    const patterns = supportsLookbehind
      ? [
          {
            regex: /___LINK_START___(.*?)___LINK_URL___(.*?)___LINK_END___/g,
            type: "link",
          },
          {
            regex: /___IMAGE_START___(.*?)___IMAGE_URL___(.*?)___IMAGE_END___/g,
            type: "image",
          },
          { regex: /\*\*(.*?)\*\*/g, type: "bold" },
          { regex: /(?<!\*)\*([^*]+?)\*(?!\*)/g, type: "italic" },
          { regex: /~~(.*?)~~/g, type: "strikethrough" },
          { regex: /`(.*?)`/g, type: "code" },
        ]
      : [
          {
            regex: /___LINK_START___(.*?)___LINK_URL___(.*?)___LINK_END___/g,
            type: "link",
          },
          {
            regex: /___IMAGE_START___(.*?)___IMAGE_URL___(.*?)___IMAGE_END___/g,
            type: "image",
          },
          { regex: /\*\*(.*?)\*\*/g, type: "bold" },
          // For older browsers, use a simpler italic pattern that avoids lookbehind
          { regex: /\b\*([^*]+?)\*\b/g, type: "italic" },
          { regex: /~~(.*?)~~/g, type: "strikethrough" },
          { regex: /`(.*?)`/g, type: "code" },
        ];

    // Wrap parsing in try-catch for older browser compatibility
    try {
      let allMatches = [];
      patterns.forEach(({ regex, type }) => {
        let match;
        while ((match = regex.exec(text)) !== null) {
          allMatches.push({
            index: match.index,
            length: match[0].length,
            text: match[1],
            url: match[2], // For links and images
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

        // Process nested patterns in the match text
        const processedText = processNestedMarkdown(match.text, parts.length);

        // Add the formatted content
        switch (match.type) {
          case "link":
            parts.push(
              <a
                key={parts.length}
                href={match.url}
                target="_blank"
                rel="noopener noreferrer"
                className="markdown-link"
              >
                {match.text}
              </a>
            );
            break;
          case "image":
            parts.push(
              <img
                key={parts.length}
                src={match.url}
                alt={match.text}
                className="markdown-image"
              />
            );
            break;
          case "bold":
            parts.push(<strong key={parts.length}>{processedText}</strong>);
            break;
          case "italic":
            parts.push(<em key={parts.length}>{processedText}</em>);
            break;
          case "strikethrough":
            parts.push(
              <del key={parts.length} className="markdown-del">
                {processedText}
              </del>
            );
            break;
          case "code":
            parts.push(
              <code key={parts.length} className="markdown-code">
                {processedText}
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
    } catch (error) {
      // Fallback to simple text rendering if parsing fails
      console.error("Markdown parsing error:", error);
      return text;
    }
  };

  // Recursively process nested markdown
  const processNestedMarkdown = (text, keyPrefix) => {
    // Only process nested patterns (not the outer ones)
    const parts = [];
    let current = text;
    let key = 0;

    // Process bold
    if (!text.includes("**")) {
      if (/\*[^*]+\*/.test(current)) {
        const parts = [];
        const regex = /\*([^*]+?)\*/g;
        let match;
        let lastIndex = 0;

        while ((match = regex.exec(current)) !== null) {
          if (match.index > lastIndex) {
            parts.push(current.substring(lastIndex, match.index));
          }
          parts.push(<em key={`${keyPrefix}-n-${key++}`}>{match[1]}</em>);
          lastIndex = match.index + match[0].length;
        }

        if (lastIndex < current.length) {
          parts.push(current.substring(lastIndex));
        }

        if (parts.length > 0) {
          return parts;
        }
      }
    }

    return text;
  };

  return (
    <motion.div
      ref={answerSectionRef}
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

      {/* Display saved reading timestamp if this is a loaded reading */}
      {isLoadedReading && (savedReadingDate || savedReadingTime) && (
        <motion.div
          className="saved-reading-info"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.25 }}
        >
          📅 {t("savedOn")} {savedReadingDate} {savedReadingTime}
        </motion.div>
      )}

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
        <div className="answer-text">{parseMarkdown(answer)}</div>

        {/* Auto-save Status */}
        {isGoogleSignedIn && (
          <motion.div
            className="auto-save-status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, ...springTransition }}
          >
            {autoSaved ? (
              <div className="save-success">
                <span className="status-icon">✓</span>
                <span>{t("readingSaved")}</span>
              </div>
            ) : saveError ? (
              <div className="save-error">
                <span className="status-icon">⚠</span>
                <span>{saveError}</span>
              </div>
            ) : (
              <div className="save-info">
                <span className="status-icon">☁️</span>
                <span>{t("autoSaveEnabled")}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          {/* Back to Saved Readings button - only show if this is a loaded reading */}
          {isLoadedReading && onBackToSavedReadings && (
            <motion.button
              className="back-to-saved-button"
              onClick={onBackToSavedReadings}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, ...springTransition }}
              aria-label={t("backToSavedReadings")}
            >
              ← {t("backToSavedReadings")}
            </motion.button>
          )}

          <motion.button
            className="donation-button"
            onClick={() => {
              window.open("https://me.momo.vn/oceanondawave");
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, ...springTransition }}
            aria-label={t("buyCoffee")}
          >
            ☕ {t("buyCoffee")}
          </motion.button>

          <motion.button
            className="screenshot-button"
            onClick={handleSaveScreenshot}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.25, ...springTransition }}
            aria-label={saved ? t("saved") : t("savePDF")}
          >
            {saved ? `✓ ${t("saved")}` : `📄 ${t("savePDF")}`}
          </motion.button>

          <motion.button
            className="copy-button"
            onClick={handleCopyResult}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, ...springTransition }}
            aria-label={copied ? t("copied") : t("copyResult")}
          >
            {copied ? `✓ ${t("copied")}` : `📋 ${t("copyResult")}`}
          </motion.button>
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
        aria-label={t("newReadingButton")}
      >
        {t("newReadingButton")}
      </motion.button>
    </motion.div>
  );
}

export default AnswerDisplay;
