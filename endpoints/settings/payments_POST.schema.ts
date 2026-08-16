import { z } from "zod";

export const schema = z.object({
  provider: z.enum(["paystack", "hubtel"]),
  isActive: z.boolean(),
  credentials: z.union([
    z.object({
      secretKey: z.string().min(1, "Secret key is required"),
      publicKey: z.string().optional(),
    }),
    z.object({
      merchantId: z.string().optional(),
      apiKey: z.string().optional(),
      secretKey: z.string().min(1, "Secret key is required"),
    }),
  ]),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean; provider: string };
