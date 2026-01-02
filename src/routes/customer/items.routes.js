import { Router } from "express";

import {
    listItems,
    searchItems,
} from "../../controllers/customer/items.controller.js";

const router = Router();

router.get("/", listItems);
router.get("/search", searchItems);

export default router;
