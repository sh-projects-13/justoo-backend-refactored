import { Router } from "express";

import {
    createRider,
    deleteRider,
    getRiderById,
    listRiders,
    updateRider,
} from "../../controllers/admin/rider.controller.js";
import {
    requireAdminAuth,
    requireAdminRole,
} from "../../middleware/admin.middleware.js";

const router = Router();

// Any logged-in admin can view riders
router.get("/", requireAdminAuth, listRiders);
router.get("/:riderId", requireAdminAuth, getRiderById);

// Only ADMIN/SUPERADMIN can mutate riders
router.post(
    "/",
    requireAdminAuth,
    requireAdminRole(["SUPERADMIN", "ADMIN"]),
    createRider
);
router.patch(
    "/:riderId",
    requireAdminAuth,
    requireAdminRole(["SUPERADMIN", "ADMIN"]),
    updateRider
);
router.delete(
    "/:riderId",
    requireAdminAuth,
    requireAdminRole(["SUPERADMIN", "ADMIN"]),
    deleteRider
);

export default router;
