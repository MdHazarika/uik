import { Router } from "express";
import { db, usersTable, barbersTable, shopsTable, bookingsTable, offersTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/stats", async (_req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const [totalBarbers] = await db.select({ count: sql<number>`count(*)` }).from(barbersTable);
  const [totalShops] = await db.select({ count: sql<number>`count(*)` }).from(shopsTable);
  const allBookings = await db.select().from(bookingsTable);
  const completedBookings = allBookings.filter(b => b.status === "completed");
  const cancelledBookings = allBookings.filter(b => b.status === "cancelled");
  const todayBookings = allBookings.filter(b => b.date === today);
  const totalRevenue = completedBookings.reduce((sum, b) => sum + parseFloat(b.finalAmount), 0);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenue = completedBookings
    .filter(b => new Date(b.createdAt) >= monthStart)
    .reduce((sum, b) => sum + parseFloat(b.finalAmount), 0);
  const [activeOffers] = await db.select({ count: sql<number>`count(*)` }).from(offersTable).where(eq(offersTable.isActive, true));
  
  return res.json({
    totalUsers: Number(totalUsers?.count ?? 0),
    totalBarbers: Number(totalBarbers?.count ?? 0),
    totalShops: Number(totalShops?.count ?? 0),
    totalBookings: allBookings.length,
    completedBookings: completedBookings.length,
    cancelledBookings: cancelledBookings.length,
    totalRevenue, monthlyRevenue,
    activeOffers: Number(activeOffers?.count ?? 0),
    todayBookings: todayBookings.length,
    growthRate: 12.5,
  });
});

router.get("/users", async (req, res) => {
  const { role, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const conditions: any[] = [];
  if (role) conditions.push(eq(usersTable.role, role as any));
  
  const users = await db.select().from(usersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(parseInt(limit)).offset(parseInt(offset));
  const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(usersTable)
    .where(conditions.length ? and(...conditions) : undefined);
  
  return res.json({
    users: users.map(({ password: _p, ...u }) => u),
    total: Number(totalCount?.count ?? 0),
  });
});

router.get("/bookings", async (req, res) => {
  const { status, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const conditions: any[] = [];
  if (status) conditions.push(eq(bookingsTable.status, status as any));
  
  const bookings = await db.select().from(bookingsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(bookingsTable.createdAt))
    .limit(parseInt(limit)).offset(parseInt(offset));
  const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(bookingsTable)
    .where(conditions.length ? and(...conditions) : undefined);

  const { inArray } = await import("drizzle-orm");
  const { servicesTable } = await import("@workspace/db");
  const { formatBooking } = await import("./users");
  
  const enriched = await Promise.all(bookings.map(async (b) => {
    const [barber] = await db.select().from(barbersTable).where(eq(barbersTable.id, b.barberId)).limit(1);
    const [barberUser] = barber ? await db.select().from(usersTable).where(eq(usersTable.id, barber.userId)).limit(1) : [null];
    const [bookingUser] = await db.select().from(usersTable).where(eq(usersTable.id, b.userId)).limit(1);
    const services = b.serviceIds.length > 0
      ? await db.select().from(servicesTable).where(inArray(servicesTable.id, b.serviceIds)) : [];
    return formatBooking(b, barberUser, bookingUser, services);
  }));
  
  return res.json({ bookings: enriched, total: Number(totalCount?.count ?? 0) });
});

router.get("/revenue", async (req, res) => {
  const { period = "month" } = req.query as Record<string, string>;
  const bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.status, "completed"));
  const total = bookings.reduce((sum, b) => sum + parseFloat(b.finalAmount), 0);
  
  const breakdown: { label: string; revenue: number; bookings: number }[] = [];
  if (period === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayStr = d.toISOString().split("T")[0];
      const dayBookings = bookings.filter(b => b.date === dayStr);
      breakdown.push({ label, revenue: dayBookings.reduce((sum, b) => sum + parseFloat(b.finalAmount), 0), bookings: dayBookings.length });
    }
  } else if (period === "month") {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    months.forEach((label, idx) => {
      const mb = bookings.filter(b => new Date(b.date).getMonth() === idx);
      breakdown.push({ label, revenue: mb.reduce((sum, b) => sum + parseFloat(b.finalAmount), 0), bookings: mb.length });
    });
  } else {
    for (let y = 2023; y <= new Date().getFullYear(); y++) {
      const yb = bookings.filter(b => new Date(b.date).getFullYear() === y);
      breakdown.push({ label: String(y), revenue: yb.reduce((sum, b) => sum + parseFloat(b.finalAmount), 0), bookings: yb.length });
    }
  }
  
  return res.json({ period, total, breakdown });
});

export default router;
