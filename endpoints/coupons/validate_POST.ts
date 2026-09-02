import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";
import { schema } from "./validate_POST.schema";

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const effectiveTenantId = tenantId || input.tenantId;

    if (!effectiveTenantId) {
      return new Response(superjson.stringify({ error: "Tenant ID is required" }), { status: 400 });
    }

    const code = input.code.toUpperCase().trim();
    const now = new Date();

    const coupon = await db
      .selectFrom("coupons")
      .where("tenantId", "=", effectiveTenantId)
      .where("code", "=", code)
      .selectAll()
      .executeTakeFirst();

    if (!coupon) {
      return new Response(
        superjson.stringify({
          valid: false,
          discountAmount: "0",
          message: "Invalid coupon code",
        })
      );
    }

    if (coupon.status !== "active") {
      return new Response(
        superjson.stringify({
          valid: false,
          discountAmount: "0",
          message: `Coupon is ${coupon.status}`,
        })
      );
    }

    if (new Date(coupon.startsAt) > now) {
      return new Response(
        superjson.stringify({
          valid: false,
          discountAmount: "0",
          message: "Coupon is not yet active",
        })
      );
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      await db
        .updateTable("coupons")
        .set({ status: "expired" })
        .where("id", "=", coupon.id)
        .execute();

      return new Response(
        superjson.stringify({
          valid: false,
          discountAmount: "0",
          message: "Coupon has expired",
        })
      );
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return new Response(
        superjson.stringify({
          valid: false,
          discountAmount: "0",
          message: "Coupon usage limit reached",
        })
      );
    }

    if (coupon.usageLimitPerUser && (user || input.userId)) {
      const targetUserId = user ? user.id : input.userId!;
      const userUsage = await db
        .selectFrom("couponUsages")
        .where("couponId", "=", coupon.id)
        .where("userId", "=", targetUserId)
        .select("id")
        .execute();

      if (userUsage.length >= coupon.usageLimitPerUser) {
        return new Response(
          superjson.stringify({
            valid: false,
            discountAmount: "0",
            message: "You have reached the usage limit for this coupon",
          })
        );
      }
    }

    if (coupon.firstOrderOnly && !input.isFirstOrder) {
      return new Response(
        superjson.stringify({
          valid: false,
          discountAmount: "0",
          message: "This coupon is only valid for first-time customers",
        })
      );
    }

    if (coupon.minPurchaseAmount) {
      const minAmount = parseFloat(String(coupon.minPurchaseAmount));
      if (input.cartTotal < minAmount) {
        return new Response(
          superjson.stringify({
            valid: false,
            discountAmount: "0",
            message: `Minimum purchase of GH₵${minAmount} required`,
          })
        );
      }
    }

    if (coupon.applicableProductIds && coupon.applicableProductIds.length > 0) {
      const hasApplicableProduct = input.productIds.some((pid) =>
        coupon.applicableProductIds!.includes(pid)
      );

      if (!hasApplicableProduct) {
        return new Response(
          superjson.stringify({
            valid: false,
            discountAmount: "0",
            message: "Coupon is not applicable to items in your cart",
          })
        );
      }
    }

    let discountAmount = 0;
    const couponValue = parseFloat(String(coupon.value));

    if (coupon.type === "percentage") {
      discountAmount = (input.cartTotal * couponValue) / 100;
      if (coupon.maxDiscountAmount) {
        const maxDiscount = parseFloat(String(coupon.maxDiscountAmount));
        discountAmount = Math.min(discountAmount, maxDiscount);
      }
    } else if (coupon.type === "fixed_amount") {
      discountAmount = couponValue;
      if (discountAmount > input.cartTotal) {
        discountAmount = input.cartTotal;
      }
    } else if (coupon.type === "free_shipping") {
      discountAmount = 0;
    }

    return new Response(
      superjson.stringify({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          discountType: coupon.type,
          discountValue: String(coupon.value),
          maxDiscountAmount: coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : null,
        },
        discountAmount: discountAmount.toFixed(2),
        message: "Coupon applied successfully",
      })
    );
  } catch (error: any) {
    console.error("Error validating coupon:", error);
    return new Response(superjson.stringify({ error: error.message || "Failed to validate coupon" }), { status: 400 });
  }
}
