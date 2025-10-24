import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import html2canvas from "html2canvas";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

function AnswerDisplay({ cards, answer, question, onNewReading }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const answerSectionRef = useRef(null);

  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleSaveScreenshot = async () => {
    try {
      if (!answerSectionRef.current) return;

      // Create a temporary container with only the content we want to capture
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = answerSectionRef.current.offsetWidth + "px";
      tempContainer.style.backgroundColor = getComputedStyle(
        document.body
      ).backgroundColor;

      // Clone the content we want (exclude action buttons and new reading button)
      const titleElement = answerSectionRef.current.querySelector("h2");
      const questionElement =
        answerSectionRef.current.querySelector(".result-question");
      const cardsElement =
        answerSectionRef.current.querySelector(".result-cards");
      const answerTextElement =
        answerSectionRef.current.querySelector(".answer-text");

      if (titleElement) tempContainer.appendChild(titleElement.cloneNode(true));
      if (questionElement)
        tempContainer.appendChild(questionElement.cloneNode(true));
      if (cardsElement) tempContainer.appendChild(cardsElement.cloneNode(true));
      if (answerTextElement)
        tempContainer.appendChild(answerTextElement.cloneNode(true));

      document.body.appendChild(tempContainer);

      const canvas = await html2canvas(tempContainer, {
        backgroundColor:
          getComputedStyle(document.documentElement).getPropertyValue(
            "--bg-primary"
          ) || "#0a0a0a",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: tempContainer.offsetWidth,
        height: tempContainer.offsetHeight,
      });

      // Clean up the temporary container
      document.body.removeChild(tempContainer);

      const link = document.createElement("a");
      link.download = `tarot-reading-${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save screenshot: ", err);
    }
  };

  // Enhanced markdown parser for bold, italic, headers, and more
  const parseMarkdown = (text) => {
    return text
      .split(/(\*\*.*?\*\*|\*.*?\*|#{1,6}.*$|`.*?`|~~.*?~~)/gm)
      .map((part, index) => {
        // Bold text
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        // Italic text
        else if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        // Strikethrough text
        else if (part.startsWith("~~") && part.endsWith("~~")) {
          return (
            <del key={index} className="markdown-del">
              {part.slice(2, -2)}
            </del>
          );
        }
        // Inline code
        else if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={index} className="markdown-code">
              {part.slice(1, -1)}
            </code>
          );
        }
        // Headers
        else if (part.startsWith("###")) {
          return (
            <h3 key={index} className="markdown-h3">
              {part.slice(3).trim()}
            </h3>
          );
        } else if (part.startsWith("##")) {
          return (
            <h2 key={index} className="markdown-h2">
              {part.slice(2).trim()}
            </h2>
          );
        } else if (part.startsWith("#")) {
          return (
            <h1 key={index} className="markdown-h1">
              {part.slice(1).trim()}
            </h1>
          );
        }
        return part;
      });
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

        {/* Action Buttons */}
        <div className="action-buttons">
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
            aria-label={saved ? t("saved") : t("saveImage")}
          >
            {saved ? `✓ ${t("saved")}` : `📸 ${t("saveImage")}`}
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
