import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import { Check } from "lucide-react";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

function StepNavigation({ currentStep, onStepClick, hasQuestion }) {
  const { t } = useLanguage();

  const steps = [
    { number: 1, label: t("yourQuestion") },
    { number: 2, label: t("chooseCards", { count: 3 }) },
  ];

  return (
    <div className="step-navigation-bar">
      <div className="step-navigation-container">
        {steps.map((step, index) => {
          const isActive = currentStep === step.number;
          // Step 1 is completed if we're past it OR if question is filled
          // Step 2+ is completed if we're past it
          const isCompleted =
            step.number === 1
              ? currentStep > 1 || (currentStep === 1 && hasQuestion)
              : currentStep > step.number;
          // Step 1 is always clickable
          // Step 2 is clickable if question is filled
          const isClickable =
            step.number === 1 || (step.number === 2 && hasQuestion);

          return (
            <div key={step.number} className="step-item-wrapper">
              <motion.div
                className={`step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""
                  }`}
                onClick={() => isClickable && onStepClick(step.number)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && isClickable) {
                    e.preventDefault();
                    onStepClick(step.number);
                  }
                }}
                role="button"
                tabIndex={isClickable ? 0 : -1}
                aria-label={`${step.label}, ${isActive
                  ? t("current")
                  : isCompleted
                    ? t("completed")
                    : t("notCompleted")
                  }`}
                aria-current={isActive ? "step" : undefined}
                whileHover={isClickable ? { scale: 1.05 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
                style={{ cursor: isClickable ? "pointer" : "not-allowed" }}
              >
                <motion.div
                  className="step-circle"
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isActive
                      ? "var(--accent-primary)"
                      : isCompleted
                        ? "var(--accent-secondary)"
                        : "var(--bg-card)",
                  }}
                  transition={springTransition}
                >
                  {isCompleted ? (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={springTransition}
                    >
                      <Check strokeWidth={3} size={16} />
                    </motion.span>
                  ) : (
                    step.number
                  )}
                </motion.div>
                <motion.span
                  className="step-label"
                  initial={false}
                  animate={{
                    color: isActive
                      ? "var(--accent-glow)"
                      : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                  transition={springTransition}
                >
                  {step.label}
                </motion.span>
              </motion.div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="step-connector">
                  <motion.div
                    className="step-connector-progress"
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX: currentStep >= 2 ? 1 : hasQuestion ? 0.5 : 0,
                    }}
                    transition={springTransition}
                    style={{ transformOrigin: "left" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StepNavigation;
