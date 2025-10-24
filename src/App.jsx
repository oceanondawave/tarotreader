import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QuestionStep from "./components/QuestionStep";
import CardSelection from "./components/CardSelection";
import ThinkingAnimation from "./components/ThinkingAnimation";
import AnswerDisplay from "./components/AnswerDisplay";
import LanguageSwitcher from "./components/LanguageSwitcher";
import StepNavigation from "./components/StepNavigation";
import ConfirmationModal from "./components/ConfirmationModal";
import CardVerification from "./components/CardVerification";
import { useLanguage } from "./contexts/LanguageContext";
import { getTarotReading } from "./services/chutesService";
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
  const [showVerification, setShowVerification] = useState(false);
  const [step, setStep] = useState(1); // 1: question, 2: cards, 3: thinking, 4: answer
  const [question, setQuestion] = useState("");
  const [selectedCards, setSelectedCards] = useState([]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Check for #verify in URL
  useEffect(() => {
    const checkHash = () => {
      setShowVerification(window.location.hash === "#verify");
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);

    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  // Scroll to top on page refresh/load
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // Memoize particles to prevent regeneration on re-renders
  const particles = useMemo(() => {
    return [...Array(50)].map((_, i) => ({
      id: i,
      startX: Math.random() * 100,
      startY: Math.random() * 100,
      twinkleDuration: 5 + Math.random() * 10,
      size: 2 + Math.random() * 3,
      delay: Math.random() * 5,
    }));
  }, []);

  const handleContinueToCards = () => {
    setStep(2);
    setSelectedCards([]); // Reset cards when moving to step 2

    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleBackToQuestion = () => {
    // If there are selected cards, show confirmation
    if (selectedCards.length > 0) {
      setPendingNavigation("step1");
      setShowConfirmModal(true);
    } else {
      setStep(1);

      // Scroll to top
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleStepClick = (stepNumber) => {
    // Allow clicking on step 1
    if (stepNumber === 1) {
      handleBackToQuestion();
    }
    // Allow clicking step 2 if question is filled
    if (stepNumber === 2 && question.trim()) {
      setStep(2);
      setSelectedCards([]); // Reset cards when navigating to step 2

      // Scroll to top
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleConfirmReset = () => {
    setSelectedCards([]);
    setStep(1);
    setShowConfirmModal(false);
    setPendingNavigation(null);

    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCancelReset = () => {
    setShowConfirmModal(false);
    setPendingNavigation(null);
  };

  const handleSubmitReading = () => {
    if (selectedCards.length !== 3) {
      setError(t("errorSelectCards"));
      return;
    }

    setError("");
    setStep(3);

    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    getTarotReading(selectedCards, question, language)
      .then((reading) => {
        setAnswer(reading);
        setTimeout(() => {
          setStep(4);
        }, 2000);
      })
      .catch((err) => {
        console.error("Error:", err);
        setError(err.message || t("errorReading"));
        setStep(2);
      });
  };

  const handleNewReading = () => {
    setQuestion("");
    setSelectedCards([]);
    setAnswer("");
    setError("");
    setStep(1);

    // Scroll to top smoothly
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Show verification page if #verify in URL
  if (showVerification) {
    return <CardVerification />;
  }

  return (
    <>
      {/* Bottom Action Buttons */}
      <div className="bottom-actions">
        <LanguageSwitcher />

        <div className="view-all-cards-button-container">
          <motion.a
            href="#verify"
            className="view-all-cards-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🃏 {t("viewAllCards")}
          </motion.a>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
      />

      <div className="app">
        {/* Step Navigation - only show on steps 1 and 2 */}
        {(step === 1 || step === 2) && (
          <StepNavigation
            currentStep={step}
            onStepClick={handleStepClick}
            hasQuestion={question.trim().length > 0}
          />
        )}
        {/* Twinkling stars background */}
        <div className="particles">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="particle star"
              style={{
                left: `${particle.startX}%`,
                top: `${particle.startY}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.8, 1.2, 0.8],
                boxShadow: [
                  "0 0 2px rgba(157, 78, 221, 0.3)",
                  "0 0 8px rgba(157, 78, 221, 0.8), 0 0 12px rgba(157, 78, 221, 0.5)",
                  "0 0 2px rgba(157, 78, 221, 0.3)",
                ],
              }}
              transition={{
                duration: particle.twinkleDuration,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeInOut",
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
            {step === 1 && (
              <motion.div key="question" {...pageTransition}>
                <QuestionStep
                  question={question}
                  onQuestionChange={setQuestion}
                  onContinue={handleContinueToCards}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="selection" {...pageTransition}>
                <CardSelection
                  selectedCards={selectedCards}
                  onCardSelect={setSelectedCards}
                  onBack={handleBackToQuestion}
                  onSubmit={handleSubmitReading}
                  maxCards={3}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="thinking" {...pageTransition}>
                <ThinkingAnimation />
              </motion.div>
            )}

            {step === 4 && (
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

        {/* Author Information */}
        <motion.div
          className="author-info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, ...springTransition }}
        >
          <p>
            By @oceanondawave / Powered by{" "}
            <a
              href="https://cursor.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-link"
            >
              Cursor
            </a>
          </p>
        </motion.div>
      </div>
    </>
  );
}

export default App;
