import { Router } from "express";

import {
    createMyAddress,
    deleteMyAddress,
    getMyAddressById,
    listMyAddresses,
    updateMyAddress,
} from "../../controllers/customer/address.controller.js";
import { requireCustomerAuth } from "../../middleware/customer.middleware.js";

const router = Router();

router.get("/", requireCustomerAuth, listMyAddresses);
router.post("/", requireCustomerAuth, createMyAddress);
router.get("/:addressId", requireCustomerAuth, getMyAddressById);
router.patch("/:addressId", requireCustomerAuth, updateMyAddress);
router.delete("/:addressId", requireCustomerAuth, deleteMyAddress);

export default router;
