import { getDb } from "../../../helpers/db";
import type { Context } from "../../../helpers/context";
import type { InputType, OutputType } from "./validate_POST.schema";

export async function handler(
  input: InputType,
  context: Context
): Promise<OutputType> {
  const db = await getDb();
  const { tenantId } = context;

  if (!tenantId) {
    throw new Error("Tenant ID is required");
  }

  const code = input.code.toUpperCase().trim();
  const now = new Date();

  // Find the coupon
  const coupon = await db
    .selectFrom("coupons")
    .where("tenantId", "=", tenantId)
    .where("code", "=", code)
    .selectAll()
    .executeTakeFirst();

  if (!coupon) {
    return {
      valid: false,
      discountAmount: "0",
      message: "Invalid coupon code",
    };
  }

  // Check status
  if (coupon.status !== "active") {
    return {
      valid: false,
      discountAmount: "0",
      message: `Coupon is ${coupon.status}`,
    };
  }

  // Check date validity
  if (new Date(coupon.startsAt) > now) {
    return {
      valid: false,
      discountAmount: "0",
      message: "Coupon is not yet active",
    };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    // Update status to expired
    await db
      .updateTable("coupons")
      .set("status", "expired")
      .where("id", "=", coupon.id)
      .execute();

    return {
      valid: false,
      discountAmount: "0",
      message: "Coupon has expired",
    };
  }

  // Check usage limits
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return {
      valid: false,
      discountAmount: "0",
      message: "Coupon usage limit reached",
    };
  }

  // Check per-user usage limit
  if (coupon.usageLimitPerUser) {
    const userUsage = await db
      .selectFrom("coupon_usages")
      .where("coupon_id", "=", coupon.id)
      .where("user_id", "=", input.userId)
      .select("id")
      .execute();

    if (userUsage.length >= coupon.usageLimitPerUser) {
      return {
        valid: false,
        discountAmount: "0",
        message: "You have reached the usage limit for this coupon",
      };
    }
  }

  // Check first order only
  if (coupon.firstOrderOnly && !input.isFirstOrder) {
    return {
      valid: false,
      discountAmount: "0",
      message: "This coupon is only valid for first-time customers",
    };
  }

  // Check minimum purchase amount
  if (coupon.minPurchaseAmount) {
    const minAmount = parseFloat(coupon.minPurchaseAmount);
    if (input.cartTotal < minAmount) {
      return {
        valid: false,
        discountAmount: "0",
        message: `Minimum purchase of GH₵${minAmount} required`,
      };
    }
  }

  // Check applicable products/categories
  if (
    coupon.applicableProductIds &&
    coupon.applicableProductIds.length > 0
  ) {
    const hasApplicableProduct = input.productIds.some((pid) =>
      coupon.applicableProductIds!.includes(pid)
    );

    if (!hasApplicableProduct) {
      return {
        valid: false,
        discountAmount: "0",
        message: "Coupon is not applicable to items in your cart",
      };
    }
  }

  // Calculate discount amount
  let discountAmount = 0;
  const couponValue = parseFloat(coupon.value);

  if (coupon.type === "percentage") {
    discountAmount = (input.cartTotal * couponValue) / 100;

    // Apply max discount cap if exists
    if (coupon.maxDiscountAmount) {
      const maxDiscount = parseFloat(coupon.maxDiscountAmount);
      discountAmount = Math.min(discountAmount, maxDiscount);
    }
  } else if (coupon.type === "fixed_amount") {
    discountAmount = couponValue;

    // Don't allow discount to exceed cart total
    if (discountAmount > input.cartTotal) {
      discountAmount = input.cartTotal;
    }
  } else if (coupon.type === "free_shipping") {
    // Free shipping - discount will be calculated at checkout
    discountAmount = 0;
  }

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      type: coupon.type as "percentage" | "fixed_amount" | "free_shipping",
      value: coupon.value,
      maxDiscountAmount: coupon.maxDiscountAmount,
    },
    discountAmount: discountAmount.toFixed(2),
    message: "Coupon applied successfully",
  };
}
