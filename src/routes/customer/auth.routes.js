import { Router } from "express";

import {
    logout,
    sendOtp,
    verifyOtp,
} from "../../controllers/customer/auth.controller.js";
import { requireCustomerAuth } from "../../middleware/customer.middleware.js";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/logout", requireCustomerAuth, logout);

export default router;
