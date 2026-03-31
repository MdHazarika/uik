import { Router } from "express";
import { db, barbersTable, usersTable, servicesTable, bookingsTable, reviewsTable, shopsTable } from "@workspace/db";
import { eq, and, gte, lte, sql, desc, inArray } from "drizzle-orm";
import { formatBooking } from "./users";

const router = Router();

function formatBarber(barber: any, user: any) {
  return {
    id: barber.id, userId: barber.userId,
    shopId: barber.shopId ?? null,
    name: user?.name ?? "Unknown",
    avatar: user?.avatar ?? null,
    experience: barber.experience,
    bio: barber.bio ?? null,
    city: barber.city, area: barber.area,
    address: barber.address ?? null,
    latitude: barber.latitude ? parseFloat(barber.latitude) : null,
    longitude: barber.longitude ? parseFloat(barber.longitude) : null,
    homeService: barber.homeService,
    homeServiceCharge: parseFloat(barber.homeServiceCharge ?? "0"),
    workingHoursStart: barber.workingHoursStart,
    workingHoursEnd: barber.workingHoursEnd,
    skills: barber.skills ?? [],
    portfolioImages: barber.portfolioImages ?? [],
    rating: parseFloat(barber.rating ?? "0"),
    totalReviews: barber.totalReviews,
    totalBookings: barber.totalBookings,
    isAvailable: barber.isAvailable,
    createdAt: barber.createdAt,
  };
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMin = h * 60 + m + minutes;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

router.get("/", async (req, res) => {
  const { city, area, homeService, sortBy, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
  const minExperience = req.query.minExperience ? parseInt(req.query.minExperience as string) : undefined;

  const conditions: any[] = [];
  if (city) conditions.push(eq(barbersTable.city, city));
  if (area) conditions.push(eq(barbersTable.area, area));
  if (homeService === "true") conditions.push(eq(barbersTable.homeService, true));
  if (minRating !== undefined) conditions.push(gte(barbersTable.rating, String(minRating)));
  if (minExperience !== undefined) conditions.push(gte(barbersTable.experience, minExperience));

  const barbers = await db.select().from(barbersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(parseInt(limit))
    .offset(parseInt(offset));

  const total = await db.select({ count: sql<number>`count(*)` }).from(barbersTable)
    .where(conditions.length ? and(...conditions) : undefined);

  const enriched = await Promise.all(barbers.map(async (barber) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, barber.userId)).limit(1);
    const formatted = formatBarber(barber, user);
    return formatted;
  }));

  const totalCount = Number(total[0]?.count ?? 0);
  return res.json({ barbers: enriched, total: totalCount, hasMore: parseInt(offset) + enriched.length < totalCount });
});

router.get("/top-rated", async (req, res) => {
  const { city, limit = "6" } = req.query as Record<string, string>;
  const conditions: any[] = [];
  if (city) conditions.push(eq(barbersTable.city, city));
  
  const barbers = await db.select().from(barbersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(barbersTable.rating))
    .limit(parseInt(limit));
  
  const enriched = await Promise.all(barbers.map(async (barber) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, barber.userId)).limit(1);
    return formatBarber(barber, user);
  }));
  
  return res.json(enriched);
});

