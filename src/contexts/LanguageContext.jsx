import { createContext, useContext, useState } from "react";

const translations = {
  vi: {
    // Header
    title: "Bói Tarot Huyền Bí",
    subtitle: "Tìm kiếm sự thông thái từ những lá bài cổ xưa",

    // Steps
    step: "Bước",
    questionStepSubtitle: "Hãy suy ngẫm và đặt câu hỏi của bạn cho các lá bài",
    continueToCards: "Tiếp Tục Chọn Bài",
    backToQuestion: "Quay Lại Câu Hỏi",

    // Card Selection
    chooseCards: "Chọn {count} Lá Bài",
    instruction:
      "Hãy tin vào trực giác của bạn. Chọn những lá bài gọi tên bạn.",
    cardsSelected: "{selected}/{total} Lá Bài Đã Chọn",
    shuffleButton: "Xáo Bài Lại",
    shuffling: "Đang Xáo Bài...",
    quickSelectPlaceholder: "Chọn nhanh theo số",
    quickSelectInstructions:
      "Hướng dẫn: Nhập số để chọn lá bài. Sau khi chọn đủ 3 lá, nhấn Hoàn thành để xem kết quả. Nếu muốn bỏ chọn lá nào, sử dụng menu thả xuống bên dưới.",
    quickSelectDescription: "Nhập vị trí từ 1 đến {count} để chọn lá bài",
    removeCardLabel: "Bỏ chọn lá bài:",
    selectCardToRemove: "Chọn lá bài để bỏ chọn...",
    positionLabel: "Vị trí {position}: {name}",
    selectedPositions: "Đã chọn vị trí: {positions}",
    inputPlaceholder: "Nhập vị trí...",
    selectButton: "Chọn",
    doneButton: "Hoàn thành",
    copyResult: "Sao chép kết quả",
    copied: "Đã sao chép!",
    buyCoffee: "Tặng tác giả cà phê muối",
    saveImage: "Lưu hình ảnh",
    saved: "Đã lưu!",
    cardLabel: "Lá bài {position}: {name}, {status}{disabled}",
    cardLabelWithRow:
      "Lá bài {position}, hàng {row} trong tổng số {totalRows} hàng: {name}, {status}{disabled}",
    selected: "đã chọn",
    unselected: "chưa chọn",
    disabled: ", không thể chọn",
    current: "hiện tại",
    completed: "đã hoàn thành",
    notCompleted: "chưa hoàn thành",
    privacyNotice: "Không thu thập dữ liệu nào từ câu hỏi của bạn",
    revealReading: "Xem Kết Quả",

    // Modal
    modalTitle: "Lượt Bói Của Bạn",
    modalSubtitle: "Bạn đã chọn xong lá bài. Hãy đặt câu hỏi của bạn.",
    selectedCardsTitle: "Các Lá Bài Đã Chọn",
    yourQuestion: "Câu Hỏi Của Bạn",
    questionPlaceholder: "Bạn tìm kiếm sự hướng dẫn nào từ các lá bài?",
    revealButton: "Tiết Lộ Kết Quả",

    // Confirmation Modal
    confirmResetTitle: "Xác Nhận Đặt Lại",
    confirmResetMessage:
      "Bạn có chắc muốn quay lại bước 1? Các lá bài đã chọn sẽ bị đặt lại.",
    confirm: "Xác Nhận",
    cancel: "Hủy Bỏ",

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
    viewAllCards: "Xem Tất Cả Bài",

    // Card Verification Page
    completeTarotDeck: "Bộ Bài Tarot Đầy Đủ",
    allCardsFrom: "Tất cả {count} lá bài từ bộ Rider-Waite-Smith",
    backToTarotReader: "← Quay Lại Bói Bài",
    majorArcana: "Ẩn Chính",
    wands: "Gậy (Lửa)",
    cups: "Cốc (Nước)",
    swords: "Kiếm (Không Khí)",
    pentacles: "Tiền (Đất)",
    cardsCount: "{count} lá bài",
  },
  en: {
    // Header
    title: "Mystical Tarot",
    subtitle: "Seek wisdom from the ancient cards",

    // Steps
    step: "Step",
    questionStepSubtitle: "Reflect and ask your question to the cards",
    continueToCards: "Continue to Cards",
    backToQuestion: "Back to Question",

    // Card Selection
    chooseCards: "Choose {count} Cards",
    instruction: "Trust your intuition. Select the cards that call to you.",
    cardsSelected: "{selected}/{total} Cards Selected",
    shuffleButton: "Shuffle Cards",
    shuffling: "Shuffling...",
    quickSelectPlaceholder: "Quick select by number",
    quickSelectInstructions:
      "Instructions: Enter numbers to select cards. After selecting 3 cards, click Done to view results. If you want to remove any card, use the dropdown menu below.",
    quickSelectDescription: "Enter position from 1 to {count} to select card",
    removeCardLabel: "Remove card:",
    selectCardToRemove: "Select card to remove...",
    positionLabel: "Position {position}: {name}",
    selectedPositions: "Selected positions: {positions}",
    inputPlaceholder: "Enter position...",
    selectButton: "Select",
    doneButton: "Done",
    copyResult: "Copy Result",
    copied: "Copied!",
    buyCoffee: "Buy author a coffee",
    saveImage: "Save Image",
    saved: "Saved!",
    cardLabel: "Card {position}: {name}, {status}{disabled}",
    cardLabelWithRow:
      "Card {position}, row {row} of {totalRows}: {name}, {status}{disabled}",
    selected: "selected",
    unselected: "not selected",
    disabled: ", disabled",
    current: "current",
    completed: "completed",
    notCompleted: "not completed",
    privacyNotice: "No data is collected from your question",
    revealReading: "Reveal Reading",

    // Modal
    modalTitle: "Your Reading",
    modalSubtitle: "You have chosen your cards. Now, ask your question.",
    selectedCardsTitle: "Selected Cards",
    yourQuestion: "Your Question",
    questionPlaceholder: "What guidance do you seek from the cards?",
    revealButton: "Reveal The Reading",

    // Confirmation Modal
    confirmResetTitle: "Confirm Reset",
    confirmResetMessage:
      "Are you sure you want to go back to step 1? Your selected cards will be reset.",
    confirm: "Confirm",
    cancel: "Cancel",

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
    viewAllCards: "View All Cards",

    // Card Verification Page
    completeTarotDeck: "Complete Tarot Deck",
    allCardsFrom: "All {count} cards from the Rider-Waite-Smith deck",
    backToTarotReader: "← Back to Tarot Reader",
    majorArcana: "Major Arcana",
    wands: "Wands (Fire)",
    cups: "Cups (Water)",
    swords: "Swords (Air)",
    pentacles: "Pentacles (Earth)",
    cardsCount: "{count} cards",
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
