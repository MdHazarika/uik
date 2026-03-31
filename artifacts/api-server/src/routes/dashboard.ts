import { Router } from "express";
import { db, barbersTable, usersTable, bookingsTable, offersTable, shopsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/summary", async (_req, res) => {
  const today = new Date().toISOString().split("T")[0];
  
  const topBarbers = await db.select().from(barbersTable)
    .orderBy(desc(barbersTable.rating)).limit(6);
  
  const featuredBarbers = await Promise.all(topBarbers.map(async (b) => {
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
  
  const now = new Date();
  const offers = await db.select().from(offersTable).where(eq(offersTable.isActive, true));
  const activeOffers = offers.filter(o => !o.validUntil || new Date(o.validUntil) > now).slice(0, 3);
  
  const todayBookings = await db.select().from(bookingsTable).where(eq(bookingsTable.date, today));
  const [totalBarbers] = await db.select({ count: sql<number>`count(*)` }).from(barbersTable);
  const allRatings = await db.select({ rating: barbersTable.rating }).from(barbersTable);
  const avgRating = allRatings.length > 0
    ? allRatings.reduce((sum, b) => sum + parseFloat(b.rating ?? "0"), 0) / allRatings.length : 4.5;
  
  return res.json({
    featuredBarbers,
    recentBookings: [],
    activeOffers: activeOffers.map(o => ({
      ...o,
      discountValue: parseFloat(o.discountValue),
      minBookingAmount: parseFloat(o.minBookingAmount ?? "0"),
      maxDiscount: o.maxDiscount ? parseFloat(o.maxDiscount) : null,
    })),
    topCities: [
      { name: "Mumbai", totalBarbers: 45, areas: ["Andheri", "Bandra", "Dadar", "Juhu"] },
      { name: "Delhi", totalBarbers: 38, areas: ["Connaught Place", "Lajpat Nagar", "Rohini"] },
      { name: "Bangalore", totalBarbers: 52, areas: ["Indiranagar", "Koramangala", "HSR Layout"] },
      { name: "Hyderabad", totalBarbers: 29, areas: ["Banjara Hills", "Kondapur", "Madhapur"] },
      { name: "Chennai", totalBarbers: 23, areas: ["T. Nagar", "Anna Nagar", "Velachery"] },
      { name: "Pune", totalBarbers: 31, areas: ["Koregaon Park", "Aundh", "Kothrud"] },
    ],
    stats: {
      totalBarbers: Number(totalBarbers?.count ?? 0),
      totalBookingsToday: todayBookings.length,
      averageRating: parseFloat(avgRating.toFixed(1)),
    },
  });
});

router.get("/cities", async (_req, res) => {
  return res.json([
    { name: "Mumbai", totalBarbers: 45, areas: ["Andheri", "Bandra", "Dadar", "Juhu", "Powai", "Thane"] },
    { name: "Delhi", totalBarbers: 38, areas: ["Connaught Place", "Lajpat Nagar", "Rohini", "Dwarka", "South Ex"] },
    { name: "Bangalore", totalBarbers: 52, areas: ["Indiranagar", "Koramangala", "HSR Layout", "Whitefield", "JP Nagar"] },
    { name: "Hyderabad", totalBarbers: 29, areas: ["Banjara Hills", "Kondapur", "Madhapur", "Gachibowli", "Hitech City"] },
    { name: "Chennai", totalBarbers: 23, areas: ["T. Nagar", "Anna Nagar", "Velachery", "Adyar", "Mylapore"] },
    { name: "Pune", totalBarbers: 31, areas: ["Koregaon Park", "Aundh", "Kothrud", "Viman Nagar", "Baner"] },
    { name: "Kolkata", totalBarbers: 18, areas: ["Park Street", "Salt Lake", "New Town", "Ballygunge"] },
    { name: "Ahmedabad", totalBarbers: 22, areas: ["Navrangpura", "Bopal", "Satellite", "Bodakdev"] },
  ]);
});

export default router;
