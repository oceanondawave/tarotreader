import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import googleDriveService from "../services/googleDriveService";
import {
  Download, Calendar, Check, AlertTriangle, Cloud,
  Coffee, FileText, Copy, Share2, Loader, ArrowLeft
} from "lucide-react";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Initialize pdfMake fonts
try {
  if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  }
  // Set default font - using the built-in fonts from pdfmake
  // The vfs_fonts already includes Roboto fonts as base64
  pdfMake.fonts = {
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf",
    },
  };

  // Set default font
  pdfMake.fonts = pdfMake.fonts || {};
  if (!pdfMake.fonts.Roboto) {
    pdfMake.fonts.Roboto = {};
  }
} catch (error) {
  console.error("Error initializing pdfMake fonts:", error);
}

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
  const [isSaving, setIsSaving] = useState(false);
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
      setIsSaving(true);
      const readingData = {
        question: question || "",
        cards: cards,
        answer: answer,
        language: language,
      };

      await googleDriveService.saveReading(readingData);
      setIsSaving(false);
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 3000);

      // Notify parent that a reading was saved
      if (onReadingSaved) {
        onReadingSaved();
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      setIsSaving(false);
      setSaveError(error.message || t("saveFailed"));
    }
  };

  // Helper function to remove markdown from text
  // Compatible with older browsers (no lookbehind assertions)
  const removeMarkdown = (text) => {
    if (!text) return text;

    // Check if browser supports lookbehind assertions
    let supportsLookbehind = false;
    try {
      new RegExp("(?<=test)");
      supportsLookbehind = true;
    } catch (e) {
      supportsLookbehind = false;
    }

    // Basic markdown removal that works in all browsers
    let result = text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
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

    // Only use lookbehind for italic if supported
    if (supportsLookbehind) {
      result = result.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, "$1"); // Italic
    } else {
      // Fallback: simple italic removal (may have false matches but works)
      result = result.replace(/\b\*([^*]+?)\*\b/g, "$1"); // Italic
    }

    return result;
  };

  const handleCopyResult = async () => {
    try {
      // Remove markdown from the answer before copying
      const plainText = removeMarkdown(answer);

      // Add question at the top
      const textToCopy = question
        ? `${t("yourQuestion")}: ${question}\n\n${plainText}`
        : plainText;

      // Check if Clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        // Modern clipboard API
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers (including old Safari)
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand("copy");
          if (successful) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } else {
            console.error("Failed to copy using execCommand");
          }
        } catch (err) {
          console.error("Failed to copy text: ", err);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleSaveScreenshot = async () => {
    try {
      if (!answerSectionRef.current) return;

      // Check for browser compatibility
      if (typeof fetch === "undefined" || typeof FileReader === "undefined") {
        alert(
          "PDF generation is not supported on this browser. Please update your browser or use the Copy Result feature instead."
        );
        return;
      }

      // Convert card images to base64 with error handling
      const cardImages = await Promise.all(
        cards.map(async (card) => {
          try {
            const response = await fetch(card.image);
            if (!response.ok) {
              console.error("Failed to fetch card image:", card.image);
              return null;
            }
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
              try {
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (reader.error) {
                    console.error("FileReader error:", reader.error);
                    resolve(null);
                  } else {
                    resolve(reader.result);
                  }
                };
                reader.onerror = () => {
                  console.error("FileReader error for image:", card.image);
                  resolve(null);
                };
                reader.readAsDataURL(blob);
              } catch (error) {
                console.error("Error creating FileReader:", error);
                resolve(null);
              }
            });
          } catch (error) {
            console.error("Error loading card image:", error);
            return null;
          }
        })
      );

      // Create PDF content structure with images
      const cardRows = cards.map((card, index) => {
        const imageDataUrl = cardImages[index];
        const cell = {
          stack: [
            ...(imageDataUrl
              ? [
                {
                  image: imageDataUrl,
                  width: 80,
                  height: 120,
                  margin: [0, 5, 0, 5],
                },
              ]
              : []),
            {
              text: card.name,
              style: "cardName",
              alignment: "center",
              margin: [0, 5, 0, 5],
            },
          ],
          alignment: "center",
          border: [false, false, false, false],
        };
        return cell;
      });

      // Parse markdown and convert to pdfMake format
      const parseMarkdownForPDF = (text) => {
        if (!text) return [];

        const lines = text.split("\n");
        const result = [];

        for (const line of lines) {
          if (!line.trim()) {
            result.push({ text: "\n" });
            continue;
          }

          // Headers
          if (line.startsWith("### ")) {
            const content = line.substring(4);
            const parsedContent = parseInlineMarkdownPDF(content);
            result.push({
              text: Array.isArray(parsedContent)
                ? parsedContent
                : [{ text: parsedContent }],
              style: "h3",
              margin: [0, 5, 0, 3],
            });
          } else if (line.startsWith("## ")) {
            const content = line.substring(3);
            const parsedContent = parseInlineMarkdownPDF(content);
            result.push({
              text: Array.isArray(parsedContent)
                ? parsedContent
                : [{ text: parsedContent }],
              style: "h2",
              margin: [0, 8, 0, 5],
            });
          } else if (line.startsWith("# ")) {
            const content = line.substring(2);
            const parsedContent = parseInlineMarkdownPDF(content);
            result.push({
              text: Array.isArray(parsedContent)
                ? parsedContent
                : [{ text: parsedContent }],
              style: "h1",
              margin: [0, 10, 0, 5],
            });
          }
          // Bullet points
          else if (/^\s*[-*]\s+/.test(line)) {
            const content = line.replace(/^\s*[-*]\s+/, "");
            const parsedContent = parseInlineMarkdownPDF(content);
            result.push({
              text: [
                { text: "• ", bold: true },
                ...(Array.isArray(parsedContent)
                  ? parsedContent
                  : [{ text: parsedContent }]),
              ],
              margin: [10, 2, 0, 2],
            });
          }
          // Numbered list
          else if (/^\s*\d+\.\s+/.test(line)) {
            const content = line.replace(/^\s*\d+\.\s+/, "");
            const parsedContent = parseInlineMarkdownPDF(content);
            result.push({
              text: Array.isArray(parsedContent)
                ? parsedContent
                : [{ text: parsedContent }],
              margin: [10, 2, 0, 2],
            });
          }
          // Regular paragraph
          else {
            // Parse inline markdown (bold, italic)
            let content = parseInlineMarkdownPDF(line.trim());
            result.push({
              text: Array.isArray(content) ? content : [{ text: content }],
              margin: [0, 2, 0, 2],
            });
          }
        }

        return result;
      };

      // Parse inline markdown (bold, italic)
      const parseInlineMarkdownPDF = (text) => {
        try {
          // Test if lookbehind assertion is supported
          try {
            new RegExp("(?<!x)y");
          } catch (e) {
            // Lookbehind not supported, use fallback
            return parseInlineMarkdownPDFFallback(text);
          }

          const parts = [];
          let lastIndex = 0;

          // Find bold text
          const boldRegex = /\*\*(.*?)\*\*/g;
          let match;
          let matches = [];

          while ((match = boldRegex.exec(text)) !== null) {
            matches.push({
              index: match.index,
              length: match[0].length,
              content: match[1],
              type: "bold",
            });
          }

          // Find italic text (not part of bold) - using lookbehind
          const italicRegex = /(?<!\*)\*([^*]+?)\*(?!\*)/g;
          while ((match = italicRegex.exec(text)) !== null) {
            // Check if this is inside a bold match
            const isInsideBold = matches.some(
              (m) => m.index < match.index && match.index < m.index + m.length
            );
            if (!isInsideBold) {
              matches.push({
                index: match.index,
                length: match[0].length,
                content: match[1],
                type: "italic",
              });
            }
          }

          // Sort matches by index
          matches.sort((a, b) => a.index - b.index);

          // Build result
          for (const match of matches) {
            // Add text before match
            if (match.index > lastIndex) {
              parts.push(text.substring(lastIndex, match.index));
            }

            // Add formatted match
            if (match.type === "bold") {
              parts.push({ text: match.content, bold: true });
            } else if (match.type === "italic") {
              parts.push({ text: match.content, italics: true });
            }

            lastIndex = match.index + match.length;
          }

          // Add remaining text
          if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
          }

          return parts.length > 0 ? parts : [text];
        } catch (error) {
          // Fallback if anything fails
          return parseInlineMarkdownPDFFallback(text);
        }
      };

      // Fallback for browsers without lookbehind support
      const parseInlineMarkdownPDFFallback = (text) => {
        const parts = [];
        let lastIndex = 0;
        let boldMatches = [];
        let italicMatches = [];

        // Find all bold matches first
        const boldRegex = /\*\*(.*?)\*\*/g;
        let match;
        while ((match = boldRegex.exec(text)) !== null) {
          boldMatches.push({
            index: match.index,
            length: match[0].length,
            content: match[1],
            type: "bold",
          });
        }

        // Find all italic matches (simple pattern)
        const italicRegex = /\*([^*]+?)\*/g;
        while ((match = italicRegex.exec(text)) !== null) {
          // Check if this is NOT inside a bold match
          const isInsideBold = boldMatches.some(
            (m) => m.index < match.index && match.index < m.index + m.length
          );
          // Also check if previous char is * (bold marker)
          const prevChar = text[match.index - 1];
          if (!isInsideBold && prevChar !== "*") {
            italicMatches.push({
              index: match.index,
              length: match[0].length,
              content: match[1],
              type: "italic",
            });
          }
        }

        // Combine and sort all matches
        const allMatches = [...boldMatches, ...italicMatches].sort(
          (a, b) => a.index - b.index
        );

        // Build result
        for (const match of allMatches) {
          // Add text before match
          if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
          }

          // Add formatted match
          if (match.type === "bold") {
            parts.push({ text: match.content, bold: true });
          } else if (match.type === "italic") {
            parts.push({ text: match.content, italics: true });
          }

          lastIndex = match.index + match.length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
          parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? parts : [text];
      };

      // Parse markdown content
      const answerContent = parseMarkdownForPDF(answer);

      const docDefinition = {
        content: [
          { text: t("answerTitle"), style: "header" },
          { text: "", margin: [0, 5, 0, 5] },
          { text: t("yourQuestion"), style: "subheader" },
          { text: `"${question}"`, style: "question", margin: [0, 0, 0, 15] },
          { text: t("selectedCardsTitle"), style: "subheader" },
          {
            table: {
              widths: ["*", "*", "*"],
              body: [cardRows],
            },
            layout: {
              paddingLeft: () => 5,
              paddingRight: () => 5,
              paddingTop: () => 5,
              paddingBottom: () => 5,
            },
            margin: [0, 5, 0, 20],
          },
          ...answerContent,
        ],
        styles: {
          header: {
            fontSize: 28,
            bold: true,
            color: "#d4a5ff",
            margin: [0, 0, 0, 15],
          },
          subheader: {
            fontSize: 18,
            bold: true,
            color: "#d4a5ff",
            margin: [0, 10, 0, 8],
          },
          question: {
            fontSize: 14,
            italic: true,
          },
          cardName: {
            fontSize: 13,
            color: "#d4a5ff",
            bold: true,
          },
          h1: {
            fontSize: 20,
            bold: true,
            color: "#d4a5ff",
          },
          h2: {
            fontSize: 16,
            bold: true,
            color: "#d4a5ff",
          },
          h3: {
            fontSize: 14,
            bold: true,
            color: "#d4a5ff",
          },
          answer: {
            fontSize: 12,
            lineHeight: 1.6,
            color: "#333",
          },
        },
        defaultStyle: {
          font: "Roboto",
          fontSize: 11,
        },
        info: {
          title: "Tarot Reading",
          author: "Mystical Tarot Reader",
          subject: "Tarot Reading Result",
        },
        pageMargins: [40, 60, 40, 60],
        pageSize: "A4",
      };

      // Generate and download PDF with error handling
      try {
        // Ensure pdfMake.vfs is set up if not already
        if (window.pdfMake && window.pdfMake.vfs) {
          pdfMake.vfs = window.pdfMake.vfs;
        }

        // Set default font
        pdfMake.fonts = {
          Roboto: {
            normal: "Roboto-Regular.ttf",
            bold: "Roboto-Medium.ttf",
            italics: "Roboto-Italic.ttf",
            bolditalics: "Roboto-MediumItalic.ttf",
          },
        };

        const pdfDoc = pdfMake.createPdf(docDefinition);

        // For Safari that doesn't properly trigger download
        if (
          navigator.userAgent.includes("Safari") &&
          !navigator.userAgent.includes("Chrome")
        ) {
          // Use getBlob and create a download link with iframe trick for Safari
          pdfDoc.getBlob((blob) => {
            try {
              // For Safari, we need to use window.open with the blob URL
              const url = URL.createObjectURL(blob);

              // Try using an iframe to force download
              const iframe = document.createElement("iframe");
              iframe.style.display = "none";
              iframe.src = url;
              document.body.appendChild(iframe);

              // Also try creating a download link as fallback
              const link = document.createElement("a");
              link.href = url;
              link.download = `tarot-reading-${new Date()
                .toISOString()
                .slice(0, 10)}.pdf`;
              link.style.display = "none";

              // Don't use target="_blank" as it opens in new tab
              link.setAttribute("download", link.download);

              document.body.appendChild(link);

              // Try clicking with mouse event
              const clickEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
              });
              link.dispatchEvent(clickEvent);

              // Clean up after delay
              setTimeout(() => {
                document.body.removeChild(link);
                document.body.removeChild(iframe);
                URL.revokeObjectURL(url);
              }, 2000);

              // Show saved message
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);

              // Show alert for Safari users explaining the limitation
              alert(
                "📥 PDF is ready! If Safari shows you a blob URL, right-click on the page and select 'Save As' or 'Download' to save the PDF file. This is a Safari security limitation."
              );
            } catch (blobError) {
              console.error("Error creating download link:", blobError);
              // Fallback to regular download
              pdfDoc.download(
                `tarot-reading-${new Date().toISOString().slice(0, 10)}.pdf`
              );
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }
          });
        } else {
          // Modern browsers - use the standard download method
          pdfDoc.download(
            `tarot-reading-${new Date().toISOString().slice(0, 10)}.pdf`
          );
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }
      } catch (pdfError) {
        console.error("pdfMake error:", pdfError);
        // Fallback: show alert with more details
        let errorMessage = "Failed to generate PDF. ";
        if (pdfError && pdfError.message) {
          errorMessage += pdfError.message;
        }
        errorMessage +=
          " Please try again or use the Copy Result feature instead.";
        alert(errorMessage);
      }
    } catch (err) {
      console.error("Failed to save PDF: ", err);
      let errorMessage = "Failed to generate PDF. ";
      if (err && err.message) {
        errorMessage += err.message;
      }
      errorMessage +=
        " Please try again or use the Copy Result feature instead.";
      alert(errorMessage);
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
      return `___IMAGE_START___${alt || ""
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
          <Calendar className="icon-inline" size={16} /> {t("savedOn")} {savedReadingDate} {savedReadingTime}
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
            <AnimatePresence mode="wait">
              {autoSaved && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Check className="status-icon" size={20} />
                </motion.div>
              )}
              {saveError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  title={saveError}
                >
                  <AlertTriangle className="status-icon error" size={20} />
                </motion.div>
              )}
              {isSaving && (
                <motion.div
                  key="saving"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <div className="loading-spinner-small"></div>
                </motion.div>
              )}
              {!autoSaved && !saveError && !isSaving && (
                <motion.div
                  key="autosaved"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Cloud className="status-icon" size={20} />
                </motion.div>
              )}
            </AnimatePresence>
            {autoSaved ? (
              <div className="save-success">
                <span>{t("readingSaved")}</span>
              </div>
            ) : saveError ? (
              <div className="save-error">
                <span>{saveError}</span>
              </div>
            ) : isSaving ? (
              <div className="save-loading">
                <Loader className="status-icon spin" size={16} />
                <span>{t("saving")}...</span>
              </div>
            ) : (
              <div className="save-info">
                <Cloud className="status-icon" size={16} />
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
              <ArrowLeft className="icon-inline" size={18} /> {t("backToSavedReadings")}
            </motion.button>
          )}

          <motion.a
            href="https://me.momo.vn/oceanondawave"
            target="_blank"
            rel="noopener noreferrer"
            className="action-button secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, ...springTransition }}
            aria-label={t("buyCoffee")}
          >
            <Coffee className="icon-inline" size={18} /> {t("buyCoffee")}
          </motion.a>

          <motion.button
            className={`action-button secondary ${saved ? "success" : ""}`}
            onClick={handleSaveScreenshot}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.25, ...springTransition }}
            aria-label={saved ? t("saved") : t("savePDF")}
          >
            {saved ? (
              <>
                <Check className="icon-inline" size={18} /> {t("saved")}
              </>
            ) : (
              <>
                <FileText className="icon-inline" size={18} /> {t("savePDF")}
              </>
            )}
          </motion.button>

          <motion.button
            className={`action-button secondary ${copied ? "success" : ""}`}
            onClick={handleCopyResult}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, ...springTransition }}
            aria-label={copied ? t("copied") : t("copyResult")}
          >
            {copied ? (
              <>
                <Check className="icon-inline" size={18} /> {t("copied")}
              </>
            ) : (
              <>
                <Copy className="icon-inline" size={18} /> {t("copyResult")}
              </>
            )}
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
