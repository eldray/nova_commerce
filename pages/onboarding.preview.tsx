import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import styles from "./onboarding.preview.module.css";
import { useMyStores } from "../helpers/useMyStores";
import { useProducts } from "../helpers/useProducts";
import { usePublishStore } from "../helpers/useStoreSettings";

export default function OnboardingPreviewPage() {
  const navigate = useNavigate();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { data: stores, isLoading: storesLoading } = useMyStores();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { mutate: publishStore } = usePublishStore();
  
  const currentStore = stores?.[0];
  const productCount = products?.length || 0;

  const handlePublish = async () => {
    if (!currentStore) {
      setError("No store found");
      return;
    }
    
    setError(null);
    setIsPublishing(true);
    
    try {
      publishStore(
        { storeId: currentStore.id },
        {
          onSuccess: () => {
            setSuccess(true);
            setTimeout(() => {
              navigate("/dashboard");
            }, 2000);
          },
          onError: (err) => {
            setError(err instanceof Error ? err.message : "Failed to publish store");
            setIsPublishing(false);
          }
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish store");
      setIsPublishing(false);
    }
  };

  if (storesLoading || productsLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
        <p>Loading your store preview...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Preview your store — Nova Commerce</title>
      </Helmet>
      <span className={styles.step}>Step 7 of 7</span>
      <h1 className={styles.title}>Your store is ready!</h1>
      <p className={styles.subtitle}>
        Preview how your store will look to customers. When you're ready, publish it to start selling.
      </p>

      {success && (
        <div className={styles.successMessage}>
          <strong>🎉 Store published successfully!</strong>
          <p>Redirecting you to your dashboard...</p>
        </div>
      )}

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.previewContainer}>
        <div className={styles.storeHeader}>
          {currentStore?.logoUrl ? (
            <img src={currentStore.logoUrl} alt={currentStore.name} className={styles.logo} />
          ) : (
            <div className={styles.logoPlaceholder}>{currentStore?.name?.charAt(0) || "S"}</div>
          )}
          <div className={styles.storeInfo}>
            <h2 className={styles.storeName}>{currentStore?.name || "Your Store"}</h2>
            <p className={styles.storeTagline}>{currentStore?.tagline || "Welcome to our store"}</p>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{productCount}</span>
            <span className={styles.statLabel}>Products</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>GHS</span>
            <span className={styles.statLabel}>Currency</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>Ready</span>
            <span className={styles.statLabel}>Status</span>
          </div>
        </div>

        <div className={styles.productPreview}>
          <h3 className={styles.previewTitle}>Sample Product Layout</h3>
          {products && products.length > 0 ? (
            <div className={styles.productGrid}>
              {products.slice(0, 3).map((product) => (
                <div key={product.id} className={styles.productCard}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
                  ) : (
                    <div className={styles.imagePlaceholder}>No Image</div>
                  )}
                  <h4 className={styles.productName}>{product.name}</h4>
                  <p className={styles.productPrice}>GH₵ {Number(product.price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noProducts}>
              <p>No products yet. Add products from your dashboard.</p>
            </div>
          )}
        </div>

        <div className={styles.checklist}>
          <h3 className={styles.checklistTitle}>✅ Setup Checklist</h3>
          <ul className={styles.checklistItems}>
            <li className={styles.checkItem}>✓ Business information</li>
            <li className={styles.checkItem}>✓ Branding & logo</li>
            <li className={styles.checkItem}>✓ Store settings</li>
            <li className={styles.checkItem}>✓ Payment provider</li>
            <li className={styles.checkItem}>✓ Delivery zones</li>
            <li className={styles.checkItem}>✓ Products added</li>
          </ul>
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate(-1)}
          disabled={isPublishing}
        >
          Go Back
        </Button>
        <Button 
          onClick={handlePublish} 
          disabled={isPublishing || success}
          className={styles.publishButton}
        >
          {isPublishing ? (
            <>
              <Spinner size="sm" /> Publishing...
            </>
          ) : success ? (
            "Published!"
          ) : (
            "🚀 Publish Store"
          )}
        </Button>
      </div>

      <div className={styles.infoBox}>
        <h4 className={styles.infoTitle}>What happens next?</h4>
        <p className={styles.infoText}>
          After publishing, your store will be live and accessible to customers. 
          You can manage orders, add more products, and customize your store from the dashboard.
        </p>
      </div>
    </>
  );
}
