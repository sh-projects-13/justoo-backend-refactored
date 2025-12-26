import { Router } from "express";

import {
    createAdmin,
    deleteAdmin,
    getAdminById,
    listAdmins,
    updateAdmin,
} from "../../controllers/admin/admin.controller.js";
import { requireAdminAuth, requireAdminRole } from "../../middleware/admin.middleware.js";

const router = Router();

router.use(requireAdminAuth, requireAdminRole("SUPERADMIN"));

router.post("/", createAdmin);
router.get("/", listAdmins);
router.get("/:adminId", getAdminById);
router.patch("/:adminId", updateAdmin);
router.delete("/:adminId", deleteAdmin);

export default router;
