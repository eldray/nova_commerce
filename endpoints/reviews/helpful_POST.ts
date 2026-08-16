import { getDb } from "../../../helpers/db";
import type { Context } from "../../../helpers/context";
import type { InputType, OutputType } from "./helpful_POST.schema";

export async function handler(
  input: InputType,
  context: Context
): Promise<OutputType> {
  const db = await getDb();
  const { userId } = context;

  if (!userId) {
    throw new Error("You must be logged in to vote on reviews");
  }

  // Check if review exists
  const review = await db
    .selectFrom("product_reviews")
    .where("id", "=", input.reviewId)
    .select(["id", "helpfulCount", "notHelpfulCount"])
    .executeTakeFirst();

  if (!review) {
    throw new Error("Review not found");
  }

  // Check if user already voted
  const existingVote = await db
    .selectFrom("review_helpfulness")
    .where("reviewId", "=", input.reviewId)
    .where("userId", "=", userId)
    .selectAll()
    .executeTakeFirst();

  let helpfulCount = Number(review.helpfulCount);
  let notHelpfulCount = Number(review.notHelpfulCount);
  let userVoted = false;

  if (existingVote) {
    // User wants to change or remove vote
    if (existingVote.isHelpful === input.isHelpful) {
      // Remove vote (toggle off)
      await db
        .deleteFrom("review_helpfulness")
        .where("reviewId", "=", input.reviewId)
        .where("userId", "=", userId)
        .execute();

      if (existingVote.isHelpful) {
        helpfulCount -= 1;
      } else {
        notHelpfulCount -= 1;
      }
      userVoted = false;
    } else {
      // Change vote
      await db
        .updateTable("review_helpfulness")
        .set("isHelpful", input.isHelpful)
        .where("reviewId", "=", input.reviewId)
        .where("userId", "=", userId)
        .execute();

      if (input.isHelpful) {
        helpfulCount += 1;
        notHelpfulCount -= 1;
      } else {
        helpfulCount -= 1;
        notHelpfulCount += 1;
      }
      userVoted = true;
    }
  } else {
    // New vote
    await db
      .insertInto("review_helpfulness")
      .values({
        reviewId: input.reviewId,
        userId,
        isHelpful: input.isHelpful,
      })
      .execute();

    if (input.isHelpful) {
      helpfulCount += 1;
    } else {
      notHelpfulCount += 1;
    }
    userVoted = true;
  }

  // Update the review counts
  await db
    .updateTable("product_reviews")
    .set({
      helpfulCount,
      notHelpfulCount,
      updatedAt: new Date(),
    })
    .where("id", "=", input.reviewId)
    .execute();

  return {
    helpfulCount,
    notHelpfulCount,
    userVoted,
  };
}
