import { Router } from "express";
import { db, serviceTypesTable, servicesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const types = await db.select().from(serviceTypesTable);
  return res.json(types);
});

router.post("/barbers/:barberId/services", async (req, res) => {
  const barberId = parseInt(req.params.barberId);
  const { serviceTypeId, name, price, durationMinutes, description } = req.body;
  const [service] = await db.insert(servicesTable).values({
    barberId, serviceTypeId: serviceTypeId ?? null, name, price: String(price),
    durationMinutes, description: description ?? null, isActive: true,
  }).returning();
  return res.status(201).json({ ...service, price: parseFloat(service.price) });
});

router.put("/barbers/:barberId/services/:serviceId", async (req, res) => {
  const barberId = parseInt(req.params.barberId);
  const serviceId = parseInt(req.params.serviceId);
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (req.body.price !== undefined) updates.price = String(req.body.price);
  if (req.body.durationMinutes !== undefined) updates.durationMinutes = req.body.durationMinutes;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
  const [service] = await db.update(servicesTable).set(updates)
    .where(and(eq(servicesTable.id, serviceId), eq(servicesTable.barberId, barberId))).returning();
  if (!service) return res.status(404).json({ message: "Service not found" });
  return res.json({ ...service, price: parseFloat(service.price) });
});

router.delete("/barbers/:barberId/services/:serviceId", async (req, res) => {
  const barberId = parseInt(req.params.barberId);
  const serviceId = parseInt(req.params.serviceId);
  await db.delete(servicesTable).where(and(eq(servicesTable.id, serviceId), eq(servicesTable.barberId, barberId)));
  return res.json({ message: "Service deleted" });
});

export default router;
