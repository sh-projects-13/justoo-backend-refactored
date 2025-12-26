import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { phoneWhitelist } from "../../db/schema.js";
import { isPgUniqueViolation, toStringOrUndefined } from "../../utils/common.js";

export async function listWhitelistedPhones(req, res, next) {
    try {
        const rows = await db
            .select({
                phone: phoneWhitelist.phone,
                addedByAdminId: phoneWhitelist.addedByAdminId,
                createdAt: phoneWhitelist.createdAt,
            })
            .from(phoneWhitelist);

        return res.json({ phones: rows });
    } catch (err) {
        next(err);
    }
}

export async function addPhoneToWhitelist(req, res, next) {
    try {
        const phone = toStringOrUndefined(req.body?.phone);
        if (!phone) return res.status(400).json({ error: "PHONE_REQUIRED" });

        const addedByAdminId = req.admin?.id;

        await db.insert(phoneWhitelist).values({
            phone,
            addedByAdminId,
        });

        const created = await db
            .select({
                phone: phoneWhitelist.phone,
                addedByAdminId: phoneWhitelist.addedByAdminId,
                createdAt: phoneWhitelist.createdAt,
            })
            .from(phoneWhitelist)
            .where(eq(phoneWhitelist.phone, phone))
            .limit(1);

        return res.status(201).json({ phone: created[0] });
    } catch (err) {
        if (isPgUniqueViolation(err)) {
            return res.status(409).json({ error: "PHONE_ALREADY_WHITELISTED" });
        }
        next(err);
    }
}

export async function deletePhoneFromWhitelist(req, res, next) {
    try {
        const phone = toStringOrUndefined(req.params?.phone);
        if (!phone) return res.status(400).json({ error: "PHONE_REQUIRED" });

        const deleted = await db
            .delete(phoneWhitelist)
            .where(eq(phoneWhitelist.phone, phone))
            .returning({ phone: phoneWhitelist.phone });

        if (!deleted[0]) return res.status(404).json({ error: "PHONE_NOT_FOUND" });
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}
