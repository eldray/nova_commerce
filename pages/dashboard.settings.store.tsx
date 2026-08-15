import { useState } from 'react';
import { useStoreStatus, usePublishStore, useUnpublishStore, usePublishRequirements } from '../helpers/useStoreSettings';
import { useAuth } from '../helpers/useAuth';
import styles from './dashboard.settings.store.module.css';

export default function DashboardSettingsStore() {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  
  const storeId = user?.storeId;
  
  const { data: store, isLoading, error } = useStoreStatus(storeId);
  const { mutate: publishStore, isPending: isPublishing } = usePublishStore();
  const { mutate: unpublishStore, isPending: isUnpublishing } = useUnpublishStore();
  const { data: requirements } = usePublishRequirements(storeId!);

  const handlePublish = () => {
    if (storeId) {
      publishStore({ storeId });
    }
  };

  const handleUnpublish = () => {
    if (storeId) {
      unpublishStore({ 
        storeId, 
        reason: reason || undefined
      });
      setShowUnpublishModal(false);
      setReason('');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading store settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error</h2>
        <p>Failed to load store settings. Please try again.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Store Settings</h1>
        <p className={styles.subtitle}>Manage your store publishing status</p>
      </div>

      {/* Publishing Status Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Store Publishing</h2>
            <p className={styles.cardDescription}>
              Control when your store goes live for customers
            </p>
          </div>
          
          <div className={styles.statusBadge}>
            {store?.published ? (
              <>
                <span className={styles.statusDotPublished}></span>
                <span>Live</span>
              </>
            ) : (
              <>
                <span className={styles.statusDotDraft}></span>
                <span>Draft</span>
              </>
            )}
          </div>
        </div>

        {store?.publish_date && (
          <div className={styles.publishInfo}>
            <strong>Published:</strong> {new Date(store.publish_date).toLocaleDateString()}
          </div>
        )}

        {store?.unpublish_reason && (
          <div className={styles.unpublishReason}>
            <strong>Take offline reason:</strong> {store.unpublish_reason}
          </div>
        )}

        <div className={styles.actions}>
          {store?.published ? (
            <button
              className={styles.btnSecondary}
              onClick={() => setShowUnpublishModal(true)}
              disabled={isUnpublishing}
            >
              {isUnpublishing ? 'Taking Offline...' : 'Take Offline'}
            </button>
          ) : (
            <button
              className={styles.btnPrimary}
              onClick={handlePublish}
              disabled={isPublishing || !requirements?.canPublish}
            >
              {isPublishing ? 'Publishing...' : 'Go Live'}
            </button>
          )}
        </div>
      </div>

      {/* Requirements Card */}
      <div className={styles.card}>
        <h3>Publishing Requirements</h3>
        <p className={styles.cardDescription}>
          Your store must meet these requirements before going live
        </p>
        
        <div className={styles.requirementsList}>
          <div className={styles.requirementItem}>
            <span className={`${styles.requirementDot} ${requirements?.hasProducts ? styles.dotGreen : styles.dotRed}`}></span>
            <span>At least one product added</span>
          </div>
          
          <div className={styles.requirementItem}>
            <span className={`${styles.requirementDot} ${requirements?.hasCategories ? styles.dotGreen : styles.dotRed}`}></span>
            <span>At least one category created</span>
          </div>
          
          <div className={styles.requirementItem}>
            <span className={`${styles.requirementDot} ${store?.name ? styles.dotGreen : styles.dotRed}`}></span>
            <span>Business information completed</span>
          </div>
        </div>

        {!requirements?.canPublish && (
          <div className={styles.warningBox}>
            <p>⚠️ Complete the requirements above to enable publishing</p>
          </div>
        )}
      </div>

      {/* Unpublish Modal */}
      {showUnpublishModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Take Store Offline</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowUnpublishModal(false)}
              >
                ✕
              </button>
            </div>
            
            <p className={styles.modalDescription}>
              Your store will no longer be visible to customers. Existing orders will still be processed.
            </p>
            
            <div className={styles.formGroup}>
              <label htmlFor="reason">Reason (optional)</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you taking your store offline?"
                rows={4}
                maxLength={500}
              />
            </div>
            
            <div className={styles.modalActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => setShowUnpublishModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.btnDanger}
                onClick={handleUnpublish}
                disabled={isUnpublishing}
              >
                {isUnpublishing ? 'Processing...' : 'Take Offline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
