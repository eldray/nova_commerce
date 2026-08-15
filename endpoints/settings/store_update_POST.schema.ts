import { z } from "zod";

export const schema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  tagline: z.string().max(100).optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean };
