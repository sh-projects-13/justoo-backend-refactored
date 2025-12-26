import { Router } from "express";

import {
    cancelOrder,
    getOrderById,
    listOrders,
} from "../../controllers/admin/order.controller.js";
import { getOrderEvents } from "../../controllers/admin/order-events.controller.js";
import { requireAdminAuth, requireAdminRole } from "../../middleware/admin.middleware.js";

const router = Router();

// All admin roles can view/cancel orders
const canManageOrders = requireAdminRole(["SUPERADMIN", "ADMIN", "INVENTORY_VIEWER"]);

router.get("/", requireAdminAuth, canManageOrders, listOrders);
router.get("/:orderId", requireAdminAuth, canManageOrders, getOrderById);
router.get("/:orderId/events", requireAdminAuth, canManageOrders, getOrderEvents);
router.post("/:orderId/cancel", requireAdminAuth, canManageOrders, cancelOrder);

export default router;