router.post("/", async (req, res) => {
  const { userId, shopId, experience, bio, city, area, address, latitude, longitude, homeService, homeServiceCharge, workingHoursStart, workingHoursEnd, skills, portfolioImages } = req.body;
  const [barber] = await db.insert(barbersTable).values({
    userId, shopId: shopId ?? null, experience: experience ?? 0, bio: bio ?? null, city, area,
    address: address ?? null,
    latitude: latitude ? String(latitude) : null,
    longitude: longitude ? String(longitude) : null,
    homeService: homeService ?? false,
    homeServiceCharge: homeServiceCharge ? String(homeServiceCharge) : "0",
    workingHoursStart: workingHoursStart ?? "09:00",
    workingHoursEnd: workingHoursEnd ?? "20:00",
    skills: skills ?? [], portfolioImages: portfolioImages ?? [],
    isAvailable: true,
  }).returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, barber.userId)).limit(1);
  return res.status(201).json(formatBarber(barber, user));
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [barber] = await db.select().from(barbersTable).where(eq(barbersTable.id, id)).limit(1);
  if (!barber) return res.status(404).json({ message: "Barber not found" });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, barber.userId)).limit(1);
  const services = await db.select().from(servicesTable).where(eq(servicesTable.barberId, id));
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.barberId, id))
    .orderBy(desc(reviewsTable.createdAt)).limit(5);
  const enrichedReviews = await Promise.all(reviews.map(async (r) => {
    const [rUser] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId)).limit(1);
    return { ...r, userName: rUser?.name ?? "User", userAvatar: rUser?.avatar ?? null };
  }));
  let shopName = null;
  if (barber.shopId) {
    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, barber.shopId)).limit(1);
    shopName = shop?.name ?? null;
  }
  return res.json({
    ...formatBarber(barber, user),
    services: services.map(s => ({ ...s, price: parseFloat(s.price) })),
    recentReviews: enrichedReviews,
    shopName,
  });
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const updates: Record<string, any> = { updatedAt: new Date() };
  const fields = ["experience", "bio", "city", "area", "address", "homeService", "homeServiceCharge", "workingHoursStart", "workingHoursEnd", "skills", "portfolioImages", "isAvailable"];
  fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  if (updates.homeServiceCharge) updates.homeServiceCharge = String(updates.homeServiceCharge);
  const [barber] = await db.update(barbersTable).set(updates).where(eq(barbersTable.id, id)).returning();
  if (!barber) return res.status(404).json({ message: "Barber not found" });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, barber.userId)).limit(1);
  return res.json(formatBarber(barber, user));
});

router.get("/:id/availability", async (req, res) => {
  const id = parseInt(req.params.id);
  const { date, serviceIds } = req.query as Record<string, string>;
  if (!date) return res.status(400).json({ message: "Date is required" });

  const [barber] = await db.select().from(barbersTable).where(eq(barbersTable.id, id)).limit(1);
  if (!barber) return res.status(404).json({ message: "Barber not found" });

  const existingBookings = await db.select().from(bookingsTable)
    .where(and(eq(bookingsTable.barberId, id), eq(bookingsTable.date, date),
      sql`status NOT IN ('cancelled')`));

  const selectedServiceDuration = 30;
  const slots = [];
  let currentTime = barber.workingHoursStart;
  const endTime = barber.workingHoursEnd;

  while (timeToMinutes(currentTime) + selectedServiceDuration <= timeToMinutes(endTime)) {
    const slotEnd = addMinutesToTime(currentTime, selectedServiceDuration);
    const isBooked = existingBookings.some(b => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      const sStart = timeToMinutes(currentTime);
      const sEnd = timeToMinutes(slotEnd);
      return !(sEnd <= bStart || sStart >= bEnd);
    });
    slots.push({ startTime: currentTime, endTime: slotEnd, available: !isBooked });
    currentTime = addMinutesToTime(currentTime, 30);
  }

  const nextAvail = slots.find(s => s.available)?.startTime ?? null;
  return res.json({ date, slots, nextAvailable: nextAvail });
});

router.get("/:id/bookings", async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, date } = req.query as Record<string, string>;
  const conditions: any[] = [eq(bookingsTable.barberId, id)];
  if (status) conditions.push(eq(bookingsTable.status, status as any));
  if (date) conditions.push(eq(bookingsTable.date, date));

  const bookings = await db.select().from(bookingsTable)
    .where(and(...conditions))
    .orderBy(bookingsTable.date, bookingsTable.startTime);

  const enriched = await Promise.all(bookings.map(async (b) => {
    const [barber] = await db.select().from(barbersTable).where(eq(barbersTable.id, b.barberId)).limit(1);
    const [barberUser] = barber ? await db.select().from(usersTable).where(eq(usersTable.id, barber.userId)).limit(1) : [null];
    const [bookingUser] = await db.select().from(usersTable).where(eq(usersTable.id, b.userId)).limit(1);
    const services = b.serviceIds.length > 0
      ? await db.select().from(servicesTable).where(inArray(servicesTable.id, b.serviceIds))
      : [];
    return formatBooking(b, barberUser, bookingUser, services);
  }));
  return res.json(enriched);
});

