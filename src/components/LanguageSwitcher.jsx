import { useLanguage } from "../contexts/LanguageContext";

function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      className="language-switcher"
      onClick={toggleLanguage}
      aria-label={`${
        language === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"
      }`}
    >
      <span className="language-label">
        {language === "vi" ? "Ngôn ngữ" : "Language"}
      </span>
      <span className="language-flag">{language === "vi" ? "🇻🇳" : "🇬🇧"}</span>
      <span className="language-text">
        {language === "vi" ? "Tiếng Việt" : "English"}
      </span>
    </button>
  );
}

export default LanguageSwitcher;
