import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import barbersRouter from "./barbers";
import shopsRouter from "./shops";
import servicesRouter from "./services";
import bookingsRouter from "./bookings";
import reviewsRouter from "./reviews";
import offersRouter from "./offers";
import adminRouter from "./admin";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/barbers", barbersRouter);
router.use("/shops", shopsRouter);
router.use("/services", servicesRouter);
router.use(servicesRouter);
router.use("/bookings", bookingsRouter);
router.use("/reviews", reviewsRouter);
router.use("/offers", offersRouter);
router.use("/admin", adminRouter);
router.use("/dashboard", dashboardRouter);

export default router;
