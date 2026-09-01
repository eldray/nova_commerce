import styles from './StarRating.module.css';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  reviewCount?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'medium',
  showLabel = false,
  reviewCount,
  interactive = false,
  onRate,
}: StarRatingProps) {
  const normalizedRating = Math.min(Math.max(rating, 0), maxRating);
  
  const handleClick = (index: number) => {
    if (interactive && onRate) {
      onRate(index + 1);
    }
  };

  return (
    <div className={`${styles.container} ${styles[size]}`}>
      <div className={styles.stars}>
        {[...Array(maxRating)].map((_, index) => {
          const filled = index < Math.floor(normalizedRating);
          const partial = !filled && index < normalizedRating;
          const fillPercentage = partial ? (normalizedRating - index) * 100 : 0;

          return (
            <span
              key={index}
              className={`${styles.star} ${interactive ? styles.interactive : ''}`}
              onClick={() => handleClick(index)}
              role={interactive ? 'button' : undefined}
              aria-label={interactive ? `Rate ${index + 1} stars` : undefined}
              tabIndex={interactive ? 0 : undefined}
              onKeyDown={(e) => {
                if (interactive && (e.key === 'Enter' || e.key === ' ')) {
                  handleClick(index);
                }
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={filled ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.starIcon}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {partial && (
                <div 
                  className={styles.partialFill} 
                  style={{ width: `${fillPercentage}%` }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={styles.starIcon}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
              )}
            </span>
          );
        })}
      </div>
      {showLabel && (
        <span className={styles.label}>
          {normalizedRating.toFixed(1)}
          {reviewCount !== undefined && (
            <span className={styles.reviewCount}> ({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  );
}
