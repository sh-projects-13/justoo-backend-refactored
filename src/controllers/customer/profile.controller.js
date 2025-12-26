
import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { customers, phoneWhitelist } from "../../db/schema.js";
import {
    ensureCustomer,
    replyCustomerAuthError,
} from "../../middleware/customer.middleware.js";
import { toStringOrUndefined } from "../../utils/common.js";

export async function getCurrentCustomerProfile(req, res, next) {
    try {
        const result = await ensureCustomer(req);
        if (result.error) return replyCustomerAuthError(res, result.error);
        return res.json({ customer: result.customer });
    } catch (err) {
        next(err);
    }
}

export async function updateCurrentCustomerProfile(req, res, next) {
    try {
        const result = await ensureCustomer(req);
        if (result.error) return replyCustomerAuthError(res, result.error);

        if (req.body?.password !== undefined) {
            return res.status(400).json({ error: "PASSWORD_UPDATE_NOT_SUPPORTED_YET" });
        }

        const name = toStringOrUndefined(req.body?.name);
        const email = toStringOrUndefined(req.body?.email);

        if (!name && email === undefined) {
            return res.status(400).json({ error: "NOTHING_TO_UPDATE" });
        }

        const updateValues = {};
        if (name) updateValues.name = name;
        if (email !== undefined) updateValues.email = email;

        const updated = await db
            .update(customers)
            .set(updateValues)
            .where(eq(customers.id, result.customer.id))
            .returning({
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
                email: customers.email,
                createdAt: customers.createdAt,
            });

        if (!updated[0]) return res.status(404).json({ error: "CUSTOMER_NOT_FOUND" });
        return res.json({ customer: updated[0] });
    } catch (err) {
        next(err);
    }
}

export async function getCustomerAccountStatus(req, res, next) {
    try {
        const result = await ensureCustomer(req);
        if (result.error) return replyCustomerAuthError(res, result.error);

        const wlRows = await db
            .select({ phone: phoneWhitelist.phone })
            .from(phoneWhitelist)
            .where(eq(phoneWhitelist.phone, result.customer.phone))
            .limit(1);

        return res.json({
            status: "ACTIVE",
            isWhitelisted: Boolean(wlRows[0]?.phone),
            customer: {
                id: result.customer.id,
                createdAt: result.customer.createdAt,
            },
        });
    } catch (err) {
        next(err);
    }
}

