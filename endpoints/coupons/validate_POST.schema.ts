import { z } from "zod";

export const schema = z.object({
  code: z.string().min(1),
  cartTotal: z.number().positive(),
  userId: z.number().int().positive(),
  productIds: z.array(z.number().int().positive()).optional().default([]),
  isFirstOrder: z.boolean().default(false),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  valid: boolean;
  coupon?: {
    id: number;
    code: string;
    name: string;
    type: "percentage" | "fixed_amount" | "free_shipping";
    value: string;
    maxDiscountAmount: string | null;
  };
  discountAmount: string;
  message?: string;
};
