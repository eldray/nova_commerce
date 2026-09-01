import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Plus, Tag, Search, Filter, Edit2, Trash2, Copy, Check } from 'lucide-react';
import { useCoupons } from '../helpers/useCoupons';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import styles from './dashboard.coupons.module.css';

const STATUS_VARIANT: Record<string, 'success' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'success',
  inactive: 'secondary',
  expired: 'destructive',
};

const TYPE_LABELS: Record<string, string> = {
  percentage: '% Off',
  fixed_amount: 'Fixed Amount',
  free_shipping: 'Free Shipping',
};

export default function DashboardCouponsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { coupons, total, totalPages, isLoading, error } = useCoupons();

  const handleCopyCode = async (code: string, id: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch = 
      coupon.code.toLowerCase().includes(search.toLowerCase()) ||
      coupon.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || coupon.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.wrapper}>
      <Helmet>
        <title>Coupons — Nova Commerce</title>
      </Helmet>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Coupons & Discounts</h1>
          <p className={styles.subtitle}>Create and manage promotional codes to boost sales.</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/coupons/new">
            <Plus size={16} /> Create Coupon
          </Link>
        </Button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <Input
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </Select>
      </div>

      {isLoading && (
        <div className={styles.tableCard}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className={styles.rowSkeleton} />
          ))}
        </div>
      )}

      {error && (
        <div className={styles.errorState}>
          <p>{error instanceof Error ? error.message : 'Failed to load coupons.'}</p>
        </div>
      )}

      {!isLoading && !error && filteredCoupons.length === 0 && (
        <div className={styles.emptyState}>
          <Tag size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No coupons found</h3>
          <p className={styles.emptySubtitle}>
            {search || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first coupon to start offering discounts!'}
          </p>
          {!search && statusFilter === 'all' && (
            <Button asChild>
              <Link to="/dashboard/coupons/new">
                <Plus size={16} /> Create Coupon
              </Link>
            </Button>
          )}
        </div>
      )}

      {!isLoading && filteredCoupons.length > 0 && (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Value</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>
                    <div className={styles.codeCell}>
                      <code className={styles.code}>{coupon.code}</code>
                      <button
                        className={styles.copyBtn}
                        onClick={() => handleCopyCode(coupon.code, coupon.id)}
                        title="Copy code"
                      >
                        {copiedId === coupon.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.name}>{coupon.name}</div>
                      {coupon.description && (
                        <div className={styles.description}>{coupon.description}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge variant="secondary">{TYPE_LABELS[coupon.type]}</Badge>
                  </td>
                  <td>
                    <strong>
                      {coupon.type === 'percentage'
                        ? `${coupon.value}%`
                        : coupon.type === 'free_shipping'
                        ? 'Free Shipping'
                        : `GH₵${coupon.value}`}
                    </strong>
                    {coupon.maxDiscountAmount && coupon.type === 'percentage' && (
                      <div className={styles.maxDiscount}>
                        Max: GH₵{coupon.maxDiscountAmount}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className={styles.usage}>
                      {coupon.usedCount} / {coupon.usageLimit || '∞'}
                      {coupon.usageLimitPerUser && (
                        <span className={styles.perUser}>
                          ({coupon.usageLimitPerUser}/user)
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge variant={STATUS_VARIANT[coupon.status] || 'secondary'}>
                      {coupon.status}
                    </Badge>
                  </td>
                  <td>
                    {coupon.expiresAt ? (
                      <div className={styles.date}>
                        {new Date(coupon.expiresAt).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className={styles.never}>Never</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        title="Edit coupon"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={styles.actionBtn}
                        title="Delete coupon"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                className={styles.pageBtn}
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
