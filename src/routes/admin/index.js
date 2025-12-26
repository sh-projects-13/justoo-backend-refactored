import { Router } from "express";
import authRouter from "./auth.routes.js";
import adminCrudRouter from "./admin.routes.js";
import productRouter from "./product.routes.js";
import inventoryRouter from "./inventory.routes.js";
import customerRouter from "./customer.routes.js";
import whitelistRouter from "./whitelist.routes.js";
import riderRouter from "./rider.routes.js";
import orderRouter from "./order.routes.js";
import { loadAdmin } from "../../middleware/admin.middleware.js";

const router = Router();

router.use(loadAdmin);
router.use("/auth", authRouter);
router.use("/admins", adminCrudRouter);
router.use("/products", productRouter);
router.use("/inventory", inventoryRouter);
router.use("/customers", customerRouter);
router.use("/whitelist", whitelistRouter);
router.use("/riders", riderRouter);
router.use("/orders", orderRouter);

export default router;
