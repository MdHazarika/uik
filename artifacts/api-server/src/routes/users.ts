import { Router } from "express";
import { db, usersTable, bookingsTable, barbersTable, servicesTable, reviewsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

const router = Router();

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) return res.status(404).json({ message: "User not found" });
  const { password: _p, ...safeUser } = user;
  return res.json(safeUser);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, avatar, loyaltyPoints } = req.body;
  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (avatar !== undefined) updates.avatar = avatar;
  if (loyaltyPoints !== undefined) updates.loyaltyPoints = loyaltyPoints;
  updates.updatedAt = new Date();
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) return res.status(404).json({ message: "User not found" });
  const { password: _p, ...safeUser } = user;
  return res.json(safeUser);
});

router.get("/:id/bookings", async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.query;
  
  const conditions = [eq(bookingsTable.userId, id)];
  if (status) conditions.push(eq(bookingsTable.status, status as any));
  
  const bookings = await db.select().from(bookingsTable)
    .where(and(...conditions))
    .orderBy(bookingsTable.createdAt);
  
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

function formatBooking(b: any, barberUser: any, bookingUser: any, services: any[]) {
  return {
    id: b.id, userId: b.userId, barberId: b.barberId,
    barberName: barberUser?.name ?? "Unknown Barber",
    barberAvatar: barberUser?.avatar ?? null,
    userName: bookingUser?.name ?? "Unknown User",
    services: services.map(s => ({
      id: s.id, barberId: s.barberId, serviceTypeId: s.serviceTypeId,
      name: s.name, price: parseFloat(s.price), durationMinutes: s.durationMinutes,
      description: s.description, isActive: s.isActive,
    })),
    date: b.date, startTime: b.startTime, endTime: b.endTime,
    totalDuration: b.totalDuration, totalAmount: parseFloat(b.totalAmount),
    discountAmount: parseFloat(b.discountAmount), finalAmount: parseFloat(b.finalAmount),
    isHomeService: b.isHomeService, address: b.address,
    paymentMethod: b.paymentMethod, paymentStatus: b.paymentStatus,
    status: b.status, couponCode: b.couponCode, notes: b.notes, cancelReason: b.cancelReason,
    createdAt: b.createdAt,
  };
}

export { formatBooking };
export default router;
