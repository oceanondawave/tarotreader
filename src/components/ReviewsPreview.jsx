import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronRight, Quote, RefreshCw } from "lucide-react";
import { StarRating } from "./ReviewPage";
import { useLanguage } from "../contexts/LanguageContext";

function ReviewCard({ review, index }) {
    const date = review.timestamp
        ? new Date(review.timestamp).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
        : "";

    return (
        <motion.div
            className="review-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
        >
            <div className="review-card-header">
                <div className="review-card-user">
                    {review.picture ? (
                        <img src={review.picture} alt={review.name} className="review-card-avatar" />
                    ) : (
                        <div className="review-card-avatar review-avatar-placeholder">
                            {review.name?.charAt(0) || "U"}
                        </div>
                    )}
                    <div className="review-card-user-info">
                        <span className="review-card-name">{review.name}</span>
                        {date && <span className="review-card-date">{date}</span>}
                    </div>
                </div>
                <StarRating value={review.stars} readOnly size={16} />
            </div>
            <div className="review-card-body">
                <Quote className="review-quote-icon" size={16} />
                <p className="review-card-text">{review.review}</p>
            </div>
        </motion.div>
    );
}

function ReviewsPreview({ onViewAll, onLeaveReview }) {
    const { t } = useLanguage();
    const [reviews, setReviews] = useState([]);
    const [avgStars, setAvgStars] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/reviews");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            const r = data.reviews || [];
            setReviews(r.slice(0, 3));
            if (r.length > 0) {
                setAvgStars(
                    Math.round((r.reduce((sum, x) => sum + x.stars, 0) / r.length) * 10) / 10
                );
            }
        } catch {
            // Silently fail — reviews section just won't show
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    return (
        <motion.section
            className="reviews-preview"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            aria-label={t("recentReviews")}
        >
            {reviews.length > 0 && (
                <>
                    <div className="reviews-preview-header">
                        <div className="reviews-preview-title-row">
                            <h2 className="reviews-preview-title">{t("recentReviews")}</h2>
                            {avgStars > 0 && (
                                <div className="reviews-avg-badge" aria-label={`${avgStars} out of 5 stars average`}>
                                    <Star size={14} fill="currentColor" />
                                    <span>{avgStars}</span>
                                </div>
                            )}
                        </div>
                        <p className="reviews-preview-subtitle">{t("reviewsSubtitle")}</p>
                    </div>

                    <div className="reviews-cards-grid">
                        <AnimatePresence>
                            {reviews.map((review, i) => (
                                <ReviewCard key={review.id} review={review} index={i} />
                            ))}
                        </AnimatePresence>
                    </div>
                </>
            )}

            <div className="reviews-actions">
                {reviews.length > 0 && (
                    <button
                        className="reviews-view-all-btn"
                        onClick={onViewAll}
                        aria-label={t("viewAllReviews")}
                    >
                        {t("viewAllReviews")}
                        <ChevronRight size={18} />
                    </button>
                )}
                <button
                    className="reviews-leave-btn"
                    onClick={onLeaveReview || onViewAll}
                    aria-label={t("leaveAReview")}
                >
                    <Star size={16} />
                    {t("leaveAReview")}
                </button>
            </div>
        </motion.section>
    );
}

export { ReviewCard };
export default ReviewsPreview;
