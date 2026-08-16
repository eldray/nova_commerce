import { z } from "zod";

export const schema = z.object({
  productId: z.number().int().positive(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
  status: z.enum(["pending", "approved", "rejected"]).optional().default("approved"),
  rating: z.number().int().min(1).max(5).optional(),
  verifiedOnly: z.boolean().default(false),
  sortBy: z.enum(["newest", "oldest", "highest", "lowest", "helpful"]).default("newest"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  reviews: Array<{
    id: number;
    rating: number;
    title: string | null;
    content: string;
    status: "pending" | "approved" | "rejected";
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    notHelpfulCount: number;
    merchantResponse: string | null;
    merchantResponseAt: Date | null;
    createdAt: Date;
    user: {
      name: string;
      avatarUrl: string | null;
    };
  }>;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  page: number;
  totalPages: number;
};
