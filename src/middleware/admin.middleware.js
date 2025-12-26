import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { admins, adminRoles } from "../db/schema.js";

async function fetchAdminById(adminId) {
    const adminRows = await db
        .select({
            id: admins.id,
            name: admins.name,
            email: admins.email,
            createdAt: admins.createdAt,
        })
        .from(admins)
        .where(eq(admins.id, adminId))
        .limit(1);

    const admin = adminRows[0];
    if (!admin) return null;

    const roleRows = await db
        .select({ role: adminRoles.role })
        .from(adminRoles)
        .where(eq(adminRoles.adminId, adminId));

    return {
        ...admin,
        roles: roleRows.map((r) => r.role),
    };
}

/**
 * Populates `req.admin` from the session (if present).
 * - If there is no session / not logged in: sets nothing and continues.
 * - If session is present but admin is missing: clears session and continues.
 */
export async function loadAdmin(req, res, next) {
    try {
        const adminId = req.session?.adminId;
        if (!adminId) return next();

        if (req.admin && req.admin.id === adminId) return next();

        const admin = await fetchAdminById(adminId);
        if (!admin) {
            req.session.adminId = undefined;
            return next();
        }

        req.admin = admin;
        return next();
    } catch (err) {
        next(err);
    }
}

/**
 * Requires an authenticated admin session.
 * Use after `loadAdmin` (or it will lazily load for you).
 */
export async function requireAdminAuth(req, res, next) {
    try {
        if (!req.session?.adminId) {
            return res.status(401).json({ error: "ADMIN_UNAUTHENTICATED" });
        }

        if (!req.admin || req.admin.id !== req.session.adminId) {
            const admin = await fetchAdminById(req.session.adminId);
            if (!admin) {
                req.session.adminId = undefined;
                return res.status(401).json({ error: "ADMIN_UNAUTHENTICATED" });
            }
            req.admin = admin;
        }

        return next();
    } catch (err) {
        next(err);
    }
}

export function requireAdminRole(allowedRoles) {
    const allowed = new Set(Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]);

    return (req, res, next) => {
        const roles = req.admin?.roles || [];
        const ok = roles.some((r) => allowed.has(r));
        if (!ok) return res.status(403).json({ error: "ADMIN_FORBIDDEN" });
        next();
    };
}
