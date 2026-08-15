import { useState } from 'react';
import { useSubscriptions, useHasFeature } from '../helpers/useSubscriptions';
import styles from './dashboard.billing.module.css';

interface PlanCardProps {
  plan: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    priceMonthly: number;
    priceYearly: number;
    currency: string;
    maxProducts: number;
    maxStaff: number;
    maxStorageGb: number;
    hasCustomDomain: boolean;
    hasAdvancedAnalytics: boolean;
    hasCouponSystem: boolean;
    hasPrioritySupport: boolean;
    isPopular: boolean;
  };
  currentPlanId?: number;
  onSelect: (planId: number, billingCycle: 'monthly' | 'yearly') => void;
  isLoading?: boolean;
}

function PlanCard({ plan, currentPlanId, onSelect, isLoading }: PlanCardProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const isCurrentPlan = currentPlanId === plan.id;
  
  const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  const savings = billingCycle === 'yearly' ? Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100) : 0;

  return (
    <div className={`${styles.planCard} ${plan.isPopular ? styles.popular : ''} ${isCurrentPlan ? styles.current : ''}`}>
      {plan.isPopular && <div className={styles.popularBadge}>Most Popular</div>}
      {isCurrentPlan && <div className={styles.currentBadge}>Current Plan</div>}
      
      <div className={styles.planHeader}>
        <h3 className={styles.planName}>{plan.name}</h3>
        <p className={styles.planDescription}>{plan.description}</p>
      </div>

      <div className={styles.pricing}>
        <div className={styles.priceContainer}>
          <span className={styles.currency}>GH₵</span>
          <span className={styles.price}>{price}</span>
          <span className={styles.period}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
        </div>
        
        {billingCycle === 'yearly' && savings > 0 && (
          <div className={styles.savingsBadge}>Save {savings}%</div>
        )}
      </div>

      <div className={styles.billingToggle}>
        <button
          className={`${styles.toggleBtn} ${billingCycle === 'monthly' ? styles.active : ''}`}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </button>
        <button
          className={`${styles.toggleBtn} ${billingCycle === 'yearly' ? styles.active : ''}`}
          onClick={() => setBillingCycle('yearly')}
        >
          Yearly
        </button>
      </div>

      <button
        className={`${styles.selectButton} ${isCurrentPlan ? styles.disabled : ''}`}
        onClick={() => !isCurrentPlan && onSelect(plan.id, billingCycle)}
        disabled={isCurrentPlan || isLoading}
      >
        {isCurrentPlan ? 'Current Plan' : 'Start Free Trial'}
      </button>

      <div className={styles.features}>
        <div className={styles.featureItem}>
          <span className={styles.checkmark}>✓</span>
          {plan.maxProducts === -1 ? 'Unlimited' : `${plan.maxProducts}`} Products
        </div>
        <div className={styles.featureItem}>
          <span className={styles.checkmark}>✓</span>
          {plan.maxStaff === -1 ? 'Unlimited' : `${plan.maxStaff}`} Staff Accounts
        </div>
        <div className={styles.featureItem}>
          <span className={styles.checkmark}>✓</span>
          {plan.maxStorageGb} GB Storage
        </div>
        {plan.hasCustomDomain && (
          <div className={styles.featureItem}>
            <span className={styles.checkmark}>✓</span>
            Custom Domain
          </div>
        )}
        {plan.hasAdvancedAnalytics && (
          <div className={styles.featureItem}>
            <span className={styles.checkmark}>✓</span>
            Advanced Analytics
          </div>
        )}
        {plan.hasCouponSystem && (
          <div className={styles.featureItem}>
            <span className={styles.checkmark}>✓</span>
            Coupon System
          </div>
        )}
        {plan.hasPrioritySupport && (
          <div className={styles.featureItem}>
            <span className={styles.checkmark}>✓</span>
            Priority Support
          </div>
        )}
      </div>
    </div>
  );
}

export default function BillingPage() {
  const { plans, currentSubscription, subscribe, cancelSubscription, isLoading, isSubscribing, isCancelling } = useSubscriptions();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleSubscribe = async (planId: number, billingCycle: 'monthly' | 'yearly') => {
    try {
      await subscribe({ planId, billingCycle });
      alert('Successfully subscribed! Your 14-day free trial has started.');
    } catch (error) {
      alert('Failed to subscribe. Please try again.');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSubscription(cancelReason);
      setShowCancelModal(false);
      alert('Subscription cancelled. You will retain access until the end of your billing period.');
    } catch (error) {
      alert('Failed to cancel subscription. Please contact support.');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading subscription plans...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Subscription & Billing</h1>
        <p>Choose the perfect plan for your business</p>
      </div>

      {currentSubscription && (
        <div className={styles.currentPlanInfo}>
          <div className={styles.planStatus}>
            <h2>Current Plan: {currentSubscription.plan.name}</h2>
            <span className={`${styles.statusBadge} ${styles[currentSubscription.status]}`}>
              {currentSubscription.status}
            </span>
          </div>
          <div className={styles.planDetails}>
            <div className={styles.detailItem}>
              <strong>Billing Cycle:</strong> {currentSubscription.billingCycle}
            </div>
            <div className={styles.detailItem}>
              <strong>Next Billing Date:</strong>{' '}
              {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
            </div>
            <div className={styles.detailItem}>
              <strong>Amount:</strong> GH₵{currentSubscription.plan.priceMonthly}/{currentSubscription.billingCycle === 'monthly' ? 'mo' : 'yr'}
            </div>
          </div>
          <button 
            className={styles.cancelButton}
            onClick={() => setShowCancelModal(true)}
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
          </button>
        </div>
      )}

      {!currentSubscription && (
        <div className={styles.trialBanner}>
          <h3>🎉 Start Your 14-Day Free Trial!</h3>
          <p>No credit card required. Get full access to all features.</p>
        </div>
      )}

      <div className={styles.plansGrid}>
        {plans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlanId={currentSubscription?.planId}
            onSelect={handleSubscribe}
            isLoading={isSubscribing}
          />
        ))}
      </div>

      {showCancelModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Cancel Subscription</h2>
            <p>We're sorry to see you go. Please let us know why you're cancelling:</p>
            <textarea
              className={styles.textarea}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Tell us why you're cancelling (optional)"
              rows={4}
            />
            <div className={styles.modalActions}>
              <button
                className={styles.keepButton}
                onClick={() => setShowCancelModal(false)}
              >
                Keep My Subscription
              </button>
              <button
                className={styles.confirmCancelButton}
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.faq}>
        <h2>Frequently Asked Questions</h2>
        <div className={styles.faqItem}>
          <h4>What happens after the free trial?</h4>
          <p>After your 14-day free trial, you'll be charged based on your selected billing cycle (monthly or yearly).</p>
        </div>
        <div className={styles.faqItem}>
          <h4>Can I change my plan later?</h4>
          <p>Yes! You can upgrade or downgrade your plan at any time from this page.</p>
        </div>
        <div className={styles.faqItem}>
          <h4>What payment methods do you accept?</h4>
          <p>We accept Mobile Money (MTN, Vodafone, AirtelTigo), cards, and bank transfers through our secure payment providers.</p>
        </div>
        <div className={styles.faqItem}>
          <h4>Can I cancel anytime?</h4>
          <p>Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.</p>
        </div>
      </div>
    </div>
  );
}
