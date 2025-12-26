import { eq, lt } from "drizzle-orm";

import { db } from "../../db/index.js";
import { inventory, products } from "../../db/schema.js";
import {
    isPgUniqueViolation,
    toIntOrUndefined,
    toNumericStringOrUndefined,
    toStringOrUndefined,
} from "../../utils/common.js";

async function fetchInventoryRow(productId) {
    const rows = await db
        .select({
            productId: inventory.productId,
            costPrice: inventory.costPrice,
            sellingPrice: inventory.sellingPrice,
            discountPercent: inventory.discountPercent,
            quantity: inventory.quantity,
            minQuantity: inventory.minQuantity,
            updatedAt: inventory.updatedAt,

            productName: products.name,
            productDescription: products.description,
            productImgUrl: products.imgUrl,
            productIsActive: products.isActive,
            productCreatedAt: products.createdAt,
        })
        .from(inventory)
        .innerJoin(products, eq(products.id, inventory.productId))
        .where(eq(inventory.productId, productId))
        .limit(1);

    return rows[0] || null;
}

export async function createInventoryItem(req, res, next) {
    try {
        const productId = toStringOrUndefined(req.body?.productId);
        const costPrice = toNumericStringOrUndefined(req.body?.costPrice);
        const sellingPrice = toNumericStringOrUndefined(req.body?.sellingPrice);
        const discountPercent =
            toNumericStringOrUndefined(req.body?.discountPercent) ?? "0";
        const quantity = toIntOrUndefined(req.body?.quantity);
        const minQuantity = toIntOrUndefined(req.body?.minQuantity) ?? 0;

        if (!productId || !costPrice || !sellingPrice || quantity === undefined) {
            return res
                .status(400)
                .json({ error: "PRODUCT_ID_COST_SELLING_QUANTITY_REQUIRED" });
        }

        const productExists = await db
            .select({ id: products.id })
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

        if (!productExists[0]) {
            return res.status(404).json({ error: "PRODUCT_NOT_FOUND" });
        }

        await db.insert(inventory).values({
            productId,
            costPrice,
            sellingPrice,
            discountPercent,
            quantity,
            minQuantity,
        });

        const row = await fetchInventoryRow(productId);
        return res.status(201).json({ inventory: row });
    } catch (err) {
        if (isPgUniqueViolation(err)) {
            return res.status(409).json({ error: "INVENTORY_ALREADY_EXISTS" });
        }
        next(err);
    }
}

export async function listInventory(req, res, next) {
    try {
        const rows = await db
            .select({
                productId: inventory.productId,
                costPrice: inventory.costPrice,
                sellingPrice: inventory.sellingPrice,
                discountPercent: inventory.discountPercent,
                quantity: inventory.quantity,
                minQuantity: inventory.minQuantity,
                updatedAt: inventory.updatedAt,

                productName: products.name,
                productDescription: products.description,
                productImgUrl: products.imgUrl,
                productIsActive: products.isActive,
                productCreatedAt: products.createdAt,
            })
            .from(inventory)
            .innerJoin(products, eq(products.id, inventory.productId));

        return res.json({ inventory: rows });
    } catch (err) {
        next(err);
    }
}

export async function listLowStockInventory(req, res, next) {
    try {
        const rows = await db
            .select({
                productId: inventory.productId,
                costPrice: inventory.costPrice,
                sellingPrice: inventory.sellingPrice,
                discountPercent: inventory.discountPercent,
                quantity: inventory.quantity,
                minQuantity: inventory.minQuantity,
                updatedAt: inventory.updatedAt,

                productName: products.name,
                productDescription: products.description,
                productImgUrl: products.imgUrl,
                productIsActive: products.isActive,
                productCreatedAt: products.createdAt,
            })
            .from(inventory)
            .innerJoin(products, eq(products.id, inventory.productId))
            .where(lt(inventory.quantity, inventory.minQuantity));

        return res.json({ inventory: rows });
    } catch (err) {
        next(err);
    }
}

export async function listOutOfStockInventory(req, res, next) {
    try {
        const rows = await db
            .select({
                productId: inventory.productId,
                costPrice: inventory.costPrice,
                sellingPrice: inventory.sellingPrice,
                discountPercent: inventory.discountPercent,
                quantity: inventory.quantity,
                minQuantity: inventory.minQuantity,
                updatedAt: inventory.updatedAt,

                productName: products.name,
                productDescription: products.description,
                productImgUrl: products.imgUrl,
                productIsActive: products.isActive,
                productCreatedAt: products.createdAt,
            })
            .from(inventory)
            .innerJoin(products, eq(products.id, inventory.productId))
            .where(eq(inventory.quantity, 0));

        return res.json({ inventory: rows });
    } catch (err) {
        next(err);
    }
}

export async function getInventoryItem(req, res, next) {
    try {
        const productId = toStringOrUndefined(req.params?.productId);
        if (!productId) return res.status(400).json({ error: "PRODUCT_ID_REQUIRED" });

        const row = await fetchInventoryRow(productId);
        if (!row) return res.status(404).json({ error: "INVENTORY_NOT_FOUND" });

        return res.json({ inventory: row });
    } catch (err) {
        next(err);
    }
}

export async function updateInventoryItem(req, res, next) {
    try {
        const productId = toStringOrUndefined(req.params?.productId);
        if (!productId) return res.status(400).json({ error: "PRODUCT_ID_REQUIRED" });

        const costPrice = toNumericStringOrUndefined(req.body?.costPrice);
        const sellingPrice = toNumericStringOrUndefined(req.body?.sellingPrice);
        const discountPercent = toNumericStringOrUndefined(req.body?.discountPercent);
        const quantity = toIntOrUndefined(req.body?.quantity);
        const minQuantity = toIntOrUndefined(req.body?.minQuantity);

        if (
            costPrice === undefined &&
            sellingPrice === undefined &&
            discountPercent === undefined &&
            quantity === undefined &&
            minQuantity === undefined
        ) {
            return res.status(400).json({ error: "NOTHING_TO_UPDATE" });
        }

        const updateValues = {};
        if (costPrice !== undefined) updateValues.costPrice = costPrice;
        if (sellingPrice !== undefined) updateValues.sellingPrice = sellingPrice;
        if (discountPercent !== undefined)
            updateValues.discountPercent = discountPercent;
        if (quantity !== undefined) updateValues.quantity = quantity;
        if (minQuantity !== undefined) updateValues.minQuantity = minQuantity;
        updateValues.updatedAt = new Date();

        const updated = await db
            .update(inventory)
            .set(updateValues)
            .where(eq(inventory.productId, productId))
            .returning({ productId: inventory.productId });

        if (!updated[0]) return res.status(404).json({ error: "INVENTORY_NOT_FOUND" });

        const row = await fetchInventoryRow(productId);
        return res.json({ inventory: row });
    } catch (err) {
        next(err);
    }
}

export async function deleteInventoryItem(req, res, next) {
    try {
        const productId = toStringOrUndefined(req.params?.productId);
        if (!productId) return res.status(400).json({ error: "PRODUCT_ID_REQUIRED" });

        const deleted = await db
            .delete(inventory)
            .where(eq(inventory.productId, productId))
            .returning({ productId: inventory.productId });

        if (!deleted[0]) return res.status(404).json({ error: "INVENTORY_NOT_FOUND" });
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

