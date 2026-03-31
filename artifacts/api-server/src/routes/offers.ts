import { Router } from "express";
import { db, offersTable, bookingsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const now = new Date();
  const offers = await db.select().from(offersTable).where(eq(offersTable.isActive, true));
  const active = offers.filter(o => !o.validUntil || new Date(o.validUntil) > now);
  return res.json(active.map(o => ({
    ...o,
    discountValue: parseFloat(o.discountValue),
    minBookingAmount: parseFloat(o.minBookingAmount ?? "0"),
    maxDiscount: o.maxDiscount ? parseFloat(o.maxDiscount) : null,
  })));
});

router.post("/", async (req, res) => {
  const { code, description, discountType, discountValue, minBookingAmount, maxDiscount, validFrom, validUntil, maxUsage, isFirstTimeOnly } = req.body;
  const [offer] = await db.insert(offersTable).values({
    code: code.toUpperCase(), description, discountType,
    discountValue: String(discountValue),
    minBookingAmount: minBookingAmount ? String(minBookingAmount) : "0",
    maxDiscount: maxDiscount ? String(maxDiscount) : null,
    validFrom: validFrom ? new Date(validFrom) : new Date(),
    validUntil: validUntil ? new Date(validUntil) : null,
    maxUsage: maxUsage ?? null, currentUsage: 0,
    isFirstTimeOnly: isFirstTimeOnly ?? false, isActive: true,
  }).returning();
  return res.status(201).json({
    ...offer,
    discountValue: parseFloat(offer.discountValue),
    minBookingAmount: parseFloat(offer.minBookingAmount ?? "0"),
    maxDiscount: offer.maxDiscount ? parseFloat(offer.maxDiscount) : null,
  });
});

router.post("/validate", async (req, res) => {
  const { code, userId, amount } = req.body;
  if (!code) return res.json({ valid: false, message: "No coupon code provided" });
  
  const [offer] = await db.select().from(offersTable).where(eq(offersTable.code, code.toUpperCase())).limit(1);
  if (!offer || !offer.isActive) return res.json({ valid: false, message: "Invalid coupon code" });
  
  const now = new Date();
  if (offer.validUntil && new Date(offer.validUntil) < now) {
    return res.json({ valid: false, message: "Coupon has expired" });
  }
  if (offer.maxUsage && offer.currentUsage >= offer.maxUsage) {
    return res.json({ valid: false, message: "Coupon usage limit reached" });
  }
  if (parseFloat(offer.minBookingAmount ?? "0") > amount) {
    return res.json({ valid: false, message: `Minimum booking amount is ₹${offer.minBookingAmount}` });
  }
  
  if (offer.isFirstTimeOnly) {
    const prevBookings = await db.select().from(bookingsTable).where(eq(bookingsTable.userId, userId)).limit(1);
    if (prevBookings.length > 0) {
      return res.json({ valid: false, message: "This coupon is for first-time users only" });
    }
  }
  
  let discountAmount = 0;
  if (offer.discountType === "percentage") {
    discountAmount = (amount * parseFloat(offer.discountValue)) / 100;
    if (offer.maxDiscount) discountAmount = Math.min(discountAmount, parseFloat(offer.maxDiscount));
  } else {
    discountAmount = parseFloat(offer.discountValue);
  }
  discountAmount = Math.min(discountAmount, amount);
  
  return res.json({ valid: true, discountAmount, message: `Coupon applied! You save ₹${discountAmount.toFixed(2)}` });
});

export default router;
