import { useState, useEffect, useCallback, useRef } from "react";
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
    const mainRef = useRef(null);

    // Move focus to content on mount
    useEffect(() => {
        if (mainRef.current) mainRef.current.focus();
    }, []);

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

    const starDist = [5, 4, 3, 2, 1].map((s) => ({
        stars: s,
        count: reviews.filter((r) => r.stars === s).length,
        pct: reviews.length > 0
            ? Math.round((reviews.filter((r) => r.stars === s).length / reviews.length) * 100)
            : 0,
    }));

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
                    <h1>{t("allReviews")}</h1>
                </div>
            </div>

            {/* Scrollable body */}
            <main
                className="all-reviews-page"
                tabIndex={-1}
                ref={mainRef}
                aria-label={t("allReviews")}
            >
                <div className="all-reviews-inner">

                    {/* Rating summary card */}
                    {!loading && reviews.length > 0 && (
                        <div className="all-reviews-header">
                            <div className="all-reviews-summary" aria-label={`Average rating: ${avgStars} out of 5 from ${reviews.length} ${reviews.length === 1 ? t("review") : t("reviews")}`}>
                                <div className="all-reviews-avg">
                                    <span className="all-reviews-avg-number" aria-hidden="true">{avgStars}</span>
                                    <div>
                                        <StarRating value={Math.round(avgStars)} readOnly size={20} />
                                        <p className="all-reviews-count">
                                            {reviews.length} {reviews.length === 1 ? t("review") : t("reviews")}
                                        </p>
                                    </div>
                                </div>
                                <div className="all-reviews-dist" aria-hidden="true">
                                    {starDist.map(({ stars, count, pct }) => (
                                        <div key={stars} className="dist-row">
                                            <span className="dist-label">{stars}</span>
                                            <Star size={12} fill="currentColor" className="dist-star" aria-hidden="true" />
                                            <div
                                                className="dist-bar-bg"
                                                role="progressbar"
                                                aria-valuenow={pct}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                aria-label={`${stars} stars: ${count} reviews`}
                                            >
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
                        </div>
                    )}

                    {/* Write review CTA */}
                    <button
                        className="all-reviews-write-btn"
                        onClick={onWriteReview}
                        aria-label={isSignedIn ? t("leaveAReview") : t("signInToReview")}
                    >
                        <PenLine size={18} aria-hidden="true" />
                        {isSignedIn ? t("leaveAReview") : t("signInToReview")}
                    </button>

                    {/* Review list — aria-live so screen readers announce loading changes */}
                    <div aria-live="polite" aria-atomic="false">
                        {loading ? (
                            <div className="reviews-loading" role="status">
                                <RefreshCw className="spinning" size={32} aria-hidden="true" />
                                <p>{t("loadingReviews")}</p>
                            </div>
                        ) : error ? (
                            <div className="reviews-error" role="alert">
                                <p>{error}</p>
                                <button
                                    className="review-retry-btn"
                                    onClick={fetchReviews}
                                    aria-label={t("retry")}
                                >
                                    <RefreshCw size={16} aria-hidden="true" />
                                    {t("retry")}
                                </button>
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="reviews-empty" role="status">
                                <Star size={48} className="reviews-empty-icon" aria-hidden="true" />
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
                </div>
            </main>
        </motion.div>
    );
}

export default AllReviewsPage;
