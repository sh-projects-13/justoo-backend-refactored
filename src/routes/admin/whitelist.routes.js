import { Router } from "express";

import {
    addPhoneToWhitelist,
    deletePhoneFromWhitelist,
    listWhitelistedPhones,
} from "../../controllers/admin/whitelist.controller.js";
import {
    requireAdminAuth,
    requireAdminRole,
} from "../../middleware/admin.middleware.js";

const router = Router();

// Only ADMIN/SUPERADMIN can manage whitelist
router.get(
    "/",
    requireAdminAuth,
    requireAdminRole(["SUPERADMIN", "ADMIN"]),
    listWhitelistedPhones
);
router.post(
    "/",
    requireAdminAuth,
    requireAdminRole(["SUPERADMIN", "ADMIN"]),
    addPhoneToWhitelist
);
router.delete(
    "/:phone",
    requireAdminAuth,
    requireAdminRole(["SUPERADMIN", "ADMIN"]),
    deletePhoneFromWhitelist
);

export default router;
