import { tarotCards } from "../data/tarotCards";
import { useLanguage } from "../contexts/LanguageContext";
import "./CardVerification.css";

function CardVerification() {
  const { t } = useLanguage();

  // Group cards by suit
  const majorArcana = tarotCards.filter((card) => card.suit === "Major Arcana");
  const wands = tarotCards.filter((card) => card.suit === "Wands");
  const cups = tarotCards.filter((card) => card.suit === "Cups");
  const swords = tarotCards.filter((card) => card.suit === "Swords");
  const pentacles = tarotCards.filter((card) => card.suit === "Pentacles");

  const CardDisplay = ({ card }) => (
    <div className="verification-card">
      <div className="verification-card-image-wrapper">
        <img
          src={card.image}
          alt={card.name}
          className="verification-card-image"
          onError={(e) => {
            e.target.style.border = "3px solid red";
            e.target.alt = "ERROR: Image failed to load";
          }}
        />
      </div>
      <div className="verification-card-info">
        <span className="verification-card-id">#{card.id}</span>
        <span className="verification-card-name">{card.name}</span>
      </div>
    </div>
  );

  const SuitSection = ({ titleKey, cards, color }) => (
    <div className="verification-suit">
      <h2 style={{ color }}>
        {t(titleKey)} ({t("cardsCount", { count: cards.length })})
      </h2>
      <div className="verification-grid">
        {cards.map((card) => (
          <CardDisplay key={card.id} card={card} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="verification-container">
      <div className="verification-header">
        <h1>🃏 {t("completeTarotDeck")}</h1>
        <p>{t("allCardsFrom", { count: tarotCards.length })}</p>
        <a href="/" className="back-to-app">
          {t("backToTarotReader")}
        </a>
      </div>

      <SuitSection titleKey="majorArcana" cards={majorArcana} color="#9d4edd" />
      <SuitSection titleKey="wands" cards={wands} color="#ff6b35" />
      <SuitSection titleKey="cups" cards={cups} color="#4ecdc4" />
      <SuitSection titleKey="swords" cards={swords} color="#95a3b3" />
      <SuitSection titleKey="pentacles" cards={pentacles} color="#6a994e" />

      {/* Author Information */}
      <div className="author-info">
        <p>
          By @oceanondawave / Powered by{" "}
          <a
            href="https://puter.com"
            target="_blank"
            rel="noreferrer"
            className="author-link"
          >
            Puter.com
          </a>
          ,{" "}
          <a
            href="https://cursor.sh"
            target="_blank"
            rel="noreferrer"
            className="author-link"
          >
            Cursor
          </a>{" "}
          &{" "}
          <a
            href="https://antigravity.google/"
            target="_blank"
            rel="noreferrer"
            className="author-link"
          >
            Antigravity
          </a>
        </p>
      </div>
    </div>
  );
}

export default CardVerification;
