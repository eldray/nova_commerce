import { z } from "zod";

export const schema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.enum(["active", "inactive", "expired"]).optional(),
  search: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  coupons: Array<{
    id: number;
    code: string;
    name: string;
    description: string | null;
    type: "percentage" | "fixed_amount" | "free_shipping";
    value: string;
    minPurchaseAmount: string | null;
    maxDiscountAmount: string | null;
    usageLimit: number | null;
    usageLimitPerUser: number | null;
    usedCount: number;
    status: "active" | "inactive" | "expired";
    startsAt: Date;
    expiresAt: Date | null;
    firstOrderOnly: boolean;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  totalPages: number;
};
