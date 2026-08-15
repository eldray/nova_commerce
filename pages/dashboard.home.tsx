import { useState } from 'react';
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
import './dashboard.home.module.css';

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
      <div className="dashboard-home-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-home">
      {/* Welcome Header */}
      <div className="welcome-header">
        <div className="welcome-content">
          <h1 className="welcome-title">
            Welcome back! 👋
          </h1>
          <p className="welcome-subtitle">
            Here's what's happening with your store today
          </p>
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
              {analytics?.revenue ? formatCurrency(analytics.revenue) : 'GH₵0.00'}
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
              {analytics?.avgOrderValue ? formatCurrency(analytics.avgOrderValue) : 'GH₵0.00'}
            </div>
            <div className="stat-label">Avg Order Value</div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Trending Products */}
        <Card className="trending-section">
          <div className="section-header">
            <h2 className="section-title">
              <SparklesIcon className="section-icon" />
              Trending Products
            </h2>
            <Link to="/dashboard/products" className="view-all-link">
              View All →
            </Link>
          </div>
          
          {trendingProducts && trendingProducts.length > 0 ? (
            <div className="products-grid">
              {trendingProducts.map((product) => (
                <Link 
                  key={product.id} 
                  to={`/dashboard/products/${product.id}`}
                  className="product-card-link"
                >
                  <div className="product-image-wrapper">
                    <img 
                      src={product.image_url || 'https://via.placeholder.com/300x300?text=Product'} 
                      alt={product.name}
                      className="product-image"
                    />
                    {product.sale_price && (
                      <span className="sale-badge">Sale</span>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-price">
                      {product.sale_price ? (
                        <>
                          <span className="sale-price">
                            {formatCurrency(product.sale_price)}
                          </span>
                          <span className="original-price">
                            {formatCurrency(product.price)}
                          </span>
                        </>
                      ) : (
                        <span>{formatCurrency(product.price)}</span>
                      )}
                    </div>
                    <div className="product-meta">
                      <span className="sold-count">
                        {product.total_sold || 0} sold
                      </span>
                      <span className="views-count">
                        👁️ {product.view_count || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ShoppingBagIcon className="empty-icon" />
              <p>No products yet</p>
              <Link to="/dashboard/products/new">
                <Button variant="primary" size="small">Add Your First Product</Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="quick-actions-section">
          <div className="section-header">
            <h2 className="section-title">Quick Actions</h2>
          </div>
          
          <div className="actions-grid">
            {quickActions.map((action, index) => (
              <Link 
                key={index} 
                to={action.href}
                className={`action-card action-${action.color}`}
              >
                <div className={`action-icon-wrapper bg-${action.color}`}>
                  <action.icon />
                </div>
                <div className="action-content">
                  <h3 className="action-title">{action.title}</h3>
                  <p className="action-description">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="activity-section">
          <div className="section-header">
            <h2 className="section-title">Recent Orders</h2>
            <Link to="/dashboard/orders" className="view-all-link">
              View All →
            </Link>
          </div>
          
          {analytics?.recentOrders && analytics.recentOrders.length > 0 ? (
            <div className="orders-list">
              {analytics.recentOrders.slice(0, 5).map((order) => (
                <Link 
                  key={order.id} 
                  to={`/dashboard/orders/${order.id}`}
                  className="order-item"
                >
                  <div className="order-info">
                    <div className="order-id">#{order.order_number || order.id}</div>
                    <div className="order-customer">{order.customer_name || 'Guest'}</div>
                    <div className="order-date">
                      {new Date(order.created_at).toLocaleDateString('en-GH', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="order-total">
                    {formatCurrency(parseFloat(order.total_amount?.toString() || '0'))}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ClockIcon className="empty-icon" />
              <p>No recent orders</p>
              <p className="empty-hint">Orders will appear here as they come in</p>
            </div>
          )}
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
