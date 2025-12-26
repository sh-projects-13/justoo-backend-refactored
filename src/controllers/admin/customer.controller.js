import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { customers } from "../../db/schema.js";
import { isPgUniqueViolation, toStringOrUndefined } from "../../utils/common.js";

export async function listCustomers(req, res, next) {
    try {
        const rows = await db
            .select({
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
                email: customers.email,
                createdAt: customers.createdAt,
            })
            .from(customers);

        return res.json({ customers: rows });
    } catch (err) {
        next(err);
    }
}

export async function getCustomerById(req, res, next) {
    try {
        const customerId = toStringOrUndefined(req.params?.customerId);
        if (!customerId) return res.status(400).json({ error: "CUSTOMER_ID_REQUIRED" });

        const rows = await db
            .select({
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
                email: customers.email,
                createdAt: customers.createdAt,
            })
            .from(customers)
            .where(eq(customers.id, customerId))
            .limit(1);

        const customer = rows[0];
        if (!customer) return res.status(404).json({ error: "CUSTOMER_NOT_FOUND" });

        return res.json({ customer });
    } catch (err) {
        next(err);
    }
}

export async function updateCustomer(req, res, next) {
    try {
        const customerId = toStringOrUndefined(req.params?.customerId);
        if (!customerId) return res.status(400).json({ error: "CUSTOMER_ID_REQUIRED" });

        const name = toStringOrUndefined(req.body?.name);
        const phone = toStringOrUndefined(req.body?.phone);
        const email = toStringOrUndefined(req.body?.email);

        if (!name && !phone && email === undefined) {
            return res.status(400).json({ error: "NOTHING_TO_UPDATE" });
        }

        const updateValues = {};
        if (name) updateValues.name = name;
        if (phone) updateValues.phone = phone;
        if (email !== undefined) updateValues.email = email;

        const updated = await db
            .update(customers)
            .set(updateValues)
            .where(eq(customers.id, customerId))
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
        if (isPgUniqueViolation(err)) {
            return res.status(409).json({ error: "CUSTOMER_ALREADY_EXISTS" });
        }
        next(err);
    }
}

export async function deleteCustomer(req, res, next) {
    try {
        const customerId = toStringOrUndefined(req.params?.customerId);
        if (!customerId) return res.status(400).json({ error: "CUSTOMER_ID_REQUIRED" });

        const deleted = await db
            .delete(customers)
            .where(eq(customers.id, customerId))
            .returning({ id: customers.id });

        if (!deleted[0]) return res.status(404).json({ error: "CUSTOMER_NOT_FOUND" });
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}

