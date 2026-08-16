import { z } from "zod";

export const schema = z.object({
  reviewId: z.number().int().positive(),
  isHelpful: z.boolean(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  helpfulCount: number;
  notHelpfulCount: number;
  userVoted: boolean;
};
