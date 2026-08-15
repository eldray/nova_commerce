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
    const result = await fetch(`/_api/orders?tenantId=${tenantId}`, {
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