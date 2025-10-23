import { useLanguage } from "../contexts/LanguageContext";

function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button className="language-switcher" onClick={toggleLanguage}>
      <span className="language-flag">{language === "vi" ? "🇻🇳" : "🇬🇧"}</span>
      <span className="language-text">{language === "vi" ? "VI" : "EN"}</span>
    </button>
  );
}

export default LanguageSwitcher;
