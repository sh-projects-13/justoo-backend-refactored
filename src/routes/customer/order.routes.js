import { Router } from "express";

import {
    createOrder,
    listMyOrders,
} from "../../controllers/customer/order.controller.js";
import { requireCustomerAuth } from "../../middleware/customer.middleware.js";

const router = Router();

router.get("/", requireCustomerAuth, listMyOrders);
router.post("/", requireCustomerAuth, createOrder);

export default router;
