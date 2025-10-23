import { motion } from "framer-motion";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

function QuestionInput({ question, onQuestionChange, onSubmit, disabled }) {
  const handleSubmit = () => {
    if (question.trim()) {
      onSubmit();
    }
  };

  return (
    <motion.div
      className="question-section"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, ...springTransition }}
    >
      <motion.h2
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, ...springTransition }}
      >
        Ask Your Question
      </motion.h2>
      <motion.div
        className="question-input-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <textarea
          className="question-input"
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="What guidance do you seek from the cards?"
          disabled={disabled}
        />
      </motion.div>
      <motion.button
        className="submit-button"
        onClick={handleSubmit}
        disabled={disabled || !question.trim()}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, ...springTransition }}
        whileHover={{
          scale: 1.05,
          transition: { ...springTransition, stiffness: 400 },
        }}
        whileTap={{ scale: 0.95 }}
      >
        Reveal The Reading
      </motion.button>
    </motion.div>
  );
}

export default QuestionInput;
