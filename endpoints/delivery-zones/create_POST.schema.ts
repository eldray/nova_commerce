import { z } from "zod";

export const schema = z.object({
  name: z.string().min(1, "Zone name is required").max(100),
  fee: z.number().min(0, "Fee must be non-negative"),
  freeDeliveryThreshold: z.number().min(0).optional(),
  estimatedDaysMin: z.number().int().min(1),
  estimatedDaysMax: z.number().int().min(1),
});

export type Schema = z.infer<typeof schema>;
