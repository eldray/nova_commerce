import { z } from "zod";

export const schema = z.object({
  description: z.string().max(500).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  supportPhone: z.string().optional(),
  address: z.string().max(200).optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean };
