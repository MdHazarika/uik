import { Router } from "express";
import { db, shopsTable, barbersTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { city, area, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const conditions: any[] = [];
  if (city) conditions.push(eq(shopsTable.city, city));
  if (area) conditions.push(eq(shopsTable.area, area));
  
  const shops = await db.select().from(shopsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(parseInt(limit)).offset(parseInt(offset));
  
  const enriched = await Promise.all(shops.map(async (s) => {
    const barbers = await db.select().from(barbersTable).where(eq(barbersTable.shopId, s.id));
    return {
      id: s.id, ownerId: s.ownerId, name: s.name, description: s.description,
      city: s.city, area: s.area, address: s.address, phone: s.phone,
      images: s.images, openTime: s.openTime, closeTime: s.closeTime,
      rating: parseFloat(s.rating ?? "0"), totalBarbers: barbers.length, createdAt: s.createdAt,
    };
  }));
  return res.json(enriched);
});

router.post("/", async (req, res) => {
  const { ownerId, name, description, city, area, address, phone, images, openTime, closeTime } = req.body;
  const [shop] = await db.insert(shopsTable).values({
    ownerId, name, description: description ?? null, city, area,
    address: address ?? null, phone: phone ?? null,
    images: images ?? [], openTime: openTime ?? "09:00", closeTime: closeTime ?? "20:00",
  }).returning();
  return res.status(201).json({ ...shop, rating: 0, totalBarbers: 0 });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, id)).limit(1);
  if (!shop) return res.status(404).json({ message: "Shop not found" });
  const barbers = await db.select().from(barbersTable).where(eq(barbersTable.shopId, id));
  const enrichedBarbers = await Promise.all(barbers.map(async (b) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, b.userId)).limit(1);
    return {
      id: b.id, userId: b.userId, shopId: b.shopId, name: user?.name ?? "Unknown",
      avatar: user?.avatar ?? null, experience: b.experience, bio: b.bio,
      city: b.city, area: b.area, address: b.address,
      homeService: b.homeService, homeServiceCharge: parseFloat(b.homeServiceCharge ?? "0"),
      workingHoursStart: b.workingHoursStart, workingHoursEnd: b.workingHoursEnd,
      skills: b.skills, portfolioImages: b.portfolioImages,
      rating: parseFloat(b.rating ?? "0"), totalReviews: b.totalReviews,
      totalBookings: b.totalBookings, isAvailable: b.isAvailable, createdAt: b.createdAt,
    };
  }));
  return res.json({
    id: shop.id, ownerId: shop.ownerId, name: shop.name, description: shop.description,
    city: shop.city, area: shop.area, address: shop.address, phone: shop.phone,
    images: shop.images, openTime: shop.openTime, closeTime: shop.closeTime,
    rating: parseFloat(shop.rating ?? "0"), totalBarbers: barbers.length,
    createdAt: shop.createdAt, barbers: enrichedBarbers,
  });
});

export default router;
