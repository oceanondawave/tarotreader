import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const springTransition = {
    type: "spring",
    stiffness: 300,
    damping: 25,
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: springTransition,
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        y: 50,
        transition: { duration: 0.2 },
    },
};

function CardDetailModal({ isOpen, card, onClose }) {
    const { t, language } = useLanguage();
    const closeButtonRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            if (closeButtonRef.current) {
                closeButtonRef.current.focus();
            }
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!card) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-backdrop"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={onClose}
                    style={{
                        zIndex: 1000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1rem" // Ensures modal doesn't touch screen edges on mobile
                    }}
                >
                    <motion.div
                        className="modal-content"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                            position: "relative",
                            width: "100%",
                            maxWidth: "500px",
                            maxHeight: "90vh",
                            overflow: "hidden", // Prevent outer scroll 
                            borderRadius: "16px",
                            display: "flex",
                            flexDirection: "column",
                            background: "var(--bg-card)",
                            margin: 0
                        }}
                    >
                        {/* Fixed Close Button INSIDE the modal surface */}
                        <button
                            ref={closeButtonRef}
                            onClick={onClose}
                            style={{
                                position: "absolute",
                                top: "1rem",
                                right: "1rem",
                                background: "var(--bg-subtle)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "50%",
                                color: "var(--text-primary)",
                                cursor: "pointer",
                                padding: "0.5rem",
                                zIndex: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "40px",
                                height: "40px",
                                transition: "all 0.2s ease"
                            }}
                            aria-label={t("closeDetails")}
                        >
                            <X size={20} />
                        </button>

                        {/* Inner scrollable area */}
                        <div style={{
                            overflowY: "auto",
                            padding: "2rem",
                            width: "100%",
                            maxHeight: "calc(90vh - 2rem)" // Accounts for padding/borders if needed
                        }}>

                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                style={{ textAlign: "center", marginBottom: "1.5rem" }}
                            >
                                <h2 className="modal-title" style={{ marginBottom: "0.5rem", fontSize: "2rem" }}>
                                    {language === "vi" && card.name_vi ? `${card.name_vi} (${card.name})` : card.name}
                                </h2>
                                <p className="modal-subtitle" style={{ fontSize: "1rem", opacity: 0.8 }}>
                                    #{card.id} - {card.suit}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, ...springTransition }}
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    marginBottom: "2rem",
                                }}
                            >
                                <img
                                    src={card.image}
                                    alt={language === "vi" && card.name_vi ? `${card.name_vi} (${card.name})` : card.name}
                                    style={{
                                        maxWidth: "200px",
                                        borderRadius: "12px",
                                        boxShadow: "0 8px 24px var(--shadow)",
                                        border: "2px solid var(--border-subtle)",
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = "none";
                                    }}
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                style={{ textAlign: "left" }}
                            >
                                {(language === "vi" && card.keywords_vi ? card.keywords_vi : card.keywords) && (language === "vi" && card.keywords_vi ? card.keywords_vi : card.keywords).length > 0 && (
                                    <div style={{ marginBottom: "1.5rem" }}>
                                        <h3 style={{
                                            fontFamily: "'Playfair Display', serif",
                                            color: "var(--accent-primary)",
                                            borderBottom: "1px solid var(--border-subtle)",
                                            paddingBottom: "0.5rem",
                                            marginBottom: "1rem"
                                        }}>
                                            {t("keywords")}
                                        </h3>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                            {(language === "vi" && card.keywords_vi ? card.keywords_vi : card.keywords).map((keyword, index) => (
                                                <span
                                                    key={index}
                                                    style={{
                                                        background: "var(--bg-subtle)",
                                                        padding: "0.4rem 0.8rem",
                                                        borderRadius: "20px",
                                                        fontSize: "0.85rem",
                                                        color: "var(--text-primary)",
                                                        border: "1px solid var(--border-color)",
                                                        textTransform: "capitalize"
                                                    }}
                                                >
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(language === "vi" && card.description_vi ? card.description_vi : card.description) && (
                                    <div>
                                        <h3 style={{
                                            fontFamily: "'Playfair Display', serif",
                                            color: "var(--accent-primary)",
                                            borderBottom: "1px solid var(--border-subtle)",
                                            paddingBottom: "0.5rem",
                                            marginBottom: "1rem"
                                        }}>
                                            {t("description")}
                                        </h3>
                                        <p style={{
                                            lineHeight: "1.6",
                                            color: "var(--text-secondary)",
                                            background: "var(--bg-subtle)",
                                            padding: "1rem",
                                            borderRadius: "8px",
                                            borderLeft: "3px solid var(--accent-primary)"
                                        }}>
                                            {language === "vi" && card.description_vi ? card.description_vi : card.description}
                                        </p>
                                    </div>
                                )}
                            </motion.div>

                            <motion.button
                                onClick={onClose}
                                style={{
                                    width: "100%",
                                    padding: "0.8rem",
                                    marginTop: "2rem",
                                    background: "var(--accent-primary)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: "1rem",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {t("close")}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default CardDetailModal;
