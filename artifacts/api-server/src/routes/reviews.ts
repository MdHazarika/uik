import { Router } from "express";
import { db, reviewsTable, barbersTable, usersTable } from "@workspace/db";
import { eq, avg, sql } from "drizzle-orm";

const router = Router();

router.post("/", async (req, res) => {
  const { bookingId, barberId, rating, comment } = req.body;
  const cookieUserId = parseInt(req.cookies?.userId ?? "0");
  
  if (!bookingId || !barberId || !rating) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }
  
  const [review] = await db.insert(reviewsTable).values({
    bookingId, barberId, userId: cookieUserId || 1,
    rating, comment: comment ?? null,
  }).returning();
  
  const allReviews = await db.select({ rating: reviewsTable.rating }).from(reviewsTable)
    .where(eq(reviewsTable.barberId, barberId));
  const avgRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length : 0;
  
  await db.update(barbersTable).set({
    rating: String(avgRating.toFixed(2)),
    totalReviews: allReviews.length,
    updatedAt: new Date(),
  }).where(eq(barbersTable.id, barberId));
  
  const [rUser] = await db.select().from(usersTable).where(eq(usersTable.id, review.userId)).limit(1);
  return res.status(201).json({ ...review, userName: rUser?.name ?? "User", userAvatar: rUser?.avatar ?? null });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
  return res.json({ message: "Review deleted" });
});

export default router;
