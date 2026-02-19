import { createContext, useContext, useState, useEffect } from "react";

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
      "Hướng dẫn: Nhập số để chọn lá bài, sau đó nhấn Enter để chọn (không cần di chuyển đến nút Chọn). Sau khi chọn đủ 3 lá, nhấn Hoàn thành để quay lại menu và xem kết quả. Nếu muốn bỏ chọn lá nào, nhấn vào nút bỏ chọn bên dưới.",
    quickSelectDescription: "Nhập vị trí từ 1 đến {count} để chọn lá bài",
    removeCardLabel: "Bỏ chọn lá bài:",
    selectCardToRemove: "Chọn lá bài để bỏ chọn...",
    positionLabel: "Vị trí {position} - {name}",
    selectedPositions: "Đã chọn vị trí: {positions}",
    inputPlaceholder: "Nhập vị trí...",
    selectButton: "Chọn",
    doneButton: "Hoàn thành",
    manualSelection: "Chọn thủ công",
    quickSelection: "Chọn nhanh theo số",
    manualSelectionDescription: "Chọn {count} lá bài bằng cách bấm vào chúng",
    manualSelectionInstructions:
      "Hướng dẫn: Bấm vào các lá bài để lật và chọn. Sau khi chọn đủ 3 lá, nhấn Hoàn thành để quay lại menu và xem kết quả. Nếu muốn bỏ chọn lá nào, bấm lại vào lá bài đó.",
    copyResult: "Sao chép kết quả",
    copied: "Đã sao chép!",
    buyCoffee: "Tặng tác giả cà phê muối",
    saveImage: "Lưu hình ảnh",
    savePDF: "Lưu PDF",
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
    privacyNoticeDetail:
      "Tất cả các lượt bói hiện được lưu trong Google Drive CỦA BẠN. Không có dữ liệu cá nhân nào được chia sẻ với bất kỳ ai khác.",
    puterSigninCaution:
      "Lưu ý: Bạn sẽ cần đăng nhập tài khoản Puter.com để xem kết quả bói bài.",
    revealReading: "Xem Kết Quả",

    // Google Drive Integration
    saveToDrive: "Lưu vào Google Drive",
    saveToDriveDescription: "Đăng nhập để tự động lưu kết quả vào Google Drive",
    signInWithGoogle: "Đăng nhập Google",
    signOut: "Đăng xuất",
    driveConnected: "Đã kết nối Google Drive",
    autoCreateFolder: "Tự động tạo thư mục",
    excelFormat: "Định dạng Excel",
    searchableHistory: "Lịch sử có thể tìm kiếm",
    cloudBackup: "Sao lưu đám mây",
    signInFailed: "Đăng nhập thất bại",
    signOutFailed: "Đăng xuất thất bại",
    permissionRequestFailed: "Không thể cấp quyền truy cập",
    autoSaveEnabled: "Tự động lưu đã bật - Đã lưu vào Google Drive",
    autoSaveDisabled: "Tự động lưu đã tắt",
    readingSaved: "Đã lưu bài đọc",
    saveFailed: "Lưu thất bại",
    saving: "Đang lưu",
    popupClosed: "Cửa sổ đăng nhập đã bị đóng",
    accessDenied: "Quyền truy cập bị từ chối",
    insufficientAuth: "Xác thực không đủ",
    folderCreated: "Thư mục đã tạo",
    spreadsheetCreated: "Bảng tính đã tạo",
    insufficientPermissionsTitle: "Quyền Truy Cập Không Đủ",
    insufficientPermissionsMessage:
      "Bạn chưa cấp đầy đủ quyền truy cập để sử dụng tính năng lưu trữ. Vui lòng đăng nhập lại và cấp tất cả các quyền cần thiết.",
    goToSignIn: "Đi đến Đăng Nhập",
    savedReadings: "Bài đọc đã lưu",
    savedOn: "Đã lưu vào",
    backToSavedReadings: "Quay lại danh sách bài đọc đã lưu",
    searchPlaceholder: "Tìm kiếm theo câu hỏi, ngày, hoặc tên lá bài...",
    search: "Tìm kiếm",
    clear: "Xóa",
    loading: "Đang tải...",
    loadFailed: "Không thể tải dữ liệu",
    searchFailed: "Tìm kiếm thất bại",
    noSearchResults: "Không tìm thấy kết quả nào",
    noReadings: "Chưa có bài đọc nào được lưu",
    viewSavedReadings: "Xem bài đọc đã lưu",
    deleteReading: "Xóa bài đọc",
    viewReading: "Xem",
    confirmDelete: "Bạn có chắc chắn muốn xóa bài đọc này?",
    deleteFailed: "Không thể xóa bài đọc",
    notSignedInTitle: "Chưa Đăng Nhập",
    notSignedInMessage:
      "Bạn chưa đăng nhập. Kết quả sẽ không được lưu tự động vào Google Drive của bạn.",
    backToSignIn: "Quay Lại Đăng Nhập",
    continueAnyway: "Tiếp Tục Không Lưu",
    cleanupButton: "Dọn dẹp",
    cleanupTitle: "Dọn dẹp dữ liệu",
    cleanupDescription:
      "Loại bỏ các dòng dữ liệu không hợp lệ hoặc trống trong bảng tính",
    cleanupConfirm:
      "Bạn có chắc chắn muốn dọn dẹp dữ liệu? Hành động này sẽ xóa các dòng không hợp lệ.",
    cleanupCompleted: "Đã hoàn thành! Đã xóa {count} dòng không hợp lệ.",
    cleanupFailed: "Không thể dọn dẹp dữ liệu",
    signInDialogSubtitle: "Đăng nhập để tự động lưu kết quả vào Google Sheets",
    privateAndSecure: "Riêng tư và bảo mật",
    skipForNow: "Bỏ qua",
    userInfo: "Thông tin người dùng",
    yourDriveFiles: "Tệp Google Drive của bạn",
    close: "Đóng",
    signInPrompt: "Đăng nhập để tự động lưu kết quả vào Google Drive",
    privacyInfo: "Chỉ lưu vào Google Sheets của bạn, hoàn toàn riêng tư",
    googleVerificationWarning:
      "Nếu Google hiển thị cảnh báo 'Ứng dụng chưa được xác minh', hãy chọn 'Nâng cao' và 'Đi tới...' để bỏ qua cảnh báo. Hãy nhớ cấp tất cả các quyền cần thiết (chỉ các quyền để tạo sheet lưu dữ liệu, tác giả không yêu cầu gì khác).",
    dataLoadTroubleshoot:
      "Nếu không tải được dữ liệu hoặc có lỗi xảy ra, hãy thử đăng xuất và đăng nhập lại.",
    driveCaution:
      "Cảnh báo: Xóa hoặc chỉnh sửa sheet có thể gây hỏng dữ liệu. Vui lòng không thực hiện.",
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
    factContainer: "Thông tin về bài Tarot",
    playFacts: "Phát thông tin",
    pauseFacts: "Tạm dừng thông tin",
    aiCaution:
      "Lưu ý: Kết quả được tạo bởi AI, có thể không chính xác, xin hãy tham khảo",
    serviceCaution:
      "Tác giả sử dụng dịch vụ miễn phí, có thể gián đoạn nếu lượt sử dụng cao, mong mọi người thông cảm",

    // Answer
    answerTitle: "Kết Quả Bói Của Bạn",
    newReadingButton: "Bói Lại",

    // Errors
    errorSelectCards: "Vui lòng chọn đúng 3 lá bài",
    errorEnterQuestion: "Vui lòng nhập câu hỏi của bạn",
    errorApiKey: "",
    errorReading: "Không thể bói. Vui lòng thử lại.",
    errorPuterAuth: "Không thể xác thực với Puter.com. Vui lòng đăng nhập để tiếp tục.",

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
      "Instructions: Enter numbers to select cards, then press Enter to select (no need to move to the Select button). After selecting 3 cards, click Done to return to menu and view results. If you want to remove any card, click the remove button below.",
    quickSelectDescription: "Enter position from 1 to {count} to select card",
    removeCardLabel: "Remove card:",
    selectCardToRemove: "Select card to remove...",
    positionLabel: "Position {position} - {name}",
    selectedPositions: "Selected positions: {positions}",
    inputPlaceholder: "Enter position...",
    selectButton: "Select",
    doneButton: "Done",
    manualSelection: "Manual Selection",
    quickSelection: "Quick Select by Number",
    manualSelectionDescription: "Select {count} cards by clicking on them",
    manualSelectionInstructions:
      "Instructions: Click on cards to flip and select them. After selecting 3 cards, click Done to return to menu and view results. To unselect a card, click on it again.",
    copyResult: "Copy Result",
    copied: "Copied!",
    buyCoffee: "Buy author a coffee",
    saveImage: "Save Image",
    savePDF: "Save PDF",
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
    privacyNoticeDetail:
      "All readings are now saved in YOUR Google Drive. No personal data is shared with anyone else.",
    puterSigninCaution:
      "Note: You will need to sign in to Puter.com to view the reading results.",
    revealReading: "Reveal Reading",

    // Google Drive Integration
    saveToDrive: "Save to Google Drive",
    saveToDriveDescription:
      "Sign in to automatically save results to Google Drive",
    signInWithGoogle: "Sign in with Google",
    signOut: "Sign Out",
    driveConnected: "Google Drive Connected",
    autoCreateFolder: "Auto-create folder",
    excelFormat: "Excel format",
    searchableHistory: "Searchable history",
    cloudBackup: "Cloud backup",
    signInFailed: "Sign in failed",
    signOutFailed: "Sign out failed",
    permissionRequestFailed: "Could not grant access permissions",
    autoSaveEnabled: "Auto-save enabled - Saved to your Google Drive",
    autoSaveDisabled: "Auto-save disabled",
    readingSaved: "Reading saved",
    saveFailed: "Save failed",
    saving: "Saving",
    popupClosed: "Login popup was closed",
    accessDenied: "Access denied",
    insufficientAuth: "Insufficient authentication",
    folderCreated: "Folder created",
    spreadsheetCreated: "Spreadsheet created",
    insufficientPermissionsTitle: "Insufficient Permissions",
    insufficientPermissionsMessage:
      "You have not granted full permissions to use the storage feature. Please sign in again and grant all required permissions.",
    goToSignIn: "Go to Sign In",
    savedReadings: "Saved Readings",
    driveCaution:
      "Caution: Removing or editing the sheet would cause data corruption. Do not do it.",
    searchPlaceholder: "Search by question, date, or card name...",
    search: "Search",
    clear: "Clear",
    loading: "Loading...",
    loadFailed: "Failed to load data",
    searchFailed: "Search failed",
    noSearchResults: "No results found",
    noReadings: "No readings saved yet",
    viewSavedReadings: "View Saved Readings",
    savedOn: "Saved on",
    backToSavedReadings: "Back to Saved Readings",
    deleteReading: "Delete Reading",
    viewReading: "View",
    confirmDelete: "Are you sure you want to delete this reading?",
    deleteFailed: "Failed to delete reading",
    notSignedInTitle: "Not Signed In",
    notSignedInMessage:
      "You are not signed in. Your result will not be automatically saved to your Google Drive.",
    backToSignIn: "Back to Sign In",
    continueAnyway: "Continue Without Saving",
    cleanupButton: "Cleanup",
    cleanupTitle: "Cleanup Data",
    cleanupDescription: "Remove invalid or empty rows from the spreadsheet",
    cleanupConfirm:
      "Are you sure you want to cleanup the data? This will remove invalid rows.",
    cleanupCompleted: "Cleanup completed! Removed {count} invalid rows.",
    cleanupFailed: "Failed to cleanup data",
    signInDialogSubtitle:
      "Sign in to automatically save your results to Google Sheets",
    privateAndSecure: "Private and secure",
    skipForNow: "Skip for now",
    userInfo: "User Information",
    yourDriveFiles: "Your Google Drive Files",
    close: "Close",
    signInPrompt: "Sign in to automatically save your results to Google Drive",
    privacyInfo: "Save only to your Google Sheets, completely private",
    googleVerificationWarning:
      "If Google shows 'This app isn't verified' warning, click 'Advanced' and 'Go to...' to skip the warning. Remember to grant all required permissions (only permissions to create sheet to store data, author does not request anything else).",
    dataLoadTroubleshoot:
      "If you cannot load data or any error occurs, try to sign out and sign in again.",

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
    factContainer: "Tarot Information",
    playFacts: "Play Facts",
    pauseFacts: "Pause Facts",
    aiCaution:
      "Caution: Results are generated by AI, may not be accurate, please take as reference",
    serviceCaution:
      "Author uses free service, could be down if usage is high, please understand",

    // Answer
    answerTitle: "Your Reading",
    newReadingButton: "New Reading",

    // Errors
    errorSelectCards: "Please select exactly 3 cards",
    errorEnterQuestion: "Please enter your question",
    errorApiKey: "",
    errorReading: "Unable to read. Please try again.",
    errorPuterAuth: "Cannot authorize with Puter.com. Please sign in to continue.",

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
  // Initialize language from localStorage or default to "vi"
  const [language, setLanguageState] = useState(() => {
    try {
      const savedLanguage = localStorage.getItem("tarotLanguage");
      return savedLanguage || "vi";
    } catch (error) {
      console.error("Failed to load language from localStorage:", error);
      return "vi";
    }
  });

  // Save language to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("tarotLanguage", language);
    } catch (error) {
      console.error("Failed to save language to localStorage:", error);
    }
  }, [language]);

  const t = (key, replacements = {}) => {
    let text = translations[language][key] || key;

    // Replace placeholders like {count}, {selected}, etc.
    Object.keys(replacements).forEach((placeholder) => {
      text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    });

    return text;
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === "vi" ? "en" : "vi"));
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
