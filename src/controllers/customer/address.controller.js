
import { and, eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { addresses } from "../../db/schema.js";
import {
    ensureCustomer,
    replyCustomerAuthError,
} from "../../middleware/customer.middleware.js";
import { toStringOrUndefined } from "../../utils/common.js";

export async function listMyAddresses(req, res, next) {
    try {
        const result = await ensureCustomer(req);
        if (result.error) return replyCustomerAuthError(res, result.error);

        const rows = await db
            .select({
                id: addresses.id,
                label: addresses.label,
                line1: addresses.line1,
                line2: addresses.line2,
                createdAt: addresses.createdAt,
            })
            .from(addresses)
            .where(eq(addresses.customerId, result.customer.id));

        return res.json({ addresses: rows });
    } catch (err) {
        next(err);
    }
}

export async function createMyAddress(req, res, next) {
    try {
        const result = await ensureCustomer(req);
        if (result.error) return replyCustomerAuthError(res, result.error);

        const label = toStringOrUndefined(req.body?.label);
        const line1 = toStringOrUndefined(req.body?.line1);
        const line2 = toStringOrUndefined(req.body?.line2);

        if (!line1) return res.status(400).json({ error: "LINE1_REQUIRED" });

        const inserted = await db
            .insert(addresses)
            .values({
                customerId: result.customer.id,
                label,
                line1,
                line2,
            })
            .returning({
                id: addresses.id,
                label: addresses.label,
                line1: addresses.line1,
                line2: addresses.line2,
                createdAt: addresses.createdAt,
            });

        return res.status(201).json({ address: inserted[0] });
    } catch (err) {
        next(err);
    }
}

export async function getMyAddressById(req, res, next) {
    try {
        const result = await ensureCustomer(req);
        if (result.error) return replyCustomerAuthError(res, result.error);

        const addressId = toStringOrUndefined(req.params?.addressId);
        if (!addressId) return res.status(400).json({ error: "ADDRESS_ID_REQUIRED" });

        const rows = await db
            .select({
                id: addresses.id,
                label: addresses.label,
                line1: addresses.line1,
                line2: addresses.line2,
                createdAt: addresses.createdAt,
            })
            .from(addresses)
            .where(and(eq(addresses.id, addressId), eq(addresses.customerId, result.customer.id)))
            .limit(1);

        const address = rows[0];
        if (!address) return res.status(404).json({ error: "ADDRESS_NOT_FOUND" });

        return res.json({ address });
    } catch (err) {
        next(err);
    }
}

export async function updateMyAddress(req, res, next) {
    try {
        const result = await ensureCustomer(req);
        if (result.error) return replyCustomerAuthError(res, result.error);

        const addressId = toStringOrUndefined(req.params?.addressId);
        if (!addressId) return res.status(400).json({ error: "ADDRESS_ID_REQUIRED" });

        const label = toStringOrUndefined(req.body?.label);
        const line1 = toStringOrUndefined(req.body?.line1);
        const line2 = toStringOrUndefined(req.body?.line2);

        if (!label && !line1 && line2 === undefined) {
            return res.status(400).json({ error: "NOTHING_TO_UPDATE" });
        }

        const updateValues = {};
        if (label) updateValues.label = label;
        if (line1) updateValues.line1 = line1;
        if (line2 !== undefined) updateValues.line2 = line2;

        const updated = await db
            .update(addresses)
            .set(updateValues)
            .where(and(eq(addresses.id, addressId), eq(addresses.customerId, result.customer.id)))
            .returning({
                id: addresses.id,
                label: addresses.label,
                line1: addresses.line1,
                line2: addresses.line2,
                createdAt: addresses.createdAt,
            });

        if (!updated[0]) return res.status(404).json({ error: "ADDRESS_NOT_FOUND" });
        return res.json({ address: updated[0] });
    } catch (err) {
        next(err);
    }
}

export async function deleteMyAddress(req, res, next) {
    try {
        const result = await ensureCustomer(req);
        if (result.error) return replyCustomerAuthError(res, result.error);

        const addressId = toStringOrUndefined(req.params?.addressId);
        if (!addressId) return res.status(400).json({ error: "ADDRESS_ID_REQUIRED" });

        const deleted = await db
            .delete(addresses)
            .where(and(eq(addresses.id, addressId), eq(addresses.customerId, result.customer.id)))
            .returning({ id: addresses.id });

        if (!deleted[0]) return res.status(404).json({ error: "ADDRESS_NOT_FOUND" });
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

