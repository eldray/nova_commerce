import { z } from "zod";

export const schema = z.object({
  name: z.string().min(2, "Product name is required").max(200),
  description: z.string().max(5000).optional(),
  sku: z.string().max(60).optional(),
  price: z.number().positive("Price must be greater than 0"),
  salePrice: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).default(10),
  lowStockThreshold: z.number().int().min(0).default(5),
  categoryId: z.number().int().positive().optional(),
  status: z.enum(["draft", "active", "archived"]).default("active"),
  images: z.array(z.string().url()).max(10).optional().default([]),
  primaryImage: z.string().url().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  id: number;
  slug: string;
};