import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCoupons } from '../helpers/useCoupons';
import styles from './dashboard.coupons.new.module.css';

interface CouponForm {
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startsAt: string;
  expiresAt: string;
  firstOrderOnly: boolean;
  status: 'active' | 'inactive';
}

const initialForm: CouponForm = {
  code: '',
  name: '',
  description: '',
  type: 'percentage',
  value: 0,
  minPurchaseAmount: undefined,
  maxDiscountAmount: undefined,
  usageLimit: undefined,
  usageLimitPerUser: undefined,
  startsAt: new Date().toISOString().split('T')[0],
  expiresAt: '',
  firstOrderOnly: false,
  status: 'active',
};

export default function CouponsNew() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createCoupon, updateCoupon, getCoupon, isCreating, isUpdating } = useCoupons();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(initialForm);

  useEffect(() => {
    if (id) {
      loadCoupon();
    }
  }, [id]);

  const loadCoupon = async () => {
    try {
      const coupon = await getCoupon(parseInt(id!));
      if (coupon) {
        setForm({
          code: coupon.code,
          name: coupon.name,
          description: coupon.description || '',
          type: coupon.type,
          value: parseFloat(coupon.value),
          minPurchaseAmount: coupon.minPurchaseAmount ? parseFloat(coupon.minPurchaseAmount) : undefined,
          maxDiscountAmount: coupon.maxDiscountAmount ? parseFloat(coupon.maxDiscountAmount) : undefined,
          usageLimit: coupon.usageLimit || undefined,
          usageLimitPerUser: coupon.usageLimitPerUser || undefined,
          startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().split('T')[0] : '',
          expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
          firstOrderOnly: coupon.firstOrderOnly,
          status: coupon.status as 'active' | 'inactive',
        });
      }
    } catch (err) {
      setError('Failed to load coupon');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number' || name === 'value' || name === 'minPurchaseAmount' || name === 'maxDiscountAmount'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...form,
        ...(form.minPurchaseAmount === 0 ? { minPurchaseAmount: undefined } : {}),
        ...(form.maxDiscountAmount === 0 ? { maxDiscountAmount: undefined } : {}),
        ...(form.usageLimit === 0 ? { usageLimit: undefined } : {}),
        ...(form.usageLimitPerUser === 0 ? { usageLimitPerUser: undefined } : {}),
        ...(form.expiresAt === '' ? { expiresAt: undefined } : {}),
      };

      if (id) {
        await updateCoupon({ id: parseInt(id), ...payload });
      } else {
        await createCoupon(payload);
      }
      navigate('/dashboard/coupons');
    } catch (err: any) {
      setError(err.message || 'Failed to save coupon');
      setLoading(false);
    }
  };

  const isLoading = loading || isCreating || isUpdating;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{id ? 'Edit Coupon' : 'Create Coupon'}</h1>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => navigate('/dashboard/coupons')}
        >
          Cancel
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h2>Basic Information</h2>
          
          <div className={styles.field}>
            <label htmlFor="code">Coupon Code *</label>
            <input
              type="text"
              id="code"
              name="code"
              value={form.code}
              onChange={handleChange}
              required
              placeholder="e.g., SAVE20"
              style={{ textTransform: 'uppercase' }}
            />
            <small>Unique code customers will enter at checkout</small>
          </div>

          <div className={styles.field}>
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g., Summer Sale 20%"
            />
            <small>Internal name for your reference</small>
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe this coupon..."
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="firstOrderOnly">First Order Only</label>
              <select
                id="firstOrderOnly"
                name="firstOrderOnly"
                value={form.firstOrderOnly ? 'true' : 'false'}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, firstOrderOnly: e.target.value === 'true' }))
                }
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
              <small>Restrict to first-time customers only</small>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Discount Settings</h2>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="type">Discount Type *</label>
              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handleChange}
                required
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed Amount (GHS)</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>

            {form.type !== 'free_shipping' && (
              <div className={styles.field}>
                <label htmlFor="value">
                  Discount Value * ({form.type === 'percentage' ? '%' : 'GHS'})
                </label>
                <input
                  type="number"
                  id="value"
                  name="value"
                  value={form.value}
                  onChange={handleChange}
                  required
                  min="0"
                  step={form.type === 'percentage' ? '0.1' : '0.01'}
                  placeholder={form.type === 'percentage' ? '20' : '50'}
                />
              </div>
            )}
          </div>

          {form.type === 'percentage' && (
            <div className={styles.field}>
              <label htmlFor="maxDiscountAmount">Maximum Discount (GHS)</label>
              <input
                type="number"
                id="maxDiscountAmount"
                name="maxDiscountAmount"
                value={form.maxDiscountAmount || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Optional cap"
              />
              <small>Cap the maximum discount for percentage coupons</small>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="minPurchaseAmount">Minimum Purchase Amount (GHS)</label>
            <input
              type="number"
              id="minPurchaseAmount"
              name="minPurchaseAmount"
              value={form.minPurchaseAmount || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0"
            />
            <small>Minimum cart total required to use this coupon</small>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Usage Limits</h2>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="usageLimit">Total Usage Limit</label>
              <input
                type="number"
                id="usageLimit"
                name="usageLimit"
                value={form.usageLimit || ''}
                onChange={handleChange}
                min="1"
                placeholder="Unlimited"
              />
              <small>Leave empty or 0 for unlimited total uses</small>
            </div>

            <div className={styles.field}>
              <label htmlFor="usageLimitPerUser">Usage Limit Per User</label>
              <input
                type="number"
                id="usageLimitPerUser"
                name="usageLimitPerUser"
                value={form.usageLimitPerUser || ''}
                onChange={handleChange}
                min="1"
                placeholder="Unlimited"
              />
              <small>Leave empty or 0 for unlimited uses per customer</small>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Validity Period</h2>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="startsAt">Start Date *</label>
              <input
                type="date"
                id="startsAt"
                name="startsAt"
                value={form.startsAt}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="expiresAt">End Date</label>
              <input
                type="date"
                id="expiresAt"
                name="expiresAt"
                value={form.expiresAt}
                onChange={handleChange}
                min={form.startsAt}
              />
              <small>Leave empty for no expiration</small>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => navigate('/dashboard/coupons')}
          >
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Saving...' : id ? 'Update Coupon' : 'Create Coupon'}
          </button>
        </div>
      </form>
    </div>
  );
}
