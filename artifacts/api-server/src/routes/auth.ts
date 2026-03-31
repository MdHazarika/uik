import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "barbrgo_salt").digest("hex");
}

router.post("/register", async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    return res.status(400).json({ message: "Email already registered" });
  }
  const hashed = hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    name, email, phone: phone ?? null, password: hashed, role: role as "customer" | "barber" | "admin",
    avatar: null, loyaltyPoints: 0, isVerified: false,
  }).returning();
  const { password: _p, ...safeUser } = user;
  (req as any).session = { userId: user.id, role: user.role };
  res.cookie("userId", user.id.toString(), { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
  res.cookie("userRole", user.role, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
  return res.status(201).json({ user: safeUser, message: "Registered successfully" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Missing email or password" });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const hashed = hashPassword(password);
  if (user.password !== hashed) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const { password: _p, ...safeUser } = user;
  res.cookie("userId", user.id.toString(), { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
  res.cookie("userRole", user.role, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
  return res.json({ user: safeUser, message: "Logged in successfully" });
});

router.post("/logout", async (_req, res) => {
  res.clearCookie("userId");
  res.clearCookie("userRole");
  return res.json({ message: "Logged out successfully" });
});

router.get("/me", async (req, res) => {
  const userId = parseInt(req.cookies?.userId ?? "0");
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const { password: _p, ...safeUser } = user;
  return res.json(safeUser);
});

export default router;
