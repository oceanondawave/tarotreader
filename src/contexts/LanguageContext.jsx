import { createContext, useContext, useState } from "react";

const translations = {
  vi: {
    // Header
    title: "Bói Tarot Huyền Bí",
    subtitle: "Tìm kiếm sự thông thái từ những lá bài cổ xưa",

    // Card Selection
    chooseCards: "Chọn {count} Lá Bài",
    instruction:
      "Hãy tin vào trực giác của bạn. Chọn những lá bài gọi tên bạn.",
    cardsSelected: "{selected}/{total} Lá Bài Đã Chọn",
    shuffleButton: "Xáo Bài Lại",

    // Modal
    modalTitle: "Lượt Bói Của Bạn",
    modalSubtitle: "Bạn đã chọn xong lá bài. Hãy đặt câu hỏi của bạn.",
    selectedCardsTitle: "Các Lá Bài Đã Chọn",
    yourQuestion: "Câu Hỏi Của Bạn",
    questionPlaceholder: "Bạn tìm kiếm sự hướng dẫn nào từ các lá bài?",
    revealButton: "Tiết Lộ Kết Quả",

    // Thinking
    thinkingTitle: "Đang Tham Khảo Lá Bài",
    thinkingSubtext: "Các linh hồn đang thì thầm...",

    // Answer
    answerTitle: "Kết Quả Bói Của Bạn",
    newReadingButton: "Bói Lại",

    // Errors
    errorSelectCards: "Vui lòng chọn đúng 3 lá bài",
    errorEnterQuestion: "Vui lòng nhập câu hỏi của bạn",
    errorApiKey:
      "Chưa cấu hình OpenRouter API key. Vui lòng thêm VITE_OPENROUTER_API_KEY vào file .env của bạn.",
    errorReading: "Không thể bói. Vui lòng thử lại.",

    // Language
    language: "Ngôn ngữ",
  },
  en: {
    // Header
    title: "Mystical Tarot",
    subtitle: "Seek wisdom from the ancient cards",

    // Card Selection
    chooseCards: "Choose {count} Cards",
    instruction: "Trust your intuition. Select the cards that call to you.",
    cardsSelected: "{selected}/{total} Cards Selected",
    shuffleButton: "Shuffle Cards",

    // Modal
    modalTitle: "Your Reading",
    modalSubtitle: "You have chosen your cards. Now, ask your question.",
    selectedCardsTitle: "Selected Cards",
    yourQuestion: "Your Question",
    questionPlaceholder: "What guidance do you seek from the cards?",
    revealButton: "Reveal The Reading",

    // Thinking
    thinkingTitle: "Consulting the Cards",
    thinkingSubtext: "The spirits are speaking...",

    // Answer
    answerTitle: "Your Reading",
    newReadingButton: "New Reading",

    // Errors
    errorSelectCards: "Please select exactly 3 cards",
    errorEnterQuestion: "Please enter your question",
    errorApiKey:
      "OpenRouter API key not configured. Please add VITE_OPENROUTER_API_KEY to your .env file.",
    errorReading: "Failed to get reading. Please try again.",

    // Language
    language: "Language",
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("vi"); // Default to Vietnamese

  const t = (key, replacements = {}) => {
    let text = translations[language][key] || key;

    // Replace placeholders like {count}, {selected}, etc.
    Object.keys(replacements).forEach((placeholder) => {
      text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    });

    return text;
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "vi" ? "en" : "vi"));
  };

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
