import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronRight, Quote, RefreshCw } from "lucide-react";
import { StarRating } from "./ReviewPage";
import { useLanguage } from "../contexts/LanguageContext";

function ReviewCard({ review, index }) {
    const { language } = useLanguage();
    const locale = language === "vi" ? "vi-VN" : "en-US";

    const date = review.timestamp
        ? new Date(review.timestamp).toLocaleDateString(locale, {
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

function ReviewSkeleton({ index }) {
    return (
        <motion.div
            className="review-card review-card-skeleton"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
        >
            <div className="review-card-header">
                <div className="review-card-user">
                    <div className="skeleton skeleton-avatar"></div>
                    <div className="review-card-user-info" style={{ width: '100px' }}>
                        <div className="skeleton skeleton-text" style={{ marginBottom: '4px' }}></div>
                        <div className="skeleton skeleton-text short" style={{ height: '10px' }}></div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ width: '16px', height: '16px', borderRadius: '50%' }}></div>
                    ))}
                </div>
            </div>
            <div className="review-card-body">
                <div className="skeleton skeleton-text" style={{ marginTop: '12px' }}></div>
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text short"></div>
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

            // Calculate average stars from ALL reviews before slicing
            if (r.length > 0) {
                setAvgStars(
                    Math.round((r.reduce((sum, x) => sum + x.stars, 0) / r.length) * 10) / 10
                );
            }

            setReviews(r.slice(0, 3));
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
                <AnimatePresence mode="wait">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <ReviewSkeleton key={`skeleton-${i}`} index={i} />
                        ))
                    ) : (
                        reviews.map((review, i) => (
                            <ReviewCard key={review.id} review={review} index={i} />
                        ))
                    )}
                </AnimatePresence>
            </div>

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
