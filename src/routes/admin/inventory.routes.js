import { Router } from "express";

import {
    createInventoryItem,
    deleteInventoryItem,
    getInventoryItem,
    listInventory,
    listLowStockInventory,
    listOutOfStockInventory,
    updateInventoryItem,
} from "../../controllers/admin/inventory.controller.js";
import {
    requireAdminAuth,
    requireAdminRole,
} from "../../middleware/admin.middleware.js";

const router = Router();

const canReadInventory = requireAdminRole([
    "SUPERADMIN",
    "ADMIN",
    "INVENTORY_VIEWER",
]);

const canWriteInventory = requireAdminRole(["SUPERADMIN", "ADMIN"]);

router.get(
    "/alerts/low-stock",
    requireAdminAuth,
    canReadInventory,
    listLowStockInventory
);
router.get(
    "/alerts/out-of-stock",
    requireAdminAuth,
    canReadInventory,
    listOutOfStockInventory
);

router.get("/", requireAdminAuth, canReadInventory, listInventory);
router.get(
    "/:productId",
    requireAdminAuth,
    canReadInventory,
    getInventoryItem
);

router.post("/", requireAdminAuth, canWriteInventory, createInventoryItem);
router.patch(
    "/:productId",
    requireAdminAuth,
    canWriteInventory,
    updateInventoryItem
);
router.delete(
    "/:productId",
    requireAdminAuth,
    canWriteInventory,
    deleteInventoryItem
);

export default router;
