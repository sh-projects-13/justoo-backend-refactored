import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { products } from "../../db/schema.js";
import { uploadImageBuffer } from "../../utils/cloudinary.js";
import { toBooleanOrUndefined, toStringOrUndefined } from "../../utils/common.js";

async function maybeUploadProductImage(req, productId) {
    const file = req.file;
    if (!file?.buffer) return undefined;

    const { url } = await uploadImageBuffer(file.buffer, {
        folder: "justoo/products",
        publicId: productId ? `product_${productId}` : undefined,
    });
    return url;
}

export async function createProduct(req, res, next) {
    try {
        const name = toStringOrUndefined(req.body?.name);
        const description = toStringOrUndefined(req.body?.description);
        const isActive = toBooleanOrUndefined(req.body?.isActive);

        if (!name) {
            return res.status(400).json({ error: "NAME_REQUIRED" });
        }

        const created = await db.transaction(async (tx) => {
            const insertedRows = await tx
                .insert(products)
                .values({
                    name,
                    description,
                    isActive: isActive ?? true,
                })
                .returning({
                    id: products.id,
                    name: products.name,
                    description: products.description,
                    imgUrl: products.imgUrl,
                    isActive: products.isActive,
                    createdAt: products.createdAt,
                });

            const product = insertedRows[0];
            if (!product) throw new Error("FAILED_TO_CREATE_PRODUCT");

            const imgUrl = await maybeUploadProductImage(req, product.id);
            if (imgUrl) {
                const updated = await tx
                    .update(products)
                    .set({ imgUrl })
                    .where(eq(products.id, product.id))
                    .returning({
                        id: products.id,
                        name: products.name,
                        description: products.description,
                        imgUrl: products.imgUrl,
                        isActive: products.isActive,
                        createdAt: products.createdAt,
                    });
                return updated[0];
            }

            return product;
        });

        return res.status(201).json({ product: created });
    } catch (err) {
        next(err);
    }
}

export async function listProducts(req, res, next) {
    try {
        const rows = await db
            .select({
                id: products.id,
                name: products.name,
                description: products.description,
                imgUrl: products.imgUrl,
                isActive: products.isActive,
                createdAt: products.createdAt,
            })
            .from(products);

        return res.json({ products: rows });
    } catch (err) {
        next(err);
    }
}

export async function getProductById(req, res, next) {
    try {
        const productId = toStringOrUndefined(req.params?.productId);
        if (!productId) return res.status(400).json({ error: "PRODUCT_ID_REQUIRED" });

        const rows = await db
            .select({
                id: products.id,
                name: products.name,
                description: products.description,
                imgUrl: products.imgUrl,
                isActive: products.isActive,
                createdAt: products.createdAt,
            })
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

        const product = rows[0];
        if (!product) return res.status(404).json({ error: "PRODUCT_NOT_FOUND" });

        return res.json({ product });
    } catch (err) {
        next(err);
    }
}

export async function updateProduct(req, res, next) {
    try {
        const productId = toStringOrUndefined(req.params?.productId);
        if (!productId) return res.status(400).json({ error: "PRODUCT_ID_REQUIRED" });

        const name = toStringOrUndefined(req.body?.name);
        const description = toStringOrUndefined(req.body?.description);
        const isActive = toBooleanOrUndefined(req.body?.isActive);

        const imgUrl = await maybeUploadProductImage(req, productId);

        if (!name && description === undefined && isActive === undefined && imgUrl === undefined) {
            return res.status(400).json({ error: "NOTHING_TO_UPDATE" });
        }

        const updateValues = {};
        if (name) updateValues.name = name;
        if (description !== undefined) updateValues.description = description;
        if (isActive !== undefined) updateValues.isActive = isActive;
        if (imgUrl !== undefined) updateValues.imgUrl = imgUrl;

        const updated = await db
            .update(products)
            .set(updateValues)
            .where(eq(products.id, productId))
            .returning({
                id: products.id,
                name: products.name,
                description: products.description,
                imgUrl: products.imgUrl,
                isActive: products.isActive,
                createdAt: products.createdAt,
            });

        if (!updated[0]) return res.status(404).json({ error: "PRODUCT_NOT_FOUND" });
        return res.json({ product: updated[0] });
    } catch (err) {
        next(err);
    }
}

export async function deleteProduct(req, res, next) {
    try {
        const productId = toStringOrUndefined(req.params?.productId);
        if (!productId) return res.status(400).json({ error: "PRODUCT_ID_REQUIRED" });

        const deleted = await db
            .delete(products)
            .where(eq(products.id, productId))
            .returning({ id: products.id });

        if (!deleted[0]) return res.status(404).json({ error: "PRODUCT_NOT_FOUND" });
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}
