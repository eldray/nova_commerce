import { z } from "zod";

export const inputSchema = z.object({
  image: z.string(), // Base64 encoded image
  folder: z.string().optional().default("products"),
});

export type InputType = z.infer<typeof inputSchema>;

export const outputSchema = z.object({
  success: z.boolean(),
  image: z.object({
    url: z.string(),
    publicId: z.string(),
    width: z.number(),
    height: z.number(),
    format: z.string(),
    bytes: z.number(),
  }),
});

export type OutputType = z.infer<typeof outputSchema>;
