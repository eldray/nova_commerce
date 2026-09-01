import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, ShoppingCart, Heart, Star } from "lucide-react";
import { usePublicStore } from "../helpers/usePublicStore";
import { usePublicProducts } from "../helpers/usePublicProducts";
import { useCart } from "../helpers/CartContext";
import { useWishlist } from "../helpers/useWishlist";
import { useReviews } from "../helpers/useReviews";
import { StarRating } from "../components/StarRating";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import { Input } from "../components/Input";
import { Textarea } from "../components/Textarea";
import styles from "./product.[slug].module.css";

const formatMoney = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

interface Review {
    id: string;
    productId: string;
    customerId: string;
    customerName: string;
    rating: number;
    title: string;
    comment: string;
    status: 'approved' | 'pending' | 'rejected';
    helpfulCount: number;
    createdAt: string;
}

export default function ProductDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { data: storeData } = usePublicStore();
    const store = storeData?.store;
    const currency = store?.currency ?? "GHS";
    const { data: productsData } = usePublicProducts(store?.tenantId);
    const { addItem } = useCart();
    const { addToWishlist, isInWishlist } = useWishlist();
    const { getProductReviews, submitReview, loading: reviewsLoading } = useReviews();

    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        title: "",
        comment: "",
    });
    const [reviews, setReviews] = useState<Review[]>([]);
    const [submittingReview, setSubmittingReview] = useState(false);

    const product = productsData?.products.find((p) => p.slug === slug);
    const outOfStock = product ? product.stockQuantity <= 0 : false;

    useEffect(() => {
        if (slug && store?.tenantId) {
            loadReviews();
        }
    }, [slug, store?.tenantId]);

    const loadReviews = async () => {
        try {
            // Find product ID from slug
            const productItem = productsData?.products.find((p) => p.slug === slug);
            if (productItem) {
                const fetchedReviews = await getProductReviews(String(productItem.id), 'approved');
                setReviews(fetchedReviews || []);
            }
        } catch (err) {
            console.error("Failed to load reviews:", err);
        }
    };

    const handleAddToCart = () => {
        if (!product) return;
        addItem({
            productId: product.id,
            name: product.name,
            price: Number(product.salePrice ?? product.price),
            quantity,
            slug: product.slug,
            imageUrl: product.imageUrl,
        });
        navigate("/cart");
    };

    const handleWishlistToggle = () => {
        if (!product) return;
        addToWishlist({
            productId: product.id,
            name: product.name,
            price: Number(product.salePrice ?? product.price),
            slug: product.slug,
            imageUrl: product.imageUrl,
        });
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        setSubmittingReview(true);
        try {
            await submitReview({
                productId: String(product.id),
                rating: reviewForm.rating,
                title: reviewForm.title,
                comment: reviewForm.comment,
            });
            setReviewForm({ rating: 5, title: "", comment: "" });
            setShowReviewForm(false);
            loadReviews();
            alert("Review submitted! It will appear after approval.");
        } catch (err: any) {
            alert(err.message || "Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    if (!product) {
        return (
            <div className={styles.wrapper}>
                <Helmet>
                    <title>Product Not Found — {store?.storeName ?? "Nova Commerce"}</title>
                </Helmet>
                <div className={styles.notFound}>
                    <Package size={48} />
                    <h1>Product Not Found</h1>
                    <p>This product may have been removed or doesn't exist.</p>
                    <Link to="/shop">
                        <Button>Continue Shopping</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const displayPrice = Number(product.salePrice ?? product.price);
    const hasDiscount = !!product.salePrice;

    return (
        <div className={styles.wrapper}>
            <Helmet>
                <title>{product.name} — {store?.storeName ?? "Nova Commerce"}</title>
            </Helmet>

            <div className={styles.breadcrumb}>
                <Link to="/shop" className={styles.backLink}>
                    <ArrowLeft size={16} /> Back to Shop
                </Link>
            </div>

            <div className={styles.container}>
                {/* Image Gallery */}
                <div className={styles.imageSection}>
                    <div className={styles.mainImage}>
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} />
                        ) : (
                            <div className={styles.placeholder}>
                                <Package size={48} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Info */}
                <div className={styles.infoSection}>
                    <h1 className={styles.productName}>{product.name}</h1>

                    {reviews.length > 0 && (
                        <div className={styles.ratingSummary}>
                            <StarRating rating={averageRating} readonly />
                            <span className={styles.ratingCount}>
                                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                            </span>
                        </div>
                    )}

                    <div className={styles.priceSection}>
                        <span className={styles.price}>{formatMoney(displayPrice, currency)}</span>
                        {hasDiscount && (
                            <span className={styles.comparePrice}>
                                {formatMoney(Number(product.price), currency)}
                            </span>
                        )}
                    </div>

                    <div className={styles.stockStatus}>
                        {outOfStock ? (
                            <span className={styles.outOfStock}>Out of Stock</span>
                        ) : (
                            <span className={styles.inStock}>In Stock ({product.stockQuantity} available)</span>
                        )}
                    </div>

                    <div className={styles.quantitySelector}>
                        <label>Quantity:</label>
                        <div className={styles.quantityControls}>
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={outOfStock}
                                className={styles.qtyBtn}
                            >
                                −
                            </button>
                            <span className={styles.qtyValue}>{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                                disabled={outOfStock}
                                className={styles.qtyBtn}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Button
                            size="lg"
                            onClick={handleAddToCart}
                            disabled={outOfStock}
                            className={styles.addToCartBtn}
                        >
                            <ShoppingCart size={18} />
                            {outOfStock ? "Out of Stock" : `Add to Cart`}
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={handleWishlistToggle}
                            disabled={outOfStock}
                            className={styles.wishlistBtn}
                        >
                            <Heart size={18} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                        </Button>
                    </div>

                    <div className={styles.description}>
                        <h3>Description</h3>
                        <p>{product.description || "No description available."}</p>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className={styles.reviewsSection}>
                <div className={styles.reviewsHeader}>
                    <h2>Customer Reviews</h2>
                    <Button variant="outline" size="sm" onClick={() => setShowReviewForm(!showReviewForm)}>
                        {showReviewForm ? "Cancel" : "Write a Review"}
                    </Button>
                </div>

                {showReviewForm && (
                    <form onSubmit={handleReviewSubmit} className={styles.reviewForm}>
                        <h3>Share Your Thoughts</h3>
                        <div className={styles.formField}>
                            <label>Rating</label>
                            <div className={styles.starSelector}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                        className={styles.starBtn}
                                    >
                                        <Star
                                            size={24}
                                            fill={star <= reviewForm.rating ? "currentColor" : "none"}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={styles.formField}>
                            <label>Title</label>
                            <Input
                                value={reviewForm.title}
                                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                                placeholder="Sum up your experience"
                                required
                            />
                        </div>
                        <div className={styles.formField}>
                            <label>Comment</label>
                            <Textarea
                                value={reviewForm.comment}
                                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                placeholder="Tell us what you liked or didn't like..."
                                rows={4}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={submittingReview}>
                            {submittingReview ? <><Spinner size="sm" /> Submitting...</> : "Submit Review"}
                        </Button>
                    </form>
                )}

                {reviewsLoading ? (
                    <div className={styles.loading}>Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className={styles.noReviews}>
                        <p>No reviews yet. Be the first to share your experience!</p>
                    </div>
                ) : (
                    <div className={styles.reviewsList}>
                        {reviews.map((review) => (
                            <div key={review.id} className={styles.reviewCard}>
                                <div className={styles.reviewHeader}>
                                    <div className={styles.customerInfo}>
                                        <span className={styles.customerName}>{review.customerName}</span>
                                        <StarRating rating={review.rating} readonly size="sm" />
                                    </div>
                                    <span className={styles.reviewDate}>
                                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </span>
                                </div>
                                {review.title && <h4 className={styles.reviewTitle}>{review.title}</h4>}
                                <p className={styles.reviewComment}>{review.comment}</p>
                                <div className={styles.helpful}>
                                    <span>👍</span>
                                    <span>{review.helpfulCount} found this helpful</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
