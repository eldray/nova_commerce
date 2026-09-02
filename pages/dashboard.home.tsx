import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  ShoppingBagIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useDashboardAnalytics } from '../helpers/useAnalytics';
import { useTrendingProducts } from '../helpers/useTrending';
import { Button } from '../components/Button';
import './dashboard.home.module.css';

// Simple Card component
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`card ${className}`}>
    {children}
  </div>
);

export default function DashboardHome() {
  const [timePeriod, setTimePeriod] = useState<'7d' | '30d' | '90d'>('7d');
  
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics(undefined, timePeriod);
  const { data: trendingProducts, isLoading: trendingLoading } = useTrendingProducts(6);

  const quickActions = [
    {
      title: 'Add Product',
      description: 'Create a new product listing',
      icon: ShoppingBagIcon,
      href: '/dashboard/products/new',
      color: 'blue'
    },
    {
      title: 'View Orders',
      description: 'Manage customer orders',
      icon: ClockIcon,
      href: '/dashboard/orders',
      color: 'green'
    },
    {
      title: 'Customers',
      description: 'View customer list',
      icon: UserGroupIcon,
      href: '/dashboard/customers',
      color: 'purple'
    },
    {
      title: 'Analytics',
      description: 'View detailed reports',
      icon: ChartBarIcon,
      href: '/dashboard/analytics',
      color: 'orange'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (analyticsLoading || trendingLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #3498db', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-card {
          transition: transform 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-2px);
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-icon.revenue { background: #ebf5ff; color: #3b82f6; }
        .stat-icon.orders { background: #ecfdf5; color: #10b981; }
        .stat-icon.customers { background: #fdf2f8; color: #ec4899; }
        .stat-icon.avg { background: #fef3c7; color: #f59e0b; }
        .stat-trend { display: flex; align-items: center; gap: 0.25rem; font-size: 0.875rem; }
        .stat-trend.positive { color: #10b981; }
        .stat-trend.neutral { color: #6b7280; }
        .stat-trend.negative { color: #ef4444; }
        .stat-value { font-size: 1.5rem; font-weight: 700; }
        .stat-label { font-size: 0.875rem; color: #6b7280; }
        .stat-header { display: flex; justify-content: space-between; align-items: center; }
        .stat-content { margin-top: 0.5rem; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .section-title { font-size: 1.125rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
        .view-all-link { color: #3b82f6; text-decoration: none; font-size: 0.875rem; }
        .view-all-link:hover { text-decoration: underline; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .product-card-link { text-decoration: none; color: inherit; }
        .product-image-wrapper { position: relative; height: 150px; overflow: hidden; border-radius: 8px; background: #f3f4f6; }
        .product-image { width: 100%; height: 100%; object-fit: cover; }
        .product-info { padding: 0.5rem 0; }
        .product-name { font-weight: 600; margin: 0; font-size: 0.875rem; }
        .product-price { font-weight: 700; color: #1f2937; }
        .sale-price { color: #ef4444; }
        .original-price { text-decoration: line-through; color: #6b7280; font-size: 0.75rem; margin-left: 0.5rem; }
        .actions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .action-card { 
          display: flex; 
          align-items: center; 
          gap: 1rem; 
          padding: 1rem; 
          border: 1px solid #e5e7eb; 
          border-radius: 8px; 
          text-decoration: none; 
          color: inherit;
          transition: all 0.2s;
        }
        .action-card:hover { 
          border-color: #3b82f6; 
          box-shadow: 0 2px 8px rgba(59,130,246,0.1);
        }
        .action-icon-wrapper { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .action-content { flex: 1; }
        .action-title { font-weight: 600; margin: 0; font-size: 0.875rem; }
        .action-description { margin: 0; font-size: 0.75rem; color: #6b7280; }
        .action-blue .action-icon-wrapper { background: #ebf5ff; color: #3b82f6; }
        .action-green .action-icon-wrapper { background: #ecfdf5; color: #10b981; }
        .action-purple .action-icon-wrapper { background: #fdf2f8; color: #ec4899; }
        .action-orange .action-icon-wrapper { background: #fef3c7; color: #f59e0b; }
        .orders-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .order-item { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 0.75rem; 
          border: 1px solid #e5e7eb; 
          border-radius: 8px; 
          text-decoration: none; 
          color: inherit;
        }
        .order-item:hover { background: #f9fafb; }
        .order-info { flex: 1; }
        .order-id { font-weight: 600; font-size: 0.875rem; }
        .order-customer { font-size: 0.75rem; color: #6b7280; }
        .order-date { font-size: 0.75rem; color: #6b7280; }
        .order-status { margin: 0 1rem; }
        .status-badge { 
          padding: 0.25rem 0.75rem; 
          border-radius: 9999px; 
          font-size: 0.75rem; 
          font-weight: 500;
        }
        .status-badge.status-pending { background: #fef3c7; color: #92400e; }
        .status-badge.status-processing { background: #dbeafe; color: #1e40af; }
        .status-badge.status-completed { background: #d1fae5; color: #065f46; }
        .status-badge.status-cancelled { background: #fee2e2; color: #991b1b; }
        .order-total { font-weight: 600; }
        .empty-state { text-align: center; padding: 2rem; color: #6b7280; }
        .empty-icon { width: 48px; height: 48px; margin: 0 auto; color: #d1d5db; }
        .empty-hint { font-size: 0.875rem; margin-top: 0.25rem; }
        .welcome-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .welcome-title { font-size: 1.5rem; font-weight: 700; margin: 0; }
        .welcome-subtitle { margin: 0.25rem 0 0 0; color: #6b7280; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
        .period-selector { display: flex; align-items: center; gap: 0.5rem; margin-top: 1.5rem; padding: 1rem; background: #f9fafb; border-radius: 8px; }
        .period-label { font-size: 0.875rem; color: #6b7280; }
        .period-btn { padding: 0.25rem 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white; cursor: pointer; font-size: 0.75rem; }
        .period-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        .welcome-actions { display: flex; gap: 0.5rem; }
        .button-icon-small { width: 16px; height: 16px; }
      `}</style>

      {/* Welcome Header */}
      <div className="welcome-header">
        <div className="welcome-content">
          <h1 className="welcome-title">Welcome back! í±‹</h1>
          <p className="welcome-subtitle">Here's what's happening with your store today</p>
        </div>
        <div className="welcome-actions">
          <Link to="/dashboard/products/new">
            <Button variant="primary">
              <SparklesIcon className="button-icon-small" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-header">
            <div className="stat-icon revenue">
              <CurrencyDollarIcon />
            </div>
            <div className="stat-trend positive">
              <ArrowTrendingUpIcon />
              <span>+12.5%</span>
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {analytics?.revenue ? formatCurrency(analytics.revenue) : 'GHâ‚µ0.00'}
            </div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orders">
              <ShoppingBagIcon />
            </div>
            <div className="stat-trend positive">
              <ArrowTrendingUpIcon />
              <span>+8.2%</span>
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{analytics?.orders || 0}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-header">
            <div className="stat-icon customers">
              <UserGroupIcon />
            </div>
            <div className="stat-trend positive">
              <ArrowTrendingUpIcon />
              <span>+15.3%</span>
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{analytics?.customers || 0}</div>
            <div className="stat-label">Total Customers</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-header">
            <div className="stat-icon avg">
              <ChartBarIcon />
            </div>
            <div className="stat-trend neutral">
              <span>0.0%</span>
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {analytics?.avgOrderValue ? formatCurrency(analytics.avgOrderValue) : 'GHâ‚µ0.00'}
            </div>
            <div className="stat-label">Avg Order Value</div>
          </div>
        </Card>
      </div>

      {/* Time Period Selector */}
      <div className="period-selector">
        <span className="period-label">Showing data for:</span>
        <div className="period-buttons">
          <button 
            className={`period-btn ${timePeriod === '7d' ? 'active' : ''}`}
            onClick={() => setTimePeriod('7d')}
          >
            Last 7 days
          </button>
          <button 
            className={`period-btn ${timePeriod === '30d' ? 'active' : ''}`}
            onClick={() => setTimePeriod('30d')}
          >
            Last 30 days
          </button>
          <button 
            className={`period-btn ${timePeriod === '90d' ? 'active' : ''}`}
            onClick={() => setTimePeriod('90d')}
          >
            Last 90 days
          </button>
        </div>
      </div>
    </div>
  );
}
