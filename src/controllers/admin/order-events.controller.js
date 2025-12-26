import { desc, eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { orderEvents } from "../../db/schema.js";
import { toStringOrUndefined } from "../../utils/common.js";

export async function getOrderEvents(req, res, next) {
    try {
        const orderId = toStringOrUndefined(req.params?.orderId);
        if (!orderId) return res.status(400).json({ error: "ORDER_ID_REQUIRED" });

        const events = await db
            .select({
                id: orderEvents.id,
                fromStatus: orderEvents.fromStatus,
                toStatus: orderEvents.toStatus,
                actorType: orderEvents.actorType,
                actorId: orderEvents.actorId,
                reason: orderEvents.reason,
                createdAt: orderEvents.createdAt,
            })
            .from(orderEvents)
            .where(eq(orderEvents.orderId, orderId))
            .orderBy(desc(orderEvents.createdAt));

        return res.json({ events });
    } catch (err) {
        next(err);
    }
}
