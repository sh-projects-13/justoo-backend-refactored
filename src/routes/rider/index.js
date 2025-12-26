import { Router } from "express";

import authRoutes from "./auth.routes.js";
import ordersRoutes from "./orders.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/orders", ordersRoutes);

export default router;
