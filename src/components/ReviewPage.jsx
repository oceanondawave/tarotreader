import { useState, useEffect, useRef } from "react";
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
            aria-label={readOnly ? `${value} out of 5 stars` : "Select a star rating"}
        >
            {!readOnly && (
                <div className="sr-only" aria-live="polite">
                    {value} out of 5 stars selected
                </div>
            )}
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    role={readOnly ? "presentation" : "radio"}
                    className={`star-btn ${readOnly ? "read-only" : ""}`}
                    onClick={() => !readOnly && onChange && onChange(star)}
                    onMouseEnter={() => !readOnly && setHovered(star)}
                    onMouseLeave={() => !readOnly && setHovered(0)}
                    aria-label={readOnly ? undefined : `${star} star${star > 1 ? "s" : ""}`}
                    aria-checked={!readOnly ? value === star : undefined}
                    disabled={readOnly}
                    tabIndex={readOnly ? -1 : (value === star ? 0 : -1)} // Radio group focus management
                >
                    <Star
                        size={size}
                        fill={(hovered || value) >= star ? "currentColor" : "none"}
                        className={(hovered || value) >= star ? "star-filled" : "star-empty"}
                        aria-hidden="true"
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
    const mainRef = useRef(null);

    // Move focus to main content when page loads
    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.focus();
        }
    }, []);

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

    const starHint = stars === 5 ? t("rating5") :
        stars === 4 ? t("rating4") :
            stars === 3 ? t("rating3") :
                stars === 2 ? t("rating2") : t("rating1");

    return (
        <motion.div
            className="review-page-wrapper"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
        >
            {/* Sticky header — same pattern as SavedReadingsPage */}
            <div className="sticky-header-group">
                <div className="page-header">
                    <button className="back-button" onClick={onBack} aria-label={t("back")}>
                        <ArrowLeft size={18} aria-hidden="true" />
                        {t("back")}
                    </button>
                    <h1>{t("leaveAReview")}</h1>
                </div>
            </div>

            {/* Scrollable body */}
            <main
                id="review-main"
                className="review-page"
                tabIndex={-1}
                ref={mainRef}
                aria-label={t("leaveAReview")}
            >
                <div className="review-page-inner">
                    <p className="review-page-subtitle">{t("reviewSubtitle")}</p>

                    <div style={{ height: "1.75rem" }} />

                    <AnimatePresence mode="wait">
                        {submitted ? (
                            <motion.div
                                key="success"
                                className="review-success"
                                role="status"
                                aria-live="polite"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4 }}
                            >
                                <CheckCircle className="review-success-icon" size={56} aria-hidden="true" />
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
                                    <div className="review-signin-prompt" role="region" aria-label={t("signInToReview")}>
                                        <Star className="review-signin-icon" size={40} aria-hidden="true" />
                                        <h3>{t("signInToReview")}</h3>
                                        <p>{t("signInToReviewDesc")}</p>
                                        <button className="review-signin-btn" onClick={onBack}>
                                            {t("backToSignIn")}
                                        </button>
                                    </div>
                                ) : (
                                    <form className="review-form" onSubmit={handleSubmit} noValidate aria-label={t("leaveAReview")}>
                                        {/* Signed-in user info */}
                                        <div className="review-user-row" aria-label={`Reviewing as ${userInfo?.name}`}>
                                            {userInfo?.picture ? (
                                                <img
                                                    src={userInfo.picture}
                                                    alt={`${userInfo.name}'s profile`}
                                                    className="review-user-avatar"
                                                />
                                            ) : (
                                                <div
                                                    className="review-user-avatar review-avatar-placeholder"
                                                    aria-hidden="true"
                                                >
                                                    {userInfo?.name?.charAt(0) || "U"}
                                                </div>
                                            )}
                                            <span className="review-user-name">{userInfo?.name}</span>
                                        </div>

                                        {/* Stars */}
                                        <div className="review-field">
                                            <label className="review-label" id="rating-label">{t("yourRating")}</label>
                                            <StarRating
                                                value={stars}
                                                onChange={setStars}
                                                size={36}
                                            />
                                            {/* aria-live so screen readers announce the rating label */}
                                            <p
                                                className="review-star-hint"
                                                aria-live="polite"
                                                aria-atomic="true"
                                            >
                                                {starHint}
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
                                            <div
                                                id="review-char-count"
                                                className="review-char-count"
                                                aria-live="polite"
                                                aria-atomic="true"
                                            >
                                                {review.length}/500
                                            </div>
                                        </div>

                                        {/* Error */}
                                        {error && (
                                            <div
                                                className="review-error"
                                                role="alert"
                                                aria-live="assertive"
                                            >
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            className="review-submit-btn"
                                            disabled={!review.trim() || isSubmitting}
                                            aria-disabled={!review.trim() || isSubmitting}
                                            aria-describedby={!review.trim() ? "review-required-hint" : undefined}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="loading-spinner" aria-hidden="true" />
                                                    <span className="sr-only">Submitting…</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={18} aria-hidden="true" />
                                                    {t("submitReview")}
                                                </>
                                            )}
                                        </button>
                                        {!review.trim() && (
                                            <span id="review-required-hint" className="sr-only">
                                                {t("yourReview")} is required
                                            </span>
                                        )}
                                    </form>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </motion.div>
    );
}

export { StarRating };
export default ReviewPage;
