# Nova Commerce - Completion Plan

## Current State (Verified)
✅ Backend endpoints for Coupons EXIST
✅ Backend endpoints for Reviews EXIST  
✅ Backend endpoints for Subscriptions EXIST
✅ Billing page UI EXISTS (`dashboard.billing.tsx`)
✅ Database schemas COMPLETE

## What's Actually Missing

### 1. Coupon Management UI (HIGH PRIORITY)
**Missing Files:**
- `/workspace/pages/dashboard.coupons.tsx` - Main coupon list/management page
- `/workspace/pages/dashboard.coupons.new.tsx` - Create/edit coupon form
- Integration in checkout page to apply coupons

**Status:** Backend ready, needs frontend

### 2. Product Reviews UI (MEDIUM PRIORITY)
**Missing Files:**
- `/workspace/pages/dashboard.reviews.tsx` - Merchant review moderation page
- Review display component on product/store pages
- Star rating component

**Status:** Backend ready, needs frontend

### 3. Subscription Flow Polish (LOW PRIORITY)
**Existing:** `/workspace/pages/dashboard.billing.tsx` is complete
**Needed:** 
- Verify subscription plans are seeded in database
- Test subscription webhook handling
- Add invoice viewing

## Recommended Action Plan

### Phase 1: Coupons (Critical for Sales)
1. Create `dashboard.coupons.tsx` page
2. Create `dashboard.coupons.new.tsx` form
3. Add coupon input to checkout page
4. Update cart context to handle discounts

### Phase 2: Reviews (Social Proof)
1. Create `dashboard.reviews.tsx` moderation page
2. Add review display to store/product pages
3. Create star rating component

### Phase 3: Testing & Polish
1. Run database seed scripts
2. Test all flows end-to-end
3. Fix any bugs found

## Files to Create
- `/workspace/pages/dashboard.coupons.tsx`
- `/workspace/pages/dashboard.coupons.new.tsx`
- `/workspace/pages/dashboard.reviews.tsx`
- `/workspace/components/StarRating.tsx`
- `/workspace/helpers/useCoupons.tsx`
- `/workspace/helpers/useReviews.tsx`

## Files to Update
- `/workspace/pages/checkout.tsx` - Add coupon input
- `/workspace/pages/store.tsx` or product detail - Add reviews display
- `/workspace/helpers/CartContext.tsx` - Add discount logic
