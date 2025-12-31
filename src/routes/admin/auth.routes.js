import { Router } from "express";
import {
    getAdminMe,
    loginAdmin,
    logoutAdmin,
} from "../../controllers/admin/auth.controller.js";
import { requireAdminAuth } from "../../middleware/admin.middleware.js";

const router = Router();

router.post("/login", loginAdmin);
router.get("/me", requireAdminAuth, getAdminMe);
router.post("/logout", logoutAdmin);

export default router;
