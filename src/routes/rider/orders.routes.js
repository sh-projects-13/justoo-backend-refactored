import { Router } from "express";

import {
    acceptOrder,
    listAvailableOrders,
    markDelivered,
    markOutForDelivery,
} from "../../controllers/rider/order.controller.js";
import { requireRiderAuth } from "../../middleware/rider.middleware.js";

const router = Router();

router.get("/available", requireRiderAuth, listAvailableOrders);
router.post("/:orderId/accept", requireRiderAuth, acceptOrder);
router.post("/:orderId/out-for-delivery", requireRiderAuth, markOutForDelivery);
router.post("/:orderId/delivered", requireRiderAuth, markDelivered);

export default router;
