import { Router } from "express";

import { getMe, login } from "../../controllers/rider/auth.controller.js";
import { requireRiderAuth } from "../../middleware/rider.middleware.js";

const router = Router();

router.post("/login", login);
router.get("/me", requireRiderAuth, getMe);

export default router;
