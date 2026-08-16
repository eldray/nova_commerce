import { z } from "zod";

export const schema = z.object({
  reviewId: z.number().int().positive(),
  status: z.enum(["pending", "approved", "rejected"]),
  merchantResponse: z.string().max(1000).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  id: number;
  status: "pending" | "approved" | "rejected";
  merchantResponse: string | null;
  merchantResponseAt: Date | null;
};
