import { z } from "zod";

export const schema = z.object({
  code: z.string().min(3).max(50),
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["percentage", "fixed_amount", "free_shipping"]),
  value: z.number().positive("Value must be greater than 0"),
  minPurchaseAmount: z.number().nonnegative().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  usageLimitPerUser: z.number().int().positive().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  applicableProductIds: z.array(z.number().int().positive()).optional().default([]),
  applicableCategoryIds: z.array(z.number().int().positive()).optional().default([]),
  firstOrderOnly: z.boolean().default(false),
  status: z.enum(["active", "inactive", "expired"]).default("active"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  id: number;
  code: string;
};
