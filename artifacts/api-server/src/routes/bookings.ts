import { Router } from "express";
import { db, bookingsTable, barbersTable, usersTable, servicesTable, offersTable } from "@workspace/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { formatBooking } from "./users";

const router = Router();

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMin = h * 60 + m + minutes;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

router.get("/", async (req, res) => {
  const { status, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const conditions: any[] = [];
  if (status) conditions.push(eq(bookingsTable.status, status as any));
  const bookings = await db.select().from(bookingsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(parseInt(limit)).offset(parseInt(offset));
  const enriched = await Promise.all(bookings.map(async (b) => {
    const [barber] = await db.select().from(barbersTable).where(eq(barbersTable.id, b.barberId)).limit(1);
    const [barberUser] = barber ? await db.select().from(usersTable).where(eq(usersTable.id, barber.userId)).limit(1) : [null];
    const [bookingUser] = await db.select().from(usersTable).where(eq(usersTable.id, b.userId)).limit(1);
    const services = b.serviceIds.length > 0
      ? await db.select().from(servicesTable).where(inArray(servicesTable.id, b.serviceIds)) : [];
    return formatBooking(b, barberUser, bookingUser, services);
  }));
  return res.json(enriched);
});

router.post("/", async (req, res) => {
  const { userId, barberId, serviceIds, date, startTime, isHomeService, address, paymentMethod, couponCode, notes } = req.body;
  
  if (!userId || !barberId || !serviceIds?.length || !date || !startTime) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  
  const [barber] = await db.select().from(barbersTable).where(eq(barbersTable.id, barberId)).limit(1);
  if (!barber) return res.status(404).json({ message: "Barber not found" });
  
  const services = await db.select().from(servicesTable).where(inArray(servicesTable.id, serviceIds));
  const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalAmount = services.reduce((sum, s) => sum + parseFloat(s.price), 0);
  const homeCharge = isHomeService ? parseFloat(barber.homeServiceCharge ?? "0") : 0;
  const subtotal = totalAmount + homeCharge;
  
  let discountAmount = 0;
  if (couponCode) {
    const [offer] = await db.select().from(offersTable).where(eq(offersTable.code, couponCode)).limit(1);
    if (offer && offer.isActive) {
      if (offer.discountType === "percentage") {
        discountAmount = (subtotal * parseFloat(offer.discountValue)) / 100;
        if (offer.maxDiscount) discountAmount = Math.min(discountAmount, parseFloat(offer.maxDiscount));
      } else {
        discountAmount = parseFloat(offer.discountValue);
      }
      await db.update(offersTable).set({ currentUsage: (offer.currentUsage ?? 0) + 1 }).where(eq(offersTable.id, offer.id));
    }
  }
  
  const finalAmount = Math.max(0, subtotal - discountAmount);
  const endTime = addMinutesToTime(startTime, totalDuration);
  
  const [booking] = await db.insert(bookingsTable).values({
    userId, barberId, serviceIds, date, startTime, endTime, totalDuration,
    totalAmount: String(subtotal), discountAmount: String(discountAmount), finalAmount: String(finalAmount),
    isHomeService: isHomeService ?? false,
    address: isHomeService ? address : null,
    paymentMethod: paymentMethod ?? "cash",
    paymentStatus: paymentMethod === "online" ? "paid" : "pending",
    status: "confirmed", couponCode: couponCode ?? null, notes: notes ?? null,
  }).returning();
  
  await db.update(barbersTable).set({
    totalBookings: (barber.totalBookings ?? 0) + 1,
    updatedAt: new Date(),
  }).where(eq(barbersTable.id, barberId));
  
  const [barberUser] = await db.select().from(usersTable).where(eq(usersTable.id, barber.userId)).limit(1);
  const [bookingUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  return res.status(201).json(formatBooking(booking, barberUser, bookingUser, services));
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [b] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!b) return res.status(404).json({ message: "Booking not found" });
  const [barber] = await db.select().from(barbersTable).where(eq(barbersTable.id, b.barberId)).limit(1);
  const [barberUser] = barber ? await db.select().from(usersTable).where(eq(usersTable.id, barber.userId)).limit(1) : [null];
  const [bookingUser] = await db.select().from(usersTable).where(eq(usersTable.id, b.userId)).limit(1);
  const services = b.serviceIds.length > 0
    ? await db.select().from(servicesTable).where(inArray(servicesTable.id, b.serviceIds)) : [];
  return res.json(formatBooking(b, barberUser, bookingUser, services));
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const [b] = await db.update(bookingsTable).set({ status, updatedAt: new Date() })
    .where(eq(bookingsTable.id, id)).returning();
  if (!b) return res.status(404).json({ message: "Booking not found" });
  const [barber] = await db.select().from(barbersTable).where(eq(barbersTable.id, b.barberId)).limit(1);
  const [barberUser] = barber ? await db.select().from(usersTable).where(eq(usersTable.id, barber.userId)).limit(1) : [null];
  const [bookingUser] = await db.select().from(usersTable).where(eq(usersTable.id, b.userId)).limit(1);
  const services = b.serviceIds.length > 0
    ? await db.select().from(servicesTable).where(inArray(servicesTable.id, b.serviceIds)) : [];
  return res.json(formatBooking(b, barberUser, bookingUser, services));
});

router.post("/:id/cancel", async (req, res) => {
  const id = parseInt(req.params.id);
  const { reason } = req.body;
  const [b] = await db.update(bookingsTable).set({ status: "cancelled", cancelReason: reason ?? null, updatedAt: new Date() })
    .where(eq(bookingsTable.id, id)).returning();
  if (!b) return res.status(404).json({ message: "Booking not found" });
  const [barber] = await db.select().from(barbersTable).where(eq(barbersTable.id, b.barberId)).limit(1);
  const [barberUser] = barber ? await db.select().from(usersTable).where(eq(usersTable.id, barber.userId)).limit(1) : [null];
  const [bookingUser] = await db.select().from(usersTable).where(eq(usersTable.id, b.userId)).limit(1);
  const services = b.serviceIds.length > 0
    ? await db.select().from(servicesTable).where(inArray(servicesTable.id, b.serviceIds)) : [];
  return res.json(formatBooking(b, barberUser, bookingUser, services));
});

export default router;
