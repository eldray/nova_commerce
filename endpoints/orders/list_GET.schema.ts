import superjson from "superjson";
import { OrderStatus, PaymentStatus } from "../../helpers/schema";

export type OrderListItem = {
    id: number;
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    total: string;
    currency: string;
    recipientName: string;
    itemCount: number;
    createdAt: Date;
};

export type OutputType = {
    orders: OrderListItem[];
};

export const getOrders = async (tenantId: number, init?: RequestInit): Promise<OutputType> => {
    const result = await fetch(`/_api/orders/list?tenantId=${tenantId}`, {
        method: "GET",
        ...init,
        credentials: "include",
    });
    if (!result.ok) {
        const errorObject = superjson.parse<{ error: string }>(await result.text());
        throw new Error(errorObject.error);
    }
    return superjson.parse<OutputType>(await result.text());
};

export const getOrderDetail = async (orderId: number, init?: RequestInit): Promise<{ order: any }> => {
    const result = await fetch(`/_api/orders/${orderId}`, {
        method: "GET",
        ...init,
        credentials: "include",
    });
    if (!result.ok) {
        const errorObject = superjson.parse<{ error: string }>(await result.text());
        throw new Error(errorObject.error);
    }
    return superjson.parse(await result.text());
};

export const updateOrderStatus = async (orderId: number, status: string, notes?: string, init?: RequestInit): Promise<{ order: any }> => {
    const result = await fetch(`/_api/orders/${orderId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, notes }),
        ...init,
        credentials: "include",
    });
    if (!result.ok) {
        const errorObject = superjson.parse<{ error: string }>(await result.text());
        throw new Error(errorObject.error);
    }
    return superjson.parse(await result.text());
};