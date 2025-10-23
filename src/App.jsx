import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CardSelection from "./components/CardSelection";
import ThinkingAnimation from "./components/ThinkingAnimation";
import AnswerDisplay from "./components/AnswerDisplay";
import QuestionModal from "./components/QuestionModal";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { useLanguage } from "./contexts/LanguageContext";
import { getTarotReading } from "./services/openRouterService";
import "./styles/App.css";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

const pageTransition = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: springTransition,
};

function App() {
  const { t, language } = useLanguage();
  const [selectedCards, setSelectedCards] = useState([]);
  const [question, setQuestion] = useState("");
  const [stage, setStage] = useState("selection"); // selection, modal, thinking, answer
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = () => {
    if (!question.trim()) {
      setError(t("errorEnterQuestion"));
      return;
    }

    setError("");
    setShowModal(false);
    setStage("thinking");

    getTarotReading(selectedCards, question, language)
      .then((reading) => {
        setAnswer(reading);
        setTimeout(() => {
          setStage("answer");
        }, 2000);
      })
      .catch((err) => {
        console.error("Error:", err);
        setError(err.message || t("errorReading"));
        setStage("selection");
      });
  };

  const handleNewReading = () => {
    setSelectedCards([]);
    setQuestion("");
    setAnswer("");
    setError("");
    setStage("selection");
    setShowModal(false);

    // Scroll to top smoothly
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Show modal when 3 cards are selected
  useEffect(() => {
    if (selectedCards.length === 3 && stage === "selection") {
      setShowModal(true);
    }
  }, [selectedCards.length, stage]);

  return (
    <>
      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* Question Modal - render at root level */}
      <QuestionModal
        isOpen={showModal}
        question={question}
        selectedCards={selectedCards}
        onQuestionChange={setQuestion}
        onConfirm={handleSubmit}
        onCancel={() => setShowModal(false)}
      />

      <div className="app">
        {/* Floating particles background */}
        <div className="particles">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: 0,
              }}
              animate={{
                y: [0, -window.innerHeight - 50],
                x: [0, (Math.random() - 0.5) * 250],
                opacity: [0, 0.7, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 10 + Math.random() * 6,
                repeat: Infinity,
                delay: Math.random() * 8,
                ease: [0.42, 0, 0.58, 1],
              }}
            />
          ))}
        </div>

        <div className="content">
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={springTransition}
          >
            <motion.h1
              animate={{
                textShadow: [
                  "0 0 20px rgba(157, 78, 221, 0.3)",
                  "0 0 30px rgba(157, 78, 221, 0.5)",
                  "0 0 20px rgba(157, 78, 221, 0.3)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {t("title")}
            </motion.h1>
            <motion.p
              className="subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {t("subtitle")}
            </motion.p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springTransition}
              style={{
                background: "rgba(220, 38, 38, 0.2)",
                border: "1px solid rgba(220, 38, 38, 0.5)",
                padding: "1rem",
                borderRadius: "8px",
                textAlign: "center",
                marginBottom: "2rem",
                maxWidth: "600px",
                margin: "0 auto 2rem",
              }}
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {stage === "selection" && (
              <motion.div key="selection" {...pageTransition}>
                <CardSelection
                  selectedCards={selectedCards}
                  onCardSelect={setSelectedCards}
                  maxCards={3}
                />
              </motion.div>
            )}

            {stage === "thinking" && (
              <motion.div key="thinking" {...pageTransition}>
                <ThinkingAnimation />
              </motion.div>
            )}

            {stage === "answer" && (
              <motion.div key="answer" {...pageTransition}>
                <AnswerDisplay
                  cards={selectedCards}
                  answer={answer}
                  question={question}
                  onNewReading={handleNewReading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

export default App;
