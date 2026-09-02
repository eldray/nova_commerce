import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";
import { schema } from "./helpful_POST.schema";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (!user) {
      return new Response(superjson.stringify({ error: "You must be logged in to vote on reviews" }), { status: 401 });
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const review = await db
      .selectFrom("productReviews")
      .where("id", "=", input.reviewId)
      .select(["id", "helpfulCount", "notHelpfulCount"])
      .executeTakeFirst();

    if (!review) {
      return new Response(superjson.stringify({ error: "Review not found" }), { status: 404 });
    }

    const existingVote = await db
      .selectFrom("reviewHelpfulness")
      .where("reviewId", "=", input.reviewId)
      .where("userId", "=", user.id)
      .selectAll()
      .executeTakeFirst();

    let helpfulCount = Number(review.helpfulCount);
    let notHelpfulCount = Number(review.notHelpfulCount);
    let userVoted = false;

    if (existingVote) {
      if (existingVote.isHelpful === input.isHelpful) {
        await db
          .deleteFrom("reviewHelpfulness")
          .where("reviewId", "=", input.reviewId)
          .where("userId", "=", user.id)
          .execute();

        if (existingVote.isHelpful) {
          helpfulCount = Math.max(0, helpfulCount - 1);
        } else {
          notHelpfulCount = Math.max(0, notHelpfulCount - 1);
        }
        userVoted = false;
      } else {
        await db
          .updateTable("reviewHelpfulness")
          .set({ isHelpful: input.isHelpful })
          .where("reviewId", "=", input.reviewId)
          .where("userId", "=", user.id)
          .execute();

        if (input.isHelpful) {
          helpfulCount += 1;
          notHelpfulCount = Math.max(0, notHelpfulCount - 1);
        } else {
          helpfulCount = Math.max(0, helpfulCount - 1);
          notHelpfulCount += 1;
        }
        userVoted = true;
      }
    } else {
      await db
        .insertInto("reviewHelpfulness")
        .values({
          reviewId: input.reviewId,
          userId: user.id,
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

    await db
      .updateTable("productReviews")
      .set({
        helpfulCount,
        notHelpfulCount,
        updatedAt: new Date(),
      })
      .where("id", "=", input.reviewId)
      .execute();

    return new Response(
      superjson.stringify({
        helpfulCount,
        notHelpfulCount,
        userVoted,
      })
    );
  } catch (error: any) {
    console.error("Error voting on review:", error);
    return new Response(superjson.stringify({ error: error.message || "Failed to vote on review" }), { status: 400 });
  }
}
