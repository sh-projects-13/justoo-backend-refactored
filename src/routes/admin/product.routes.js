import { Router } from "express";
import multer from "multer";

import {
    createProduct,
    deleteProduct,
    getProductById,
    listProducts,
    updateProduct,
} from "../../controllers/admin/product.controller.js";
import {
    requireAdminAuth,
    requireAdminRole,
} from "../../middleware/admin.middleware.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Any logged-in admin can view products
router.get("/", requireAdminAuth, listProducts);
router.get("/:productId", requireAdminAuth, getProductById);

// Only ADMIN/SUPERADMIN can mutate products
router.post(
    "/",
    requireAdminAuth,
    requireAdminRole(["SUPERADMIN", "ADMIN"]),
    upload.single("image"),
    createProduct
);

router.patch(
    "/:productId",
    requireAdminAuth,
    requireAdminRole(["SUPERADMIN", "ADMIN"]),
    upload.single("image"),
    updateProduct
);

router.delete(
    "/:productId",
    requireAdminAuth,
    requireAdminRole(["SUPERADMIN", "ADMIN"]),
    deleteProduct
);

export default router;
