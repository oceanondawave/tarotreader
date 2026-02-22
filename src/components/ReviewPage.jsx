import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, ArrowLeft, CheckCircle } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import googleDriveService from "../services/googleDriveService";

function StarRating({ value, onChange, readOnly = false, size = 32 }) {
    const [hovered, setHovered] = useState(0);

    return (
        <div
            className="star-rating"
            role={readOnly ? "img" : "radiogroup"}
            aria-label={readOnly ? `${value} stars` : "Rating"}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`star-btn ${readOnly ? "read-only" : ""}`}
                    onClick={() => !readOnly && onChange && onChange(star)}
                    onMouseEnter={() => !readOnly && setHovered(star)}
                    onMouseLeave={() => !readOnly && setHovered(0)}
                    aria-label={readOnly ? undefined : `${star} star${star > 1 ? "s" : ""}`}
                    aria-pressed={!readOnly ? value >= star : undefined}
                    disabled={readOnly}
                    tabIndex={readOnly ? -1 : 0}
                >
                    <Star
                        size={size}
                        fill={(hovered || value) >= star ? "currentColor" : "none"}
                        className={(hovered || value) >= star ? "star-filled" : "star-empty"}
                    />
                </button>
            ))}
        </div>
    );
}

function ReviewPage({ isSignedIn, userInfo, onBack }) {
    const { t } = useLanguage();
    const [stars, setStars] = useState(5);
    const [review, setReview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!review.trim() || !isSignedIn) return;

        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    stars,
                    review: review.trim(),
                    userInfo,
                    accessToken: googleDriveService.accessToken,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to submit review");
            }

            setSubmitted(true);
        } catch (err) {
            setError(err.message || t("reviewSubmitError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            className="review-page"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div className="review-page-inner">
                <button className="review-back-btn" onClick={onBack} aria-label={t("back")}>
                    <ArrowLeft size={18} />
                    {t("back")}
                </button>

                <div className="review-page-header">
                    <h1 className="review-page-title">{t("leaveAReview")}</h1>
                    <p className="review-page-subtitle">{t("reviewSubtitle")}</p>
                </div>

                <AnimatePresence mode="wait">
                    {submitted ? (
                        <motion.div
                            key="success"
                            className="review-success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                        >
                            <CheckCircle className="review-success-icon" size={56} />
                            <h2>{t("reviewThankYou")}</h2>
                            <p>{t("reviewSuccessMessage")}</p>
                            <button className="review-back-home-btn" onClick={onBack}>
                                {t("backToHome")}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {!isSignedIn ? (
                                <div className="review-signin-prompt">
                                    <Star className="review-signin-icon" size={40} />
                                    <h3>{t("signInToReview")}</h3>
                                    <p>{t("signInToReviewDesc")}</p>
                                    <button className="review-signin-btn" onClick={onBack}>
                                        {t("backToSignIn")}
                                    </button>
                                </div>
                            ) : (
                                <form className="review-form" onSubmit={handleSubmit} noValidate>
                                    {/* User identity */}
                                    <div className="review-user-row">
                                        {userInfo?.picture ? (
                                            <img
                                                src={userInfo.picture}
                                                alt={userInfo.name}
                                                className="review-user-avatar"
                                            />
                                        ) : (
                                            <div className="review-user-avatar review-avatar-placeholder">
                                                {userInfo?.name?.charAt(0) || "U"}
                                            </div>
                                        )}
                                        <span className="review-user-name">{userInfo?.name}</span>
                                    </div>

                                    {/* Stars */}
                                    <div className="review-field">
                                        <label className="review-label">{t("yourRating")}</label>
                                        <StarRating value={stars} onChange={setStars} size={36} />
                                        <p className="review-star-hint">
                                            {stars === 5 ? t("rating5") :
                                                stars === 4 ? t("rating4") :
                                                    stars === 3 ? t("rating3") :
                                                        stars === 2 ? t("rating2") : t("rating1")}
                                        </p>
                                    </div>

                                    {/* Review text */}
                                    <div className="review-field">
                                        <label className="review-label" htmlFor="review-text">
                                            {t("yourReview")}
                                            <span className="review-required" aria-hidden="true"> *</span>
                                        </label>
                                        <textarea
                                            id="review-text"
                                            className="review-textarea"
                                            placeholder={t("reviewPlaceholder")}
                                            value={review}
                                            onChange={(e) => setReview(e.target.value)}
                                            rows={5}
                                            maxLength={500}
                                            aria-required="true"
                                            aria-describedby="review-char-count"
                                        />
                                        <div id="review-char-count" className="review-char-count">
                                            {review.length}/500
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            className="review-error"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        className="review-submit-btn"
                                        disabled={!review.trim() || isSubmitting}
                                        aria-disabled={!review.trim() || isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <div className="loading-spinner" />
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                {t("submitReview")}
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export { StarRating };
export default ReviewPage;
