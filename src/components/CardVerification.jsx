import { useState, useRef, useEffect } from "react";
import { tarotCards } from "../data/tarotCards";
import { useLanguage } from "../contexts/LanguageContext";
import CardDetailModal from "./CardDetailModal";
import "./CardVerification.css";

function CardVerification() {
  const { t, language } = useLanguage();
  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Accessibility: Return focus to the clicked card after modal closes
  const clickedCardRef = useRef(null);
  const cardRefs = useRef({});

  const handleCardClick = (card, id) => {
    clickedCardRef.current = id;
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (clickedCardRef.current && cardRefs.current[clickedCardRef.current]) {
      cardRefs.current[clickedCardRef.current].focus();
    }
  };

  // Group cards by suit
  const majorArcana = tarotCards.filter((card) => card.suit === "Major Arcana");
  const wands = tarotCards.filter((card) => card.suit === "Wands");
  const cups = tarotCards.filter((card) => card.suit === "Cups");
  const swords = tarotCards.filter((card) => card.suit === "Swords");
  const pentacles = tarotCards.filter((card) => card.suit === "Pentacles");

  const CardDisplay = ({ card }) => (
    <div
      ref={(el) => (cardRefs.current[card.id] = el)}
      className="verification-card"
      onClick={() => handleCardClick(card, card.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(card, card.id);
        }
      }}
      aria-label={`${t("viewReading")} ${language === "vi" && card.name_vi ? `${card.name_vi} (${card.name})` : card.name}`}
      style={{ cursor: "pointer" }}
    >
      <div className="verification-card-image-wrapper">
        <img
          src={card.image}
          alt={language === "vi" && card.name_vi ? `${card.name_vi} (${card.name})` : card.name}
          className="verification-card-image"
          onError={(e) => {
            e.target.style.border = "3px solid red";
            e.target.alt = "ERROR: Image failed to load";
          }}
        />
      </div>
      <div className="verification-card-info">
        <span className="verification-card-id">#{card.id}</span>
        <span className="verification-card-name">{language === "vi" && card.name_vi ? `${card.name_vi} (${card.name})` : card.name}</span>
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
        <p style={{ marginTop: "0.5rem", fontStyle: "italic", opacity: 0.8 }}>
          {t("clickCardInstruction")}
        </p>
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
        <p style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "center" }}>
          <span>
            By{" "}
            <a href="https://github.com/oceanondawave" target="_blank" rel="noreferrer" className="author-link">
              @oceanondawave
            </a>
            {" "} / Powered by{" "}
            <a href="https://puter.com" target="_blank" rel="noreferrer" className="author-link">
              Puter.com
            </a>
            ,{" "}
            <a href="https://cursor.sh" target="_blank" rel="noreferrer" className="author-link">
              Cursor
            </a>{" "}
            &{" "}
            <a href="https://antigravity.google/" target="_blank" rel="noreferrer" className="author-link">
              Antigravity
            </a>
          </span>
          <span style={{ fontSize: "0.85em", opacity: 0.8 }}>
            Open-sourced at{" "}
            <a href="https://github.com/oceanondawave/tarotreader" target="_blank" rel="noreferrer" className="author-link">
              github.com/oceanondawave/tarotreader
            </a>
          </span>
        </p>
      </div>

      <CardDetailModal
        isOpen={isModalOpen}
        card={selectedCard}
        onClose={handleCloseModal}
      />
    </div >
  );
}

export default CardVerification;
