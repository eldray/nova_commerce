import { Link } from 'react-router-dom';
import styles from './dashboard.settings.module.css';

export default function DashboardSettings() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Store Settings</h1>
      <p className={styles.description}>Manage your store configuration and preferences</p>
      
      <div className={styles.settingsGrid}>
        <Link to="/dashboard/settings/store" className={styles.settingCard}>
          <div className={styles.cardIcon}>🏪</div>
          <h2 className={styles.cardTitle}>Store Settings</h2>
          <p className={styles.cardDescription}>
            Configure your store name, description, and publishing status
          </p>
          <span className={styles.arrow}>→</span>
        </Link>

        <Link to="/dashboard/settings/payments" className={styles.settingCard}>
          <div className={styles.cardIcon}>💳</div>
          <h2 className={styles.cardTitle}>Payment Settings</h2>
          <p className={styles.cardDescription}>
            Manage payment methods, Stripe integration, and payout information
          </p>
          <span className={styles.arrow}>→</span>
        </Link>
      </div>
    </div>
  );
}
