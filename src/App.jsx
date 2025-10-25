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
import GoogleSignIn from "./components/GoogleSignIn";
import UserInfoDialog from "./components/UserInfoDialog";
import SavedReadingsPage from "./components/SavedReadingsPage";
import { useLanguage } from "./contexts/LanguageContext";
import { getTarotReading } from "./services/chutesService";
import googleDriveService from "./services/googleDriveService";
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

  // Google Drive Integration
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [googleUserInfo, setGoogleUserInfo] = useState(null);
  const [step, setStep] = useState(1); // 1: question, 2: cards, 3: thinking, 4: answer
  const [question, setQuestion] = useState("");
  const [selectedCards, setSelectedCards] = useState([]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [currentPage, setCurrentPage] = useState("main"); // "main" or "saved-readings"
  const [isLoadedReading, setIsLoadedReading] = useState(false); // Track if current reading was loaded from saved readings
  const [showUserInfoDialog, setShowUserInfoDialog] = useState(false); // Show user info dialog for signed-in users
  const [isCreatingDriveFiles, setIsCreatingDriveFiles] = useState(false); // Track if Drive files are being created
  const [savedReadingDate, setSavedReadingDate] = useState(""); // Date of saved reading
  const [savedReadingTime, setSavedReadingTime] = useState(""); // Time of saved reading

  // Restore sign-in state from localStorage on mount
  useEffect(() => {
    const restoreSignInState = async () => {
      try {
        // Check if googleDriveService has saved state
        if (googleDriveService.isAuthenticated && googleDriveService.userInfo) {
          // Verify the token is still valid
          try {
            await googleDriveService.refreshTokenIfNeeded();
            // Token is valid, restore sign-in state
            setIsGoogleSignedIn(true);
            setGoogleUserInfo(googleDriveService.userInfo);
          } catch (error) {
            // Token is expired, clear the state
            googleDriveService.signOut();
            setIsGoogleSignedIn(false);
            setGoogleUserInfo(null);
          }
        }
      } catch (error) {
        // Silent error handling
      }
    };

    restoreSignInState();
  }, []); // Run only once on mount

  // Check for #verify in URL
  useEffect(() => {
    const checkHash = () => {
      setShowVerification(window.location.hash === "#verify");
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);

    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  // Monitor Drive file creation status
  useEffect(() => {
    if (isGoogleSignedIn) {
      const checkDriveCreation = () => {
        setIsCreatingDriveFiles(
          googleDriveService.creatingFolder ||
            googleDriveService.creatingSpreadsheet ||
            googleDriveService.savingReading
        );
      };

      // Check immediately
      checkDriveCreation();

      // Check periodically while signed in
      const interval = setInterval(checkDriveCreation, 100);
      return () => clearInterval(interval);
    }
  }, [isGoogleSignedIn]);

  // Check auth status periodically and on actions
  useEffect(() => {
    if (isGoogleSignedIn) {
      const checkAuth = async () => {
        try {
          // Only check if service is authenticated
          if (!googleDriveService.isAuthenticated) {
            handleGoogleSignOut();
            return;
          }

          const authStatus = await googleDriveService.checkAuthStatus();
          if (!authStatus.isValid) {
            handleGoogleSignOut();
          }
        } catch (error) {
          // Only sign out if it's a token expiration error
          if (error.message.includes("Token expired")) {
            handleGoogleSignOut();
          }
        }
      };

      // Check auth status on component mount
      checkAuth();

      // Set up periodic checking (every 10 minutes instead of 5)
      const interval = setInterval(checkAuth, 10 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isGoogleSignedIn]);

  // Check auth when navigating to saved readings page
  useEffect(() => {
    if (currentPage === "saved-readings" && isGoogleSignedIn) {
      const checkAuthOnPage = async () => {
        try {
          if (googleDriveService.isAuthenticated) {
            await googleDriveService.refreshTokenIfNeeded();
          }

          if (!googleDriveService.isAuthenticated) {
            handleGoogleSignOut();
            setCurrentPage("main");
            setStep(1);
          }
        } catch (error) {
          handleGoogleSignOut();
          setCurrentPage("main");
          setStep(1);
        }
      };

      checkAuthOnPage();
    }
  }, [currentPage, isGoogleSignedIn]);

  // Handle saved reading URLs
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#result?")) {
        const params = new URLSearchParams(hash.substring(8));
        const readingId = params.get("readingId");
        const question = params.get("question");
        const cards = JSON.parse(params.get("cards") || "[]");
        const answer = params.get("answer");
        const language = params.get("language");

        if (readingId && question && cards && answer) {
          setQuestion(question);
          setSelectedCards(cards);
          setAnswer(answer);
          setStep(4); // Go directly to result page
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
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

  // Google Drive Integration Handlers
  const handleGoogleSignIn = async (userInfo) => {
    if (userInfo) {
      // Called from GoogleSignIn component
      setIsGoogleSignedIn(true);
      setGoogleUserInfo(userInfo);
    } else {
      // Called from main page sign-in button - need to call service
      try {
        const result = await googleDriveService.signIn();
        setIsGoogleSignedIn(true);
        setGoogleUserInfo(result);
      } catch (error) {
        // Silent error handling
      }
    }
  };

  const handleGoogleSignOut = () => {
    googleDriveService.signOut();
    setIsGoogleSignedIn(false);
    setGoogleUserInfo(null);
  };

  const handleSheetNotFound = () => {
    handleGoogleSignOut();
    setCurrentPage("main"); // Return to main page
    setStep(1); // Reset to step 1
    alert("Spreadsheet was deleted. You have been signed out.");
  };

  const handleReadingSaved = () => {
    // This will be called when a reading is saved to update the hasReadings state
    if (window.updateHasReadings) {
      window.updateHasReadings();
    }
  };

  const handleCancelReset = () => {
    setShowConfirmModal(false);
    setPendingNavigation(null);
  };

  // Navigation handlers
  const handleViewSavedReadings = async () => {
    try {
      // Check if user is still authenticated before navigating
      if (googleDriveService.isAuthenticated) {
        await googleDriveService.refreshTokenIfNeeded();
      }

      // If still authenticated after refresh, navigate
      if (googleDriveService.isAuthenticated) {
        setCurrentPage("saved-readings");
        setShowUserInfoDialog(false); // Close the dialog when navigating
      } else {
        // Token expired, sign out
        handleGoogleSignOut();
      }
    } catch (error) {
      // If error during check, sign out and stay on main page
      handleGoogleSignOut();
    }
  };

  const handleBackToMain = () => {
    setCurrentPage("main");
    setStep(1); // Reset to step 1 to show the main screen
    setIsLoadedReading(false); // Clear loaded reading flag
    setSavedReadingDate(""); // Clear saved date
    setSavedReadingTime(""); // Clear saved time
    // Clear the question, cards, and answer from the saved reading
    setQuestion("");
    setSelectedCards([]);
    setAnswer("");
  };

  const handleViewReading = (reading) => {
    setQuestion(reading.question);
    setSelectedCards(reading.cards);
    setAnswer(reading.answer);
    setIsLoadedReading(true); // Mark as loaded reading to prevent auto-save
    setSavedReadingDate(reading.date || ""); // Save the date
    setSavedReadingTime(reading.time || ""); // Save the time
    setStep(4); // Go directly to result page
    setCurrentPage("main");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToSavedReadings = () => {
    setCurrentPage("saved-readings");
    setSavedReadingDate("");
    setSavedReadingTime("");
    setIsLoadedReading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // User info dialog handlers
  const handleShowUserInfo = () => {
    setShowUserInfoDialog(true);
  };

  const handleCloseUserInfo = () => {
    setShowUserInfoDialog(false);
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
        setError(err.message || t("errorReading"));
        // Clear selected cards and flip state by resetting selection
        setSelectedCards([]);
        setStep(2);
      });
  };

  const handleNewReading = () => {
    setQuestion("");
    setSelectedCards([]);
    setAnswer("");
    setError("");
    setIsLoadedReading(false); // Reset loaded reading flag
    setSavedReadingDate(""); // Clear saved date
    setSavedReadingTime(""); // Clear saved time
    setStep(1);

    // Scroll to top smoothly
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Show verification page if #verify in URL
  if (showVerification) {
    return (
      <>
        {/* User Info Dialog for signed-in users */}
        <UserInfoDialog
          isOpen={showUserInfoDialog}
          onClose={handleCloseUserInfo}
          onViewSavedReadings={handleViewSavedReadings}
          onSignOut={handleGoogleSignOut}
          userInfo={googleUserInfo}
        />
        <CardVerification />
      </>
    );
  }

  // Show saved readings page
  if (currentPage === "saved-readings") {
    return (
      <>
        {/* User Info Dialog for signed-in users */}
        <UserInfoDialog
          isOpen={showUserInfoDialog}
          onClose={handleCloseUserInfo}
          onViewSavedReadings={handleViewSavedReadings}
          onSignOut={handleGoogleSignOut}
          userInfo={googleUserInfo}
        />
        <SavedReadingsPage
          onBack={handleBackToMain}
          onViewReading={handleViewReading}
          onSheetNotFound={handleSheetNotFound}
        />
      </>
    );
  }

  return (
    <>
      {/* User Info Dialog for signed-in users */}
      <UserInfoDialog
        isOpen={showUserInfoDialog}
        onClose={handleCloseUserInfo}
        onViewSavedReadings={handleViewSavedReadings}
        onSignOut={handleGoogleSignOut}
        userInfo={googleUserInfo}
      />

      {/* Bottom Action Buttons - Only show on step 1 (main screen) */}
      {step === 1 && (
        <div className="bottom-actions">
          <div className="bottom-actions-stack">
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
        </div>
      )}

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
                {/* Google Drive Integration - At the top */}
                {isGoogleSignedIn ? (
                  <GoogleSignIn
                    onSignIn={handleGoogleSignIn}
                    onSignOut={handleGoogleSignOut}
                    isSignedIn={isGoogleSignedIn}
                    userInfo={googleUserInfo}
                    onReadingSaved={handleReadingSaved}
                    onViewSavedReadings={handleViewSavedReadings}
                    onShowUserInfo={handleShowUserInfo}
                    isCreatingDriveFiles={isCreatingDriveFiles}
                  />
                ) : (
                  <div className="sign-in-prompt">
                    <div className="sign-in-content">
                      <h3>💾 {t("saveToDrive")}</h3>
                      <p>{t("signInPrompt")}</p>
                      <p className="sign-in-privacy">🔒 {t("privacyInfo")}</p>
                      <button
                        className="sign-in-prompt-button"
                        onClick={() => handleGoogleSignIn()}
                        aria-label={t("signInWithGoogle")}
                      >
                        <span className="google-icon">🔐</span>
                        {t("signInWithGoogle")}
                      </button>
                    </div>
                  </div>
                )}

                <QuestionStep
                  question={question}
                  onQuestionChange={setQuestion}
                  onContinue={handleContinueToCards}
                />

                {/* Service Caution */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    textAlign: "center",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                    marginTop: "2rem",
                    lineHeight: "1.5",
                    padding: "0 1rem",
                  }}
                >
                  {t("serviceCaution")}
                </motion.p>
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
                  isGoogleSignedIn={isGoogleSignedIn}
                  onReadingSaved={handleReadingSaved}
                  isLoadedReading={isLoadedReading}
                  savedReadingDate={savedReadingDate}
                  savedReadingTime={savedReadingTime}
                  onBackToSavedReadings={handleBackToSavedReadings}
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
