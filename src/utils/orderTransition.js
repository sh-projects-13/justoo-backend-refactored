async function transitionOrderStatus(tx, {
    orderId,
    fromStatus,
    toStatus,
    actorType,
    actorId,
    reason,
}) {
    await tx
        .update(orders)
        .set({ status: toStatus })
        .where(
            and(
                eq(orders.id, orderId),
                eq(orders.status, fromStatus)
            )
        );

    await tx.insert(orderEvents).values({
        orderId,
        fromStatus,
        toStatus,
        actorType,
        actorId,
        reason,
    });
}

export default transitionOrderStatus;