router.get("/:id/reviews", async (req, res) => {
  const id = parseInt(req.params.id);
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.barberId, id))
    .orderBy(desc(reviewsTable.createdAt));
  const enriched = await Promise.all(reviews.map(async (r) => {
    const [rUser] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId)).limit(1);
    return { ...r, userName: rUser?.name ?? "User", userAvatar: rUser?.avatar ?? null };
  }));
  return res.json(enriched);
});

router.get("/:id/services", async (req, res) => {
  const id = parseInt(req.params.id);
  const services = await db.select().from(servicesTable).where(eq(servicesTable.barberId, id));
  return res.json(services.map(s => ({ ...s, price: parseFloat(s.price) })));
});

router.get("/:id/dashboard", async (req, res) => {
  const id = parseInt(req.params.id);
  const today = new Date().toISOString().split("T")[0];
  const allBookings = await db.select().from(bookingsTable).where(eq(bookingsTable.barberId, id));
  const todayBookings = allBookings.filter(b => b.date === today);
  const pending = allBookings.filter(b => b.status === "pending").length;
  const completed = allBookings.filter(b => b.status === "completed").length;
  const totalEarnings = allBookings.filter(b => b.status === "completed").reduce((sum, b) => sum + parseFloat(b.finalAmount), 0);
  const todayEarnings = todayBookings.filter(b => b.status === "completed").reduce((sum, b) => sum + parseFloat(b.finalAmount), 0);
  const [barber] = await db.select().from(barbersTable).where(eq(barbersTable.id, id)).limit(1);
  
  const recentRaw = await db.select().from(bookingsTable).where(eq(bookingsTable.barberId, id))
    .orderBy(desc(bookingsTable.createdAt)).limit(5);
  const recentBookings = await Promise.all(recentRaw.map(async (b) => {
    const [barberRec] = await db.select().from(barbersTable).where(eq(barbersTable.id, b.barberId)).limit(1);
    const [barberUser] = barberRec ? await db.select().from(usersTable).where(eq(usersTable.id, barberRec.userId)).limit(1) : [null];
    const [bookingUser] = await db.select().from(usersTable).where(eq(usersTable.id, b.userId)).limit(1);
    const services = b.serviceIds.length > 0
      ? await db.select().from(servicesTable).where(inArray(servicesTable.id, b.serviceIds))
      : [];
    return formatBooking(b, barberUser, bookingUser, services);
  }));
  
  return res.json({
    totalBookings: allBookings.length,
    todayBookings: todayBookings.length,
    pendingBookings: pending,
    completedBookings: completed,
    totalEarnings, todayEarnings,
    averageRating: parseFloat(barber?.rating ?? "0"),
    totalReviews: barber?.totalReviews ?? 0,
    recentBookings,
  });
});

router.get("/:id/earnings", async (req, res) => {
  const id = parseInt(req.params.id);
  const { period = "month" } = req.query as Record<string, string>;
  const bookings = await db.select().from(bookingsTable)
    .where(and(eq(bookingsTable.barberId, id), eq(bookingsTable.status, "completed")));
  
  const total = bookings.reduce((sum, b) => sum + parseFloat(b.finalAmount), 0);
  
  const breakdown: { label: string; amount: number }[] = [];
  if (period === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayStr = d.toISOString().split("T")[0];
      const amount = bookings.filter(b => b.date === dayStr).reduce((sum, b) => sum + parseFloat(b.finalAmount), 0);
      breakdown.push({ label, amount });
    }
  } else if (period === "month") {
    for (let i = 1; i <= 4; i++) {
      const label = `Week ${i}`;
      const amount = bookings.filter(b => {
        const d = new Date(b.date); return Math.ceil(d.getDate() / 7) === i;
      }).reduce((sum, b) => sum + parseFloat(b.finalAmount), 0);
      breakdown.push({ label, amount });
    }
  } else {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    months.forEach((label, idx) => {
      const amount = bookings.filter(b => new Date(b.date).getMonth() === idx).reduce((sum, b) => sum + parseFloat(b.finalAmount), 0);
      breakdown.push({ label, amount });
    });
  }
  
  return res.json({ total, period, breakdown });
});

export default router;
