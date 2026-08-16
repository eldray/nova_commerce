import { z } from "zod";

export const schema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().min(10).max(2000),
  orderId: z.number().int().positive().optional(),
  images: z.array(z.string().url()).max(5).optional().default([]),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  id: number;
  status: "pending" | "approved" | "rejected";
  isVerifiedPurchase: boolean;
};
