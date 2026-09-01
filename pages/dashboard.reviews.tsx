import React, { useState, useEffect } from 'react';
import { useReviews } from '../helpers/useReviews';
import { StarRating } from '../components/StarRating';
import styles from './dashboard.reviews.module.css';

interface Review {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  customerId: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  helpfulCount: number;
  createdAt: string;
}

export default function DashboardReviews() {
  const { getPendingReviews, moderateReview, deleteReview, loading } = useReviews();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, [filter]);

  const loadReviews = async () => {
    try {
      setError(null);
      let fetchedReviews: Review[] = [];

      if (filter === 'pending') {
        fetchedReviews = await getPendingReviews();
      } else {
        // For other filters, you'd call a different endpoint
        // For now, we'll just use pending as the main view
        fetchedReviews = await getPendingReviews();
      }

      setReviews(fetchedReviews);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
    }
  };

  const handleModerate = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
      await moderateReview(reviewId, status);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err: any) {
      alert(err.message || 'Failed to moderate review');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Product Reviews</h1>
          <p>Moderate and manage customer reviews</p>
        </div>

        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'approved' ? styles.active : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'rejected' ? styles.active : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📝</div>
          <h3>No Reviews Found</h3>
          <p>
            {filter === 'pending'
              ? 'No pending reviews to moderate'
              : `No ${filter} reviews yet`}
          </p>
        </div>
      ) : (
        <div className={styles.reviewsList}>
          {reviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.productInfo}>
                  {review.productImage && (
                    <img
                      src={review.productImage}
                      alt={review.productName || 'Product'}
                      className={styles.productImage}
                    />
                  )}
                  <div>
                    <h3 className={styles.productName}>
                      {review.productName || 'Product'}
                    </h3>
                    <span className={styles.customerName}>{review.customerName}</span>
                  </div>
                </div>

                <div className={styles.meta}>
                  <StarRating rating={review.rating} readonly />
                  <span className={styles.date}>{formatDate(review.createdAt)}</span>
                  <span className={`${styles.status} ${styles[review.status]}`}>
                    {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className={styles.reviewContent}>
                {review.title && <h4 className={styles.reviewTitle}>{review.title}</h4>}
                <p className={styles.reviewComment}>{review.comment}</p>
              </div>

              <div className={styles.reviewFooter}>
                <div className={styles.helpful}>
                  <span>👍</span>
                  <span>{review.helpfulCount} people found this helpful</span>
                </div>

                {review.status === 'pending' && (
                  <div className={styles.actions}>
                    <button
                      className={styles.rejectBtn}
                      onClick={() => handleModerate(review.id, 'rejected')}
                    >
                      Reject
                    </button>
                    <button
                      className={styles.approveBtn}
                      onClick={() => handleModerate(review.id, 'approved')}
                    >
                      Approve
                    </button>
                  </div>
                )}

                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(review.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
