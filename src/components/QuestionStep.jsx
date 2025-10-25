import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

function QuestionStep({ question, onQuestionChange, onContinue }) {
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onContinue();
    }
  };

  return (
    <motion.div
      className="question-step"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={springTransition}
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...springTransition }}
      >
        {t("yourQuestion")}
      </motion.h2>

      <motion.p
        className="step-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {t("questionStepSubtitle")}
      </motion.p>

      <motion.p
        className="privacy-notice"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        🔒 {t("privacyNoticeDetail")}
      </motion.p>

      <form onSubmit={handleSubmit}>
        <motion.textarea
          className="question-textarea"
          placeholder={t("questionPlaceholder")}
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          rows={4}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, ...springTransition }}
        />

        <motion.button
          type="submit"
          className="continue-button"
          disabled={!question.trim()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, ...springTransition }}
          whileHover={{ scale: question.trim() ? 1.05 : 1 }}
          whileTap={{ scale: question.trim() ? 0.95 : 1 }}
          aria-label={t("continueToCards")}
          aria-disabled={!question.trim()}
        >
          {t("continueToCards")}
        </motion.button>
      </form>
    </motion.div>
  );
}

export default QuestionStep;
