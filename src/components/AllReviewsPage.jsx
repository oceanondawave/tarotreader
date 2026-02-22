import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, RefreshCw, PenLine } from "lucide-react";
import { StarRating } from "./ReviewPage";
import { ReviewCard } from "./ReviewsPreview";
import { useLanguage } from "../contexts/LanguageContext";

function AllReviewsPage({ isSignedIn, onBack, onWriteReview }) {
    const { t } = useLanguage();
    const [reviews, setReviews] = useState([]);
    const [avgStars, setAvgStars] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/reviews");
            if (!res.ok) throw new Error("Failed to fetch reviews");
            const data = await res.json();
            const r = data.reviews || [];
            setReviews(r);
            if (r.length > 0) {
                setAvgStars(
                    Math.round((r.reduce((sum, x) => sum + x.stars, 0) / r.length) * 10) / 10
                );
            }
        } catch (err) {
            setError(err.message || t("reviewFetchError"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // Distribution of stars
    const starDist = [5, 4, 3, 2, 1].map((s) => ({
        stars: s,
        count: reviews.filter((r) => r.stars === s).length,
        pct: reviews.length > 0
            ? Math.round((reviews.filter((r) => r.stars === s).length / reviews.length) * 100)
            : 0,
    }));

    return (
        <motion.div
            className="all-reviews-page"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div className="all-reviews-inner">
                <button className="review-back-btn" onClick={onBack} aria-label={t("back")}>
                    <ArrowLeft size={18} />
                    {t("back")}
                </button>

                {/* Header */}
                <div className="all-reviews-header">
                    <h1 className="all-reviews-title">{t("allReviews")}</h1>
                    {avgStars > 0 && (
                        <div className="all-reviews-summary">
                            <div className="all-reviews-avg">
                                <span className="all-reviews-avg-number">{avgStars}</span>
                                <div>
                                    <StarRating value={Math.round(avgStars)} readOnly size={20} />
                                    <p className="all-reviews-count">
                                        {reviews.length} {reviews.length === 1 ? t("review") : t("reviews")}
                                    </p>
                                </div>
                            </div>
                            <div className="all-reviews-dist">
                                {starDist.map(({ stars, count, pct }) => (
                                    <div key={stars} className="dist-row">
                                        <span className="dist-label">{stars}</span>
                                        <Star size={12} fill="currentColor" className="dist-star" />
                                        <div className="dist-bar-bg" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                                            <motion.div
                                                className="dist-bar-fill"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                                            />
                                        </div>
                                        <span className="dist-count">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Write review CTA */}
                <button className="all-reviews-write-btn" onClick={onWriteReview}>
                    <PenLine size={18} />
                    {isSignedIn ? t("leaveAReview") : t("signInToReview")}
                </button>

                {/* Review list */}
                {loading ? (
                    <div className="reviews-loading">
                        <RefreshCw className="spinning" size={32} />
                        <p>{t("loadingReviews")}</p>
                    </div>
                ) : error ? (
                    <div className="reviews-error">
                        <p>{error}</p>
                        <button className="review-retry-btn" onClick={fetchReviews}>
                            <RefreshCw size={16} />
                            {t("retry")}
                        </button>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="reviews-empty">
                        <Star size={48} className="reviews-empty-icon" />
                        <h3>{t("noReviewsYet")}</h3>
                        <p>{t("beFirstReview")}</p>
                    </div>
                ) : (
                    <div className="all-reviews-list">
                        <AnimatePresence>
                            {reviews.map((review, i) => (
                                <ReviewCard key={review.id} review={review} index={Math.min(i, 8)} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default AllReviewsPage;
