import { Router } from "express";

import {
    getCurrentCustomerProfile,
    getCustomerAccountStatus,
    updateCurrentCustomerProfile,
} from "../../controllers/customer/profile.controller.js";
import { requireCustomerAuth } from "../../middleware/customer.middleware.js";

const router = Router();

router.get("/me", requireCustomerAuth, getCurrentCustomerProfile);
router.patch("/me", requireCustomerAuth, updateCurrentCustomerProfile);
router.get("/me/status", requireCustomerAuth, getCustomerAccountStatus);

export default router;
