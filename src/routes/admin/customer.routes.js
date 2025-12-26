import { Router } from "express";

import {
    deleteCustomer,
    getCustomerById,
    listCustomers,
    updateCustomer,
} from "../../controllers/admin/customer.controller.js";
import { requireAdminAuth } from "../../middleware/admin.middleware.js";

const router = Router();

// Any logged-in admin can manage customers (adjust if you want role-based restrictions)
router.get("/", requireAdminAuth, listCustomers);
router.get("/:customerId", requireAdminAuth, getCustomerById);
router.patch("/:customerId", requireAdminAuth, updateCustomer);
router.delete("/:customerId", requireAdminAuth, deleteCustomer);

export default router;
